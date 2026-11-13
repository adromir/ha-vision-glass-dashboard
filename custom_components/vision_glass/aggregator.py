"""Server-side dashboard state aggregation and Recorder history downsampling."""

from __future__ import annotations

from datetime import timedelta
import logging
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

_LOGGER = logging.getLogger(__name__)

_HELPER_DOMAINS = (
    "input_number",
    "input_boolean",
    "input_select",
    "input_datetime",
    "input_text",
    "input_button",
    "timer",
    "counter",
    "schedule",
)


def compute_summary(hass: HomeAssistant, config: dict[str, Any]) -> dict[str, Any]:
    """Compute apartment-wide overview metrics, battery status, and helper registry summary."""
    states = {st.entity_id: st for st in hass.states.async_all()}
    rooms = config.get("rooms") or []
    all_lights_entity = config.get("all_lights_entity") or "light.licht_wohnung"

    room_light_ids: list[str] = []
    room_climate_ids: list[str] = []
    for room in rooms:
        if not isinstance(room, dict):
            continue
        if room.get("id") == "wohnung":
            continue
        l_ent = room.get("light_entity")
        if l_ent and l_ent != all_lights_entity:
            room_light_ids.append(l_ent)
        c_ent = room.get("climate_entity")
        if c_ent:
            room_climate_ids.append(c_ent)

    # Deduplicate while keeping order
    room_light_ids = list(dict.fromkeys(room_light_ids))
    room_climate_ids = list(dict.fromkeys(room_climate_ids))

    lights_on = sum(
        1 for e_id in room_light_ids if states.get(e_id) and states[e_id].state == "on"
    )

    heating_active = 0
    temps: list[float] = []
    for c_id in room_climate_ids:
        st = states.get(c_id)
        if not st:
            continue
        hvac_action = st.attributes.get("hvac_action")
        if hvac_action == "heating" or (hvac_action is None and st.state == "heat"):
            heating_active += 1
        cur_temp = st.attributes.get("current_temperature")
        if cur_temp is not None:
            try:
                temps.append(float(cur_temp))
            except (TypeError, ValueError):
                pass

    avg_temp = round(sum(temps) / len(temps), 1) if temps else None

    batteries_critical: list[dict[str, Any]] = []
    batteries_low: list[dict[str, Any]] = []
    batteries_good: list[dict[str, Any]] = []

    for e_id, st in states.items():
        if not e_id.startswith("sensor."):
            continue
        attrs = st.attributes
        is_batt = attrs.get("device_class") == "battery" or "battery" in e_id or "batterie" in e_id
        if not is_batt:
            continue
        if attrs.get("unit_of_measurement") not in (None, "%"):
            continue
        try:
            level = float(st.state)
        except (TypeError, ValueError):
            continue
        if level < 0 or level > 100:
            continue

        item = {
            "entity_id": e_id,
            "name": attrs.get("friendly_name") or e_id,
            "level": round(level),
        }
        if level < 20:
            batteries_critical.append(item)
        elif level <= 40:
            batteries_low.append(item)
        else:
            batteries_good.append(item)

    batteries_critical.sort(key=lambda x: x["level"])
    batteries_low.sort(key=lambda x: x["level"])
    batteries_good.sort(key=lambda x: x["level"])

    helpers: list[dict[str, Any]] = []
    for e_id, st in sorted(states.items()):
        dom = e_id.split(".", 1)[0]
        if dom in _HELPER_DOMAINS:
            helpers.append(
                {
                    "entity_id": e_id,
                    "domain": dom,
                    "name": st.attributes.get("friendly_name") or e_id,
                    "state": st.state,
                }
            )

    lock_ent = config.get("lock_entity") or next((e for e in states if e.startswith("lock.")), None)
    alarm_ent = next((e for e in states if e.startswith("alarm_control_panel.")), None)

    return {
        "lights": {
            "on_count": lights_on,
            "total": len(room_light_ids),
            "has_any": any(e.startswith("light.") for e in states),
        },
        "climate": {
            "heating_count": heating_active,
            "avg_temp": avg_temp,
            "total": len(room_climate_ids),
            "has_any": any(e.startswith("climate.") for e in states),
        },
        "batteries": {
            "critical_count": len(batteries_critical),
            "low_count": len(batteries_low),
            "good_count": len(batteries_good),
            "total": len(batteries_critical) + len(batteries_low) + len(batteries_good),
            "critical": batteries_critical,
            "low": batteries_low,
            "good": batteries_good,
        },
        "dock_visibility": {
            "has_lights": any(e.startswith("light.") for e in states),
            "has_climate": any(e.startswith("climate.") for e in states),
            "has_switches": any(e.startswith("switch.") for e in states),
            "has_batteries": (len(batteries_critical) + len(batteries_low) + len(batteries_good)) > 0,
            "has_alarmo": alarm_ent is not None,
        },
        "lock_entity": lock_ent,
        "alarm_entity": alarm_ent,
        "helpers_count": len(helpers),
        "helpers": helpers,
    }


def _downsample_numeric_points(
    points: list[tuple[int, float]],
    max_points: int,
) -> list[list[float]]:
    """Bucket-average numeric (timestamp_ms, value) points down to at most max_points."""
    if not points:
        return []
    if len(points) <= max_points:
        return [[ts, round(val, 2)] for ts, val in points]

    step = len(points) / max_points
    out: list[list[float]] = []
    idx = 0.0
    while int(idx) < len(points) and len(out) < max_points - 1:
        start_i = int(idx)
        end_i = min(len(points), int(idx + step))
        chunk = points[start_i:max(start_i + 1, end_i)]
        avg_ts = int(sum(p[0] for p in chunk) / len(chunk))
        avg_val = sum(p[1] for p in chunk) / len(chunk)
        out.append([avg_ts, round(avg_val, 2)])
        idx += step

    last_ts, last_val = points[-1]
    out.append([last_ts, round(last_val, 2)])
    return out


async def async_get_history(
    hass: HomeAssistant,
    entity_ids: list[str],
    hours: int = 24,
    max_points: int = 120,
) -> dict[str, Any]:
    """Fetch Recorder state history and downsample numeric/binary series for compact frontend charts."""
    clean_ids = [str(e).strip() for e in entity_ids if isinstance(e, str) and "." in e][:50]
    hours = max(1, min(int(hours), 168))
    max_points = max(24, min(int(max_points), 300))

    if not clean_ids:
        return {"start_ms": 0, "end_ms": 0, "series": {}}

    end_time = dt_util.utcnow()
    start_time = end_time - timedelta(hours=hours)
    start_ms = int(start_time.timestamp() * 1000)
    end_ms = int(end_time.timestamp() * 1000)

    try:
        from homeassistant.components.recorder import get_instance
        from homeassistant.components.recorder.history import get_significant_states
    except ImportError:
        return {"start_ms": start_ms, "end_ms": end_ms, "series": {}}

    needs_attrs = any(e.startswith("climate.") for e in clean_ids)
    rec = get_instance(hass)
    if rec is None:
        return {"start_ms": start_ms, "end_ms": end_ms, "series": {}}

    def _query() -> dict[str, list[Any]]:
        return get_significant_states(
            hass,
            start_time,
            end_time,
            entity_ids=clean_ids,
            significant_changes_only=False,
            minimal_response=not needs_attrs,
            no_attributes=not needs_attrs,
            include_start_time_state=True,
        )

    raw_map = await rec.async_add_executor_job(_query)

    series_out: dict[str, Any] = {}
    for e_id in clean_ids:
        states = raw_map.get(e_id, [])
        numeric_pts: list[tuple[int, float]] = []
        active_intervals: list[list[Any]] = []
        active_start: int | None = None
        active_label: str | None = None

        if not states:
            cur_st = hass.states.get(e_id)
            if cur_st:
                if e_id.startswith("climate."):
                    c_attrs = getattr(cur_st, "attributes", None) or {}
                    try:
                        if c_attrs.get("current_temperature") is not None:
                            c_temp = float(c_attrs["current_temperature"])
                            numeric_pts.append((start_ms, c_temp))
                            numeric_pts.append((end_ms, c_temp))
                    except (TypeError, ValueError):
                        pass
                    hvac_act = c_attrs.get("hvac_action")
                    if hvac_act == "heating" or (hvac_act is None and cur_st.state == "heat"):
                        active_intervals.append([start_ms, end_ms, "heating"])
                else:
                    try:
                        cur_num = float(cur_st.state)
                        numeric_pts.append((start_ms, cur_num))
                        numeric_pts.append((end_ms, cur_num))
                    except (TypeError, ValueError):
                        pass

        for st in states:
            ts_ms = int(getattr(st, "last_updated", st.last_changed).timestamp() * 1000)
            state_str = str(st.state)

            # Extract numeric series when possible (or current_temperature on climate)
            num_val: float | None = None
            if e_id.startswith("climate."):
                attrs = getattr(st, "attributes", None) or {}
                hvac_act = attrs.get("hvac_action")
                call_heat = attrs.get("call_for_heat")
                valv_pos = attrs.get("valve_position") or attrs.get("position")
                heat_pwr = attrs.get("heating_power")
                is_heating = (
                    hvac_act == "heating"
                    or call_heat is True
                    or (isinstance(valv_pos, (int, float)) and valv_pos > 0)
                    or (isinstance(heat_pwr, (int, float)) and heat_pwr > 0.05)
                    or (hvac_act is None and state_str == "heat")
                )
                if is_heating and active_start is None:
                    active_start = ts_ms
                    active_label = "heating"
                elif not is_heating and active_start is not None:
                    active_intervals.append([active_start, ts_ms, active_label])
                    active_start = None
                    active_label = None
                try:
                    if attrs.get("current_temperature") is not None:
                        num_val = float(attrs["current_temperature"])
                except (TypeError, ValueError):
                    num_val = None
            elif e_id.startswith(("binary_sensor.", "light.", "switch.")):
                is_on = state_str in ("on", "open", "true")
                if is_on and active_start is None:
                    active_start = ts_ms
                    active_label = state_str
                elif not is_on and active_start is not None:
                    active_intervals.append([active_start, ts_ms, active_label])
                    active_start = None
                    active_label = None
            else:
                try:
                    num_val = float(state_str)
                except (TypeError, ValueError):
                    num_val = None

            if num_val is not None:
                numeric_pts.append((ts_ms, num_val))

        if active_start is not None:
            active_intervals.append([active_start, end_ms, active_label])

        downsampled = _downsample_numeric_points(numeric_pts, max_points)
        vals = [p[1] for p in downsampled]
        series_out[e_id] = {
            "points": downsampled,
            "intervals": active_intervals,
            "min": min(vals) if vals else None,
            "max": max(vals) if vals else None,
            "current": vals[-1] if vals else None,
        }

    return {
        "start_ms": start_ms,
        "end_ms": end_ms,
        "series": series_out,
    }

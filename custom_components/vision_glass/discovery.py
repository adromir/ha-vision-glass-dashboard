"""Area and entity discovery helpers using Home Assistant registries."""

from __future__ import annotations

import copy
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er

from .const import DEFAULT_CONFIG


def _first_matching(
    entity_ids: list[str],
    states_map: dict[str, Any],
    domain: str,
    device_classes: tuple[str, ...] = (),
    keywords: tuple[str, ...] = (),
) -> str | None:
    """Return first entity matching domain and optional device_class or ID keyword."""
    prefix = f"{domain}."
    candidates = [e_id for e_id in entity_ids if e_id.startswith(prefix)]
    if not candidates:
        return None

    if not device_classes and not keywords:
        return candidates[0]

    for e_id in candidates:
        state_obj = states_map.get(e_id)
        attrs = getattr(state_obj, "attributes", {}) if state_obj else {}
        dc = str(attrs.get("device_class") or "").lower()
        if dc and dc in device_classes:
            return e_id

    for e_id in candidates:
        lower = e_id.lower()
        if any(kw in lower for kw in keywords):
            return e_id

    return None


def _all_matching(
    entity_ids: list[str],
    states_map: dict[str, Any],
    domain: str,
    device_classes: tuple[str, ...] = (),
    keywords: tuple[str, ...] = (),
) -> list[str]:
    """Return all entities matching domain and optional device_class or ID keyword."""
    prefix = f"{domain}."
    results: list[str] = []
    for e_id in entity_ids:
        if not e_id.startswith(prefix):
            continue
        if not device_classes and not keywords:
            results.append(e_id)
            continue
        state_obj = states_map.get(e_id)
        attrs = getattr(state_obj, "attributes", {}) if state_obj else {}
        dc = str(attrs.get("device_class") or "").lower()
        lower = e_id.lower()
        if (dc and dc in device_classes) or any(kw in lower for kw in keywords):
            results.append(e_id)
    return results


def get_area_entities_map(hass: HomeAssistant) -> dict[str, Any]:
    """Build exact area -> entities mapping via Home Assistant area, device, and entity registries."""
    area_reg = ar.async_get(hass)
    device_reg = dr.async_get(hass)
    entity_reg = er.async_get(hass)

    states_map = {st.entity_id: st for st in hass.states.async_all()}
    entity_area_by_id: dict[str, str | None] = {}

    for ent_entry in entity_reg.entities.values():
        if ent_entry.disabled_by is not None:
            continue
        area_id = ent_entry.area_id
        if not area_id and ent_entry.device_id:
            dev_entry = device_reg.async_get(ent_entry.device_id)
            if dev_entry:
                area_id = dev_entry.area_id
        entity_area_by_id[ent_entry.entity_id] = area_id

    area_buckets: dict[str, list[str]] = {area.id: [] for area in area_reg.async_list_areas()}
    entities_meta: dict[str, dict[str, Any]] = {}

    for e_id in sorted(states_map.keys()):
        st = states_map[e_id]
        attrs = st.attributes
        area_id = entity_area_by_id.get(e_id) or attrs.get("area_id")
        if area_id and area_id in area_buckets:
            area_buckets[area_id].append(e_id)

        entities_meta[e_id] = {
            "entity_id": e_id,
            "domain": e_id.split(".", 1)[0],
            "name": attrs.get("friendly_name") or e_id,
            "area_id": area_id,
            "device_class": attrs.get("device_class"),
            "unit": attrs.get("unit_of_measurement"),
            "icon": attrs.get("icon"),
        }

    areas_out: list[dict[str, Any]] = []
    for area in area_reg.async_list_areas():
        areas_out.append(
            {
                "area_id": area.id,
                "name": area.name,
                "picture": area.picture,
                "icon": area.icon,
                "entities": area_buckets.get(area.id, []),
            }
        )

    return {
        "areas": areas_out,
        "entities": entities_meta,
    }


def _build_room_from_area(area: dict[str, Any], states_map: dict[str, Any]) -> dict[str, Any]:
    """Construct a default Vision Glass room configuration from a discovered HA area."""
    e_ids: list[str] = area["entities"]
    lights = _all_matching(e_ids, states_map, "light")
    climates = _all_matching(e_ids, states_map, "climate")
    temps = _all_matching(e_ids, states_map, "sensor", ("temperature",), ("temp",))
    humidities = _all_matching(e_ids, states_map, "sensor", ("humidity",), ("humid", "feucht"))
    luxes = _all_matching(e_ids, states_map, "sensor", ("illuminance",), ("illuminance", "lux"))
    occupancies = _all_matching(
        e_ids, states_map, "binary_sensor", ("occupancy", "motion", "presence"), ("occup", "motion", "beweg", "pres")
    )
    windows = _all_matching(e_ids, states_map, "binary_sensor", ("window", "door"), ("fenster", "window"))
    switches = _all_matching(e_ids, states_map, "switch")
    media = _all_matching(e_ids, states_map, "media_player")
    locks = _all_matching(e_ids, states_map, "lock")

    overlay_categories: list[dict[str, Any]] = []
    if lights:
        overlay_categories.append(
            {"id": "lighting", "name": "Beleuchtung", "icon": "ci:light-cove-strip", "entities": lights}
        )
    if climates or temps:
        overlay_categories.append(
            {
                "id": "climate",
                "name": "Klima & Heizung",
                "icon": "mdi:radiator",
                "entities": climates + temps[:2] + humidities[:1],
            }
        )
    if switches or media:
        overlay_categories.append(
            {"id": "devices", "name": "Geräte & Steckdosen", "icon": "ci:smart-plug-meter", "entities": switches + media}
        )
    if occupancies or windows or locks:
        overlay_categories.append(
            {
                "id": "sensors",
                "name": "Sensoren & Sicherheit",
                "icon": "ci:window-handle-closed",
                "entities": occupancies + windows + locks,
            }
        )

    return {
        "id": area["area_id"],
        "name": area["name"],
        "picture": area.get("picture"),
        "icon": area.get("icon"),
        "light_entity": lights[0] if lights else None,
        "climate_entity": climates[0] if climates else None,
        "temp_entity": temps[0] if temps else None,
        "humidity_entity": humidities[0] if humidities else None,
        "illuminance_entity": luxes[0] if luxes else None,
        "presence_entity": occupancies[0] if occupancies else None,
        "window_entity": windows[0] if windows else None,
        "switch_entity": switches[0] if switches else None,
        "media_entity": media[0] if media else None,
        "lock_entity": locks[0] if locks else None,
        "overlay_categories": overlay_categories,
    }


def build_initial_config(hass: HomeAssistant) -> dict[str, Any]:
    """Auto-provision an initial Vision Glass configuration dynamically from HA entities and areas."""
    discovery = get_area_entities_map(hass)
    states_map = {st.entity_id: st for st in hass.states.async_all()}
    all_ids = sorted(states_map.keys())

    rooms = [_build_room_from_area(area, states_map) for area in discovery["areas"]]

    has_lights = any(e.startswith("light.") for e in all_ids)
    has_climate = any(e.startswith("climate.") for e in all_ids)
    has_alarmo = any(e.startswith("alarm_control_panel.") for e in all_ids)
    has_switches = any(e.startswith("switch.") for e in all_ids)
    has_batteries = any(
        (getattr(states_map[e], "attributes", {}).get("device_class") == "battery") or ("battery" in e or "batterie" in e)
        for e in all_ids
        if e.startswith("sensor.")
    )

    weather_entity = next((e for e in all_ids if e.startswith("weather.")), None)
    lock_entity = next((e for e in all_ids if e.startswith("lock.")), None)

    cfg = copy.deepcopy(DEFAULT_CONFIG)
    cfg["_initialized"] = True
    cfg["weather_entity"] = weather_entity
    cfg["lock_entity"] = lock_entity
    cfg["rooms"] = rooms

    stats_rooms: dict[str, Any] = {}
    for r in rooms:
        r_id = r.get("id")
        has_temp = bool(r.get("temp_entity") or r.get("climate_entity"))
        has_illum = bool(r.get("illuminance_entity"))
        has_sensors = has_temp or has_illum
        stats_rooms[r_id] = {
            "enabled": has_sensors,
            "temp_entities": [r["temp_entity"]] if r.get("temp_entity") else ([r["climate_entity"]] if r.get("climate_entity") else []),
            "illum_entities": [r["illuminance_entity"]] if r.get("illuminance_entity") else [],
        }

    cfg["stats"] = {
        "rooms": stats_rooms,
        "show_temperature": True,
        "show_illuminance": True,
        "show_battery": True,
        "custom_sections": [],
    }

    cfg["dock"] = {
        "auto_detect": True,
        "items": [
            {"id": "lighting", "title": "Beleuchtung", "enabled": has_lights, "auto_hide": True},
            {"id": "climate", "title": "Heizung", "enabled": has_climate, "auto_hide": True},
            {"id": "stats", "title": "Statistiken", "enabled": True, "auto_hide": False},
            {"id": "security", "title": "Sicherheit", "enabled": True, "auto_hide": False},
            {"id": "alarmo", "title": "Alarmo", "enabled": has_alarmo, "auto_hide": True},
            {"id": "switches", "title": "Geräte", "enabled": has_switches, "auto_hide": True},
            {"id": "battery", "title": "Batteriestatus", "enabled": has_batteries, "auto_hide": True},
            {"id": "weather", "title": "Wetter", "enabled": weather_entity is not None, "auto_hide": True},
        ],
    }
    return cfg


def sync_rooms_with_areas(hass: HomeAssistant, config: dict[str, Any]) -> tuple[dict[str, Any], int, int]:
    """Update existing rooms from HA areas (name/picture/icon/missing entities) and append newly discovered HA areas."""
    discovery = get_area_entities_map(hass)
    states_map = {st.entity_id: st for st in hass.states.async_all()}
    areas_by_id = {area["area_id"]: area for area in discovery["areas"]}

    updated_cfg = copy.deepcopy(config)
    rooms: list[dict[str, Any]] = list(updated_cfg.get("rooms") or [])
    existing_ids = {r.get("id") for r in rooms if isinstance(r, dict)}

    updated_count = 0
    for room in rooms:
        area = areas_by_id.get(room.get("id"))
        if not area:
            continue
        changed = False
        if area.get("name") and room.get("name") != area["name"]:
            room["name"] = area["name"]
            changed = True
        if area.get("picture") != room.get("picture"):
            room["picture"] = area.get("picture")
            changed = True
        if area.get("icon") != room.get("icon") and area.get("icon"):
            room["icon"] = area["icon"]
            changed = True

        # Auto-populate unconfigured primary entities if new matching entities exist in this area
        area_entities = area.get("entities", [])
        if area_entities:
            if not room.get("light_entity"):
                cand = _first_matching(area_entities, states_map, "light")
                if cand:
                    room["light_entity"] = cand
                    changed = True
            if not room.get("climate_entity"):
                cand = _first_matching(area_entities, states_map, "climate")
                if cand:
                    room["climate_entity"] = cand
                    changed = True
            if not room.get("temp_entity"):
                cand = _first_matching(area_entities, states_map, "sensor", ("temperature",), ("temp", "temperatur"))
                if cand:
                    room["temp_entity"] = cand
                    changed = True
            if not room.get("humidity_entity"):
                cand = _first_matching(area_entities, states_map, "sensor", ("humidity",), ("humidity", "feuchte", "feuchtigkeit"))
                if cand:
                    room["humidity_entity"] = cand
                    changed = True
            if not room.get("illuminance_entity"):
                cand = _first_matching(area_entities, states_map, "sensor", ("illuminance",), ("lux", "illuminance", "helligkeit"))
                if cand:
                    room["illuminance_entity"] = cand
                    changed = True
            if not room.get("presence_entity"):
                cand = _first_matching(area_entities, states_map, "binary_sensor", ("occupancy", "presence", "motion"), ("occupied", "presence", "motion", "anwesend", "bewegung"))
                if cand:
                    room["presence_entity"] = cand
                    changed = True
            if not room.get("window_entity"):
                cand = _first_matching(area_entities, states_map, "binary_sensor", ("window", "door", "opening"), ("window", "fenster", "tuer", "door"))
                if cand:
                    room["window_entity"] = cand
                    changed = True

        if changed:
            updated_count += 1

    added_count = 0
    stats_rooms = updated_cfg.setdefault("stats", {}).setdefault("rooms", {})
    for area in discovery["areas"]:
        if area["area_id"] not in existing_ids:
            new_room = _build_room_from_area(area, states_map)
            rooms.append(new_room)
            existing_ids.add(area["area_id"])
            added_count += 1
            if area["area_id"] not in stats_rooms:
                has_temp = bool(new_room.get("temp_entity") or new_room.get("climate_entity"))
                has_illum = bool(new_room.get("illuminance_entity"))
                stats_rooms[area["area_id"]] = {
                    "enabled": has_temp or has_illum,
                    "temp_entities": [new_room["temp_entity"]] if new_room.get("temp_entity") else ([new_room["climate_entity"]] if new_room.get("climate_entity") else []),
                    "illum_entities": [new_room["illuminance_entity"]] if new_room.get("illuminance_entity") else [],
                }

    updated_cfg["rooms"] = rooms
    return updated_cfg, updated_count, added_count

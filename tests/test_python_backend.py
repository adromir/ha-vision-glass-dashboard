"""Unit tests for Vision Glass Home Assistant integration backend modules."""

from __future__ import annotations

import asyncio
import sys
import types
import unittest
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def _install_ha_stubs() -> None:
    """Install lightweight Home Assistant stubs when running outside an HA environment."""
    if "homeassistant" in sys.modules:
        return

    ha_mod = types.ModuleType("homeassistant")
    core_mod = types.ModuleType("homeassistant.core")
    config_entries_mod = types.ModuleType("homeassistant.config_entries")
    helpers_mod = types.ModuleType("homeassistant.helpers")
    cv_mod = types.ModuleType("homeassistant.helpers.config_validation")
    typing_mod = types.ModuleType("homeassistant.helpers.typing")
    storage_mod = types.ModuleType("homeassistant.helpers.storage")
    ar_mod = types.ModuleType("homeassistant.helpers.area_registry")
    dr_mod = types.ModuleType("homeassistant.helpers.device_registry")
    er_mod = types.ModuleType("homeassistant.helpers.entity_registry")
    util_mod = types.ModuleType("homeassistant.util")
    dt_mod = types.ModuleType("homeassistant.util.dt")
    components_mod = types.ModuleType("homeassistant.components")
    frontend_mod = types.ModuleType("homeassistant.components.frontend")
    http_mod = types.ModuleType("homeassistant.components.http")
    panel_custom_mod = types.ModuleType("homeassistant.components.panel_custom")
    ws_mod = types.ModuleType("homeassistant.components.websocket_api")
    vol_mod = types.ModuleType("voluptuous")

    components_mod.frontend = frontend_mod
    components_mod.http = http_mod
    components_mod.panel_custom = panel_custom_mod
    components_mod.websocket_api = ws_mod

    class HomeAssistant:
        pass

    def callback(fn):
        return fn

    core_mod.HomeAssistant = HomeAssistant
    core_mod.callback = callback

    class ConfigEntry:
        pass

    class ConfigFlow:
        def __init_subclass__(cls, **kwargs):
            return super().__init_subclass__()

    class OptionsFlow:
        pass

    config_entries_mod.ConfigEntry = ConfigEntry
    config_entries_mod.ConfigFlow = ConfigFlow
    config_entries_mod.OptionsFlow = OptionsFlow

    class FakeStore:
        def __init__(self, hass, version, key):
            self.hass = hass
            self.version = version
            self.key = key
            self._mem = None

        async def async_load(self):
            stores = getattr(self.hass, "_stores", {})
            return stores.get(self.key)

        async def async_save(self, data):
            if not hasattr(self.hass, "_stores"):
                self.hass._stores = {}
            self.hass._stores[self.key] = data

    storage_mod.Store = FakeStore

    ar_mod.async_get = lambda hass: hass._area_reg
    dr_mod.async_get = lambda hass: hass._device_reg
    er_mod.async_get = lambda hass: hass._entity_reg

    from datetime import datetime, timezone

    dt_mod.utcnow = lambda: datetime.now(timezone.utc)
    util_mod.dt = dt_mod

    class StaticPathConfig:
        def __init__(self, *args, **kwargs):
            pass

    http_mod.StaticPathConfig = StaticPathConfig
    panel_custom_mod.async_register_panel = lambda hass, frontend_url_path=None, **kw: None
    ws_mod.ActiveConnection = object
    ws_mod.websocket_command = lambda schema: (lambda fn: fn)
    ws_mod.async_response = lambda fn: fn
    ws_mod.async_register_command = lambda hass, fn: None

    vol_mod.Schema = lambda x, **kw: x
    vol_mod.Required = lambda k, default=None: k
    vol_mod.Optional = lambda k, default=None: k
    vol_mod.Coerce = lambda t: t
    vol_mod.All = lambda *a: a[0] if a else None
    vol_mod.Range = lambda **kw: None
    vol_mod.In = lambda x: x

    cv_mod.config_entry_only_config_schema = lambda d: (lambda cfg: cfg)
    typing_mod.ConfigType = dict
    helpers_mod.config_validation = cv_mod
    helpers_mod.typing = typing_mod
    helpers_mod.storage = storage_mod
    helpers_mod.area_registry = ar_mod
    helpers_mod.device_registry = dr_mod
    helpers_mod.entity_registry = er_mod

    sys.modules.update(
        {
            "homeassistant": ha_mod,
            "homeassistant.core": core_mod,
            "homeassistant.config_entries": config_entries_mod,
            "homeassistant.helpers": helpers_mod,
            "homeassistant.helpers.config_validation": cv_mod,
            "homeassistant.helpers.typing": typing_mod,
            "homeassistant.helpers.storage": storage_mod,
            "homeassistant.helpers.area_registry": ar_mod,
            "homeassistant.helpers.device_registry": dr_mod,
            "homeassistant.helpers.entity_registry": er_mod,
            "homeassistant.util": util_mod,
            "homeassistant.util.dt": dt_mod,
            "homeassistant.components": components_mod,
            "homeassistant.components.frontend": frontend_mod,
            "homeassistant.components.http": http_mod,
            "homeassistant.components.panel_custom": panel_custom_mod,
            "homeassistant.components.websocket_api": ws_mod,
            "voluptuous": vol_mod,
        }
    )


_install_ha_stubs()

from custom_components.vision_glass.aggregator import (  # noqa: E402
    _downsample_numeric_points,
    compute_summary,
)
from custom_components.vision_glass.discovery import (  # noqa: E402
    build_initial_config,
    sync_rooms_with_areas,
)
from custom_components.vision_glass.storage import (  # noqa: E402
    VisionGlassStore,
    _extract_card_from_lovelace_config,
)


@dataclass
class _State:
    entity_id: str
    state: str
    attributes: dict


@dataclass
class _Area:
    id: str
    name: str
    picture: str | None = None
    icon: str | None = None


@dataclass
class _Device:
    id: str
    area_id: str | None = None


@dataclass
class _EntityEntry:
    entity_id: str
    area_id: str | None = None
    device_id: str | None = None
    disabled_by: str | None = None


class _FakeHass:
    def __init__(self, states=None, areas=None, devices=None, entities=None):
        self.data = {}
        self._stores = {}
        self.states = types.SimpleNamespace(async_all=lambda: list(states or []))
        area_list = list(areas or [])
        dev_map = {d.id: d for d in (devices or [])}
        ent_map = {e.entity_id: e for e in (entities or [])}
        self._area_reg = types.SimpleNamespace(async_list_areas=lambda: area_list)
        self._device_reg = types.SimpleNamespace(async_get=lambda d_id: dev_map.get(d_id))
        self._entity_reg = types.SimpleNamespace(entities=ent_map)


class TestVisionGlassBackend(unittest.TestCase):
    """Test storage migration, discovery, and aggregation logic."""

    def test_extract_card_from_lovelace_config(self) -> None:
        raw = {
            "config": {
                "theme": "Vision Glass Dark",
                "views": [
                    {
                        "title": "Settings",
                        "cards": [{"type": "custom:vision-glass-dashboard", "mode": "settings"}],
                    },
                    {
                        "title": "Home",
                        "sections": [
                            {
                                "cards": [
                                    {
                                        "type": "custom:vision-glass-dashboard",
                                        "rooms": [{"id": "living", "name": "Living"}],
                                    }
                                ]
                            }
                        ],
                    },
                ],
            }
        }
        card, theme = _extract_card_from_lovelace_config(raw)
        self.assertEqual(theme, "Vision Glass Dark")
        self.assertIsNotNone(card)
        self.assertEqual(card["rooms"][0]["id"], "living")

    def test_store_migrates_legacy_lovelace(self) -> None:
        hass = _FakeHass()
        hass._stores["lovelace.vision_glass"] = {
            "config": {
                "theme": "Vision Glass Light",
                "views": [
                    {
                        "cards": [
                            {
                                "type": "custom:vision-glass-dashboard",
                                "rooms": [{"id": "wohnzimmer", "name": "Wohnzimmer"}],
                            }
                        ]
                    }
                ],
            }
        }

        async def _run():
            store = VisionGlassStore(hass)
            await store.async_load()
            migrated = await store.async_migrate_from_lovelace()
            self.assertTrue(migrated)
            self.assertEqual(store.data["theme_mode"], "light")
            self.assertEqual(store.data["rooms"][0]["id"], "wohnzimmer")
            self.assertNotIn("type", store.data)
            # Second run should be a no-op
            self.assertFalse(await store.async_migrate_from_lovelace())

        asyncio.run(_run())

    def test_discovery_and_sync_no_hardcoded_entities(self) -> None:
        hass = _FakeHass(
            states=[
                _State("light.living_main", "on", {"friendly_name": "Living Light"}),
                _State("sensor.living_temp", "21.4", {"device_class": "temperature", "unit_of_measurement": "°C"}),
                _State("climate.living_thermostat", "heat", {"current_temperature": 21.4, "hvac_action": "heating"}),
                _State("weather.home", "sunny", {"temperature": 18}),
            ],
            areas=[_Area("living", "Wohnzimmer", "/local/living.jpg", "mdi:sofa")],
            devices=[_Device("dev1", "living")],
            entities=[
                _EntityEntry("light.living_main", area_id="living"),
                _EntityEntry("sensor.living_temp", device_id="dev1"),
                _EntityEntry("climate.living_thermostat", area_id="living"),
            ],
        )
        cfg = build_initial_config(hass)
        self.assertEqual(cfg["weather_entity"], "weather.home")
        self.assertEqual(len(cfg["rooms"]), 1)
        room = cfg["rooms"][0]
        self.assertEqual(room["light_entity"], "light.living_main")
        self.assertEqual(room["temp_entity"], "sensor.living_temp")
        self.assertEqual(room["climate_entity"], "climate.living_thermostat")

        # Rename area & add second area
        hass._area_reg = types.SimpleNamespace(
            async_list_areas=lambda: [
                _Area("living", "Wohnzimmer Neu", "/local/living2.jpg"),
                _Area("kitchen", "Küche"),
            ]
        )
        synced, updated_cnt, added_cnt = sync_rooms_with_areas(hass, cfg)
        self.assertEqual(updated_cnt, 1)
        self.assertEqual(added_cnt, 1)
        self.assertEqual(synced["rooms"][0]["name"], "Wohnzimmer Neu")
        self.assertEqual(synced["rooms"][1]["id"], "kitchen")

    def test_compute_summary_and_downsampling(self) -> None:
        hass = _FakeHass(
            states=[
                _State("light.wohnung", "on", {}),
                _State("light.room1", "on", {}),
                _State("light.room2", "off", {}),
                _State("climate.room1", "heat", {"hvac_action": "heating", "current_temperature": 22.0}),
                _State("sensor.door_battery", "8", {"device_class": "battery", "unit_of_measurement": "%", "friendly_name": "Door"}),
                _State("sensor.window_battery", "30", {"device_class": "battery", "unit_of_measurement": "%", "friendly_name": "Window"}),
                _State("sensor.motion_battery", "95", {"device_class": "battery", "unit_of_measurement": "%", "friendly_name": "Motion"}),
                _State("input_boolean.guest", "off", {"friendly_name": "Guest Mode"}),
            ]
        )
        cfg = {
            "all_lights_entity": "light.wohnung",
            "rooms": [
                {"id": "wohnung", "light_entity": "light.wohnung"},
                {"id": "r1", "light_entity": "light.room1", "climate_entity": "climate.room1"},
                {"id": "r2", "light_entity": "light.room2"},
            ],
        }
        summary = compute_summary(hass, cfg)
        self.assertEqual(summary["lights"]["on_count"], 1)  # excludes light.wohnung aggregate
        self.assertEqual(summary["climate"]["heating_count"], 1)
        self.assertEqual(summary["climate"]["avg_temp"], 22.0)
        self.assertEqual(summary["batteries"]["critical_count"], 1)
        self.assertEqual(summary["batteries"]["low_count"], 1)
        self.assertEqual(summary["batteries"]["good_count"], 1)
        self.assertEqual(summary["helpers_count"], 1)

        pts = [(1000 * i, float(i)) for i in range(100)]
        ds = _downsample_numeric_points(pts, 20)
        self.assertEqual(len(ds), 20)
        self.assertEqual(ds[-1][1], 99.0)


if __name__ == "__main__":
    unittest.main()

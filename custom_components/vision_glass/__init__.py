"""Vision Glass Home Assistant integration: backend storage, discovery, stats, and custom panel."""

from __future__ import annotations

import hashlib
import inspect
import logging
from pathlib import Path
from typing import Any

import voluptuous as vol

from homeassistant.components import frontend, panel_custom, websocket_api
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from .aggregator import async_get_history, compute_summary
from .const import (
    CONF_MIGRATE_LOVELACE,
    CONF_REQUIRE_ADMIN,
    CONF_SIDEBAR_ICON,
    CONF_SIDEBAR_TITLE,
    DEFAULT_SIDEBAR_ICON,
    DEFAULT_SIDEBAR_TITLE,
    DOMAIN,
    PANEL_URL,
    STATIC_URL,
    VERSION,
)
from .discovery import build_initial_config, get_area_entities_map, sync_rooms_with_areas
from .storage import VisionGlassStore

try:
    from homeassistant.components.http import StaticPathConfig
except ImportError:  # pragma: no cover - fallback for older HA cores
    StaticPathConfig = None  # type: ignore[assignment]

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)
FRONTEND_DIR = Path(__file__).parent / "frontend"
BUNDLED_THEME_FILE = Path(__file__).parent / "themes" / "vision_glass.yaml"

SAFE_AREA = (
    {"handle_safe_area": True}
    if "handle_safe_area" in inspect.signature(panel_custom.async_register_panel).parameters
    else {}
)


def _compute_build_id() -> str:
    """Compute a short content hash across frontend modules for cache busting."""
    digest = hashlib.sha256()
    if FRONTEND_DIR.exists():
        for file_path in sorted(FRONTEND_DIR.rglob("*.js")):
            digest.update(file_path.read_bytes())
    return digest.hexdigest()[:10] or VERSION


def _sync_theme_file_sync(target_path: Path, source_path: Path) -> bool:
    """Copy bundled Vision Glass theme YAML into HA themes directory if missing or outdated."""
    if not source_path.exists():
        return False
    source_bytes = source_path.read_bytes()
    if target_path.exists() and target_path.read_bytes() == source_bytes:
        return False
    target_path.parent.mkdir(parents=True, exist_ok=True)
    target_path.write_bytes(source_bytes)
    return True


async def _async_apply_ha_theme_mode(hass: HomeAssistant, theme_mode: str) -> None:
    """Synchronize HA frontend default themes for both light and dark modes."""
    if not hass.services.has_service("frontend", "set_theme"):
        return

    mode = (theme_mode or "auto").lower()
    if mode == "light":
        calls = [("Vision Glass Light", "light"), ("Vision Glass Light", "dark")]
    elif mode == "dark":
        calls = [("Vision Glass Dark", "light"), ("Vision Glass Dark", "dark")]
    else:
        calls = [("Vision Glass Light", "light"), ("Vision Glass Dark", "dark")]

    for theme_name, target_mode in calls:
        try:
            await hass.services.async_call(
                "frontend",
                "set_theme",
                {"name": theme_name, "mode": target_mode},
                blocking=False,
            )
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Theme sync skipped (%s/%s): %s", theme_name, target_mode, err)


async def _async_install_theme_if_needed(hass: HomeAssistant) -> None:
    """Deploy bundled themes/vision_glass.yaml and reload frontend themes when changed."""
    target_path = Path(hass.config.path("themes", "vision_glass.yaml"))
    try:
        updated = await hass.async_add_executor_job(_sync_theme_file_sync, target_path, BUNDLED_THEME_FILE)
        if updated and hass.services.has_service("frontend", "reload_themes"):
            await hass.services.async_call("frontend", "reload_themes", blocking=True)
            _LOGGER.info("Installed/updated bundled Vision Glass theme at %s", target_path)
    except Exception as err:  # noqa: BLE001
        _LOGGER.debug("Bundled theme install skipped: %s", err)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register WebSocket commands for the Vision Glass integration."""
    websocket_api.async_register_command(hass, ws_config_get)
    websocket_api.async_register_command(hass, ws_config_save)
    websocket_api.async_register_command(hass, ws_discovery_rooms)
    websocket_api.async_register_command(hass, ws_discovery_sync)
    websocket_api.async_register_command(hass, ws_summary_get)
    websocket_api.async_register_command(hass, ws_stats_history)
    websocket_api.async_register_command(hass, ws_theme_sync)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Initialize Vision Glass store, static frontend assets, and custom sidebar panel."""
    store = VisionGlassStore(hass)
    await store.async_load()

    should_migrate = entry.data.get(CONF_MIGRATE_LOVELACE, True)
    if should_migrate and not store.data.get("_initialized"):
        await store.async_migrate_from_lovelace()

    if not store.data.get("_initialized"):
        initial_cfg = build_initial_config(hass)
        await store.async_save(initial_cfg)

    hass.data[DOMAIN] = {"store": store, "entry": entry}

    if not hass.data.get(f"{DOMAIN}_static_registered"):
        if StaticPathConfig is not None:
            await hass.http.async_register_static_paths(
                [StaticPathConfig(STATIC_URL, str(FRONTEND_DIR), cache_headers=False)]
            )
        else:  # pragma: no cover
            hass.http.register_static_path(STATIC_URL, str(FRONTEND_DIR), cache_headers=False)
        hass.data[f"{DOMAIN}_static_registered"] = True

    build_id = await hass.async_add_executor_job(_compute_build_id)
    module_url = f"{STATIC_URL}/vision-glass-panel.js?v={build_id}"

    sidebar_title = entry.options.get(
        CONF_SIDEBAR_TITLE, entry.data.get(CONF_SIDEBAR_TITLE, DEFAULT_SIDEBAR_TITLE)
    )
    sidebar_icon = entry.options.get(
        CONF_SIDEBAR_ICON, entry.data.get(CONF_SIDEBAR_ICON, DEFAULT_SIDEBAR_ICON)
    )
    require_admin = bool(
        entry.options.get(CONF_REQUIRE_ADMIN, entry.data.get(CONF_REQUIRE_ADMIN, False))
    )

    entry.async_on_unload(entry.add_update_listener(_options_changed))

    await _async_install_theme_if_needed(hass)
    await _async_apply_ha_theme_mode(hass, store.data.get("theme_mode", "auto"))

    await panel_custom.async_register_panel(
        hass,
        webcomponent_name="vision-glass-panel",
        frontend_url_path=PANEL_URL,
        module_url=module_url,
        sidebar_title=sidebar_title,
        sidebar_icon=sidebar_icon,
        require_admin=require_admin,
        **SAFE_AREA,
        config={"version": VERSION, "build_id": build_id},
    )
    return True


async def _options_changed(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Reload integration entry when sidebar options change."""
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Remove Vision Glass sidebar panel cleanly."""
    frontend.async_remove_panel(hass, PANEL_URL)
    hass.data.pop(DOMAIN, None)
    return True


@websocket_api.websocket_command({vol.Required("type"): "vision_glass/config/get"})
@callback
def ws_config_get(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Return current Vision Glass config and pre-computed summary."""
    domain_data = hass.data.get(DOMAIN) or {}
    store: VisionGlassStore | None = domain_data.get("store")
    config = store.data if store else {}
    summary = compute_summary(hass, config)
    connection.send_result(
        msg["id"],
        {
            "version": VERSION,
            "config": config,
            "summary": summary,
        },
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "vision_glass/config/save",
        vol.Required("config"): dict,
    }
)
@websocket_api.async_response
async def ws_config_save(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Persist updated Vision Glass config and sync Home Assistant theme mode."""
    domain_data = hass.data.get(DOMAIN) or {}
    store: VisionGlassStore | None = domain_data.get("store")
    if store is None:
        connection.send_error(msg["id"], "not_loaded", "Vision Glass integration is not loaded")
        return

    saved = await store.async_save(msg["config"])
    await _async_apply_ha_theme_mode(hass, saved.get("theme_mode", "auto"))
    summary = compute_summary(hass, saved)
    connection.send_result(msg["id"], {"config": saved, "summary": summary})


@websocket_api.websocket_command({vol.Required("type"): "vision_glass/discovery/rooms"})
@callback
def ws_discovery_rooms(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Return authoritative HA area and entity registry mapping."""
    connection.send_result(msg["id"], get_area_entities_map(hass))


@websocket_api.websocket_command({vol.Required("type"): "vision_glass/discovery/sync"})
@websocket_api.async_response
async def ws_discovery_sync(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Synchronize existing rooms with HA areas and discover newly added areas."""
    domain_data = hass.data.get(DOMAIN) or {}
    store: VisionGlassStore | None = domain_data.get("store")
    if store is None:
        connection.send_error(msg["id"], "not_loaded", "Vision Glass integration is not loaded")
        return

    updated_cfg, updated_count, added_count = sync_rooms_with_areas(hass, store.data)
    saved = await store.async_save(updated_cfg)
    connection.send_result(
        msg["id"],
        {
            "config": saved,
            "updated_count": updated_count,
            "added_count": added_count,
            "total": len(saved.get("rooms", [])),
        },
    )


@websocket_api.websocket_command({vol.Required("type"): "vision_glass/summary/get"})
@callback
def ws_summary_get(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Compute and return server-side dashboard summary metrics."""
    domain_data = hass.data.get(DOMAIN) or {}
    store: VisionGlassStore | None = domain_data.get("store")
    config = store.data if store else {}
    connection.send_result(msg["id"], compute_summary(hass, config))


@websocket_api.websocket_command(
    {
        vol.Required("type"): "vision_glass/stats/history",
        vol.Required("entity_ids"): [str],
        vol.Optional("hours", default=24): vol.Coerce(int),
        vol.Optional("max_points", default=120): vol.Coerce(int),
    }
)
@websocket_api.async_response
async def ws_stats_history(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Query Recorder history and return downsampled SVG-ready series."""
    data = await async_get_history(
        hass,
        msg["entity_ids"],
        hours=msg.get("hours", 24),
        max_points=msg.get("max_points", 120),
    )
    connection.send_result(msg["id"], data)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "vision_glass/theme/sync",
        vol.Optional("theme_mode", default="auto"): str,
    }
)
@websocket_api.async_response
async def ws_theme_sync(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Install/reload bundled theme YAML if needed and sync HA default theme modes."""
    await _async_install_theme_if_needed(hass)
    await _async_apply_ha_theme_mode(hass, msg.get("theme_mode", "auto"))
    connection.send_result(msg["id"], {"ok": True})

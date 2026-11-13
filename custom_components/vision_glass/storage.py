"""Persistent configuration storage and Lovelace migration for Vision Glass."""

from __future__ import annotations

import copy
import logging
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import (
    DEFAULT_CONFIG,
    LEGACY_LOVELACE_DASHBOARD,
    LEGACY_STORAGE_KEYS,
    STORAGE_KEY,
    STORAGE_VERSION,
)

_LOGGER = logging.getLogger(__name__)

_THEME_NAME_TO_MODE = {
    "Vision Glass Light": "light",
    "Vision Glass Dark": "dark",
    "Vision Glass": "auto",
}


def _extract_card_from_lovelace_config(raw: Any) -> tuple[dict[str, Any] | None, str | None]:
    """Extract the primary Vision Glass card config and dashboard theme from Lovelace data."""
    if not isinstance(raw, dict):
        return None, None

    dash_cfg = raw.get("config", raw)
    if not isinstance(dash_cfg, dict):
        return None, None

    theme_name = dash_cfg.get("theme")
    views = dash_cfg.get("views")
    if not isinstance(views, list):
        return None, theme_name

    for view in views:
        if not isinstance(view, dict):
            continue
        cards = list(view.get("cards") or [])
        for section in view.get("sections") or []:
            if isinstance(section, dict) and isinstance(section.get("cards"), list):
                cards.extend(section["cards"])

        for card in cards:
            if not isinstance(card, dict):
                continue
            if card.get("type") == "custom:vision-glass-dashboard" and card.get("mode") != "settings":
                return copy.deepcopy(card), theme_name

    return None, theme_name


async def async_has_legacy_lovelace(hass: HomeAssistant) -> bool:
    """Return True if an existing 'vision-glass' Lovelace dashboard config can be migrated."""
    lovelace_data = hass.data.get("lovelace")
    if lovelace_data is not None:
        dashboards = getattr(lovelace_data, "dashboards", None)
        if isinstance(dashboards, dict) and LEGACY_LOVELACE_DASHBOARD in dashboards:
            return True

    for key in LEGACY_STORAGE_KEYS:
        legacy_store: Store[dict[str, Any]] = Store(hass, 1, key)
        raw = await legacy_store.async_load()
        card, _ = _extract_card_from_lovelace_config(raw)
        if card is not None:
            return True

    return False


class VisionGlassStore:
    """Manage Vision Glass dashboard configuration in Home Assistant .storage."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self.data: dict[str, Any] = copy.deepcopy(DEFAULT_CONFIG)

    def _normalize(self, raw: dict[str, Any] | None) -> dict[str, Any]:
        """Merge persisted payload with defaults so required top-level keys always exist."""
        merged = copy.deepcopy(DEFAULT_CONFIG)
        if isinstance(raw, dict):
            for key, value in raw.items():
                if key in ("type", "mode", "view"):
                    continue
                merged[key] = copy.deepcopy(value)
        if not isinstance(merged.get("rooms"), list):
            merged["rooms"] = []
        if not isinstance(merged.get("dock"), dict):
            merged["dock"] = {"auto_detect": True, "items": []}
        if not isinstance(merged["dock"].get("items"), list):
            merged["dock"]["items"] = []
        if not isinstance(merged.get("bento_badges"), list):
            merged["bento_badges"] = []
        if not isinstance(merged.get("top_badges"), list):
            merged["top_badges"] = []
        if not isinstance(merged.get("helper_controls"), dict):
            merged["helper_controls"] = {}
        return merged

    async def async_load(self) -> dict[str, Any]:
        """Load configuration from .storage."""
        loaded = await self._store.async_load()
        self.data = self._normalize(loaded)
        return self.data

    async def async_save(self, config: dict[str, Any]) -> dict[str, Any]:
        """Normalize and persist configuration to .storage."""
        self.data = self._normalize(config)
        self.data["_initialized"] = True
        await self._store.async_save(self.data)
        return self.data

    async def async_migrate_from_lovelace(self) -> bool:
        """Migrate legacy 'vision-glass' Lovelace dashboard config once if store is empty."""
        if self.data.get("_initialized") or self.data.get("rooms"):
            return False

        card: dict[str, Any] | None = None
        theme_name: str | None = None

        lovelace_data = self.hass.data.get("lovelace")
        if lovelace_data is not None:
            dashboards = getattr(lovelace_data, "dashboards", None)
            dash_obj = dashboards.get(LEGACY_LOVELACE_DASHBOARD) if isinstance(dashboards, dict) else None
            if dash_obj is not None and hasattr(dash_obj, "async_load"):
                try:
                    raw_dash = await dash_obj.async_load(False)
                    card, theme_name = _extract_card_from_lovelace_config(raw_dash)
                except Exception as err:  # noqa: BLE001
                    _LOGGER.debug("Lovelace dashboard load fallback triggered: %s", err)

        if card is None:
            for key in LEGACY_STORAGE_KEYS:
                legacy_store: Store[dict[str, Any]] = Store(self.hass, 1, key)
                raw = await legacy_store.async_load()
                card, theme_name = _extract_card_from_lovelace_config(raw)
                if card is not None:
                    break

        if card is None:
            return False

        for strip_key in ("type", "mode", "view"):
            card.pop(strip_key, None)

        if "theme_mode" not in card and theme_name in _THEME_NAME_TO_MODE:
            card["theme_mode"] = _THEME_NAME_TO_MODE[theme_name]

        card["_initialized"] = True
        card["_migrated_from_lovelace"] = True
        await self.async_save(card)
        _LOGGER.info(
            "Migrated existing 'vision-glass' Lovelace configuration (%d rooms) to integration storage",
            len(self.data.get("rooms", [])),
        )
        return True

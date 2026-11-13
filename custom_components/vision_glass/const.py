"""Constants for the Vision Glass integration."""

from __future__ import annotations

DOMAIN = "vision_glass"
VERSION = "3.0.10"

PANEL_URL = "vision-glass"
STATIC_URL = "/vision_glass_static"

STORAGE_KEY = "vision_glass.config"
STORAGE_VERSION = 1

CONF_SIDEBAR_TITLE = "sidebar_title"
CONF_SIDEBAR_ICON = "sidebar_icon"
CONF_REQUIRE_ADMIN = "require_admin"
CONF_MIGRATE_LOVELACE = "migrate_lovelace"

DEFAULT_SIDEBAR_TITLE = "Vision Glass"
DEFAULT_SIDEBAR_ICON = "mdi:blur"

LEGACY_LOVELACE_DASHBOARD = "vision-glass"
LEGACY_STORAGE_KEYS = ("lovelace.vision_glass", "lovelace.vision-glass")

DEFAULT_CONFIG: dict = {
    "_initialized": False,
    "theme_mode": "auto",
    "background_style": "aurora",
    "ambient_speed": "normal",
    "background_mode": "mesh",
    "color_scheme": "default",
    "dashboard_title": "Smart Home",
    "weather_entity": None,
    "lock_entity": None,
    "all_lights_entity": None,
    "rooms": [],
    "bento_badges": [],
    "top_badges": [],
    "helper_controls": {},
    "stats": {
        "rooms": {},
        "show_temperature": True,
        "show_illuminance": True,
        "show_battery": True,
        "custom_sections": [],
    },
    "dock": {
        "auto_detect": True,
        "items": [],
    },
}

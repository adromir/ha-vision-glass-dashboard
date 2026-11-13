"""Config flow for Vision Glass integration."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback

from .const import (
    CONF_MIGRATE_LOVELACE,
    CONF_REQUIRE_ADMIN,
    CONF_SIDEBAR_ICON,
    CONF_SIDEBAR_TITLE,
    DEFAULT_SIDEBAR_ICON,
    DEFAULT_SIDEBAR_TITLE,
    DOMAIN,
)
from .storage import async_has_legacy_lovelace


class VisionGlassConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle the UI setup flow for Vision Glass."""

    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Handle the initial configuration step."""
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        has_legacy = await async_has_legacy_lovelace(self.hass)

        if user_input is not None:
            return self.async_create_entry(
                title=user_input.get(CONF_SIDEBAR_TITLE, DEFAULT_SIDEBAR_TITLE),
                data={
                    CONF_SIDEBAR_TITLE: user_input.get(CONF_SIDEBAR_TITLE, DEFAULT_SIDEBAR_TITLE),
                    CONF_SIDEBAR_ICON: user_input.get(CONF_SIDEBAR_ICON, DEFAULT_SIDEBAR_ICON),
                    CONF_REQUIRE_ADMIN: bool(user_input.get(CONF_REQUIRE_ADMIN, False)),
                    CONF_MIGRATE_LOVELACE: bool(user_input.get(CONF_MIGRATE_LOVELACE, has_legacy)),
                },
            )

        schema_dict: dict[Any, Any] = {
            vol.Optional(CONF_SIDEBAR_TITLE, default=DEFAULT_SIDEBAR_TITLE): str,
            vol.Optional(CONF_SIDEBAR_ICON, default=DEFAULT_SIDEBAR_ICON): str,
            vol.Optional(CONF_REQUIRE_ADMIN, default=False): bool,
        }
        if has_legacy:
            schema_dict[vol.Optional(CONF_MIGRATE_LOVELACE, default=True)] = bool

        return self.async_show_form(step_id="user", data_schema=vol.Schema(schema_dict))

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        """Return options flow handler for updating sidebar settings."""
        return VisionGlassOptionsFlow()


class VisionGlassOptionsFlow(OptionsFlow):
    """Manage panel options after installation."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Handle options update."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        current_title = self.config_entry.options.get(
            CONF_SIDEBAR_TITLE,
            self.config_entry.data.get(CONF_SIDEBAR_TITLE, DEFAULT_SIDEBAR_TITLE),
        )
        current_icon = self.config_entry.options.get(
            CONF_SIDEBAR_ICON,
            self.config_entry.data.get(CONF_SIDEBAR_ICON, DEFAULT_SIDEBAR_ICON),
        )
        current_admin = self.config_entry.options.get(
            CONF_REQUIRE_ADMIN,
            self.config_entry.data.get(CONF_REQUIRE_ADMIN, False),
        )

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.Optional(CONF_SIDEBAR_TITLE, default=current_title): str,
                    vol.Optional(CONF_SIDEBAR_ICON, default=current_icon): str,
                    vol.Optional(CONF_REQUIRE_ADMIN, default=bool(current_admin)): bool,
                }
            ),
        )

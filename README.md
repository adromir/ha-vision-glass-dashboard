# 🪟 Vision Glass for Home Assistant (v3.0.14)

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=adromir&repository=ha-vision-glass-dashboard&category=integration)
[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=for-the-badge)](https://github.com/hacs/default)
[![GitHub Release](https://img.shields.io/github/v/release/adromir/ha-vision-glass-dashboard?style=for-the-badge&color=blue)](https://github.com/adromir/ha-vision-glass-dashboard/releases)
[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2024.7%2B-18BCF2?style=for-the-badge&logo=home-assistant)](https://www.home-assistant.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=for-the-badge)](https://github.com/adromir/ha-vision-glass-dashboard)

An all-in-one **Home Assistant Integration & Spatial Glassmorphism Custom Panel** inspired by Apple VisionOS and macOS Sequoia design languages.

Starting with **v3.0.0**, Vision Glass installs cleanly as a single **HACS Integration** (`custom_components/vision_glass`) combining a Python backend (`.storage` persistence, native area/device/entity discovery, summary aggregation, and Recorder downsampling) with a modular zero-dependency ES frontend served as a dedicated sidebar Custom Panel (`/vision-glass`).

---

## 🌟 The Full Experience Suite

For the ultimate spatial glassmorphism experience across your entire Home Assistant setup, combine Vision Glass Panel with the companion theme and automatic theme switcher:

| Component | Type | Description | Quick Install |
| :--- | :--- | :--- | :--- |
| **Vision Glass Smart Home Panel** | Integration | Spatial Glassmorphism panel, Bento cards, tactile controls, popups, and recorder stats | [![Install Panel](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=adromir&repository=ha-vision-glass-dashboard&category=integration) |
| **Vision Glass Theme** | Theme | Universal Home Assistant theme covering the sidebar, header bar, dialogs, and data tables with frosted glass | [![Install Theme](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=adromir&repository=ha-vision-glass-theme&category=theme) |
| **Theme Switch Engine** | Companion | Seamless, automatic light/dark switching synced to daylight (`sun.sun`) or schedules | [![Install Theme Switcher](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=adromir&repository=ha-theme-switch-engine&category=integration) |

---

## ✨ Why Use Vision Glass?

- 🚀 **Single All-in-One Integration**: No manual Lovelace resources or separate dashboard YAML files required—install once via HACS, add the integration in Home Assistant, and open **Vision Glass** straight from your sidebar.
- 🎯 **Turnkey Default Dashboard & Instant Landing**: Automatically sets Vision Glass as Home Assistant's default landing page (`default_panel: vision-glass`) across system data, user profiles, and browsers so opening Home Assistant always launches Vision Glass directly.
- 🔄 **Continuous Automatic Area Synchronization**: Native event listeners on Home Assistant's area registry immediately update renamed areas, sync pictures and icons, auto-populate unconfigured entities, and automatically discover newly added rooms without manual intervention.
- 🧠 **Python-Offloaded Performance**:
  - **Exact Area/Device Registry Discovery**: Resolves area-to-entity mappings server-side (`vision_glass/discovery/rooms`) instead of brute-forcing entity lists in the browser.
  - **Server-Side Aggregation & Recorder Downsampling**: Computes active lights, heating counts, battery tiers, and downsampled SVG chart series (`vision_glass/stats/history`) in Python before sending compact payloads over WebSocket.
  - **Dedicated Storage (`vision_glass.config`)**: Persists your layout cleanly in `.storage/vision_glass.config` with zero dependency on Lovelace view/card editors.
- 🔄 **Seamless One-Time Lovelace Migration**: Upgrading from v2.x? Setup automatically detects an existing `vision-glass` Lovelace dashboard config and offers a 1-click migration into integration storage.
- 📦 **Modular ES Frontend & Lazy Loading**: Splits panel core, styles, icons, i18n (`de` / `en` / `id`), tactile controls, modals, settings view, and stats charts with content-hash cache busting (`?v=<build_id>`).

---

## 💎 Core Features

- 🪟 **Spatial Glassmorphism & Sidebar Theme Sync**: Translucent frosted acrylic surfaces with synchronized Home Assistant sidebar styling and automatic Day/Night switching (`sun.sun`).
- 🎛️ **Configurable Bento Room Cards**: Drag/reorder rooms, configure custom action icons, inline sensor badges per room card, and instant heating quick-steppers (`-` / `+`).
- 🛥️ **Customizable Floating Bottom Dock & Top Header Chips**: Built-in and custom dock modals/links/services, multi-row responsive settings/header chips, multi-person profile badges, Alarmo status, and dynamic dock visibility.
- 📑 **Rich Interactive Popups**:
  - 💡 **Lighting & Scenes**
  - 🌡️ **Climate & Heater Controls**
  - 📊 **Multi-Sensor Recorder Statistics**
  - 🌦️ **Atmospheric Weather & RainViewer / Windy Radar**
  - 🛡️ **Alarmo Keypad & Door Lock Status**
  - 🔋 **Critical / Low / Good Battery Monitor**
  - 🔌 **Smart Switches, Media/TV Remote & Helper Controls**

---

## 📦 Installation via HACS

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=adromir&repository=ha-vision-glass-dashboard&category=integration)

1. Make sure [HACS](https://hacs.xyz/) is installed.
2. Open **HACS → Integrations → ⋮ → Custom repositories**.
3. Add repository URL:
   ```text
   https://github.com/adromir/ha-vision-glass-dashboard
   ```
4. Choose category: **Integration** and click **Add**.
5. Search for **Vision Glass** in HACS, click **Download**, and **restart Home Assistant**.
6. Go to **Settings → Devices & Services → Add Integration → Vision Glass**.
   - Configure sidebar title, icon, admin restriction, and (if present) enable **Migrate existing `vision-glass` Lovelace configuration**.

---

## 🚀 Usage & Configuration

1. Open **Vision Glass** from the Home Assistant sidebar (`/vision-glass`) or navigate to your Home Assistant root URL (`/`) which automatically routes to Vision Glass.
2. Click **⚙️ Settings** in the top-right header bar or bottom dock to customize:
   - **Rooms & Bento Content** (order, primary entities, inline room sensor badges, custom action icons)
   - **Room Overlays & Helper Controls**
   - **Top Header Chips & Bottom Dock Items**
   - **Theme Mode, Background Presets & Default Landing Page Settings**
3. Changes save directly to Home Assistant `.storage/vision_glass.config` over WebSocket (`vision_glass/config/save`).

---

## ⚠️ Disclaimer

This custom integration interacts directly with your Home Assistant configuration storage and entities. Always keep regular Home Assistant backups before upgrading major versions. Provided "as is" without warranty of any kind.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more details.

**Author**: [Adromir](https://github.com/adromir)  
**Website**: <https://github.com/adromir>

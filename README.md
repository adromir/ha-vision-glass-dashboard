# 🪟 Vision Glass Dashboard for Home Assistant (v2.1)

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=adromir&repository=ha-vision-glass-dashboard&category=plugin)
[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=for-the-badge)](https://github.com/hacs/default)
[![GitHub Release](https://img.shields.io/github/v/release/adromir/ha-vision-glass-dashboard?style=for-the-badge&color=blue)](https://github.com/adromir/ha-vision-glass-dashboard/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=for-the-badge)](https://github.com/adromir/ha-vision-glass-dashboard)

A groundbreaking, turnkey **Spatial Glassmorphism Smart Home Dashboard** for Home Assistant inspired by Apple VisionOS and macOS Sequoia design languages.

Delivers a complete, tactile command center with live weather, room cards, interactive popups, day/night transitions, a floating glass dock, and now in **v2.1**: **Full Multilingual Localization (including Bahasa Indonesia)**, **Dedicated Configuration Page & Center**, **Tactile TV Remote & Media Player Tiles**, and **Soft Animated Ambient Lights (wabernde Lichter)**!

---

## ✨ What's New in v2.1

- 🌐 **100% Multilingual Localization & Zero Hardcoded Strings**:
  - Full native translations in **German (`de`)**, **English (`en`)**, and **Bahasa Indonesia (`id`)**!
  - 100% automated profile language resolution: seamlessly follows your Home Assistant user profile locale without any clutter or manual dropdowns in the UI.
  - Dynamically formats dates, times, days, and greetings according to your account's locale.
- ⚙️ **Dedicated Configuration Center & Settings View**:
  - Accessible directly in the dashboard via the **⚙️ Settings Gear button** in the top header, in the bottom floating dock, and as a dedicated Lovelace view (`path: settings`).
  - Seamlessly configure **Theme Modes** (Auto Day/Night via `sun.sun`, Always Light, Always Dark), **Background Style Presets**, **Ambient Animation Speed**, **Bento Room Cards (Reorder `[▲]` / `[▼]`, Add, Edit, Delete)**, **Room Overlays (Categories)**, and **Dock Buttons**.
  - Persists directly into Home Assistant storage via the native Lovelace WebSocket API with instant UI refresh and confirmation toast!
- 📺 **Tactile TV Remote Tile & 🎵 Media Player Tile**:
  - **Mini TV Remote Tile**: Dedicated TV tile for television media players (`device_class: tv`), featuring power toggle, input source selector (HDMI, Apps, TV), volume up/down, and mute controls.
  - **Strict Switch Isolation**: Smart plugs and power outlets are strictly isolated to socket control rows with on/off toggles, ensuring smartplugs are never conflated with TV remotes.
  - **Mini Media Player Tile**: Beautiful audio player tile for music systems with album art, track title, artist, volume stepper, play/pause, and track skip buttons.
- 🌌 **6 Selectable Background Presets & Tactile Physics**:
  - **Aurora (Wabernde Lichter)**: Soft, diffuse fluid caustics smoothly drifting behind the frosted glass panels.
  - **Spatial Vision Mesh**: Frosted geometric grid refraction with subtle depth.
  - **Deep Space**: Cosmic midnight starfield with nebula glow.
  - **Sunset Glow**: Warm twilight amber, violet, and peach gradients.
  - **Minimal Frosted Glass**: Clean, neutral frosted glass.
  - **Custom Image URL**: Supports any custom image URL or local path (`/local/...`).
  - **Tactile 3D Hover & Sheen**: Bento room cards and sidebar feature smooth 3D elevation, luminous border glow highlight, and a 45-degree specular sheen sweep (`:hover::after`).
- 🛠️ **Seamless Lovelace Edit Mode Integration & Card Editor Fix**:
  - Fixed Lovelace card editor (`vision-glass-dashboard-editor`) so clicking the edit pencil on panel views opens the visual configurator cleanly without errors.
  - Surfaces a direct configuration banner when in panel edit mode.


---

## 💎 Core Features

- 💎 **Authentic Spatial Glassmorphism**: Cards and docks render hardware-accelerated translucent acrylic (`backdrop-filter: blur(28px)`), specular edge lighting, and ambient colored glows.
- 🌓 **Dynamic Day & Night Transitions**: Automatically detects sun elevation (`sun.sun`) or system time to transition smoothly between a bright daylight glass atmosphere and an obsidian midnight glass atmosphere. Includes a manual one-click toggle.
- 🎛️ **Bento Room Grid**: Rich room panels featuring live status indicators, temperatures, **humidity** (💧), **illuminance** (💡 lx), and a direct **heating quick-stepper** (`[-]` / `[+]`) to adjust target temperatures instantly without opening overlays.
- 👤 **Resident Profile Badges**: Real avatar photos and status indicators for home residents (`person.*`).
- 🧭 **Glanceable Left Sidebar**: High-contrast spatial widget in both Light and Dark themes with bold typography, live clock, date, clickable weather capsule with mini-stats, and whole-home status pills.
- 🛥️ **Floating VisionOS Dock**: Pinned frosted dock bar at the bottom for quick access to whole-home lighting, climate, shading, and weather.
- 📑 **Interactive Popups**:
  - 💡 **Lighting & Scenes**: Whole-home on/off toggles, circadian daylight presets, and per-room sliders.
  - 🌡️ **Climate & Curves**: Smooth SVG temperature history charts, domestic hot water (DHW) status, and target steppers.
  - 📊 **Multi-Sensor Statistics**: Interactive multi-line SVG charts combining all temperature sensors of each room into one graph, 24h Lux curves, occupancy & heating cycles, and battery discharge trends.
  - 🌦️ **Atmospheric Weather & Radar**: RainViewer HD precipitation radar with Windy toggle (persistent iframe, no flickering), smooth kinetic 24h hourly forecast without rubberbanding, and 7-day weather trend.
  - 🛡️ **Alarmanlage & Sicherheit**: Full Alarmo panel with mode switching and numeric keypad, plus 3-state front door lock (Door Open, Unlocked, Locked).
  - 🔋 **Battery & Maintenance Monitor**: Filterable battery monitor (Critical, Low, Good) with animated level bars.
- 🎨 **Modern Dual-Theme Vector Icon Library**: 60+ bespoke, hand-crafted vector SVG icons supporting both MDI and Custom Icons (`ci:*`).
- ⚡ **Zero-Dependency Vanilla Web Component**: Built entirely with standards-based Web Components and CSS3. Requires no heavy frameworks.

---

## 📦 Installation via HACS

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=adromir&repository=ha-vision-glass-dashboard&category=plugin)

1. Make sure [HACS](https://hacs.xyz/) is installed.
2. In Home Assistant, open **HACS** > **Frontend**.
3. Click the three dots (top right) and select **Custom repositories**.
4. Enter repository URL:
   ```
   https://github.com/adromir/ha-vision-glass-dashboard
   ```
5. Select category: **Lovelace** (Dashboard Plugin).
6. Click **Add**, find **Vision Glass Dashboard**, and click **Download**.

---

## 🚀 Quick Start

Create a new Dashboard (or View) in Home Assistant. For the optimal full-screen spatial experience, set the view to **Panel Mode**:

```yaml
title: Vision Glass
views:
  - title: Home
    path: home
    panel: true
    cards:
      - type: custom:vision-glass-dashboard
```

Upon first launch, the dashboard **automatically detects your rooms and entities** and creates your Bento cards. Open the visual card editor anytime to customize or reorder them!

---

## 🛠️ Visual GUI Card Editor

Click **Edit Card** in Lovelace to open the visual configurator:
- **🏠 Rooms Tab**: Add, delete, or reorder rooms using `[▲]` and `[▼]`. Assign primary light, climate, motion, and window sensors.
- **📂 Overlays Tab**: Choose any room and define custom category blocks (e.g. *Ambience*, *Home Theater*, *Power Plugs*). Reorder entities with `[▲]` and `[▼]`.
- **⚓ Bottom Dock Tab**: Toggle automatic dead-button hiding, reorder dock tabs, or add custom dock sections (with custom modal overlays, dashboard URLs, or service calls).
- **⚙️ General Tab**: Configure title, weather entity, all-lights group, lock entity, and trigger global theme / automation synchronization.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more details.

**Author**: [Adromir](https://github.com/adromir)  
**Website**: [https://github.com/adromir](https://github.com/adromir)

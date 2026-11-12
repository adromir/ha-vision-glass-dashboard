# 🪟 Vision Glass Dashboard for Home Assistant (v2.0)

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=adromir&repository=ha-vision-glass-dashboard&category=plugin)
[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=for-the-badge)](https://github.com/hacs/default)
[![GitHub Release](https://img.shields.io/github/v/release/adromir/ha-vision-glass-dashboard?style=for-the-badge&color=blue)](https://github.com/adromir/ha-vision-glass-dashboard/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=for-the-badge)](https://github.com/adromir/ha-vision-glass-dashboard)

A groundbreaking, turnkey **Spatial Glassmorphism Smart Home Dashboard** for Home Assistant inspired by Apple VisionOS and macOS Sequoia design languages.

Delivers a complete, tactile command center with live weather, room cards, interactive popups, day/night transitions, a floating glass dock, and now in **v2.0**: **Turnkey Auto-Provisioning**, a full **Visual Card Editor**, **Custom Overlay Categories**, and a **Context-Aware Dynamic Dock with Custom Tabs**!

---

## ✨ What's New in v2.0

- 🚀 **Turnkey One-Time Auto-Provisioning**:
  - Automatically scans your Home Assistant areas and entities upon initial setup and generates Bento room cards matching your real home.
  - Automatically locks the configuration with `_initialized: true` so your custom edits are **never overwritten**.
- 🛠️ **Full Visual GUI Card Editor (`vision-glass-dashboard-editor`)**:
  - Configure rooms, cards, categories, and dock items directly in the Home Assistant Lovelace UI editor without touching YAML!
  - **Reorder Bento Room Cards & Entities**: Move rooms and assigned entities up and down with `[▲]` and `[▼]` reorder buttons.
- 📂 **Custom Room Overlay Categories**:
  - Define completely custom category blocks inside room detail popups (e.g. *"Main Lighting"*, *"Accent LEDs"*, *"Climate & Heating"*, *"Multimedia"*, *"Smart Plugs"*, *"Sensors"*).
  - Assign and reorder entities inside custom categories.
- ⚓ **Context-Aware Dynamic Dock & Custom Sections**:
  - Automatically hides dead buttons (e.g. Alarmo button is hidden if Alarmo is not installed; climate button is hidden if no thermostats exist).
  - **Add Custom Dock Tabs**: Create your own dock buttons with custom icons (`ci:*` or `mdi:*`) that open custom modal overlays, navigate to dashboard URLs, or trigger Home Assistant scripts/services!
- 🎨 **Bundled Themes & Day/Night Automation**:
  - Built-in zero-dependency Vision Glass Light & Dark styling with automatic daylight tracking (`sun.sun`).
  - Bundles [`themes/vision_glass.yaml`](themes/vision_glass.yaml) and [`automations/day_night_switch.yaml`](automations/day_night_switch.yaml) for optional 1-click system-wide theme synchronization across the entire Home Assistant interface.

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

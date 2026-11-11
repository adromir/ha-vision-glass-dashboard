# 🪟 Vision Glass Dashboard for Home Assistant

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=for-the-badge)](https://github.com/hacs/default)
[![GitHub Release](https://img.shields.io/github/v/release/adromir/ha-vision-glass-dashboard?style=for-the-badge&color=blue)](https://github.com/adromir/ha-vision-glass-dashboard/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=for-the-badge)](https://github.com/adromir/ha-vision-glass-dashboard)

A groundbreaking, spatial **Glassmorphism Smart Home Dashboard** for Home Assistant, inspired by Apple VisionOS and macOS Sequoia design languages. Delivers a complete, tactile command center with live weather, room cards, interactive popups, day/night transitions, and a floating glass dock.

---

## ✨ Key Advantages & Features

- 💎 **Authentic Spatial Glassmorphism**: Cards and docks render hardware-accelerated translucent acrylic (`backdrop-filter: blur(28px)`), specular edge lighting, and ambient colored glows.
- 🌓 **Dynamic Day & Night Transitions**: Automatically detects sun elevation (`sun.sun`) or system time to transition smoothly between a bright daylight glass atmosphere and an obsidian midnight glass atmosphere. Includes a manual one-click toggle.
- 🎛️ **3x3 Bento Room Grid**: 9 rich room panels featuring live status indicators, temperatures, **humidity** (💧), **illuminance** (💡 lx), and a direct **heating quick-stepper** (`[-]` / `[+]`) to adjust target temperatures instantly without opening overlays.
- 👤 **Resident Profile Badges**: Real avatar photos and status indicators for home residents (`person.andreas`, `person.shanty`).
- 🧭 **Glanceable Left Sidebar**: High-contrast spatial widget in both Light and Dark themes with bold typography, live clock, date, clickable weather capsule with mini-stats (humidity, wind, sunset), trash calendar collection alerts, and whole-home status pills.
- 🛥️ **Floating VisionOS Dock**: Pinned frosted dock bar at the bottom for quick access to whole-home lighting, climate, shading, and weather.
- 📑 **Interactive Popups**:
  - 💡 **Lighting & Scenes**: Whole-home on/off toggles, circadian daylight presets, and per-room sliders.
  - 🌡️ **Climate & Curves**: Smooth SVG temperature history charts, domestic hot water (DHW) status, and `[-]` / `[+]` target steppers.
  - 📊 **Multi-Sensor Statistics**: Interactive multi-line SVG charts combining all temperature sensors of each room into one graph, 24h Lux curves, occupancy & heating cycles, and battery discharge trends.
  - 🌦️ **Atmospheric Weather & Radar**: RainViewer HD precipitation radar with Windy toggle (persistent iframe, no flickering), smooth kinetic 24h hourly forecast without rubberbanding, and 7-day weather trend.
  - 🛡️ **Alarmanlage & Sicherheit**: Full Alarmo panel with mode switching and numeric keypad, plus 3-state front door lock (Tür offen, Entriegelt, Verriegelt).
  - 🔋 **Battery & Maintenance Monitor**: Filterable battery monitor (Critical, Low, Good) with animated level bars.
- 🎨 **Modern Dual-Theme Vector Icon Library**: Completely replaced all Unicode emojis with 60+ bespoke, hand-crafted vector SVG icons. Dual-set theme engine features razor-sharp slate outlines with jewel accents in Light Mode and luminous specular neon-glass glows in Dark Mode.
- ⚡ **Zero-Dependency Vanilla Web Component**: Built entirely with standards-based Web Components and CSS3. Requires no NodeJS build pipeline or heavy frameworks.

---

## 📦 Installation via HACS

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

## 🚀 Usage in Dashboards

Create a new Dashboard (or View) in Home Assistant. For the optimal full-screen spatial experience, set the view to **Panel Mode**:

```yaml
title: Vision Glass
views:
  - title: Home
    path: home
    panel: true
    cards:
      - type: custom:vision-glass-dashboard
        weather_entity: weather.forecast_home
```

---

## 🛠️ Configuration Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `type` | string | **Required** | `custom:vision-glass-dashboard` |
| `title` | string | `Aether Residence` | Dashboard title displayed in header |
| `auto_day_night` | boolean | `true` | Automatically switch theme based on `sun.sun` |
| `weather_entity` | string | `weather.forecast_home` | Primary weather entity for sidebar |

---

## 📄 License & Disclaimer

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

**Disclaimer**: This dashboard is an independent community project developed for Home Assistant and is not affiliated with or endorsed by Apple Inc. or Nabu Casa.

---

## 👤 Author

Developed by **Adromir**  
Website: [https://github.com/adromir](https://github.com/adromir)


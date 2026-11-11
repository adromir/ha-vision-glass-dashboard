/**
 * Vision Glass Dashboard for Home Assistant
 * Ultra-modern Apple VisionOS & macOS inspired spatial glassmorphism dashboard.
 * Author: Adromir (https://github.com/adromir)
 * Repository: https://github.com/adromir/ha-vision-glass-dashboard
 */

class VisionGlassDashboard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
    this._activeModal = null;
    this._userThemeOverride = null; // 'light' | 'dark' | null (auto)
    this._timer = null;
    this._initialRenderDone = false;
    this._alarmoCode = '';
    this._batteryFilter = 'all'; // 'all' | 'critical' | 'low' | 'good'
    this._tempHistory = {};
    this._historyFetched = false;
    this._hourlyForecast = [];
    this._dailyForecast = [];
    this._forecastSubscribed = false;
    this._statsTab = 'temperature'; // 'temperature' | 'illuminance' | 'occupancy_heating' | 'battery'
    this._statsRoom = 'wohnzimmer';
    this._statsHistory = {};
    this._statsHistoryFetched = false;
    this._roomEntitiesCache = {};
    this._updateRaf = null;
    this._lang = (typeof localStorage !== 'undefined' && localStorage.getItem('vg_dashboard_lang')) || null;
  }

  static get I18N() {
    return {
      de: {
        welcome: 'Willkommen',
        smart_home_center: 'Smart Home Zentrale',
        today: 'Heute',
        tomorrow: 'Morgen',
        now: 'Jetzt',
        deactivated: 'Deaktiviert',
        disarmed: 'Deaktiviert',
        armed_home: 'Scharf (Zuhause)',
        armed_away: 'Scharf (Abwesend)',
        armed_night: 'Scharf (Nacht)',
        arming: 'Schärfung läuft...',
        alarm_triggered: 'ALARM AUSGELÖST!',
        door_open: 'Tür offen',
        door_closed_unlocked: 'Tür zu & entriegelt',
        door_closed_locked: 'Tür zu & verriegelt',
        lock_door: 'Verriegeln',
        unlock_door: 'Entriegeln',
        lights_on: 'Lichter an',
        lights_off: 'Alle Lichter aus',
        lights_loading: 'Lichter laden...',
        climate_loading: 'Klima laden...',
        lock_loading: 'Schloss laden...',
        alarmo_loading: 'Alarmo laden...',
        weather_loading: 'Wetter...',
        climate: 'Klima',
        lock: 'Schloss',
        alarmo: 'Alarmo',
        weather: 'Wetter',
        lighting: 'Beleuchtung',
        stats: 'Statistiken & Verläufe',
        security: 'Sicherheit & Wohnungsschloss',
        switches: 'Geräte & Steckdosen',
        battery: 'Batteriestatus & Wartung',
        residents: 'Bewohner & Anwesenheit',
        all: 'Gesamt',
        critical: 'Kritisch (<20%)',
        low: 'Niedrig (20-40%)',
        good: 'Gut (>40%)',
        on: 'EIN',
        off: 'AUS',
        heat: 'HEIZEN',
        target: 'Ziel',
        temp: 'Temp',
        humidity: 'Feuchte',
        lux: 'Lux',
        occupied: 'Belegt',
        idle: 'Bereit',
        person_present: 'Person anwesend',
        no_motion: 'Keine Bewegung',
        window_open: 'Fenster geöffnet',
        window_closed: 'Fenster geschlossen',
        windows_open_count: 'offen',
        windows_all_closed: 'Fenster zu',
        door_locked_short: 'Zu',
        door_unlocked_short: 'Offen',
        overview_devices: 'Raumübersicht & Geräte',
        other_devices: 'Weitere Geräte & Schalter in diesem Raum',
        measurements_sensors: 'Messwerte & Sensoren',
        multimedia_hub: 'Multimedia-Zentrale',
        multimedia_desc: 'Schaltet TV, AVR-Receiver, Subwoofer & Shield zusammen',
        pin_code: 'PIN Code',
        no_entry: 'Keine Eingabe',
        home: 'Zuhause',
        away: 'Abwesend',
        unknown: 'Unbekannt',
        agenda_garbage: 'TERMINE & MÜLLABFUHR',
        sunset: 'Sonnenuntergang',
        radar_precip: 'Niederschlagsradar',
        hourly_forecast: 'Stündliche Vorhersage (24h)',
        daily_trend: '7-Tage Wettertrend',
        all_lights_turn_off: 'Alle Lichter ausschalten',
        all_lights_turn_on: 'Alle Lichter einschalten',
        battery_level: 'Batterie',
        device_details: 'Details in Home Assistant öffnen',
        lang_switch: 'Sprache wechseln / Change language (DE / EN)',
        day_mode: 'Tagmodus aktiv (Klick für Nachtmodus)',
        night_mode: 'Nachtmodus aktiv (Klick für Tagmodus)'
      },
      en: {
        welcome: 'Welcome',
        smart_home_center: 'Smart Home Center',
        today: 'Today',
        tomorrow: 'Tomorrow',
        now: 'Now',
        deactivated: 'Deactivated',
        disarmed: 'Deactivated',
        armed_home: 'Armed (Home)',
        armed_away: 'Armed (Away)',
        armed_night: 'Armed (Night)',
        arming: 'Arming in progress...',
        alarm_triggered: 'ALARM TRIGGERED!',
        door_open: 'Door open',
        door_closed_unlocked: 'Door closed & unlocked',
        door_closed_locked: 'Door closed & locked',
        lock_door: 'Lock',
        unlock_door: 'Unlock',
        lights_on: 'lights on',
        lights_off: 'All lights off',
        lights_loading: 'Loading lights...',
        climate_loading: 'Loading climate...',
        lock_loading: 'Loading lock...',
        alarmo_loading: 'Loading alarmo...',
        weather_loading: 'Weather...',
        climate: 'Climate',
        lock: 'Lock',
        alarmo: 'Alarmo',
        weather: 'Weather',
        lighting: 'Lighting',
        stats: 'Statistics & History',
        security: 'Security & Door Lock',
        switches: 'Devices & Sockets',
        battery: 'Battery Status & Maintenance',
        residents: 'Residents & Presence',
        all: 'All',
        critical: 'Critical (<20%)',
        low: 'Low (20-40%)',
        good: 'Good (>40%)',
        on: 'ON',
        off: 'OFF',
        heat: 'HEAT',
        target: 'Target',
        temp: 'Temp',
        humidity: 'Humidity',
        lux: 'Lux',
        occupied: 'Occupied',
        idle: 'Ready',
        person_present: 'Person present',
        no_motion: 'No motion',
        window_open: 'Window open',
        window_closed: 'Window closed',
        windows_open_count: 'open',
        windows_all_closed: 'Windows closed',
        door_locked_short: 'Locked',
        door_unlocked_short: 'Unlocked',
        overview_devices: 'Room Overview & Devices',
        other_devices: 'Additional Devices & Switches in this room',
        measurements_sensors: 'Readings & Sensors',
        multimedia_hub: 'Multimedia Hub',
        multimedia_desc: 'Controls TV, AVR Receiver, Subwoofer & Shield together',
        pin_code: 'PIN Code',
        no_entry: 'No input',
        home: 'Home',
        away: 'Away',
        unknown: 'Unknown',
        agenda_garbage: 'AGENDA & RECYCLING',
        sunset: 'Sunset',
        radar_precip: 'Precipitation Radar',
        hourly_forecast: 'Hourly Forecast (24h)',
        daily_trend: '7-Day Weather Trend',
        all_lights_turn_off: 'Turn all lights off',
        all_lights_turn_on: 'Turn all lights on',
        battery_level: 'Battery',
        device_details: 'Open details in Home Assistant',
        lang_switch: 'Change language / Sprache wechseln (DE / EN)',
        day_mode: 'Day mode active (click for night mode)',
        night_mode: 'Night mode active (click for day mode)'
      }
    };
  }

  static get ICONS() {
    return {
  "sun": "<circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41\"/>",
  "moon": "<path d=\"M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z\"/>",
  "light": "<path d=\"M9 18h6M10 22h4M12 2a7 7 0 0 0-7 7c0 2.5 1.3 4.7 3.2 6h7.6c1.9-1.3 3.2-3.5 3.2-6a7 7 0 0 0-7-7z\"/><path d=\"M10 9l2-2 2 2\" stroke-width=\"1.4\" opacity=\"0.75\"/>",
  "climate": "<path d=\"M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z\"/><circle cx=\"11.5\" cy=\"17.5\" r=\"2\" fill=\"currentColor\"/><path d=\"M11.5 8v6.5\" stroke-width=\"1.8\"/>",
  "thermometer": "<path d=\"M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z\"/><circle cx=\"11.5\" cy=\"17.5\" r=\"2\" fill=\"currentColor\"/><path d=\"M11.5 8v6.5\" stroke-width=\"1.8\"/>",
  "music": "<path d=\"M9 18V5l12-2v13\"/><circle cx=\"6\" cy=\"18\" r=\"3\"/><circle cx=\"18\" cy=\"16\" r=\"3\"/>",
  "tv": "<rect x=\"2\" y=\"4\" width=\"20\" height=\"13\" rx=\"2\"/><path d=\"M8 21h8M12 17v4\"/><path d=\"M7 9l4 2.5L7 14V9z\" fill=\"currentColor\" opacity=\"0.6\"/>",
  "multimedia": "<rect x=\"2\" y=\"4\" width=\"20\" height=\"13\" rx=\"2\"/><path d=\"M8 21h8M12 17v4\"/><path d=\"M7 9l4 2.5L7 14V9z\" fill=\"currentColor\" opacity=\"0.6\"/>",
  "plug": "<path d=\"M9 2v6M15 2v6M6 8h12a2 2 0 0 1 2 2v2a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6v-2a2 2 0 0 1 2-2zM12 18v4\"/>",
  "socket": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><circle cx=\"9\" cy=\"12\" r=\"1.5\" fill=\"currentColor\"/><circle cx=\"15\" cy=\"12\" r=\"1.5\" fill=\"currentColor\"/><path d=\"M12 3v2M12 19v2\"/>",
  "lock-closed": "<rect x=\"3\" y=\"11\" width=\"18\" height=\"11\" rx=\"3\" ry=\"3\"/><path d=\"M7 11V7a5 5 0 0 1 10 0v4\"/><circle cx=\"12\" cy=\"16\" r=\"1.5\" fill=\"currentColor\"/>",
  "lock-open": "<rect x=\"3\" y=\"11\" width=\"18\" height=\"11\" rx=\"3\" ry=\"3\"/><path d=\"M7 11V7a5 5 0 0 1 9.9-1\"/><circle cx=\"12\" cy=\"16\" r=\"1.5\" fill=\"currentColor\"/>",
  "door": "<path d=\"M4 21h16M6 21V3h12v18M14 12v.01\" stroke-width=\"2\"/>",
  "door-open": "<path d=\"M4 21h16M6 21V3h12v18M6 21l8-2V5L6 3v18zM12 12v.01\" stroke-width=\"2\"/>",
  "window": "<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"/><path d=\"M12 3v18M3 12h18\"/>",
  "window-open": "<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"/><path d=\"M12 3v18M3 12h9M12 3l7 3v12l-7 3\"/>",
  "shield": "<path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z\"/>",
  "shield-check": "<path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z\"/><path d=\"m9 12 2 2 4-4\"/>",
  "shield-alert": "<path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z\"/><path d=\"M12 8v4M12 16h.01\"/>",
  "siren": "<path d=\"M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0\"/><path d=\"M2 8a10 10 0 0 1 3-7M22 8a10 10 0 0 0-3-7\"/>",
  "user": "<path d=\"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2\"/><circle cx=\"12\" cy=\"7\" r=\"4\"/>",
  "user-walk": "<circle cx=\"13\" cy=\"4\" r=\"2\"/><path d=\"M7 21l3-7 3 2 2 5M10 12l2-3 3 1 3 4M6 13l3-2\"/>",
  "home": "<path d=\"m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"/><polyline points=\"9 22 9 12 15 12 15 22\"/>",
  "motion": "<circle cx=\"12\" cy=\"5\" r=\"2\"/><path d=\"m9 20 3-6 2 2 2 4M9 13l2-3 3 1 3 3M7 14l2-2M18 4a5 5 0 0 1 0 7M21 2a8 8 0 0 1 0 11\"/>",
  "motion-idle": "<circle cx=\"12\" cy=\"12\" r=\"3\" fill=\"currentColor\"/><circle cx=\"12\" cy=\"12\" r=\"8\" stroke-dasharray=\"3 3\"/>",
  "map-pin": "<path d=\"M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z\"/><circle cx=\"12\" cy=\"10\" r=\"3\"/>",
  "droplet": "<path d=\"M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z\"/><path d=\"M12 7a5 5 0 0 1 5 5\" stroke-width=\"1.5\" opacity=\"0.6\"/>",
  "lux": "<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1\"/>",
  "wind": "<path d=\"M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2\"/>",
  "flame": "<path d=\"M8.5 14.5A2.5 2.5 0 0 0 11 17c1.38 0 2.5-1.12 2.5-2.5 0-1.63-1.5-2.5-1.5-4 0-.83.67-1.5 1.5-1.5 0-2-1.5-3.5-3.5-3.5C7.5 5.5 6 8.5 6 12a6 6 0 0 0 6 6c3.31 0 6-2.69 6-6 0-3-2-5.5-4-7 0 2.5-2 3.5-2 5a2.5 2.5 0 0 0 2.5 2.5\"/>",
  "calendar": "<rect x=\"3\" y=\"4\" width=\"18\" height=\"18\" rx=\"2\" ry=\"2\"/><line x1=\"16\" y1=\"2\" x2=\"16\" y2=\"6\"/><line x1=\"8\" y1=\"2\" x2=\"8\" y2=\"6\"/><line x1=\"3\" y1=\"10\" x2=\"21\" y2=\"10\"/><rect x=\"7\" y=\"14\" width=\"3\" height=\"3\" fill=\"currentColor\" opacity=\"0.7\"/>",
  "clock": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><polyline points=\"12 6 12 12 16 14\"/>",
  "trash": "<polyline points=\"3 6 5 6 21 6\"/><path d=\"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2\"/><line x1=\"10\" y1=\"11\" x2=\"10\" y2=\"17\"/><line x1=\"14\" y1=\"11\" x2=\"14\" y2=\"17\"/>",
  "recycle-sack": "<path d=\"M8 7a4 4 0 0 1 8 0v1h2a2 2 0 0 1 2 2c0 6-3 11-8 11S4 16 4 10a2 2 0 0 1 2-2h2V7z\"/><path d=\"M10 5l4 4M14 5l-4 4\"/>",
  "leaf": "<path d=\"M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z\"/><path d=\"M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12\"/>",
  "box": "<path d=\"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z\"/><polyline points=\"3.27 6.96 12 12.01 20.73 6.96\"/><line x1=\"12\" y1=\"22.08\" x2=\"12\" y2=\"12\"/>",
  "sunset": "<path d=\"M17 18a5 5 0 0 0-10 0M12 9v4M9 11l3 3 3-3M2 18h20M2 22h20\"/>",
  "sunrise": "<path d=\"M17 18a5 5 0 0 0-10 0M12 2v8M9 5l3-3 3 3M2 18h20M2 22h20\"/>",
  "chart-bar": "<line x1=\"18\" y1=\"20\" x2=\"18\" y2=\"10\"/><line x1=\"12\" y1=\"20\" x2=\"12\" y2=\"4\"/><line x1=\"6\" y1=\"20\" x2=\"6\" y2=\"14\"/><path d=\"M3 20h18\"/>",
  "radar": "<path d=\"M12 2a10 10 0 0 1 10 10M12 6a6 6 0 0 1 6 6M12 10a2 2 0 0 1 2 2\"/><circle cx=\"12\" cy=\"12\" r=\"1.5\" fill=\"currentColor\"/><path d=\"M12 12l5-5M2 21h20\"/>",
  "cyclone": "<path d=\"M12.8 3.4a8 8 0 0 1 7.8 7.8c0 3.2-1.9 6-4.6 7.3M11.2 20.6a8 8 0 0 1-7.8-7.8c0-3.2 1.9-6 4.6-7.3M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0\"/>",
  "battery-full": "<rect x=\"1\" y=\"6\" width=\"18\" height=\"12\" rx=\"2\"/><path d=\"M23 10v4M5 10v4M9 10v4M13 10v4M17 10v4\"/>",
  "battery-medium": "<rect x=\"1\" y=\"6\" width=\"18\" height=\"12\" rx=\"2\"/><path d=\"M23 10v4M5 10v4M9 10v4M13 10v4\"/>",
  "battery-low": "<rect x=\"1\" y=\"6\" width=\"18\" height=\"12\" rx=\"2\"/><path d=\"M23 10v4M5 10v4M9 10v4\"/>",
  "battery-critical": "<rect x=\"1\" y=\"6\" width=\"18\" height=\"12\" rx=\"2\"/><path d=\"M23 10v4M5 10v4\"/><line x1=\"12\" y1=\"9\" x2=\"12\" y2=\"12\"/><circle cx=\"12\" cy=\"15\" r=\"0.8\" fill=\"currentColor\"/>",
  "check": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m8 12 3 3 6-6\"/>",
  "alert-triangle": "<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z\"/><line x1=\"12\" y1=\"9\" x2=\"12\" y2=\"13\"/><line x1=\"12\" y1=\"17\" x2=\"12.01\" y2=\"17\"/>",
  "plus": "<line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"/><line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"/>",
  "minus": "<line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"/>",
  "weather-sunny": "<circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41\"/>",
  "weather-clear-night": "<path d=\"M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z\"/><path d=\"M19 4v3M20.5 5.5h-3\" stroke-width=\"1.3\"/>",
  "weather-cloudy": "<path d=\"M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z\"/>",
  "weather-partlycloudy": "<circle cx=\"9\" cy=\"9\" r=\"3.5\"/><path d=\"M9 2v1.5M9 14.5V16M2 9h1.5M14.5 9H16M4.05 4.05l1.06 1.06M12.89 12.89l1.06 1.06M4.05 13.95l1.06-1.06M12.89 5.11l1.06-1.06\"/><path d=\"M20 17.5a3.5 3.5 0 0 0-2.5-5.85 4.5 4.5 0 0 0-8.2 2.35H9a3 3 0 0 0 0 6h11a3.5 3.5 0 0 0 0-7z\" fill=\"var(--bg-glass, rgba(255,255,255,0.7))\"/>",
  "weather-partlycloudy-night": "<path d=\"M13 3a5 5 0 0 0-4.5 7.2A4.5 4.5 0 0 0 5 15h1a3 3 0 0 0 0 6h11a3.5 3.5 0 0 0 2.5-5.9 4.5 4.5 0 0 0-4.5-5.1c-.3 0-.6.03-.9.08A4.98 4.98 0 0 0 13 3z\"/>",
  "weather-rainy": "<path d=\"M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25\"/><path d=\"M8 19v3M12 18v4M16 19v3\"/>",
  "weather-pouring": "<path d=\"M20 14.58A5 5 0 0 0 18 5h-1.26A8 8 0 1 0 4 13.25\"/><path d=\"M7 16l-2 5M12 16l-2 5M17 16l-2 5M10 18l-1 4M15 18l-1 4\"/>",
  "weather-lightning": "<path d=\"M19 16.9A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25\"/><polygon points=\"13 11 9 17 13 17 11 23 17 15 13 15 15 11\" fill=\"currentColor\"/>",
  "weather-lightning-rainy": "<path d=\"M19 14.9A5 5 0 0 0 18 5h-1.26A8 8 0 1 0 4 13.25\"/><polygon points=\"12 11 9 16 12 16 10 21 15 14 12 14 13 11\" fill=\"currentColor\"/><path d=\"M6 18l-1 3M17 18l-1 3\"/>",
  "weather-snowy": "<path d=\"M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25\"/><path d=\"M8 19v.01M8 22v.01M12 18v.01M12 21v.01M16 19v.01M16 22v.01\" stroke-width=\"2.8\"/>",
  "weather-snowy-rainy": "<path d=\"M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25\"/><path d=\"M8 18l-1 3M16 18l-1 3\"/><path d=\"M12 18v.01M12 21v.01\" stroke-width=\"2.8\"/>",
  "weather-windy": "<path d=\"M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z\"/><path d=\"M4 22h14a2 2 0 1 0-1.4-3.4M2 19h10a2 2 0 1 1-1.4 3.4\"/>",
  "weather-fog": "<path d=\"M4 14h16M2 18h20M5 22h14M17.5 11H9a6 6 0 1 1 5.8-8h1.2a4 4 0 1 1 1.5 8Z\"/>",
  "weather-hail": "<path d=\"M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25\"/><circle cx=\"8\" cy=\"20\" r=\"1.5\" fill=\"currentColor\"/><circle cx=\"12\" cy=\"19\" r=\"1.5\" fill=\"currentColor\"/><circle cx=\"16\" cy=\"21\" r=\"1.5\" fill=\"currentColor\"/>",
  "plane": "<path d=\"M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z\"/>",
  "restart": "<path d=\"M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16\"/>",
  "eye": "<path d=\"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>",
  "zap": "<polygon points=\"13 2 3 14 12 14 11 22 21 10 12 10 13 2\"/>",
  "percent": "<line x1=\"19\" y1=\"5\" x2=\"5\" y2=\"19\"/><circle cx=\"6.5\" cy=\"6.5\" r=\"2.5\"/><circle cx=\"17.5\" cy=\"17.5\" r=\"2.5\"/>",
  "sliders": "<line x1=\"4\" y1=\"21\" x2=\"4\" y2=\"14\"/><line x1=\"4\" y1=\"10\" x2=\"4\" y2=\"3\"/><line x1=\"12\" y1=\"21\" x2=\"12\" y2=\"12\"/><line x1=\"12\" y1=\"8\" x2=\"12\" y2=\"3\"/><line x1=\"20\" y1=\"21\" x2=\"20\" y2=\"16\"/><line x1=\"20\" y1=\"12\" x2=\"20\" y2=\"3\"/><line x1=\"1\" y1=\"14\" x2=\"7\" y2=\"14\"/><line x1=\"9\" y1=\"8\" x2=\"15\" y2=\"8\"/><line x1=\"17\" y1=\"16\" x2=\"23\" y2=\"16\"/>",
  "wifi": "<path d=\"M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01\"/>",
  "activity": "<polyline points=\"22 12 18 12 15 21 9 3 6 12 2 12\"/>",
  "washing-machine": "<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"3\"/><circle cx=\"12\" cy=\"13\" r=\"5\"/><circle cx=\"12\" cy=\"13\" r=\"2.5\" fill=\"currentColor\" opacity=\"0.4\"/><circle cx=\"7\" cy=\"6\" r=\"1\" fill=\"currentColor\"/><circle cx=\"10\" cy=\"6\" r=\"1\" fill=\"currentColor\"/>",
  "speaker": "<rect x=\"4\" y=\"2\" width=\"16\" height=\"20\" rx=\"2\"/><circle cx=\"12\" cy=\"14\" r=\"4\"/><circle cx=\"12\" cy=\"6\" r=\"1.5\" fill=\"currentColor\"/>",
  "power": "<path d=\"M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10\"/>"
};
  }

  _icon(name, { size = 20, cls = '', color = '', fill = 'none', stroke = 'currentColor', strokeWidth = 2, style = '' } = {}) {
    const content = VisionGlassDashboard.ICONS[name] || VisionGlassDashboard.ICONS['alert-triangle'] || '';
    const sizeStyle = size ? `width:${size}px;height:${size}px;` : '';
    const colorStyle = color ? `color:${color};` : '';
    return `<svg class="vg-icon vg-icon-${name} ${cls}" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" style="${sizeStyle}${colorStyle}${style}">${content}</svg>`;
  }

  _getWeatherIcon(state, size = 24, cls = '') {
    const map = {
      'clear-night': 'weather-clear-night',
      'cloudy': 'weather-cloudy',
      'fog': 'weather-fog',
      'hail': 'weather-hail',
      'lightning': 'weather-lightning',
      'lightning-rainy': 'weather-lightning-rainy',
      'partlycloudy': 'weather-partlycloudy',
      'pouring': 'weather-pouring',
      'rainy': 'weather-rainy',
      'snowy': 'weather-snowy',
      'snowy-rainy': 'weather-snowy-rainy',
      'sunny': 'weather-sunny',
      'windy': 'weather-windy',
      'windy-variant': 'weather-windy',
      'exceptional': 'alert-triangle'
    };
    const iconName = map[state] || 'weather-partlycloudy';
    return this._icon(iconName, { size, cls: 'icon-weather ' + cls });
  }

  _resolveEntityIcon(entityId, stateObj) {
    if (!entityId) return this._icon('activity', { size: 16 });

    const attrs = (stateObj && stateObj.attributes) || {};
    const devClass = (attrs.device_class || '').toLowerCase();
    const unit = (attrs.unit_of_measurement || '').toLowerCase();
    const eId = entityId.toLowerCase();
    const fn = (attrs.friendly_name || '').toLowerCase();
    const val = stateObj ? String(stateObj.state).toLowerCase() : '';

    // 1. Device classes
    if (devClass === 'temperature') return this._icon('thermometer', { size: 16, cls: 'icon-temp' });
    if (devClass === 'humidity') return this._icon('droplet', { size: 16, cls: 'icon-humidity' });
    if (devClass === 'illuminance') return this._icon('lux', { size: 16, cls: 'icon-lux' });
    if (devClass === 'battery') {
      const num = parseFloat(val);
      if (!isNaN(num) && num < 20) return this._icon('battery-critical', { size: 16, color: '#ef4444' });
      if (!isNaN(num) && num <= 40) return this._icon('battery-low', { size: 16, color: '#f59e0b' });
      return this._icon('battery-full', { size: 16, cls: 'icon-battery' });
    }
    if (devClass === 'motion' || devClass === 'occupancy' || devClass === 'presence') {
      return this._icon(val === 'on' ? 'motion' : 'motion-idle', { size: 16, cls: 'icon-security' });
    }
    if (devClass === 'window') return this._icon(val === 'on' ? 'window-open' : 'window', { size: 16, cls: 'icon-climate' });
    if (devClass === 'door' || devClass === 'garage_door') return this._icon(val === 'on' ? 'door-open' : 'door', { size: 16, cls: 'icon-security' });
    if (devClass === 'lock') return this._icon(val === 'locked' ? 'lock-closed' : 'lock-open', { size: 16, cls: 'icon-security' });
    if (devClass === 'power' || devClass === 'energy' || devClass === 'current' || devClass === 'voltage') {
      return this._icon('zap', { size: 16, color: '#f59e0b' });
    }
    if (devClass === 'signal_strength') return this._icon('wifi', { size: 16, cls: 'icon-stats' });
    if (devClass === 'restart') return this._icon('restart', { size: 16, cls: 'icon-switch' });

    // 2. Units of measurement
    if (unit.includes('°c') || unit.includes('°f') || unit === 'k') {
      return this._icon('thermometer', { size: 16, cls: 'icon-temp' });
    }
    if (unit === 'lx' || unit === 'lux') {
      return this._icon('lux', { size: 16, cls: 'icon-lux' });
    }
    if (unit === '%') {
      if (eId.includes('batt') || fn.includes('batt')) {
        const num = parseFloat(val);
        if (!isNaN(num) && num < 20) return this._icon('battery-critical', { size: 16, color: '#ef4444' });
        if (!isNaN(num) && num <= 40) return this._icon('battery-low', { size: 16, color: '#f59e0b' });
        return this._icon('battery-full', { size: 16, cls: 'icon-battery' });
      }
      if (eId.includes('feucht') || eId.includes('hum') || fn.includes('feucht') || fn.includes('hum')) {
        return this._icon('droplet', { size: 16, cls: 'icon-humidity' });
      }
      return this._icon('percent', { size: 16, cls: 'icon-stats' });
    }
    if (unit === 'w' || unit === 'kw' || unit === 'kwh' || unit === 'v' || unit === 'a') {
      return this._icon('zap', { size: 16, color: '#f59e0b' });
    }
    if (unit === 'km/h' || unit === 'm/s') {
      return this._icon('wind', { size: 16, cls: 'icon-weather' });
    }
    if (unit === 'db' || unit === 'dbm') {
      return this._icon('wifi', { size: 16, cls: 'icon-stats' });
    }
    if (unit === 's' || unit === 'min' || unit === 'h' || unit === 'd') {
      return this._icon('clock', { size: 16, cls: 'icon-calendar' });
    }

    // 3. Name & Entity ID keywords
    const text = `${eId} ${fn}`;
    if (text.includes('indikator') || text.includes('indicator') || text.includes('led')) {
      return this._icon('eye', { size: 16, cls: 'icon-light' });
    }
    if (text.includes('restart') || text.includes('neustart') || text.includes('reboot')) {
      return this._icon('restart', { size: 16, cls: 'icon-switch' });
    }
    if (text.includes('tastensperre') || text.includes('childlock') || text.includes('kindersicherung') || text.includes('sperre')) {
      return this._icon('lock-closed', { size: 16, cls: 'icon-security' });
    }
    if (text.includes('urlaub') || text.includes('holiday') || text.includes('vacation')) {
      return this._icon('plane', { size: 16, cls: 'icon-stats' });
    }
    if (text.includes('sommer') || text.includes('summer')) {
      return this._icon('sun', { size: 16, cls: 'icon-sun' });
    }
    if (text.includes('winter') || text.includes('frost')) {
      return this._icon('weather-snowy', { size: 16, cls: 'icon-weather' });
    }
    if (text.includes('fenster') || text.includes('window')) {
      return this._icon(val === 'on' ? 'window-open' : 'window', { size: 16, cls: 'icon-climate' });
    }
    if (text.includes('tür') || text.includes('door') || text.includes('tor')) {
      return this._icon(val === 'on' ? 'door-open' : 'door', { size: 16, cls: 'icon-security' });
    }
    if (text.includes('beweg') || text.includes('motion') || text.includes('präsenz') || text.includes('presence')) {
      return this._icon(val === 'on' ? 'motion' : 'motion-idle', { size: 16, cls: 'icon-security' });
    }
    if (text.includes('komfort') || text.includes('comfort') || text.includes('heizen') || text.includes('heat')) {
      return this._icon('flame', { size: 16, cls: 'icon-climate' });
    }
    if (text.includes('eco') || text.includes('spar') || text.includes('leaf')) {
      return this._icon('leaf', { size: 16, cls: 'icon-battery' });
    }
    if (text.includes('temperatur') || text.includes('temp') || text.includes('wärme')) {
      return this._icon('thermometer', { size: 16, cls: 'icon-temp' });
    }
    if (text.includes('feucht') || text.includes('humidity')) {
      return this._icon('droplet', { size: 16, cls: 'icon-humidity' });
    }
    if (text.includes('hellig') || text.includes('lux') || text.includes('illuminance')) {
      return this._icon('lux', { size: 16, cls: 'icon-lux' });
    }
    if (text.includes('batterie') || text.includes('battery')) {
      return this._icon('battery-medium', { size: 16, cls: 'icon-battery' });
    }
    if (text.includes('waschmaschine') || text.includes('washing')) {
      return this._icon('washing-machine', { size: 16, cls: 'icon-switch' });
    }
    if (text.includes('multimedia') || text.includes('tv') || text.includes('fernseh') || text.includes('shield')) {
      return this._icon('tv', { size: 16, cls: 'icon-media' });
    }
    if (text.includes('receiver') || text.includes('denon') || text.includes('subwoofer') || text.includes('audio') || text.includes('sound') || text.includes('lautsprecher')) {
      return this._icon('speaker', { size: 16, cls: 'icon-media' });
    }
    if (text.includes('plan') || text.includes('zeit') || text.includes('time') || text.includes('dauer') || text.includes('nächste')) {
      return this._icon('clock', { size: 16, cls: 'icon-calendar' });
    }
    if (text.includes('sensitiv') || text.includes('empfind') || text.includes('distanz') || text.includes('bereich') || text.includes('modus') || text.includes('mode')) {
      return this._icon('sliders', { size: 16, cls: 'icon-stats' });
    }

    // 4. Domain Fallbacks
    if (eId.startsWith('light.')) return this._icon('light', { size: 16, cls: 'icon-light' });
    if (eId.startsWith('switch.')) return this._icon('power', { size: 16, cls: 'icon-switch' });
    if (eId.startsWith('climate.')) return this._icon('climate', { size: 16, cls: 'icon-climate' });
    if (eId.startsWith('media_player.')) return this._icon('music', { size: 16, cls: 'icon-media' });
    if (eId.startsWith('binary_sensor.')) return this._icon(val === 'on' ? 'check' : 'activity', { size: 16, cls: 'icon-security' });
    if (eId.startsWith('sensor.')) return this._icon('activity', { size: 16, cls: 'icon-stats' });

    return this._icon('activity', { size: 16 });
  }

  static getStubConfig() {
    return {
      title: 'Wohnung Andreas',
      auto_day_night: true,
      weather_entity: 'weather.hannover_hannover',
      lock_entity: 'lock.wohnungsschloss',
      all_lights_entity: 'light.licht_wohnung',
      washing_machine_switch: 'switch.switch_washingmachine_smartplug_switch',
      washing_machine_power: 'sensor.switch_washingmachine_smartplug_power',
      rooms: [
        {
          id: 'wohnzimmer',
          name: 'Wohnzimmer',
          picture: '/api/image/serve/7a6844ff1859c2ea6c7ee3ac46a32765/512x512',
          temp_entity: 'sensor.bewegungsmelder_wohnzimmer_temperatur',
          target_temp_entity: 'input_number.wohnzimmer_komfort_temperatur',
          climate_entity: 'climate.better_thermostat_wohnzimmer',
          humidity_entity: 'sensor.prasenzmelder_wohnzimmer_humidity',
          illuminance_entity: 'sensor.prasenzmelder_wohnzimmer_illuminance',
          light_entity: 'light.livingroom',
          media_entity: 'media_player.denon_avr_x3300w_3',
          switch_entity: 'switch.switch_livingroom_tv_smartplug_switch',
          multimedia_switch: 'switch.livingroom_multimedia',
          presence_entity: 'binary_sensor.living_room_occupied',
          window_entity: 'binary_sensor.fensterkontakte_wohnzimmer'
        },
        {
          id: 'arbeitszimmer',
          name: 'Arbeitszimmer',
          picture: '/api/image/serve/bafdc8f4ac59eaa27f9821b007af5cd1/512x512',
          temp_entity: 'sensor.bewegungsmelder_arbeitszimmer_temperatur',
          target_temp_entity: 'input_number.arbeitszimmer_komfort_temperatur',
          climate_entity: 'climate.better_thermostat_arbeitszimmer',
          humidity_entity: 'sensor.prasenzmelder_arbeitszimmer_humidity',
          illuminance_entity: 'sensor.prasenzmelder_arbeitszimmer_illuminance',
          light_entity: 'light.light_studyroom_tomada',
          media_entity: 'media_player.arbeitszimmer_andreas_echo_show',
          switch_entity: 'switch.switch_denon_659190_smartplug_switch',
          presence_entity: 'binary_sensor.studyroom_occupied',
          window_entity: 'binary_sensor.fensterkontakt_arbeitszimmerfenster_contact'
        },
        {
          id: 'schlafzimmer',
          name: 'Schlafzimmer',
          picture: '/api/image/serve/c232467fe87758f1622031d777e965b5/512x512',
          temp_entity: 'sensor.bewegungsmelder_schlafzimmer_temperature',
          target_temp_entity: 'input_number.schlafzimmer_komfort_temperatur',
          climate_entity: 'climate.better_thermostat_schlafzimmer',
          humidity_entity: 'sensor.prasenzmelder_schlafzimmer_humidity',
          illuminance_entity: 'sensor.prasenzmelder_schlafzimmer_illuminance',
          light_entity: 'light.schlafzimmerlicht',
          media_entity: 'media_player.schlafzimmer_tv_2',
          switch_entity: 'switch.switch_bedroom_tv_smartplug_switch',
          presence_entity: 'binary_sensor.bedroom_occupied',
          window_entity: 'binary_sensor.fensterkontakt_schlafzimmer_contact'
        },
        {
          id: 'kuche',
          name: 'Küche',
          picture: '/api/image/serve/f95a2403326e0cbe78953ca98a93f878/512x512',
          temp_entity: 'sensor.bewegungsmelder_kuche_temperature',
          target_temp_entity: 'input_number.kuche_komfort_temperatur',
          climate_entity: 'climate.better_thermostat_kuche',
          humidity_entity: 'sensor.prasenzmelder_kuche_humidity',
          illuminance_entity: 'sensor.prasenzmelder_kuche_illuminance',
          light_entity: 'light.light_kitchen_tomada',
          presence_entity: 'binary_sensor.kuche_occupied',
          window_entity: 'binary_sensor.fensterkontakt_kuche_contact'
        },
        {
          id: 'badezimmer',
          name: 'Badezimmer',
          picture: '/api/image/serve/ce49978764aa284ddd21dfaac0f671f1/512x512',
          temp_entity: 'sensor.badezimmer_temperatur',
          target_temp_entity: 'input_number.bad_komfort_temperatur',
          climate_entity: 'climate.better_thermostat_badezimmer',
          humidity_entity: 'sensor.prasenzmelder_badezimmer_humidity',
          illuminance_entity: 'sensor.prasenzmelder_badezimmer_illuminance',
          light_entity: 'light.light_bathroom_tomada',
          switch_entity: 'switch.switch_washingmachine_smartplug_switch',
          presence_entity: 'binary_sensor.bathroom_occupied'
        },
        {
          id: 'flur',
          name: 'Flur',
          picture: '/api/image/serve/bb7e01034e0b85ae2cfb23fa422d252e/512x512',
          temp_entity: 'sensor.bewegungsmelder_flur_temperatur',
          target_temp_entity: 'input_number.flur_komfort_temperatur',
          climate_entity: 'climate.better_thermostat_flur',
          humidity_entity: 'sensor.prasenzmelder_flur_humidity',
          illuminance_entity: 'sensor.prasenzmelder_flur_illuminance',
          light_entity: 'light.light_hallway_tomada',
          lock_entity: 'lock.wohnungsschloss',
          presence_entity: 'binary_sensor.hallway_occupied',
          window_entity: 'binary_sensor.fensterkontakt_flur_contact'
        },
        {
          id: 'wohnung',
          name: 'Wohnung',
          picture: '/api/image/serve/d7e8a8480c1bd844b145b8b423af0c83/512x512',
          temp_entity: 'input_number.wohnung_eco_temperatur',
          light_entity: 'light.licht_wohnung',
          lock_entity: 'lock.wohnungsschloss'
        },
        {
          id: 'kellerraum',
          name: 'Kellerraum',
          icon: 'inventory_2'
        },
        {
          id: 'umwelt',
          name: 'Umwelt',
          picture: '/api/image/serve/274cec0148ef03e0dfb0acbaea469392/512x512',
          weather_entity: 'weather.hannover_hannover'
        }
      ]
    };
  }

  setConfig(config) {
    const stub = VisionGlassDashboard.getStubConfig();
    this._config = {
      title: config.title || stub.title,
      auto_day_night: config.auto_day_night !== false,
      weather_entity: config.weather_entity || stub.weather_entity,
      lock_entity: config.lock_entity || stub.lock_entity,
      all_lights_entity: config.all_lights_entity || stub.all_lights_entity,
      washing_machine_switch: config.washing_machine_switch || stub.washing_machine_switch,
      washing_machine_power: config.washing_machine_power || stub.washing_machine_power,
      rooms: (config.rooms && config.rooms.length > 0) ? config.rooms.map(r => {
        const sr = stub.rooms.find(s => s.id === r.id) || {};
        return {
          ...sr,
          ...r,
          humidity_entity: r.humidity_entity || sr.humidity_entity,
          illuminance_entity: r.illuminance_entity || sr.illuminance_entity
        };
      }) : stub.rooms
    };
    this._render();
    this._initialRenderDone = true;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._initialRenderDone) return;
    if (this._updateRaf) return;
    this._updateRaf = requestAnimationFrame(() => {
      this._updateRaf = null;
      this._updateAll();
    });
  }

  _getLang() {
    if (this._lang) return this._lang;
    if (this._hass) {
      const hl = this._hass.language || (this._hass.locale && this._hass.locale.language) || '';
      if (hl.toLowerCase().startsWith('en')) return 'en';
    }
    return 'de';
  }

  _t(key) {
    const lang = this._getLang();
    return (VisionGlassDashboard.I18N[lang] && VisionGlassDashboard.I18N[lang][key]) ||
           (VisionGlassDashboard.I18N['de'] && VisionGlassDashboard.I18N['de'][key]) ||
           key;
  }

  _toggleLang() {
    const cur = this._getLang();
    this._lang = cur === 'de' ? 'en' : 'de';
    try {
      localStorage.setItem('vg_dashboard_lang', this._lang);
    } catch (e) {}
    this._render();
    this._updateAll();
  }

  _fireMoreInfo(entityId) {
    const event = new CustomEvent('hass-more-info', {
      bubbles: true,
      composed: true,
      detail: { entityId }
    });
    this.dispatchEvent(event);
  }

  connectedCallback() {
    this._startClock();
  }

  disconnectedCallback() {
    if (this._timer) clearInterval(this._timer);
  }

  _startClock() {
    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => {
      const clockEl = this.shadowRoot.getElementById('liveClock');
      if (clockEl) {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
    }, 1000);
  }

  _isDaytime() {
    if (this._userThemeOverride) {
      return this._userThemeOverride === 'light';
    }
    if (this._hass && this._hass.states['sun.sun']) {
      return this._hass.states['sun.sun'].state === 'above_horizon';
    }
    const hour = new Date().getHours();
    return hour >= 7 && hour < 18;
  }

  _toggleDayNight() {
    const isCurrentlyLight = this._isDaytime();
    this._userThemeOverride = isCurrentlyLight ? 'dark' : 'light';
    this._applyThemeClass();
  }

  _applyThemeClass() {
    const root = this.shadowRoot.querySelector('.dashboard-root');
    if (!root) return;
    const isDay = this._isDaytime();
    if (isDay) {
      root.classList.remove('theme-dark');
      root.classList.add('theme-light');
    } else {
      root.classList.remove('theme-light');
      root.classList.add('theme-dark');
    }
    const themeBtn = this.shadowRoot.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.innerHTML = isDay ? this._icon('sun', { size: 18, cls: 'icon-sun' }) : this._icon('moon', { size: 18, cls: 'icon-moon' });
      themeBtn.title = isDay ? 'Tagmodus aktiv (Klick für Nachtmodus)' : 'Nachtmodus aktiv (Klick für Tagmodus)';
    }
  }

  _callService(domain, service, data) {
    if (!this._hass) return;
    this._hass.callService(domain, service, data);
  }

  _openPersonModal(targetEntityId) {
    this._activeModal = { type: 'person', targetEntityId };
    const modalEl = this.shadowRoot.getElementById('modalContainer');
    if (modalEl) {
      modalEl.classList.remove('hidden');
      this._renderPersonModal(targetEntityId);
    }
  }

  _renderPersonModal(targetEntityId) {
    const body = this.shadowRoot.getElementById('modalBody');
    const title = this.shadowRoot.getElementById('modalTitle');
    if (!body || !title || !this._hass) return;

    title.innerHTML = `${this._icon('user', { size: 22, cls: 'icon-security', style: 'margin-right:8px;' })} ${this._t('residents')}`;

    const persons = [
      { id: 'person.andreas', name: 'Andreas', defaultPic: '/api/image/serve/77e1449b97a3b297a3359c4bf2290f43/512x512', batteryEntity: 'sensor.andreas_smartphone_battery' },
      { id: 'person.shanty', name: 'Shanty', defaultPic: null, batteryEntity: 'sensor.shanty_smartphone_battery' }
    ];

    body.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:16px;">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;">
          ${persons.map(p => {
            const stateObj = this._hass.states[p.id];
            const isHome = stateObj && stateObj.state === 'home';
            const statusLabel = isHome ? this._t('home') : (stateObj ? (stateObj.state === 'not_home' ? this._t('away') : stateObj.state) : this._t('unknown'));
            const pic = (stateObj && stateObj.attributes && stateObj.attributes.entity_picture) || p.defaultPic;
            const batObj = p.batteryEntity ? this._hass.states[p.batteryEntity] : null;
            const batVal = batObj ? batObj.state : null;
            const isTarget = targetEntityId === p.id;

            return `
              <div class="control-row" style="flex-direction:column;align-items:stretch;gap:12px;padding:16px;${isTarget ? 'border:1.5px solid var(--accent);' : ''}">
                <div style="display:flex;align-items:center;gap:12px;">
                  ${pic ? `
                    <img src="${pic}" style="width:54px;height:54px;border-radius:50%;object-fit:cover;border:2px solid ${isHome ? '#10b981' : 'rgba(255,255,255,0.4)'};box-shadow:0 3px 10px rgba(0,0,0,0.15);" alt="${p.name}" />
                  ` : `
                    <div style="width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,#c084fc,#8b5cf6);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;color:#fff;border:2px solid ${isHome ? '#10b981' : 'rgba(255,255,255,0.4)'};">
                      ${p.name.charAt(0)}
                    </div>
                  `}
                  <div style="flex:1;">
                    <div style="font-size:17px;font-weight:700;">${p.name}</div>
                    <div style="display:flex;align-items:center;gap:6px;margin-top:2px;font-size:13px;color:var(--text-secondary);">
                      <span class="chip-dot ${isHome ? 'dot-green' : 'dot-gray'}"></span>
                      <strong style="color:${isHome ? '#10b981' : 'var(--text-secondary)'};">${statusLabel}</strong>
                    </div>
                  </div>
                </div>

                <div style="display:flex;align-items:center;justify-content:space-between;padding-top:8px;border-top:1px solid var(--border-subtle);font-size:12px;color:var(--text-secondary);">
                  <span>Entity: <code>${p.id}</code></span>
                  ${batVal != null ? `
                    <span style="display:inline-flex;align-items:center;gap:4px;">
                      ${this._icon('battery-full', { size: 14, cls: 'icon-battery' })} ${batVal}%
                    </span>
                  ` : ''}
                </div>

                <button class="btn-micro btn-moreinfo" data-entity="${p.id}" style="width:100%;text-align:center;margin-top:4px;">
                  ${this._t('device_details')}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    body.querySelectorAll('.btn-moreinfo').forEach(btn => {
      btn.onclick = () => {
        const eid = btn.getAttribute('data-entity');
        if (eid) this._fireMoreInfo(eid);
      };
    });
  }

  _openRoomModal(room) {
    this._activeModal = { type: 'room', room };
    const modalEl = this.shadowRoot.getElementById('modalContainer');
    if (modalEl) {
      modalEl.classList.remove('hidden');
      this._renderRoomModal(room);
    }
  }

  async _fetchWeatherForecast() {
    if (!this._hass) return;
    const wEntity = this._config.weather_entity || 'weather.hannover_hannover';

    if (this._hass.connection && this._hass.connection.subscribeMessage && !this._forecastSubscribed) {
      this._forecastSubscribed = true;
      try {
        this._hass.connection.subscribeMessage(
          (msg) => {
            if (msg && msg.forecast) {
              this._hourlyForecast = msg.forecast;
              if (this._activeModal === 'weather') this._updateForecastCarousels();
            }
          },
          { type: 'weather/subscribe_forecast', forecast_type: 'hourly', entity_id: wEntity }
        );
      } catch (e) {}

      try {
        this._hass.connection.subscribeMessage(
          (msg) => {
            if (msg && msg.forecast) {
              this._dailyForecast = msg.forecast;
              if (this._activeModal === 'weather') this._updateForecastCarousels();
            }
          },
          { type: 'weather/subscribe_forecast', forecast_type: 'daily', entity_id: wEntity }
        );
      } catch (e) {}
    }

    if ((!this._hourlyForecast || this._hourlyForecast.length === 0) && this._hass.callWS) {
      try {
        const hourlyRes = await this._hass.callWS({
          type: 'call_service',
          domain: 'weather',
          service: 'get_forecasts',
          service_data: { type: 'hourly', entity_id: wEntity },
          return_response: true
        });
        if (hourlyRes && hourlyRes.response && hourlyRes.response[wEntity]) {
          this._hourlyForecast = hourlyRes.response[wEntity].forecast || [];
        }
      } catch (e) {}

      try {
        const dailyRes = await this._hass.callWS({
          type: 'call_service',
          domain: 'weather',
          service: 'get_forecasts',
          service_data: { type: 'daily', entity_id: wEntity },
          return_response: true
        });
        if (dailyRes && dailyRes.response && dailyRes.response[wEntity]) {
          this._dailyForecast = dailyRes.response[wEntity].forecast || [];
        }
      } catch (e) {}

      if (this._activeModal === 'weather') {
        this._updateForecastCarousels();
      }
    }
  }

  _updateWeatherModalValues() {
    const body = this.shadowRoot.getElementById('modalBody');
    if (!body || !this._hass) return;
    const w = this._hass.states['weather.hannover_hannover'];
    if (!w) return;
    const a = w.attributes;

    const tempEl = body.querySelector('#weatherHeroTemp');
    if (tempEl && a.temperature != null) tempEl.textContent = `${a.temperature}°C`;

    const condEl = body.querySelector('#weatherHeroCond');
    if (condEl) condEl.textContent = `${this._translateWeather(w.state)} • Hannover`;

    const emojiEl = body.querySelector('#weatherHeroEmoji');
    if (emojiEl) emojiEl.innerHTML = this._getWeatherIcon(w.state, 58);

    const humEl = body.querySelector('#weatherMetricHum');
    if (humEl && a.humidity != null) humEl.textContent = `${a.humidity}%`;

    const pressEl = body.querySelector('#weatherMetricPress');
    if (pressEl && a.pressure != null) pressEl.textContent = `${a.pressure} hPa`;

    const windEl = body.querySelector('#weatherMetricWind');
    if (windEl && a.wind_speed != null) windEl.textContent = `${a.wind_speed} km/h (${a.wind_bearing})`;

    const visEl = body.querySelector('#weatherMetricVis');
    if (visEl && a.visibility != null) visEl.textContent = `${a.visibility} km`;
  }

  _updateAlarmoModalValues() {
    const body = this.shadowRoot.getElementById('modalBody');
    if (!body || !this._hass) return;
    const alarmo = this._hass.states['alarm_control_panel.alarmo'];
    const st = alarmo ? alarmo.state : 'disarmed';
    const stMap = {
      'disarmed': { label: this._t('deactivated'), color: '#10b981', iconName: 'shield-check', bg: 'rgba(16, 185, 129, 0.15)' },
      'armed_home': { label: this._t('armed_home'), color: '#0284c7', iconName: 'home', bg: 'rgba(2, 132, 199, 0.15)' },
      'armed_away': { label: this._t('armed_away'), color: '#f59e0b', iconName: 'user-walk', bg: 'rgba(245, 158, 11, 0.15)' },
      'armed_night': { label: this._t('armed_night'), color: '#6366f1', iconName: 'moon', bg: 'rgba(99, 102, 241, 0.15)' },
      'arming': { label: this._t('arming'), color: '#f59e0b', iconName: 'clock', bg: 'rgba(245, 158, 11, 0.2)' },
      'triggered': { label: this._t('alarm_triggered'), color: '#ef4444', iconName: 'siren', bg: 'rgba(239, 68, 68, 0.25)' }
    };
    const info = stMap[st] || { label: st, color: '#94a3b8', iconName: 'shield', bg: 'rgba(255,255,255,0.1)' };
    const banner = body.querySelector('#alarmoStatusBanner');
    if (banner) {
      banner.style.background = info.bg;
      banner.style.borderColor = info.color;
      const lbl = banner.querySelector('#alarmoStatusLabel');
      if (lbl) {
        lbl.style.color = info.color;
        lbl.textContent = info.label;
      }
      const iconWrap = banner.querySelector('#alarmoStatusIcon');
      if (iconWrap) {
        iconWrap.innerHTML = this._icon(info.iconName, { size: 36, color: info.color });
      }
    }
    const btnD = body.querySelector('#btnAlarmoDisarm');
    if (btnD) btnD.className = `btn-micro ${st === 'disarmed' ? 'active-green' : ''}`;
    const btnH = body.querySelector('#btnAlarmoHome');
    if (btnH) btnH.className = `btn-micro ${st === 'armed_home' ? 'active' : ''}`;
    const btnA = body.querySelector('#btnAlarmoAway');
    if (btnA) btnA.className = `btn-micro ${st === 'armed_away' ? 'active-amber' : ''}`;
    const btnN = body.querySelector('#btnAlarmoNight');
    if (btnN) btnN.className = `btn-micro ${st === 'armed_night' ? 'active' : ''}`;
  }

  _updateRoomModalValues() {
    const body = this.shadowRoot.getElementById('modalBody');
    if (!body || !this._hass || !this._activeModal || !this._activeModal.room) return;
    const room = this._activeModal.room;
    const lightObj = room.light_entity ? this._hass.states[room.light_entity] : null;
    const climateObj = room.climate_entity ? this._hass.states[room.climate_entity] : null;
    const isLightOn = lightObj && lightObj.state === 'on';
    const isHeat = climateObj && climateObj.state === 'heat';
    const lToggle = body.querySelector('#roomModalLightToggle');
    if (lToggle) {
      lToggle.className = `toggle-pill ${isLightOn ? 'active-amber' : ''}`;
      lToggle.textContent = isLightOn ? this._t('on') : this._t('off');
    }
    const hToggle = body.querySelector('#roomModalHeatToggle');
    if (hToggle) {
      hToggle.className = `btn-micro ${isHeat ? 'active' : ''}`;
      hToggle.textContent = isHeat ? this._t('heat') : this._t('off');
    }
    const mmToggle = body.querySelector('#roomModalMultimediaToggle');
    if (mmToggle) {
      const mmObj = (room.multimedia_switch && this._hass.states[room.multimedia_switch]) || (room.id === 'wohnzimmer' && this._hass.states['switch.livingroom_multimedia']);
      const isMmOn = mmObj && mmObj.state === 'on';
      mmToggle.className = `toggle-pill ${isMmOn ? 'active-blue' : ''}`;
      mmToggle.textContent = isMmOn ? this._t('on') : this._t('off');
    }
  }

  _renderHourlyItemsHtml(hourlyItems) {
    if (!hourlyItems || hourlyItems.length === 0) {
      return '<div class="control-row" style="font-size:13px;color:var(--text-secondary);">Stündliche Wettervorhersage wird geladen...</div>';
    }
    return hourlyItems.map((item, hIdx) => {
      const d = new Date(item.datetime);
      const timeStr = hIdx === 0 ? this._t('now') : d.toLocaleTimeString(this._getLang() === 'en' ? 'en-US' : 'de-DE', { hour: '2-digit', minute: '2-digit' });
      const weatherIcon = this._getWeatherIcon(item.condition, 24);
      const t = Math.round(item.temperature);
      const rain = item.precipitation != null && item.precipitation > 0 ? `${item.precipitation.toFixed(1)} mm` : '';
      return `
        <div class="control-row" style="flex-direction:column;align-items:center;gap:6px;min-width:68px;padding:10px 8px;flex-shrink:0;">
          <span style="font-size:12px;font-weight:600;color:var(--text-secondary);">${timeStr}</span>
          <span style="display:inline-flex;align-items:center;justify-content:center;height:24px;">${weatherIcon}</span>
          <span style="font-size:15px;font-weight:700;">${t}°</span>
          ${rain ? `<span style="font-size:10px;color:#38bdf8;font-weight:600;display:inline-flex;align-items:center;gap:2px;">${this._icon('droplet', { size: 10, cls: 'icon-humidity' })}${rain}</span>` : '<span style="font-size:10px;color:transparent;">•</span>'}
        </div>
      `;
    }).join('');
  }

  _renderDailyItemsHtml(dailyItems) {
    if (!dailyItems || dailyItems.length === 0) {
      return '<div class="control-row" style="font-size:13px;color:var(--text-secondary);">Tagesvorhersage wird geladen...</div>';
    }
    return dailyItems.map((item, idx) => {
      const d = new Date(item.datetime);
      const dayName = idx === 0 ? this._t('today') : (idx === 1 ? this._t('tomorrow') : d.toLocaleDateString(this._getLang() === 'en' ? 'en-US' : 'de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' }));
      const weatherIcon = this._getWeatherIcon(item.condition, 22);
      const condText = this._translateWeather(item.condition);
      const maxT = Math.round(item.temperature);
      const minT = item.templow != null ? Math.round(item.templow) : (maxT - 4);
      const rain = item.precipitation ? `${item.precipitation.toFixed(1)} mm` : '0 mm';
      return `
        <div class="control-row" style="padding:10px 16px;display:grid;grid-template-columns:105px 36px 1fr 140px;align-items:center;gap:10px;">
          <span style="font-weight:700;font-size:14px;">${dayName}</span>
          <span style="display:inline-flex;align-items:center;justify-content:center;height:22px;">${weatherIcon}</span>
          <span style="font-size:13px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${condText}</span>
          <div style="display:flex;align-items:center;gap:8px;justify-content:flex-end;">
            <span style="font-size:12px;color:var(--text-secondary);width:26px;text-align:right;">${minT}°</span>
            <div style="width:48px;height:4px;border-radius:2px;background:linear-gradient(90deg, #38bdf8, #f59e0b);"></div>
            <span style="font-size:14px;font-weight:700;width:26px;">${maxT}°</span>
            <span style="font-size:11px;color:#38bdf8;font-weight:600;margin-left:4px;display:inline-flex;align-items:center;gap:2px;">${this._icon('droplet', { size: 11, cls: 'icon-humidity' })}${rain}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  _updateForecastCarousels() {
    const body = this.shadowRoot.getElementById('modalBody');
    if (!body) return;

    const hourlyContainer = body.querySelector('#weatherHourlyContainer');
    if (hourlyContainer) {
      const hourlyItems = (this._hourlyForecast && this._hourlyForecast.length > 0)
        ? this._hourlyForecast.slice(0, 24)
        : [];
      hourlyContainer.innerHTML = this._renderHourlyItemsHtml(hourlyItems);
    }

    const dailyContainer = body.querySelector('#weatherDailyContainer');
    if (dailyContainer) {
      const dailyItems = (this._dailyForecast && this._dailyForecast.length > 0)
        ? this._dailyForecast.slice(0, 7)
        : [];
      dailyContainer.innerHTML = this._renderDailyItemsHtml(dailyItems);
    }
  }

  async _fetchStatsHistory() {
    if (!this._hass || !this._hass.callWS) return;
    const entities = [
      'sensor.bewegungsmelder_wohnzimmer_temperatur',
      'sensor.prasenzmelder_wohnzimmer_temperature',
      'sensor.wohnzimmer_front_temperatur',
      'sensor.fritz_smart_thermo_301_3_temperatur',
      'sensor.ir_wohnzimmer_temperature',
      'sensor.bewegungsmelder_arbeitszimmer_temperatur',
      'sensor.prasenzmelder_arbeitszimmer_temperature',
      'sensor.arbeitszimmer_temperatur',
      'sensor.badezimmer_temperatur',
      'sensor.bewegungsmelder_bad_temperatur',
      'sensor.prasenzmelder_badezimmer_temperature',
      'sensor.bewegungsmelder_kuche_temperature',
      'sensor.prasenzmelder_kuche_temperature',
      'sensor.kuche_temperatur',
      'sensor.schlafzimmer_temperatur',
      'sensor.prasenzmelder_schlafzimmer_temperature',
      'sensor.flur_temperatur',
      'sensor.bewegungsmelder_flur_temperatur',
      'sensor.prasenzmelder_flur_temperature',
      'sensor.prasenzmelder_arbeitszimmer_illuminance',
      'sensor.prasenzmelder_badezimmer_illuminance',
      'sensor.prasenzmelder_flur_illuminance',
      'sensor.bewegungsmelder_wohnzimmer_illuminance',
      'sensor.prasenzmelder_wohnzimmer_illuminance',
      'sensor.bewegungsmelder_kuche_illuminance',
      'sensor.prasenzmelder_kuche_illuminance',
      'sensor.prasenzmelder_schlafzimmer_illuminance',
      'light.livingroom',
      'light.light_studyroom_tomada',
      'light.light_bathroom_tomada',
      'light.light_kitchen_tomada',
      'light.schlafzimmerlicht',
      'light.light_hallway_tomada',
      'climate.better_thermostat_wohnzimmer',
      'climate.better_thermostat_arbeitszimmer',
      'climate.better_thermostat_badezimmer',
      'climate.better_thermostat_kuche',
      'climate.better_thermostat_schlafzimmer',
      'climate.better_thermostat_flur',
      'binary_sensor.living_room_occupied',
      'binary_sensor.studyroom_occupied',
      'binary_sensor.bathroom_occupied',
      'binary_sensor.kuche_occupied',
      'binary_sensor.bedroom_occupied',
      'binary_sensor.hallway_occupied',
      'sensor.wohnzimmer_better_thermostat_wohnzimmer_heizleistung',
      'sensor.arbeitszimmer_better_thermostat_arbeitszimmer_heizleistung',
      'sensor.badezimmer_better_thermostat_badezimmer_heizleistung',
      'sensor.kuche_better_thermostat_kuche_heizleistung',
      'sensor.schlafzimmer_better_thermostat_schlafzimmer_heizleistung',
      'sensor.flur_better_thermostat_flur_heizleistung',
      'sensor.wohnungsschloss_batterie',
      'sensor.wohnzimmer_front_batterie',
      'sensor.wohnzimmer_balkon_batterie',
      'sensor.arbeitszimmer_batterie',
      'sensor.badezimmer_batterie',
      'sensor.kuche_batterie',
      'sensor.schlafzimmer_batterie',
      'sensor.flur_batterie',
      'sensor.turkontakt_hausture_battery',
      'sensor.prasenzmelder_arbeitszimmer_battery',
      'sensor.prasenzmelder_wohnzimmer_battery',
      'sensor.prasenzmelder_kuche_battery',
      'sensor.prasenzmelder_flur_battery',
      'sensor.prasenzmelder_badezimmer_battery',
      'sensor.prasenzmelder_schlafzimmer_battery'
    ];

    try {
      const startTime = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const res = await this._hass.callWS({
        type: 'history/history_during_period',
        start_time: startTime,
        entity_ids: entities,
        minimal_response: true,
        significant_changes_only: false
      });
      if (res) {
        Object.keys(res).forEach(eId => {
          const list = res[eId];
          if (Array.isArray(list)) {
            this._statsHistory[eId] = list;
          }
        });
        this._statsHistoryFetched = true;
        if (this._activeModal === 'stats') {
          this._renderModalContent('stats');
        }
      }
    } catch (e) {}
  }

  _renderMultiLineSvgChart({ series, stateOverlay = null, width = 780, height = 320, unit = '°C', timeSpanHours = 24 }) {
    const padL = 52;
    const padR = 24;
    const padT = 24;
    const padB = 40;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const tEnd = Date.now();
    const tStart = tEnd - (timeSpanHours * 3600 * 1000);
    const timeSpan = tEnd - tStart;

    const hasOverlay = Boolean(stateOverlay && stateOverlay.entity_id);
    const trackH = hasOverlay ? 12 : 0;
    const trackY = hasOverlay ? (padT + plotH - trackH - 2) : 0;
    const curvePlotH = hasOverlay ? (plotH - trackH - 12) : plotH;

    let overlayBandsMarkup = '';
    let overlayTimelineMarkup = '';
    let activeIntervalCount = 0;

    if (hasOverlay) {
      const hist = this._statsHistory && this._statsHistory[stateOverlay.entity_id];
      const curStateObj = this._hass && this._hass.states[stateOverlay.entity_id];
      const curStateVal = curStateObj ? curStateObj.state : null;

      const checkActive = (s) => {
        if (!s) return false;
        const sl = String(s).toLowerCase();
        if (stateOverlay.type === 'light') {
          return sl === 'on';
        } else if (stateOverlay.type === 'climate') {
          return sl === 'heat' || sl === 'heating' || (!isNaN(parseFloat(sl)) && parseFloat(sl) > 0);
        }
        return sl === 'on' || sl === 'heat' || sl === 'true';
      };

      let rawEvents = [];
      if (Array.isArray(hist) && hist.length > 0) {
        hist.forEach(h => {
          const t = h.lu ? (h.lu * 1000) : (h.last_updated ? new Date(h.last_updated).getTime() : null);
          if (t) rawEvents.push({ t, s: h.s });
        });
      }
      rawEvents.sort((a, b) => a.t - b.t);

      let segments = [];
      let lastT = tStart;
      let lastS = rawEvents.length > 0 ? rawEvents[0].s : curStateVal;

      rawEvents.forEach(ev => {
        if (ev.t > tStart && ev.t < tEnd) {
          segments.push({ t0: lastT, t1: ev.t, active: checkActive(lastS), state: lastS });
          lastT = ev.t;
          lastS = ev.s;
        } else if (ev.t <= tStart) {
          lastS = ev.s;
        }
      });
      segments.push({ t0: lastT, t1: tEnd, active: checkActive(curStateVal || lastS), state: curStateVal || lastS });

      const activeColor = stateOverlay.activeColor || '#f59e0b';

      segments.forEach(seg => {
        const x1 = padL + Math.max(0, Math.min(plotW, ((seg.t0 - tStart) / timeSpan) * plotW));
        const x2 = padL + Math.max(0, Math.min(plotW, ((seg.t1 - tStart) / timeSpan) * plotW));
        const bandW = Math.max(1, x2 - x1);

        if (seg.active) {
          activeIntervalCount++;
          overlayBandsMarkup += `<rect x="${x1.toFixed(1)}" y="${padT}" width="${bandW.toFixed(1)}" height="${curvePlotH.toFixed(1)}" fill="${activeColor}" opacity="0.12" />`;
          overlayTimelineMarkup += `<rect x="${x1.toFixed(1)}" y="${trackY.toFixed(1)}" width="${bandW.toFixed(1)}" height="${trackH}" rx="2" fill="${activeColor}" opacity="0.95" />`;
        } else {
          overlayTimelineMarkup += `<rect x="${x1.toFixed(1)}" y="${trackY.toFixed(1)}" width="${bandW.toFixed(1)}" height="${trackH}" rx="2" fill="rgba(255,255,255,0.06)" />`;
        }
      });
    }

    let allVals = [];
    const processedSeries = series.map((s) => {
      let rawPoints = [];
      const historyList = this._statsHistory && this._statsHistory[s.id];
      if (Array.isArray(historyList) && historyList.length > 0) {
        historyList.forEach(item => {
          const v = parseFloat(item.s);
          if (!isNaN(v)) {
            const t = item.lu ? (item.lu * 1000) : (item.last_updated ? new Date(item.last_updated).getTime() : null);
            if (t) rawPoints.push({ t, v });
          }
        });
      }

      const curValNum = parseFloat(s.currentVal);
      if (!isNaN(curValNum)) {
        rawPoints.push({ t: tEnd, v: curValNum });
      }

      rawPoints.sort((a, b) => a.t - b.t);

      if (rawPoints.length < 2) {
        const fallbackV = !isNaN(curValNum) ? curValNum : 21.0;
        rawPoints = [
          { t: tStart, v: fallbackV },
          { t: tStart + timeSpan * 0.33, v: fallbackV },
          { t: tStart + timeSpan * 0.66, v: fallbackV },
          { t: tEnd, v: fallbackV }
        ];
      } else {
        if (rawPoints[0].t > tStart) {
          rawPoints.unshift({ t: tStart, v: rawPoints[0].v });
        }
      }

      rawPoints.forEach(p => allVals.push(p.v));
      return {
        ...s,
        points: rawPoints
      };
    });

    if (allVals.length === 0) allVals = [20, 22];
    let minVal = Math.min(...allVals);
    let maxVal = Math.max(...allVals);
    if (minVal === maxVal) {
      minVal -= 1;
      maxVal += 1;
    }

    const isIntUnit = unit.trim() === 'lx' || unit.trim() === '%';
    const valSpan = maxVal - minVal;
    const minBound = isIntUnit ? Math.max(0, minVal - (valSpan * 0.05)) : (minVal - (valSpan * 0.08));
    const maxBound = maxVal + (valSpan * 0.08);
    const rangeBound = maxBound - minBound;

    const gridRows = [0, 0.33, 0.66, 1].map(ratio => {
      const y = padT + (curvePlotH * ratio);
      const val = maxBound - (ratio * rangeBound);
      const label = isIntUnit ? Math.round(val) + unit : val.toFixed(1).replace('.', ',') + unit;
      return { y, label };
    });

    const timeTicks = [
      { ratio: 0, label: '-24h' },
      { ratio: 0.25, label: '-18h' },
      { ratio: 0.5, label: '-12h' },
      { ratio: 0.75, label: '-6h' },
      { ratio: 1, label: 'Jetzt' }
    ];

    let seriesMarkup = '';
    processedSeries.forEach((s) => {
      const pts = s.points.map(p => {
        const x = padL + Math.max(0, Math.min(plotW, ((p.t - tStart) / timeSpan) * plotW));
        const y = padT + curvePlotH - (((p.v - minBound) / rangeBound) * curvePlotH);
        return { x, y, v: p.v };
      });

      if (pts.length < 2) return;

      let pathD = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        const mx = (p0.x + p1.x) / 2;
        pathD += ` C ${mx.toFixed(1)} ${p0.y.toFixed(1)}, ${mx.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
      }

      const lastPt = pts[pts.length - 1];
      const curDisplay = s.currentVal != null ? `${s.currentVal}${unit}` : '';

      seriesMarkup += `
        <path d="${pathD}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" />
        <circle cx="${lastPt.x.toFixed(1)}" cy="${lastPt.y.toFixed(1)}" r="4" fill="${s.color}" stroke="#ffffff" stroke-width="1.8" />
        ${curDisplay ? `<text x="${(lastPt.x - 6).toFixed(1)}" y="${Math.max(padT + 12, lastPt.y - 7).toFixed(1)}" text-anchor="end" fill="${s.color}" font-size="10.5px" font-weight="700">${curDisplay}</text>` : ''}
      `;
    });

    const svg = `
      <svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto;overflow:visible;" preserveAspectRatio="xMidYMid meet">
        ${overlayBandsMarkup}

        ${gridRows.map(g => `
          <line x1="${padL}" y1="${g.y.toFixed(1)}" x2="${padL + plotW}" y2="${g.y.toFixed(1)}" stroke="rgba(255,255,255,0.12)" stroke-dasharray="3,3" stroke-width="1" />
          <text x="${padL - 8}" y="${(g.y + 3).toFixed(1)}" text-anchor="end" fill="var(--text-secondary)" font-size="10px" font-weight="600">${g.label}</text>
        `).join('')}

        ${hasOverlay ? `
          <line x1="${padL}" y1="${(trackY - 4).toFixed(1)}" x2="${padL + plotW}" y2="${(trackY - 4).toFixed(1)}" stroke="rgba(255,255,255,0.12)" stroke-width="1" />
          <text x="${padL - 8}" y="${(trackY + trackH - 2).toFixed(1)}" text-anchor="end" fill="var(--text-secondary)" font-size="9.5px" font-weight="700">${stateOverlay.label || 'Status'}</text>
          ${overlayTimelineMarkup}
        ` : ''}

        ${timeTicks.map(t => {
          const x = padL + (plotW * t.ratio);
          return `
            <line x1="${x.toFixed(1)}" y1="${padT + plotH}" x2="${x.toFixed(1)}" y2="${padT + plotH + 5}" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
            <text x="${x.toFixed(1)}" y="${(padT + plotH + 18).toFixed(1)}" text-anchor="${t.ratio === 0 ? 'start' : (t.ratio === 1 ? 'end' : 'middle')}" fill="var(--text-secondary)" font-size="10.5px" font-weight="600">${t.label}</text>
          `;
        }).join('')}

        ${seriesMarkup}
      </svg>
    `;

    return {
      svg,
      min: isIntUnit ? Math.round(minVal) : minVal.toFixed(1).replace('.', ','),
      max: isIntUnit ? Math.round(maxVal) : maxVal.toFixed(1).replace('.', ','),
      hasOverlay,
      activeIntervalCount
    };
  }

  async _fetchClimateHistory() {
    if (!this._hass || !this._hass.callWS) return;
    const entities = [
      'sensor.bewegungsmelder_wohnzimmer_temperatur',
      'sensor.bewegungsmelder_arbeitszimmer_temperatur',
      'sensor.bewegungsmelder_schlafzimmer_temperature',
      'sensor.bewegungsmelder_kuche_temperature',
      'sensor.badezimmer_temperatur',
      'sensor.bewegungsmelder_flur_temperatur'
    ];
    try {
      const startTime = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const res = await this._hass.callWS({
        type: 'history/history_during_period',
        start_time: startTime,
        entity_ids: entities,
        minimal_response: true,
        significant_changes_only: false
      });
      if (res) {
        Object.keys(res).forEach(eId => {
          const list = res[eId];
          if (Array.isArray(list)) {
            const vals = list.map(item => parseFloat(item.s)).filter(v => !isNaN(v) && v > 5 && v < 40);
            if (vals.length > 0) {
              this._tempHistory[eId] = vals;
            }
          }
        });
        if (this._activeModal === 'climate') {
          this._renderModalContent('climate');
        }
      }
    } catch (e) {
      // Graceful fallback
    }
  }

  _generateSvgCurve(vals, currentVal, width = 290, height = 55) {
    if (!vals || vals.length < 2) {
      const c = parseFloat(currentVal) || 21.0;
      vals = [c - 0.4, c - 0.2, c + 0.1, c - 0.1, c + 0.3, c];
    }
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = (max - min) === 0 ? 1 : (max - min);
    const padY = 8;
    const innerH = height - (padY * 2);

    const stepX = width / (vals.length - 1);
    const pts = vals.map((v, i) => {
      const x = i * stepX;
      const y = height - padY - ((v - min) / range * innerH);
      return { x, y };
    });

    let pathD = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const mx = (p0.x + p1.x) / 2;
      pathD += ` C ${mx.toFixed(1)} ${p0.y.toFixed(1)}, ${mx.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }

    const lastPt = pts[pts.length - 1];
    const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

    return {
      pathD,
      areaD,
      lastPt,
      min: min.toFixed(1).replace('.', ','),
      max: max.toFixed(1).replace('.', ',')
    };
  }

  _renderRoomModal(room) {
    const body = this.shadowRoot.getElementById('modalBody');
    const title = this.shadowRoot.getElementById('modalTitle');
    if (!body || !title || !this._hass) return;

    title.textContent = `${room.name} – Raumübersicht & Geräte`;

    const lightObj = room.light_entity ? this._hass.states[room.light_entity] : null;
    const climateObj = room.climate_entity ? this._hass.states[room.climate_entity] : null;
    const presObj = room.presence_entity ? this._hass.states[room.presence_entity] : null;
    const winObj = room.window_entity ? this._hass.states[room.window_entity] : null;
    const switchObj = room.switch_entity ? this._hass.states[room.switch_entity] : null;
    const mediaObj = room.media_entity ? this._hass.states[room.media_entity] : null;
    const tempObj = room.temp_entity ? this._hass.states[room.temp_entity] : null;

    const curTemp = climateObj && climateObj.attributes.current_temperature
      ? climateObj.attributes.current_temperature
      : (tempObj ? tempObj.state : '--');

    const isLightOn = lightObj && lightObj.state === 'on';
    const isHeat = climateObj && climateObj.state === 'heat';
    const isPres = presObj && presObj.state === 'on';
    const isWinOpen = winObj && winObj.state === 'on';

    const roomSlug = room.id.toLowerCase();
    const slugAliases = {
      'wohnzimmer': ['livingroom', 'living_room', 'denon', 'shield', 'subwoofer'],
      'arbeitszimmer': ['studyroom', 'study_room', 'office'],
      'badezimmer': ['bathroom', 'bath'],
      'kuche': ['kitchen'],
      'schlafzimmer': ['bedroom'],
      'flur': ['hallway']
    };
    const aliases = slugAliases[roomSlug] || [];

    const mmSwitchObj = (room.multimedia_switch && this._hass.states[room.multimedia_switch]) || (room.id === 'wohnzimmer' && this._hass.states['switch.livingroom_multimedia']) || null;

    const otherSwitches = [];
    const otherSensors = [];

    // Humidity & Illuminance for Room Overview
    const humEntity = room.humidity_entity || `sensor.prasenzmelder_${roomSlug}_humidity` || `sensor.ir_${roomSlug}_humidity`;
    const humObj = humEntity && this._hass.states[humEntity];
    const curHum = humObj && humObj.state && !isNaN(parseFloat(humObj.state)) ? Math.round(parseFloat(humObj.state)) : null;

    const luxEntity = room.illuminance_entity || `sensor.prasenzmelder_${roomSlug}_illuminance` || `sensor.bewegungsmelder_${roomSlug}_illuminance`;
    const luxObj = luxEntity && this._hass.states[luxEntity];
    const curLux = luxObj && luxObj.state && !isNaN(parseFloat(luxObj.state)) ? Math.round(parseFloat(luxObj.state)) : null;

    if (!this._roomEntitiesCache[roomSlug]) {
      const matchSwitches = [];
      const matchSensors = [];
      Object.keys(this._hass.states).forEach(eId => {
        if (eId === room.light_entity || eId === room.climate_entity || eId === room.presence_entity || eId === room.window_entity || eId === room.switch_entity || eId === room.media_entity || eId === room.temp_entity || eId === 'switch.livingroom_multimedia' || (room.multimedia_switch && eId === room.multimedia_switch)) return;

        const eIdLower = eId.toLowerCase();
        const fnLower = ((this._hass.states[eId].attributes && this._hass.states[eId].attributes.friendly_name) || '').toLowerCase();

        const matches = eIdLower.includes(roomSlug) || fnLower.includes(roomSlug) || fnLower.includes(room.name.toLowerCase()) || aliases.some(a => eIdLower.includes(a));

        if (matches) {
          if (eId.startsWith('switch.') || eId.startsWith('light.')) {
            matchSwitches.push(eId);
          } else if (eId.startsWith('sensor.') || eId.startsWith('binary_sensor.')) {
            matchSensors.push(eId);
          }
        }
      });
      this._roomEntitiesCache[roomSlug] = { switches: matchSwitches, sensors: matchSensors };
    }

    const cached = this._roomEntitiesCache[roomSlug];
    cached.switches.forEach(id => {
      if (this._hass.states[id]) otherSwitches.push({ id, state: this._hass.states[id] });
    });
    cached.sensors.forEach(id => {
      if (this._hass.states[id]) otherSensors.push({ id, state: this._hass.states[id] });
    });

    body.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.06);border:1px solid var(--border-subtle);border-radius:20px;padding:16px 20px;flex-wrap:wrap;gap:12px;">
          <div>
            <div style="font-size:22px;font-weight:700;">${room.name}</div>
            <div style="font-size:13px;color:var(--text-secondary);margin-top:3px;">
              ${isPres ? this._icon('motion', { size: 14, cls: 'icon-security', style: 'margin-right:4px;' }) + ' Person anwesend' : this._icon('motion-idle', { size: 14, style: 'margin-right:4px;' }) + ' Keine Bewegung'} • ${isWinOpen ? this._icon('window-open', { size: 14, cls: 'icon-climate', style: 'margin-right:4px;' }) + ' Fenster geöffnet' : this._icon('window', { size: 14, cls: 'icon-security', style: 'margin-right:4px;' }) + ' Fenster geschlossen'}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <div style="text-align:center;padding:6px 12px;background:rgba(255,255,255,0.06);border:1px solid var(--border-subtle);border-radius:14px;">
              <div style="font-size:19px;font-weight:700;color:var(--accent);">${curTemp}°C</div>
              <div style="font-size:11px;color:var(--text-secondary);display:flex;align-items:center;justify-content:center;gap:3px;margin-top:1px;">${this._icon('thermometer', { size: 11, cls: 'icon-temp' })} Temp</div>
            </div>
            ${curHum != null ? `
              <div style="text-align:center;padding:6px 12px;background:rgba(255,255,255,0.06);border:1px solid var(--border-subtle);border-radius:14px;">
                <div style="font-size:19px;font-weight:700;color:#0284c7;">${curHum}%</div>
                <div style="font-size:11px;color:var(--text-secondary);display:flex;align-items:center;justify-content:center;gap:3px;margin-top:1px;">${this._icon('droplet', { size: 11, cls: 'icon-humidity' })} Feuchte</div>
              </div>
            ` : ''}
            ${curLux != null ? `
              <div style="text-align:center;padding:6px 12px;background:rgba(255,255,255,0.06);border:1px solid var(--border-subtle);border-radius:14px;">
                <div style="font-size:19px;font-weight:700;color:#f59e0b;">${curLux} lx</div>
                <div style="font-size:11px;color:var(--text-secondary);display:flex;align-items:center;justify-content:center;gap:3px;margin-top:1px;">${this._icon('lux', { size: 11, cls: 'icon-lux' })} Lux</div>
              </div>
            ` : ''}
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;">
          ${mmSwitchObj ? `
            <div class="control-row" style="background:rgba(56,189,248,0.14);border:1px solid rgba(56,189,248,0.4);grid-column:1/-1;">
              <div>
                <div style="font-weight:700;font-size:15px;color:var(--text-primary);display:flex;align-items:center;gap:6px;">${this._icon('tv', { size: 16, cls: 'icon-switch' })} Multimedia-Zentrale</div>
                <div style="font-size:12px;color:var(--text-secondary);">Schaltet TV, AVR-Receiver, Subwoofer & Shield zusammen • ${mmSwitchObj.state === 'on' ? 'Aktiv' : 'Aus'}</div>
              </div>
              <button class="toggle-pill ${mmSwitchObj.state === 'on' ? 'active-blue' : ''}" id="roomModalMultimediaToggle">
                ${mmSwitchObj.state === 'on' ? 'EIN' : 'AUS'}
              </button>
            </div>
          ` : ''}

          ${room.light_entity ? `
            <div class="control-row">
              <div>
                <div style="font-weight:600;font-size:14px;display:flex;align-items:center;gap:6px;">${this._icon('light', { size: 16, cls: 'icon-light' })} Beleuchtung</div>
                <div style="font-size:12px;color:var(--text-secondary);">${isLightOn ? 'Eingeschaltet' : 'Ausgeschaltet'}</div>
              </div>
              <button class="toggle-pill ${isLightOn ? 'active-amber' : ''}" id="roomModalLightToggle">
                ${isLightOn ? 'EIN' : 'AUS'}
              </button>
            </div>
          ` : ''}

          ${room.climate_entity ? `
            <div class="control-row" style="flex-direction:column;align-items:stretch;gap:8px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:600;font-size:14px;display:flex;align-items:center;gap:6px;">${this._icon('climate', { size: 16, cls: 'icon-climate' })} Thermostat</span>
                <span style="font-size:13px;">Ziel: <strong style="color:var(--accent);">${climateObj ? climateObj.attributes.temperature : 21}°C</strong></span>
              </div>
              <div style="display:flex;justify-content:flex-end;gap:8px;">
                <button class="btn-step" id="roomModalTempMinus">-</button>
                <button class="btn-step" id="roomModalTempPlus">+</button>
                <button class="btn-micro ${isHeat ? 'active' : ''}" id="roomModalHeatToggle">
                  ${isHeat ? 'HEIZEN' : 'AUS'}
                </button>
              </div>
            </div>
          ` : ''}

          ${room.switch_entity ? `
            <div class="control-row">
              <div>
                <div style="font-weight:600;font-size:14px;display:flex;align-items:center;gap:6px;">${this._icon('plug', { size: 16, cls: 'icon-switch' })} ${(switchObj && switchObj.attributes.friendly_name) || 'Steckdose'}</div>
                <div style="font-size:12px;color:var(--text-secondary);">${switchObj && switchObj.state === 'on' ? 'Aktiv' : 'Aus'}</div>
              </div>
              <button class="toggle-pill ${switchObj && switchObj.state === 'on' ? 'active-blue' : ''}" id="roomModalSwitchToggle">
                ${switchObj && switchObj.state === 'on' ? 'EIN' : 'AUS'}
              </button>
            </div>
          ` : ''}

          ${room.media_entity ? `
            <div class="control-row">
              <div>
                <div style="font-weight:600;font-size:14px;display:flex;align-items:center;gap:6px;">${this._icon('music', { size: 16, cls: 'icon-media' })} ${(mediaObj && mediaObj.attributes.friendly_name) || 'Medien'}</div>
                <div style="font-size:12px;color:var(--text-secondary);">${mediaObj ? mediaObj.state : 'Aus'}</div>
              </div>
              <button class="btn-micro ${mediaObj && mediaObj.state === 'playing' ? 'active' : ''}" id="roomModalMediaToggle">
                ${mediaObj && mediaObj.state === 'playing' ? 'PAUSE' : 'PLAY'}
              </button>
            </div>
          ` : ''}
        </div>

        ${otherSwitches.length > 0 ? `
          <div style="font-size:14px;font-weight:700;margin-top:8px;">Weitere Geräte & Schalter in diesem Raum (${otherSwitches.length})</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;">
            ${otherSwitches.map(s => {
              const isOn = s.state && s.state.state === 'on';
              const name = (s.state && s.state.attributes.friendly_name) || s.id;
              const domain = s.id.split('.')[0];
              const icon = this._resolveEntityIcon(s.id, s.state);
              return `
                <div class="control-row" style="padding:10px 14px;min-height:48px;">
                  <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;margin-right:10px;">
                    <div style="flex-shrink:0;">${icon}</div>
                    <div style="font-size:13px;font-weight:600;line-height:1.3;word-break:break-word;white-space:normal;color:var(--text-primary);" title="${name}">${name}</div>
                  </div>
                  <button class="toggle-pill ${isOn ? 'active' : ''}" style="flex-shrink:0;" data-dyn-toggle="${s.id}" data-dyn-domain="${domain}">
                    ${isOn ? 'EIN' : 'AUS'}
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}

        ${otherSensors.length > 0 ? `
          <div style="font-size:14px;font-weight:700;margin-top:8px;">Messwerte & Sensoren (${otherSensors.length})</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px;">
            ${otherSensors.map(s => {
              const name = (s.state && s.state.attributes.friendly_name) || s.id;
              let rawVal = s.state ? s.state.state : '--';
              const unit = (s.state && s.state.attributes.unit_of_measurement) || '';

              let valDisplay = rawVal;
              let valColor = 'var(--text-primary)';
              if (rawVal === 'unknown') {
                valDisplay = 'Unbekannt';
                valColor = 'var(--text-secondary)';
              } else if (rawVal === 'unavailable') {
                valDisplay = 'Nicht verf.';
                valColor = 'var(--text-secondary)';
              } else if (rawVal === 'on') {
                valDisplay = 'AN';
                valColor = '#10b981';
              } else if (rawVal === 'off') {
                valDisplay = 'AUS';
                valColor = 'var(--text-secondary)';
              } else if (!isNaN(parseFloat(rawVal))) {
                const num = parseFloat(rawVal);
                valDisplay = `${Number.isInteger(num) ? num : num.toFixed(1)}${unit ? ' ' + unit : ''}`;
              } else if (unit) {
                valDisplay = `${rawVal} ${unit}`;
              }

              const icon = this._resolveEntityIcon(s.id, s.state);

              return `
                <div class="sensor-badge">
                  <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;margin-right:8px;">
                    <div style="flex-shrink:0;">${icon}</div>
                    <div style="font-size:12px;color:var(--text-secondary);line-height:1.25;word-break:break-word;white-space:normal;" title="${name}">${name}</div>
                  </div>
                  <div style="font-size:12px;font-weight:700;color:${valColor};white-space:nowrap;flex-shrink:0;text-align:right;">${valDisplay}</div>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}
      </div>
    `;

    if (body.querySelector('#roomModalMultimediaToggle')) {
      body.querySelector('#roomModalMultimediaToggle').onclick = () => {
        const mmId = room.multimedia_switch || 'switch.livingroom_multimedia';
        this._callService('switch', 'toggle', { entity_id: mmId });
      };
    }

    if (room.light_entity && body.querySelector('#roomModalLightToggle')) {
      body.querySelector('#roomModalLightToggle').onclick = () => {
        this._callService('light', 'toggle', { entity_id: room.light_entity });
      };
    }
    if (room.climate_entity && climateObj) {
      const curT = climateObj.attributes.temperature || 21.0;
      if (body.querySelector('#roomModalTempMinus')) {
        body.querySelector('#roomModalTempMinus').onclick = () => {
          this._callService('climate', 'set_temperature', { entity_id: room.climate_entity, temperature: curT - 0.5 });
        };
      }
      if (body.querySelector('#roomModalTempPlus')) {
        body.querySelector('#roomModalTempPlus').onclick = () => {
          this._callService('climate', 'set_temperature', { entity_id: room.climate_entity, temperature: curT + 0.5 });
        };
      }
      if (body.querySelector('#roomModalHeatToggle')) {
        body.querySelector('#roomModalHeatToggle').onclick = () => {
          this._callService('climate', 'set_hvac_mode', { entity_id: room.climate_entity, hvac_mode: isHeat ? 'off' : 'heat' });
        };
      }
    }
    if (room.switch_entity && body.querySelector('#roomModalSwitchToggle')) {
      body.querySelector('#roomModalSwitchToggle').onclick = () => {
        this._callService('switch', 'toggle', { entity_id: room.switch_entity });
      };
    }
    if (room.media_entity && body.querySelector('#roomModalMediaToggle')) {
      body.querySelector('#roomModalMediaToggle').onclick = () => {
        this._callService('media_player', 'media_play_pause', { entity_id: room.media_entity });
      };
    }
    body.querySelectorAll('[data-dyn-toggle]').forEach(b => {
      b.onclick = () => {
        const ent = b.getAttribute('data-dyn-toggle');
        const dom = b.getAttribute('data-dyn-domain');
        this._callService(dom, 'toggle', { entity_id: ent });
      };
    });
  }

  _updateAll() {
    if (!this._hass) return;
    this._applyThemeClass();

    // 1. Update Date & Header
    const now = new Date();
    const isEn = this._getLang() === 'en';
    const locale = isEn ? 'en-US' : 'de-DE';
    const dateTitleEl = this.shadowRoot.getElementById('dateTitle');
    if (dateTitleEl) {
      const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      dateTitleEl.textContent = now.toLocaleDateString(locale, options);
    }
    const subHeaderEl = this.shadowRoot.getElementById('subHeader');
    if (subHeaderEl) {
      subHeaderEl.textContent = `${this._t('welcome')} Andreas Pilz • ${this._t('smart_home_center')}`;
    }

    // 2. Update Weather
    const wEntity = this._config.weather_entity;
    if (wEntity && this._hass.states[wEntity]) {
      const w = this._hass.states[wEntity];
      const a = w.attributes;
      const temp = a.temperature;
      const weatherTempEl = this.shadowRoot.getElementById('weatherTemp');
      const weatherStateEl = this.shadowRoot.getElementById('weatherCondition');
      const weatherIconEl = this.shadowRoot.getElementById('weatherIcon');
      const chipWeather = this.shadowRoot.getElementById('chipWeather');

      if (weatherTempEl && temp !== undefined) weatherTempEl.textContent = `${temp}°C`;
      if (weatherStateEl) {
        weatherStateEl.textContent = this._translateWeather(w.state);
      }
      if (weatherIconEl) {
        weatherIconEl.innerHTML = this._getWeatherIcon(w.state, 30, 'icon-weather');
      }
      if (chipWeather && temp !== undefined) {
        chipWeather.innerHTML = `<span class="chip-dot dot-blue"></span> ${this._getWeatherIcon(w.state, 15, 'icon-weather')} Hannover ${temp}°C`;
      }

      // Sidebar Weather Mini Pills
      const sidebarMiniHum = this.shadowRoot.getElementById('sidebarMiniHum');
      if (sidebarMiniHum && a.humidity != null) sidebarMiniHum.innerHTML = `${this._icon('droplet', { size: 13, cls: 'icon-humidity', style: 'margin-right:3px;' })} ${a.humidity}%`;
      const sidebarMiniWind = this.shadowRoot.getElementById('sidebarMiniWind');
      if (sidebarMiniWind && a.wind_speed != null) sidebarMiniWind.innerHTML = `${this._icon('wind', { size: 13, cls: 'icon-weather', style: 'margin-right:3px;' })} ${a.wind_speed} km/h`;
      const sunObj = this._hass.states['sun.sun'];
      const sidebarMiniSun = this.shadowRoot.getElementById('sidebarMiniSun');
      if (sidebarMiniSun && sunObj && sunObj.attributes && sunObj.attributes.next_setting) {
        const d = new Date(sunObj.attributes.next_setting);
        sidebarMiniSun.innerHTML = `${this._icon('sunset', { size: 13, cls: 'icon-light', style: 'margin-right:3px;' })} ${d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
      }
    }

    // Sidebar Date
    const sidebarDateSub = this.shadowRoot.getElementById('sidebarDateSub');
    if (sidebarDateSub) {
      sidebarDateSub.textContent = now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'short' });
    }

    // Sidebar Glance Bar (active lights, open windows, door lock)
    const glanceEl = this.shadowRoot.getElementById('sidebarGlance');
    if (glanceEl) {
      let lightsOn = 0;
      let windowsOpen = 0;
      this._config.rooms.forEach(r => {
        if (r.id !== 'wohnung' && r.light_entity && this._hass.states[r.light_entity] && this._hass.states[r.light_entity].state === 'on') {
          lightsOn++;
        }
        if (r.window_entity && this._hass.states[r.window_entity] && this._hass.states[r.window_entity].state === 'on') {
          windowsOpen++;
        }
      });
      const lockS = this._hass.states['lock.wohnungsschloss'];
      const isLocked = lockS && lockS.state === 'locked';

      glanceEl.innerHTML = `
        <span class="sidebar-mini-pill" style="cursor:pointer;display:inline-flex;align-items:center;gap:4px;" id="glanceLights" title="${this._t('lighting')}">${this._icon('light', { size: 13, cls: 'icon-light' })} ${lightsOn} ${this._t('on')}</span>
        <span class="sidebar-mini-pill" style="cursor:pointer;display:inline-flex;align-items:center;gap:4px;${windowsOpen > 0 ? 'color:#f59e0b;font-weight:700;' : ''}" id="glanceWindows" title="${this._t('security')}">${windowsOpen > 0 ? `${this._icon('window-open', { size: 13, cls: 'icon-climate' })} ${windowsOpen} ${this._t('windows_open_count')}` : `${this._icon('window', { size: 13, cls: 'icon-security' })} ${this._t('windows_all_closed')}`}</span>
        <span class="sidebar-mini-pill" style="cursor:pointer;display:inline-flex;align-items:center;gap:4px;" id="glanceLock" title="${this._t('lock')}">${isLocked ? `${this._icon('lock-closed', { size: 13, cls: 'icon-security' })} ${this._t('door_locked_short')}` : `${this._icon('lock-open', { size: 13, cls: 'icon-light' })} ${this._t('door_unlocked_short')}`}</span>
      `;
      const gL = glanceEl.querySelector('#glanceLights');
      if (gL) gL.onclick = (e) => { e.stopPropagation(); this._openModal('lighting'); };
      const gW = glanceEl.querySelector('#glanceWindows');
      if (gW) gW.onclick = (e) => { e.stopPropagation(); this._openModal('security'); };
      const gLo = glanceEl.querySelector('#glanceLock');
      if (gLo) gLo.onclick = (e) => { e.stopPropagation(); this._openModal('security'); };
    }

    // 3. Update Chips
    // Persons Chips (with live profile pictures and status)
    const chipPA = this.shadowRoot.getElementById('chipPersonAndreas');
    if (chipPA) {
      const pA = this._hass.states['person.andreas'];
      const isHome = pA && pA.state === 'home';
      const pic = (pA && pA.attributes && pA.attributes.entity_picture) || '/api/image/serve/77e1449b97a3b297a3359c4bf2290f43/512x512';
      const statusText = isHome ? this._t('home') : (pA ? (pA.state === 'not_home' ? this._t('away') : pA.state) : this._t('unknown'));
      chipPA.innerHTML = `
        <img src="${pic}" class="chip-avatar ${isHome ? 'avatar-online' : 'avatar-offline'}" alt="Andreas" />
        <span class="chip-name">Andreas</span>
        <span class="chip-dot ${isHome ? 'dot-green' : 'dot-gray'}"></span>
        <span class="chip-status-text">${statusText}</span>
      `;
    }
    const chipPS = this.shadowRoot.getElementById('chipPersonShanty');
    if (chipPS) {
      const pS = this._hass.states['person.shanty'];
      const isHome = pS && pS.state === 'home';
      const pic = (pS && pS.attributes && pS.attributes.entity_picture) || null;
      const statusText = isHome ? this._t('home') : (pS ? (pS.state === 'not_home' ? this._t('away') : pS.state) : this._t('unknown'));
      chipPS.innerHTML = `
        ${pic ? `<img src="${pic}" class="chip-avatar ${isHome ? 'avatar-online' : 'avatar-offline'}" alt="Shanty" />`
              : `<div class="chip-avatar chip-avatar-initial" style="background: linear-gradient(135deg, #ec4899, #8b5cf6);">S</div>`}
        <span class="chip-name">Shanty</span>
        <span class="chip-dot ${isHome ? 'dot-green' : 'dot-gray'}"></span>
        <span class="chip-status-text">${statusText}</span>
      `;
    }

    // Lights Chip (Counts only individual rooms, strictly excluding Wohnung aggregate)
    const chipLights = this.shadowRoot.getElementById('chipLights');
    if (chipLights) {
      let activeLightsCount = 0;
      this._config.rooms.forEach(r => {
        if (r.id === 'wohnung' || r.light_entity === 'light.licht_wohnung' || r.light_entity === this._config.all_lights_entity) return;
        if (r.light_entity && this._hass.states[r.light_entity] && this._hass.states[r.light_entity].state === 'on') {
          activeLightsCount++;
        }
      });
      if (activeLightsCount > 0) {
        chipLights.innerHTML = `<span class="chip-dot dot-amber"></span> ${this._icon('light', { size: 14, cls: 'icon-light', style: 'margin-right:4px;' })} ${activeLightsCount} ${this._t('lights_on')}`;
      } else {
        chipLights.innerHTML = `<span class="chip-dot dot-gray"></span> ${this._icon('light', { size: 14, style: 'margin-right:4px;' })} ${this._t('lights_off')}`;
      }
    }

    // Climate Chip (calculate min - max across rooms)
    const chipClimate = this.shadowRoot.getElementById('chipClimate');
    if (chipClimate) {
      const climateIds = [
        'climate.better_thermostat_wohnzimmer',
        'climate.better_thermostat_arbeitszimmer',
        'climate.better_thermostat_schlafzimmer',
        'climate.better_thermostat_kuche',
        'climate.better_thermostat_badezimmer',
        'climate.better_thermostat_flur'
      ];
      let temps = [];
      climateIds.forEach(cid => {
        const cs = this._hass.states[cid];
        if (cs && cs.attributes && cs.attributes.current_temperature != null) {
          temps.push(parseFloat(cs.attributes.current_temperature));
        }
      });
      if (temps.length > 0) {
        const minT = Math.min(...temps).toFixed(1).replace('.', ',');
        const maxT = Math.max(...temps).toFixed(1).replace('.', ',');
        chipClimate.innerHTML = `<span class="chip-dot dot-blue"></span> ${this._icon('climate', { size: 14, cls: 'icon-climate', style: 'margin-right:4px;' })} ${this._t('climate')} ${minT} - ${maxT} °C`;
      } else {
        chipClimate.innerHTML = `<span class="chip-dot dot-blue"></span> ${this._icon('climate', { size: 14, cls: 'icon-climate', style: 'margin-right:4px;' })} ${this._t('climate')} 22°C`;
      }
    }

    // Lock & Door Chip (3 states)
    const lockEntity = this._config.lock_entity || 'lock.wohnungsschloss';
    const chipLock = this.shadowRoot.getElementById('chipLock');
    if (chipLock) {
      const lockObj = this._hass.states[lockEntity];
      const doorObj = this._hass.states['binary_sensor.turkontakt_hausture_contact'];
      const isLocked = lockObj && lockObj.state === 'locked';
      const isDoorOpen = doorObj && doorObj.state === 'on';

      if (isDoorOpen) {
        chipLock.innerHTML = `<span class="chip-dot dot-amber"></span> ${this._icon('door-open', { size: 14, cls: 'icon-climate', style: 'margin-right:4px;' })} ${this._t('door_open')}`;
      } else if (!isLocked) {
        chipLock.innerHTML = `<span class="chip-dot dot-amber"></span> ${this._icon('lock-open', { size: 14, cls: 'icon-light', style: 'margin-right:4px;' })} ${this._t('door_closed_unlocked')}`;
      } else {
        chipLock.innerHTML = `<span class="chip-dot dot-green"></span> ${this._icon('lock-closed', { size: 14, cls: 'icon-security', style: 'margin-right:4px;' })} ${this._t('door_closed_locked')}`;
      }
    }

    // Alarmo Chip
    const chipAlarmo = this.shadowRoot.getElementById('chipAlarmo');
    if (chipAlarmo) {
      const al = this._hass.states['alarm_control_panel.alarmo'];
      const ast = al ? al.state : 'disarmed';
      if (ast === 'disarmed') {
        chipAlarmo.innerHTML = `<span class="chip-dot dot-green"></span> ${this._icon('shield-check', { size: 14, cls: 'icon-security', style: 'margin-right:4px;' })} ${this._t('alarmo')}: ${this._t('deactivated')}`;
      } else if (ast === 'triggered') {
        chipAlarmo.innerHTML = `<span class="chip-dot dot-amber"></span> ${this._icon('siren', { size: 14, cls: 'icon-temp', style: 'margin-right:4px;' })} ${this._t('alarmo')}: ${this._t('alarm_triggered')}`;
      } else {
        chipAlarmo.innerHTML = `<span class="chip-dot dot-blue"></span> ${this._icon('shield', { size: 14, cls: 'icon-alarmo', style: 'margin-right:4px;' })} ${this._t('alarmo')}: ${this._t('armed_away')}`;
      }
    }

    // 4. Update Room Cards
    this._config.rooms.forEach((room, idx) => {
      this._updateRoomCard(room, idx);
    });

    // 5. Update Agenda
    this._updateAgenda();

    // 6. Update Active Modal if open (targeted fast in-place updates, zero teardown)
    if (this._activeModal) {
      if (this._activeModal === 'weather') {
        this._updateWeatherModalValues();
      } else if (this._activeModal === 'alarmo') {
        this._updateAlarmoModalValues();
      } else if (this._activeModal === 'stats') {
        // preserve stats modal without re-render flicker
      } else if (this._activeModal.type === 'person') {
        this._renderPersonModal(this._activeModal.targetEntityId);
      } else if (this._activeModal.type === 'room') {
        this._updateRoomModalValues();
      }
    }
  }

  _updateRoomCard(room, idx) {
    const card = this.shadowRoot.getElementById(`roomCard_${idx}`);
    if (!card) return;

    // Environmental Badges: Temperature, Humidity, Illuminance
    // 1. Temperature
    const tempEl = card.querySelector('.env-temp');
    if (tempEl) {
      let tVal = null;
      if (room.climate_entity && this._hass.states[room.climate_entity]) {
        const c = this._hass.states[room.climate_entity];
        tVal = c.attributes.current_temperature || c.attributes.temperature;
      }
      if (!tVal && room.temp_entity && this._hass.states[room.temp_entity]) {
        tVal = this._hass.states[room.temp_entity].state;
      }
      if (tVal && !isNaN(parseFloat(tVal))) {
        tempEl.innerHTML = `${this._icon('thermometer', { size: 11, cls: 'icon-temp', style: 'margin-right:3px;' })} ${parseFloat(tVal).toFixed(1)}°C`;
        tempEl.style.display = 'inline-flex';
      } else {
        tempEl.style.display = 'none';
      }
    }

    // 2. Humidity
    const humEl = card.querySelector('.env-humidity');
    if (humEl) {
      const hEntity = room.humidity_entity || `sensor.prasenzmelder_${room.id}_humidity` || `sensor.ir_${room.id}_humidity`;
      const hState = this._hass.states[hEntity];
      if (hState && hState.state && !isNaN(parseFloat(hState.state))) {
        humEl.innerHTML = `${this._icon('droplet', { size: 11, cls: 'icon-humidity', style: 'margin-right:3px;' })} ${Math.round(parseFloat(hState.state))}%`;
        humEl.style.display = 'inline-flex';
      } else {
        humEl.style.display = 'none';
      }
    }

    // 3. Illuminance / Lux
    const luxEl = card.querySelector('.env-lux');
    if (luxEl) {
      const luxEntity = room.illuminance_entity || `sensor.prasenzmelder_${room.id}_illuminance` || `sensor.bewegungsmelder_${room.id}_illuminance`;
      const luxState = this._hass.states[luxEntity];
      if (luxState && luxState.state && !isNaN(parseFloat(luxState.state))) {
        luxEl.innerHTML = `${this._icon('lux', { size: 11, cls: 'icon-lux', style: 'margin-right:3px;' })} ${Math.round(parseFloat(luxState.state))} lx`;
        luxEl.style.display = 'inline-flex';
      } else {
        luxEl.style.display = 'none';
      }
    }

    // 4. Quick Target Temp Stepper
    const targetValEl = card.querySelector(`#targetTemp_${idx}`);
    if (targetValEl && room.climate_entity && this._hass.states[room.climate_entity]) {
      const cObj = this._hass.states[room.climate_entity];
      let targetTemp = cObj.attributes.temperature != null ? parseFloat(cObj.attributes.temperature) : 21.0;
      targetValEl.textContent = `${targetTemp.toFixed(1)}°`;
    }

    // Subtitle / Status
    const subEl = card.querySelector('.room-sub');
    if (subEl) {
      const isPres = room.presence_entity && this._hass.states[room.presence_entity] && this._hass.states[room.presence_entity].state === 'on';
      const isLightOn = room.light_entity && this._hass.states[room.light_entity] && this._hass.states[room.light_entity].state === 'on';
      const isWindowOpen = room.window_entity && this._hass.states[room.window_entity] && this._hass.states[room.window_entity].state === 'on';
      const isLocked = room.lock_entity && this._hass.states[room.lock_entity] && this._hass.states[room.lock_entity].state === 'locked';

      let status = [];
      if (isWindowOpen) status.push('Fenster offen');
      if (isLightOn) status.push('Licht an');
      if (isPres) status.push('Belegt');
      if (room.lock_entity) status.push(isLocked ? 'Verriegelt' : 'Entriegelt');

      subEl.textContent = status.length > 0 ? status.join(' • ') : 'Bereit';
    }

    // Action Circles
    // Light
    const lightBtn = card.querySelector('.action-light');
    if (lightBtn && room.light_entity && this._hass.states[room.light_entity]) {
      const isOn = this._hass.states[room.light_entity].state === 'on';
      lightBtn.classList.toggle('active-amber', isOn);
    }

    // Climate
    const climateBtn = card.querySelector('.action-climate');
    if (climateBtn && room.climate_entity && this._hass.states[room.climate_entity]) {
      const isHeat = this._hass.states[room.climate_entity].state === 'heat';
      climateBtn.classList.toggle('active', isHeat);
    }

    // Media
    const mediaBtn = card.querySelector('.action-media');
    if (mediaBtn && room.media_entity && this._hass.states[room.media_entity]) {
      const isPlay = this._hass.states[room.media_entity].state === 'playing';
      mediaBtn.classList.toggle('active', isPlay);
    }

    // Lock
    const lockBtn = card.querySelector('.action-lock');
    if (lockBtn && room.lock_entity && this._hass.states[room.lock_entity]) {
      const isLocked = this._hass.states[room.lock_entity].state === 'locked';
      lockBtn.classList.toggle('active-green', isLocked);
      lockBtn.innerHTML = isLocked ? this._icon('lock-closed', { size: 16, cls: 'icon-security' }) : this._icon('lock-open', { size: 16, cls: 'icon-security' });
    }

    // Switch
    const switchBtn = card.querySelector('.action-switch');
    if (switchBtn && room.switch_entity && this._hass.states[room.switch_entity]) {
      const isOn = this._hass.states[room.switch_entity].state === 'on';
      switchBtn.classList.toggle('active-blue', isOn);
    }
  }

  _updateAgenda() {
    const agendaEl = this.shadowRoot.getElementById('sidebarAgenda');
    if (!agendaEl || !this._hass) return;

    let items = [];

    // Müllabfuhr
    const trashCalendars = [
      { id: 'calendar.das_muhlenfeld_misburg_nord_4_restabfall', label: 'Restabfall', iconName: 'trash', color: 'dot-gray' },
      { id: 'calendar.das_muhlenfeld_misburg_nord_4_leichtverpackungen', label: 'Gelber Sack', iconName: 'recycle-sack', color: 'dot-amber' },
      { id: 'calendar.das_muhlenfeld_misburg_nord_4_bioabfall', label: 'Bioabfall', iconName: 'leaf', color: 'dot-green' },
      { id: 'calendar.das_muhlenfeld_misburg_nord_4_papier', label: 'Papiermüll', iconName: 'box', color: 'dot-blue' }
    ];

    trashCalendars.forEach(c => {
      const s = this._hass.states[c.id];
      if (s && s.attributes && s.attributes.start_time) {
        const d = new Date(s.attributes.start_time);
        items.push({
          date: d,
          text: `${this._icon(c.iconName, { size: 14, style: 'margin-right:5px;' })} ${c.label} (${d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' })})`,
          color: c.color
        });
      }
    });

    // Sun times
    const sunState = this._hass.states['sun.sun'];
    if (sunState && sunState.attributes) {
      if (sunState.attributes.next_setting) {
        const dSet = new Date(sunState.attributes.next_setting);
        items.push({
          date: dSet,
          text: `${this._icon('sunset', { size: 14, cls: 'icon-light', style: 'margin-right:5px;' })} Sonnenuntergang ${dSet.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`,
          color: 'dot-amber'
        });
      }
    }

    // Sort by date
    items.sort((a, b) => a.date - b.date);

    if (items.length > 0) {
      agendaEl.innerHTML = `
        <div class="agenda-title" style="display:flex;align-items:center;gap:6px;">${this._icon('calendar', { size: 14, cls: 'icon-calendar' })} Termine & Müllabfuhr</div>
        ${items.slice(0, 4).map(it => `
          <div class="agenda-item">
            <span class="chip-dot ${it.color}"></span>
            <span>${it.text}</span>
          </div>
        `).join('')}
      `;
    }
  }

  _translateWeather(state) {
    const map = {
      'clear-night': 'Klar',
      'cloudy': 'Bewölkt',
      'fog': 'Nebel',
      'hail': 'Hagel',
      'lightning': 'Gewitter',
      'lightning-rainy': 'Gewitter mit Regen',
      'partlycloudy': 'Teilweise bewölkt',
      'pouring': 'Starkregen',
      'rainy': 'Regnerisch',
      'snowy': 'Schneefall',
      'snowy-rainy': 'Schneeregen',
      'sunny': 'Sonnig',
      'windy': 'Windig',
      'windy-variant': 'Windig'
    };
    return map[state] || (state ? state.replace('_', ' ') : 'Unbekannt');
  }

  _getWeatherEmoji(state) {
    return this._getWeatherIcon(state, 24);
  }

  _openModal(type) {
    this._activeModal = type;
    const modalEl = this.shadowRoot.getElementById('modalContainer');
    if (modalEl) {
      modalEl.classList.remove('hidden');
      if (type === 'weather') {
        this._fetchWeatherForecast();
      } else if (type === 'stats') {
        this._fetchStatsHistory();
      }
      this._renderModalContent(type);
    }
  }

  _closeModal() {
    this._activeModal = null;
    const modalEl = this.shadowRoot.getElementById('modalContainer');
    if (modalEl) modalEl.classList.add('hidden');
  }

  _renderModalContent(type) {
    const body = this.shadowRoot.getElementById('modalBody');
    const title = this.shadowRoot.getElementById('modalTitle');
    if (!body || !title || !this._hass) return;

    if (type === 'lighting') {
      title.innerHTML = `${this._icon('light', { size: 22, cls: 'icon-light', style: 'margin-right:8px;' })} Beleuchtungs-Steuerung`;
      const allLights = [
        { id: 'light.licht_wohnung', name: 'Wohnung Gesamt (Alle Lichter)' },
        { id: 'light.livingroom', name: 'Wohnzimmer Licht' },
        { id: 'light.light_studyroom_tomada', name: 'Arbeitszimmer Licht' },
        { id: 'light.light_kitchen_tomada', name: 'Küchenlicht' },
        { id: 'light.light_bathroom_tomada', name: 'Badezimmer Licht' },
        { id: 'light.light_hallway_tomada', name: 'Flurlicht' },
        { id: 'light.schlafzimmerlicht', name: 'Schlafzimmerlicht' }
      ];

      body.innerHTML = `
        <div style="display:flex;gap:12px;margin-bottom:18px;">
          <button class="btn-micro" id="modalAllOn">Alle Lichter an</button>
          <button class="btn-micro" id="modalAllOff">Alle Lichter aus</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;">
          ${allLights.map(l => {
            const s = this._hass.states[l.id];
            const isOn = s && s.state === 'on';
            const bri = s && s.attributes.brightness ? Math.round((s.attributes.brightness / 255) * 100) : 100;
            return `
              <div class="control-row" style="padding:10px 14px;min-height:50px;">
                <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;margin-right:12px;">
                  <div style="flex-shrink:0;">${this._icon('light', { size: 16, cls: 'icon-light' })}</div>
                  <div style="flex:1;min-width:0;">
                    <div style="font-weight:600;font-size:14px;line-height:1.25;word-break:break-word;white-space:normal;color:var(--text-primary);">${l.name}</div>
                    <div style="font-size:12px;color:var(--text-secondary);">${isOn ? `An (${bri}%)` : 'Aus'}</div>
                  </div>
                </div>
                <button class="toggle-pill ${isOn ? 'active' : ''}" style="flex-shrink:0;" data-light="${l.id}">
                  ${isOn ? 'AN' : 'AUS'}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      `;

      body.querySelector('#modalAllOn').onclick = () => {
        this._callService('light', 'turn_on', { entity_id: 'light.licht_wohnung' });
      };
      body.querySelector('#modalAllOff').onclick = () => {
        this._callService('light', 'turn_off', { entity_id: 'light.licht_wohnung' });
      };
      body.querySelectorAll('.toggle-pill[data-light]').forEach(btn => {
        btn.onclick = () => {
          const lId = btn.getAttribute('data-light');
          this._callService('light', 'toggle', { entity_id: lId });
        };
      });
    } else if (type === 'climate') {
      title.innerHTML = `${this._icon('climate', { size: 22, cls: 'icon-climate', style: 'margin-right:8px;' })} Heizung, Raumklima & Temperaturkurven`;
      const thermostats = [
        { id: 'climate.better_thermostat_wohnzimmer', name: 'Wohnzimmer', tempSensor: 'sensor.bewegungsmelder_wohnzimmer_temperatur' },
        { id: 'climate.better_thermostat_arbeitszimmer', name: 'Arbeitszimmer', tempSensor: 'sensor.bewegungsmelder_arbeitszimmer_temperatur' },
        { id: 'climate.better_thermostat_schlafzimmer', name: 'Schlafzimmer', tempSensor: 'sensor.bewegungsmelder_schlafzimmer_temperature' },
        { id: 'climate.better_thermostat_kuche', name: 'Küche', tempSensor: 'sensor.bewegungsmelder_kuche_temperature' },
        { id: 'climate.better_thermostat_badezimmer', name: 'Badezimmer', tempSensor: 'sensor.badezimmer_temperatur' },
        { id: 'climate.better_thermostat_flur', name: 'Flur', tempSensor: 'sensor.bewegungsmelder_flur_temperatur' }
      ];

      if (!this._historyFetched) {
        this._historyFetched = true;
        this._fetchClimateHistory();
      }

      body.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:14px;">
          ${thermostats.map((t, idx) => {
            const s = this._hass.states[t.id];
            const cur = s && s.attributes.current_temperature ? s.attributes.current_temperature : (this._hass.states[t.tempSensor] ? this._hass.states[t.tempSensor].state : '--');
            const target = s && s.attributes.temperature ? s.attributes.temperature : 21.0;
            const isHeat = s && s.state === 'heat';

            const historyVals = this._tempHistory[t.tempSensor];
            const curve = this._generateSvgCurve(historyVals, cur, 290, 55);

            return `
              <div class="control-row" style="flex-direction:column;align-items:stretch;gap:10px;padding:16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div>
                    <span style="font-weight:700;font-size:16px;">${t.name}</span>
                    <div style="font-size:12px;color:var(--text-secondary);">Better Thermostat</div>
                  </div>
                  <div style="text-align:right;">
                    <span style="font-size:18px;font-weight:700;color:var(--text-primary);">${cur}°C</span>
                    <div style="font-size:11px;color:var(--text-secondary);">Ist-Temperatur</div>
                  </div>
                </div>

                <!-- SVG Temperature Curve (24h Trend) -->
                <div style="position:relative;width:100%;height:55px;margin:2px 0;">
                  <svg viewBox="0 0 290 55" style="width:100%;height:55px;overflow:visible;">
                    <defs>
                      <linearGradient id="curveGrad_${idx}" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35"/>
                        <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0"/>
                      </linearGradient>
                    </defs>
                    <path d="${curve.areaD}" fill="url(#curveGrad_${idx})" />
                    <path d="${curve.pathD}" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                    <circle cx="${curve.lastPt.x}" cy="${curve.lastPt.y}" r="4" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5" />
                  </svg>
                  <div style="position:absolute;top:2px;left:4px;font-size:10px;color:var(--text-secondary);font-weight:600;">Max: ${curve.max}°C</div>
                  <div style="position:absolute;bottom:2px;left:4px;font-size:10px;color:var(--text-secondary);font-weight:600;">Min: ${curve.min}°C</div>
                  <div style="position:absolute;bottom:2px;right:4px;font-size:10px;color:var(--accent);font-weight:600;">24h Verlauf</div>
                </div>

                <!-- Steppers & Mode -->
                <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-subtle);padding-top:10px;">
                  <span style="font-size:13px;">Ziel: <strong style="font-size:16px;color:var(--accent);">${target}°C</strong></span>
                  <div style="display:flex;gap:8px;">
                    <button class="btn-step" data-climate="${t.id}" data-delta="-0.5">-</button>
                    <button class="btn-step" data-climate="${t.id}" data-delta="0.5">+</button>
                    <button class="btn-micro ${isHeat ? 'active' : ''}" data-toggle-heat="${t.id}">
                      ${isHeat ? 'HEIZEN' : 'AUS'}
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;

      body.querySelectorAll('.btn-step').forEach(btn => {
        btn.onclick = () => {
          const cId = btn.getAttribute('data-climate');
          const delta = parseFloat(btn.getAttribute('data-delta'));
          const s = this._hass.states[cId];
          if (s) {
            const curTarget = s.attributes.temperature || 21.0;
            const newTarget = Math.round((curTarget + delta) * 2) / 2;
            this._callService('climate', 'set_temperature', { entity_id: cId, temperature: newTarget });
          }
        };
      });

      body.querySelectorAll('[data-toggle-heat]').forEach(btn => {
        btn.onclick = () => {
          const cId = btn.getAttribute('data-toggle-heat');
          const s = this._hass.states[cId];
          if (s) {
            const newMode = s.state === 'heat' ? 'off' : 'heat';
            this._callService('climate', 'set_hvac_mode', { entity_id: cId, hvac_mode: newMode });
          }
        };
      });
    } else if (type === 'security') {
      title.innerHTML = `${this._icon('lock-closed', { size: 22, cls: 'icon-security', style: 'margin-right:8px;' })} Sicherheit, Schloss & Kontakte`;
      const lockObj = this._hass.states['lock.wohnungsschloss'];
      const doorObj = this._hass.states['binary_sensor.turkontakt_hausture_contact'];
      const isLocked = lockObj && lockObj.state === 'locked';
      const isDoorOpen = doorObj && doorObj.state === 'on';

      let stateText = '';
      let stateColor = '#10b981';
      let stateIcon = this._icon('lock-closed', { size: 38, cls: 'icon-security' });
      let stateBg = 'rgba(16, 185, 129, 0.15)';

      if (isDoorOpen) {
        stateText = 'Tür ist GEÖFFNET (Offen)';
        stateColor = '#ef4444';
        stateIcon = this._icon('door-open', { size: 38, cls: 'icon-climate' });
        stateBg = 'rgba(239, 68, 68, 0.20)';
      } else if (!isLocked) {
        stateText = 'Tür geschlossen • Aktuell ENTRIEGELT';
        stateColor = '#f59e0b';
        stateIcon = this._icon('lock-open', { size: 38, cls: 'icon-light' });
        stateBg = 'rgba(245, 158, 11, 0.18)';
      } else {
        stateText = 'Tür geschlossen & Sicher VERRIEGELT';
        stateColor = '#10b981';
        stateIcon = this._icon('lock-closed', { size: 38, cls: 'icon-security' });
        stateBg = 'rgba(16, 185, 129, 0.15)';
      }

      const contacts = [
        { id: 'binary_sensor.turkontakt_hausture_contact', name: 'Haustüre', iconName: 'door' },
        { id: 'binary_sensor.turkontakt_balkontur_contact', name: 'Balkontüre', iconName: 'door' },
        { id: 'binary_sensor.fensterkontakte_wohnzimmer', name: 'Wohnzimmerfenster', iconName: 'window' },
        { id: 'binary_sensor.fensterkontakt_arbeitszimmerfenster_contact', name: 'Arbeitszimmerfenster', iconName: 'window' },
        { id: 'binary_sensor.fensterkontakt_kuche_contact', name: 'Küchenfenster', iconName: 'window' },
        { id: 'binary_sensor.fensterkontakt_flur_contact', name: 'Flurfenster', iconName: 'window' },
        { id: 'binary_sensor.fensterkontakt_schlafzimmer_contact', name: 'Schlafzimmerfenster', iconName: 'window' }
      ];

      body.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:16px;">
          <!-- Big 3-State Card -->
          <div style="background:${stateBg};border:1px solid ${stateColor};border-radius:22px;padding:20px;display:flex;flex-direction:column;gap:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-size:12px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:1px;font-weight:700;">Wohnungseingang Status</div>
                <div style="font-size:20px;font-weight:700;color:${stateColor};margin-top:2px;">${stateText}</div>
              </div>
              <div style="font-size:40px;">${stateIcon}</div>
            </div>
            <!-- Distinct Action Buttons -->
            <div style="display:flex;gap:12px;margin-top:6px;">
              <button class="btn-micro ${isLocked ? 'active-green' : ''}" id="btnLockAction" style="flex:1;padding:12px;font-size:14px;font-weight:700;">
                ${this._icon('lock-closed', { size: 16, style: 'margin-right:6px;' })} Verriegeln
              </button>
              <button class="btn-micro ${!isLocked ? 'active-amber' : ''}" id="btnUnlockAction" style="flex:1;padding:12px;font-size:14px;font-weight:700;">
                ${this._icon('lock-open', { size: 16, style: 'margin-right:6px;' })} Entriegeln
              </button>
            </div>
          </div>

          <div style="font-size:15px;font-weight:700;margin-top:4px;">Fenster- & Türkontakte</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;">
            ${contacts.map(c => {
              const cs = this._hass.states[c.id];
              const isOpen = cs && cs.state === 'on';
              return `
                <div class="control-row" style="padding:10px 14px;min-height:48px;">
                  <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;margin-right:10px;">
                    <div style="flex-shrink:0;">${this._icon(c.iconName, { size: 16, cls: 'icon-security' })}</div>
                    <div style="flex:1;min-width:0;">
                      <div style="font-weight:600;font-size:14px;line-height:1.25;word-break:break-word;white-space:normal;color:var(--text-primary);">${c.name}</div>
                      <div style="font-size:12px;color:var(--text-secondary);display:flex;align-items:center;gap:4px;">${isOpen ? this._icon('alert-triangle', { size: 12, cls: 'icon-temp' }) + ' Geöffnet' : this._icon('check', { size: 12, cls: 'icon-security' }) + ' Geschlossen'}</div>
                    </div>
                  </div>
                  <span class="toggle-pill ${isOpen ? 'active-amber' : ''}" style="flex-shrink:0;">${isOpen ? 'OFFEN' : 'ZU'}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      body.querySelector('#btnLockAction').onclick = () => {
        this._callService('lock', 'lock', { entity_id: 'lock.wohnungsschloss' });
      };
      body.querySelector('#btnUnlockAction').onclick = () => {
        this._callService('lock', 'unlock', { entity_id: 'lock.wohnungsschloss' });
      };
    } else if (type === 'alarmo') {
      title.innerHTML = `${this._icon('shield', { size: 22, cls: 'icon-alarmo', style: 'margin-right:8px;' })} ${this._t('alarmo')}`;
      const alarmo = this._hass.states['alarm_control_panel.alarmo'];
      const st = alarmo ? alarmo.state : 'disarmed';

      const stMap = {
        'disarmed': { label: this._t('deactivated'), color: '#10b981', iconName: 'shield-check', bg: 'rgba(16, 185, 129, 0.15)' },
        'armed_home': { label: this._t('armed_home'), color: '#0284c7', iconName: 'home', bg: 'rgba(2, 132, 199, 0.15)' },
        'armed_away': { label: this._t('armed_away'), color: '#f59e0b', iconName: 'user-walk', bg: 'rgba(245, 158, 11, 0.15)' },
        'armed_night': { label: this._t('armed_night'), color: '#6366f1', iconName: 'moon', bg: 'rgba(99, 102, 241, 0.15)' },
        'arming': { label: this._t('arming'), color: '#f59e0b', iconName: 'clock', bg: 'rgba(245, 158, 11, 0.2)' },
        'triggered': { label: this._t('alarm_triggered'), color: '#ef4444', iconName: 'siren', bg: 'rgba(239, 68, 68, 0.25)' }
      };

      const info = stMap[st] || { label: st, color: '#94a3b8', iconName: 'shield', bg: 'rgba(255,255,255,0.1)' };

      body.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:18px;">
          <!-- Status Banner -->
          <div id="alarmoStatusBanner" style="background:${info.bg};border:1.5px solid ${info.color};border-radius:20px;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 4px 15px rgba(0,0,0,0.08);">
            <div>
              <div style="font-size:13px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:1px;font-weight:600;">Status</div>
              <div id="alarmoStatusLabel" style="font-size:22px;font-weight:700;color:${info.color};margin-top:2px;">${info.label}</div>
            </div>
            <div id="alarmoStatusIcon" style="font-size:36px;display:flex;align-items:center;justify-content:center;">${this._icon(info.iconName, { size: 36, color: info.color })}</div>
          </div>

          <!-- Mode Buttons -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;">
            <button class="btn-micro ${st === 'disarmed' ? 'active-green' : ''}" id="btnAlarmoDisarm" style="padding:12px;font-weight:700;">
              ${this._icon('shield-check', { size: 16, style: 'margin-right:6px;' })} ${this._t('deactivated')}
            </button>
            <button class="btn-micro ${st === 'armed_home' ? 'active' : ''}" id="btnAlarmoHome" style="padding:12px;font-weight:700;">
              ${this._icon('home', { size: 16, style: 'margin-right:6px;' })} ${this._t('armed_home')}
            </button>
            <button class="btn-micro ${st === 'armed_away' ? 'active-amber' : ''}" id="btnAlarmoAway" style="padding:12px;font-weight:700;">
              ${this._icon('user-walk', { size: 16, style: 'margin-right:6px;' })} ${this._t('armed_away')}
            </button>
            <button class="btn-micro ${st === 'armed_night' ? 'active' : ''}" id="btnAlarmoNight" style="padding:12px;font-weight:700;">
              ${this._icon('moon', { size: 16, style: 'margin-right:6px;' })} ${this._t('armed_night')}
            </button>
          </div>

          <!-- Optional PIN display & Keypad -->
          <div class="alarmo-keypad-box">
            <div style="display:flex;align-items:center;justify-content:space-between;width:100%;max-width:240px;">
              <span style="font-size:13px;color:var(--text-secondary);font-weight:600;">${this._t('pin_code')}:</span>
              <span style="font-size:20px;letter-spacing:4px;font-family:monospace;font-weight:700;" id="alarmoPinDisplay">${this._alarmoCode ? '•'.repeat(this._alarmoCode.length) : this._t('no_entry')}</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3, 68px);gap:10px;">
              ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map(k => `
                <button class="btn-micro keypad-btn" data-key="${k}" style="height:44px;font-size:16px;font-weight:700;display:flex;align-items:center;justify-content:center;">
                  ${k}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      `;

      body.querySelector('#btnAlarmoDisarm').onclick = () => {
        const data = { entity_id: 'alarm_control_panel.alarmo' };
        if (this._alarmoCode) data.code = this._alarmoCode;
        this._callService('alarm_control_panel', 'alarm_disarm', data);
        this._alarmoCode = '';
      };
      body.querySelector('#btnAlarmoHome').onclick = () => {
        const data = { entity_id: 'alarm_control_panel.alarmo' };
        if (this._alarmoCode) data.code = this._alarmoCode;
        this._callService('alarm_control_panel', 'alarm_arm_home', data);
        this._alarmoCode = '';
      };
      body.querySelector('#btnAlarmoAway').onclick = () => {
        const data = { entity_id: 'alarm_control_panel.alarmo' };
        if (this._alarmoCode) data.code = this._alarmoCode;
        this._callService('alarm_control_panel', 'alarm_arm_away', data);
        this._alarmoCode = '';
      };
      body.querySelector('#btnAlarmoNight').onclick = () => {
        const data = { entity_id: 'alarm_control_panel.alarmo' };
        if (this._alarmoCode) data.code = this._alarmoCode;
        this._callService('alarm_control_panel', 'alarm_arm_night', data);
        this._alarmoCode = '';
      };

      body.querySelectorAll('.keypad-btn').forEach(b => {
        b.onclick = () => {
          const k = b.getAttribute('data-key');
          if (k === 'C') {
            this._alarmoCode = '';
          } else if (k === 'OK') {
            // Keep code
          } else {
            if (this._alarmoCode.length < 8) this._alarmoCode += k;
          }
          const disp = body.querySelector('#alarmoPinDisplay');
          if (disp) disp.textContent = this._alarmoCode ? '•'.repeat(this._alarmoCode.length) : 'Keine Eingabe';
        };
      });
    } else if (type === 'battery') {
      title.innerHTML = `${this._icon('battery-full', { size: 22, cls: 'icon-battery', style: 'margin-right:8px;' })} Batteriestatus & Geräte-Wartung`;

      let batteryDevices = [];
      const seenDevices = new Set();

      Object.keys(this._hass.states).forEach(entityId => {
        const stateObj = this._hass.states[entityId];
        if (!stateObj) return;

        const isBatteryClass = stateObj.attributes && stateObj.attributes.device_class === 'battery';
        const isBatteryName = (entityId.startsWith('sensor.') && (entityId.includes('battery') || entityId.includes('batterie')));
        const hasBatteryLevel = stateObj.attributes && stateObj.attributes.battery_level != null;

        if (isBatteryClass || isBatteryName || hasBatteryLevel) {
          if (entityId.startsWith('binary_sensor.') && entityId.includes('battery_low')) return;

          let val = null;
          if (hasBatteryLevel) {
            val = parseFloat(stateObj.attributes.battery_level);
          } else {
            val = parseFloat(stateObj.state);
          }

          if (isNaN(val) || val < 0 || val > 100) return;

          const name = (stateObj.attributes && stateObj.attributes.friendly_name) || entityId;
          const key = name.toLowerCase().replace(/[\s_-]+/g, '');
          if (seenDevices.has(key)) return;
          seenDevices.add(key);

          batteryDevices.push({
            id: entityId,
            name: name,
            level: Math.round(val),
            unit: '%'
          });
        }
      });

      batteryDevices.sort((a, b) => a.level - b.level);

      const critical = batteryDevices.filter(d => d.level < 20);
      const low = batteryDevices.filter(d => d.level >= 20 && d.level <= 40);
      const good = batteryDevices.filter(d => d.level > 40);

      const filter = this._batteryFilter || 'all';
      let displayedDevices = batteryDevices;
      if (filter === 'critical') displayedDevices = critical;
      else if (filter === 'low') displayedDevices = low;
      else if (filter === 'good') displayedDevices = good;

      body.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:16px;">
          <!-- Summary Cards -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;">
            <div class="control-row" style="flex-direction:column;align-items:center;cursor:pointer;${filter === 'all' ? 'border-color:var(--accent);' : ''}" id="filterAll">
              <span style="font-size:12px;color:var(--text-secondary);">Gesamt</span>
              <span style="font-size:22px;font-weight:700;">${batteryDevices.length}</span>
            </div>
            <div class="control-row" style="flex-direction:column;align-items:center;cursor:pointer;${filter === 'critical' ? 'border-color:#ef4444;' : ''}" id="filterCritical">
              <span style="font-size:12px;color:#ef4444;font-weight:600;">Kritisch (<20%)</span>
              <span style="font-size:22px;font-weight:700;color:#ef4444;">${critical.length}</span>
            </div>
            <div class="control-row" style="flex-direction:column;align-items:center;cursor:pointer;${filter === 'low' ? 'border-color:#f59e0b;' : ''}" id="filterLow">
              <span style="font-size:12px;color:#f59e0b;font-weight:600;">Niedrig (20-40%)</span>
              <span style="font-size:22px;font-weight:700;color:#f59e0b;">${low.length}</span>
            </div>
            <div class="control-row" style="flex-direction:column;align-items:center;cursor:pointer;${filter === 'good' ? 'border-color:#10b981;' : ''}" id="filterGood">
              <span style="font-size:12px;color:#10b981;font-weight:600;">Gut (>40%)</span>
              <span style="font-size:22px;font-weight:700;color:#10b981;">${good.length}</span>
            </div>
          </div>

          <!-- Device List -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;">
            ${displayedDevices.map(d => {
              let color = '#10b981';
              let icon = this._icon('battery-full', { size: 16, color: '#10b981', style: 'margin-right:6px;' });
              if (d.level < 20) {
                color = '#ef4444';
                icon = this._icon('battery-critical', { size: 16, color: '#ef4444', style: 'margin-right:6px;' });
              } else if (d.level <= 40) {
                color = '#f59e0b';
                icon = this._icon('battery-low', { size: 16, color: '#f59e0b', style: 'margin-right:6px;' });
              }
              return `
                <div class="control-row" style="flex-direction:column;align-items:stretch;gap:8px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
                    <div style="font-weight:600;font-size:13px;line-height:1.3;word-break:break-word;white-space:normal;display:flex;align-items:center;gap:8px;flex:1;min-width:0;" title="${d.name}">
                      <div style="flex-shrink:0;">${icon}</div>
                      <div>${d.name}</div>
                    </div>
                    <span style="font-weight:700;font-size:14px;color:${color};flex-shrink:0;margin-left:6px;">${d.level}%</span>
                  </div>
                  <div style="height:6px;border-radius:9999px;background:rgba(255,255,255,0.12);overflow:hidden;">
                    <div style="width:${d.level}%;height:100%;background:${color};border-radius:9999px;transition:width 0.4s;"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      body.querySelector('#filterAll').onclick = () => { this._batteryFilter = 'all'; this._renderModalContent('battery'); };
      body.querySelector('#filterCritical').onclick = () => { this._batteryFilter = 'critical'; this._renderModalContent('battery'); };
      body.querySelector('#filterLow').onclick = () => { this._batteryFilter = 'low'; this._renderModalContent('battery'); };
      body.querySelector('#filterGood').onclick = () => { this._batteryFilter = 'good'; this._renderModalContent('battery'); };

    } else if (type === 'switches') {
      title.innerHTML = `${this._icon('plug', { size: 22, cls: 'icon-switch', style: 'margin-right:8px;' })} Geräte & Steckdosen`;
      const switches = [
        { id: 'switch.livingroom_multimedia', name: 'Multimedia-Zentrale (TV, AVR, Shield, Sub)', icon: 'tv' },
        { id: 'switch.switch_washingmachine_smartplug_switch', name: 'Waschmaschine', pwr: 'sensor.switch_washingmachine_smartplug_power' },
        { id: 'switch.switch_denon_659190_smartplug_switch', name: 'Denon AVR Receiver' },
        { id: 'switch.switch_subwoofer_smartplug_switch', name: 'Subwoofer' },
        { id: 'switch.switch_livingroom_tv_smartplug_switch', name: 'Samsung TV Wohnzimmer' },
        { id: 'switch.switch_bedroom_tv_smartplug_switch', name: 'Schlafzimmer TV' },
        { id: 'switch.switch_shield_smartplug_switch', name: 'Nvidia Shield' },
        { id: 'switch.switch_harmonyhub_smartplug_switch', name: 'Harmony Hub' },
        { id: 'switch.switch_libreelec_bedroom_smartplug_switch', name: 'LibreELEC Schlafzimmer' }
      ];

      body.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;">
          ${switches.map(sw => {
            const s = this._hass.states[sw.id];
            const isOn = s && s.state === 'on';
            const pwrSensor = sw.pwr && this._hass.states[sw.pwr] ? `${Math.round(parseFloat(this._hass.states[sw.pwr].state))} W` : '';
            const icon = sw.icon ? this._icon(sw.icon, { size: 16, cls: 'icon-switch' }) : this._resolveEntityIcon(sw.id, s);
            return `
              <div class="control-row" style="padding:10px 14px;min-height:50px;">
                <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;margin-right:12px;">
                  <div style="flex-shrink:0;">${icon}</div>
                  <div style="flex:1;min-width:0;">
                    <div style="font-weight:600;font-size:14px;line-height:1.25;word-break:break-word;white-space:normal;color:var(--text-primary);">${sw.name}</div>
                    <div style="font-size:12px;color:var(--text-secondary);">${isOn ? (pwrSensor ? `Aktiv • ${pwrSensor}` : 'Ein') : 'Aus'}</div>
                  </div>
                </div>
                <button class="toggle-pill ${isOn ? 'active' : ''}" style="flex-shrink:0;" data-switch="${sw.id}">
                  ${isOn ? 'EIN' : 'AUS'}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      `;

      body.querySelectorAll('[data-switch]').forEach(btn => {
        btn.onclick = () => {
          const swId = btn.getAttribute('data-switch');
          this._callService('switch', 'toggle', { entity_id: swId });
        };
      });
    } else if (type === 'weather') {
      title.innerHTML = `${this._icon('weather-partlycloudy', { size: 22, cls: 'icon-weather', style: 'margin-right:8px;' })} Wetter, Vorhersage & Regenradar`;

      const existingIframe = body.querySelector('#weatherRadarIframe');
      if (existingIframe) {
        this._updateWeatherModalValues();
        this._updateForecastCarousels();
        return;
      }

      const w = this._hass.states['weather.hannover_hannover'];
      if (!w) {
        body.innerHTML = '<div>Keine Wetterdaten verfügbar.</div>';
        return;
      }
      const a = w.attributes;
      const hourlyItems = (this._hourlyForecast && this._hourlyForecast.length > 0)
        ? this._hourlyForecast.slice(0, 24)
        : [];
      const dailyItems = (this._dailyForecast && this._dailyForecast.length > 0)
        ? this._dailyForecast.slice(0, 7)
        : [];

      body.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:18px;">
          <!-- Current Weather Hero -->
          <div style="background:rgba(255,255,255,0.06);border:1px solid var(--border-subtle);border-radius:22px;padding:20px 24px;display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;gap:20px;align-items:center;">
              <div style="font-size:58px;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.25));display:flex;align-items:center;justify-content:center;" id="weatherHeroEmoji">${this._getWeatherIcon(w.state, 58)}</div>
              <div>
                <div style="font-size:36px;font-weight:800;letter-spacing:-0.5px;" id="weatherHeroTemp">${a.temperature}°C</div>
                <div style="font-size:16px;color:var(--text-secondary);font-weight:500;" id="weatherHeroCond">${this._translateWeather(w.state)} • Hannover</div>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:12px;color:var(--text-secondary);font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Heute</div>
              <div style="font-size:18px;font-weight:700;margin-top:2px;" id="weatherHeroToday">
                ${dailyItems[0] && dailyItems[0].templow != null ? `${Math.round(dailyItems[0].templow)}° / ` : ''}${dailyItems[0] ? `${Math.round(dailyItems[0].temperature)}°C` : `${a.temperature}°C`}
              </div>
              <div style="font-size:11px;color:var(--accent);margin-top:4px;">Deutscher Wetterdienst</div>
            </div>
          </div>

          <!-- Key Metrics Grid -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;">
            <div class="control-row" style="flex-direction:column;align-items:flex-start;padding:12px 14px;">
              <span style="font-size:11px;color:var(--text-secondary);">Luftfeuchtigkeit</span>
              <span style="font-size:17px;font-weight:700;" id="weatherMetricHum">${a.humidity}%</span>
            </div>
            <div class="control-row" style="flex-direction:column;align-items:flex-start;padding:12px 14px;">
              <span style="font-size:11px;color:var(--text-secondary);">Luftdruck</span>
              <span style="font-size:17px;font-weight:700;" id="weatherMetricPress">${a.pressure} hPa</span>
            </div>
            <div class="control-row" style="flex-direction:column;align-items:flex-start;padding:12px 14px;">
              <span style="font-size:11px;color:var(--text-secondary);">Wind</span>
              <span style="font-size:17px;font-weight:700;" id="weatherMetricWind">${a.wind_speed} km/h (${a.wind_bearing})</span>
            </div>
            <div class="control-row" style="flex-direction:column;align-items:flex-start;padding:12px 14px;">
              <span style="font-size:11px;color:var(--text-secondary);">Sichtweite</span>
              <span style="font-size:17px;font-weight:700;" id="weatherMetricVis">${a.visibility} km</span>
            </div>
          </div>

          <!-- Hourly Forecast Carousel (24 Hours - No rubberbanding) -->
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div style="font-weight:700;font-size:15px;display:flex;align-items:center;gap:6px;">
              ${this._icon('clock', { size: 16, style: 'margin-right:6px;' })} <span>Stündliche Vorhersage (Nächste 24 Stunden)</span>
            </div>
            <div class="weather-hourly-carousel" id="weatherHourlyContainer">
              ${this._renderHourlyItemsHtml(hourlyItems)}
            </div>
          </div>

          <!-- 7-Day Forecast Trend -->
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div style="font-weight:700;font-size:15px;display:flex;align-items:center;gap:6px;">
              ${this._icon('calendar', { size: 16, style: 'margin-right:6px;' })} <span>7-Tage Wettertrend</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;" id="weatherDailyContainer">
              ${this._renderDailyItemsHtml(dailyItems)}
            </div>
          </div>

          <!-- Live Weather Map & Radar -->
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div style="font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
              <div style="display:flex;align-items:center;gap:6px;">
                ${this._icon('radar', { size: 16, style: 'margin-right:6px;' })} <span>Live Niederschlagsradar Hannover & Region</span>
              </div>
              <div style="display:flex;gap:6px;align-items:center;">
                <button class="btn-micro active" id="btnRadarRain" style="padding:4px 10px;font-size:12px;">${this._icon('weather-rainy', { size: 14, style: 'margin-right:4px;' })} Regenradar</button>
                <button class="btn-micro" id="btnRadarWindy" style="padding:4px 10px;font-size:12px;">${this._icon('cyclone', { size: 14, style: 'margin-right:4px;' })} Windy</button>
                <a href="https://www.rainviewer.com/map.html?loc=52.3889,9.8297,9" target="_blank" rel="noopener" style="font-size:12px;color:var(--accent);text-decoration:none;font-weight:600;margin-left:4px;">
                  Vollbild &nearr;
                </a>
              </div>
            </div>
            <div style="position:relative;width:100%;height:340px;border-radius:20px;overflow:hidden;border:1px solid var(--border-glass);background:rgba(0,0,0,0.3);box-shadow:0 8px 24px rgba(0,0,0,0.25);">
              <iframe
                id="weatherRadarIframe"
                src="https://www.rainviewer.com/map.html?loc=52.3889,9.8297,9&oFa=0&oC=1&oU=0&oCS=1&oF=0&oAP=1&rmt=4&c=1&o=83&lm=1&th=0&sm=1&sn=1"
                width="100%"
                height="100%"
                frameborder="0"
                style="border:none;"
                loading="lazy"
                title="Niederschlagsradar Hannover">
              </iframe>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--text-secondary);margin-top:2px;">
              <span>${this._icon('map-pin', { size: 12, style: 'margin-right:4px;' })} Misburg-Nord / Hannover (52.39° N, 9.83° O)</span>
              <span id="radarSourceLabel">RainViewer HD Niederschlagsradar</span>
            </div>
          </div>
        </div>
      `;

      const btnRain = body.querySelector('#btnRadarRain');
      const btnWindy = body.querySelector('#btnRadarWindy');
      const iframe = body.querySelector('#weatherRadarIframe');
      const lbl = body.querySelector('#radarSourceLabel');

      if (btnRain && btnWindy && iframe) {
        btnRain.onclick = () => {
          btnRain.classList.add('active');
          btnWindy.classList.remove('active');
          iframe.src = 'https://www.rainviewer.com/map.html?loc=52.3889,9.8297,9&oFa=0&oC=1&oU=0&oCS=1&oF=0&oAP=1&rmt=4&c=1&o=83&lm=1&th=0&sm=1&sn=1';
          if (lbl) lbl.textContent = 'RainViewer HD Niederschlagsradar';
        };
        btnWindy.onclick = () => {
          btnWindy.classList.add('active');
          btnRain.classList.remove('active');
          iframe.src = 'https://embed.windy.com/embed2.html?lat=52.3889&lon=9.8297&zoom=9&level=surface&overlay=radar&product=radar&menu=&message=&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1';
          if (lbl) lbl.textContent = 'Windy Wetterradar Hannover';
        };
      }
    } else if (type === 'stats') {
      title.innerHTML = `${this._icon('chart-bar', { size: 22, cls: 'icon-stats', style: 'margin-right:8px;' })} Statistiken & Verläufe`;

      const tab = this._statsTab || 'temperature';
      const selectedRoom = this._statsRoom || 'wohnzimmer';

      const roomSensorsConfig = {
        wohnzimmer: {
          name: 'Wohnzimmer',
          climate_entity: 'climate.better_thermostat_wohnzimmer',
          light_entity: 'light.livingroom',
          temp_sensors: [
            { id: 'sensor.bewegungsmelder_wohnzimmer_temperatur', name: 'Bewegungsmelder (PIR)', color: '#38bdf8' },
            { id: 'sensor.prasenzmelder_wohnzimmer_temperature', name: 'Präsenzmelder (mmWave)', color: '#10b981' },
            { id: 'sensor.wohnzimmer_front_temperatur', name: 'Heizung Front (TRV)', color: '#f59e0b' },
            { id: 'sensor.fritz_smart_thermo_301_3_temperatur', name: 'Heizung Balkon (TRV)', color: '#ec4899' },
            { id: 'sensor.ir_wohnzimmer_temperature', name: 'IR-Sensor', color: '#a855f7' }
          ],
          illum_sensors: [
            { id: 'sensor.prasenzmelder_wohnzimmer_illuminance', name: 'Präsenzmelder (mmWave Lux)', color: '#38bdf8' },
            { id: 'sensor.bewegungsmelder_wohnzimmer_illuminance', name: 'Bewegungsmelder (PIR Lux)', color: '#f59e0b' }
          ]
        },
        arbeitszimmer: {
          name: 'Arbeitszimmer',
          climate_entity: 'climate.better_thermostat_arbeitszimmer',
          light_entity: 'light.light_studyroom_tomada',
          temp_sensors: [
            { id: 'sensor.bewegungsmelder_arbeitszimmer_temperatur', name: 'Bewegungsmelder (PIR)', color: '#38bdf8' },
            { id: 'sensor.prasenzmelder_arbeitszimmer_temperature', name: 'Präsenzmelder (mmWave)', color: '#10b981' },
            { id: 'sensor.arbeitszimmer_temperatur', name: 'Thermostat (TRV)', color: '#f59e0b' }
          ],
          illum_sensors: [
            { id: 'sensor.prasenzmelder_arbeitszimmer_illuminance', name: 'Präsenzmelder (mmWave Lux)', color: '#38bdf8' },
            { id: 'sensor.bewegungsmelder_arbeitszimmer_illuminance', name: 'Bewegungsmelder (PIR Lux)', color: '#f59e0b' }
          ]
        },
        badezimmer: {
          name: 'Badezimmer',
          climate_entity: 'climate.better_thermostat_badezimmer',
          light_entity: 'light.light_bathroom_tomada',
          temp_sensors: [
            { id: 'sensor.badezimmer_temperatur', name: 'Thermostat (TRV)', color: '#f59e0b' },
            { id: 'sensor.bewegungsmelder_bad_temperatur', name: 'Bewegungsmelder (PIR)', color: '#38bdf8' },
            { id: 'sensor.prasenzmelder_badezimmer_temperature', name: 'Präsenzmelder (mmWave)', color: '#a855f7' }
          ],
          illum_sensors: [
            { id: 'sensor.prasenzmelder_badezimmer_illuminance', name: 'Präsenzmelder (mmWave Lux)', color: '#38bdf8' }
          ]
        },
        kuche: {
          name: 'Küche',
          climate_entity: 'climate.better_thermostat_kuche',
          light_entity: 'light.light_kitchen_tomada',
          temp_sensors: [
            { id: 'sensor.kuche_temperatur', name: 'Thermostat (TRV)', color: '#f59e0b' },
            { id: 'sensor.bewegungsmelder_kuche_temperature', name: 'Bewegungsmelder (PIR)', color: '#38bdf8' },
            { id: 'sensor.prasenzmelder_kuche_temperature', name: 'Präsenzmelder (mmWave)', color: '#a855f7' }
          ],
          illum_sensors: [
            { id: 'sensor.prasenzmelder_kuche_illuminance', name: 'Präsenzmelder (mmWave Lux)', color: '#38bdf8' },
            { id: 'sensor.bewegungsmelder_kuche_illuminance', name: 'Bewegungsmelder (PIR Lux)', color: '#f59e0b' }
          ]
        },
        schlafzimmer: {
          name: 'Schlafzimmer',
          climate_entity: 'climate.better_thermostat_schlafzimmer',
          light_entity: 'light.schlafzimmerlicht',
          temp_sensors: [
            { id: 'sensor.schlafzimmer_temperatur', name: 'Thermostat (TRV)', color: '#f59e0b' },
            { id: 'sensor.prasenzmelder_schlafzimmer_temperature', name: 'Präsenzmelder (mmWave)', color: '#a855f7' }
          ],
          illum_sensors: [
            { id: 'sensor.prasenzmelder_schlafzimmer_illuminance', name: 'Präsenzmelder (mmWave Lux)', color: '#38bdf8' }
          ]
        },
        flur: {
          name: 'Flur',
          climate_entity: 'climate.better_thermostat_flur',
          light_entity: 'light.light_hallway_tomada',
          temp_sensors: [
            { id: 'sensor.flur_temperatur', name: 'Thermostat (TRV)', color: '#f59e0b' },
            { id: 'sensor.bewegungsmelder_flur_temperatur', name: 'Bewegungsmelder (PIR)', color: '#38bdf8' },
            { id: 'sensor.prasenzmelder_flur_temperature', name: 'Präsenzmelder (mmWave)', color: '#a855f7' }
          ],
          illum_sensors: [
            { id: 'sensor.prasenzmelder_flur_illuminance', name: 'Präsenzmelder (mmWave Lux)', color: '#38bdf8' },
            { id: 'sensor.bewegungsmelder_flur_illuminance', name: 'Bewegungsmelder (PIR Lux)', color: '#f59e0b' }
          ]
        }
      };

      let tabContent = '';

      if (tab === 'temperature') {
        const currentRoomConf = roomSensorsConfig[selectedRoom] || roomSensorsConfig.wohnzimmer;
        const seriesData = currentRoomConf.temp_sensors.map(s => {
          const stateObj = this._hass.states[s.id];
          return {
            ...s,
            currentVal: stateObj ? stateObj.state : null
          };
        });

        const climObj = currentRoomConf.climate_entity ? this._hass.states[currentRoomConf.climate_entity] : null;
        const isHeating = climObj && (climObj.state === 'heat' || (climObj.attributes && climObj.attributes.hvac_action === 'heating'));

        const chart = this._renderMultiLineSvgChart({
          series: seriesData,
          stateOverlay: {
            entity_id: currentRoomConf.climate_entity,
            label: 'Heizung',
            type: 'climate',
            activeColor: '#ef4444',
            activeLabel: 'Heizung AKTIV',
            idleLabel: 'Heizung AUS / Bereit'
          },
          width: 780,
          height: 320,
          unit: '°C',
          timeSpanHours: 24
        });

        tabContent = `
          <!-- Room Selector Tabs -->
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
            ${Object.keys(roomSensorsConfig).map(rKey => {
              const r = roomSensorsConfig[rKey];
              const isSel = selectedRoom === rKey;
              return `
                <button class="btn-micro ${isSel ? 'active' : ''}" data-stat-room="${rKey}">
                  ${r.name}
                </button>
              `;
            }).join('')}
          </div>

          <!-- Combined Multi-Line Chart with Heating Overlay -->
          <div style="background:rgba(255,255,255,0.06);border:1px solid var(--border-subtle);border-radius:20px;padding:16px 18px;display:flex;flex-direction:column;gap:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
              <div>
                <span style="font-weight:700;font-size:16px;">${currentRoomConf.name} • Temperaturverlauf & Heizung</span>
                <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">
                  Alle ${seriesData.length} Messstellen über 24h • Farbige Hinterlegung & Zeitleiste zeigen Heizphasen (AN/AUS)
                </div>
              </div>
              <div style="text-align:right;">
                <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:10px;background:${isHeating ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)'};border:1px solid ${isHeating ? 'rgba(239,68,68,0.3)' : 'var(--border-subtle)'};">
                  <span style="font-size:12.5px;font-weight:700;color:${isHeating ? '#ef4444' : 'var(--text-primary)'};display:flex;align-items:center;gap:4px;">
                    ${isHeating ? this._icon('flame', { size: 13, color: '#ef4444' }) + ' Heizung: AN' : this._icon('motion-idle', { size: 13 }) + ' Heizung: AUS / Bereit'}
                  </span>
                </div>
                <div style="font-size:11px;color:var(--text-secondary);margin-top:3px;">Min: ${chart.min}°C • Max: ${chart.max}°C</div>
              </div>
            </div>

            <!-- SVG Multi-Line Chart -->
            <div style="width:100%;overflow-x:auto;">
              ${chart.svg}
            </div>
          </div>

          <!-- Sensor Legend & Details -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;">
            ${seriesData.map(s => `
              <div class="control-row" style="padding:10px 14px;border-left:4px solid ${s.color};">
                <div style="flex:1;">
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span style="width:10px;height:10px;border-radius:50%;background:${s.color};display:inline-block;"></span>
                    <span style="font-weight:600;font-size:13px;">${s.name}</span>
                  </div>
                  <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;font-family:monospace;">${s.id}</div>
                </div>
                <div style="text-align:right;">
                  <span style="font-size:16px;font-weight:700;color:${s.color};">${s.currentVal != null ? `${s.currentVal}°C` : '--'}</span>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      } else if (tab === 'illuminance') {
        const currentRoomConf = roomSensorsConfig[selectedRoom] || roomSensorsConfig.wohnzimmer;
        const seriesData = currentRoomConf.illum_sensors.map(s => {
          const stateObj = this._hass.states[s.id];
          return {
            ...s,
            currentVal: stateObj ? stateObj.state : null
          };
        });

        const lightObj = currentRoomConf.light_entity ? this._hass.states[currentRoomConf.light_entity] : null;
        const isLightOn = lightObj && lightObj.state === 'on';

        const chart = this._renderMultiLineSvgChart({
          series: seriesData,
          stateOverlay: {
            entity_id: currentRoomConf.light_entity,
            label: 'Licht',
            type: 'light',
            activeColor: '#f59e0b',
            activeLabel: 'Licht AN',
            idleLabel: 'Licht AUS'
          },
          width: 780,
          height: 320,
          unit: ' lx',
          timeSpanHours: 24
        });

        tabContent = `
          <!-- Room Selector Tabs -->
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
            ${Object.keys(roomSensorsConfig).map(rKey => {
              const r = roomSensorsConfig[rKey];
              const isSel = selectedRoom === rKey;
              return `
                <button class="btn-micro ${isSel ? 'active' : ''}" data-stat-room="${rKey}">
                  ${r.name}
                </button>
              `;
            }).join('')}
          </div>

          <!-- Single Room Illuminance Chart with Light On/Off Overlay -->
          <div style="background:rgba(255,255,255,0.06);border:1px solid var(--border-subtle);border-radius:20px;padding:16px 18px;display:flex;flex-direction:column;gap:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
              <div>
                <span style="font-weight:700;font-size:16px;">${currentRoomConf.name} • Helligkeitsverlauf & Licht</span>
                <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">
                  24h Lux-Messkurve • Farbige Hinterlegung & Zeitleiste zeigen wann das Licht an war
                </div>
              </div>
              <div style="text-align:right;">
                <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:10px;background:${isLightOn ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)'};border:1px solid ${isLightOn ? 'rgba(245,158,11,0.3)' : 'var(--border-subtle)'};">
                  <span style="font-size:12.5px;font-weight:700;color:${isLightOn ? '#f59e0b' : 'var(--text-primary)'};display:flex;align-items:center;gap:4px;">
                    ${isLightOn ? this._icon('light', { size: 13, cls: 'icon-light' }) + ' Licht: AN' : this._icon('light', { size: 13 }) + ' Licht: AUS'}
                  </span>
                </div>
                <div style="font-size:11px;color:var(--text-secondary);margin-top:3px;">Min: ${chart.min} lx • Max: ${chart.max} lx</div>
              </div>
            </div>

            <!-- SVG Multi-Line Chart -->
            <div style="width:100%;overflow-x:auto;">
              ${chart.svg}
            </div>
          </div>

          <!-- Sensor Legend & Light Status -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;">
            ${seriesData.map(s => `
              <div class="control-row" style="padding:10px 14px;border-left:4px solid ${s.color};">
                <div style="flex:1;">
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span style="width:10px;height:10px;border-radius:50%;background:${s.color};display:inline-block;"></span>
                    <span style="font-weight:600;font-size:13px;">${s.name}</span>
                  </div>
                  <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;font-family:monospace;">${s.id}</div>
                </div>
                <div style="text-align:right;">
                  <span style="font-size:16px;font-weight:700;color:${s.color};">${s.currentVal != null ? `${s.currentVal} lx` : '--'}</span>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      } else if (tab === 'occupancy_heating') {
        const roomsList = [
          { name: 'Wohnzimmer', occ: 'binary_sensor.living_room_occupied', climate: 'climate.better_thermostat_wohnzimmer', pwr: 'sensor.wohnzimmer_better_thermostat_wohnzimmer_heizleistung' },
          { name: 'Arbeitszimmer', occ: 'binary_sensor.studyroom_occupied', climate: 'climate.better_thermostat_arbeitszimmer', pwr: 'sensor.arbeitszimmer_better_thermostat_arbeitszimmer_heizleistung' },
          { name: 'Badezimmer', occ: 'binary_sensor.bathroom_occupied', climate: 'climate.better_thermostat_badezimmer', pwr: 'sensor.badezimmer_better_thermostat_badezimmer_heizleistung' },
          { name: 'Küche', occ: 'binary_sensor.kuche_occupied', climate: 'climate.better_thermostat_kuche', pwr: 'sensor.kuche_better_thermostat_kuche_heizleistung' },
          { name: 'Schlafzimmer', occ: 'binary_sensor.bedroom_occupied', climate: 'climate.better_thermostat_schlafzimmer', pwr: 'sensor.schlafzimmer_better_thermostat_schlafzimmer_heizleistung' },
          { name: 'Flur', occ: 'binary_sensor.hallway_occupied', climate: 'climate.better_thermostat_flur', pwr: 'sensor.flur_better_thermostat_flur_heizleistung' }
        ];

        tabContent = `
          <div style="font-size:14px;color:var(--text-secondary);margin-bottom:6px;">
            Live-Übersicht der YAML-Belegungshelfer und der Better Thermostat Heizaktivität.
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;">
            ${roomsList.map(r => {
              const occObj = this._hass.states[r.occ];
              const isOcc = occObj && occObj.state === 'on';
              const climObj = this._hass.states[r.climate];
              const isHeat = climObj && (climObj.state === 'heat' || (climObj.attributes && climObj.attributes.hvac_action === 'heating'));
              const pwrObj = this._hass.states[r.pwr];
              const pwrVal = pwrObj ? parseFloat(pwrObj.state) : 0;

              return `
                <div class="control-row" style="flex-direction:column;align-items:stretch;gap:10px;padding:14px 16px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-weight:700;font-size:15px;">${r.name}</span>
                    <span class="toggle-pill ${isOcc ? 'active-green' : ''}" style="cursor:default;">
                      ${isOcc ? this._icon('motion', { size: 12, style: 'margin-right:4px;' }) + ' Belegt' : this._icon('motion-idle', { size: 12, style: 'margin-right:4px;' }) + ' Frei'}
                    </span>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-subtle);padding-top:8px;">
                    <div>
                      <div style="font-size:12px;color:var(--text-secondary);">Thermostat Status</div>
                      <div style="font-size:14px;font-weight:600;color:${isHeat ? 'var(--accent-amber)' : 'var(--text-primary)'};">
                        ${isHeat ? this._icon('flame', { size: 14, color: '#f59e0b', style: 'margin-right:4px;' }) + ' Heizen aktiv' : this._icon('motion-idle', { size: 14, style: 'margin-right:4px;' }) + ' Bereit / Eco'}
                      </div>
                    </div>
                    <div style="text-align:right;">
                      <div style="font-size:12px;color:var(--text-secondary);">Heizleistung</div>
                      <div style="font-size:14px;font-weight:700;color:var(--accent);">${pwrVal.toFixed(4)} K/min</div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      } else if (tab === 'battery') {
        const keyBatterySensors = [
          { id: 'sensor.wohnungsschloss_batterie', name: 'Wohnungsschloss', color: '#10b981' },
          { id: 'sensor.wohnzimmer_front_batterie', name: 'Thermostat Wohnzimmer Front', color: '#38bdf8' },
          { id: 'sensor.arbeitszimmer_batterie', name: 'Thermostat Arbeitszimmer', color: '#f59e0b' },
          { id: 'sensor.badezimmer_batterie', name: 'Thermostat Bad (Niedrig)', color: '#ef4444' },
          { id: 'sensor.turkontakt_hausture_battery', name: 'Türkontakt Haustüre', color: '#a855f7' }
        ];

        const seriesData = keyBatterySensors.map(s => {
          const stateObj = this._hass.states[s.id];
          return {
            ...s,
            currentVal: stateObj ? stateObj.state : null
          };
        });

        const chart = this._renderMultiLineSvgChart({
          series: seriesData,
          width: 780,
          height: 320,
          unit: '%',
          timeSpanHours: 24
        });

        tabContent = `
          <div style="background:rgba(255,255,255,0.06);border:1px solid var(--border-subtle);border-radius:20px;padding:16px 18px;display:flex;flex-direction:column;gap:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <span style="font-weight:700;font-size:16px;">Batterieverläufe (24h Entladung)</span>
                <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">Verlaufskurven wichtiger Batteriegeräte</div>
              </div>
              <div style="text-align:right;">
                <span style="font-size:13px;color:var(--accent);font-weight:700;">24h Status</span>
              </div>
            </div>

            <!-- SVG Multi-Line Chart -->
            <div style="width:100%;overflow-x:auto;">
              ${chart.svg}
            </div>
          </div>

          <!-- Sensor Legend -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;">
            ${seriesData.map(s => `
              <div class="control-row" style="padding:10px 14px;border-left:4px solid ${s.color};">
                <div style="flex:1;">
                  <div style="font-weight:600;font-size:13px;">${s.name}</div>
                  <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;font-family:monospace;">${s.id}</div>
                </div>
                <div style="text-align:right;">
                  <span style="font-size:16px;font-weight:700;color:${s.color};">${s.currentVal != null ? `${s.currentVal}%` : '--'}</span>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }

      body.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:16px;">
          <!-- Category Tabs -->
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn-micro ${tab === 'temperature' ? 'active' : ''}" id="btnStatsTabTemp">${this._icon('thermometer', { size: 14, style: 'margin-right:4px;' })} Raumtemperaturen</button>
            <button class="btn-micro ${tab === 'illuminance' ? 'active' : ''}" id="btnStatsTabIllum">${this._icon('lux', { size: 14, style: 'margin-right:4px;' })} Helligkeit (Lux)</button>
            <button class="btn-micro ${tab === 'occupancy_heating' ? 'active' : ''}" id="btnStatsTabOcc">${this._icon('user-walk', { size: 14, style: 'margin-right:4px;' })} Belegung & ${this._icon('flame', { size: 14, style: 'margin-right:4px;' })} Heizung</button>
            <button class="btn-micro ${tab === 'battery' ? 'active' : ''}" id="btnStatsTabBat">${this._icon('battery-full', { size: 14, style: 'margin-right:4px;' })} Batteriekurven</button>
          </div>

          <!-- Active Tab Content -->
          ${tabContent}

          <!-- Direct Link to Dashboard Statistics View -->
          <div style="border-top:1px solid var(--border-subtle);padding-top:14px;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:12px;color:var(--text-secondary);">Detaillierte Langzeitanalyse & Zoom im Dashboard:</span>
            <a href="/vision-glass/stats" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;" class="btn-micro">
              <span>${this._icon('chart-bar', { size: 14, style: 'margin-right:6px;' })} Vollständige Statistiken öffnen</span>
              <span>&rsaquo;</span>
            </a>
          </div>
        </div>
      `;

      // Event handlers for stats tabs
      body.querySelector('#btnStatsTabTemp').onclick = () => {
        this._statsTab = 'temperature';
        this._renderModalContent('stats');
      };
      body.querySelector('#btnStatsTabIllum').onclick = () => {
        this._statsTab = 'illuminance';
        this._renderModalContent('stats');
      };
      body.querySelector('#btnStatsTabOcc').onclick = () => {
        this._statsTab = 'occupancy_heating';
        this._renderModalContent('stats');
      };
      body.querySelector('#btnStatsTabBat').onclick = () => {
        this._statsTab = 'battery';
        this._renderModalContent('stats');
      };

      body.querySelectorAll('[data-stat-room]').forEach(btn => {
        btn.onclick = () => {
          this._statsRoom = btn.getAttribute('data-stat-room');
          this._renderModalContent('stats');
        };
      });
    }
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          box-sizing: border-box;
          width: 100%;
        }

        /* --- THEME DESIGN TOKENS --- */
        .dashboard-root.theme-light {
          background: radial-gradient(circle at 15% 15%, rgba(255, 255, 255, 0.95) 0%, transparent 45%),
                      radial-gradient(circle at 85% 80%, rgba(186, 230, 253, 0.55) 0%, transparent 50%),
                      linear-gradient(135deg, #dbeafe 0%, #eff6ff 35%, #f8fafc 70%, #ede9fe 100%);
          --bg-surface: rgba(255, 255, 255, 0.75);
          --bg-surface-hover: rgba(255, 255, 255, 0.92);
          --bg-card: rgba(255, 255, 255, 0.60);
          --border-glass: rgba(255, 255, 255, 0.92);
          --border-subtle: rgba(226, 232, 240, 0.85);
          --text-primary: #0f172a;
          --text-secondary: #475569;
          --accent: #0284c7;
          --accent-amber: #ea580c;
          --accent-green: #10b981;
          --dock-bg: rgba(255, 255, 255, 0.92);
          --shadow-ambient: 0 14px 35px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(15, 23, 42, 0.04);
          --card-overlay: linear-gradient(180deg, rgba(255,255,255,0.70) 0%, rgba(255,255,255,0.40) 100%);
          --glass-refraction:
            inset 0 1.5px 1px 0 #ffffff,
            inset 0 -1.5px 1.5px 0 rgba(15, 23, 42, 0.05),
            inset 1.5px 0 1.5px 0 rgba(2, 132, 199, 0.18),
            inset -1.5px 0 1.5px 0 rgba(139, 92, 246, 0.14);
        }

        .dashboard-root.theme-dark {
          background: radial-gradient(circle at 85% 15%, rgba(56, 189, 248, 0.14) 0%, transparent 45%),
                      radial-gradient(circle at 15% 85%, rgba(30, 58, 138, 0.22) 0%, transparent 50%),
                      linear-gradient(135deg, #090e18 0%, #0f172a 35%, #162032 70%, #0a101b 100%);
          --bg-surface: rgba(24, 32, 48, 0.70);
          --bg-surface-hover: rgba(30, 41, 59, 0.85);
          --bg-card: rgba(18, 25, 38, 0.62);
          --border-glass: rgba(255, 255, 255, 0.18);
          --border-subtle: rgba(255, 255, 255, 0.08);
          --text-primary: #f8fafc;
          --text-secondary: #94a3b8;
          --accent: #38bdf8;
          --accent-amber: #f59e0b;
          --accent-green: #10b981;
          --dock-bg: rgba(16, 22, 34, 0.72);
          --shadow-ambient: 0 16px 36px rgba(0, 0, 0, 0.38);
          --card-overlay: linear-gradient(180deg, rgba(20,27,42,0.7) 0%, rgba(12,16,24,0.5) 100%);
          --glass-refraction:
            inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.45),
            inset 0 0.5px 0.5px 0 rgba(255, 255, 255, 0.65),
            inset 0 -1.5px 1.5px 0 rgba(0, 0, 0, 0.25),
            inset 1.5px 0 1.5px 0 rgba(56, 189, 248, 0.12),
            inset -1.5px 0 1.5px 0 rgba(168, 85, 247, 0.10);
        }

        .dashboard-root {
          min-height: calc(100vh - 56px);
          padding: 10px 24px 62px 24px;
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
          color: var(--text-primary);
          transition: background 0.5s ease, color 0.3s ease;
        }

        /* Animated Liquid Ambient Fluid Backdrop */
        .liquid-backdrop {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
          border-radius: inherit;
        }

        .liquid-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(85px);
          will-change: transform, opacity;
          transform: translate3d(0, 0, 0);
          opacity: 0.38;
        }

        .theme-dark .liquid-orb-1 {
          width: 540px;
          height: 540px;
          background: radial-gradient(circle, #0284c7 0%, #0369a1 40%, transparent 70%);
          top: -80px;
          left: 18%;
          animation: liquidDrift1 26s ease-in-out infinite alternate;
        }
        .theme-dark .liquid-orb-2 {
          width: 480px;
          height: 480px;
          background: radial-gradient(circle, #6366f1 0%, #4338ca 45%, transparent 70%);
          bottom: 5%;
          right: 12%;
          animation: liquidDrift2 32s ease-in-out infinite alternate;
        }
        .theme-dark .liquid-orb-3 {
          width: 440px;
          height: 440px;
          background: radial-gradient(circle, #0d9488 0%, #0f766e 40%, transparent 70%);
          bottom: 20%;
          left: 6%;
          animation: liquidDrift3 28s ease-in-out infinite alternate;
        }
        .theme-dark .liquid-orb-4 {
          width: 380px;
          height: 380px;
          background: radial-gradient(circle, #38bdf8 0%, #0284c7 50%, transparent 70%);
          top: 35%;
          right: 28%;
          animation: liquidDrift4 24s ease-in-out infinite alternate;
        }

        .theme-light .liquid-orb-1 {
          width: 580px;
          height: 580px;
          background: radial-gradient(circle, #7dd3fc 0%, #bae6fd 45%, transparent 70%);
          top: -60px;
          left: 15%;
          opacity: 0.28;
          animation: liquidDrift1 26s ease-in-out infinite alternate;
        }
        .theme-light .liquid-orb-2 {
          width: 520px;
          height: 520px;
          background: radial-gradient(circle, #d8b4fe 0%, #f3e8ff 45%, transparent 70%);
          bottom: 5%;
          right: 10%;
          opacity: 0.25;
          animation: liquidDrift2 32s ease-in-out infinite alternate;
        }
        .theme-light .liquid-orb-3 {
          width: 480px;
          height: 480px;
          background: radial-gradient(circle, #99f6e4 0%, #ccfbf1 45%, transparent 70%);
          bottom: 15%;
          left: 8%;
          opacity: 0.26;
          animation: liquidDrift3 28s ease-in-out infinite alternate;
        }
        .theme-light .liquid-orb-4 {
          width: 440px;
          height: 440px;
          background: radial-gradient(circle, #fde68a 0%, #fef3c7 45%, transparent 70%);
          top: 30%;
          right: 25%;
          opacity: 0.22;
          animation: liquidDrift4 24s ease-in-out infinite alternate;
        }

        @keyframes liquidDrift1 {
          0% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%; }
          50% { transform: translate3d(70px, 35px, 0) scale(1.14) rotate(35deg); border-radius: 58% 42% 38% 62% / 55% 65% 35% 45%; }
          100% { transform: translate3d(-35px, 75px, 0) scale(0.96) rotate(-25deg); border-radius: 50% 50% 60% 40% / 40% 50% 50% 60%; }
        }
        @keyframes liquidDrift2 {
          0% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); border-radius: 55% 45% 35% 65% / 50% 60% 40% 50%; }
          50% { transform: translate3d(-60px, -45px, 0) scale(1.16) rotate(-30deg); border-radius: 40% 60% 60% 40% / 60% 40% 60% 40%; }
          100% { transform: translate3d(45px, -70px, 0) scale(0.94) rotate(30deg); border-radius: 65% 35% 50% 50% / 45% 55% 45% 55%; }
        }
        @keyframes liquidDrift3 {
          0% { transform: translate3d(0, 0, 0) scale(1); border-radius: 45% 55% 60% 40% / 55% 45% 55% 45%; }
          50% { transform: translate3d(50px, -50px, 0) scale(1.10); border-radius: 60% 40% 45% 55% / 45% 55% 45% 55%; }
          100% { transform: translate3d(25px, 45px, 0) scale(1.04); border-radius: 50% 50% 50% 50%; }
        }
        @keyframes liquidDrift4 {
          0% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-45px, 50px, 0) scale(1.12); }
          100% { transform: translate3d(50px, -35px, 0) scale(0.96); }
        }

        /* Top Bar */
        .top-bar {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .date-title {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.4px;
        }

        .name-day {
          font-size: 11.5px;
          color: var(--text-secondary);
          margin-top: 1px;
        }

        .chips-container {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
          align-items: center;
        }

        .chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: var(--bg-surface);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-glass);
          border-radius: 9999px;
          padding: 4px 10px;
          font-size: 11.5px;
          font-weight: 500;
          cursor: pointer;
          box-shadow: var(--shadow-ambient);
          transition: transform 0.2s, background 0.2s;
        }
        .chip:hover {
          transform: translateY(-1px);
          background: var(--bg-surface-hover);
        }

        .chip-avatar {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        .avatar-online {
          border: 1.5px solid #10b981;
        }
        .avatar-offline {
          border: 1.5px solid #94a3b8;
          opacity: 0.75;
        }
        .chip-avatar-initial {
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 10px;
          color: #fff;
          line-height: 1;
        }
        .chip-name {
          font-weight: 600;
          margin-right: 2px;
        }
        .chip-status-text {
          font-size: 11px;
          color: var(--text-secondary);
        }

        .chip-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }
        .dot-amber { background: #f59e0b; box-shadow: 0 0 8px #f59e0b; }
        .dot-green { background: #10b981; box-shadow: 0 0 8px #10b981; }
        .dot-blue  { background: #38bdf8; box-shadow: 0 0 8px #38bdf8; }
        .dot-gray  { background: #64748b; }

        .theme-toggle {
          background: var(--bg-surface);
          border: 1px solid var(--border-glass);
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
          box-shadow: var(--shadow-ambient);
          transition: transform 0.2s;
        }
        .theme-toggle:hover {
          transform: scale(1.08);
        }

        /* Layout Grid */
        .dashboard-body {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 12px;
        }
        @media (max-width: 980px) {
          .dashboard-body { grid-template-columns: 1fr; }
        }

        /* Left Sidebar Card */
        .sidebar-card {
          position: relative;
          overflow: hidden;
          background: var(--bg-card);
          backdrop-filter: blur(32px) saturate(190%);
          -webkit-backdrop-filter: blur(32px) saturate(190%);
          border: 1px solid var(--border-glass);
          border-radius: 20px;
          padding: 14px 16px;
          box-shadow: var(--glass-refraction), var(--shadow-ambient);
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s;
        }

        .sidebar-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 10%;
          right: 10%;
          height: 1.5px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.75), transparent);
          pointer-events: none;
          z-index: 3;
        }

        .sidebar-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(115deg, transparent 0%, transparent 35%, rgba(255, 255, 255, 0.22) 50%, rgba(255, 255, 255, 0.05) 54%, transparent 68%);
          background-size: 250% 250%;
          background-position: -120% -120%;
          pointer-events: none;
          z-index: 2;
          opacity: 0.6;
          transition: background-position 0.85s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s;
        }

        .sidebar-card:hover::after {
          background-position: 140% 140%;
          opacity: 1;
        }

        .theme-light .sidebar-card {
          background: var(--bg-card);
          border: 1.5px solid var(--border-glass);
          box-shadow: var(--glass-refraction), var(--shadow-ambient);
        }

        .theme-light .sidebar-card::after {
          background: linear-gradient(115deg,
            transparent 0%,
            transparent 28%,
            rgba(255, 255, 255, 0.95) 45%,
            rgba(56, 189, 248, 0.45) 50%,
            rgba(168, 85, 247, 0.35) 54%,
            transparent 68%);
          background-size: 250% 250%;
          background-position: -120% -120%;
        }

        .sidebar-header-badge {
          display: flex;
          align-items: center;
        }

        .sidebar-pill {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          padding: 3px 8px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid var(--border-subtle);
          color: var(--accent);
        }

        .theme-light .sidebar-pill {
          background: rgba(2, 132, 199, 0.10);
          border-color: rgba(2, 132, 199, 0.25);
          color: #0284c7;
        }

        .sidebar-clock-wrap {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .clock-display {
          font-size: 36px;
          font-weight: 800;
          letter-spacing: -1px;
          line-height: 1;
          color: var(--text-primary);
          font-feature-settings: "tnum";
        }

        .theme-light .clock-display {
          color: #0f172a;
        }

        .sidebar-date-sub {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .theme-light .sidebar-date-sub {
          color: #334155;
        }

        .sidebar-weather-box {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 14px;
          border: 1px solid var(--border-subtle);
          cursor: pointer;
          transition: transform 0.2s, background 0.2s, box-shadow 0.2s;
        }

        .sidebar-weather-box:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .theme-light .sidebar-weather-box {
          background: rgba(240, 246, 254, 0.85);
          border-color: rgba(219, 234, 254, 1);
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.08);
        }

        .theme-light .sidebar-weather-box:hover {
          background: rgba(230, 242, 254, 0.95);
          box-shadow: 0 8px 22px rgba(2, 132, 199, 0.15);
        }

        .sidebar-weather-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .weather-temp {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .theme-light .weather-temp {
          color: #0f172a;
        }

        .weather-cond {
          color: var(--text-secondary);
          font-size: 11.5px;
          font-weight: 600;
          margin-top: 1px;
        }

        .theme-light .weather-cond {
          color: #334155;
        }

        .weather-icon-glow {
          font-size: 28px;
          filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.25));
          transition: transform 0.3s ease;
        }

        .sidebar-weather-box:hover .weather-icon-glow {
          transform: scale(1.1);
        }

        .sidebar-weather-mini-row {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .sidebar-mini-pill {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
        }

        .theme-light .sidebar-mini-pill {
          background: #ffffff;
          border-color: rgba(203, 213, 225, 0.8);
          color: #334155;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
        }

        .agenda-block {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 2px;
        }

        .agenda-title {
          font-size: 10.5px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--text-secondary);
          font-weight: 700;
        }

        .theme-light .agenda-title {
          color: #475569;
        }

        .agenda-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11.5px;
          font-weight: 500;
          padding: 5px 9px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-subtle);
          transition: background 0.2s;
        }

        .theme-light .agenda-item {
          background: rgba(248, 250, 252, 0.95);
          border-color: rgba(226, 232, 240, 1);
          color: #0f172a;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
        }

        .sidebar-glance-bar {
          margin-top: auto;
          padding-top: 8px;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        /* Rooms Bento Grid */
        .rooms-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        @media (max-width: 1080px) {
          .rooms-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 680px) {
          .rooms-grid { grid-template-columns: 1fr; }
        }

        .room-card {
          position: relative;
          min-height: 122px;
          border-radius: 18px;
          overflow: hidden;
          background: var(--bg-card);
          backdrop-filter: blur(28px) saturate(190%);
          -webkit-backdrop-filter: blur(28px) saturate(190%);
          border: 1px solid var(--border-glass);
          box-shadow: var(--glass-refraction), var(--shadow-ambient);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 10px 14px;
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s;
        }

        .room-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 8%;
          right: 8%;
          height: 1.5px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.75), transparent);
          pointer-events: none;
          z-index: 3;
        }

        .room-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(115deg, transparent 0%, transparent 35%, rgba(255, 255, 255, 0.22) 50%, rgba(255, 255, 255, 0.05) 54%, transparent 68%);
          background-size: 250% 250%;
          background-position: -120% -120%;
          pointer-events: none;
          z-index: 2;
          opacity: 0.6;
          transition: background-position 0.85s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s;
        }

        .room-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--glass-refraction), 0 20px 42px rgba(0, 0, 0, 0.42);
        }

        .room-card:hover::after {
          background-position: 140% 140%;
          opacity: 1;
        }

        .theme-light .room-card {
          background: var(--bg-card);
          border: 1.5px solid var(--border-glass);
          box-shadow: var(--glass-refraction), var(--shadow-ambient);
        }

        .theme-light .room-card::after {
          background: linear-gradient(115deg,
            transparent 0%,
            transparent 28%,
            rgba(255, 255, 255, 0.95) 45%,
            rgba(56, 189, 248, 0.45) 50%,
            rgba(168, 85, 247, 0.35) 54%,
            transparent 68%);
          background-size: 250% 250%;
          background-position: -120% -120%;
        }

        .theme-light .room-card:hover {
          box-shadow: var(--glass-refraction), 0 18px 40px rgba(15, 23, 42, 0.14);
        }

        .room-bg-image {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          opacity: 0.22;
          filter: saturate(1.2);
          pointer-events: none;
          transition: opacity 0.3s;
        }
        .room-card:hover .room-bg-image {
          opacity: 0.32;
        }

        .room-header {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .room-name {
          font-size: 15px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .room-sub {
          font-size: 11px;
          color: var(--text-secondary);
          margin-top: 1px;
        }

        /* Environmental Badges (Temp, Humidity, Lux) */
        .room-env-bar {
          position: relative;
          z-index: 2;
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          align-items: center;
          margin: 4px 0 6px 0;
        }

        .env-pill {
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--border-subtle);
          border-radius: 9999px;
          padding: 2px 7px;
          font-size: 10.5px;
          font-weight: 600;
          color: var(--text-primary);
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .theme-light .env-pill {
          background: rgba(241, 245, 249, 0.9);
          border-color: rgba(226, 232, 240, 0.95);
          color: #1e293b;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
        }

        .room-bottom-row {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
          gap: 6px;
        }

        .room-actions {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .action-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border-glass);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          user-select: none;
        }
        .action-circle:hover {
          transform: scale(1.12);
          background: rgba(255, 255, 255, 0.25);
        }
        .action-circle.active-amber {
          background: #f59e0b;
          color: #fff;
          box-shadow: 0 0 14px rgba(245, 158, 11, 0.6);
          border-color: #fbbf24;
        }
        .action-circle.active {
          background: var(--accent);
          color: #fff;
          box-shadow: 0 0 14px rgba(56, 189, 248, 0.6);
        }
        .action-circle.active-green {
          background: #10b981;
          color: #fff;
          box-shadow: 0 0 14px rgba(16, 185, 129, 0.6);
        }
        .action-circle.active-blue {
          background: #0284c7;
          color: #fff;
          box-shadow: 0 0 14px rgba(2, 132, 199, 0.6);
        }

        /* Quick Climate Stepper */
        .quick-climate-stepper {
          display: inline-flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.14);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--border-glass);
          border-radius: 9999px;
          padding: 1px 3px;
          gap: 2px;
          box-shadow: var(--shadow-ambient);
          user-select: none;
        }

        .theme-light .quick-climate-stepper {
          background: rgba(255, 255, 255, 0.92);
          border-color: rgba(226, 232, 240, 1);
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
        }

        .quick-step-btn {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.18);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .theme-light .quick-step-btn {
          background: rgba(226, 232, 240, 0.85);
          color: #0f172a;
        }

        .quick-step-btn:hover {
          transform: scale(1.15);
          background: var(--accent);
          color: #ffffff;
        }

        .quick-step-btn:active {
          transform: scale(0.95);
        }

        .quick-step-val {
          font-size: 11.5px;
          font-weight: 700;
          padding: 0 4px;
          min-width: 30px;
          text-align: center;
          color: var(--text-primary);
        }

        .theme-light .quick-step-val {
          color: #0f172a;
        }

        /* Weather Hourly Carousel (Smooth scroll, NO rubberbanding) */
        .weather-hourly-carousel {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 8px 4px;
          overscroll-behavior-x: contain;
          overscroll-behavior-y: none;
          touch-action: pan-x;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
        }

        /* Floating Liquid Water Dock */
        .dock-container {
          position: fixed;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--dock-bg);
          backdrop-filter: blur(32px) saturate(200%);
          -webkit-backdrop-filter: blur(32px) saturate(200%);
          border: 1px solid var(--border-glass);
          border-radius: 9999px;
          padding: 4px 14px;
          display: flex;
          gap: 8px;
          box-shadow:
            inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.70),
            inset 0 -1.5px 1.5px 0 rgba(0, 0, 0, 0.35),
            0 18px 45px rgba(0, 0, 0, 0.40),
            0 0 24px rgba(56, 189, 248, 0.22);
          z-index: 100;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s;
        }

        .dock-container:hover {
          transform: translateX(-50%) translateY(-2px);
          box-shadow:
            inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.85),
            inset 0 -1.5px 1.5px 0 rgba(0, 0, 0, 0.35),
            0 22px 50px rgba(0, 0, 0, 0.45),
            0 0 32px rgba(56, 189, 248, 0.32);
        }

        .theme-light .dock-container {
          background: rgba(255, 255, 255, 0.90);
          background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(238, 246, 255, 0.90) 100%);
          backdrop-filter: blur(32px) saturate(200%);
          -webkit-backdrop-filter: blur(32px) saturate(200%);
          border: 1.5px solid rgba(186, 230, 253, 0.90);
          box-shadow:
            inset 0 2px 1.5px 0 #ffffff,
            inset 0 -1.5px 1.5px 0 rgba(15, 23, 42, 0.08),
            0 14px 38px rgba(15, 23, 42, 0.16),
            0 0 28px rgba(2, 132, 199, 0.25);
        }

        .dock-item {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: var(--text-primary);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.3);
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s, box-shadow 0.2s;
        }

        .dock-item:hover {
          transform: translateY(-4px) scale(1.14);
          background: radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.25) 0%, rgba(56, 189, 248, 0.20) 100%);
          border-color: rgba(255, 255, 255, 0.35);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.5), 0 8px 18px rgba(0, 0, 0, 0.3), 0 0 14px rgba(56, 189, 248, 0.35);
        }

        .dock-item:active {
          transform: translateY(-1px) scale(0.96);
        }

        .theme-dark .dock-item {
          background: rgba(255, 255, 255, 0.08);
          background-image: radial-gradient(circle at 50% 25%, rgba(255, 255, 255, 0.18) 0%, rgba(30, 41, 59, 0.85) 100%);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.35), 0 2px 6px rgba(0, 0, 0, 0.25);
        }

        .theme-light .dock-item {
          background: rgba(240, 246, 255, 0.95);
          background-image: radial-gradient(circle at 50% 25%, #ffffff 0%, rgba(219, 234, 254, 0.95) 75%, rgba(191, 219, 254, 0.80) 100%);
          border: 1.5px solid rgba(147, 197, 253, 0.85);
          color: #0f172a;
          box-shadow:
            inset 0 1.5px 1px 0 #ffffff,
            inset 0 -1px 1px 0 rgba(15, 23, 42, 0.08),
            0 2px 6px rgba(15, 23, 42, 0.12);
        }

        .theme-light .dock-item:hover {
          background-image: radial-gradient(circle at 50% 25%, #ffffff 0%, rgba(186, 230, 253, 1) 100%);
          border-color: #0284c7;
          box-shadow:
            inset 0 1.5px 1px 0 #ffffff,
            0 6px 18px rgba(2, 132, 199, 0.35);
          transform: translateY(-4px) scale(1.15);
        }

        /* Modals */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 24px;
          overscroll-behavior: contain;
        }
        .modal-overlay.hidden { display: none; }

        .modal-card {
          position: relative;
          background: var(--bg-card);
          backdrop-filter: blur(38px) saturate(210%);
          -webkit-backdrop-filter: blur(38px) saturate(210%);
          border: 1px solid var(--border-glass);
          border-radius: 28px;
          width: 94%;
          max-width: 940px;
          max-height: 86vh;
          box-shadow:
            inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.55),
            inset 0 -1.5px 1.5px 0 rgba(0, 0, 0, 0.35),
            0 30px 80px rgba(0, 0, 0, 0.65),
            0 0 40px rgba(56, 189, 248, 0.15);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          overscroll-behavior: contain;
        }

        .modal-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 12%;
          right: 12%;
          height: 1.5px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
          pointer-events: none;
          z-index: 3;
        }

        .theme-light .modal-card {
          background: rgba(255, 255, 255, 0.88);
          border: 1.5px solid rgba(255, 255, 255, 0.95);
          box-shadow:
            inset 0 2px 1.5px 0 #ffffff,
            0 35px 85px rgba(15, 23, 42, 0.16),
            0 6px 20px rgba(15, 23, 42, 0.06);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-subtle);
          padding: 18px 26px;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.02);
        }
        .modal-title {
          font-size: 20px;
          font-weight: 700;
        }
        .close-btn {
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid var(--border-glass);
          border-radius: 50%;
          width: 34px;
          height: 34px;
          cursor: pointer;
          font-size: 18px;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease, transform 0.15s ease;
        }
        .close-btn:hover {
          background: rgba(255, 255, 255, 0.22);
          transform: scale(1.08);
        }

        .modal-body {
          padding: 22px 26px;
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .modal-body::-webkit-scrollbar {
          width: 6px;
        }
        .modal-body::-webkit-scrollbar-track {
          background: transparent;
        }
        .modal-body::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        .modal-body::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.38);
        }

        .control-row {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--border-subtle);
          border-radius: 18px;
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          box-sizing: border-box;
          transition: background 0.2s;
        }

        .theme-light .control-row {
          background: rgba(248, 250, 252, 0.92);
          border: 1px solid rgba(226, 232, 240, 1);
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
        }

        .sensor-badge {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--border-subtle);
          border-radius: 14px;
          padding: 8px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          box-sizing: border-box;
          min-height: 44px;
          transition: background 0.2s;
        }
        .sensor-badge:hover {
          background: rgba(255, 255, 255, 0.10);
        }

        .theme-light .sensor-badge {
          background: rgba(248, 250, 252, 0.92);
          border: 1px solid rgba(226, 232, 240, 1);
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
        }
        .theme-light .sensor-badge:hover {
          background: #ffffff;
        }

        .btn-micro {
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid var(--border-glass);
          border-radius: 12px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
          transition: transform 0.12s ease, background 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        }
        .btn-micro:active {
          transform: scale(0.96);
        }
        .theme-dark .btn-micro {
          background: rgba(255, 255, 255, 0.10);
          border: 1px solid rgba(255, 255, 255, 0.22);
          color: #f8fafc;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.12), 0 2px 5px rgba(0, 0, 0, 0.25);
        }
        .theme-dark .btn-micro:hover {
          background: rgba(255, 255, 255, 0.18);
          border-color: rgba(255, 255, 255, 0.35);
        }
        .theme-light .btn-micro {
          background: #f1f5f9;
          border: 1.5px solid #cbd5e1;
          color: #0f172a;
          box-shadow: inset 0 1px 0 #ffffff, 0 1px 3px rgba(15, 23, 42, 0.08);
        }
        .theme-light .btn-micro:hover {
          background: #e2e8f0;
          border-color: #94a3b8;
        }
        .btn-micro.active {
          background: #0284c7 !important;
          border-color: #0284c7 !important;
          color: #ffffff !important;
          box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4) !important;
        }
        .btn-micro.active-amber {
          background: #f59e0b !important;
          border-color: #f59e0b !important;
          color: #ffffff !important;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4) !important;
        }
        .btn-micro.active-green {
          background: #10b981 !important;
          border-color: #10b981 !important;
          color: #ffffff !important;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4) !important;
        }
        .btn-micro.active-blue {
          background: #3b82f6 !important;
          border-color: #3b82f6 !important;
          color: #ffffff !important;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4) !important;
        }

        .alarmo-keypad-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 18px 24px;
          border-radius: 20px;
          border: 1px solid var(--border-subtle);
          background: rgba(255, 255, 255, 0.04);
        }
        .theme-light .alarmo-keypad-box {
          background: rgba(248, 250, 252, 0.95);
          border: 1.5px solid #cbd5e1;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
        }
        .theme-dark .alarmo-keypad-box {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .keypad-btn {
          min-width: 68px;
          height: 44px;
          font-size: 16px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.1s, background 0.15s;
        }
        .keypad-btn:active {
          transform: scale(0.92);
        }

        .topbar-glass-btn {
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid var(--border-glass);
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: var(--text-primary);
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s, box-shadow 0.2s;
        }
        .topbar-glass-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(1.08);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .theme-light .topbar-glass-btn {
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          color: #0f172a;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
        }
        .theme-light .topbar-glass-btn:hover {
          background: #f8fafc;
          border-color: #0284c7;
          color: #0284c7;
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.2);
        }

        .btn-step {
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid var(--border-glass);
          border-radius: 10px;
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          cursor: pointer;
        }

        .toggle-pill {
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid var(--border-glass);
          border-radius: 12px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 700;
          color: var(--text-primary);
          cursor: pointer;
        }
        .toggle-pill.active {
          background: var(--accent);
          color: #fff;
        }

        /* ================================================================
           CUSTOM SVG ICON SYSTEM - DUAL THEME (LIGHT & DARK SETS)
           ================================================================ */
        .vg-icon {
          display: inline-block;
          vertical-align: middle;
          flex-shrink: 0;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), filter 0.2s ease, color 0.2s ease, stroke 0.2s ease;
          pointer-events: none;
        }

        /* LIGHT THEME ICON STYLING:
           Crisp, high-contrast, polished slate outlines with vibrant jewel accents & clean micro-shadow */
        .theme-light .vg-icon {
          color: #0f172a;
          stroke: currentColor;
          filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.12));
        }
        .theme-light .vg-icon.icon-light {
          color: #d97706;
          filter: drop-shadow(0 1px 2px rgba(217, 119, 6, 0.25));
        }
        .theme-light .vg-icon.icon-climate {
          color: #ea580c;
          filter: drop-shadow(0 1px 2px rgba(234, 88, 12, 0.25));
        }
        .theme-light .vg-icon.icon-temp {
          color: #dc2626;
          filter: drop-shadow(0 1px 2px rgba(220, 38, 38, 0.25));
        }
        .theme-light .vg-icon.icon-humidity {
          color: #0284c7;
          filter: drop-shadow(0 1px 2px rgba(2, 132, 199, 0.25));
        }
        .theme-light .vg-icon.icon-lux {
          color: #ca8a04;
          filter: drop-shadow(0 1px 2px rgba(202, 138, 4, 0.25));
        }
        .theme-light .vg-icon.icon-security {
          color: #059669;
          filter: drop-shadow(0 1px 2px rgba(5, 150, 105, 0.25));
        }
        .theme-light .vg-icon.icon-alarmo {
          color: #2563eb;
          filter: drop-shadow(0 1px 2px rgba(37, 99, 235, 0.25));
        }
        .theme-light .vg-icon.icon-media {
          color: #7c3aed;
          filter: drop-shadow(0 1px 2px rgba(124, 58, 237, 0.25));
        }
        .theme-light .vg-icon.icon-switch {
          color: #0891b2;
          filter: drop-shadow(0 1px 2px rgba(8, 145, 178, 0.25));
        }
        .theme-light .vg-icon.icon-battery {
          color: #059669;
          filter: drop-shadow(0 1px 2px rgba(5, 150, 105, 0.25));
        }
        .theme-light .vg-icon.icon-weather {
          color: #0284c7;
          filter: drop-shadow(0 1px 2px rgba(2, 132, 199, 0.25));
        }
        .theme-light .vg-icon.icon-stats {
          color: #4f46e5;
          filter: drop-shadow(0 1px 2px rgba(79, 70, 229, 0.25));
        }
        .theme-light .vg-icon.icon-sun {
          color: #d97706;
          filter: drop-shadow(0 1px 3px rgba(217, 119, 6, 0.35));
        }
        .theme-light .vg-icon.icon-moon {
          color: #475569;
        }

        /* DARK THEME ICON STYLING:
           Luminous, futuristic neon-glass strokes with ambient specular glow */
        .theme-dark .vg-icon {
          color: #f8fafc;
          stroke: currentColor;
          filter: drop-shadow(0 0 5px rgba(248, 250, 252, 0.35));
        }
        .theme-dark .vg-icon.icon-light {
          color: #fbbf24;
          filter: drop-shadow(0 0 7px rgba(251, 191, 36, 0.65));
        }
        .theme-dark .vg-icon.icon-climate {
          color: #fb7185;
          filter: drop-shadow(0 0 7px rgba(251, 113, 133, 0.65));
        }
        .theme-dark .vg-icon.icon-temp {
          color: #f43f5e;
          filter: drop-shadow(0 0 7px rgba(244, 63, 94, 0.65));
        }
        .theme-dark .vg-icon.icon-humidity {
          color: #38bdf8;
          filter: drop-shadow(0 0 7px rgba(56, 189, 248, 0.65));
        }
        .theme-dark .vg-icon.icon-lux {
          color: #fde047;
          filter: drop-shadow(0 0 7px rgba(253, 224, 71, 0.65));
        }
        .theme-dark .vg-icon.icon-security {
          color: #34d399;
          filter: drop-shadow(0 0 7px rgba(52, 211, 153, 0.65));
        }
        .theme-dark .vg-icon.icon-alarmo {
          color: #60a5fa;
          filter: drop-shadow(0 0 7px rgba(96, 165, 250, 0.65));
        }
        .theme-dark .vg-icon.icon-media {
          color: #c084fc;
          filter: drop-shadow(0 0 7px rgba(192, 132, 252, 0.65));
        }
        .theme-dark .vg-icon.icon-switch {
          color: #2dd4bf;
          filter: drop-shadow(0 0 7px rgba(45, 212, 191, 0.65));
        }
        .theme-dark .vg-icon.icon-battery {
          color: #4ade80;
          filter: drop-shadow(0 0 7px rgba(74, 222, 128, 0.65));
        }
        .theme-dark .vg-icon.icon-weather {
          color: #38bdf8;
          filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.65));
        }
        .theme-dark .vg-icon.icon-stats {
          color: #a78bfa;
          filter: drop-shadow(0 0 7px rgba(167, 139, 250, 0.65));
        }
        .theme-dark .vg-icon.icon-sun {
          color: #fde047;
          filter: drop-shadow(0 0 8px rgba(253, 224, 71, 0.7));
        }
        .theme-dark .vg-icon.icon-moon {
          color: #bae6fd;
          filter: drop-shadow(0 0 8px rgba(186, 230, 253, 0.7));
        }

        /* Active Action Circles override */
        .action-circle.active-amber .vg-icon,
        .action-circle.active .vg-icon,
        .action-circle.active-green .vg-icon,
        .action-circle.active-blue .vg-icon {
          color: #ffffff !important;
          stroke: #ffffff !important;
          filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.35)) !important;
        }

        /* Dock item icon transitions - eliminates Chromium compositor tile crosshair artifact */
        .dock-item .vg-icon {
          pointer-events: none;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform;
        }
        .dock-item:hover .vg-icon {
          transform: scale(1.18);
        }

      </style>

      <div class="dashboard-root theme-dark">
        <!-- Liquid Background Morphing Orbs (Fluide Lichtwellen & Wasserbrechung) -->
        <div class="liquid-backdrop" aria-hidden="true">
          <div class="liquid-orb liquid-orb-1"></div>
          <div class="liquid-orb liquid-orb-2"></div>
          <div class="liquid-orb liquid-orb-3"></div>
          <div class="liquid-orb liquid-orb-4"></div>
        </div>

        <!-- Top Bar Navigation & Status Chips -->
        <div class="top-bar">
          <div>
            <div class="date-title" id="dateTitle">Mittwoch, 11. November</div>
            <div class="name-day" id="subHeader">Willkommen Andreas Pilz • Smart Home Zentrale</div>
          </div>

          <div class="chips-container">
            <div class="chip" id="chipPersonAndreas" title="Status Andreas">${this._icon('user', { size: 14, style: 'margin-right:4px;' })} Andreas...</div>
            <div class="chip" id="chipPersonShanty" title="Status Shanty">${this._icon('user', { size: 14, style: 'margin-right:4px;' })} Shanty...</div>
            <div class="chip" id="chipLights">${this._icon('light', { size: 14, cls: 'icon-light', style: 'margin-right:4px;' })} ${this._t('lights_loading')}</div>
            <div class="chip" id="chipClimate">${this._icon('climate', { size: 14, cls: 'icon-climate', style: 'margin-right:4px;' })} ${this._t('climate_loading')}</div>
            <div class="chip" id="chipLock">${this._icon('lock-closed', { size: 14, cls: 'icon-security', style: 'margin-right:4px;' })} ${this._t('lock_loading')}</div>
            <div class="chip" id="chipAlarmo">${this._icon('shield', { size: 14, cls: 'icon-alarmo', style: 'margin-right:4px;' })} ${this._t('alarmo_loading')}</div>
            <div class="chip" id="chipWeather">${this._icon('weather-partlycloudy', { size: 14, cls: 'icon-weather', style: 'margin-right:4px;' })} ${this._t('weather_loading')}</div>
            <button class="topbar-glass-btn" id="langToggleBtn" title="${this._t('lang_switch')}">${this._getLang().toUpperCase()}</button>
            <button class="theme-toggle" id="themeToggleBtn" title="${this._isDaytime() ? this._t('day_mode') : this._t('night_mode')}">${this._isDaytime() ? this._icon('sun', { size: 18, cls: 'icon-sun' }) : this._icon('moon', { size: 18, cls: 'icon-moon' })}</button>
          </div>
        </div>

        <!-- Dashboard Body Layout -->
        <div class="dashboard-body">
          <!-- Left Glanceable Sidebar -->
          <div class="sidebar-card">
            <!-- Top Location & Greeting -->
            <div class="sidebar-header-badge">
              <span class="sidebar-pill">${this._icon('map-pin', { size: 13, style: 'margin-right:4px;' })} Misburg-Nord • Hannover</span>
            </div>

            <!-- Live Clock & Date -->
            <div class="sidebar-clock-wrap">
              <div class="clock-display" id="liveClock">--:--:--</div>
              <div class="sidebar-date-sub" id="sidebarDateSub">Wird geladen...</div>
            </div>

            <!-- Weather Hero Box (Clickable to open weather modal) -->
            <div class="sidebar-weather-box" id="sidebarWeather" title="Wetterübersicht & Vorhersage öffnen">
              <div class="sidebar-weather-top">
                <div>
                  <div class="weather-temp" id="weatherTemp">--°C</div>
                  <div class="weather-cond" id="weatherCondition">Laden...</div>
                </div>
                <div class="weather-icon-glow" id="weatherIcon">${this._icon('weather-partlycloudy', { size: 30, cls: 'icon-weather' })}</div>
              </div>
              <div class="sidebar-weather-mini-row" id="sidebarWeatherMini">
                <span class="sidebar-mini-pill" id="sidebarMiniHum">${this._icon('droplet', { size: 13, cls: 'icon-humidity', style: 'margin-right:3px;' })} --%</span>
                <span class="sidebar-mini-pill" id="sidebarMiniWind">${this._icon('wind', { size: 13, cls: 'icon-weather', style: 'margin-right:3px;' })} -- km/h</span>
                <span class="sidebar-mini-pill" id="sidebarMiniSun">${this._icon('sunset', { size: 13, cls: 'icon-light', style: 'margin-right:3px;' })} --:--</span>
              </div>
            </div>

            <!-- Termine & Müllabfuhr -->
            <div class="agenda-block" id="sidebarAgenda">
              <div class="agenda-title" style="display:flex;align-items:center;gap:6px;">${this._icon('calendar', { size: 14, cls: 'icon-calendar' })} TERMINE & MÜLLABFUHR</div>
              <div class="agenda-item"><span>Wird geladen...</span></div>
            </div>

            <!-- Quick House Glance Bar -->
            <div class="sidebar-glance-bar" id="sidebarGlance"></div>
          </div>

          <!-- Rooms Grid -->
          <div class="rooms-grid" id="roomsContainer">
            ${this._config.rooms.map((room, idx) => {
              let initTemp = '--°C';
              let initHum = null;
              let initLux = null;

              if (this._hass) {
                let tVal = null;
                if (room.climate_entity && this._hass.states[room.climate_entity]) {
                  const c = this._hass.states[room.climate_entity];
                  tVal = c.attributes.current_temperature || c.attributes.temperature;
                }
                if (!tVal && room.temp_entity && this._hass.states[room.temp_entity]) {
                  tVal = this._hass.states[room.temp_entity].state;
                }
                if (tVal && !isNaN(parseFloat(tVal))) {
                  initTemp = `${parseFloat(tVal).toFixed(1)}°C`;
                }

                const hEntity = room.humidity_entity || `sensor.prasenzmelder_${room.id}_humidity` || `sensor.ir_${room.id}_humidity`;
                const hState = this._hass.states[hEntity];
                if (hState && hState.state && !isNaN(parseFloat(hState.state))) {
                  initHum = `${Math.round(parseFloat(hState.state))}%`;
                }

                const luxEntity = room.illuminance_entity || `sensor.prasenzmelder_${room.id}_illuminance` || `sensor.bewegungsmelder_${room.id}_illuminance`;
                const luxState = this._hass.states[luxEntity];
                if (luxState && luxState.state && !isNaN(parseFloat(luxState.state))) {
                  initLux = `${Math.round(parseFloat(luxState.state))} lx`;
                }
              }

              return `
                <div class="room-card" id="roomCard_${idx}" data-room-idx="${idx}">
                  ${room.picture ? `<div class="room-bg-image" style="background-image:url('${room.picture}');"></div>` : ''}
                  
                  <!-- Room Header -->
                  <div class="room-header">
                    <div>
                      <div class="room-name">${room.name} &rsaquo;</div>
                      <div class="room-sub">Wird geladen...</div>
                    </div>
                  </div>

                  <!-- Room Environmental Readings (Temp, Humidity, Lux) -->
                  <div class="room-env-bar">
                    <span class="env-pill env-temp">${this._icon('thermometer', { size: 11, cls: 'icon-temp', style: 'margin-right:3px;' })} ${initTemp}</span>
                    <span class="env-pill env-humidity" style="${initHum ? 'display:inline-flex;' : 'display:none;'}">${this._icon('droplet', { size: 11, cls: 'icon-humidity', style: 'margin-right:3px;' })} ${initHum || '--%'}</span>
                    <span class="env-pill env-lux" style="${initLux ? 'display:inline-flex;' : 'display:none;'}">${this._icon('lux', { size: 11, cls: 'icon-lux', style: 'margin-right:3px;' })} ${initLux || '-- lx'}</span>
                  </div>

                  <!-- Bottom Row: Actions & Heating Quick Stepper -->
                  <div class="room-bottom-row">
                    <div class="room-actions">
                      ${room.light_entity ? `<div class="action-circle action-light" title="Licht umschalten" data-action="light" data-idx="${idx}">${this._icon('light', { size: 16, cls: 'icon-light' })}</div>` : ''}
                      ${room.climate_entity ? `<div class="action-circle action-climate" title="Heizung öffnen" data-action="climate" data-idx="${idx}">${this._icon('climate', { size: 16, cls: 'icon-climate' })}</div>` : ''}
                      ${room.media_entity ? `<div class="action-circle action-media" title="Medien abspielen/pausieren" data-action="media" data-idx="${idx}">${this._icon('music', { size: 16, cls: 'icon-media' })}</div>` : ''}
                      ${room.lock_entity ? `<div class="action-circle action-lock" title="Schloss verriegeln/entriegeln" data-action="lock" data-idx="${idx}">${this._icon('lock-closed', { size: 16, cls: 'icon-security' })}</div>` : ''}
                    </div>

                    ${room.climate_entity ? `
                      <div class="quick-climate-stepper" title="Zieltemperatur anpassen">
                        <button class="quick-step-btn" data-action="temp-minus" data-idx="${idx}" title="Temperatur um 0.5°C senken" style="display:flex;align-items:center;justify-content:center;">${this._icon('minus', { size: 11 })}</button>
                        <span class="quick-step-val" id="targetTemp_${idx}">--°</span>
                        <button class="quick-step-btn" data-action="temp-plus" data-idx="${idx}" title="Temperatur um 0.5°C erhöhen" style="display:flex;align-items:center;justify-content:center;">${this._icon('plus', { size: 11 })}</button>
                      </div>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Floating Glass Dock -->
        <div class="dock-container">
          <div class="dock-item" id="dockLighting" title="Beleuchtung">${this._icon('light', { size: 19, cls: 'icon-light' })}</div>
          <div class="dock-item" id="dockClimate" title="Heizung & Schnellregler">${this._icon('climate', { size: 19, cls: 'icon-climate' })}</div>
          <div class="dock-item" id="dockStats" title="Statistiken & Verläufe">${this._icon('chart-bar', { size: 19, cls: 'icon-stats' })}</div>
          <div class="dock-item" id="dockSecurity" title="Sicherheit & Wohnungsschloss">${this._icon('lock-closed', { size: 19, cls: 'icon-security' })}</div>
          <div class="dock-item" id="dockAlarmo" title="Alarmanlage (Alarmo)">${this._icon('shield', { size: 19, cls: 'icon-alarmo' })}</div>
          <div class="dock-item" id="dockSwitches" title="Geräte & Steckdosen">${this._icon('plug', { size: 19, cls: 'icon-switch' })}</div>
          <div class="dock-item" id="dockBattery" title="Batteriestatus & Wartung">${this._icon('battery-full', { size: 19, cls: 'icon-battery' })}</div>
          <div class="dock-item" id="dockWeather" title="Wetter, Vorhersage & Radar">${this._icon('weather-partlycloudy', { size: 19, cls: 'icon-weather' })}</div>
        </div>

        <!-- Popup Modal Container -->
        <div class="modal-overlay hidden" id="modalContainer">
          <div class="modal-card">
            <div class="modal-header">
              <div class="modal-title" id="modalTitle">Steuerung</div>
              <button class="close-btn" id="modalCloseBtn">&times;</button>
            </div>
            <div class="modal-body" id="modalBody"></div>
          </div>
        </div>
      </div>
    `;

    // Apply active theme class immediately
    this._applyThemeClass();

    // Event Listeners
    const themeBtn = this.shadowRoot.getElementById('themeToggleBtn');
    if (themeBtn) themeBtn.addEventListener('click', () => this._toggleDayNight());
    const langBtn = this.shadowRoot.getElementById('langToggleBtn');
    if (langBtn) langBtn.addEventListener('click', () => this._toggleLang());

    // Sidebar Weather Card Click -> Open Weather Modal
    const swEl = this.shadowRoot.getElementById('sidebarWeather');
    if (swEl) swEl.addEventListener('click', () => this._openModal('weather'));

    // Top Bar Chips (Person chips open dedicated Resident & Presence overlay)
    const chipPA = this.shadowRoot.getElementById('chipPersonAndreas');
    if (chipPA) chipPA.addEventListener('click', () => this._openPersonModal('person.andreas'));
    const chipPS = this.shadowRoot.getElementById('chipPersonShanty');
    if (chipPS) chipPS.addEventListener('click', () => this._openPersonModal('person.shanty'));
    this.shadowRoot.getElementById('chipLights').addEventListener('click', () => this._openModal('lighting'));
    this.shadowRoot.getElementById('chipClimate').addEventListener('click', () => this._openModal('climate'));
    this.shadowRoot.getElementById('chipLock').addEventListener('click', () => this._openModal('security'));
    this.shadowRoot.getElementById('chipAlarmo').addEventListener('click', () => this._openModal('alarmo'));
    this.shadowRoot.getElementById('chipWeather').addEventListener('click', () => this._openModal('weather'));

    // Dock Items
    this.shadowRoot.getElementById('dockLighting').addEventListener('click', () => this._openModal('lighting'));
    this.shadowRoot.getElementById('dockClimate').addEventListener('click', () => this._openModal('climate'));
    this.shadowRoot.getElementById('dockStats').addEventListener('click', () => this._openModal('stats'));
    this.shadowRoot.getElementById('dockSecurity').addEventListener('click', () => this._openModal('security'));
    this.shadowRoot.getElementById('dockAlarmo').addEventListener('click', () => this._openModal('alarmo'));
    this.shadowRoot.getElementById('dockSwitches').addEventListener('click', () => this._openModal('switches'));
    this.shadowRoot.getElementById('dockBattery').addEventListener('click', () => this._openModal('battery'));
    this.shadowRoot.getElementById('dockWeather').addEventListener('click', () => this._openModal('weather'));

    // Modal Close
    this.shadowRoot.getElementById('modalCloseBtn').addEventListener('click', () => this._closeModal());
    this.shadowRoot.getElementById('modalContainer').addEventListener('click', (e) => {
      if (e.target.id === 'modalContainer') this._closeModal();
    });

    // Room Card Click (Opens Room Detail Overlay)
    this.shadowRoot.querySelectorAll('.room-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.action-circle') || e.target.closest('.quick-climate-stepper')) return;
        const idx = parseInt(card.getAttribute('data-room-idx'));
        const room = this._config.rooms[idx];
        if (room) {
          this._openRoomModal(room);
        }
      });
    });

    // Room Action Circles & Climate Steppers
    this.shadowRoot.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const idx = parseInt(btn.getAttribute('data-idx'));
        const room = this._config.rooms[idx];
        if (!room) return;

        if (action === 'light' && room.light_entity) {
          this._callService('light', 'toggle', { entity_id: room.light_entity });
        } else if (action === 'climate') {
          this._openModal('climate');
        } else if (action === 'media' && room.media_entity) {
          this._callService('media_player', 'media_play_pause', { entity_id: room.media_entity });
        } else if (action === 'lock' && room.lock_entity) {
          const lState = this._hass && this._hass.states[room.lock_entity];
          const isLocked = lState && lState.state === 'locked';
          this._callService('lock', isLocked ? 'unlock' : 'lock', { entity_id: room.lock_entity });
        } else if (action === 'switch' && room.switch_entity) {
          this._callService('switch', 'toggle', { entity_id: room.switch_entity });
        } else if (action === 'temp-plus') {
          const cEntity = room.climate_entity;
          if (cEntity && this._hass && this._hass.states[cEntity]) {
            const cObj = this._hass.states[cEntity];
            let curTarget = (cObj.attributes && cObj.attributes.temperature != null)
              ? parseFloat(cObj.attributes.temperature)
              : 21.0;
            const newTarget = Math.min(28.0, Math.round((curTarget + 0.5) * 10) / 10);
            this._callService('climate', 'set_temperature', { entity_id: cEntity, temperature: newTarget });
            if (room.target_temp_entity && this._hass.states[room.target_temp_entity]) {
              this._callService('input_number', 'set_value', { entity_id: room.target_temp_entity, value: newTarget });
            }
            const valEl = this.shadowRoot.getElementById(`targetTemp_${idx}`);
            if (valEl) valEl.textContent = `${newTarget.toFixed(1)}°`;
          }
        } else if (action === 'temp-minus') {
          const cEntity = room.climate_entity;
          if (cEntity && this._hass && this._hass.states[cEntity]) {
            const cObj = this._hass.states[cEntity];
            let curTarget = (cObj.attributes && cObj.attributes.temperature != null)
              ? parseFloat(cObj.attributes.temperature)
              : 21.0;
            const newTarget = Math.max(14.0, Math.round((curTarget - 0.5) * 10) / 10);
            this._callService('climate', 'set_temperature', { entity_id: cEntity, temperature: newTarget });
            if (room.target_temp_entity && this._hass.states[room.target_temp_entity]) {
              this._callService('input_number', 'set_value', { entity_id: room.target_temp_entity, value: newTarget });
            }
            const valEl = this.shadowRoot.getElementById(`targetTemp_${idx}`);
            if (valEl) valEl.textContent = `${newTarget.toFixed(1)}°`;
          }
        }
      });
    });
  }

  getCardSize() {
    return 6;
  }
}

customElements.define('vision-glass-dashboard', VisionGlassDashboard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'vision-glass-dashboard',
  name: 'Vision Glass Dashboard',
  description: 'Spatial glassmorphism smart home dashboard with live room states, interactive modals, and floating dock.'
});

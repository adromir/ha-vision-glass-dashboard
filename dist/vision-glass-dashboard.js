/**
 * Vision Glass Dashboard for Home Assistant
 * Ultra-modern Apple VisionOS & macOS inspired spatial glassmorphism dashboard.
 * Author: Adromir (https://github.com/adromir)
 * Repository: https://github.com/adromir/ha-vision-glass-dashboard
 */

class VisionGlassDashboard extends HTMLElement {
  static getConfigElement() {
    return document.createElement('vision-glass-dashboard-editor');
  }

  static getStubConfig(hass, entities, entitiesFallback) {
    return {
      type: 'custom:vision-glass-dashboard',
      title: 'Vision Glass Dashboard',
      theme_mode: 'auto',
      ambient_background: true
    };
  }
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
    this._activeModal = null;
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
  }

  static get I18N() {
    return {
      de: {
        welcome: 'Willkommen',
        smart_home_center: 'Smart Home Zentrale',
        edit_banner_title: 'Vision Glass Dashboard Bearbeitungsmodus',
        edit_banner_subtitle: 'Räume, Bento-Kacheln, Overlays und Dock-Navigation werden zentral auf der Einstellungsseite konfiguriert.',
        open_settings_page: 'Zur Einstellungsseite öffnen',
        sync_areas_btn: 'HA-Bereiche synchronisieren & entdecken',
        sync_areas_success: 'Räume erfolgreich mit Home Assistant synchronisiert!',
        managed_by_ha_areas: 'Gesteuert via HA-Bereiche',
        ha_area_notice: 'Raumname, ID und Hintergrundbild werden direkt in Home Assistant unter Einstellungen → Bereiche & Zonen gepflegt.',
        dashboard_title_label: 'Dashboard Titel',
        auto_localized: 'Automatisch lokalisiert',
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
        comfort: 'Komfort',
        eco: 'Eco',
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
        sunrise: 'Sonnenaufgang',
        radar_precip: 'Niederschlagsradar',
        hourly_forecast: 'Stündliche Vorhersage (24h)',
        daily_trend: '7-Tage Wettertrend',
        all_lights_turn_off: 'Alle Lichter ausschalten',
        all_lights_turn_on: 'Alle Lichter einschalten',
        all_lights_apartment: 'Wohnung Gesamt (Alle Lichter)',
        battery_level: 'Batterie',
        device_details: 'Details in Home Assistant öffnen',
        heating_active: 'Heizung: AN',
        heating_idle: 'Heizung: AUS / Bereit',
        light_active: 'Licht: AN',
        light_idle: 'Licht: AUS',
        temperature_curve: 'Temperaturverlauf',
        illuminance_curve: 'Helligkeitsverlauf',
        occupancy_heating: 'Belegung & Heizung',
        battery_curves: 'Batteriekurven',
        select_room: 'Raum wählen',
        pressure: 'Luftdruck',
        wind: 'Wind',
        visibility: 'Sichtweite',
        humidity_label: 'Luftfeuchtigkeit',
        entrance_status: 'Wohnungseingang Status',
        window_door_contacts: 'Fenster- & Türkontakte',
        battery_status_maintenance: 'Batteriestatus & Geräte-Wartung',
        lighting_control: 'Beleuchtungs-Steuerung',
        climate_control: 'Heizung, Raumklima & Temperaturkurven',
        switches_control: 'Geräte, Schalter & Steckdosen',
        stats_title: 'Statistiken & 24h-Verläufe',
        weather_modal_title: 'Wetter, Vorhersage & Regenradar',
        no_data_available: 'Keine Daten verfügbar.',
        adjust_target_temp: 'Zieltemperatur anpassen',
        increase_temp: 'Temperatur um 0.5°C erhöhen',
        decrease_temp: 'Temperatur um 0.5°C senken',
        open_weather_modal: 'Wetterübersicht & Vorhersage öffnen',
        fullscreen: 'Vollbild',
        wohnzimmer: 'Wohnzimmer',
        arbeitszimmer: 'Arbeitszimmer',
        badezimmer: 'Badezimmer',
        kuche: 'Küche',
        schlafzimmer: 'Schlafzimmer',
        flur: 'Flur',
        wohnung: 'Wohnung',
        kellerraum: 'Kellerraum',
        umwelt: 'Umwelt',
        room_temperatures: 'Raumtemperaturen',
        illuminance_lux: 'Helligkeit (Lux)',
        hourly_forecast_title: 'Stündliche Vorhersage (Nächste 24 Stunden)',
        live_precipitation_radar: 'Live Niederschlagsradar Hannover & Region',
        rain_radar: 'Regenradar',
        open_full_stats: 'Vollständige Statistiken öffnen',
        detailed_stats_sub: 'Detaillierte Langzeitanalyse & Zoom im Dashboard:',
        thermostat_status: 'Thermostat Status',
        heating_power: 'Heizleistung',
        heating_active_desc: 'Heizen aktiv',
        heating_ready_desc: 'Bereit / Eco',
        battery_curves_title: 'Batterieverläufe (24h Entladung)',
        battery_curves_sub: 'Verlaufskurven wichtiger Batteriegeräte',
        temp_curve_heating: 'Temperaturverlauf & Heizung',
        illum_curve_lighting: 'Helligkeitsverlauf & Licht',
        all_sensors_24h: 'Alle Messstellen über 24h • Farbige Hinterlegung & Zeitleiste zeigen Heizphasen',
        lux_curve_24h: '24h Lux-Messkurve • Farbige Hinterlegung & Zeitleiste zeigen wann das Licht an war',
        live_occupancy_overview: 'Live-Übersicht der YAML-Belegungshelfer und der Better Thermostat Heizaktivität.',
        switches_sockets: 'Geräte & Steckdosen',
        socket: 'Steckdose',
        media: 'Medien',
        playing: 'PLAY',
        paused: 'PAUSE',
        switched_on: 'Eingeschaltet',
        switched_off: 'Ausgeschaltet',
        active: 'Aktiv',
        unavailable: 'Nicht verf.',
        loading: 'Wird geladen...',
        no_upcoming_events: 'Keine anstehenden Termine',
        settings: 'Einstellungen',
        configure_dashboard: 'Dashboard konfigurieren',
        edit_dashboard: 'Dashboard bearbeiten',
        theme_mode: 'Theme-Modus',
        theme_auto: 'Automatisch Tag/Nacht (sun.sun)',
        theme_light: 'Immer Hell (Vision Glass Light)',
        theme_dark: 'Immer Dunkel (Vision Glass Dark)',
        theme_desc: 'Legt fest, ob das Erscheinungsbild automatisch mit dem Sonnenstand wechselt oder fix bleibt.',
        ambient_background: 'Animierter Hintergrund (Wabernde Lichter)',
        ambient_desc: 'Sanfte, schwebende Lichtreflexe im Hintergrund für eine lebendige Glas-Atmosphäre.',
        ambient_intensity: 'Animations-Geschwindigkeit',
        speed_relaxed: 'Dezent & Entspannt (Langsam)',
        speed_normal: 'Standard (Ausgewogen)',
        speed_vivid: 'Lebendig (Dynamisch)',
        background_style: 'Hintergrund-Design',
        bg_aurora: 'Wabernde Lichter / Fluid Aurora (Standard)',
        bg_mesh: 'Spatial Vision Mesh (Kristallines Gitter)',
        bg_deep_space: 'Deep Space / Sternenfeld (Kosmisches Nachtblau)',
        bg_sunset: 'Sunset Glow / Warmer Abend (Amber & Violett)',
        bg_minimal: 'Minimal Frosted Glass (Neutral & Ruhig)',
        bg_custom: 'Eigenes Hintergrundbild (URL)',
        bg_image_url: 'Hintergrundbild URL',
        saved_success: '✓ Einstellungen erfolgreich in Home Assistant gespeichert!',
        media_player: 'Medienplayer & Audio',
        tv_remote: 'Fernseher & TV-Fernbedienung',
        tv_on: 'Fernseher ist eingeschaltet',
        tv_off: 'Fernseher ist ausgeschaltet',
        power: 'Power',
        volume: 'Lautstärke',
        volume_up: 'Lauter',
        volume_down: 'Leiser',
        mute: 'Stummschalten',
        source: 'Eingangsquelle',
        no_media_playing: 'Keine Wiedergabe aktiv',
        previous: 'Vorheriger Titel',
        next: 'Nächster Titel',
        play: 'Abspielen',
        pause: 'Pausieren',
        rooms_and_cards: 'Räume & Bento-Kacheln',
        reorder_rooms: 'Reihenfolge & Sichtbarkeit',
        add_room: 'Raum hinzufügen',
        delete_room: 'Raum entfernen',
        room_name: 'Raumname',
        picture_url: 'Hintergrundbild URL',
        dock_navigation: 'Bottom-Leiste & Navigation',
        auto_hide_empty: 'Leere Kategorien automatisch ausblenden',
        save_changes: 'Einstellungen speichern',
        saving: 'Speichern läuft...',
        saved_success: 'Einstellungen erfolgreich gespeichert!',
        reset_factory: 'Auf Werkseinstellungen zurücksetzen',
        rescan_areas: 'Räume & Geräte neu scannen (Ersteinrichtung)',
        rescan_confirm: 'Möchtest du alle Bereiche und Entitäten neu scannen? Manuelle Anpassungen werden dabei aktualisiert.',
        close: 'Schließen',
        cancel: 'Abbrechen',
        move_up: 'Nach oben',
        move_down: 'Nach unten',
        general: 'Allgemein',
        dock: 'Bottom-Leiste',
        provisioning: 'Ersteinrichtung',
        video_player: 'Videoplayer (Shield, Kodi etc.)',
        audio_player: 'Audioplayer (Verstärker, HiFi)',
        tv_display: 'Fernseher (TV-Display)',
        streaming: 'Videowiedergabe & Streaming',
        dpad_up: 'Hoch',
        dpad_down: 'Runter',
        dpad_left: 'Links',
        dpad_right: 'Rechts',
        dpad_select: 'OK',
        back: 'Zurück',
        home: 'Home',
        menu: 'Menü',
        bg_mode: 'Hintergrund-Farbschema-Zuordnung',
        bg_mode_auto: 'Automatisch (nach Preset & Sonne)',
        bg_mode_dark: 'Dunkles Farbschema (Helle Schrift & Glas)',
        bg_mode_light: 'Helles Farbschema (Dunkle Schrift & Glas)',
        color_scheme: 'Farbschema für Schriften, Modal & Pillen',
        scheme_auto: 'Standard (Passend zum Hintergrund)',
        scheme_neon: 'Cosmic Neon (Cyan & Sapphire)',
        scheme_sunset: 'Sunset Warm (Bernstein & Terracotta)',
        scheme_emerald: 'Emerald Mint (Smaragd & Mint)',
        scheme_monochrome: 'Monochrome Glass (Neutral)',
        scheme_high_contrast: 'High Contrast Light (Tageslicht)',
        scheme_custom: 'Benutzerdefiniert (Eigene Farben)',
        color_text_primary: 'Hauptschriftfarbe',
        color_text_secondary: 'Nebenschriftfarbe',
        color_modal_bg: 'Modal-Hintergrundfarbe',
        color_pill_bg: 'Pillen-Hintergrundfarbe',
        stop: 'Stoppen',
        toggle_light: 'Licht umschalten',
        open_climate: 'Heizung öffnen',
        toggle_media: 'Medien abspielen/pausieren',
        toggle_lock: 'Schloss verriegeln/entriegeln',
        adjust_temp: 'Zieltemperatur anpassen',
        temp_down: 'Temperatur senken',
        temp_up: 'Temperatur erhöhen'
      },
      en: {
        welcome: 'Welcome',
        smart_home_center: 'Smart Home Center',
        edit_banner_title: 'Vision Glass Dashboard Edit Mode',
        edit_banner_subtitle: 'Rooms, Bento tiles, overlays, and dock navigation are configured centrally on the dedicated settings page.',
        open_settings_page: 'Open Settings Page',
        sync_areas_btn: 'Sync & Discover HA Areas',
        sync_areas_success: 'Rooms successfully synced with Home Assistant!',
        managed_by_ha_areas: 'Managed via HA Areas',
        ha_area_notice: 'Room name, ID, and background image are managed directly in Home Assistant under Settings → Areas & Zones.',
        dashboard_title_label: 'Dashboard Title',
        auto_localized: 'Auto-localized',
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
        weather_loading: 'Loading weather...',
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
        comfort: 'Comfort',
        eco: 'Eco',
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
        sunrise: 'Sunrise',
        radar_precip: 'Precipitation Radar',
        hourly_forecast: 'Hourly Forecast (24h)',
        daily_trend: '7-Day Weather Trend',
        all_lights_turn_off: 'Turn all lights off',
        all_lights_turn_on: 'Turn all lights on',
        all_lights_apartment: 'Apartment Total (All Lights)',
        battery_level: 'Battery',
        device_details: 'Open details in Home Assistant',
        heating_active: 'Heating: ON',
        heating_idle: 'Heating: OFF / Ready',
        light_active: 'Light: ON',
        light_idle: 'Light: OFF',
        temperature_curve: 'Temperature History',
        illuminance_curve: 'Illuminance History',
        occupancy_heating: 'Occupancy & Heating',
        battery_curves: 'Battery Curves',
        select_room: 'Select room',
        pressure: 'Air Pressure',
        wind: 'Wind',
        visibility: 'Visibility',
        humidity_label: 'Humidity',
        entrance_status: 'Apartment Entrance Status',
        window_door_contacts: 'Window & Door Contacts',
        battery_status_maintenance: 'Battery Status & Device Maintenance',
        lighting_control: 'Lighting Control',
        climate_control: 'Climate, Heating & Curves',
        switches_control: 'Devices, Switches & Sockets',
        stats_title: 'Statistics & 24h History',
        weather_modal_title: 'Weather, Forecast & Radar',
        no_data_available: 'No data available.',
        adjust_target_temp: 'Adjust target temperature',
        increase_temp: 'Increase temperature by 0.5°C',
        decrease_temp: 'Decrease temperature by 0.5°C',
        open_weather_modal: 'Open weather overview & forecast',
        fullscreen: 'Fullscreen',
        wohnzimmer: 'Living Room',
        arbeitszimmer: 'Study',
        badezimmer: 'Bathroom',
        kuche: 'Kitchen',
        schlafzimmer: 'Bedroom',
        flur: 'Hallway',
        wohnung: 'Apartment',
        kellerraum: 'Basement',
        umwelt: 'Environment',
        room_temperatures: 'Room Temperatures',
        illuminance_lux: 'Illuminance (Lux)',
        hourly_forecast_title: 'Hourly Forecast (Next 24 Hours)',
        live_precipitation_radar: 'Live Precipitation Radar Hannover & Region',
        rain_radar: 'Rain Radar',
        open_full_stats: 'Open Full Statistics',
        detailed_stats_sub: 'Detailed long-term analysis & zoom in dashboard:',
        thermostat_status: 'Thermostat Status',
        heating_power: 'Heating Output',
        heating_active_desc: 'Heating active',
        heating_ready_desc: 'Ready / Eco',
        battery_curves_title: 'Battery Curves (24h Discharge)',
        battery_curves_sub: 'History curves of essential battery devices',
        temp_curve_heating: 'Temperature History & Heating',
        illum_curve_lighting: 'Illuminance History & Light',
        all_sensors_24h: 'All sensors over 24h • Shading and timeline indicate heating phases',
        lux_curve_24h: '24h lux curve • Shading and timeline indicate when light was active',
        live_occupancy_overview: 'Live overview of occupancy helpers and Better Thermostat heating activity.',
        switches_sockets: 'Devices & Sockets',
        socket: 'Socket',
        media: 'Media',
        playing: 'PLAY',
        paused: 'PAUSE',
        switched_on: 'Turned on',
        switched_off: 'Turned off',
        active: 'Active',
        unavailable: 'Unavail.',
        loading: 'Loading...',
        no_upcoming_events: 'No upcoming events',
        settings: 'Settings',
        configure_dashboard: 'Configure Dashboard',
        edit_dashboard: 'Edit Dashboard',
        theme_mode: 'Theme Mode',
        theme_auto: 'Automatic Day/Night (sun.sun)',
        theme_light: 'Always Light (Vision Glass Light)',
        theme_dark: 'Always Dark (Vision Glass Dark)',
        theme_desc: 'Determines whether the appearance switches automatically with the sun or stays fixed.',
        ambient_background: 'Animated Background (Waving Lights)',
        ambient_desc: 'Soft, floating light reflections in the background for a vibrant glass atmosphere.',
        ambient_intensity: 'Animation Speed',
        speed_relaxed: 'Relaxed & Subtle (Slow)',
        speed_normal: 'Standard (Balanced)',
        speed_vivid: 'Vivid (Dynamic)',
        background_style: 'Background Style',
        bg_aurora: 'Fluid Aurora / Floating Lights (Default)',
        bg_mesh: 'Spatial Vision Mesh (Frosted Grid)',
        bg_deep_space: 'Deep Space / Starfield (Cosmic Navy)',
        bg_sunset: 'Sunset Glow / Twilight (Amber & Violet)',
        bg_minimal: 'Minimal Frosted Glass (Neutral Glass)',
        bg_custom: 'Custom Wallpaper (URL)',
        bg_image_url: 'Wallpaper Image URL',
        saved_success: '✓ Settings successfully saved in Home Assistant!',
        media_player: 'Media Player & Audio',
        tv_remote: 'Television & TV Remote',
        tv_on: 'TV is turned on',
        tv_off: 'TV is turned off',
        power: 'Power',
        volume: 'Volume',
        volume_up: 'Volume Up',
        volume_down: 'Volume Down',
        mute: 'Mute',
        source: 'Input Source',
        no_media_playing: 'No media currently playing',
        previous: 'Previous Track',
        next: 'Next Track',
        play: 'Play',
        pause: 'Pause',
        rooms_and_cards: 'Rooms & Bento Cards',
        reorder_rooms: 'Room Order & Visibility',
        add_room: 'Add Room',
        delete_room: 'Remove Room',
        room_name: 'Room Name',
        picture_url: 'Background Image URL',
        dock_navigation: 'Bottom Bar & Navigation',
        auto_hide_empty: 'Automatically hide empty categories',
        save_changes: 'Save Settings',
        saving: 'Saving...',
        saved_success: 'Settings saved successfully!',
        reset_factory: 'Reset to Factory Defaults',
        rescan_areas: 'Re-scan Rooms & Devices (Initial Setup)',
        rescan_confirm: 'Do you want to re-scan all areas and entities? Your manual adjustments will be refreshed.',
        close: 'Close',
        cancel: 'Cancel',
        move_up: 'Move up',
        move_down: 'Move down',
        general: 'General',
        dock: 'Bottom Bar',
        provisioning: 'Setup',
        video_player: 'Video Player (Shield, Kodi etc.)',
        audio_player: 'Audio Player (Receiver, HiFi)',
        tv_display: 'Television (TV Display)',
        streaming: 'Video Playback & Streaming',
        dpad_up: 'Up',
        dpad_down: 'Down',
        dpad_left: 'Left',
        dpad_right: 'Right',
        dpad_select: 'OK',
        back: 'Back',
        home: 'Home',
        menu: 'Menu',
        bg_mode: 'Background Color Mode',
        bg_mode_auto: 'Automatic (by Preset & Sun)',
        bg_mode_dark: 'Dark Color Scheme (Light Text & Glass)',
        bg_mode_light: 'Light Color Scheme (Dark Text & Glass)',
        color_scheme: 'Color Scheme (Fonts, Modal & Pills)',
        scheme_auto: 'Default (Matched to Background)',
        scheme_neon: 'Cosmic Neon (Cyan & Sapphire)',
        scheme_sunset: 'Sunset Warm (Amber & Terracotta)',
        scheme_emerald: 'Emerald Mint (Emerald & Mint)',
        scheme_monochrome: 'Monochrome Glass (Neutral)',
        scheme_high_contrast: 'High Contrast Light (Daylight)',
        scheme_custom: 'Custom (User Defined)',
        color_text_primary: 'Primary Text Color',
        color_text_secondary: 'Secondary Text Color',
        color_modal_bg: 'Modal Background Color',
        color_pill_bg: 'Pill Background Color',
        stop: 'Stop',
        toggle_light: 'Toggle light',
        open_climate: 'Open climate',
        toggle_media: 'Play/pause media',
        toggle_lock: 'Lock/unlock',
        adjust_temp: 'Adjust target temperature',
        temp_down: 'Lower temperature',
        temp_up: 'Raise temperature'
      },
      id: {
        welcome: 'Selamat datang',
        smart_home_center: 'Pusat Smart Home',
        edit_banner_title: 'Mode Edit Dasbor Vision Glass',
        edit_banner_subtitle: 'Ruangan, ubin Bento, overlay, dan navigasi dock dikonfigurasi secara terpusat di halaman pengaturan.',
        open_settings_page: 'Buka Halaman Pengaturan',
        sync_areas_btn: 'Sinkronkan & Temukan Area HA',
        sync_areas_success: 'Ruangan berhasil disinkronkan dengan Home Assistant!',
        managed_by_ha_areas: 'Dikelola via Area HA',
        ha_area_notice: 'Nama ruangan, ID, dan gambar latar belakang dikelola langsung di Home Assistant di bawah Pengaturan → Area & Zona.',
        dashboard_title_label: 'Judul Dasbor',
        auto_localized: 'Diterjemahkan otomatis',
        today: 'Hari Ini',
        tomorrow: 'Besok',
        now: 'Sekarang',
        deactivated: 'Dinonaktifkan',
        disarmed: 'Dinonaktifkan',
        armed_home: 'Aktif (Di Rumah)',
        armed_away: 'Aktif (Pergi)',
        armed_night: 'Aktif (Malam)',
        arming: 'Mengaktifkan...',
        alarm_triggered: 'ALARM BERBUNYI!',
        door_open: 'Pintu terbuka',
        door_closed_unlocked: 'Pintu tertutup & tidak terkunci',
        door_closed_locked: 'Pintu tertutup & terkunci',
        lock_door: 'Kunci',
        unlock_door: 'Buka Kunci',
        lights_on: 'lampu menyala',
        lights_off: 'Semua lampu mati',
        lights_loading: 'Memuat lampu...',
        climate_loading: 'Memuat suhu...',
        lock_loading: 'Memuat kunci...',
        alarmo_loading: 'Memuat alarmo...',
        weather_loading: 'Memuat cuaca...',
        climate: 'Iklim & Suhu',
        lock: 'Kunci',
        alarmo: 'Alarmo',
        weather: 'Cuaca',
        lighting: 'Pencahayaan',
        stats: 'Statistik & Riwayat',
        security: 'Keamanan & Kunci Pintu',
        switches: 'Perangkat & Colokan',
        battery: 'Status Baterai & Perawatan',
        residents: 'Penghuni & Kehadiran',
        all: 'Semua',
        critical: 'Kritis (<20%)',
        low: 'Rendah (20-40%)',
        good: 'Bagus (>40%)',
        on: 'NYALA',
        off: 'MATI',
        heat: 'MEMANASKAN',
        target: 'Target',
        comfort: 'Kenyamanan',
        eco: 'Eco',
        temp: 'Suhu',
        humidity: 'Kelembapan',
        lux: 'Lux',
        occupied: 'Terisi',
        idle: 'Siap',
        person_present: 'Ada orang',
        no_motion: 'Tidak ada gerakan',
        window_open: 'Jendela terbuka',
        window_closed: 'Jendela tertutup',
        windows_open_count: 'terbuka',
        windows_all_closed: 'Jendela tertutup',
        door_locked_short: 'Terkunci',
        door_unlocked_short: 'Terbuka',
        overview_devices: 'Ikhtisar Ruangan & Perangkat',
        other_devices: 'Perangkat & Saklar Lainnya di Ruangan Ini',
        measurements_sensors: 'Pengukuran & Sensor',
        multimedia_hub: 'Pusat Multimedia',
        multimedia_desc: 'Mengontrol TV, Receiver AVR, Subwoofer & Shield bersamaan',
        pin_code: 'Kode PIN',
        no_entry: 'Tidak ada input',
        home: 'Di Rumah',
        away: 'Pergi',
        unknown: 'Tidak Diketahui',
        agenda_garbage: 'AGENDA & DAUR ULANG',
        sunset: 'Matahari Terbenam',
        sunrise: 'Matahari Terbit',
        radar_precip: 'Radar Curah Hujan',
        hourly_forecast: 'Prakiraan Per Jam (24j)',
        daily_trend: 'Tren Cuaca 7 Hari',
        all_lights_turn_off: 'Matikan semua lampu',
        all_lights_turn_on: 'Nyalakan semua lampu',
        all_lights_apartment: 'Seluruh Rumah (Semua Lampu)',
        battery_level: 'Baterai',
        device_details: 'Buka detail di Home Assistant',
        heating_active: 'Pemanas: NYALA',
        heating_idle: 'Pemanas: MATI / Siap',
        light_active: 'Lampu: NYALA',
        light_idle: 'Lampu: MATI',
        temperature_curve: 'Riwayat Suhu',
        illuminance_curve: 'Riwayat Pencahayaan',
        occupancy_heating: 'Kehadiran & Pemanas',
        battery_curves: 'Kurva Baterai',
        select_room: 'Pilih ruangan',
        pressure: 'Tekanan Udara',
        wind: 'Angin',
        visibility: 'Jarak Pandang',
        humidity_label: 'Kelembapan Udara',
        entrance_status: 'Status Pintu Masuk',
        window_door_contacts: 'Sensor Pintu & Jendela',
        battery_status_maintenance: 'Status Baterai & Perawatan Perangkat',
        lighting_control: 'Kontrol Pencahayaan',
        climate_control: 'Iklim, Pemanas & Kurva Suhu',
        switches_control: 'Perangkat, Saklar & Colokan',
        stats_title: 'Statistik & Riwayat 24 Jam',
        weather_modal_title: 'Cuaca, Prakiraan & Radar Hujan',
        no_data_available: 'Tidak ada data tersedia.',
        adjust_target_temp: 'Sesuaikan suhu target',
        increase_temp: 'Naikkan suhu 0.5°C',
        decrease_temp: 'Turunkan suhu 0.5°C',
        open_weather_modal: 'Buka ikhtisar cuaca & prakiraan',
        fullscreen: 'Layar Penuh',
        wohnzimmer: 'Ruang Tamu',
        arbeitszimmer: 'Ruang Kerja',
        badezimmer: 'Kamar Mandi',
        kuche: 'Dapur',
        schlafzimmer: 'Kamar Tidur',
        flur: 'Lorong',
        wohnung: 'Rumah',
        kellerraum: 'Gudang Bawah Tanah',
        umwelt: 'Lingkungan',
        room_temperatures: 'Suhu Ruangan',
        illuminance_lux: 'Pencahayaan (Lux)',
        hourly_forecast_title: 'Prakiraan Per Jam (24 Jam Ke Depan)',
        live_precipitation_radar: 'Radar Curah Hujan Langsung',
        rain_radar: 'Radar Hujan',
        open_full_stats: 'Buka Statistik Lengkap',
        detailed_stats_sub: 'Analisis jangka panjang & zoom di dashboard:',
        thermostat_status: 'Status Termostat',
        heating_power: 'Daya Pemanas',
        heating_active_desc: 'Pemanasan aktif',
        heating_ready_desc: 'Siap / Eco',
        battery_curves_title: 'Kurva Baterai (Pelepasan 24j)',
        battery_curves_sub: 'Kurva riwayat perangkat baterai penting',
        temp_curve_heating: 'Riwayat Suhu & Pemanas',
        illum_curve_lighting: 'Riwayat Pencahayaan & Lampu',
        all_sensors_24h: 'Semua sensor selama 24j • Arsiran dan linimasa menunjukkan fase pemanasan',
        lux_curve_24h: 'Kurva lux 24j • Arsiran dan linimasa menunjukkan saat lampu menyala',
        live_occupancy_overview: 'Ikhtisar langsung helper kehadiran dan aktivitas pemanas Better Thermostat.',
        switches_sockets: 'Perangkat & Colokan',
        socket: 'Colokan',
        media: 'Media',
        playing: 'PUTAR',
        paused: 'JEDA',
        switched_on: 'Dinyalakan',
        switched_off: 'Dimatikan',
        active: 'Aktif',
        unavailable: 'Tdk Tersedia',
        loading: 'Memuat...',
        no_upcoming_events: 'Tidak ada agenda mendatang',
        settings: 'Pengaturan',
        configure_dashboard: 'Konfigurasi Dashboard',
        edit_dashboard: 'Edit Dashboard',
        theme_mode: 'Mode Tema',
        theme_auto: 'Otomatis Siang/Malam (sun.sun)',
        theme_light: 'Selalu Terang (Vision Glass Light)',
        theme_dark: 'Selalu Gelap (Vision Glass Dark)',
        theme_desc: 'Menentukan apakah tampilan berganti otomatis mengikuti matahari atau tetap.',
        ambient_background: 'Latar Belakang Bergerak (Cahaya Waber)',
        ambient_desc: 'Efek cahaya lembut mengambang di latar belakang untuk atmosfer kaca dinamis.',
        ambient_intensity: 'Kecepatan Animasi',
        speed_relaxed: 'Halus & Santai (Lambat)',
        speed_normal: 'Standar (Seimbang)',
        speed_vivid: 'Dinamis (Cepat)',
        background_style: 'Gaya Latar Belakang',
        bg_aurora: 'Fluid Aurora / Cahaya Melayang (Standar)',
        bg_mesh: 'Spatial Vision Mesh (Kisi Kaca)',
        bg_deep_space: 'Deep Space / Bintang Kosmik (Biru Tua)',
        bg_sunset: 'Sunset Glow / Senja Hangat (Amber & Ungu)',
        bg_minimal: 'Minimal Frosted Glass (Kaca Bening)',
        bg_custom: 'Gambar Kustom (URL)',
        bg_image_url: 'URL Gambar Latar Belakang',
        saved_success: '✓ Pengaturan berhasil disimpan di Home Assistant!',
        media_player: 'Pemutar Media & Audio',
        tv_remote: 'Televisi & Remote TV',
        tv_on: 'TV sedang menyala',
        tv_off: 'TV dimatikan',
        power: 'Daya',
        volume: 'Volume',
        volume_up: 'Perbesar Volume',
        volume_down: 'Kecilkan Volume',
        mute: 'Bisu',
        source: 'Sumber Masukan',
        no_media_playing: 'Tidak ada media yang diputar',
        previous: 'Lagu Sebelumnya',
        next: 'Lagu Berikutnya',
        play: 'Putar',
        pause: 'Jeda',
        rooms_and_cards: 'Ruangan & Bento',
        reorder_rooms: 'Urutan Ruangan & Tampilan',
        add_room: 'Tambah Ruangan',
        delete_room: 'Hapus Ruangan',
        room_name: 'Nama Ruangan',
        picture_url: 'URL Gambar Latar Belakang',
        dock_navigation: 'Bilah Bawah & Navigasi',
        auto_hide_empty: 'Sembunyikan kategori kosong secara otomatis',
        save_changes: 'Simpan Pengaturan',
        saving: 'Menyimpan...',
        saved_success: 'Pengaturan berhasil disimpan!',
        reset_factory: 'Atur Ulang ke Default',
        rescan_areas: 'Pindai Ulang Ruangan & Perangkat (Pengaturan Awal)',
        rescan_confirm: 'Apakah Anda ingin memindai ulang seluruh ruangan dan perangkat? Penyesuaian manual Anda akan diperbarui.',
        close: 'Tutup',
        cancel: 'Batal',
        move_up: 'Pindah ke atas',
        move_down: 'Pindah ke bawah',
        general: 'Umum',
        dock: 'Bilah Bawah',
        provisioning: 'Pengaturan Awal',
        video_player: 'Pemutar Video (Shield, Kodi dll.)',
        audio_player: 'Pemutar Audio (Amplifier, HiFi)',
        tv_display: 'Televisi (Layar TV)',
        streaming: 'Streaming & Pemutaran Video',
        dpad_up: 'Atas',
        dpad_down: 'Bawah',
        dpad_left: 'Kiri',
        dpad_right: 'Kanan',
        dpad_select: 'OK',
        back: 'Kembali',
        home: 'Beranda',
        menu: 'Menu',
        bg_mode: 'Mode Latar Belakang',
        bg_mode_auto: 'Otomatis (Berdasarkan Preset & Matahari)',
        bg_mode_dark: 'Skema Gelap (Teks & Kaca Terang)',
        bg_mode_light: 'Skema Terang (Teks & Kaca Gelap)',
        color_scheme: 'Skema Warna (Font, Modal & Pil)',
        scheme_auto: 'Standar (Sesuai Latar Belakang)',
        scheme_neon: 'Neon Kosmik (Sian & Safir)',
        scheme_sunset: 'Senja Hangat (Amber & Terakota)',
        scheme_emerald: 'Mint Zamrud (Zamrud & Mint)',
        scheme_monochrome: 'Kaca Monokrom (Netral)',
        scheme_high_contrast: 'Kontras Tinggi Terang (Siang Hari)',
        scheme_custom: 'Kustom (Ditentukan Pengguna)',
        color_text_primary: 'Warna Teks Utama',
        color_text_secondary: 'Warna Teks Sekunder',
        color_modal_bg: 'Warna Latar Belakang Modal',
        color_pill_bg: 'Warna Latar Belakang Pil',
        stop: 'Berhenti',
        toggle_light: 'Nyalakan/matikan lampu',
        open_climate: 'Buka pengatur suhu',
        toggle_media: 'Putar/jeda media',
        toggle_lock: 'Kunci/buka kunci',
        adjust_temp: 'Sesuaikan suhu target',
        temp_down: 'Turunkan suhu',
        temp_up: 'Naikkan suhu'
      }
    };
  }

  static get ICONS() {
    return {
  "sun": "<circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41\"/>",
  "snowflake": "<path d=\"M12 2v20M2 12h20M20 16l-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
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
  "settings": "<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z\"/>",
  "play": "<polygon points=\"5 3 19 12 5 21 5 3\" fill=\"currentColor\"/>",
  "pause": "<rect x=\"6\" y=\"4\" width=\"4\" height=\"16\"/><rect x=\"14\" y=\"4\" width=\"4\" height=\"16\"/>",
  "skip-back": "<polygon points=\"19 20 9 12 19 4 19 20\"/><line x1=\"5\" y1=\"19\" x2=\"5\" y2=\"5\"/>",
  "skip-forward": "<polygon points=\"5 4 15 12 5 20 5 4\"/><line x1=\"19\" y1=\"5\" x2=\"19\" y2=\"19\"/>",
  "volume-up": "<polygon points=\"11 5 6 9 2 9 2 15 6 15 11 19 11 5\"/><path d=\"M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07\"/>",
  "volume-down": "<polygon points=\"11 5 6 9 2 9 2 15 6 15 11 19 11 5\"/><path d=\"M15.54 8.46a5 5 0 0 1 0 7.07\"/>",
  "volume-mute": "<polygon points=\"11 5 6 9 2 9 2 15 6 15 11 19 11 5\"/><line x1=\"23\" y1=\"9\" x2=\"17\" y2=\"15\"/><line x1=\"17\" y1=\"9\" x2=\"23\" y2=\"15\"/>",
  "arrow-up": "<line x1=\"12\" y1=\"19\" x2=\"12\" y2=\"5\"/><polyline points=\"5 12 12 5 19 12\"/>",
  "arrow-down": "<line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"/><polyline points=\"19 12 12 19 5 12\"/>",
  "arrow-left": "<line x1=\"19\" y1=\"12\" x2=\"5\" y2=\"12\"/><polyline points=\"12 19 5 12 12 5\"/>",
  "arrow-right": "<line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"/><polyline points=\"12 5 19 12 12 19\"/>",
  "sparkles": "<path d=\"m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z\"/>",
  "power": "<path d=\"M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10\"/>",
  "stop": "<rect x=\"6\" y=\"6\" width=\"12\" height=\"12\" rx=\"2\" fill=\"currentColor\"/>",
  "rotate-ccw": "<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\"/><path d=\"M3 3v5h5\"/>",
  "menu": "<line x1=\"4\" y1=\"6\" x2=\"20\" y2=\"6\"/><line x1=\"4\" y1=\"12\" x2=\"20\" y2=\"12\"/><line x1=\"4\" y1=\"18\" x2=\"20\" y2=\"18\"/>"
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

  

  async _saveDashboardConfig(newCardConfig) {
    console.info('[VisionGlass] Saving updated configuration...', newCardConfig);
    const toast = this.shadowRoot.getElementById('settingsToast');
    const saveBtn = this.shadowRoot.getElementById('btnSaveSettingsModal') || this.shadowRoot.getElementById('btnSaveSettingsView');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = this._t('saving');
    }

    try {
      this._config = JSON.parse(JSON.stringify(newCardConfig));
      this._fireConfigChanged(this._config);

      // Persist directly to Home Assistant storage via Lovelace WebSocket
      if (this._hass && this._hass.callWS) {
        try {
          const currentDash = await this._hass.callWS({ type: 'lovelace/config', url_path: 'vision-glass', force_reload: true });
          if (currentDash && currentDash.views) {
            // Update root dashboard theme to persist across reloads
            const themeMode = this._config.theme_mode || 'auto';
            if (themeMode === 'light') {
              currentDash.theme = 'Vision Glass Light';
            } else if (themeMode === 'dark') {
              currentDash.theme = 'Vision Glass Dark';
            } else {
              currentDash.theme = 'Vision Glass';
            }

            let found = false;
            for (const view of currentDash.views) {
              if (view.theme) delete view.theme;
              if (view.cards) {
                for (let i = 0; i < view.cards.length; i++) {
                  if (view.cards[i].type === 'custom:vision-glass-dashboard') {
                    if (view.cards[i].mode !== 'settings') {
                      const saveConfig = JSON.parse(JSON.stringify(this._config));
                      delete saveConfig.mode;
                      delete saveConfig.title;
                      view.cards[i] = saveConfig;
                      found = true;
                    } else {
                      view.cards[i].theme_mode = themeMode;
                      view.cards[i].background_style = this._config.background_style;
                      view.cards[i].ambient_speed = this._config.ambient_speed;
                      view.cards[i].background_mode = this._config.background_mode;
                      view.cards[i].color_scheme = this._config.color_scheme;
                    }
                  }
                }
              }
            }
            if (found) {
              await this._hass.callWS({ type: 'lovelace/config/save', url_path: 'vision-glass', config: currentDash });
              console.info(`[VisionGlass] Successfully saved dashboard configuration and theme (${currentDash.theme}) to Lovelace storage!`);
            }
          }
        } catch (wsErr) {
          console.warn('[VisionGlass] WebSocket save notice (relying on config-changed):', wsErr);
        }
      }

      // Sync frontend theme if requested
      if (this._config.theme_mode === 'light') {
        this._callService('frontend', 'set_theme', { name: 'Vision Glass Light' });
      } else if (this._config.theme_mode === 'dark') {
        this._callService('frontend', 'set_theme', { name: 'Vision Glass Dark' });
      } else if (this._config.theme_mode === 'auto') {
        this._callService('frontend', 'set_theme', { name: 'Vision Glass' });
      }

      if (toast) {
        toast.style.display = 'block';
        toast.textContent = this._t('saved_success');
        setTimeout(() => { if (toast) toast.style.display = 'none'; }, 3500);
      }

      this._render();
      this._applyThemeClass();
    } catch (err) {
      console.error('[VisionGlass] Save failed:', err);
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = this._t('save_changes');
      }
    }
  }

  async _ensureSettingsViewExists() {
    if (this._checkedSettingsView || !this._hass || !this._hass.callWS) return;
    this._checkedSettingsView = true;
    try {
      const dash = await this._hass.callWS({ type: 'lovelace/config', url_path: 'vision-glass', force_reload: true });
      if (dash && dash.views) {
        const hasSettings = dash.views.some(v => v.path === 'settings');
        if (!hasSettings) {
          console.info('[VisionGlass] Automatically provisioning settings view in dashboard...');
          dash.views.push({
            title: 'Einstellungen',
            path: 'settings',
            icon: 'mdi:cog',
            type: 'panel',
            cards: [{ type: 'custom:vision-glass-dashboard', mode: 'settings' }]
          });
          await this._hass.callWS({ type: 'lovelace/config/save', url_path: 'vision-glass', config: dash });
          console.info('[VisionGlass] Settings view created successfully.');
        }
      }
    } catch (e) {
      console.debug('[VisionGlass] Check settings view:', e);
    }
  }

  async _syncAreas() {
    if (!this._hass) return { updatedCount: 0, discoveredCount: 0, total: 0 };
    console.info('[VisionGlass] Synchronizing areas from Home Assistant...');
    let areas = [];
    if (this._hass.callWS) {
      try {
        areas = await this._hass.callWS({ type: 'config/area_registry/list' });
      } catch (e) {
        if (this._hass.areas) areas = Object.values(this._hass.areas);
      }
    } else if (this._hass && this._hass.areas) {
      areas = Object.values(this._hass.areas);
    }

    if (!areas || areas.length === 0) return { updatedCount: 0, discoveredCount: 0, total: 0 };

    if (!this._config.rooms) this._config.rooms = [];

    let updatedCount = 0;
    let discoveredCount = 0;

    // 1. Update existing rooms by area_id (r.id)
    for (const r of this._config.rooms) {
      const area = areas.find(a => a.area_id === r.id);
      if (area) {
        if (area.name && r.name !== area.name) {
          console.info(`[VisionGlass] Tracking renamed room: ${r.name} -> ${area.name} (area_id: ${r.id})`);
          r.name = area.name;
          updatedCount++;
        }
        if (area.picture !== undefined && r.picture !== area.picture) {
          r.picture = area.picture;
          updatedCount++;
        }
      }
    }

    // 2. Discover new areas from HA not yet in this._config.rooms
    for (const area of areas) {
      const exists = this._config.rooms.some(r => r.id === area.area_id);
      if (!exists) {
        const matched = [];
        Object.keys(this._hass.states).forEach(eId => {
          if (this._hass.entities && this._hass.entities[eId] && this._hass.entities[eId].area_id === area.area_id) {
            matched.push(eId);
          } else if (eId.includes(area.area_id)) {
            matched.push(eId);
          }
        });
        const lights = matched.filter(e => e.startsWith('light.'));
        const climates = matched.filter(e => e.startsWith('climate.'));
        const switches = matched.filter(e => e.startsWith('switch.'));
        const temps = matched.filter(e => e.startsWith('sensor.') && (e.includes('temperatur') || e.includes('temperature') || this._hass.states[e]?.attributes?.device_class === 'temperature'));
        const humidities = matched.filter(e => e.startsWith('sensor.') && (e.includes('humidity') || e.includes('feucht') || this._hass.states[e]?.attributes?.device_class === 'humidity'));
        const illuminances = matched.filter(e => e.startsWith('sensor.') && (e.includes('illuminance') || e.includes('helligkeit') || e.includes('lux') || this._hass.states[e]?.attributes?.device_class === 'illuminance'));
        const presences = matched.filter(e => e.startsWith('binary_sensor.') && (e.includes('occupied') || e.includes('motion') || e.includes('prasenz') || e.includes('presence')));
        const windows = matched.filter(e => e.startsWith('binary_sensor.') && (e.includes('fenster') || e.includes('window') || e.includes('contact')));
        const media = matched.filter(e => e.startsWith('media_player.'));

        this._config.rooms.push({
          id: area.area_id,
          name: area.name,
          picture: area.picture || null,
          light_entity: lights[0] || null,
          climate_entity: climates[0] || null,
          temp_entity: temps[0] || null,
          humidity_entity: humidities[0] || null,
          illuminance_entity: illuminances[0] || null,
          presence_entity: presences[0] || null,
          window_entity: windows[0] || null,
          switch_entity: switches[0] || null,
          media_entity: media[0] || null,
          overlay_categories: []
        });
        discoveredCount++;
        console.info(`[VisionGlass] Discovered new area: ${area.name} (${area.area_id})`);
      }
    }

    // 3. Save config
    await this._saveDashboardConfig(this._config);
    return { updatedCount, discoveredCount, total: areas.length };
  }

  render() {
    this._render();
  }

  async _loadDashboardConfigForStandaloneSettings() {
    if (this._standaloneConfigLoaded) return;
    if (this._hass && this._hass.callWS) {
      try {
        const currentDash = await this._hass.callWS({ type: 'lovelace/config', url_path: 'vision-glass', force_reload: true });
        if (currentDash && currentDash.views) {
          for (const view of currentDash.views) {
            if (view.cards) {
              const mainCard = view.cards.find(c => c.type === 'custom:vision-glass-dashboard' && c.mode !== 'settings');
              if (mainCard) {
                this._standaloneConfigLoaded = true;
                const mode = this._config.mode;
                this._config = JSON.parse(JSON.stringify(mainCard));
                this._config.mode = mode;
                const cont = this.shadowRoot.getElementById('settingsPageContainer');
                if (cont) this._renderSettingsContent(cont, false);
                this._applyThemeClass();
                break;
              }
            }
          }
        }
      } catch (err) {
        console.warn('[VisionGlass] Could not load standalone dashboard config:', err);
      }
    }
  }

  _fireConfigChanged(newConfig) {
    const event = new CustomEvent('config-changed', {
      bubbles: true,
      composed: true,
      detail: { config: newConfig }
    });
    this.dispatchEvent(event);
  }

  _autoProvision(hass) {
    if (!hass) return;
    console.info('[VisionGlass] Initial Auto-Provisioning: scanning areas and entities...');
    const detectedRooms = [];
    const areas = hass.areas ? Object.values(hass.areas) : [];

    if (areas.length > 0) {
      areas.forEach(area => {
        const areaId = area.area_id;
        const areaName = area.name;
        const areaPic = area.picture || null;

        const matched = [];
        Object.keys(hass.states).forEach(eId => {
          if (hass.entities && hass.entities[eId] && hass.entities[eId].area_id === areaId) {
            matched.push(eId);
            return;
          }
          const s = hass.states[eId];
          if (s && s.attributes && s.attributes.area_id === areaId) {
            matched.push(eId);
            return;
          }
          const normE = eId.toLowerCase().replace(/[^a-z0-9]/g, '');
          const normA = areaId.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (normE.includes(normA) || normA.includes(normE)) {
            matched.push(eId);
          }
        });

        const lights = matched.filter(e => e.startsWith('light.'));
        const climates = matched.filter(e => e.startsWith('climate.'));
        const temps = matched.filter(e => e.startsWith('sensor.') && (e.includes('temp') || hass.states[e]?.attributes?.device_class === 'temperature'));
        const humidities = matched.filter(e => e.startsWith('sensor.') && (e.includes('humid') || hass.states[e]?.attributes?.device_class === 'humidity'));
        const luxes = matched.filter(e => e.startsWith('sensor.') && (e.includes('illuminance') || e.includes('lux') || hass.states[e]?.attributes?.device_class === 'illuminance'));
        const occupancies = matched.filter(e => e.startsWith('binary_sensor.') && (e.includes('occup') || e.includes('motion') || e.includes('beweg') || hass.states[e]?.attributes?.device_class === 'occupancy' || hass.states[e]?.attributes?.device_class === 'motion'));
        const windows = matched.filter(e => e.startsWith('binary_sensor.') && (e.includes('fenster') || e.includes('window') || hass.states[e]?.attributes?.device_class === 'window' || hass.states[e]?.attributes?.device_class === 'door'));
        const switches = matched.filter(e => e.startsWith('switch.'));
        const media = matched.filter(e => e.startsWith('media_player.'));

        const overlayCats = [];
        if (lights.length > 0) {
          overlayCats.push({ id: 'lighting', name: 'Beleuchtung', icon: 'ci:light-cove-strip', entities: lights });
        }
        if (climates.length > 0 || temps.length > 0) {
          overlayCats.push({ id: 'climate', name: 'Klima & Heizung', icon: 'mdi:radiator', entities: [...climates, ...temps.slice(0, 2), ...humidities.slice(0, 1)] });
        }
        if (switches.length > 0 || media.length > 0) {
          overlayCats.push({ id: 'devices', name: 'Geräte & Steckdosen', icon: 'ci:smart-plug-meter', entities: [...switches, ...media] });
        }
        if (occupancies.length > 0 || windows.length > 0) {
          overlayCats.push({ id: 'sensors', name: 'Sensoren & Sicherheit', icon: 'ci:window-handle-closed', entities: [...occupancies, ...windows] });
        }

        detectedRooms.push({
          id: areaId,
          name: areaName,
          picture: areaPic,
          light_entity: lights[0] || null,
          climate_entity: climates[0] || null,
          temp_entity: temps[0] || null,
          humidity_entity: humidities[0] || null,
          illuminance_entity: luxes[0] || null,
          presence_entity: occupancies[0] || null,
          window_entity: windows[0] || null,
          switch_entity: switches[0] || null,
          media_entity: media[0] || null,
          overlay_categories: overlayCats
        });
      });
    }

    const hasAlarmo = Object.keys(hass.states).some(e => e.startsWith('alarm_control_panel.'));
    const hasLights = Object.keys(hass.states).some(e => e.startsWith('light.'));
    const hasClimate = Object.keys(hass.states).some(e => e.startsWith('climate.'));
    const hasSwitches = Object.keys(hass.states).some(e => e.startsWith('switch.'));
    const hasBatteries = Object.keys(hass.states).some(e => e.includes('battery') || hass.states[e]?.attributes?.device_class === 'battery');

    const defaultDockItems = [
      { id: 'lighting', title: 'Beleuchtung', enabled: hasLights, auto_hide: true },
      { id: 'climate', title: 'Heizung', enabled: hasClimate, auto_hide: true },
      { id: 'stats', title: 'Statistiken', enabled: true, auto_hide: false },
      { id: 'security', title: 'Sicherheit', enabled: true, auto_hide: false },
      { id: 'alarmo', title: 'Alarmo', enabled: hasAlarmo, auto_hide: true },
      { id: 'switches', title: 'Geräte', enabled: hasSwitches, auto_hide: true },
      { id: 'battery', title: 'Batteriestatus', enabled: hasBatteries, auto_hide: true },
      { id: 'weather', title: 'Wetter', enabled: true, auto_hide: false }
    ];

    const newConfig = {
      ...this._config,
      _initialized: true,
      rooms: detectedRooms.length > 0 ? detectedRooms : (this._config.rooms || []),
      dock: {
        auto_detect: true,
        items: defaultDockItems
      }
    };

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
    this._render();
    console.info('[VisionGlass] Initial Auto-Provisioning complete!');
  }

  setConfig(config) {
    if (!config) throw new Error('Invalid configuration');
    const stub = VisionGlassDashboard.getStubConfig();
    this._config = {
      ...stub,
      ...config,
      rooms: (config.rooms && config.rooms.length > 0) ? config.rooms.map(r => {
        const sr = stub.rooms.find(s => s.id === r.id) || {};
        return {
          ...sr,
          ...r,
          humidity_entity: r.humidity_entity !== undefined ? r.humidity_entity : (sr.humidity_entity || null),
          illuminance_entity: r.illuminance_entity !== undefined ? r.illuminance_entity : (sr.illuminance_entity || null)
        };
      }) : stub.rooms,
      dock: config.dock || stub.dock || { auto_detect: true, items: [] }
    };
    this._render();
    this._initialRenderDone = true;
  }

  set hass(hass) {
    this._hass = hass;
    if (this._config && (this._config.mode === 'settings' || this._config.view === 'settings')) {
      if (!this._standaloneConfigLoaded) {
        this._loadDashboardConfigForStandaloneSettings();
      }
      return;
    }
    if (!this._initialRenderDone) return;
    if (this._updateRaf) return;
    this._updateRaf = requestAnimationFrame(() => {
      this._updateRaf = null;
      this._updateAll();
    });
  }

  _getLang() {
    if (this._hass) {
      const hl = (this._hass.language || (this._hass.locale && this._hass.locale.language) || '').toLowerCase();
      if (hl.startsWith('id') || hl.startsWith('in')) return 'id';
      if (hl.startsWith('en')) return 'en';
    }
    return 'de';
  }

  _t(key) {
    const lang = this._getLang();
    return (VisionGlassDashboard.I18N[lang] && VisionGlassDashboard.I18N[lang][key]) ||
           (VisionGlassDashboard.I18N['de'] && VisionGlassDashboard.I18N['de'][key]) ||
           key;
  }

  _fireMoreInfo(entityId) {
    const event = new CustomEvent('hass-more-info', {
      bubbles: true,
      composed: true,
      detail: { entityId }
    });
    this.dispatchEvent(event);
  }

  set editMode(val) {
    this._isEditMode = Boolean(val);
    this._updateEditModeBanner();
  }

  get editMode() {
    return this._isEditMode || false;
  }

  _checkIsEditMode() {
    if (this._isEditMode) return true;
    if (typeof window !== 'undefined' && window.location.search && window.location.search.includes('edit=1')) return true;
    const parent = this.closest ? this.closest('hui-view, hui-panel-view, [edit-mode]') : null;
    if (parent && (parent.hasAttribute('edit-mode') || parent.classList.contains('edit-mode'))) return true;
    return false;
  }

  _updateEditModeBanner() {
    const banner = this.shadowRoot ? this.shadowRoot.getElementById('editModeBanner') : null;
    if (!banner) return;
    const isEdit = this._checkIsEditMode();
    banner.style.display = isEdit ? 'flex' : 'none';
  }

  connectedCallback() {
    this._startClock();
    this._ensureSettingsViewExists();
    try {
      const viewParent = this.closest ? this.closest('hui-view, hui-panel-view, ha-panel-lovelace') : null;
      if (viewParent && window.MutationObserver) {
        this._editModeObserver = new MutationObserver(() => {
          this._updateEditModeBanner();
        });
        this._editModeObserver.observe(viewParent, { attributes: true, attributeFilter: ['edit-mode', 'class'] });
      }
    } catch (e) {}
  }

  disconnectedCallback() {
    if (this._timer) clearInterval(this._timer);
    if (this._editModeObserver) {
      this._editModeObserver.disconnect();
      this._editModeObserver = null;
    }
  }

  _startClock() {
    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => {
      const clockEl = this.shadowRoot.getElementById('liveClock');
      if (clockEl) {
        const now = new Date();
        const locale = this._getLocale();
        clockEl.textContent = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
    }, 1000);
  }

  _getLocale() {
    const lang = this._getLang();
    if (lang === 'en') return 'en-US';
    if (lang === 'id') return 'id-ID';
    return 'de-DE';
  }

  _isDaytime() {
    if (this._config && this._config.theme_mode === 'light') return true;
    if (this._config && this._config.theme_mode === 'dark') return false;
    if (this._hass && this._hass.states['sun.sun']) {
      return this._hass.states['sun.sun'].state === 'above_horizon';
    }
    const hour = new Date().getHours();
    return hour >= 7 && hour < 18;
  }

  _resolveEffectiveThemeMode() {
    const bgStyle = (this._config && this._config.background_style) || 'aurora';
    const bgMode = (this._config && this._config.background_mode) || 'auto'; // 'auto' | 'dark' | 'light'
    const themeMode = (this._config && this._config.theme_mode) || 'auto';   // 'auto' | 'dark' | 'light'

    // 1. Explicit background_mode override
    if (bgMode === 'dark') return 'dark';
    if (bgMode === 'light') return 'light';

    // 2. Preset intrinsic modes if background_mode is 'auto'
    if (bgStyle === 'deep_space') return 'dark';
    if (bgStyle === 'sunset') return 'dark';

    // 3. User's theme_mode setting
    if (themeMode === 'light') return 'light';
    if (themeMode === 'dark') return 'dark';

    // 4. Sun daylight fallback
    return this._isDaytime() ? 'light' : 'dark';
  }

  _applyThemeClass() {
    const root = this.shadowRoot.querySelector('.dashboard-root');
    if (!root) return;
    const effMode = this._resolveEffectiveThemeMode();
    const isLight = effMode === 'light';

    if (isLight) {
      root.classList.remove('theme-dark');
      root.classList.add('theme-light');
    } else {
      root.classList.remove('theme-light');
      root.classList.add('theme-dark');
    }

    // Apply Background Style Preset
    const bgStyle = (this._config && this._config.background_style) || 'aurora';
    ['bg-aurora', 'bg-mesh', 'bg-deep_space', 'bg-sunset', 'bg-minimal', 'bg-custom'].forEach(cls => root.classList.remove(cls));
    root.classList.add(`bg-${bgStyle}`);

    // If custom image, apply inline background style
    if (bgStyle === 'custom' && this._config && this._config.background_image_url) {
      root.style.backgroundImage = `url("${this._config.background_image_url}")`;
      root.style.backgroundSize = 'cover';
      root.style.backgroundPosition = 'center';
    } else {
      root.style.backgroundImage = '';
    }

    // Apply Animation Speed Class
    const animSpeed = (this._config && this._config.ambient_speed) || 'normal';
    ['anim-relaxed', 'anim-normal', 'anim-vivid'].forEach(cls => root.classList.remove(cls));
    root.classList.add(`anim-${animSpeed}`);

    // Apply Farbschema für Schriften, Modal und Pillenhintergründe
    const scheme = (this._config && this._config.color_scheme) || 'auto';
    ['scheme-neon_cyan', 'scheme-warm_amber', 'scheme-emerald_mint', 'scheme-monochrome_frosted', 'scheme-high_contrast_light', 'scheme-custom'].forEach(cls => root.classList.remove(cls));

    if (scheme === 'neon_cyan') {
      root.style.setProperty('--accent', '#38bdf8');
      root.style.setProperty('--bg-modal', 'rgba(10, 20, 38, 0.93)');
      root.style.setProperty('--bg-pill', 'rgba(56, 189, 248, 0.12)');
      root.style.setProperty('--text-primary', '#f0f9ff');
      root.style.setProperty('--text-secondary', '#7dd3fc');
    } else if (scheme === 'warm_amber') {
      root.style.setProperty('--accent', '#f59e0b');
      root.style.setProperty('--bg-modal', 'rgba(28, 18, 38, 0.93)');
      root.style.setProperty('--bg-pill', 'rgba(245, 158, 11, 0.14)');
      root.style.setProperty('--text-primary', '#fffbeb');
      root.style.setProperty('--text-secondary', '#fde68a');
    } else if (scheme === 'emerald_mint') {
      root.style.setProperty('--accent', '#10b981');
      root.style.setProperty('--bg-modal', 'rgba(6, 32, 28, 0.93)');
      root.style.setProperty('--bg-pill', 'rgba(16, 185, 129, 0.12)');
      root.style.setProperty('--text-primary', '#ecfdf5');
      root.style.setProperty('--text-secondary', '#6ee7b7');
    } else if (scheme === 'monochrome_frosted') {
      root.style.setProperty('--accent', isLight ? '#0f172a' : '#ffffff');
      root.style.setProperty('--bg-modal', isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(18, 18, 18, 0.93)');
      root.style.setProperty('--bg-pill', isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--text-primary', isLight ? '#0f172a' : '#ffffff');
      root.style.setProperty('--text-secondary', isLight ? '#52525b' : '#a1a1aa');
    } else if (scheme === 'high_contrast_light') {
      root.style.setProperty('--accent', '#0284c7');
      root.style.setProperty('--bg-modal', 'rgba(255, 255, 255, 0.97)');
      root.style.setProperty('--bg-pill', 'rgba(241, 245, 249, 0.95)');
      root.style.setProperty('--text-primary', '#0f172a');
      root.style.setProperty('--text-secondary', '#334155');
    } else if (scheme === 'custom') {
      if (this._config.color_accent) root.style.setProperty('--accent', this._config.color_accent);
      if (this._config.color_modal_bg) root.style.setProperty('--bg-modal', this._config.color_modal_bg);
      if (this._config.color_pill_bg) root.style.setProperty('--bg-pill', this._config.color_pill_bg);
      if (this._config.color_text_primary) root.style.setProperty('--text-primary', this._config.color_text_primary);
      if (this._config.color_text_secondary) root.style.setProperty('--text-secondary', this._config.color_text_secondary);
    } else {
      root.style.removeProperty('--accent');
      root.style.removeProperty('--bg-modal');
      root.style.removeProperty('--bg-pill');
      root.style.removeProperty('--text-primary');
      root.style.removeProperty('--text-secondary');
    }
  }

  _callService(domain, service, data) {
    if (!this._hass) return;
    this._hass.callService(domain, service, data);
  }

  _sendRemoteCommand(mediaPlayerId, commandKey) {
    if (!this._hass) return;
    const mpObj = this._hass.states[mediaPlayerId];
    const mpName = ((mpObj?.attributes?.friendly_name || '') + ' ' + mediaPlayerId).toLowerCase();

    // 1. Kodi JSON-RPC methods
    if (mpName.includes('kodi') || mediaPlayerId.includes('kodi')) {
      const kodiMap = {
        'up': 'Input.Up',
        'down': 'Input.Down',
        'left': 'Input.Left',
        'right': 'Input.Right',
        'select': 'Input.Select',
        'back': 'Input.Back',
        'home': 'Input.Home',
        'menu': 'Input.ContextMenu',
        'info': 'Input.Info'
      };
      const method = kodiMap[commandKey] || 'Input.Select';
      this._callService('kodi', 'call_method', { entity_id: mediaPlayerId, method: method });
      return;
    }

    // 2. Resolve paired remote entity
    let remoteEntity = mediaPlayerId.replace('media_player.', 'remote.');
    if (!this._hass.states[remoteEntity]) {
      const remKeys = Object.keys(this._hass.states).filter(k => k.startsWith('remote.'));
      const found = remKeys.find(rId => {
        const rName = ((this._hass.states[rId]?.attributes?.friendly_name || '') + ' ' + rId).toLowerCase();
        if (mpName.includes('shield') && (rName.includes('shield') || rId.includes('shield'))) return true;
        if (mpName.includes('tv') && rName.includes('tv')) return true;
        return false;
      });
      if (found) remoteEntity = found;
    }

    if (this._hass.states[remoteEntity]) {
      const rObj = this._hass.states[remoteEntity];
      const rName = ((rObj?.attributes?.friendly_name || '') + ' ' + remoteEntity).toLowerCase();

      if (rName.includes('samsung') || rName.includes('tv')) {
        const samsungMap = {
          'up': 'KEY_UP',
          'down': 'KEY_DOWN',
          'left': 'KEY_LEFT',
          'right': 'KEY_RIGHT',
          'select': 'KEY_ENTER',
          'back': 'KEY_RETURN',
          'home': 'KEY_HOME',
          'menu': 'KEY_MENU',
          'info': 'KEY_INFO'
        };
        const cmd = samsungMap[commandKey] || 'KEY_ENTER';
        this._callService('remote', 'send_command', { entity_id: remoteEntity, command: [cmd] });
        return;
      }

      // Android TV / Shield standard remote commands
      const androidMap = {
        'up': 'DPAD_UP',
        'down': 'DPAD_DOWN',
        'left': 'DPAD_LEFT',
        'right': 'DPAD_RIGHT',
        'select': 'DPAD_CENTER',
        'back': 'BACK',
        'home': 'HOME',
        'menu': 'MENU',
        'info': 'INFO'
      };
      const cmd = androidMap[commandKey] || 'DPAD_CENTER';
      this._callService('remote', 'send_command', { entity_id: remoteEntity, command: [cmd] });
      return;
    }

    // 3. Fallback to androidtv adb_command if available
    const adbMap = {
      'up': 'UP',
      'down': 'DOWN',
      'left': 'LEFT',
      'right': 'RIGHT',
      'select': 'CENTER',
      'back': 'BACK',
      'home': 'HOME',
      'menu': 'MENU',
      'info': 'INFO'
    };
    const adbCmd = adbMap[commandKey] || 'CENTER';
    this._callService('androidtv', 'adb_command', { entity_id: mediaPlayerId, command: adbCmd });
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

    title.textContent = `${room.name} – ${this._t('overview_devices')}`;

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
    const humEntity = (room.humidity_entity && room.humidity_entity.trim()) ? room.humidity_entity.trim() : null;
    const humObj = humEntity && this._hass.states[humEntity];
    const curHum = humObj && humObj.state && !isNaN(parseFloat(humObj.state)) ? Math.round(parseFloat(humObj.state)) : null;

    const luxEntity = (room.illuminance_entity && room.illuminance_entity.trim()) ? room.illuminance_entity.trim() : null;
    const luxObj = luxEntity && this._hass.states[luxEntity];
    const curLux = luxObj && luxObj.state && !isNaN(parseFloat(luxObj.state)) ? Math.round(parseFloat(luxObj.state)) : null;

    // Room-specific Komfort & Eco temperature helpers
    const helperRoomKey = roomSlug === 'badezimmer' ? 'bad' : roomSlug;
    const komfortHelperId = `input_number.${helperRoomKey}_komfort_temperatur`;
    const ecoHelperId = `input_number.${helperRoomKey}_eco_temperatur`;
    const komfortObj = this._hass.states[komfortHelperId];
    const ecoObj = this._hass.states[ecoHelperId];
    const komfortVal = komfortObj && komfortObj.state != null && !isNaN(parseFloat(komfortObj.state)) ? parseFloat(komfortObj.state).toFixed(1) : null;
    const ecoVal = ecoObj && ecoObj.state != null && !isNaN(parseFloat(ecoObj.state)) ? parseFloat(ecoObj.state).toFixed(1) : null;

    if (!this._roomEntitiesCache[roomSlug]) {
      const matchSwitches = [];
      const matchSensors = [];
      const matchMedia = [];
      Object.keys(this._hass.states).forEach(eId => {
        if (eId === room.light_entity || eId === room.climate_entity || eId === room.presence_entity || eId === room.window_entity || eId === room.switch_entity || eId === room.media_entity || eId === room.audio_entity || eId === room.video_entity || eId === room.temp_entity || eId === room.tv_entity || eId === 'switch.livingroom_multimedia' || (room.multimedia_switch && eId === room.multimedia_switch)) return;

        const eIdLower = eId.toLowerCase();
        const fnLower = ((this._hass.states[eId].attributes && this._hass.states[eId].attributes.friendly_name) || '').toLowerCase();

        const matches = eIdLower.includes(roomSlug) || fnLower.includes(roomSlug) || fnLower.includes(room.name.toLowerCase()) || aliases.some(a => eIdLower.includes(a));

        if (matches) {
          if (eId.startsWith('media_player.')) {
            matchMedia.push(eId);
          } else if (eId.startsWith('switch.') || eId.startsWith('light.')) {
            matchSwitches.push(eId);
          } else if (eId.startsWith('sensor.') || eId.startsWith('binary_sensor.')) {
            matchSensors.push(eId);
          }
        }
      });
      this._roomEntitiesCache[roomSlug] = { switches: matchSwitches, sensors: matchSensors, media: matchMedia };
    }

    const cached = this._roomEntitiesCache[roomSlug];
    cached.switches.forEach(id => {
      if (this._hass.states[id]) otherSwitches.push({ id, state: this._hass.states[id] });
    });
    cached.sensors.forEach(id => {
      if (this._hass.states[id]) otherSensors.push({ id, state: this._hass.states[id] });
    });

    // Resolve media players: TV Screen, Videoplayer (Shield, Kodi etc.), Audioplayer (HiFi, Echo etc.)
    const roomMedia = (cached.media || []).filter(id => this._hass.states[id]);

    // 1. Resolve TV Screen (Display)
    let tvId = (room.tv_entity && this._hass.states[room.tv_entity]) ? room.tv_entity : null;
    if (!tvId) {
      const tvMatch = roomMedia.find(id => {
        const s = this._hass.states[id];
        const name = ((s?.attributes?.friendly_name || '') + ' ' + id).toLowerCase();
        const isStreamer = name.includes('shield') || name.includes('kodi') || name.includes('apple_tv') || name.includes('appletv') || name.includes('fire_tv') || name.includes('firetv') || name.includes('chromecast') || name.includes('roku') || name.includes('plex');
        return s?.attributes?.device_class === 'tv' && !isStreamer;
      });
      if (tvMatch) tvId = tvMatch;
    }

    // 2. Resolve Videoplayer (Streaming Box, Shield, Kodi, Apple TV, Fire TV, Chromecast)
    let videoId = (room.video_entity && this._hass.states[room.video_entity]) ? room.video_entity : null;
    if (!videoId) {
      const videoMatch = roomMedia.find(id => {
        if (id === tvId) return false;
        const s = this._hass.states[id];
        const name = ((s?.attributes?.friendly_name || '') + ' ' + id).toLowerCase();
        const isStreamer = name.includes('shield') || name.includes('kodi') || name.includes('apple_tv') || name.includes('appletv') || name.includes('fire_tv') || name.includes('firetv') || name.includes('chromecast') || name.includes('androidtv') || name.includes('android_tv') || name.includes('plex') || name.includes('roku');
        const isVideoContent = ['video', 'movie', 'tvshow', 'episode'].includes(s?.attributes?.media_content_type);
        return isStreamer || isVideoContent;
      });
      if (videoMatch) videoId = videoMatch;
    }

    // 3. Resolve Audioplayer (Receiver, Smart Speaker, Echo, Sonos, HiFi)
    let audioId = (room.audio_entity && this._hass.states[room.audio_entity])
      ? room.audio_entity
      : (room.media_entity && room.media_entity !== tvId && room.media_entity !== videoId && this._hass.states[room.media_entity] ? room.media_entity : null);
    if (!audioId) {
      const audioMatch = roomMedia.find(id => {
        if (id === tvId || id === videoId) return false;
        const s = this._hass.states[id];
        const name = ((s?.attributes?.friendly_name || '') + ' ' + id).toLowerCase();
        const isSpeaker = s?.attributes?.device_class === 'speaker' || s?.attributes?.device_class === 'receiver';
        const isAudioName = name.includes('denon') || name.includes('echo') || name.includes('sonos') || name.includes('avr') || name.includes('speaker') || name.includes('audio') || name.includes('soundbar') || name.includes('everywhere');
        return isSpeaker || isAudioName;
      });
      if (audioMatch) audioId = audioMatch;
    }

    body.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.06);border:1px solid var(--border-subtle);border-radius:20px;padding:16px 20px;flex-wrap:wrap;gap:12px;">
          <div>
            <div style="font-size:22px;font-weight:700;">${room.name}</div>
            <div style="font-size:13px;color:var(--text-secondary);margin-top:3px;">
              ${isPres ? this._icon('motion', { size: 14, cls: 'icon-security', style: 'margin-right:4px;' }) + ' ' + this._t('person_present') : this._icon('motion-idle', { size: 14, style: 'margin-right:4px;' }) + ' ' + this._t('no_motion')} • ${isWinOpen ? this._icon('window-open', { size: 14, cls: 'icon-climate', style: 'margin-right:4px;' }) + ' ' + this._t('window_open') : this._icon('window', { size: 14, cls: 'icon-security', style: 'margin-right:4px;' }) + ' ' + this._t('window_closed')}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <div style="text-align:center;padding:6px 12px;background:rgba(255,255,255,0.06);border:1px solid var(--border-subtle);border-radius:14px;">
              <div style="font-size:19px;font-weight:700;color:var(--accent);">${curTemp}°C</div>
              <div style="font-size:11px;color:var(--text-secondary);display:flex;align-items:center;justify-content:center;gap:3px;margin-top:1px;">${this._icon('thermometer', { size: 11, cls: 'icon-temp' })} ${this._t('temp')}</div>
            </div>
            ${curHum != null ? `
              <div style="text-align:center;padding:6px 12px;background:rgba(255,255,255,0.06);border:1px solid var(--border-subtle);border-radius:14px;">
                <div style="font-size:19px;font-weight:700;color:#0284c7;">${curHum}%</div>
                <div style="font-size:11px;color:var(--text-secondary);display:flex;align-items:center;justify-content:center;gap:3px;margin-top:1px;">${this._icon('droplet', { size: 11, cls: 'icon-humidity' })} ${this._t('humidity')}</div>
              </div>
            ` : ''}
            ${curLux != null ? `
              <div style="text-align:center;padding:6px 12px;background:rgba(255,255,255,0.06);border:1px solid var(--border-subtle);border-radius:14px;">
                <div style="font-size:19px;font-weight:700;color:#f59e0b;">${curLux} lx</div>
                <div style="font-size:11px;color:var(--text-secondary);display:flex;align-items:center;justify-content:center;gap:3px;margin-top:1px;">${this._icon('lux', { size: 11, cls: 'icon-lux' })} ${this._t('lux')}</div>
              </div>
            ` : ''}
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;">
          ${mmSwitchObj ? `
            <div class="control-row" style="background:rgba(56,189,248,0.14);border:1px solid rgba(56,189,248,0.4);grid-column:1/-1;">
              <div>
                <div style="font-weight:700;font-size:15px;color:var(--text-primary);display:flex;align-items:center;gap:6px;">${this._icon('tv', { size: 16, cls: 'icon-switch' })} ${this._t('multimedia_hub')}</div>
                <div style="font-size:12px;color:var(--text-secondary);">${this._t('multimedia_desc')} • ${mmSwitchObj.state === 'on' ? this._t('active') : this._t('off')}</div>
              </div>
              <button class="toggle-pill ${mmSwitchObj.state === 'on' ? 'active-blue' : ''}" id="roomModalMultimediaToggle">
                ${mmSwitchObj.state === 'on' ? this._t('on') : this._t('off')}
              </button>
            </div>
          ` : ''}

          ${room.light_entity ? `
            <div class="control-row">
              <div>
                <div style="font-weight:600;font-size:14px;display:flex;align-items:center;gap:6px;">${this._icon('light', { size: 16, cls: 'icon-light' })} ${this._t('lighting')}</div>
                <div style="font-size:12px;color:var(--text-secondary);">${isLightOn ? this._t('switched_on') : this._t('switched_off')}</div>
              </div>
              <button class="toggle-pill ${isLightOn ? 'active-amber' : ''}" id="roomModalLightToggle">
                ${isLightOn ? this._t('on') : this._t('off')}
              </button>
            </div>
          ` : ''}

          ${room.climate_entity ? `
            <div class="control-row" style="flex-direction:column;align-items:stretch;gap:8px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:600;font-size:14px;display:flex;align-items:center;gap:6px;">${this._icon('climate', { size: 16, cls: 'icon-climate' })} ${this._t('climate')}</span>
                <span style="font-size:13px;">${this._t('target')}: <strong style="color:var(--accent);">${climateObj ? climateObj.attributes.temperature : 21}°C</strong></span>
              </div>
              <div style="display:flex;justify-content:flex-end;gap:8px;">
                <button class="btn-step" id="roomModalTempMinus">-</button>
                <button class="btn-step" id="roomModalTempPlus">+</button>
                <button class="btn-micro ${isHeat ? 'active' : ''}" id="roomModalHeatToggle">
                  ${isHeat ? this._t('heat') : this._t('off')}
                </button>
              </div>

              ${(komfortVal != null || ecoVal != null) ? `
                <div style="display:flex;flex-direction:column;gap:6px;border-top:1px dashed var(--border-subtle);padding-top:8px;margin-top:4px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.22);border-radius:10px;padding:5px 10px;">
                    <span style="font-size:12px;font-weight:600;display:flex;align-items:center;gap:5px;color:var(--text-primary);">
                      ${this._icon('sun', { size: 13, cls: 'icon-light' })} ${this._t('comfort')}: <strong style="color:#f59e0b;margin-left:2px;">${komfortVal || '--'}°C</strong>
                    </span>
                    <div style="display:flex;gap:4px;">
                      <button class="btn-step" data-helper="${komfortHelperId}" data-delta="-0.5" style="width:24px;height:24px;font-size:12px;padding:0;line-height:22px;">-</button>
                      <button class="btn-step" data-helper="${komfortHelperId}" data-delta="0.5" style="width:24px;height:24px;font-size:12px;padding:0;line-height:22px;">+</button>
                    </div>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.22);border-radius:10px;padding:5px 10px;">
                    <span style="font-size:12px;font-weight:600;display:flex;align-items:center;gap:5px;color:var(--text-primary);">
                      ${this._icon('snowflake', { size: 13, cls: 'icon-climate' })} Eco: <strong style="color:#38bdf8;margin-left:2px;">${ecoVal || '--'}°C</strong>
                    </span>
                    <div style="display:flex;gap:4px;">
                      <button class="btn-step" data-helper="${ecoHelperId}" data-delta="-0.5" style="width:24px;height:24px;font-size:12px;padding:0;line-height:22px;">-</button>
                      <button class="btn-step" data-helper="${ecoHelperId}" data-delta="0.5" style="width:24px;height:24px;font-size:12px;padding:0;line-height:22px;">+</button>
                    </div>
                  </div>
                </div>
              ` : ''}
            </div>
          ` : ''}

          ${room.switch_entity ? `
            <div class="control-row">
              <div>
                <div style="font-weight:600;font-size:14px;display:flex;align-items:center;gap:6px;">${this._icon('plug', { size: 16, cls: 'icon-switch' })} ${(switchObj && switchObj.attributes.friendly_name) || this._t('socket')}</div>
                <div style="font-size:12px;color:var(--text-secondary);">${switchObj && switchObj.state === 'on' ? this._t('active') : this._t('off')}</div>
              </div>
              <button class="toggle-pill ${switchObj && switchObj.state === 'on' ? 'active-blue' : ''}" id="roomModalSwitchToggle">
                ${switchObj && switchObj.state === 'on' ? this._t('on') : this._t('off')}
              </button>
            </div>
          ` : ''}

          ${tvId ? (() => {
            const tvObj = this._hass.states[tvId];
            const isTvOn = tvObj && tvObj.state !== 'off' && tvObj.state !== 'standby' && tvObj.state !== 'unavailable';
            const tvSources = (tvObj && tvObj.attributes && tvObj.attributes.source_list) || [];
            const curSource = (tvObj && tvObj.attributes && tvObj.attributes.source) || '';
            const tvName = (tvObj && tvObj.attributes && tvObj.attributes.friendly_name) || this._t('tv_remote');
            return `
              <div class="control-row" style="grid-column:1/-1;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.28);flex-direction:column;align-items:stretch;gap:10px;padding:14px 16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div style="display:flex;align-items:center;gap:10px;">
                    ${this._icon('tv', { size: 20, cls: 'icon-media' })}
                    <div>
                      <div style="font-weight:700;font-size:14px;color:var(--text-primary);">${tvName}</div>
                      <div style="font-size:11px;color:var(--text-secondary);">${isTvOn ? this._t('tv_on') : this._t('tv_off')}</div>
                    </div>
                  </div>
                  <button class="toggle-pill ${isTvOn ? 'active-blue' : ''}" id="btnTvPower_${room.id}" style="${isTvOn ? 'background:#10b981;color:white;' : ''}">
                    ${this._icon('power', { size: 14, style: 'margin-right:4px;' })} ${isTvOn ? this._t('on') : this._t('off')}
                  </button>
                </div>

                ${isTvOn ? `
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding-top:8px;border-top:1px solid var(--border-subtle);">
                    ${tvSources.length > 0 ? `
                      <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;font-weight:600;">${this._t('source')}:</span>
                        <select id="selTvSource_${room.id}" style="padding:4px 8px;border-radius:8px;font-size:12px;background:rgba(255,255,255,0.08);border:1px solid var(--border-subtle);color:var(--text-primary);">
                          ${tvSources.map(s => `<option value="${s}" ${s === curSource ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                      </div>
                    ` : '<div></div>'}

                    <div style="display:flex;align-items:center;gap:6px;margin-left:auto;">
                      <span style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;font-weight:600;">${this._t('volume')}:</span>
                      <button class="btn-step" id="btnTvVolDown_${room.id}">-</button>
                      <button class="btn-step" id="btnTvVolUp_${room.id}">+</button>
                      <button class="btn-micro" id="btnTvMute_${room.id}" title="${this._t('mute')}" style="padding:4px 8px;font-size:11px;">
                        ${this._icon('volume-mute', { size: 14 })}
                      </button>
                    </div>
                  </div>
                ` : ''}
              </div>
            `;
          })() : ''}

          ${videoId ? (() => {
            const vObj = this._hass.states[videoId];
            const isVideoOn = vObj && vObj.state !== 'off' && vObj.state !== 'standby' && vObj.state !== 'unavailable';
            const isPlaying = vObj && vObj.state === 'playing';
            const vName = (vObj && vObj.attributes && vObj.attributes.friendly_name) || this._t('video_player');
            const vApp = (vObj && vObj.attributes && (vObj.attributes.app_name || vObj.attributes.source)) || '';
            const vTitle = (vObj && vObj.attributes && (vObj.attributes.media_title || vObj.attributes.series_title)) || '';
            const statusText = vTitle ? (vApp ? `${vTitle} (${vApp})` : vTitle) : (vApp || (isVideoOn ? (isPlaying ? this._t('play') : this._t('pause')) : this._t('tv_off')));

            return `
              <div class="control-row" style="grid-column:1/-1;background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.28);flex-direction:column;align-items:stretch;gap:12px;padding:14px 16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">
                    <div style="width:36px;height:36px;border-radius:10px;background:rgba(139,92,246,0.2);display:flex;align-items:center;justify-content:center;color:#a78bfa;flex-shrink:0;">
                      ${this._icon('multimedia', { size: 20 })}
                    </div>
                    <div style="min-width:0;flex:1;">
                      <div style="font-weight:700;font-size:14px;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${vName}</div>
                      <div style="font-size:11px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this._t('streaming')} • ${statusText}</div>
                    </div>
                  </div>
                  <button class="toggle-pill ${isVideoOn ? 'active-blue' : ''}" id="btnVideoPower_${room.id}" style="${isVideoOn ? 'background:#8b5cf6;color:white;' : ''}">
                    ${this._icon('power', { size: 14, style: 'margin-right:4px;' })} ${isVideoOn ? this._t('on') : this._t('off')}
                  </button>
                </div>

                ${isVideoOn ? `
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--border-subtle);">
                    <!-- Transport Playback Controls -->
                    <div style="display:flex;align-items:center;gap:6px;">
                      <button class="btn-micro" id="btnVideoPrev_${room.id}" title="${this._t('previous')}" style="width:34px;height:34px;padding:0;display:flex;align-items:center;justify-content:center;">
                        ${this._icon('skip-back', { size: 14 })}
                      </button>
                      <button class="btn-micro ${isPlaying ? 'active' : ''}" id="btnVideoPlayPause_${room.id}" title="${isPlaying ? this._t('pause') : this._t('play')}" style="width:38px;height:38px;padding:0;display:flex;align-items:center;justify-content:center;${isPlaying ? 'background:#8b5cf6;color:white;' : ''}">
                        ${this._icon(isPlaying ? 'pause' : 'play', { size: 16 })}
                      </button>
                      <button class="btn-micro" id="btnVideoStop_${room.id}" title="${this._t('stop')}" style="width:34px;height:34px;padding:0;display:flex;align-items:center;justify-content:center;">
                        ${this._icon('stop', { size: 14 })}
                      </button>
                      <button class="btn-micro" id="btnVideoNext_${room.id}" title="${this._t('next')}" style="width:34px;height:34px;padding:0;display:flex;align-items:center;justify-content:center;">
                        ${this._icon('skip-forward', { size: 14 })}
                      </button>
                    </div>

                    <!-- VisionOS Styled D-Pad Remote Navigation -->
                    <div class="dpad-grid" id="dpad_${room.id}" style="margin-left:auto;">
                      <button class="btn-dpad" data-dpad="back" title="${this._t('back')}">${this._icon('rotate-ccw', { size: 14 })}</button>
                      <button class="btn-dpad" data-dpad="up" title="${this._t('dpad_up')}">${this._icon('arrow-up', { size: 15 })}</button>
                      <button class="btn-dpad" data-dpad="home" title="${this._t('home')}">${this._icon('home', { size: 14 })}</button>

                      <button class="btn-dpad" data-dpad="left" title="${this._t('dpad_left')}">${this._icon('arrow-left', { size: 15 })}</button>
                      <button class="btn-dpad btn-dpad-ok" data-dpad="select" title="${this._t('dpad_select')}">OK</button>
                      <button class="btn-dpad" data-dpad="right" title="${this._t('dpad_right')}">${this._icon('arrow-right', { size: 15 })}</button>

                      <button class="btn-dpad" data-dpad="menu" title="${this._t('menu')}">${this._icon('menu', { size: 14 })}</button>
                      <button class="btn-dpad" data-dpad="down" title="${this._t('dpad_down')}">${this._icon('arrow-down', { size: 15 })}</button>
                      <button class="btn-dpad" data-dpad="info" title="Info">${this._icon('eye', { size: 14 })}</button>
                    </div>
                  </div>
                ` : ''}
              </div>
            `;
          })() : ''}

          ${audioId ? (() => {
            const aObj = this._hass.states[audioId];
            const isPlaying = aObj && aObj.state === 'playing';
            const artUrl = aObj && aObj.attributes && (aObj.attributes.entity_picture_local || aObj.attributes.entity_picture);
            const track = (aObj && aObj.attributes && (aObj.attributes.media_title || aObj.attributes.app_name)) || (aObj ? aObj.attributes.friendly_name : this._t('media'));
            const artist = (aObj && aObj.attributes && aObj.attributes.media_artist) || (aObj ? aObj.state : this._t('off'));
            return `
              <div class="control-row" style="grid-column:1/-1;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.28);flex-direction:column;align-items:stretch;gap:10px;padding:14px 16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
                  <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">
                    ${artUrl ? `
                      <img src="${artUrl}" style="width:44px;height:44px;border-radius:10px;object-fit:cover;box-shadow:0 4px 12px rgba(0,0,0,0.3);" alt="Cover" />
                    ` : `
                      <div style="width:44px;height:44px;border-radius:10px;background:rgba(99,102,241,0.2);display:flex;align-items:center;justify-content:center;color:#818cf8;flex-shrink:0;">
                        ${this._icon('music', { size: 22 })}
                      </div>
                    `}
                    <div style="min-width:0;flex:1;">
                      <div style="font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text-primary);">${track}</div>
                      <div style="font-size:12px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${artist}</div>
                    </div>
                  </div>

                  <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                    <button class="btn-micro" id="btnMediaPrev_${room.id}" title="${this._t('previous')}" style="width:32px;height:32px;padding:0;display:flex;align-items:center;justify-content:center;">
                      ${this._icon('skip-back', { size: 14 })}
                    </button>
                    <button class="btn-micro ${isPlaying ? 'active' : ''}" id="btnMediaPlayPause_${room.id}" title="${isPlaying ? this._t('pause') : this._t('play')}" style="width:38px;height:38px;padding:0;display:flex;align-items:center;justify-content:center;${isPlaying ? 'background:var(--accent);color:white;' : ''}">
                      ${this._icon(isPlaying ? 'pause' : 'play', { size: 16 })}
                    </button>
                    <button class="btn-micro" id="btnMediaNext_${room.id}" title="${this._t('next')}" style="width:32px;height:32px;padding:0;display:flex;align-items:center;justify-content:center;">
                      ${this._icon('skip-forward', { size: 14 })}
                    </button>
                  </div>
                </div>

                <div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;padding-top:8px;border-top:1px solid var(--border-subtle);">
                  <span style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;font-weight:600;">${this._t('volume')}:</span>
                  <button class="btn-step" id="btnMediaVolDown_${room.id}">-</button>
                  <button class="btn-step" id="btnMediaVolUp_${room.id}">+</button>
                </div>
              </div>
            `;
          })() : ''}
        </div>

        ${(room.overlay_categories && room.overlay_categories.length > 0) ? `
          ${room.overlay_categories.map(cat => {
            const ents = (cat.entities || []).map(id => ({ id, state: this._hass.states[id] })).filter(e => e.state);
            if (ents.length === 0) return '';
            const switchesOrLights = ents.filter(e => e.id.startsWith('switch.') || e.id.startsWith('light.'));
            const sensorsOrBin = ents.filter(e => e.id.startsWith('sensor.') || e.id.startsWith('binary_sensor.'));
            const otherEnts = ents.filter(e => !e.id.startsWith('switch.') && !e.id.startsWith('light.') && !e.id.startsWith('sensor.') && !e.id.startsWith('binary_sensor.'));
            return `
              <div style="font-size:14px;font-weight:700;margin-top:10px;">${cat.name} (${ents.length})</div>
              ${switchesOrLights.length > 0 ? `
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;">
                  ${switchesOrLights.map(s => {
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
                          ${isOn ? this._t('on') : this._t('off')}
                        </button>
                      </div>
                    `;
                  }).join('')}
                </div>
              ` : ''}
              ${sensorsOrBin.length > 0 ? `
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px;">
                  ${sensorsOrBin.map(s => {
                    const name = (s.state && s.state.attributes.friendly_name) || s.id;
                    let rawVal = s.state ? s.state.state : '--';
                    const unit = (s.state && s.state.attributes.unit_of_measurement) || '';
                    let valDisplay = rawVal;
                    let valColor = 'var(--text-primary)';
                    if (rawVal === 'unknown') { valDisplay = this._t('unknown'); valColor = 'var(--text-secondary)'; }
                    else if (rawVal === 'unavailable') { valDisplay = this._t('unavailable'); valColor = 'var(--text-secondary)'; }
                    else if (rawVal === 'on') { valDisplay = this._t('on'); valColor = '#10b981'; }
                    else if (rawVal === 'off') { valDisplay = this._t('off'); valColor = 'var(--text-secondary)'; }
                    else if (!isNaN(parseFloat(rawVal))) {
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
              ${otherEnts.length > 0 ? `
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;">
                  ${otherEnts.map(o => {
                    const name = (o.state && o.state.attributes.friendly_name) || o.id;
                    const icon = this._resolveEntityIcon(o.id, o.state);
                    return `
                      <div class="control-row" style="padding:10px 14px;min-height:48px;">
                        <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
                          <div style="flex-shrink:0;">${icon}</div>
                          <div style="font-size:13px;font-weight:600;color:var(--text-primary);">${name}</div>
                        </div>
                        <div style="font-size:12px;color:var(--text-secondary);">${o.state.state}</div>
                      </div>
                    `;
                  }).join('')}
                </div>
              ` : ''}
            `;
          }).join('')}
        ` : `
          ${otherSwitches.length > 0 ? `
            <div style="font-size:14px;font-weight:700;margin-top:8px;">${this._t('other_devices')} (${otherSwitches.length})</div>
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
                      ${isOn ? this._t('on') : this._t('off')}
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}

          ${otherSensors.length > 0 ? `
            <div style="font-size:14px;font-weight:700;margin-top:8px;">${this._t('measurements_sensors')} (${otherSensors.length})</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px;">
              ${otherSensors.map(s => {
                const name = (s.state && s.state.attributes.friendly_name) || s.id;
                let rawVal = s.state ? s.state.state : '--';
                const unit = (s.state && s.state.attributes.unit_of_measurement) || '';

                let valDisplay = rawVal;
                let valColor = 'var(--text-primary)';
                if (rawVal === 'unknown') {
                  valDisplay = this._t('unknown');
                  valColor = 'var(--text-secondary)';
                } else if (rawVal === 'unavailable') {
                  valDisplay = this._t('unavailable');
                  valColor = 'var(--text-secondary)';
                } else if (rawVal === 'on') {
                  valDisplay = this._t('on');
                  valColor = '#10b981';
                } else if (rawVal === 'off') {
                  valDisplay = this._t('off');
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
        `}
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

    // TV Remote Events (Strictly for tvId, NEVER touches switch_entity)
    if (tvId) {
      const pwrBtn = body.querySelector('#btnTvPower_' + room.id);
      if (pwrBtn) {
        pwrBtn.onclick = () => {
          this._callService('media_player', 'toggle', { entity_id: tvId });
        };
      }
      const srcSel = body.querySelector('#selTvSource_' + room.id);
      if (srcSel) {
        srcSel.onchange = (e) => this._callService('media_player', 'select_source', { entity_id: tvId, source: e.target.value });
      }
      const vDown = body.querySelector('#btnTvVolDown_' + room.id);
      if (vDown) vDown.onclick = () => this._callService('media_player', 'volume_down', { entity_id: tvId });
      const vUp = body.querySelector('#btnTvVolUp_' + room.id);
      if (vUp) vUp.onclick = () => this._callService('media_player', 'volume_up', { entity_id: tvId });
      const vMute = body.querySelector('#btnTvMute_' + room.id);
      if (vMute) {
        const tvState = this._hass.states[tvId];
        const isMuted = tvState && tvState.attributes && tvState.attributes.is_volume_muted;
        vMute.onclick = () => this._callService('media_player', 'volume_mute', { entity_id: tvId, is_volume_muted: !isMuted });
      }
    }

    // Video Player & Streaming Remote Events (Strictly for videoId: Shield, Kodi, Apple TV, Fire TV)
    if (videoId) {
      const vPower = body.querySelector('#btnVideoPower_' + room.id);
      if (vPower) vPower.onclick = () => this._callService('media_player', 'toggle', { entity_id: videoId });

      const vPlay = body.querySelector('#btnVideoPlayPause_' + room.id);
      if (vPlay) vPlay.onclick = () => this._callService('media_player', 'media_play_pause', { entity_id: videoId });

      const vStop = body.querySelector('#btnVideoStop_' + room.id);
      if (vStop) vStop.onclick = () => this._callService('media_player', 'media_stop', { entity_id: videoId });

      const vPrev = body.querySelector('#btnVideoPrev_' + room.id);
      if (vPrev) vPrev.onclick = () => this._callService('media_player', 'media_previous_track', { entity_id: videoId });

      const vNext = body.querySelector('#btnVideoNext_' + room.id);
      if (vNext) vNext.onclick = () => this._callService('media_player', 'media_next_track', { entity_id: videoId });

      const dpadBox = body.querySelector('#dpad_' + room.id);
      if (dpadBox) {
        dpadBox.querySelectorAll('.btn-dpad').forEach(btn => {
          btn.onclick = () => {
            const cmd = btn.getAttribute('data-dpad');
            this._sendRemoteCommand(videoId, cmd);
          };
        });
      }
    }

    // Mini Media Player Events (Strictly for audioId)
    if (audioId) {
      const playBtn = body.querySelector('#btnMediaPlayPause_' + room.id);
      if (playBtn) playBtn.onclick = () => this._callService('media_player', 'media_play_pause', { entity_id: audioId });
      const prevBtn = body.querySelector('#btnMediaPrev_' + room.id);
      if (prevBtn) prevBtn.onclick = () => this._callService('media_player', 'media_previous_track', { entity_id: audioId });
      const nextBtn = body.querySelector('#btnMediaNext_' + room.id);
      if (nextBtn) nextBtn.onclick = () => this._callService('media_player', 'media_next_track', { entity_id: audioId });
      const avDown = body.querySelector('#btnMediaVolDown_' + room.id);
      if (avDown) avDown.onclick = () => this._callService('media_player', 'volume_down', { entity_id: audioId });
      const avUp = body.querySelector('#btnMediaVolUp_' + room.id);
      if (avUp) avUp.onclick = () => this._callService('media_player', 'volume_up', { entity_id: audioId });
    }
    body.querySelectorAll('[data-dyn-toggle]').forEach(b => {
      b.onclick = () => {
        const ent = b.getAttribute('data-dyn-toggle');
        const dom = b.getAttribute('data-dyn-domain');
        this._callService(dom, 'toggle', { entity_id: ent });
      };
    });
    body.querySelectorAll('.btn-step[data-helper]').forEach(b => {
      b.onclick = (e) => {
        e.stopPropagation();
        const hId = b.getAttribute('data-helper');
        const delta = parseFloat(b.getAttribute('data-delta'));
        const s = this._hass.states[hId];
        if (s && s.state != null) {
          const curVal = parseFloat(s.state) || 20.0;
          const newVal = Math.round((curVal + delta) * 2) / 2;
          this._callService('input_number', 'set_value', { entity_id: hId, value: newVal });
        }
      };
    });
  }

  _updateAll() {
    if (!this._hass) return;
    this._applyThemeClass();

    // 1. Update Date & Header
    const now = new Date();
    const locale = this._getLocale();
    const dateTitleEl = this.shadowRoot.getElementById('dateTitle');
    if (dateTitleEl) {
      const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      dateTitleEl.textContent = now.toLocaleDateString(locale, options);
    }
    const subHeaderEl = this.shadowRoot.getElementById('subHeader');
    if (subHeaderEl) {
      const userName = (this._hass && this._hass.user && this._hass.user.name) || '';
      const greeting = userName ? `${this._t('welcome')}, ${userName}` : this._t('welcome');
      subHeaderEl.textContent = `${greeting} • ${this._t('smart_home_center')}`;
    }
    this._updateEditModeBanner();

    // Auto-sync HA Area names and pictures dynamically if changed in HA
    if (this._hass && this._hass.areas && this._config.rooms) {
      this._config.rooms.forEach((r, idx) => {
        const area = this._hass.areas[r.id];
        if (area) {
          if (area.name && r.name !== area.name) {
            r.name = area.name;
            const nameEl = this.shadowRoot.querySelector(`#roomCard_${idx} .room-name`);
            if (nameEl) nameEl.innerHTML = `${r.name} &rsaquo;`;
          }
          if (area.picture !== undefined && r.picture !== area.picture) {
            r.picture = area.picture;
            const bgEl = this.shadowRoot.querySelector(`#roomCard_${idx} .room-bg-image`);
            if (bgEl) {
              if (r.picture) bgEl.style.backgroundImage = `url('${r.picture}')`;
              else bgEl.remove();
            }
          }
        }
      });
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
      const hEntity = (room.humidity_entity && room.humidity_entity.trim()) ? room.humidity_entity.trim() : null;
      const hState = hEntity && this._hass.states[hEntity];
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
      const luxEntity = (room.illuminance_entity && room.illuminance_entity.trim()) ? room.illuminance_entity.trim() : null;
      const luxState = luxEntity && this._hass.states[luxEntity];
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
    const mId = room.media_entity || room.audio_entity || room.video_entity;
    if (mediaBtn && mId && this._hass.states[mId]) {
      const isPlay = this._hass.states[mId].state === 'playing';
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
          text: `${this._icon(c.iconName, { size: 14, style: 'margin-right:5px;' })} ${c.label} (${d.toLocaleDateString(this._getLocale(), { weekday: 'short', day: 'numeric', month: 'numeric' })})`,
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
          text: `${this._icon('sunset', { size: 14, cls: 'icon-light', style: 'margin-right:5px;' })} ${this._t('sunset')} ${dSet.toLocaleTimeString(this._getLocale(), { hour: '2-digit', minute: '2-digit' })}`,
          color: 'dot-amber'
        });
      }
    }

    // Sort by date
    items.sort((a, b) => a.date - b.date);

    if (items.length > 0) {
      agendaEl.innerHTML = `
        <div class="agenda-title" style="display:flex;align-items:center;gap:6px;">${this._icon('calendar', { size: 14, cls: 'icon-calendar' })} ${this._t('agenda_garbage')}</div>
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
    const isEn = this._getLang() === 'en';
    const mapDe = {
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
    const mapEn = {
      'clear-night': 'Clear Night',
      'cloudy': 'Cloudy',
      'fog': 'Fog',
      'hail': 'Hail',
      'lightning': 'Thunderstorm',
      'lightning-rainy': 'Thunderstorm with Rain',
      'partlycloudy': 'Partly Cloudy',
      'pouring': 'Heavy Rain',
      'rainy': 'Rainy',
      'snowy': 'Snow',
      'snowy-rainy': 'Sleet',
      'sunny': 'Sunny',
      'windy': 'Windy',
      'windy-variant': 'Windy'
    };
    const map = isEn ? mapEn : mapDe;
    return map[state] || (state ? state.replace(/[-_]/g, ' ') : (isEn ? 'Unknown' : 'Unbekannt'));
  }

  _getWeatherEmoji(state) {
    return this._getWeatherIcon(state, 24);
  }

  _openModal(type) {
    if (type === 'settings') {
      window.history.pushState(null, '', '/vision-glass/settings');
      window.dispatchEvent(new CustomEvent('location-changed'));
      return;
    }
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
      title.innerHTML = `${this._icon('light', { size: 22, cls: 'icon-light', style: 'margin-right:8px;' })} ${this._t('lighting_control')}`;
      const allLights = [
        { id: 'light.licht_wohnung', name: this._t('all_lights_apartment') },
        { id: 'light.livingroom', name: `${this._t('wohnzimmer')} ${this._t('lighting')}` },
        { id: 'light.light_studyroom_tomada', name: `${this._t('arbeitszimmer')} ${this._t('lighting')}` },
        { id: 'light.light_kitchen_tomada', name: `${this._t('kuche')} ${this._t('lighting')}` },
        { id: 'light.light_bathroom_tomada', name: `${this._t('badezimmer')} ${this._t('lighting')}` },
        { id: 'light.light_hallway_tomada', name: `${this._t('flur')} ${this._t('lighting')}` },
        { id: 'light.schlafzimmerlicht', name: `${this._t('schlafzimmer')} ${this._t('lighting')}` }
      ];

      body.innerHTML = `
        <div style="display:flex;gap:12px;margin-bottom:18px;">
          <button class="btn-micro" id="modalAllOn">${this._t('all_lights_turn_on')}</button>
          <button class="btn-micro" id="modalAllOff">${this._t('all_lights_turn_off')}</button>
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
                    <div style="font-size:12px;color:var(--text-secondary);">${isOn ? `${this._t('on')} (${bri}%)` : this._t('off')}</div>
                  </div>
                </div>
                <button class="toggle-pill ${isOn ? 'active' : ''}" style="flex-shrink:0;" data-light="${l.id}">
                  ${isOn ? this._t('on') : this._t('off')}
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
      title.innerHTML = `${this._icon('climate', { size: 22, cls: 'icon-climate', style: 'margin-right:8px;' })} ${this._t('climate_control')}`;
      const thermostats = [
        { id: 'climate.better_thermostat_wohnzimmer', roomKey: 'wohnzimmer', tempSensor: 'sensor.bewegungsmelder_wohnzimmer_temperatur', helperPrefix: 'wohnzimmer' },
        { id: 'climate.better_thermostat_arbeitszimmer', roomKey: 'arbeitszimmer', tempSensor: 'sensor.bewegungsmelder_arbeitszimmer_temperatur', helperPrefix: 'arbeitszimmer' },
        { id: 'climate.better_thermostat_schlafzimmer', roomKey: 'schlafzimmer', tempSensor: 'sensor.bewegungsmelder_schlafzimmer_temperature', helperPrefix: 'schlafzimmer' },
        { id: 'climate.better_thermostat_kuche', roomKey: 'kuche', tempSensor: 'sensor.bewegungsmelder_kuche_temperature', helperPrefix: 'kuche' },
        { id: 'climate.better_thermostat_badezimmer', roomKey: 'badezimmer', tempSensor: 'sensor.badezimmer_temperatur', helperPrefix: 'bad' },
        { id: 'climate.better_thermostat_flur', roomKey: 'flur', tempSensor: 'sensor.bewegungsmelder_flur_temperatur', helperPrefix: 'flur' }
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
            const roomName = this._t(t.roomKey);

            const historyVals = this._tempHistory[t.tempSensor];
            const curve = this._generateSvgCurve(historyVals, cur, 290, 55);

            const komfortHelperId = `input_number.${t.helperPrefix}_komfort_temperatur`;
            const ecoHelperId = `input_number.${t.helperPrefix}_eco_temperatur`;
            const komfortObj = this._hass.states[komfortHelperId];
            const ecoObj = this._hass.states[ecoHelperId];
            const komfortVal = komfortObj && komfortObj.state != null && !isNaN(parseFloat(komfortObj.state)) ? parseFloat(komfortObj.state).toFixed(1) : '--';
            const ecoVal = ecoObj && ecoObj.state != null && !isNaN(parseFloat(ecoObj.state)) ? parseFloat(ecoObj.state).toFixed(1) : '--';

            return `
              <div class="control-row" style="flex-direction:column;align-items:stretch;gap:10px;padding:16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div>
                    <span style="font-weight:700;font-size:16px;">${roomName}</span>
                    <div style="font-size:12px;color:var(--text-secondary);">Better Thermostat</div>
                  </div>
                  <div style="text-align:right;">
                    <span style="font-size:18px;font-weight:700;color:var(--text-primary);">${cur}°C</span>
                    <div style="font-size:11px;color:var(--text-secondary);">${this._t('now')}</div>
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
                  <div style="position:absolute;bottom:2px;right:4px;font-size:10px;color:var(--accent);font-weight:600;">24h</div>
                </div>

                <!-- Steppers & Mode -->
                <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-subtle);padding-top:10px;">
                  <span style="font-size:13px;">${this._t('target')}: <strong style="font-size:16px;color:var(--accent);">${target}°C</strong></span>
                  <div style="display:flex;gap:8px;">
                    <button class="btn-step" data-climate="${t.id}" data-delta="-0.5">-</button>
                    <button class="btn-step" data-climate="${t.id}" data-delta="0.5">+</button>
                    <button class="btn-micro ${isHeat ? 'active' : ''}" data-toggle-heat="${t.id}">
                      ${isHeat ? this._t('heat') : this._t('off')}
                    </button>
                  </div>
                </div>

                <!-- Individual Room Helpers: Komfort & Eco -->
                <div style="display:flex;flex-direction:column;gap:6px;border-top:1px dashed var(--border-subtle);padding-top:8px;margin-top:4px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.22);border-radius:10px;padding:5px 10px;">
                    <span style="font-size:12px;font-weight:600;display:flex;align-items:center;gap:5px;color:var(--text-primary);">
                      ${this._icon('sun', { size: 13, cls: 'icon-light' })} ${this._t('comfort')}: <strong style="color:#f59e0b;margin-left:2px;">${komfortVal}°C</strong>
                    </span>
                    <div style="display:flex;gap:4px;">
                      <button class="btn-step" data-helper="${komfortHelperId}" data-delta="-0.5" style="width:24px;height:24px;font-size:12px;padding:0;line-height:22px;">-</button>
                      <button class="btn-step" data-helper="${komfortHelperId}" data-delta="0.5" style="width:24px;height:24px;font-size:12px;padding:0;line-height:22px;">+</button>
                    </div>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.22);border-radius:10px;padding:5px 10px;">
                    <span style="font-size:12px;font-weight:600;display:flex;align-items:center;gap:5px;color:var(--text-primary);">
                      ${this._icon('snowflake', { size: 13, cls: 'icon-climate' })} Eco: <strong style="color:#38bdf8;margin-left:2px;">${ecoVal}°C</strong>
                    </span>
                    <div style="display:flex;gap:4px;">
                      <button class="btn-step" data-helper="${ecoHelperId}" data-delta="-0.5" style="width:24px;height:24px;font-size:12px;padding:0;line-height:22px;">-</button>
                      <button class="btn-step" data-helper="${ecoHelperId}" data-delta="0.5" style="width:24px;height:24px;font-size:12px;padding:0;line-height:22px;">+</button>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;

      body.querySelectorAll('.btn-step[data-climate]').forEach(btn => {
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

      body.querySelectorAll('.btn-step[data-helper]').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const hId = btn.getAttribute('data-helper');
          const delta = parseFloat(btn.getAttribute('data-delta'));
          const s = this._hass.states[hId];
          if (s && s.state != null) {
            const curVal = parseFloat(s.state) || 20.0;
            const newVal = Math.round((curVal + delta) * 2) / 2;
            this._callService('input_number', 'set_value', { entity_id: hId, value: newVal });
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
      title.innerHTML = `${this._icon('lock-closed', { size: 22, cls: 'icon-security', style: 'margin-right:8px;' })} ${this._t('security')}`;
      const lockObj = this._hass.states['lock.wohnungsschloss'];
      const doorObj = this._hass.states['binary_sensor.turkontakt_hausture_contact'];
      const isLocked = lockObj && lockObj.state === 'locked';
      const isDoorOpen = doorObj && doorObj.state === 'on';

      let stateText = '';
      let stateColor = '#10b981';
      let stateIcon = this._icon('lock-closed', { size: 38, cls: 'icon-security' });
      let stateBg = 'rgba(16, 185, 129, 0.15)';

      if (isDoorOpen) {
        stateText = this._t('door_open');
        stateColor = '#ef4444';
        stateIcon = this._icon('door-open', { size: 38, cls: 'icon-climate' });
        stateBg = 'rgba(239, 68, 68, 0.20)';
      } else if (!isLocked) {
        stateText = this._t('door_closed_unlocked');
        stateColor = '#f59e0b';
        stateIcon = this._icon('lock-open', { size: 38, cls: 'icon-light' });
        stateBg = 'rgba(245, 158, 11, 0.18)';
      } else {
        stateText = this._t('door_closed_locked');
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
                <div style="font-size:12px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:1px;font-weight:700;">${this._t('entrance_status')}</div>
                <div style="font-size:20px;font-weight:700;color:${stateColor};margin-top:2px;">${stateText}</div>
              </div>
              <div style="font-size:40px;">${stateIcon}</div>
            </div>
            <!-- Distinct Action Buttons -->
            <div style="display:flex;gap:12px;margin-top:6px;">
              <button class="btn-micro ${isLocked ? 'active-green' : ''}" id="btnLockAction" style="flex:1;padding:12px;font-size:14px;font-weight:700;">
                ${this._icon('lock-closed', { size: 16, style: 'margin-right:6px;' })} ${this._t('lock_door')}
              </button>
              <button class="btn-micro ${!isLocked ? 'active-amber' : ''}" id="btnUnlockAction" style="flex:1;padding:12px;font-size:14px;font-weight:700;">
                ${this._icon('lock-open', { size: 16, style: 'margin-right:6px;' })} ${this._t('unlock_door')}
              </button>
            </div>
          </div>

          <div style="font-size:15px;font-weight:700;margin-top:4px;">${this._t('window_door_contacts')}</div>
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
                      <div style="font-size:12px;color:var(--text-secondary);display:flex;align-items:center;gap:4px;">${isOpen ? this._icon('alert-triangle', { size: 12, cls: 'icon-temp' }) + ' ' + this._t('window_open') : this._icon('check', { size: 12, cls: 'icon-security' }) + ' ' + this._t('window_closed')}</div>
                    </div>
                  </div>
                  <span class="toggle-pill ${isOpen ? 'active-amber' : ''}" style="flex-shrink:0;">${isOpen ? this._t('open') : this._t('door_locked_short')}</span>
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
          if (disp) disp.textContent = this._alarmoCode ? '•'.repeat(this._alarmoCode.length) : this._t('no_entry');
        };
      });
    } else if (type === 'battery') {
      title.innerHTML = `${this._icon('battery-full', { size: 22, cls: 'icon-battery', style: 'margin-right:8px;' })} ${this._t('battery_status_maintenance')}`;

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
              <span style="font-size:12px;color:var(--text-secondary);">${this._t('all')}</span>
              <span style="font-size:22px;font-weight:700;">${batteryDevices.length}</span>
            </div>
            <div class="control-row" style="flex-direction:column;align-items:center;cursor:pointer;${filter === 'critical' ? 'border-color:#ef4444;' : ''}" id="filterCritical">
              <span style="font-size:12px;color:#ef4444;font-weight:600;">${this._t('critical')}</span>
              <span style="font-size:22px;font-weight:700;color:#ef4444;">${critical.length}</span>
            </div>
            <div class="control-row" style="flex-direction:column;align-items:center;cursor:pointer;${filter === 'low' ? 'border-color:#f59e0b;' : ''}" id="filterLow">
              <span style="font-size:12px;color:#f59e0b;font-weight:600;">${this._t('low')}</span>
              <span style="font-size:22px;font-weight:700;color:#f59e0b;">${low.length}</span>
            </div>
            <div class="control-row" style="flex-direction:column;align-items:center;cursor:pointer;${filter === 'good' ? 'border-color:#10b981;' : ''}" id="filterGood">
              <span style="font-size:12px;color:#10b981;font-weight:600;">${this._t('good')}</span>
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
      title.innerHTML = `${this._icon('plug', { size: 22, cls: 'icon-switch', style: 'margin-right:8px;' })} ${this._t('switches_control')}`;
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
                    <div style="font-size:12px;color:var(--text-secondary);">${isOn ? (pwrSensor ? `${this._t('active')} • ${pwrSensor}` : this._t('on')) : this._t('off')}</div>
                  </div>
                </div>
                <button class="toggle-pill ${isOn ? 'active' : ''}" style="flex-shrink:0;" data-switch="${sw.id}">
                  ${isOn ? this._t('on') : this._t('off')}
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
      title.innerHTML = `${this._icon('weather-partlycloudy', { size: 22, cls: 'icon-weather', style: 'margin-right:8px;' })} ${this._t('weather_modal_title')}`;

      const existingIframe = body.querySelector('#weatherRadarIframe');
      if (existingIframe) {
        this._updateWeatherModalValues();
        this._updateForecastCarousels();
        return;
      }

      const w = this._hass.states['weather.hannover_hannover'];
      if (!w) {
        body.innerHTML = `<div>${this._t('no_data_available')}</div>`;
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
              <div style="font-size:12px;color:var(--text-secondary);font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${this._t('today')}</div>
              <div style="font-size:18px;font-weight:700;margin-top:2px;" id="weatherHeroToday">
                ${dailyItems[0] && dailyItems[0].templow != null ? `${Math.round(dailyItems[0].templow)}° / ` : ''}${dailyItems[0] ? `${Math.round(dailyItems[0].temperature)}°C` : `${a.temperature}°C`}
              </div>
              <div style="font-size:11px;color:var(--accent);margin-top:4px;">Deutscher Wetterdienst</div>
            </div>
          </div>

          <!-- Key Metrics Grid -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;">
            <div class="control-row" style="flex-direction:column;align-items:flex-start;padding:12px 14px;">
              <span style="font-size:11px;color:var(--text-secondary);">${this._t('humidity_label')}</span>
              <span style="font-size:17px;font-weight:700;" id="weatherMetricHum">${a.humidity}%</span>
            </div>
            <div class="control-row" style="flex-direction:column;align-items:flex-start;padding:12px 14px;">
              <span style="font-size:11px;color:var(--text-secondary);">${this._t('pressure')}</span>
              <span style="font-size:17px;font-weight:700;" id="weatherMetricPress">${a.pressure} hPa</span>
            </div>
            <div class="control-row" style="flex-direction:column;align-items:flex-start;padding:12px 14px;">
              <span style="font-size:11px;color:var(--text-secondary);">${this._t('wind')}</span>
              <span style="font-size:17px;font-weight:700;" id="weatherMetricWind">${a.wind_speed} km/h (${a.wind_bearing})</span>
            </div>
            <div class="control-row" style="flex-direction:column;align-items:flex-start;padding:12px 14px;">
              <span style="font-size:11px;color:var(--text-secondary);">${this._t('visibility')}</span>
              <span style="font-size:17px;font-weight:700;" id="weatherMetricVis">${a.visibility} km</span>
            </div>
          </div>

          <!-- Hourly Forecast Carousel (24 Hours - No rubberbanding) -->
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div style="font-weight:700;font-size:15px;display:flex;align-items:center;gap:6px;">
              ${this._icon('clock', { size: 16, style: 'margin-right:6px;' })} <span>${this._t('hourly_forecast_title')}</span>
            </div>
            <div class="weather-hourly-carousel" id="weatherHourlyContainer">
              ${this._renderHourlyItemsHtml(hourlyItems)}
            </div>
          </div>

          <!-- 7-Day Forecast Trend -->
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div style="font-weight:700;font-size:15px;display:flex;align-items:center;gap:6px;">
              ${this._icon('calendar', { size: 16, style: 'margin-right:6px;' })} <span>${this._t('daily_trend')}</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;" id="weatherDailyContainer">
              ${this._renderDailyItemsHtml(dailyItems)}
            </div>
          </div>

          <!-- Live Weather Map & Radar -->
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div style="font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
              <div style="display:flex;align-items:center;gap:6px;">
                ${this._icon('radar', { size: 16, style: 'margin-right:6px;' })} <span>${this._t('live_precipitation_radar')}</span>
              </div>
              <div style="display:flex;gap:6px;align-items:center;">
                <button class="btn-micro active" id="btnRadarRain" style="padding:4px 10px;font-size:12px;">${this._icon('weather-rainy', { size: 14, style: 'margin-right:4px;' })} ${this._t('rain_radar')}</button>
                <button class="btn-micro" id="btnRadarWindy" style="padding:4px 10px;font-size:12px;">${this._icon('cyclone', { size: 14, style: 'margin-right:4px;' })} Windy</button>
                <a href="https://www.rainviewer.com/map.html?loc=52.3889,9.8297,9" target="_blank" rel="noopener" style="font-size:12px;color:var(--accent);text-decoration:none;font-weight:600;margin-left:4px;">
                  ${this._t('fullscreen')} &nearr;
                </a>
              </div>
            </div>
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
      title.innerHTML = `${this._icon('chart-bar', { size: 22, cls: 'icon-stats', style: 'margin-right:8px;' })} ${this._t('stats_title')}`;

      const tab = this._statsTab || 'temperature';
      const selectedRoom = this._statsRoom || 'wohnzimmer';

      const roomSensorsConfig = {
        wohnzimmer: {
          name: this._t('wohnzimmer'),
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
          name: this._t('arbeitszimmer'),
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
          name: this._t('badezimmer'),
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
          name: this._t('kuche'),
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
          name: this._t('schlafzimmer'),
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
          name: this._t('flur'),
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
            label: this._t('climate'),
            type: 'climate',
            activeColor: '#ef4444',
            activeLabel: this._t('heating_active'),
            idleLabel: this._t('heating_idle')
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
                <span style="font-weight:700;font-size:16px;">${currentRoomConf.name} • ${this._t('temp_curve_heating')}</span>
                <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">
                  ${this._t('all_sensors_24h')}
                </div>
              </div>
              <div style="text-align:right;">
                <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:10px;background:${isHeating ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)'};border:1px solid ${isHeating ? 'rgba(239,68,68,0.3)' : 'var(--border-subtle)'};">
                  <span style="font-size:12.5px;font-weight:700;color:${isHeating ? '#ef4444' : 'var(--text-primary)'};display:flex;align-items:center;gap:4px;">
                    ${isHeating ? this._icon('flame', { size: 13, color: '#ef4444' }) + ' ' + this._t('heating_active') : this._icon('motion-idle', { size: 13 }) + ' ' + this._t('heating_idle')}
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
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;">
            ${seriesData.map(s => `
              <div class="control-row" style="padding:10px 14px;border-left:4px solid ${s.color};min-width:0;box-sizing:border-box;">
                <div style="flex:1;min-width:0;">
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span style="width:10px;height:10px;border-radius:50%;background:${s.color};display:inline-block;flex-shrink:0;"></span>
                    <span style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.name}</span>
                  </div>
                  <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;font-family:monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${s.id}">${s.id}</div>
                </div>
                <div style="text-align:right;flex-shrink:0;margin-left:10px;">
                  <span style="font-size:16px;font-weight:700;color:${s.color};white-space:nowrap;">${s.currentVal != null ? `${s.currentVal}°C` : '--'}</span>
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
            label: this._t('lighting'),
            type: 'light',
            activeColor: '#f59e0b',
            activeLabel: this._t('light_active'),
            idleLabel: this._t('light_idle')
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
                <span style="font-weight:700;font-size:16px;">${currentRoomConf.name} • ${this._t('illum_curve_lighting')}</span>
                <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">
                  ${this._t('lux_curve_24h')}
                </div>
              </div>
              <div style="text-align:right;">
                <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:10px;background:${isLightOn ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)'};border:1px solid ${isLightOn ? 'rgba(245,158,11,0.3)' : 'var(--border-subtle)'};">
                  <span style="font-size:12.5px;font-weight:700;color:${isLightOn ? '#f59e0b' : 'var(--text-primary)'};display:flex;align-items:center;gap:4px;">
                    ${isLightOn ? this._icon('light', { size: 13, cls: 'icon-light' }) + ' ' + this._t('light_active') : this._icon('light', { size: 13 }) + ' ' + this._t('light_idle')}
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
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;">
            ${seriesData.map(s => `
              <div class="control-row" style="padding:10px 14px;border-left:4px solid ${s.color};min-width:0;box-sizing:border-box;">
                <div style="flex:1;min-width:0;">
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span style="width:10px;height:10px;border-radius:50%;background:${s.color};display:inline-block;flex-shrink:0;"></span>
                    <span style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.name}</span>
                  </div>
                  <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;font-family:monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${s.id}">${s.id}</div>
                </div>
                <div style="text-align:right;flex-shrink:0;margin-left:10px;">
                  <span style="font-size:16px;font-weight:700;color:${s.color};white-space:nowrap;">${s.currentVal != null ? `${s.currentVal} lx` : '--'}</span>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      } else if (tab === 'occupancy_heating') {
        const roomsList = [
          { name: this._t('wohnzimmer'), occ: 'binary_sensor.living_room_occupied', climate: 'climate.better_thermostat_wohnzimmer', pwr: 'sensor.wohnzimmer_better_thermostat_wohnzimmer_heizleistung' },
          { name: this._t('arbeitszimmer'), occ: 'binary_sensor.studyroom_occupied', climate: 'climate.better_thermostat_arbeitszimmer', pwr: 'sensor.arbeitszimmer_better_thermostat_arbeitszimmer_heizleistung' },
          { name: this._t('badezimmer'), occ: 'binary_sensor.bathroom_occupied', climate: 'climate.better_thermostat_badezimmer', pwr: 'sensor.badezimmer_better_thermostat_badezimmer_heizleistung' },
          { name: this._t('kuche'), occ: 'binary_sensor.kuche_occupied', climate: 'climate.better_thermostat_kuche', pwr: 'sensor.kuche_better_thermostat_kuche_heizleistung' },
          { name: this._t('schlafzimmer'), occ: 'binary_sensor.bedroom_occupied', climate: 'climate.better_thermostat_schlafzimmer', pwr: 'sensor.schlafzimmer_better_thermostat_schlafzimmer_heizleistung' },
          { name: this._t('flur'), occ: 'binary_sensor.hallway_occupied', climate: 'climate.better_thermostat_flur', pwr: 'sensor.flur_better_thermostat_flur_heizleistung' }
        ];

        tabContent = `
          <div style="font-size:14px;color:var(--text-secondary);margin-bottom:6px;">
            ${this._t('live_occupancy_overview')}
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
                      ${isOcc ? this._icon('motion', { size: 12, style: 'margin-right:4px;' }) + ' ' + this._t('occupied') : this._icon('motion-idle', { size: 12, style: 'margin-right:4px;' }) + ' ' + this._t('idle')}
                    </span>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-subtle);padding-top:8px;">
                    <div>
                      <div style="font-size:12px;color:var(--text-secondary);">${this._t('thermostat_status')}</div>
                      <div style="font-size:14px;font-weight:600;color:${isHeat ? 'var(--accent-amber)' : 'var(--text-primary)'};">
                        ${isHeat ? this._icon('flame', { size: 14, color: '#f59e0b', style: 'margin-right:4px;' }) + ' ' + this._t('heating_active_desc') : this._icon('motion-idle', { size: 14, style: 'margin-right:4px;' }) + ' ' + this._t('heating_ready_desc')}
                      </div>
                    </div>
                    <div style="text-align:right;">
                      <div style="font-size:12px;color:var(--text-secondary);">${this._t('heating_power')}</div>
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
                <span style="font-weight:700;font-size:16px;">${this._t('battery_curves_title')}</span>
                <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">${this._t('battery_curves_sub')}</div>
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
            <button class="btn-micro ${tab === 'temperature' ? 'active' : ''}" id="btnStatsTabTemp">${this._icon('thermometer', { size: 14, style: 'margin-right:4px;' })} ${this._t('room_temperatures')}</button>
            <button class="btn-micro ${tab === 'illuminance' ? 'active' : ''}" id="btnStatsTabIllum">${this._icon('lux', { size: 14, style: 'margin-right:4px;' })} ${this._t('illuminance_lux')}</button>
            <button class="btn-micro ${tab === 'occupancy_heating' ? 'active' : ''}" id="btnStatsTabOcc">${this._icon('user-walk', { size: 14, style: 'margin-right:4px;' })} ${this._t('occupancy_heating')}</button>
            <button class="btn-micro ${tab === 'battery' ? 'active' : ''}" id="btnStatsTabBat">${this._icon('battery-full', { size: 14, style: 'margin-right:4px;' })} ${this._t('battery_curves')}</button>
          </div>

          <!-- Active Tab Content -->
          ${tabContent}

          <!-- Direct Link to Dashboard Statistics View -->
          <div style="border-top:1px solid var(--border-subtle);padding-top:14px;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:12px;color:var(--text-secondary);">${this._t('detailed_stats_sub')}</span>
            <a href="/vision-glass/stats" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;" class="btn-micro">
              <span>${this._icon('chart-bar', { size: 14, style: 'margin-right:6px;' })} ${this._t('open_full_stats')}</span>
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

  _ensureRoomOverlayCategories(room) {
    if (!room) return [];
    if (room.overlay_categories && room.overlay_categories.length > 0) {
      return room.overlay_categories;
    }
    const mainEntities = [
      room.light_entity,
      room.climate_entity,
      room.media_entity,
      room.tv_entity,
      room.video_entity,
      room.switch_entity,
      room.multimedia_switch
    ].filter(e => e && typeof e === 'string' && e.trim());

    const matchSwitches = [];
    const matchSensors = [];

    if (this._hass && this._hass.states) {
      Object.keys(this._hass.states).forEach(eId => {
        if (mainEntities.includes(eId)) return;
        if (this._isEntityInRoom(eId, room.id, room.name)) {
          if (eId.startsWith('switch.') || eId.startsWith('light.')) {
            matchSwitches.push(eId);
          } else if (eId.startsWith('sensor.') || eId.startsWith('binary_sensor.')) {
            matchSensors.push(eId);
          }
        }
      });
    }

    const defaultCats = [];
    if (mainEntities.length > 0) {
      defaultCats.push({
        id: 'main',
        name: 'Hauptgeräte',
        entities: [...new Set(mainEntities)]
      });
    }
    if (matchSwitches.length > 0) {
      defaultCats.push({
        id: 'switches',
        name: 'Weitere Geräte & Steckdosen',
        entities: [...new Set(matchSwitches)]
      });
    }
    if (matchSensors.length > 0) {
      defaultCats.push({
        id: 'sensors',
        name: 'Messwerte & Sensoren',
        entities: [...new Set(matchSensors)]
      });
    }
    if (defaultCats.length === 0) {
      defaultCats.push({
        id: 'custom',
        name: 'Geräte & Sensoren',
        entities: []
      });
    }
    room.overlay_categories = defaultCats;
    return defaultCats;
  }

  _isEntityInRoom(eId, roomId, roomName) {
    if (!eId) return false;
    if (!roomId && !roomName) return true;
    const rId = (roomId || '').toLowerCase();
    const rName = (roomName || '').toLowerCase();
    const eLower = eId.toLowerCase();

    // 1. HA entity registry area
    if (this._hass?.entities?.[eId]?.area_id) {
      if (this._hass.entities[eId].area_id.toLowerCase() === rId) return true;
    }
    // 2. HA device registry area
    const devId = this._hass?.entities?.[eId]?.device_id;
    if (devId && this._hass?.devices?.[devId]?.area_id) {
      if (this._hass.devices[devId].area_id.toLowerCase() === rId) return true;
    }
    // 3. String match in entity_id or friendly_name
    const stateObj = this._hass?.states?.[eId];
    const fname = (stateObj?.attributes?.friendly_name || '').toLowerCase();
    if (rId && eLower.includes(rId)) return true;
    if (rName && (eLower.includes(rName) || fname.includes(rName))) return true;

    // 4. Room synonyms / aliases
    const aliases = {
      'wohnzimmer': ['livingroom', 'living_room', 'living', 'wohnen'],
      'arbeitszimmer': ['studyroom', 'study_room', 'office', 'büro', 'buro', 'arbeiten'],
      'schlafzimmer': ['bedroom', 'bed_room', 'schlafen'],
      'badezimmer': ['bathroom', 'bath_room', 'bad'],
      'kuche': ['kueche', 'kitchen', 'küche', 'kochen'],
      'flur': ['hallway', 'corridor', 'entrance', 'diele', 'gang']
    };
    for (const [key, list] of Object.entries(aliases)) {
      if (rId.includes(key) || list.some(a => rId.includes(a)) || rName.includes(key)) {
        const tokens = [key, ...list];
        if (tokens.some(tok => eLower.includes(tok) || fname.includes(tok))) return true;
      }
    }
    return false;
  }

  _showEntityPicker({ currentValue = '', roomId = null, roomName = null, defaultDomain = 'all', onSelect }) {
    let pickerOverlay = this.shadowRoot.getElementById('entityPickerOverlay');
    if (pickerOverlay) pickerOverlay.remove();

    pickerOverlay = document.createElement('div');
    pickerOverlay.id = 'entityPickerOverlay';
    pickerOverlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.72);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      box-sizing: border-box;
    `;

    const allEntities = this._hass ? Object.keys(this._hass.states).sort() : [];
    let selectedDomain = defaultDomain || 'all';
    let filterByRoom = !!roomId;
    let searchQuery = '';

    const domains = [
      { id: 'all', label: 'Alle' },
      { id: 'light', label: '💡 Licht' },
      { id: 'climate', label: '🌡️ Klima' },
      { id: 'sensor', label: '📊 Sensoren' },
      { id: 'binary_sensor', label: '🚶 Binär' },
      { id: 'switch', label: '🔌 Schalter' },
      { id: 'media_player', label: '📺 Media' },
      { id: 'lock', label: '🔒 Schloss' },
      { id: 'input_number', label: '🎯 Helfer' }
    ];

    pickerOverlay.innerHTML = `
      <div class="entity-picker-card" style="
        background: var(--bg-card, rgba(15, 23, 42, 0.95));
        border: 1px solid var(--border-glass, rgba(255, 255, 255, 0.2));
        border-radius: 18px;
        width: 100%;
        max-width: 580px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.65);
        overflow: hidden;
        color: var(--text-primary, #ffffff);
        font-family: inherit;
      ">
        <!-- Header -->
        <div style="padding: 16px 20px 12px 20px; border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.1)); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03);">
          <div>
            <div style="font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
              <span>🔍</span> Entität auswählen
            </div>
            <div style="font-size: 12px; color: var(--text-secondary, #94a3b8); margin-top: 2px;">
              ${roomName ? `Zugeordneter Raum: <strong style="color:var(--accent,#38bdf8);">${roomName}</strong> (${roomId})` : 'Home Assistant Entitäten'}
            </div>
          </div>
          <button id="btnPickerClose" style="background: transparent; border: none; font-size: 26px; color: var(--text-secondary, #94a3b8); cursor: pointer; padding: 0 6px; line-height: 1; border-radius: 6px;">&times;</button>
        </div>

        <!-- Filter & Search Section -->
        <div style="padding: 12px 20px; border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); display: flex; flex-direction: column; gap: 10px;">
          ${roomId ? `
            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 13px; font-weight: 600; background: rgba(56, 189, 248, 0.12); padding: 8px 12px; border-radius: 9px; border: 1px solid rgba(56, 189, 248, 0.3); color: var(--accent, #38bdf8); user-select: none;">
              <input type="checkbox" id="chkPickerRoomFilter" ${filterByRoom ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px; accent-color: var(--accent, #38bdf8);">
              <span>Nur Entitäten aus "${roomName || roomId}" anzeigen</span>
            </label>
          ` : ''}

          <input type="text" id="pickerSearchInp" placeholder="Suchen nach Name oder entity_id..." style="width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-glass, rgba(255,255,255,0.2)); background: rgba(255,255,255,0.07); color: var(--text-primary, #ffffff); font-size: 14px; outline: none; box-sizing: border-box;">

          <!-- Domain Pills -->
          <div id="pickerDomainPills" style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px;">
            ${domains.map(d => `
              <button type="button" class="domain-pill" data-domain="${d.id}" style="
                padding: 4px 10px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                white-space: nowrap;
                transition: all 0.15s;
                border: 1px solid ${selectedDomain === d.id ? 'var(--accent, #38bdf8)' : 'rgba(255,255,255,0.15)'};
                background: ${selectedDomain === d.id ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.05)'};
                color: ${selectedDomain === d.id ? '#ffffff' : 'var(--text-secondary, #94a3b8)'};
              ">${d.label}</button>
            `).join('')}
          </div>
        </div>

        <!-- Entity Results List -->
        <div id="pickerEntityList" style="flex: 1; overflow-y: auto; padding: 10px 16px; display: flex; flex-direction: column; gap: 6px; min-height: 200px; max-height: 380px;">
        </div>

        <!-- Footer -->
        <div style="padding: 12px 20px; border-top: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.18);">
          <button type="button" id="btnPickerClear" style="color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.1); padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;">
            ✕ Entität leeren
          </button>
          <div id="pickerCountText" style="font-size: 12px; color: var(--text-secondary, #94a3b8);">0 Entitäten</div>
        </div>
      </div>
    `;

    this.shadowRoot.appendChild(pickerOverlay);

    const searchInp = pickerOverlay.querySelector('#pickerSearchInp');
    const chkRoom = pickerOverlay.querySelector('#chkPickerRoomFilter');
    const listEl = pickerOverlay.querySelector('#pickerEntityList');
    const countEl = pickerOverlay.querySelector('#pickerCountText');
    const pillsContainer = pickerOverlay.querySelector('#pickerDomainPills');

    const renderList = () => {
      const q = searchQuery.toLowerCase().trim();
      let filtered = allEntities.filter(eId => {
        // Domain check
        if (selectedDomain !== 'all') {
          if (!eId.startsWith(selectedDomain + '.')) return false;
        }
        // Room check
        if (filterByRoom && roomId) {
          if (!this._isEntityInRoom(eId, roomId, roomName)) return false;
        }
        // Search text check
        if (q) {
          const stateObj = this._hass?.states?.[eId];
          const fname = (stateObj?.attributes?.friendly_name || '').toLowerCase();
          if (!eId.toLowerCase().includes(q) && !fname.includes(q)) return false;
        }
        return true;
      });

      countEl.textContent = `${filtered.length} Entitäten gefunden`;

      if (filtered.length === 0) {
        listEl.innerHTML = `
          <div style="text-align: center; padding: 32px 16px; color: var(--text-secondary, #94a3b8); font-size: 13px;">
            <div style="font-size: 28px; margin-bottom: 8px;">🔍</div>
            Keine Entitäten gefunden${filterByRoom ? ' für diesen Raum' : ''}.<br>
            ${filterByRoom ? '<button type="button" id="btnDisableRoomFilter" style="margin-top:10px;background:rgba(56,189,248,0.15);border:1px solid rgba(56,189,248,0.3);color:var(--accent,#38bdf8);padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;">Raumfilter aufheben (alle Entitäten)</button>' : ''}
          </div>
        `;
        const btnDisable = listEl.querySelector('#btnDisableRoomFilter');
        if (btnDisable && chkRoom) {
          btnDisable.onclick = () => {
            chkRoom.checked = false;
            filterByRoom = false;
            renderList();
          };
        }
        return;
      }

      // Show top 80 matches
      const displayItems = filtered.slice(0, 80);
      listEl.innerHTML = displayItems.map(eId => {
        const s = this._hass.states[eId];
        const fname = s?.attributes?.friendly_name || eId;
        const stateVal = s?.state || '';
        const unit = s?.attributes?.unit_of_measurement || '';
        const isSelected = currentValue === eId;
        const inRoom = roomId ? this._isEntityInRoom(eId, roomId, roomName) : false;

        return `
          <div class="entity-picker-item" data-eid="${eId}" style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 9px 12px;
            border-radius: 10px;
            background: ${isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)'};
            border: 1px solid ${isSelected ? 'var(--accent, #38bdf8)' : 'rgba(255, 255, 255, 0.08)'};
            cursor: pointer;
            transition: all 0.12s;
          ">
            <div style="flex: 1; min-width: 0;">
              <div style="font-weight: 600; font-size: 13px; color: var(--text-primary, #ffffff); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${fname}
              </div>
              <div style="font-size: 11px; color: var(--text-secondary, #94a3b8); font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 1px;">
                ${eId}
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              ${inRoom ? `<span style="font-size: 10px; background: rgba(56, 189, 248, 0.15); color: var(--accent, #38bdf8); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.3);">📍 ${roomName || roomId}</span>` : ''}
              <span style="font-size: 11px; color: var(--text-secondary, #94a3b8); background: rgba(255, 255, 255, 0.07); padding: 2px 7px; border-radius: 6px; white-space: nowrap;">
                ${stateVal} ${unit}
              </span>
              ${isSelected ? `<span style="color: var(--accent, #38bdf8); font-size: 13px;">✓</span>` : ''}
            </div>
          </div>
        `;
      }).join('');

      listEl.querySelectorAll('.entity-picker-item').forEach(el => {
        el.onmouseenter = () => { el.style.background = 'rgba(56, 189, 248, 0.15)'; };
        el.onmouseleave = () => {
          const eid = el.getAttribute('data-eid');
          el.style.background = (currentValue === eid) ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)';
        };
        el.onclick = () => {
          const eid = el.getAttribute('data-eid');
          pickerOverlay.remove();
          if (onSelect) onSelect(eid);
        };
      });
    };

    // Events
    if (chkRoom) {
      chkRoom.onchange = () => {
        filterByRoom = chkRoom.checked;
        renderList();
      };
    }

    searchInp.oninput = () => {
      searchQuery = searchInp.value;
      renderList();
    };

    pillsContainer.querySelectorAll('.domain-pill').forEach(btn => {
      btn.onclick = () => {
        selectedDomain = btn.getAttribute('data-domain');
        pillsContainer.querySelectorAll('.domain-pill').forEach(b => {
          const isAct = b.getAttribute('data-domain') === selectedDomain;
          b.style.border = isAct ? '1px solid var(--accent, #38bdf8)' : '1px solid rgba(255,255,255,0.15)';
          b.style.background = isAct ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.05)';
          b.style.color = isAct ? '#ffffff' : 'var(--text-secondary, #94a3b8)';
        });
        renderList();
      };
    });

    pickerOverlay.querySelector('#btnPickerClear').onclick = () => {
      pickerOverlay.remove();
      if (onSelect) onSelect('');
    };

    pickerOverlay.querySelector('#btnPickerClose').onclick = () => {
      pickerOverlay.remove();
    };

    pickerOverlay.onclick = (e) => {
      if (e.target === pickerOverlay) pickerOverlay.remove();
    };

    renderList();
    setTimeout(() => searchInp.focus(), 50);
  }

  _renderSettingsContent(container) {
    if (!container || !this._config) return;

    if (!this._settingsActiveTab) this._settingsActiveTab = 'rooms';
    const activeTab = this._settingsActiveTab;

    const rooms = this._config.rooms || [];
    const dock = this._config.dock || { auto_detect: true, items: [] };
    const allEntities = this._hass ? Object.keys(this._hass.states).sort() : [];

    const bgStyle = this._config.background_style || 'aurora';
    const bgMode = this._config.background_mode || 'auto';
    const colorScheme = this._config.color_scheme || 'auto';
    const themeMode = this._config.theme_mode || 'auto';
    const animSpeed = this._config.ambient_speed || 'normal';

    container.innerHTML = `
      <datalist id="dl_all_entities">
        ${allEntities.map(e => `<option value="${e}"></option>`).join('')}
      </datalist>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:42px;height:42px;border-radius:12px;background:rgba(56,189,248,0.15);border:1px solid rgba(56,189,248,0.3);display:flex;align-items:center;justify-content:center;color:var(--accent);">
            ${this._icon('settings', { size: 24 })}
          </div>
          <div>
            <div style="font-size:20px;font-weight:700;">${this._t('settings')} – Vision Glass</div>
            <div style="font-size:12px;color:var(--text-secondary);">${this._t('configure_dashboard')}</div>
          </div>
        </div>
        <a href="/vision-glass/home" class="btn btn-sm" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;">
          &larr; Zum Dashboard
        </a>
      </div>

      <!-- Settings Navigation Tabs -->
      <div class="nav-tabs" style="display:flex;gap:6px;border-bottom:1px solid var(--border-subtle);padding-bottom:10px;margin-bottom:16px;overflow-x:auto;">
        <button class="nav-tab ${activeTab === 'rooms' ? 'active' : ''}" data-stab="rooms">🏠 ${this._t('rooms_and_cards')} (${rooms.length})</button>
        <button class="nav-tab ${activeTab === 'overlays' ? 'active' : ''}" data-stab="overlays">📂 Raum-Overlays</button>
        <button class="nav-tab ${activeTab === 'dock' ? 'active' : ''}" data-stab="dock">⚓ ${this._t('dock_navigation')}</button>
        <button class="nav-tab ${activeTab === 'general' ? 'active' : ''}" data-stab="general">⚙️ Design & Allgemein</button>
      </div>

      <!-- TAB 1: RÄUME & BENTO-KARTEN -->
      <div id="stabContentRooms" style="${activeTab === 'rooms' ? '' : 'display:none;'}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
          <span style="font-size:12px;color:var(--text-secondary);">${this._t('reorder_rooms')}</span>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-sm btn-primary" id="btnSyncAreas">🔄 ${this._t('sync_areas_btn')}</button>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:12px;">
          ${rooms.map((r, rIdx) => `
            <div class="card-box" style="background:var(--bg-card);border:1px solid var(--border-glass);border-radius:14px;padding:14px 16px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <div style="font-weight:700;font-size:15px;display:flex;align-items:center;gap:8px;">
                  <span style="color:var(--accent);">${rIdx + 1}.</span> ${r.name || r.id}
                </div>
                <div style="display:flex;gap:4px;">
                  <button class="btn btn-sm btn-set-room-up" data-ridx="${rIdx}" ${rIdx === 0 ? 'disabled' : ''} title="Nach oben">▲</button>
                  <button class="btn btn-sm btn-set-room-down" data-ridx="${rIdx}" ${rIdx === rooms.length - 1 ? 'disabled' : ''} title="Nach unten">▼</button>
                </div>
              </div>

              <!-- Read-only Area Badge from Home Assistant -->
              <div style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.05);padding:10px 14px;border-radius:10px;margin-bottom:8px;">
                ${r.picture ? `<img src="${r.picture}" style="width:46px;height:46px;border-radius:8px;object-fit:cover;border:1px solid var(--border-glass);" />` : `<div style="width:46px;height:46px;border-radius:8px;background:var(--bg-surface);display:flex;align-items:center;justify-content:center;font-size:22px;">🏠</div>`}
                <div style="flex:1;">
                  <div style="font-weight:700;font-size:15px;color:var(--text-primary);">${r.name || r.id}</div>
                  <div style="font-size:12px;color:var(--text-secondary);display:flex;align-items:center;gap:6px;margin-top:2px;">
                    <span>HA-Bereich ID:</span>
                    <code style="background:rgba(0,0,0,0.2);padding:2px 6px;border-radius:4px;font-family:monospace;color:var(--accent);">${r.id}</code>
                  </div>
                </div>
                <div style="font-size:11px;color:var(--text-secondary);background:rgba(255,255,255,0.06);padding:4px 8px;border-radius:6px;text-align:right;">
                  🔒 ${this._t('managed_by_ha_areas')}
                </div>
              </div>
              <div style="font-size:11px;color:var(--text-secondary);margin-bottom:12px;line-height:1.4;">
                ${this._t('ha_area_notice')}
              </div>

              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:8px;margin-top:6px;border-top:1px dashed var(--border-subtle);padding-top:8px;">
                <div class="row">
                  <label>💡 Beleuchtung (light.*)</label>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input type="text" list="dl_all_entities" class="in-room-prop" data-ridx="${rIdx}" data-prop="light_entity" value="${r.light_entity || ''}" placeholder="light.livingroom" style="flex:1;">
                    <button type="button" class="btn btn-sm btn-pick-entity" data-ridx="${rIdx}" data-prop="light_entity" title="Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;font-size:12px;line-height:1;">🔍</button>
                  </div>
                </div>
                <div class="row">
                  <label>🌡️ Thermostat (climate.*)</label>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input type="text" list="dl_all_entities" class="in-room-prop" data-ridx="${rIdx}" data-prop="climate_entity" value="${r.climate_entity || ''}" placeholder="climate.better_thermostat_..." style="flex:1;">
                    <button type="button" class="btn btn-sm btn-pick-entity" data-ridx="${rIdx}" data-prop="climate_entity" title="Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;font-size:12px;line-height:1;">🔍</button>
                  </div>
                </div>
                <div class="row">
                  <label>🎯 Zieltemp. Helfer (input_number.*)</label>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input type="text" list="dl_all_entities" class="in-room-prop" data-ridx="${rIdx}" data-prop="target_temp_entity" value="${r.target_temp_entity || ''}" placeholder="input_number.*_komfort_temperatur" style="flex:1;">
                    <button type="button" class="btn btn-sm btn-pick-entity" data-ridx="${rIdx}" data-prop="target_temp_entity" title="Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;font-size:12px;line-height:1;">🔍</button>
                  </div>
                </div>
                <div class="row">
                  <label>🌡️ Ist-Temperatur Sensor</label>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input type="text" list="dl_all_entities" class="in-room-prop" data-ridx="${rIdx}" data-prop="temp_entity" value="${r.temp_entity || ''}" placeholder="sensor.*_temperatur" style="flex:1;">
                    <button type="button" class="btn btn-sm btn-pick-entity" data-ridx="${rIdx}" data-prop="temp_entity" title="Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;font-size:12px;line-height:1;">🔍</button>
                  </div>
                </div>
                <div class="row">
                  <label>💧 Luftfeuchtigkeit Sensor</label>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input type="text" list="dl_all_entities" class="in-room-prop" data-ridx="${rIdx}" data-prop="humidity_entity" value="${r.humidity_entity || ''}" placeholder="sensor.*_humidity" style="flex:1;">
                    <button type="button" class="btn btn-sm btn-pick-entity" data-ridx="${rIdx}" data-prop="humidity_entity" title="Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;font-size:12px;line-height:1;">🔍</button>
                  </div>
                </div>
                <div class="row">
                  <label>💡 Helligkeit / Lux Sensor</label>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input type="text" list="dl_all_entities" class="in-room-prop" data-ridx="${rIdx}" data-prop="illuminance_entity" value="${r.illuminance_entity || ''}" placeholder="sensor.*_illuminance" style="flex:1;">
                    <button type="button" class="btn btn-sm btn-pick-entity" data-ridx="${rIdx}" data-prop="illuminance_entity" title="Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;font-size:12px;line-height:1;">🔍</button>
                  </div>
                </div>
                <div class="row">
                  <label>🚶 Präsenz / Bewegung</label>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input type="text" list="dl_all_entities" class="in-room-prop" data-ridx="${rIdx}" data-prop="presence_entity" value="${r.presence_entity || ''}" placeholder="binary_sensor.*_occupied" style="flex:1;">
                    <button type="button" class="btn btn-sm btn-pick-entity" data-ridx="${rIdx}" data-prop="presence_entity" title="Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;font-size:12px;line-height:1;">🔍</button>
                  </div>
                </div>
                <div class="row">
                  <label>🪟 Fensterkontakt</label>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input type="text" list="dl_all_entities" class="in-room-prop" data-ridx="${rIdx}" data-prop="window_entity" value="${r.window_entity || ''}" placeholder="binary_sensor.fenster..." style="flex:1;">
                    <button type="button" class="btn btn-sm btn-pick-entity" data-ridx="${rIdx}" data-prop="window_entity" title="Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;font-size:12px;line-height:1;">🔍</button>
                  </div>
                </div>
                <div class="row">
                  <label>🔌 Steckdose / Schalter (switch.*)</label>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input type="text" list="dl_all_entities" class="in-room-prop" data-ridx="${rIdx}" data-prop="switch_entity" value="${r.switch_entity || ''}" placeholder="switch.smartplug..." style="flex:1;">
                    <button type="button" class="btn btn-sm btn-pick-entity" data-ridx="${rIdx}" data-prop="switch_entity" title="Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;font-size:12px;line-height:1;">🔍</button>
                  </div>
                </div>
                <div class="row">
                  <label>📺 ${this._t('tv_display')}</label>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input type="text" list="dl_all_entities" class="in-room-prop" data-ridx="${rIdx}" data-prop="tv_entity" value="${r.tv_entity || ''}" placeholder="media_player.wohnzimmer_tv_2" style="flex:1;">
                    <button type="button" class="btn btn-sm btn-pick-entity" data-ridx="${rIdx}" data-prop="tv_entity" title="Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;font-size:12px;line-height:1;">🔍</button>
                  </div>
                </div>
                <div class="row">
                  <label>🎮 ${this._t('video_player')}</label>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input type="text" list="dl_all_entities" class="in-room-prop" data-ridx="${rIdx}" data-prop="video_entity" value="${r.video_entity || ''}" placeholder="media_player.shield_android_tv" style="flex:1;">
                    <button type="button" class="btn btn-sm btn-pick-entity" data-ridx="${rIdx}" data-prop="video_entity" title="Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;font-size:12px;line-height:1;">🔍</button>
                  </div>
                </div>
                <div class="row">
                  <label>🎵 ${this._t('audio_player')}</label>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input type="text" list="dl_all_entities" class="in-room-prop" data-ridx="${rIdx}" data-prop="media_entity" value="${r.media_entity || ''}" placeholder="media_player.echo_show" style="flex:1;">
                    <button type="button" class="btn btn-sm btn-pick-entity" data-ridx="${rIdx}" data-prop="media_entity" title="Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;font-size:12px;line-height:1;">🔍</button>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- TAB 2: RAUM-OVERLAYS (KATEGORIEN) -->
      <div id="stabContentOverlays" style="${activeTab === 'overlays' ? '' : 'display:none;'}">
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:14px;">
          Konfiguriere individuelle Kategorien und Entitäten-Listen für die Raum-Detail-Overlays beim Anklicken einer Bento-Kachel.
        </div>
        <div style="display:flex;gap:10px;margin-bottom:14px;align-items:center;">
          <label style="font-size:12px;font-weight:600;">Raum auswählen:</label>
          <select id="selSettingsOverlayRoom" style="max-width:240px;padding:6px 10px;border-radius:8px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);">
            ${rooms.map((r, i) => `<option value="${i}" ${i === (this._settingsOverlayRoomIdx || 0) ? 'selected' : ''}>${r.name || r.id}</option>`).join('')}
          </select>
        </div>
        <div id="settingsOverlayCategoriesContainer">
          ${(() => {
            const rIdx = this._settingsOverlayRoomIdx || 0;
            const r = rooms[rIdx];
            if (!r) return '<div>Kein Raum ausgewählt</div>';
            const cats = this._ensureRoomOverlayCategories(r);
            return `
              <div style="display:flex;flex-direction:column;gap:12px;">
                ${cats.map((cat, cIdx) => `
                  <div class="card-box" style="background:var(--bg-card);border:1px solid var(--border-glass);border-radius:14px;padding:14px 16px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px;">
                      <div style="display:flex;align-items:center;gap:8px;flex:1;">
                        <span style="color:var(--accent);font-weight:700;font-size:14px;">${cIdx + 1}.</span>
                        <input type="text" class="in-cat-name" data-cidx="${cIdx}" value="${cat.name || ''}" placeholder="Kategorie Name" style="font-weight:700;font-size:14px;padding:6px 12px;border-radius:8px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);flex:1;max-width:320px;">
                      </div>
                      <div style="display:flex;gap:4px;">
                        <button type="button" class="btn btn-sm btn-cat-up" data-cidx="${cIdx}" ${cIdx === 0 ? 'disabled' : ''} title="Nach oben">▲</button>
                        <button type="button" class="btn btn-sm btn-cat-down" data-cidx="${cIdx}" ${cIdx === cats.length - 1 ? 'disabled' : ''} title="Nach unten">▼</button>
                        <button type="button" class="btn btn-sm btn-del-cat" data-cidx="${cIdx}" style="color:#ef4444;" title="Kategorie löschen">✕</button>
                      </div>
                    </div>

                    <div style="font-size:11px;color:var(--text-secondary);margin-bottom:6px;font-weight:600;">
                      Zugeordnete Entitäten (${(cat.entities || []).length}):
                    </div>

                    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;min-height:36px;padding:8px;background:rgba(0,0,0,0.12);border-radius:10px;border:1px solid var(--border-subtle);align-items:center;">
                      ${(cat.entities || []).length === 0 ? `<span style="font-size:12px;color:var(--text-secondary);padding:4px;">Keine Entitäten zugeordnet. Klicke auf "+ Entität hinzufügen".</span>` : ''}
                      ${(cat.entities || []).map((eId, eIdx) => {
                        const s = this._hass && this._hass.states[eId];
                        const fname = s?.attributes?.friendly_name || eId;
                        return `
                          <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:var(--bg-surface);border:1px solid var(--border-glass);border-radius:20px;font-size:12px;color:var(--text-primary);">
                            <span title="${eId}" style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;">${fname}</span>
                            <button type="button" class="btn-del-cat-ent" data-cidx="${cIdx}" data-eidx="${eIdx}" style="background:none;border:none;color:#ef4444;cursor:pointer;padding:0;font-size:13px;line-height:1;display:flex;align-items:center;" title="Entfernen">✕</button>
                          </span>
                        `;
                      }).join('')}
                    </div>

                    <button type="button" class="btn btn-sm btn-add-cat-ent" data-cidx="${cIdx}" style="background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.3);color:var(--accent);display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;">
                      🔍 + Entität hinzufügen
                    </button>
                  </div>
                `).join('')}
                <button type="button" class="btn btn-sm btn-primary" id="btnAddOverlayCategory" style="align-self:flex-start;padding:8px 16px;border-radius:8px;cursor:pointer;">+ Neue Kategorie hinzufügen</button>
              </div>
            `;
          })()}
        </div>
      </div>

      <!-- TAB 3: BOTTOM-DOCK -->
      <div id="stabContentDock" style="${activeTab === 'dock' ? '' : 'display:none;'}">
        <div style="display:flex;align-items:center;gap:10px;background:var(--bg-card);border:1px solid var(--border-glass);border-radius:12px;padding:12px 16px;margin-bottom:14px;">
          <input type="checkbox" id="chkSettingsDockAutoDetect" ${dock.auto_detect !== false ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer;">
          <div>
            <div style="font-weight:600;font-size:14px;">${this._t('auto_hide_empty')}</div>
            <div style="font-size:12px;color:var(--text-secondary);">Blendet Schaltflächen (wie Alarmo, Heizung, Batterien) automatisch aus, wenn im System keine passenden Geräte existieren.</div>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:8px;">
          ${(dock.items || []).map((item, dIdx) => `
            <div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:10px;padding:10px 14px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <input type="checkbox" class="chk-dock-enable" data-didx="${dIdx}" ${item.enabled !== false ? 'checked' : ''} style="width:16px;height:16px;">
                <span style="font-weight:600;font-size:13px;">${item.title || item.id}</span>
                <span style="font-size:11px;color:var(--text-secondary);font-family:monospace;">(${item.id})</span>
              </div>
              <div style="display:flex;gap:4px;">
                <button class="btn btn-sm btn-set-dock-up" data-didx="${dIdx}" ${dIdx === 0 ? 'disabled' : ''}>▲</button>
                <button class="btn btn-sm btn-set-dock-down" data-didx="${dIdx}" ${dIdx === (dock.items.length - 1) ? 'disabled' : ''}>▼</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- TAB 4: DESIGN & ALLGEMEIN -->
      <div id="stabContentGeneral" style="${activeTab === 'general' ? '' : 'display:none;'}">
        <div class="card-box" style="background:var(--bg-card);border:1px solid var(--border-glass);border-radius:14px;padding:16px;margin-bottom:14px;">
          <div style="font-weight:700;font-size:15px;margin-bottom:12px;">🎨 Erscheinungsbild & Theme</div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;">
            <div class="row">
              <label>${this._t('theme_mode')}</label>
              <select id="cfgThemeMode" style="padding:8px 12px;border-radius:8px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);">
                <option value="auto" ${themeMode === 'auto' ? 'selected' : ''}>${this._t('theme_auto')}</option>
                <option value="light" ${themeMode === 'light' ? 'selected' : ''}>${this._t('theme_light')}</option>
                <option value="dark" ${themeMode === 'dark' ? 'selected' : ''}>${this._t('theme_dark')}</option>
              </select>
              <span style="font-size:11px;color:var(--text-secondary);margin-top:2px;">${this._t('theme_desc')}</span>
            </div>

            <div class="row">
              <label>${this._t('background_style')}</label>
              <select id="cfgBgStyle" style="padding:8px 12px;border-radius:8px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);">
                <option value="aurora" ${bgStyle === 'aurora' ? 'selected' : ''}>${this._t('bg_aurora')}</option>
                <option value="mesh" ${bgStyle === 'mesh' ? 'selected' : ''}>${this._t('bg_mesh')}</option>
                <option value="deep_space" ${bgStyle === 'deep_space' ? 'selected' : ''}>${this._t('bg_deep_space')}</option>
                <option value="sunset" ${bgStyle === 'sunset' ? 'selected' : ''}>${this._t('bg_sunset')}</option>
                <option value="minimal" ${bgStyle === 'minimal' ? 'selected' : ''}>${this._t('bg_minimal')}</option>
                <option value="custom" ${bgStyle === 'custom' ? 'selected' : ''}>${this._t('bg_custom')}</option>
              </select>
              <span style="font-size:11px;color:var(--text-secondary);margin-top:2px;">Wähle zwischen wabernden Lichtern, kristallinem Mesh, Sternenfeld oder Wallpaper.</span>
            </div>

            <div class="row" id="rowCustomBgUrl" style="${bgStyle === 'custom' ? '' : 'display:none;'}">
              <label>${this._t('bg_image_url')}</label>
              <input type="text" id="cfgBgUrl" value="${this._config.background_image_url || ''}" placeholder="https://... oder /local/wallpaper.jpg">
            </div>

            <div class="row">
              <label>${this._t('ambient_intensity')}</label>
              <select id="cfgAmbientSpeed" style="padding:8px 12px;border-radius:8px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);">
                <option value="relaxed" ${animSpeed === 'relaxed' ? 'selected' : ''}>${this._t('speed_relaxed')}</option>
                <option value="normal" ${animSpeed === 'normal' ? 'selected' : ''}>${this._t('speed_normal')}</option>
                <option value="vivid" ${animSpeed === 'vivid' ? 'selected' : ''}>${this._t('speed_vivid')}</option>
              </select>
              <span style="font-size:11px;color:var(--text-secondary);margin-top:2px;">${this._t('ambient_desc')}</span>
            </div>

            <div class="row">
              <label>${this._t('bg_mode')}</label>
              <select id="cfgBgMode" style="padding:8px 12px;border-radius:8px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);">
                <option value="auto" ${bgMode === 'auto' ? 'selected' : ''}>${this._t('bg_mode_auto')}</option>
                <option value="dark" ${bgMode === 'dark' ? 'selected' : ''}>${this._t('bg_mode_dark')}</option>
                <option value="light" ${bgMode === 'light' ? 'selected' : ''}>${this._t('bg_mode_light')}</option>
              </select>
            </div>

            <div class="row">
              <label>${this._t('color_scheme')}</label>
              <select id="cfgColorScheme" style="padding:8px 12px;border-radius:8px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);">
                <option value="auto" ${colorScheme === 'auto' ? 'selected' : ''}>${this._t('scheme_auto')}</option>
                <option value="neon_cyan" ${colorScheme === 'neon_cyan' ? 'selected' : ''}>${this._t('scheme_neon')}</option>
                <option value="warm_amber" ${colorScheme === 'warm_amber' ? 'selected' : ''}>${this._t('scheme_sunset')}</option>
                <option value="emerald_mint" ${colorScheme === 'emerald_mint' ? 'selected' : ''}>${this._t('scheme_emerald')}</option>
                <option value="monochrome_frosted" ${colorScheme === 'monochrome_frosted' ? 'selected' : ''}>${this._t('scheme_monochrome')}</option>
                <option value="high_contrast_light" ${colorScheme === 'high_contrast_light' ? 'selected' : ''}>${this._t('scheme_high_contrast')}</option>
                <option value="custom" ${colorScheme === 'custom' ? 'selected' : ''}>${this._t('scheme_custom')}</option>
              </select>
            </div>

            <div id="rowCustomColors" style="${colorScheme === 'custom' ? 'grid-column:1/-1;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;' : 'display:none;'}">
              <div class="row">
                <label>${this._t('color_text_primary')}</label>
                <input type="text" id="cfgColorTextPrimary" value="${this._config.color_text_primary || ''}" placeholder="#f8fafc">
              </div>
              <div class="row">
                <label>${this._t('color_text_secondary')}</label>
                <input type="text" id="cfgColorTextSecondary" value="${this._config.color_text_secondary || ''}" placeholder="#94a3b8">
              </div>
              <div class="row">
                <label>${this._t('color_modal_bg')}</label>
                <input type="text" id="cfgColorModalBg" value="${this._config.color_modal_bg || ''}" placeholder="rgba(18, 25, 38, 0.92)">
              </div>
              <div class="row">
                <label>${this._t('color_pill_bg')}</label>
                <input type="text" id="cfgColorPillBg" value="${this._config.color_pill_bg || ''}" placeholder="rgba(255, 255, 255, 0.08)">
              </div>
            </div>
          </div>
        </div>

        <div class="card-box" style="background:var(--bg-card);border:1px solid var(--border-glass);border-radius:14px;padding:16px;">
          <div style="font-weight:700;font-size:15px;margin-bottom:12px;">🏠 Globale Entitäten</div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;">
            <div class="row">
              <label>${this._t('dashboard_title_label')}</label>
              <div style="font-size:13px;font-weight:600;color:var(--text-primary);padding:8px 12px;background:var(--bg-surface);border-radius:8px;border:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:space-between;">
                <span>${this._t('smart_home_center')}</span>
                <span style="font-size:11px;color:var(--text-secondary);font-weight:400;">🌐 ${this._t('auto_localized')} (${this._getLang().toUpperCase()})</span>
              </div>
            </div>
            <div class="row">
              <label>Wetter-Entität</label>
              <div style="display:flex;gap:4px;align-items:center;">
                <input type="text" list="dl_all_entities" id="cfgWeather" value="${this._config.weather_entity || ''}" placeholder="weather.hannover_hannover" style="flex:1;">
                <button type="button" class="btn btn-sm btn-pick-global" data-target="cfgWeather" data-domain="weather" title="Wetter-Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;font-size:12px;line-height:1;">🔍</button>
              </div>
            </div>
            <div class="row">
              <label>Wohnungsschloss-Entität</label>
              <div style="display:flex;gap:4px;align-items:center;">
                <input type="text" list="dl_all_entities" id="cfgLock" value="${this._config.lock_entity || ''}" placeholder="lock.wohnungsschloss" style="flex:1;">
                <button type="button" class="btn btn-sm btn-pick-global" data-target="cfgLock" data-domain="lock" title="Schloss-Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;font-size:12px;line-height:1;">🔍</button>
              </div>
            </div>
            <div class="row">
              <label>Alle-Lichter-Entität (Hauptschalter)</label>
              <div style="display:flex;gap:4px;align-items:center;">
                <input type="text" list="dl_all_entities" id="cfgAllLights" value="${this._config.all_lights_entity || ''}" placeholder="light.licht_wohnung" style="flex:1;">
                <button type="button" class="btn btn-sm btn-pick-global" data-target="cfgAllLights" data-domain="light" title="Licht-Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;font-size:12px;line-height:1;">🔍</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:20px;padding-top:14px;border-top:1px solid var(--border-subtle);flex-wrap:wrap;gap:12px;">
        <div id="settingsToast" style="display:none;font-size:13px;font-weight:600;color:#10b981;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.3);padding:6px 12px;border-radius:8px;">
          ${this._t('saved_success')}
        </div>
        <div style="display:flex;gap:10px;margin-left:auto;">
          ${isModal ? `<button class="btn" id="btnCancelSettings">${this._t('cancel')}</button>` : ''}
          <button class="btn btn-primary" id="btnSaveDashboardSettings" style="background:var(--accent);color:white;font-weight:700;padding:8px 20px;border-radius:10px;border:none;cursor:pointer;">
            💾 ${this._t('save_changes')}
          </button>
        </div>
      </div>
    `;

    // Hook up Event Listeners
    container.querySelectorAll('[data-stab]').forEach(tabBtn => {
      tabBtn.onclick = () => {
        this._settingsActiveTab = tabBtn.getAttribute('data-stab');
        this._renderSettingsContent(container, isModal);
      };
    });

    const bgSel = container.querySelector('#cfgBgStyle');
    if (bgSel) {
      bgSel.onchange = () => {
        const rowCust = container.querySelector('#rowCustomBgUrl');
        if (rowCust) rowCust.style.display = bgSel.value === 'custom' ? 'flex' : 'none';
      };
    }

    const schemeSel = container.querySelector('#cfgColorScheme');
    if (schemeSel) {
      schemeSel.onchange = () => {
        const rowCustScheme = container.querySelector('#rowCustomColors');
        if (rowCustScheme) rowCustScheme.style.display = schemeSel.value === 'custom' ? 'grid' : 'none';
      };
    }

    const selOvlRoom = container.querySelector('#selSettingsOverlayRoom');
    if (selOvlRoom) {
      selOvlRoom.onchange = (e) => {
        this._settingsOverlayRoomIdx = parseInt(e.target.value);
        this._renderSettingsContent(container, isModal);
      };
    }

    const btnAddCat = container.querySelector('#btnAddOverlayCategory');
    if (btnAddCat) {
      btnAddCat.onclick = () => {
        const rIdx = this._settingsOverlayRoomIdx || 0;
        const r = this._config.rooms && this._config.rooms[rIdx];
        if (r) {
          const cats = this._ensureRoomOverlayCategories(r);
          cats.push({ id: 'cat_' + Date.now(), name: 'Neue Kategorie', entities: [] });
          this._renderSettingsContent(container, isModal);
        }
      };
    }

    container.querySelectorAll('.btn-del-cat').forEach(b => {
      b.onclick = () => {
        const rIdx = this._settingsOverlayRoomIdx || 0;
        const cIdx = parseInt(b.getAttribute('data-cidx'));
        const r = this._config.rooms && this._config.rooms[rIdx];
        if (r?.overlay_categories) {
          r.overlay_categories.splice(cIdx, 1);
          this._renderSettingsContent(container, isModal);
        }
      };
    });

    container.querySelectorAll('.btn-cat-up').forEach(b => {
      b.onclick = () => {
        const rIdx = this._settingsOverlayRoomIdx || 0;
        const cIdx = parseInt(b.getAttribute('data-cidx'));
        const r = this._config.rooms && this._config.rooms[rIdx];
        if (r?.overlay_categories && cIdx > 0) {
          const tmp = r.overlay_categories[cIdx];
          r.overlay_categories[cIdx] = r.overlay_categories[cIdx - 1];
          r.overlay_categories[cIdx - 1] = tmp;
          this._renderSettingsContent(container, isModal);
        }
      };
    });

    container.querySelectorAll('.btn-cat-down').forEach(b => {
      b.onclick = () => {
        const rIdx = this._settingsOverlayRoomIdx || 0;
        const cIdx = parseInt(b.getAttribute('data-cidx'));
        const r = this._config.rooms && this._config.rooms[rIdx];
        if (r?.overlay_categories && cIdx < r.overlay_categories.length - 1) {
          const tmp = r.overlay_categories[cIdx];
          r.overlay_categories[cIdx] = r.overlay_categories[cIdx + 1];
          r.overlay_categories[cIdx + 1] = tmp;
          this._renderSettingsContent(container, isModal);
        }
      };
    });

    container.querySelectorAll('.btn-add-cat-ent').forEach(btn => {
      btn.onclick = () => {
        const rIdx = this._settingsOverlayRoomIdx || 0;
        const cIdx = parseInt(btn.getAttribute('data-cidx'));
        const r = this._config.rooms && this._config.rooms[rIdx];
        if (!r?.overlay_categories?.[cIdx]) return;
        const cat = r.overlay_categories[cIdx];
        if (!cat.entities) cat.entities = [];

        this._showEntityPicker({
          currentValue: '',
          roomId: r.id,
          roomName: r.name,
          defaultDomain: 'all',
          onSelect: (chosenId) => {
            if (chosenId && !cat.entities.includes(chosenId)) {
              cat.entities.push(chosenId);
              this._renderSettingsContent(container, isModal);
            }
          }
        });
      };
    });

    container.querySelectorAll('.btn-del-cat-ent').forEach(btn => {
      btn.onclick = () => {
        const rIdx = this._settingsOverlayRoomIdx || 0;
        const cIdx = parseInt(btn.getAttribute('data-cidx'));
        const eIdx = parseInt(btn.getAttribute('data-eidx'));
        const r = this._config.rooms && this._config.rooms[rIdx];
        if (r?.overlay_categories?.[cIdx]?.entities) {
          r.overlay_categories[cIdx].entities.splice(eIdx, 1);
          this._renderSettingsContent(container, isModal);
        }
      };
    });

    container.querySelectorAll('.in-cat-name').forEach(inp => {
      inp.oninput = () => {
        const rIdx = this._settingsOverlayRoomIdx || 0;
        const cIdx = parseInt(inp.getAttribute('data-cidx'));
        const r = this._config.rooms && this._config.rooms[rIdx];
        if (r?.overlay_categories?.[cIdx]) {
          r.overlay_categories[cIdx].name = inp.value;
        }
      };
    });

    const btnCancel = container.querySelector('#btnCancelSettings');
    if (btnCancel) {
      btnCancel.onclick = () => this._closeModal();
    }

    // Room up
    container.querySelectorAll('.btn-set-room-up').forEach(b => {
      b.onclick = () => {
        const idx = parseInt(b.getAttribute('data-ridx'));
        if (idx > 0 && this._config.rooms) {
          const temp = this._config.rooms[idx];
          this._config.rooms[idx] = this._config.rooms[idx - 1];
          this._config.rooms[idx - 1] = temp;
          this._renderSettingsContent(container, isModal);
        }
      };
    });

    // Room down
    container.querySelectorAll('.btn-set-room-down').forEach(b => {
      b.onclick = () => {
        const idx = parseInt(b.getAttribute('data-ridx'));
        if (this._config.rooms && idx < this._config.rooms.length - 1) {
          const temp = this._config.rooms[idx];
          this._config.rooms[idx] = this._config.rooms[idx + 1];
          this._config.rooms[idx + 1] = temp;
          this._renderSettingsContent(container, isModal);
        }
      };
    });

    // Sync Areas
    const btnSync = container.querySelector('#btnSyncAreas');
    if (btnSync) {
      btnSync.onclick = async () => {
        btnSync.disabled = true;
        btnSync.textContent = '⏳ Synchronisiere...';
        const res = await this._syncAreas();
        btnSync.disabled = false;
        btnSync.textContent = '🔄 ' + this._t('sync_areas_btn');
        this._renderSettingsContent(container);
        const toast = container.querySelector('#settingsToast');
        if (toast) {
          toast.textContent = `✓ ${this._t('sync_areas_success')} (${res ? res.total : 0} Bereiche)`;
          toast.style.display = 'block';
          setTimeout(() => { if (toast) toast.style.display = 'none'; }, 4000);
        }
      };
    }

    // Dock up / down / toggle
    container.querySelectorAll('.btn-set-dock-up').forEach(b => {
      b.onclick = () => {
        const idx = parseInt(b.getAttribute('data-didx'));
        if (idx > 0 && this._config.dock?.items) {
          const temp = this._config.dock.items[idx];
          this._config.dock.items[idx] = this._config.dock.items[idx - 1];
          this._config.dock.items[idx - 1] = temp;
          this._renderSettingsContent(container, isModal);
        }
      };
    });

    container.querySelectorAll('.btn-set-dock-down').forEach(b => {
      b.onclick = () => {
        const idx = parseInt(b.getAttribute('data-didx'));
        if (this._config.dock?.items && idx < this._config.dock.items.length - 1) {
          const temp = this._config.dock.items[idx];
          this._config.dock.items[idx] = this._config.dock.items[idx + 1];
          this._config.dock.items[idx + 1] = temp;
          this._renderSettingsContent(container, isModal);
        }
      };
    });

    container.querySelectorAll('.chk-dock-enable').forEach(chk => {
      chk.onchange = () => {
        const idx = parseInt(chk.getAttribute('data-didx'));
        if (this._config.dock?.items && this._config.dock.items[idx]) {
          this._config.dock.items[idx].enabled = chk.checked;
        }
      };
    });

    // Entity Picker for Room Properties
    container.querySelectorAll('.btn-pick-entity').forEach(btn => {
      btn.onclick = () => {
        const rIdx = parseInt(btn.getAttribute('data-ridx'));
        const prop = btn.getAttribute('data-prop');
        const room = this._config.rooms && this._config.rooms[rIdx];
        if (!room) return;
        const targetInp = container.querySelector(`.in-room-prop[data-ridx="${rIdx}"][data-prop="${prop}"]`);
        const curVal = targetInp ? targetInp.value : (room[prop] || '');
        
        let defDomain = 'all';
        if (prop === 'light_entity') defDomain = 'light';
        else if (prop === 'climate_entity') defDomain = 'climate';
        else if (prop === 'switch_entity') defDomain = 'switch';
        else if (prop === 'tv_entity' || prop === 'video_entity' || prop === 'media_entity') defDomain = 'media_player';
        else if (prop === 'temp_entity' || prop === 'humidity_entity' || prop === 'illuminance_entity') defDomain = 'sensor';
        else if (prop === 'presence_entity' || prop === 'window_entity') defDomain = 'binary_sensor';
        else if (prop === 'target_temp_entity') defDomain = 'input_number';
        
        this._showEntityPicker({
          currentValue: curVal,
          roomId: room.id,
          roomName: room.name,
          defaultDomain: defDomain,
          onSelect: (selectedId) => {
            if (targetInp) targetInp.value = selectedId;
            if (this._config.rooms && this._config.rooms[rIdx]) {
              this._config.rooms[rIdx][prop] = selectedId;
            }
          }
        });
      };
    });

    // Global Entity Pickers (Weather, Lock, AllLights)
    container.querySelectorAll('.btn-pick-global').forEach(btn => {
      btn.onclick = () => {
        const targetId = btn.getAttribute('data-target');
        const domain = btn.getAttribute('data-domain') || 'all';
        const targetInp = container.querySelector('#' + targetId);
        const curVal = targetInp ? targetInp.value : '';
        this._showEntityPicker({
          currentValue: curVal,
          roomId: null,
          roomName: null,
          defaultDomain: domain,
          onSelect: (selectedId) => {
            if (targetInp) targetInp.value = selectedId;
            if (targetId === 'cfgWeather') this._config.weather_entity = selectedId;
            else if (targetId === 'cfgLock') this._config.lock_entity = selectedId;
            else if (targetId === 'cfgAllLights') this._config.all_lights_entity = selectedId;
          }
        });
      };
    });

    // Live Preview for Appearance Controls
    const selThemeMode = container.querySelector('#cfgThemeMode');
    if (selThemeMode) {
      selThemeMode.onchange = () => {
        this._config.theme_mode = selThemeMode.value;
        this._applyThemeClass();
      };
    }
    const selBgStyle = container.querySelector('#cfgBgStyle');
    if (selBgStyle) {
      selBgStyle.onchange = () => {
        this._config.background_style = selBgStyle.value;
        const rowBgUrl = container.querySelector('#rowCustomBgUrl');
        if (rowBgUrl) rowBgUrl.style.display = (selBgStyle.value === 'custom') ? 'block' : 'none';
        this._applyThemeClass();
      };
    }
    const selBgMode = container.querySelector('#cfgBgMode');
    if (selBgMode) {
      selBgMode.onchange = () => {
        this._config.background_mode = selBgMode.value;
        this._applyThemeClass();
      };
    }
    const selAmbientSpeed = container.querySelector('#cfgAmbientSpeed');
    if (selAmbientSpeed) {
      selAmbientSpeed.onchange = () => {
        this._config.ambient_speed = selAmbientSpeed.value;
        this._applyThemeClass();
      };
    }

    // Save button
    const btnSave = container.querySelector('#btnSaveDashboardSettings');
    if (btnSave) {
      btnSave.onclick = async () => {
        // Collect room inputs
        container.querySelectorAll('.in-room-prop').forEach(inp => {
          const rIdx = parseInt(inp.getAttribute('data-ridx'));
          const prop = inp.getAttribute('data-prop');
          if (this._config.rooms && this._config.rooms[rIdx]) {
            this._config.rooms[rIdx][prop] = inp.value.trim();
          }
        });

        // Collect overlay category inputs
        const rIdx = this._settingsOverlayRoomIdx || 0;
        if (this._config.rooms && this._config.rooms[rIdx]?.overlay_categories) {
          container.querySelectorAll('.in-cat-name').forEach(inp => {
            const cIdx = parseInt(inp.getAttribute('data-cidx'));
            if (this._config.rooms[rIdx].overlay_categories[cIdx]) {
              this._config.rooms[rIdx].overlay_categories[cIdx].name = inp.value.trim();
            }
          });
          container.querySelectorAll('.in-cat-ents').forEach(inp => {
            const cIdx = parseInt(inp.getAttribute('data-cidx'));
            if (this._config.rooms[rIdx].overlay_categories[cIdx]) {
              this._config.rooms[rIdx].overlay_categories[cIdx].entities = inp.value.split(',').map(s => s.trim()).filter(Boolean);
            }
          });
        }

        // Collect general inputs
        const tMode = container.querySelector('#cfgThemeMode');
        if (tMode) this._config.theme_mode = tMode.value;

        const bStyle = container.querySelector('#cfgBgStyle');
        if (bStyle) this._config.background_style = bStyle.value;

        const bUrl = container.querySelector('#cfgBgUrl');
        if (bUrl) this._config.background_image_url = bUrl.value.trim();

        const aSpeed = container.querySelector('#cfgAmbientSpeed');
        if (aSpeed) this._config.ambient_speed = aSpeed.value;

        const bMode = container.querySelector('#cfgBgMode');
        if (bMode) this._config.background_mode = bMode.value;

        const cScheme = container.querySelector('#cfgColorScheme');
        if (cScheme) this._config.color_scheme = cScheme.value;

        const cPri = container.querySelector('#cfgColorTextPrimary');
        if (cPri) this._config.color_text_primary = cPri.value.trim();

        const cSec = container.querySelector('#cfgColorTextSecondary');
        if (cSec) this._config.color_text_secondary = cSec.value.trim();

        const cModalBg = container.querySelector('#cfgColorModalBg');
        if (cModalBg) this._config.color_modal_bg = cModalBg.value.trim();

        const cPillBg = container.querySelector('#cfgColorPillBg');
        if (cPillBg) this._config.color_pill_bg = cPillBg.value.trim();

        delete this._config.title;

        const cWeather = container.querySelector('#cfgWeather');
        if (cWeather) this._config.weather_entity = cWeather.value.trim();

        const cLock = container.querySelector('#cfgLock');
        if (cLock) this._config.lock_entity = cLock.value.trim();

        const cLights = container.querySelector('#cfgAllLights');
        if (cLights) this._config.all_lights_entity = cLights.value.trim();

        const cAutoDock = container.querySelector('#chkSettingsDockAutoDetect');
        if (cAutoDock && this._config.dock) this._config.dock.auto_detect = cAutoDock.checked;

        // Persist via WebSocket to Lovelace
        await this._saveDashboardConfig(this._config);

        // Toast feedback
        const toast = container.querySelector('#settingsToast');
        if (toast) {
          toast.style.display = 'block';
          setTimeout(() => { if (toast) toast.style.display = 'none'; }, 4000);
        }
      };
    }
  }

  _render() {
    const isSettings = this._config && (this._config.mode === 'settings' || this._config.view === 'settings');
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
            inset 1.5px 0 1.5px 0 rgba(255, 255, 255, 0.85),
            inset -1.5px 0 1.5px 0 rgba(15, 23, 42, 0.04);
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
            inset 1.5px 0 1.5px 0 rgba(255, 255, 255, 0.12),
            inset -1.5px 0 1.5px 0 rgba(0, 0, 0, 0.18);
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

        /* --- BACKGROUND STYLE PRESETS --- */
        .dashboard-root.bg-aurora .liquid-backdrop {
          display: block;
        }
        .dashboard-root.bg-mesh .liquid-backdrop,
        .dashboard-root.bg-deep_space .liquid-backdrop,
        .dashboard-root.bg-sunset .liquid-backdrop,
        .dashboard-root.bg-minimal .liquid-backdrop,
        .dashboard-root.bg-custom .liquid-backdrop {
          display: none;
        }

        /* Preset 2: Spatial Mesh */
        .dashboard-root.theme-dark.bg-mesh {
          background-color: #0b1120;
          background-image:
            radial-gradient(rgba(56, 189, 248, 0.20) 1px, transparent 1px),
            radial-gradient(rgba(99, 102, 241, 0.15) 1px, transparent 1px),
            linear-gradient(135deg, #070d18 0%, #0f172a 50%, #1e1b4b 100%);
          background-size: 32px 32px, 32px 32px, 100% 100%;
          background-position: 0 0, 16px 16px, 0 0;
        }
        .dashboard-root.theme-light.bg-mesh {
          background-color: #f1f5f9;
          background-image:
            radial-gradient(rgba(2, 132, 199, 0.18) 1.2px, transparent 1.2px),
            radial-gradient(rgba(99, 102, 241, 0.12) 1.2px, transparent 1.2px),
            linear-gradient(135deg, #e2e8f0 0%, #f8fafc 50%, #ede9fe 100%);
          background-size: 32px 32px, 32px 32px, 100% 100%;
          background-position: 0 0, 16px 16px, 0 0;
        }

        /* Preset 3: Deep Space Starfield */
        .dashboard-root.theme-dark.bg-deep_space,
        .dashboard-root.theme-light.bg-deep_space {
          background-color: #030712;
          background-image:
            radial-gradient(1px 1px at 20px 30px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 100px 150px, rgba(255,255,255,0.9), rgba(0,0,0,0)),
            radial-gradient(1px 1px at 240px 80px, #38bdf8, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 320px 220px, #818cf8, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 450px 120px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(circle at 50% 15%, #1e1b4b 0%, #0f172a 45%, #020617 100%);
          background-size: 550px 550px, 450px 450px, 600px 600px, 500px 500px, 400px 400px, 100% 100%;
        }

        /* Preset 4: Sunset Glow */
        .dashboard-root.theme-dark.bg-sunset {
          background:
            radial-gradient(circle at 12% 18%, rgba(245, 158, 11, 0.22) 0%, transparent 45%),
            radial-gradient(circle at 88% 78%, rgba(236, 72, 153, 0.24) 0%, transparent 50%),
            radial-gradient(circle at 75% 20%, rgba(139, 92, 246, 0.20) 0%, transparent 45%),
            linear-gradient(135deg, #180d24 0%, #201335 45%, #0f172a 100%);
        }
        .dashboard-root.theme-light.bg-sunset {
          background:
            radial-gradient(circle at 15% 15%, rgba(254, 215, 170, 0.85) 0%, transparent 50%),
            radial-gradient(circle at 85% 85%, rgba(251, 207, 232, 0.70) 0%, transparent 50%),
            radial-gradient(circle at 70% 20%, rgba(233, 213, 255, 0.65) 0%, transparent 45%),
            linear-gradient(135deg, #fff7ed 0%, #fef2f2 40%, #fdf4ff 100%);
        }

        /* Preset 5: Minimal Frosted Glass */
        .dashboard-root.theme-dark.bg-minimal {
          background: linear-gradient(135deg, #0b0f17 0%, #111827 50%, #0f172a 100%);
        }
        .dashboard-root.theme-light.bg-minimal {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%);
        }

        /* Preset 6: Custom Image */
        .dashboard-root.bg-custom {
          background-size: cover !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
        }

        /* Animation Speeds */
        .dashboard-root.anim-relaxed .liquid-orb {
          animation-duration: 52s !important;
        }
        .dashboard-root.anim-normal .liquid-orb {
          animation-duration: 26s !important;
        }
        .dashboard-root.anim-vivid .liquid-orb {
          animation-duration: 12s !important;
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
          transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.28s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
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
          background: linear-gradient(115deg, transparent 0%, transparent 35%, rgba(255, 255, 255, 0.26) 50%, rgba(255, 255, 255, 0.06) 54%, transparent 68%);
          background-size: 250% 250%;
          background-position: -120% -120%;
          pointer-events: none;
          z-index: 2;
          opacity: 0.5;
          transition: background-position 0.75s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s;
        }

        .sidebar-card:hover {
          transform: translateY(-3px) scale(1.008);
          border-color: rgba(56, 189, 248, 0.5);
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.45), 0 0 22px rgba(56, 189, 248, 0.22), inset 0 1px 2px rgba(255, 255, 255, 0.85);
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

        .theme-light .sidebar-card:hover {
          transform: translateY(-3px) scale(1.008);
          border-color: rgba(2, 132, 199, 0.55);
          box-shadow: 0 20px 42px rgba(15, 23, 42, 0.16), 0 0 20px rgba(2, 132, 199, 0.2), inset 0 1px 2px rgba(255, 255, 255, 1);
        }

        .theme-light .sidebar-card::after {
          background: linear-gradient(115deg,
            transparent 0%,
            transparent 32%,
            rgba(15, 23, 42, 0.03) 42%,
            rgba(15, 23, 42, 0.14) 50%,
            rgba(15, 23, 42, 0.04) 58%,
            transparent 70%);
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
          background: var(--bg-pill, rgba(255, 255, 255, 0.12));
          border: 1px solid var(--border-subtle);
          color: var(--accent);
        }

        .theme-light .sidebar-pill {
          background: var(--bg-pill, rgba(2, 132, 199, 0.10));
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
          background: var(--bg-pill, rgba(255, 255, 255, 0.1));
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
        }

        .theme-light .sidebar-mini-pill {
          background: var(--bg-pill, #ffffff);
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
          background: var(--bg-pill, rgba(255, 255, 255, 0.05));
          border: 1px solid var(--border-subtle);
          transition: background 0.2s;
        }

        .theme-light .agenda-item {
          background: var(--bg-pill, rgba(248, 250, 252, 0.95));
          border-color: rgba(226, 232, 240, 1);
          color: #0f172a;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
        }

        /* Sidebar items dynamic reflection sheen */
        .sidebar-pill,
        .sidebar-weather-box,
        .sidebar-mini-pill,
        .agenda-item {
          position: relative;
          overflow: hidden;
        }

        .sidebar-pill::after,
        .sidebar-weather-box::after,
        .sidebar-mini-pill::after,
        .agenda-item::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(115deg, transparent 0%, transparent 35%, rgba(255, 255, 255, 0.28) 50%, transparent 65%);
          background-size: 250% 250%;
          background-position: -120% -120%;
          pointer-events: none;
          z-index: 2;
          opacity: 0.6;
          transition: background-position 0.75s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s;
        }

        .theme-light .sidebar-pill::after,
        .theme-light .sidebar-weather-box::after,
        .theme-light .sidebar-mini-pill::after,
        .theme-light .agenda-item::after {
          background: linear-gradient(115deg,
            transparent 0%,
            transparent 32%,
            rgba(15, 23, 42, 0.03) 42%,
            rgba(15, 23, 42, 0.12) 50%,
            rgba(15, 23, 42, 0.04) 58%,
            transparent 70%);
          background-size: 250% 250%;
          background-position: -120% -120%;
        }

        .sidebar-pill:hover::after,
        .sidebar-weather-box:hover::after,
        .sidebar-mini-pill:hover::after,
        .agenda-item:hover::after {
          background-position: 140% 140%;
          opacity: 1;
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
          transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.28s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
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
          transition: opacity 0.3s;
        }

        .room-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(115deg, transparent 0%, transparent 35%, rgba(255, 255, 255, 0.28) 50%, rgba(255, 255, 255, 0.08) 54%, transparent 68%);
          background-size: 250% 250%;
          background-position: -120% -120%;
          pointer-events: none;
          z-index: 2;
          opacity: 0.5;
          transition: background-position 0.75s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s;
        }

        .room-card:hover {
          transform: translateY(-5px) scale(1.015);
          border-color: rgba(56, 189, 248, 0.55);
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.48), 0 0 25px rgba(56, 189, 248, 0.28), inset 0 1px 2px rgba(255, 255, 255, 0.85);
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
            transparent 32%,
            rgba(15, 23, 42, 0.03) 42%,
            rgba(15, 23, 42, 0.16) 50%,
            rgba(15, 23, 42, 0.04) 58%,
            transparent 70%);
          background-size: 250% 250%;
          background-position: -120% -120%;
        }

        .theme-light .room-card:hover {
          transform: translateY(-5px) scale(1.015);
          border-color: rgba(2, 132, 199, 0.6);
          box-shadow: 0 20px 42px rgba(15, 23, 42, 0.16), 0 0 22px rgba(2, 132, 199, 0.22), inset 0 1px 2px rgba(255, 255, 255, 1);
        }

        .room-card .action-circle {
          transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.2s, box-shadow 0.2s;
        }

        .room-card .action-circle:hover {
          transform: scale(1.18);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
        }

        .room-card .quick-climate-stepper button {
          transition: transform 0.15s, background 0.15s;
        }

        .room-card .quick-climate-stepper button:hover {
          transform: scale(1.14);
          background: rgba(255, 255, 255, 0.28);
        }

        .room-bg-image {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          opacity: 0.22;
          filter: saturate(1.2);
          pointer-events: none;
          transition: opacity 0.3s, transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.3s;
        }
        .room-card:hover .room-bg-image {
          opacity: 0.36;
          transform: scale(1.04);
          filter: saturate(1.35) contrast(1.05);
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
          background: var(--bg-pill, rgba(255, 255, 255, 0.12));
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
          background: var(--bg-pill, rgba(241, 245, 249, 0.9));
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
          background: rgba(30, 41, 59, 0.82);
          border: 1px solid rgba(255, 255, 255, 0.20);
          color: var(--text-primary);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.3), 0 2px 6px rgba(0, 0, 0, 0.25);
          transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s, box-shadow 0.2s, border-color 0.2s;
        }

        .dock-item:hover {
          transform: translateY(-4px) scale(1.14);
          background: rgba(45, 60, 85, 0.95);
          border-color: rgba(56, 189, 248, 0.70);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.5), 0 8px 18px rgba(0, 0, 0, 0.35), 0 0 16px rgba(56, 189, 248, 0.40);
        }

        .dock-item:active {
          transform: translateY(-1px) scale(0.96);
        }

        .theme-dark .dock-item {
          background: rgba(30, 41, 59, 0.82);
          border: 1px solid rgba(255, 255, 255, 0.20);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.35), 0 2px 6px rgba(0, 0, 0, 0.25);
        }

        .theme-dark .dock-item:hover {
          background: rgba(45, 60, 85, 0.95);
          border-color: rgba(56, 189, 248, 0.70);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.5), 0 8px 18px rgba(0, 0, 0, 0.35), 0 0 16px rgba(56, 189, 248, 0.40);
        }

        .theme-light .dock-item {
          background: #f0f6ff;
          border: 1.5px solid rgba(147, 197, 253, 0.85);
          color: #0f172a;
          box-shadow:
            inset 0 1.5px 1px 0 #ffffff,
            inset 0 -1px 1px 0 rgba(15, 23, 42, 0.08),
            0 2px 6px rgba(15, 23, 42, 0.12);
        }

        .theme-light .dock-item:hover {
          background: #e0f2fe;
          border-color: #0284c7;
          box-shadow:
            inset 0 1.5px 1px 0 #ffffff,
            0 6px 18px rgba(2, 132, 199, 0.35);
          transform: translateY(-4px) scale(1.14);
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
          background: var(--bg-modal, var(--bg-card));
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
          background: var(--bg-modal, rgba(255, 255, 255, 0.88));
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

        /* VisionOS Styled D-Pad Remote Navigation Grid */
        .dpad-grid {
          display: grid;
          grid-template-columns: repeat(3, 40px);
          grid-template-rows: repeat(3, 38px);
          gap: 6px;
          justify-content: center;
          align-items: center;
          padding: 8px;
          background: rgba(0, 0, 0, 0.16);
          border-radius: 18px;
          border: 1px solid var(--border-subtle);
        }
        .theme-light .dpad-grid {
          background: rgba(0, 0, 0, 0.04);
        }
        .btn-dpad {
          width: 40px;
          height: 38px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: var(--bg-pill, rgba(255, 255, 255, 0.08));
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.15s ease;
          font-weight: 700;
          font-size: 12px;
        }
        .btn-dpad:hover {
          background: var(--accent);
          color: #ffffff;
          border-color: var(--accent);
          transform: scale(1.06);
        }
        .btn-dpad:active {
          transform: scale(0.94);
        }
        .btn-dpad.btn-dpad-ok {
          background: rgba(56, 189, 248, 0.18);
          border-color: rgba(56, 189, 248, 0.35);
          color: var(--accent);
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        .theme-light .btn-dpad {
          background: var(--bg-pill, #ffffff);
          border: 1px solid #cbd5e1;
          color: #0f172a;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }
        .theme-light .btn-dpad:hover {
          background: var(--accent);
          color: #ffffff;
          border-color: var(--accent);
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

        /* Dock item icon transitions - eliminates Chromium & Firefox WebRender crosshair artifact */
        .dock-item .vg-icon {
          pointer-events: none;
          transform: none !important;
          filter: none !important;
          transition: none !important;
        }
        .dock-item:hover .vg-icon {
          transform: none !important;
          filter: none !important;
        }

        /* --- DEDICATED SETTINGS VIEW & MODAL STYLING --- */
        .card-box {
          background: var(--bg-card);
          border: 1px solid var(--border-glass);
          border-radius: 14px;
          padding: 16px;
          box-shadow: var(--shadow-ambient);
          backdrop-filter: blur(24px) saturate(190%);
          -webkit-backdrop-filter: blur(24px) saturate(190%);
        }
        .nav-tabs {
          display: flex;
          gap: 6px;
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 10px;
          margin-bottom: 16px;
          overflow-x: auto;
        }
        .nav-tab {
          padding: 8px 14px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
          white-space: nowrap;
          backdrop-filter: blur(10px);
        }
        .theme-light .nav-tab {
          background: rgba(255, 255, 255, 0.65);
          border-color: rgba(226, 232, 240, 0.9);
          color: var(--text-secondary);
        }
        .nav-tab:hover {
          background: rgba(255, 255, 255, 0.16);
          color: var(--text-primary);
        }
        .theme-light .nav-tab:hover {
          background: rgba(255, 255, 255, 0.9);
          color: var(--text-primary);
        }
        .nav-tab.active {
          background: var(--accent);
          color: #ffffff !important;
          border-color: var(--accent);
          box-shadow: 0 4px 14px rgba(56, 189, 248, 0.35);
        }
        .form-row, .row {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 12px;
        }
        .row-horiz {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .form-label, label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .form-input, .form-select,
        .card-box input[type="text"],
        .card-box select {
          padding: 9px 12px;
          border-radius: 9px;
          border: 1px solid var(--border-glass);
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
          font-size: 13px;
          outline: none;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .theme-light .form-input,
        .theme-light .form-select,
        .theme-light .card-box input[type="text"],
        .theme-light .card-box select {
          background: rgba(255, 255, 255, 0.85);
          border-color: rgba(203, 213, 225, 0.9);
          color: #0f172a;
        }
        .form-input:focus, .form-select:focus,
        .card-box input[type="text"]:focus,
        .card-box select:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
        }
        .btn {
          padding: 8px 14px;
          border-radius: 9px;
          border: 1px solid var(--border-glass);
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
          user-select: none;
        }
        .theme-light .btn {
          background: rgba(255, 255, 255, 0.85);
          border-color: rgba(203, 213, 225, 0.9);
          color: #0f172a;
        }
        .btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }
        .theme-light .btn:hover {
          background: rgba(255, 255, 255, 1);
        }
        .btn:active {
          transform: translateY(0);
        }
        .btn-primary {
          background: var(--accent) !important;
          color: #ffffff !important;
          border-color: var(--accent) !important;
          box-shadow: 0 4px 14px rgba(56, 189, 248, 0.35);
        }
        .btn-primary:hover {
          filter: brightness(1.1);
        }
        .btn-sm {
          padding: 5px 10px;
          font-size: 12px;
          border-radius: 7px;
        }
        .btn-danger {
          background: rgba(239, 68, 68, 0.18) !important;
          color: #ef4444 !important;
          border-color: rgba(239, 68, 68, 0.35) !important;
        }
        .btn-danger:hover {
          background: #ef4444 !important;
          color: #ffffff !important;
        }

      </style>

      ${isSettings ? `
        <div class="dashboard-root theme-dark" style="min-height:calc(100vh - 56px);padding:24px 32px 80px 32px;box-sizing:border-box;">
          <!-- Liquid Background Morphing Orbs -->
          <div class="liquid-backdrop" aria-hidden="true">
            <div class="liquid-orb liquid-orb-1"></div>
            <div class="liquid-orb liquid-orb-2"></div>
            <div class="liquid-orb liquid-orb-3"></div>
            <div class="liquid-orb liquid-orb-4"></div>
          </div>
          <div id="settingsPageContainer" style="max-width:960px;margin:0 auto;position:relative;z-index:10;"></div>
        </div>
      ` : `
        <div class="dashboard-root theme-dark">
          <!-- Liquid Background Morphing Orbs (Fluide Lichtwellen & Wasserbrechung) -->
        <div class="liquid-backdrop" aria-hidden="true">
          <div class="liquid-orb liquid-orb-1"></div>
          <div class="liquid-orb liquid-orb-2"></div>
          <div class="liquid-orb liquid-orb-3"></div>
          <div class="liquid-orb liquid-orb-4"></div>
        </div>

        <!-- Lovelace Edit Mode Banner -->
        <div id="editModeBanner" class="edit-mode-banner" style="display:${this._checkIsEditMode() ? 'flex' : 'none'};background:linear-gradient(135deg,rgba(2,132,199,0.95),rgba(79,70,229,0.95));backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.25);border-radius:14px;padding:12px 18px;margin-bottom:14px;justify-content:space-between;align-items:center;color:white;box-shadow:0 8px 24px rgba(0,0,0,0.3);position:relative;z-index:30;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="font-size:24px;line-height:1;">⚙️</div>
            <div>
              <div style="font-weight:700;font-size:14px;letter-spacing:0.2px;">${this._t('edit_banner_title')}</div>
              <div style="font-size:12px;opacity:0.92;margin-top:2px;">${this._t('edit_banner_subtitle')}</div>
            </div>
          </div>
          <button id="btnEditBannerSettings" style="background:#ffffff;color:#0284c7;font-weight:700;font-size:13px;border:none;padding:8px 16px;border-radius:10px;cursor:pointer;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.18);transition:all 0.2s;">
            ${this._t('open_settings_page')} &rarr;
          </button>
        </div>

        <!-- Top Bar Navigation & Status Chips -->
        <div class="top-bar">
          <div>
            <div class="date-title" id="dateTitle">...</div>
            <div class="name-day" id="subHeader">${this._t('welcome')}${(this._hass && this._hass.user && this._hass.user.name) ? ', ' + this._hass.user.name : ''} • ${this._t('smart_home_center')}</div>
          </div>

          <div class="chips-container">
            <div class="chip" id="chipPersonAndreas" title="Status Andreas">${this._icon('user', { size: 14, style: 'margin-right:4px;' })} Andreas...</div>
            <div class="chip" id="chipPersonShanty" title="Status Shanty">${this._icon('user', { size: 14, style: 'margin-right:4px;' })} Shanty...</div>
            <div class="chip" id="chipLights">${this._icon('light', { size: 14, cls: 'icon-light', style: 'margin-right:4px;' })} ${this._t('lights_loading')}</div>
            <div class="chip" id="chipClimate">${this._icon('climate', { size: 14, cls: 'icon-climate', style: 'margin-right:4px;' })} ${this._t('climate_loading')}</div>
            <div class="chip" id="chipLock">${this._icon('lock-closed', { size: 14, cls: 'icon-security', style: 'margin-right:4px;' })} ${this._t('lock_loading')}</div>
            <div class="chip" id="chipAlarmo">${this._icon('shield', { size: 14, cls: 'icon-alarmo', style: 'margin-right:4px;' })} ${this._t('alarmo_loading')}</div>
            <div class="chip" id="chipWeather">${this._icon('weather-partlycloudy', { size: 14, cls: 'icon-weather', style: 'margin-right:4px;' })} ${this._t('weather_loading')}</div>
            <button class="chip chip-settings" id="chipSettings" title="${this._t('settings')}" style="background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.3);color:var(--accent);cursor:pointer;">
              ${this._icon('settings', { size: 14, style: 'margin-right:4px;' })} ${this._t('settings')}
            </button>
          </div>
        </div>

        <!-- Dashboard Body Layout -->
        <div class="dashboard-body">
          <!-- Left Glanceable Sidebar -->
          <div class="sidebar-card">
            <!-- Top Location & Greeting -->
            <div class="sidebar-header-badge">
              <span class="sidebar-pill">${this._icon('map-pin', { size: 13, style: 'margin-right:4px;' })} ${(this._hass && this._hass.config && this._hass.config.location_name) || (this._config && this._config.location_name) || 'Home'}</span>
            </div>

            <!-- Live Clock & Date -->
            <div class="sidebar-clock-wrap">
              <div class="clock-display" id="liveClock">--:--:--</div>
              <div class="sidebar-date-sub" id="sidebarDateSub">${this._t('loading')}</div>
            </div>

            <!-- Weather Hero Box (Clickable to open weather modal) -->
            <div class="sidebar-weather-box" id="sidebarWeather" title="Wetterübersicht & Vorhersage öffnen">
              <div class="sidebar-weather-top">
                <div>
                  <div class="weather-temp" id="weatherTemp">--°C</div>
                  <div class="weather-cond" id="weatherCondition">${this._t('loading')}</div>
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
              <div class="agenda-item"><span>${this._t('loading')}</span></div>
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

                const hEntity = (room.humidity_entity && room.humidity_entity.trim()) ? room.humidity_entity.trim() : null;
                const hState = hEntity && this._hass.states[hEntity];
                if (hState && hState.state && !isNaN(parseFloat(hState.state))) {
                  initHum = `${Math.round(parseFloat(hState.state))}%`;
                }

                const luxEntity = (room.illuminance_entity && room.illuminance_entity.trim()) ? room.illuminance_entity.trim() : null;
                const luxState = luxEntity && this._hass.states[luxEntity];
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
                      <div class="room-sub">${this._t('loading')}</div>
                    </div>
                  </div>

                  <!-- Room Environmental Readings (Temp, Humidity, Lux) -->
                  <div class="room-env-bar">
                    <span class="env-pill env-temp" style="${initTemp !== '--°C' ? 'display:inline-flex;' : 'display:none;'}">${this._icon('thermometer', { size: 11, cls: 'icon-temp', style: 'margin-right:3px;' })} ${initTemp}</span>
                    <span class="env-pill env-humidity" style="${initHum ? 'display:inline-flex;' : 'display:none;'}">${this._icon('droplet', { size: 11, cls: 'icon-humidity', style: 'margin-right:3px;' })} ${initHum || '--%'}</span>
                    <span class="env-pill env-lux" style="${initLux ? 'display:inline-flex;' : 'display:none;'}">${this._icon('lux', { size: 11, cls: 'icon-lux', style: 'margin-right:3px;' })} ${initLux || '-- lx'}</span>
                  </div>

                  <!-- Bottom Row: Actions & Heating Quick Stepper -->
                  <div class="room-bottom-row">
                    <div class="room-actions">
                      ${(room.light_entity && room.light_entity.trim()) ? `<div class="action-circle action-light" title="${this._t('toggle_light')}" data-action="light" data-idx="${idx}">${this._icon('light', { size: 16, cls: 'icon-light' })}</div>` : ''}
                      ${(room.climate_entity && room.climate_entity.trim()) ? `<div class="action-circle action-climate" title="${this._t('open_climate')}" data-action="climate" data-idx="${idx}">${this._icon('climate', { size: 16, cls: 'icon-climate' })}</div>` : ''}
                      ${((room.media_entity && room.media_entity.trim()) || (room.audio_entity && room.audio_entity.trim()) || (room.video_entity && room.video_entity.trim())) ? `<div class="action-circle action-media" title="${this._t('toggle_media')}" data-action="media" data-idx="${idx}">${this._icon('music', { size: 16, cls: 'icon-media' })}</div>` : ''}
                      ${(room.lock_entity && room.lock_entity.trim()) ? `<div class="action-circle action-lock" title="${this._t('toggle_lock')}" data-action="lock" data-idx="${idx}">${this._icon('lock-closed', { size: 16, cls: 'icon-security' })}</div>` : ''}
                    </div>

                    ${(room.climate_entity && room.climate_entity.trim()) ? `
                      <div class="quick-climate-stepper" title="${this._t('adjust_temp')}">
                        <button class="quick-step-btn" data-action="temp-minus" data-idx="${idx}" title="${this._t('temp_down')}" style="display:flex;align-items:center;justify-content:center;">${this._icon('minus', { size: 11 })}</button>
                        <span class="quick-step-val" id="targetTemp_${idx}">--°</span>
                        <button class="quick-step-btn" data-action="temp-plus" data-idx="${idx}" title="${this._t('temp_up')}" style="display:flex;align-items:center;justify-content:center;">${this._icon('plus', { size: 11 })}</button>
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
          <div class="dock-item" id="dockLighting" title="${this._t('lighting')}">${this._icon('light', { size: 19, cls: 'icon-light' })}</div>
          <div class="dock-item" id="dockClimate" title="${this._t('climate')}">${this._icon('climate', { size: 19, cls: 'icon-climate' })}</div>
          <div class="dock-item" id="dockStats" title="${this._t('stats')}">${this._icon('chart-bar', { size: 19, cls: 'icon-stats' })}</div>
          <div class="dock-item" id="dockSecurity" title="${this._t('security')}">${this._icon('lock-closed', { size: 19, cls: 'icon-security' })}</div>
          <div class="dock-item" id="dockAlarmo" title="${this._t('alarmo')}">${this._icon('shield', { size: 19, cls: 'icon-alarmo' })}</div>
          <div class="dock-item" id="dockSwitches" title="${this._t('switches')}">${this._icon('plug', { size: 19, cls: 'icon-switch' })}</div>
          <div class="dock-item" id="dockBattery" title="${this._t('battery')}">${this._icon('battery-full', { size: 19, cls: 'icon-battery' })}</div>
          <div class="dock-item" id="dockWeather" title="${this._t('weather')}">${this._icon('weather-partlycloudy', { size: 19, cls: 'icon-weather' })}</div>
          <div class="dock-item" id="dockSettings" title="${this._t('settings')}" style="color:var(--accent);">${this._icon('settings', { size: 19 })}</div>
        </div>

        <!-- Popup Modal Container -->
        <div class="modal-overlay hidden" id="modalContainer">
          <div class="modal-card">
            <div class="modal-header">
              <div class="modal-title" id="modalTitle">${this._t('settings')}</div>
              <button class="close-btn" id="modalCloseBtn">&times;</button>
            </div>
            <div class="modal-body" id="modalBody"></div>
          </div>
        </div>
      </div>
      `}
    `;

    // Apply active theme class immediately
    this._applyThemeClass();

    if (isSettings) {
      const cont = this.shadowRoot.getElementById('settingsPageContainer');
      if (cont) this._renderSettingsContent(cont, false);
      if (!this._standaloneConfigLoaded) {
        this._loadDashboardConfigForStandaloneSettings();
      }
      return;
    }

    // Event Listeners
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
    const navigateToSettings = () => {
      window.history.pushState(null, '', '/vision-glass/settings');
      window.dispatchEvent(new CustomEvent('location-changed'));
    };
    const dSet = this.shadowRoot.getElementById('dockSettings');
    if (dSet) dSet.addEventListener('click', navigateToSettings);
    const cSet = this.shadowRoot.getElementById('chipSettings');
    if (cSet) cSet.addEventListener('click', navigateToSettings);
    const bSet = this.shadowRoot.getElementById('btnEditBannerSettings');
    if (bSet) bSet.addEventListener('click', navigateToSettings);

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
        } else if (action === 'media') {
          const mEnt = room.media_entity || room.audio_entity || room.video_entity;
          if (mEnt) this._callService('media_player', 'media_play_pause', { entity_id: mEnt });
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


// ==========================================
// LOVELACE CARD CONFIGURATOR: <vision-glass-dashboard-editor>
// Full Visual GUI Card Editor for Vision Glass Dashboard v2.0
// Author: Adromir (https://github.com/adromir)
// ==========================================
class VisionGlassDashboardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
    this._activeTab = 'rooms'; // 'rooms' | 'overlays' | 'dock' | 'general'
    this._selectedRoomIdx = 0;
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config || {}));
    if (!this._config.rooms) this._config.rooms = [];
    if (!this._config.dock) {
      this._config.dock = {
        auto_detect: true,
        items: [
          { id: 'lighting', title: 'Beleuchtung', enabled: true, auto_hide: true },
          { id: 'climate', title: 'Heizung', enabled: true, auto_hide: true },
          { id: 'stats', title: 'Statistiken', enabled: true, auto_hide: false },
          { id: 'security', title: 'Sicherheit', enabled: true, auto_hide: false },
          { id: 'alarmo', title: 'Alarmo', enabled: true, auto_hide: true },
          { id: 'switches', title: 'Geräte', enabled: true, auto_hide: true },
          { id: 'battery', title: 'Batteriestatus', enabled: true, auto_hide: true },
          { id: 'weather', title: 'Wetter', enabled: true, auto_hide: false }
        ]
      };
    }
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._config && (this._config.mode === 'settings' || this._config.view === 'settings') && (!this._config.rooms || this._config.rooms.length === 0)) {
      this._loadMainCardConfig();
    }
    this.render();
  }

  async _loadMainCardConfig() {
    if (this._loadedMainCard || !this._hass || !this._hass.callWS) return;
    try {
      const currentDash = await this._hass.callWS({ type: 'lovelace/config', url_path: 'vision-glass', force_reload: true });
      if (currentDash && currentDash.views) {
        for (const view of currentDash.views) {
          if (view.cards) {
            const mainCard = view.cards.find(c => c.type === 'custom:vision-glass-dashboard' && c.mode !== 'settings');
            if (mainCard) {
              this._loadedMainCard = true;
              const mode = this._config.mode;
              this._config = JSON.parse(JSON.stringify(mainCard));
              this._config.mode = mode;
              this.render();
              break;
            }
          }
        }
      }
    } catch (e) {}
  }

  _fireConfigChanged() {
    const event = new CustomEvent('config-changed', {
      bubbles: true,
      composed: true,
      detail: { config: this._config }
    });
    this.dispatchEvent(event);
  }

  render() {
    if (!this.shadowRoot) return;

    const allEntities = this._hass ? Object.keys(this._hass.states).sort() : [];
    const rooms = this._config.rooms || [];
    const curRoom = rooms[this._selectedRoomIdx] || rooms[0] || null;
    const dock = this._config.dock || { auto_detect: true, items: [] };

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: var(--ha-card-header-font-family, inherit);
          color: var(--primary-text-color, #1e293b);
          padding: 8px 0;
        }
        .editor-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .nav-tabs {
          display: flex;
          gap: 6px;
          border-bottom: 1px solid var(--divider-color, #e2e8f0);
          padding-bottom: 8px;
          overflow-x: auto;
        }
        .nav-tab {
          padding: 8px 14px;
          border-radius: 8px;
          background: transparent;
          border: 1px solid transparent;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          color: var(--secondary-text-color, #64748b);
          transition: all 0.2s;
          white-space: nowrap;
        }
        .nav-tab.active {
          background: var(--primary-color, #0284c7);
          color: white;
        }
        .card-box {
          background: var(--card-background-color, #f8fafc);
          border: 1px solid var(--divider-color, #e2e8f0);
          border-radius: 12px;
          padding: 14px;
        }
        .row {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 12px;
        }
        .row-horiz {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        label {
          font-size: 12px;
          font-weight: 600;
          color: var(--secondary-text-color, #64748b);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        input[type="text"], select {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid var(--divider-color, #cbd5e1);
          background: var(--ha-card-background, #ffffff);
          color: inherit;
          font-size: 13px;
          outline: none;
          width: 100%;
          box-sizing: border-box;
        }
        input[type="text"]:focus, select:focus {
          border-color: var(--primary-color, #0284c7);
        }
        .btn {
          padding: 8px 14px;
          border-radius: 8px;
          border: 1px solid var(--divider-color, #cbd5e1);
          background: var(--ha-card-background, #ffffff);
          color: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .btn:hover {
          border-color: var(--primary-color, #0284c7);
          color: var(--primary-color, #0284c7);
        }
        .btn-primary {
          background: var(--primary-color, #0284c7);
          color: white;
          border-color: var(--primary-color, #0284c7);
        }
        .btn-primary:hover {
          background: #0369a1;
          color: white;
        }
        .btn-sm {
          padding: 4px 8px;
          font-size: 11px;
        }
        .item-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 8px;
        }
        .list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: var(--ha-card-background, #ffffff);
          border: 1px solid var(--divider-color, #e2e8f0);
          border-radius: 8px;
          gap: 8px;
        }
        .reorder-btns {
          display: flex;
          gap: 4px;
        }
        .banner {
          background: rgba(2, 132, 199, 0.08);
          border: 1px solid rgba(2, 132, 199, 0.25);
          border-radius: 10px;
          padding: 12px;
          font-size: 13px;
          line-height: 1.4;
          margin-bottom: 14px;
        }
      </style>

      <datalist id="all_entities">
        ${allEntities.map(e => `<option value="${e}"></option>`).join('')}
      </datalist>

      <div class="editor-container">
        <!-- Dedicated Settings Banner -->
        <div style="background:linear-gradient(135deg,rgba(2,132,199,0.95),rgba(79,70,229,0.95));border-radius:12px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;color:white;box-shadow:0 8px 24px rgba(0,0,0,0.25);margin-bottom:12px;">
          <div>
            <div style="font-weight:700;font-size:15px;display:flex;align-items:center;gap:8px;">
              ⚙️ Vision Glass Zentrale Konfiguration
            </div>
            <div style="font-size:12px;opacity:0.92;margin-top:4px;">
              Alle Einstellungen für Räume, Bento-Kacheln, Overlays, Farben und Navigation werden auf der dedizierten Einstellungsseite verwaltet.
            </div>
          </div>
          <button id="btnEditorOpenSettings" style="background:white;color:#0284c7;font-weight:700;border:none;padding:8px 16px;border-radius:10px;cursor:pointer;white-space:nowrap;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,0.15);">
            Zur Einstellungsseite öffnen &rarr;
          </button>
        </div>

        <!-- Quick Action Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div style="font-size:15px;font-weight:700;">Vision Glass Dashboard v2.0</div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-sm" id="btnAutoProv" title="Scannt alle HA-Räume und legt frische Bento-Karten an">🔄 Auto-Setup</button>
            <button class="btn btn-sm btn-primary" id="btnInstallTheme" title="Installiert Theme & Sonnen-Automation">🎨 Theme & Automation</button>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="nav-tabs">
          <button class="nav-tab ${this._activeTab === 'rooms' ? 'active' : ''}" data-tab="rooms">🏠 Räume & Bento-Karten (${rooms.length})</button>
          <button class="nav-tab ${this._activeTab === 'overlays' ? 'active' : ''}" data-tab="overlays">📂 Raum-Overlays (Kategorien)</button>
          <button class="nav-tab ${this._activeTab === 'dock' ? 'active' : ''}" data-tab="dock">⚓ Bottom-Leiste (Dock)</button>
          <button class="nav-tab ${this._activeTab === 'general' ? 'active' : ''}" data-tab="general">⚙️ Allgemein</button>
        </div>

        <!-- TAB 1: RÄUME & BENTO KARTEN -->
        ${this._activeTab === 'rooms' ? `
          <div class="banner">
            Hier siehst du die <strong>Bento-Raumkarten</strong> des Dashboards (automatisch synchronisiert aus Home Assistant Bereichen). Ändere die Reihenfolge frei mit [▲] [▼].
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <label>Vorhandene Räume (${rooms.length})</label>
          </div>
          <div class="item-list">
            ${rooms.map((r, rIdx) => `
              <div class="card-box" style="margin-bottom:10px;">
                <div class="row-horiz" style="margin-bottom:8px;">
                  <strong style="font-size:14px;">${r.name || r.id}</strong>
                  <div class="reorder-btns">
                    <button class="btn btn-sm btn-room-up" data-idx="${rIdx}" ${rIdx === 0 ? 'disabled' : ''}>▲</button>
                    <button class="btn btn-sm btn-room-down" data-idx="${rIdx}" ${rIdx === rooms.length - 1 ? 'disabled' : ''}>▼</button>
                  </div>
                </div>
                <!-- Read-only HA Area Badge -->
                <div style="display:flex;align-items:center;gap:12px;background:rgba(0,0,0,0.04);padding:8px 12px;border-radius:8px;margin-bottom:8px;">
                  ${r.picture ? `<img src="${r.picture}" style="width:38px;height:38px;border-radius:6px;object-fit:cover;" />` : `<div style="width:38px;height:38px;border-radius:6px;background:rgba(0,0,0,0.08);display:flex;align-items:center;justify-content:center;font-size:18px;">🏠</div>`}
                  <div style="flex:1;">
                    <div style="font-weight:700;font-size:14px;">${r.name || r.id}</div>
                    <div style="font-size:11px;color:var(--secondary-text-color,#64748b);">HA-Bereich: <code>${r.id}</code> (🔒 In HA-Bereichen verwaltet)</div>
                  </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                  <div class="row">
                    <label>Hauptlicht</label>
                    <input type="text" list="all_entities" class="room-light-input" data-idx="${rIdx}" value="${r.light_entity || ''}" placeholder="light.wohnzimmer">
                  </div>
                  <div class="row">
                    <label>Thermostat</label>
                    <input type="text" list="all_entities" class="room-climate-input" data-idx="${rIdx}" value="${r.climate_entity || ''}" placeholder="climate.thermostat">
                  </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                  <div class="row">
                    <label>Präsenz / Bewegung</label>
                    <input type="text" list="all_entities" class="room-pres-input" data-idx="${rIdx}" value="${r.presence_entity || ''}" placeholder="binary_sensor.occupied">
                  </div>
                  <div class="row">
                    <label>Fensterkontakt</label>
                    <input type="text" list="all_entities" class="room-win-input" data-idx="${rIdx}" value="${r.window_entity || ''}" placeholder="binary_sensor.fenster">
                  </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
                  <div class="row">
                    <label>Fernseher (TV)</label>
                    <input type="text" list="all_entities" class="room-tv-input" data-idx="${rIdx}" value="${r.tv_entity || ''}" placeholder="media_player.wohnzimmer_tv_2">
                  </div>
                  <div class="row">
                    <label>Videoplayer (Shield, Kodi)</label>
                    <input type="text" list="all_entities" class="room-video-input" data-idx="${rIdx}" value="${r.video_entity || ''}" placeholder="media_player.shield_android_tv">
                  </div>
                  <div class="row">
                    <label>Audioplayer (HiFi, Echo)</label>
                    <input type="text" list="all_entities" class="room-media-input" data-idx="${rIdx}" value="${r.media_entity || ''}" placeholder="media_player.echo_show">
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- TAB 2: OVERLAYS (BENUTZERDEFINIERTE KATEGORIEN) -->
        ${this._activeTab === 'overlays' ? `
          <div class="banner">
            Definiere <strong>eigene Kategorien</strong> für das Detail-Modal jedes Raums (z. B. <em>"Hauptlicht"</em>, <em>"Ambiente"</em>, <em>"Multimedia"</em>, <em>"Steckdosen"</em>) und sortiere die Entitäten frei mit Pfeiltasten!
          </div>

          <div class="row">
            <label>Raum auswählen</label>
            <select id="selectRoomOverlay">
              ${rooms.map((r, idx) => `<option value="${idx}" ${idx === this._selectedRoomIdx ? 'selected' : ''}>${r.name || r.id}</option>`).join('')}
            </select>
          </div>

          ${curRoom ? `
            <div style="display:flex;justify-content:space-between;align-items:center;margin:12px 0 8px 0;">
              <strong style="font-size:14px;">Kategorien in ${curRoom.name || curRoom.id}</strong>
              <button class="btn btn-sm btn-primary" id="btnAddCategory">+ Neue Kategorie</button>
            </div>

            <div class="item-list">
              ${(curRoom.overlay_categories || []).map((cat, cIdx) => `
                <div class="card-box" style="margin-bottom:10px;">
                  <div class="row-horiz" style="margin-bottom:8px;">
                    <div style="display:flex;align-items:center;gap:8px;flex:1;">
                      <input type="text" class="cat-name-input" data-cidx="${cIdx}" value="${cat.name || ''}" placeholder="Kategoriename (z.B. Beleuchtung)" style="font-weight:700;max-width:200px;">
                      <input type="text" class="cat-icon-input" data-cidx="${cIdx}" value="${cat.icon || ''}" placeholder="ci:light-cove-strip" style="max-width:140px;">
                    </div>
                    <div class="reorder-btns">
                      <button class="btn btn-sm btn-cat-up" data-cidx="${cIdx}" ${cIdx === 0 ? 'disabled' : ''}>▲</button>
                      <button class="btn btn-sm btn-cat-down" data-cidx="${cIdx}" ${cIdx === (curRoom.overlay_categories.length - 1) ? 'disabled' : ''}>▼</button>
                      <button class="btn btn-sm btn-cat-del" data-cidx="${cIdx}" style="color:#ef4444;">✕</button>
                    </div>
                  </div>

                  <div class="item-list" style="margin:8px 0;">
                    ${(cat.entities || []).map((eId, eIdx) => `
                      <div class="list-item" style="padding:6px 10px;">
                        <span style="font-size:12px;font-family:monospace;">${eId}</span>
                        <div class="reorder-btns">
                          <button class="btn btn-sm btn-ent-up" data-cidx="${cIdx}" data-eidx="${eIdx}" ${eIdx === 0 ? 'disabled' : ''}>▲</button>
                          <button class="btn btn-sm btn-ent-down" data-cidx="${cIdx}" data-eidx="${eIdx}" ${eIdx === (cat.entities.length - 1) ? 'disabled' : ''}>▼</button>
                          <button class="btn btn-sm btn-ent-del" data-cidx="${cIdx}" data-eidx="${eIdx}" style="color:#ef4444;">✕</button>
                        </div>
                      </div>
                    `).join('')}
                  </div>

                  <div style="display:flex;gap:6px;margin-top:8px;">
                    <input type="text" list="all_entities" class="new-ent-input" data-cidx="${cIdx}" placeholder="Entität hinzufügen (z.B. light.tv_ambilight)">
                    <button class="btn btn-sm btn-add-ent-to-cat" data-cidx="${cIdx}">+ Hinzufügen</button>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : '<div style="color:var(--secondary-text-color);">Kein Raum vorhanden.</div>'}
        ` : ''}

        <!-- TAB 3: BOTTOM-LEISTE (DOCK) -->
        ${this._activeTab === 'dock' ? `
          <div class="banner">
            Die Bottom-Leiste blendet inaktive Standard-Buttons automatisch aus (z.B. wenn kein Alarmo oder keine Lichter installiert sind). Hier kannst du auch <strong>komplett eigene Dock-Bereiche</strong> (z.B. Kameras, Garten, Szenen) anlegen!
          </div>

          <div class="card-box" style="margin-bottom:12px;">
            <label class="row-horiz" style="cursor:pointer;font-size:13px;text-transform:none;">
              <span>Automatische Erkennung aktivieren (Inaktive Buttons automatisch ausblenden)</span>
              <input type="checkbox" id="chkAutoDetect" ${dock.auto_detect !== false ? 'checked' : ''}>
            </label>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <label>Dock-Elemente & Eigene Bereiche</label>
            <button class="btn btn-sm btn-primary" id="btnAddDockItem">+ Eigenen Bereich hinzufügen</button>
          </div>

          <div class="item-list">
            ${(dock.items || []).map((item, dIdx) => `
              <div class="card-box" style="margin-bottom:8px;">
                <div class="row-horiz">
                  <div style="display:flex;align-items:center;gap:8px;flex:1;">
                    <input type="checkbox" class="chk-dock-item" data-didx="${dIdx}" ${item.enabled !== false ? 'checked' : ''}>
                    <input type="text" class="dock-title-input" data-didx="${dIdx}" value="${item.title || item.id}" style="font-weight:600;max-width:160px;">
                    <input type="text" class="dock-icon-input" data-didx="${dIdx}" value="${item.icon || ''}" placeholder="Icon (z.B. ci:washing-machine-spin)" style="max-width:160px;">
                  </div>
                  <div class="reorder-btns">
                    <button class="btn btn-sm btn-dock-up" data-didx="${dIdx}" ${dIdx === 0 ? 'disabled' : ''}>▲</button>
                    <button class="btn btn-sm btn-dock-down" data-didx="${dIdx}" ${dIdx === (dock.items.length - 1) ? 'disabled' : ''}>▼</button>
                    ${item.is_custom ? `<button class="btn btn-sm btn-dock-del" data-didx="${dIdx}" style="color:#ef4444;">✕</button>` : ''}
                  </div>
                </div>

                ${item.is_custom ? `
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
                    <div class="row">
                      <label>Aktionstyp</label>
                      <select class="dock-type-select" data-didx="${dIdx}">
                        <option value="modal" ${item.type === 'modal' ? 'selected' : ''}>Modal-Overlay</option>
                        <option value="navigate" ${item.type === 'navigate' ? 'selected' : ''}>Dashboard-Link</option>
                        <option value="service" ${item.type === 'service' ? 'selected' : ''}>Service / Skript</option>
                      </select>
                    </div>
                    <div class="row">
                      <label>${item.type === 'navigate' ? 'Ziel-Pfad' : (item.type === 'service' ? 'Service Name' : 'Hinweis')}</label>
                      ${item.type === 'navigate' ? `
                        <input type="text" class="dock-path-input" data-didx="${dIdx}" value="${item.navigation_path || ''}" placeholder="/lovelace/energy">
                      ` : (item.type === 'service' ? `
                        <input type="text" class="dock-srv-input" data-didx="${dIdx}" value="${item.service || ''}" placeholder="script.gute_nacht">
                      ` : `
                        <span style="font-size:12px;color:var(--secondary-text-color);padding-top:8px;">Öffnet eigenes Glass-Modal</span>
                      `)}
                    </div>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- TAB 4: ALLGEMEIN -->
        ${this._activeTab === 'general' ? `
          <div class="card-box">
            <div class="row">
              <label>Dashboard Titel</label>
              <div style="font-size:13px;font-weight:600;padding:8px 12px;background:var(--card-background-color,#f8fafc);border-radius:8px;border:1px solid var(--divider-color,#cbd5e1);display:flex;align-items:center;justify-content:space-between;">
                <span>Smart Home Zentrale</span>
                <span style="font-size:11px;color:var(--secondary-text-color,#64748b);">🌐 Automatisch lokalisiert</span>
              </div>
            </div>
            <div class="row">
              <label>Wetter-Entität</label>
              <input type="text" list="all_entities" id="cfgWeather" value="${this._config.weather_entity || ''}" placeholder="weather.hannover_hannover">
            </div>
            <div class="row">
              <label>Wohnungsschloss-Entität</label>
              <input type="text" list="all_entities" id="cfgLock" value="${this._config.lock_entity || ''}" placeholder="lock.wohnungsschloss">
            </div>
            <div class="row">
              <label>Alle Lichter Gruppe</label>
              <input type="text" list="all_entities" id="cfgAllLights" value="${this._config.all_lights_entity || ''}" placeholder="light.licht_wohnung">
            </div>
            <div class="row">
              <label>Hintergrund-Farbschema-Zuordnung</label>
              <select id="cfgEditorBgMode">
                <option value="auto" ${(this._config.background_mode || 'auto') === 'auto' ? 'selected' : ''}>Automatisch (nach Preset & Sonne)</option>
                <option value="dark" ${this._config.background_mode === 'dark' ? 'selected' : ''}>Dunkles Farbschema (Helle Schrift & Glas)</option>
                <option value="light" ${this._config.background_mode === 'light' ? 'selected' : ''}>Helles Farbschema (Dunkle Schrift & Glas)</option>
              </select>
            </div>
            <div class="row">
              <label>Farbschema für Schriften, Modal & Pillen</label>
              <select id="cfgEditorColorScheme">
                <option value="auto" ${(this._config.color_scheme || 'auto') === 'auto' ? 'selected' : ''}>Standard (Passend zum Hintergrund)</option>
                <option value="neon_cyan" ${this._config.color_scheme === 'neon_cyan' ? 'selected' : ''}>Cosmic Neon (Cyan & Sapphire)</option>
                <option value="warm_amber" ${this._config.color_scheme === 'warm_amber' ? 'selected' : ''}>Sunset Warm (Bernstein & Terracotta)</option>
                <option value="emerald_mint" ${this._config.color_scheme === 'emerald_mint' ? 'selected' : ''}>Emerald Mint (Smaragd & Mint)</option>
                <option value="monochrome_frosted" ${this._config.color_scheme === 'monochrome_frosted' ? 'selected' : ''}>Monochrome Glass (Neutral)</option>
                <option value="high_contrast_light" ${this._config.color_scheme === 'high_contrast_light' ? 'selected' : ''}>High Contrast Light (Tageslicht)</option>
                <option value="custom" ${this._config.color_scheme === 'custom' ? 'selected' : ''}>Benutzerdefiniert (Eigene Farben)</option>
              </select>
            </div>
            <div class="row-horiz" style="margin-top:12px;">
              <label style="cursor:pointer;font-size:13px;text-transform:none;">
                <span>Automatischer Tag/Nacht-Wechsel (Sonnenstand)</span>
                <input type="checkbox" id="chkDayNight" ${this._config.auto_day_night !== false ? 'checked' : ''}>
              </label>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    this._bindEditorEvents();
  }

  _bindEditorEvents() {
    // Tab switching
    this.shadowRoot.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this._activeTab = tab.getAttribute('data-tab');
        this.render();
      });
    });

    // Auto-Provisioning Button
    const btnAuto = this.shadowRoot.getElementById('btnAutoProv');
    if (btnAuto) {
      btnAuto.addEventListener('click', () => {
        if (confirm('Möchtest du das Dashboard wirklich anhand aller vorhandenen Home Assistant Räume und Entitäten neu aufbauen?')) {
          this._config._initialized = false;
          this._config.auto_provision = true;
          this._fireConfigChanged();
          alert('Auto-Provisioning ausgelöst! Das Dashboard generiert sich neu.');
        }
      });
    }

    // Install Theme Button
    const btnTheme = this.shadowRoot.getElementById('btnInstallTheme');
    if (btnTheme) {
      btnTheme.addEventListener('click', () => {
        if (this._hass) {
          try {
            this._hass.callService('frontend', 'set_theme', { name: 'Vision Glass Light' });
          } catch (e) {}
        }
        alert('Vision Glass Theme & Tag/Nacht-Automation stehen bereit! Die Themes befinden sich in /themes/vision_glass.yaml und die Automation in /automations/day_night_switch.yaml.');
      });
    }

    // Tab 1: Room Reordering & Editing
    this.shadowRoot.querySelectorAll('.btn-room-up').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        if (idx > 0) {
          const temp = this._config.rooms[idx];
          this._config.rooms[idx] = this._config.rooms[idx - 1];
          this._config.rooms[idx - 1] = temp;
          this._fireConfigChanged();
          this.render();
        }
      });
    });

    this.shadowRoot.querySelectorAll('.btn-room-down').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        if (idx < this._config.rooms.length - 1) {
          const temp = this._config.rooms[idx];
          this._config.rooms[idx] = this._config.rooms[idx + 1];
          this._config.rooms[idx + 1] = temp;
          this._fireConfigChanged();
          this.render();
        }
      });
    });

    // Dedicated Settings redirect
    const btnEdSet = this.shadowRoot.getElementById('btnEditorOpenSettings');
    if (btnEdSet) {
      btnEdSet.addEventListener('click', () => {
        window.history.pushState(null, '', '/vision-glass/settings');
        window.dispatchEvent(new CustomEvent('location-changed'));
        const dlg = this.closest('ha-dialog, mwc-dialog');
        if (dlg && dlg.close) dlg.close();
      });
    }

    // Room input fields
    this.shadowRoot.querySelectorAll('.room-light-input').forEach(i => {
      i.addEventListener('change', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'));
        this._config.rooms[idx].light_entity = e.target.value;
        this._fireConfigChanged();
      });
    });
    this.shadowRoot.querySelectorAll('.room-climate-input').forEach(i => {
      i.addEventListener('change', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'));
        this._config.rooms[idx].climate_entity = e.target.value;
        this._fireConfigChanged();
      });
    });
    this.shadowRoot.querySelectorAll('.room-pres-input').forEach(i => {
      i.addEventListener('change', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'));
        this._config.rooms[idx].presence_entity = e.target.value;
        this._fireConfigChanged();
      });
    });
    this.shadowRoot.querySelectorAll('.room-win-input').forEach(i => {
      i.addEventListener('change', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'));
        this._config.rooms[idx].window_entity = e.target.value;
        this._fireConfigChanged();
      });
    });
    this.shadowRoot.querySelectorAll('.room-tv-input').forEach(i => {
      i.addEventListener('change', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'));
        this._config.rooms[idx].tv_entity = e.target.value;
        this._fireConfigChanged();
      });
    });
    this.shadowRoot.querySelectorAll('.room-video-input').forEach(i => {
      i.addEventListener('change', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'));
        this._config.rooms[idx].video_entity = e.target.value;
        this._fireConfigChanged();
      });
    });
    this.shadowRoot.querySelectorAll('.room-media-input').forEach(i => {
      i.addEventListener('change', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'));
        this._config.rooms[idx].media_entity = e.target.value;
        this._fireConfigChanged();
      });
    });

    // Tab 2: Overlays & Categories
    const selRoom = this.shadowRoot.getElementById('selectRoomOverlay');
    if (selRoom) {
      selRoom.addEventListener('change', (e) => {
        this._selectedRoomIdx = parseInt(e.target.value);
        this.render();
      });
    }

    const btnAddCat = this.shadowRoot.getElementById('btnAddCategory');
    if (btnAddCat) {
      btnAddCat.addEventListener('click', () => {
        const r = this._config.rooms[this._selectedRoomIdx];
        if (!r) return;
        if (!r.overlay_categories) r.overlay_categories = [];
        r.overlay_categories.push({
          id: 'cat_' + Date.now(),
          name: 'Neue Kategorie',
          icon: 'ci:light-cove-strip',
          entities: []
        });
        this._fireConfigChanged();
        this.render();
      });
    }

    this.shadowRoot.querySelectorAll('.cat-name-input').forEach(i => {
      i.addEventListener('change', (e) => {
        const cIdx = parseInt(e.target.getAttribute('data-cidx'));
        const r = this._config.rooms[this._selectedRoomIdx];
        if (r && r.overlay_categories && r.overlay_categories[cIdx]) {
          r.overlay_categories[cIdx].name = e.target.value;
          this._fireConfigChanged();
        }
      });
    });

    this.shadowRoot.querySelectorAll('.cat-icon-input').forEach(i => {
      i.addEventListener('change', (e) => {
        const cIdx = parseInt(e.target.getAttribute('data-cidx'));
        const r = this._config.rooms[this._selectedRoomIdx];
        if (r && r.overlay_categories && r.overlay_categories[cIdx]) {
          r.overlay_categories[cIdx].icon = e.target.value;
          this._fireConfigChanged();
        }
      });
    });

    this.shadowRoot.querySelectorAll('.btn-cat-up').forEach(btn => {
      btn.addEventListener('click', () => {
        const cIdx = parseInt(btn.getAttribute('data-cidx'));
        const r = this._config.rooms[this._selectedRoomIdx];
        if (r && r.overlay_categories && cIdx > 0) {
          const temp = r.overlay_categories[cIdx];
          r.overlay_categories[cIdx] = r.overlay_categories[cIdx - 1];
          r.overlay_categories[cIdx - 1] = temp;
          this._fireConfigChanged();
          this.render();
        }
      });
    });

    this.shadowRoot.querySelectorAll('.btn-cat-down').forEach(btn => {
      btn.addEventListener('click', () => {
        const cIdx = parseInt(btn.getAttribute('data-cidx'));
        const r = this._config.rooms[this._selectedRoomIdx];
        if (r && r.overlay_categories && cIdx < r.overlay_categories.length - 1) {
          const temp = r.overlay_categories[cIdx];
          r.overlay_categories[cIdx] = r.overlay_categories[cIdx + 1];
          r.overlay_categories[cIdx + 1] = temp;
          this._fireConfigChanged();
          this.render();
        }
      });
    });

    this.shadowRoot.querySelectorAll('.btn-cat-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const cIdx = parseInt(btn.getAttribute('data-cidx'));
        const r = this._config.rooms[this._selectedRoomIdx];
        if (r && r.overlay_categories && confirm('Kategorie wirklich löschen?')) {
          r.overlay_categories.splice(cIdx, 1);
          this._fireConfigChanged();
          this.render();
        }
      });
    });

    // Entity Reordering inside Categories
    this.shadowRoot.querySelectorAll('.btn-ent-up').forEach(btn => {
      btn.addEventListener('click', () => {
        const cIdx = parseInt(btn.getAttribute('data-cidx'));
        const eIdx = parseInt(btn.getAttribute('data-eidx'));
        const r = this._config.rooms[this._selectedRoomIdx];
        const cat = r && r.overlay_categories && r.overlay_categories[cIdx];
        if (cat && eIdx > 0) {
          const temp = cat.entities[eIdx];
          cat.entities[eIdx] = cat.entities[eIdx - 1];
          cat.entities[eIdx - 1] = temp;
          this._fireConfigChanged();
          this.render();
        }
      });
    });

    this.shadowRoot.querySelectorAll('.btn-ent-down').forEach(btn => {
      btn.addEventListener('click', () => {
        const cIdx = parseInt(btn.getAttribute('data-cidx'));
        const eIdx = parseInt(btn.getAttribute('data-eidx'));
        const r = this._config.rooms[this._selectedRoomIdx];
        const cat = r && r.overlay_categories && r.overlay_categories[cIdx];
        if (cat && eIdx < cat.entities.length - 1) {
          const temp = cat.entities[eIdx];
          cat.entities[eIdx] = cat.entities[eIdx + 1];
          cat.entities[eIdx + 1] = temp;
          this._fireConfigChanged();
          this.render();
        }
      });
    });

    this.shadowRoot.querySelectorAll('.btn-ent-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const cIdx = parseInt(btn.getAttribute('data-cidx'));
        const eIdx = parseInt(btn.getAttribute('data-eidx'));
        const r = this._config.rooms[this._selectedRoomIdx];
        const cat = r && r.overlay_categories && r.overlay_categories[cIdx];
        if (cat) {
          cat.entities.splice(eIdx, 1);
          this._fireConfigChanged();
          this.render();
        }
      });
    });

    this.shadowRoot.querySelectorAll('.btn-add-ent-to-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        const cIdx = parseInt(btn.getAttribute('data-cidx'));
        const input = this.shadowRoot.querySelector(`.new-ent-input[data-cidx="${cIdx}"]`);
        const val = input ? input.value.trim() : '';
        const r = this._config.rooms[this._selectedRoomIdx];
        const cat = r && r.overlay_categories && r.overlay_categories[cIdx];
        if (cat && val) {
          if (!cat.entities) cat.entities = [];
          if (!cat.entities.includes(val)) {
            cat.entities.push(val);
            this._fireConfigChanged();
            this.render();
          }
        }
      });
    });

    // Tab 3: Bottom Dock Events
    const chkAuto = this.shadowRoot.getElementById('chkAutoDetect');
    if (chkAuto) {
      chkAuto.addEventListener('change', (e) => {
        this._config.dock.auto_detect = e.target.checked;
        this._fireConfigChanged();
      });
    }

    const btnAddDock = this.shadowRoot.getElementById('btnAddDockItem');
    if (btnAddDock) {
      btnAddDock.addEventListener('click', () => {
        if (!this._config.dock.items) this._config.dock.items = [];
        this._config.dock.items.push({
          id: 'custom_' + Date.now(),
          title: 'Neuer Bereich',
          icon: 'ci:smartwatch-charging',
          is_custom: true,
          enabled: true,
          type: 'modal',
          overlay_categories: []
        });
        this._fireConfigChanged();
        this.render();
      });
    }

    this.shadowRoot.querySelectorAll('.chk-dock-item').forEach(i => {
      i.addEventListener('change', (e) => {
        const dIdx = parseInt(e.target.getAttribute('data-didx'));
        this._config.dock.items[dIdx].enabled = e.target.checked;
        this._fireConfigChanged();
      });
    });

    this.shadowRoot.querySelectorAll('.dock-title-input').forEach(i => {
      i.addEventListener('change', (e) => {
        const dIdx = parseInt(e.target.getAttribute('data-didx'));
        this._config.dock.items[dIdx].title = e.target.value;
        this._fireConfigChanged();
      });
    });

    this.shadowRoot.querySelectorAll('.dock-icon-input').forEach(i => {
      i.addEventListener('change', (e) => {
        const dIdx = parseInt(e.target.getAttribute('data-didx'));
        this._config.dock.items[dIdx].icon = e.target.value;
        this._fireConfigChanged();
      });
    });

    this.shadowRoot.querySelectorAll('.dock-type-select').forEach(i => {
      i.addEventListener('change', (e) => {
        const dIdx = parseInt(e.target.getAttribute('data-didx'));
        this._config.dock.items[dIdx].type = e.target.value;
        this._fireConfigChanged();
        this.render();
      });
    });

    this.shadowRoot.querySelectorAll('.dock-path-input').forEach(i => {
      i.addEventListener('change', (e) => {
        const dIdx = parseInt(e.target.getAttribute('data-didx'));
        this._config.dock.items[dIdx].navigation_path = e.target.value;
        this._fireConfigChanged();
      });
    });

    this.shadowRoot.querySelectorAll('.dock-srv-input').forEach(i => {
      i.addEventListener('change', (e) => {
        const dIdx = parseInt(e.target.getAttribute('data-didx'));
        this._config.dock.items[dIdx].service = e.target.value;
        this._fireConfigChanged();
      });
    });

    this.shadowRoot.querySelectorAll('.btn-dock-up').forEach(btn => {
      btn.addEventListener('click', () => {
        const dIdx = parseInt(btn.getAttribute('data-didx'));
        if (dIdx > 0) {
          const temp = this._config.dock.items[dIdx];
          this._config.dock.items[dIdx] = this._config.dock.items[dIdx - 1];
          this._config.dock.items[dIdx - 1] = temp;
          this._fireConfigChanged();
          this.render();
        }
      });
    });

    this.shadowRoot.querySelectorAll('.btn-dock-down').forEach(btn => {
      btn.addEventListener('click', () => {
        const dIdx = parseInt(btn.getAttribute('data-didx'));
        if (dIdx < this._config.dock.items.length - 1) {
          const temp = this._config.dock.items[dIdx];
          this._config.dock.items[dIdx] = this._config.dock.items[dIdx + 1];
          this._config.dock.items[dIdx + 1] = temp;
          this._fireConfigChanged();
          this.render();
        }
      });
    });

    this.shadowRoot.querySelectorAll('.btn-dock-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const dIdx = parseInt(btn.getAttribute('data-didx'));
        if (confirm('Diesen Dock-Bereich löschen?')) {
          this._config.dock.items.splice(dIdx, 1);
          this._fireConfigChanged();
          this.render();
        }
      });
    });

    // Tab 4: General inputs
    delete this._config.title;
    const cfgW = this.shadowRoot.getElementById('cfgWeather');
    if (cfgW) cfgW.addEventListener('change', (e) => { this._config.weather_entity = e.target.value; this._fireConfigChanged(); });
    const cfgL = this.shadowRoot.getElementById('cfgLock');
    if (cfgL) cfgL.addEventListener('change', (e) => { this._config.lock_entity = e.target.value; this._fireConfigChanged(); });
    const cfgA = this.shadowRoot.getElementById('cfgAllLights');
    if (cfgA) cfgA.addEventListener('change', (e) => { this._config.all_lights_entity = e.target.value; this._fireConfigChanged(); });
    const cfgBM = this.shadowRoot.getElementById('cfgEditorBgMode');
    if (cfgBM) cfgBM.addEventListener('change', (e) => { this._config.background_mode = e.target.value; this._fireConfigChanged(); });
    const cfgCS = this.shadowRoot.getElementById('cfgEditorColorScheme');
    if (cfgCS) cfgCS.addEventListener('change', (e) => { this._config.color_scheme = e.target.value; this._fireConfigChanged(); });
    const chkDN = this.shadowRoot.getElementById('chkDayNight');
    if (chkDN) chkDN.addEventListener('change', (e) => { this._config.auto_day_night = e.target.checked; this._fireConfigChanged(); });
  }
}

customElements.define('vision-glass-dashboard-editor', VisionGlassDashboardEditor);

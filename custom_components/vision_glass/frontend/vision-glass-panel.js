import { I18N } from './i18n.js';
import { VISION_GLASS_STYLES } from './styles.js';
import { ICONS, renderIcon, getWeatherIcon, resolveEntityIcon, getBuiltinDockIcon } from './icons.js';
import { tactileMethods } from './tactile-controls.js';
import { modalMethods } from './modals.js';

class VisionGlassPanel extends HTMLElement {
  static get I18N() {
    return I18N;
  }

  static get ICONS() {
    return ICONS;
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
    this._narrow = false;
    this._panel = null;
    this._route = null;
    const initHash = (typeof window !== 'undefined' && window.location.hash) || '';
    this._viewMode = (initHash === '#settings') ? 'settings' : (initHash === '#stats' ? 'stats' : 'home');
    this._activeModal = null;
    this._timer = null;
    this._initialRenderDone = false;
    this._configLoaded = false;
    this._configLoading = false;
    this._summary = null;
    this._discovery = null;
    this._discoveryPromise = null;
    this._settingsModLoaded = false;
    this._statsChartsMod = null;
    this._statsModPromise = null;
    this._alarmoCode = '';
    this._batteryFilter = 'all';
    this._tempHistory = {};
    this._historyFetched = false;
    this._hourlyForecast = [];
    this._dailyForecast = [];
    this._forecastSubscribed = false;
    this._statsTab = 'temperature';
    this._statsRoom = null;
    this._statsHistory = {};
    this._statsHistoryFetched = false;
    this._roomEntitiesCache = {};
    this._updateRaf = null;
  }

  set panel(val) {
    this._panel = val;
  }

  set route(val) {
    this._route = val;
    const p = val?.path || '';
    const hash = (typeof window !== 'undefined' && window.location.hash) || '';
    let nextMode = 'home';
    if (p === '/settings' || hash === '#settings') {
      nextMode = 'settings';
    } else if (p === '/stats' || hash === '#stats') {
      nextMode = 'stats';
    }
    if (nextMode !== this._viewMode) {
      this._viewMode = nextMode;
      if (this._configLoaded) this._render();
    }
  }

  set narrow(val) {
    this._narrow = Boolean(val);
    const btn = this.shadowRoot?.getElementById('vgSidebarToggle');
    if (btn) btn.classList.toggle('visible', this._narrow);
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._configLoaded && !this._configLoading && hass) {
      this._loadBackendConfig();
      return;
    }
    if (!this._initialRenderDone) return;
    if (this._viewMode === 'settings' || this._viewMode === 'stats') {
      this._applyThemeClass();
      return;
    }
    if (this._updateRaf) return;
    this._updateRaf = requestAnimationFrame(() => {
      this._updateRaf = null;
      this._updateAll();
    });
  }

  async _loadBackendConfig() {
    if (!this._hass || !this._hass.callWS) return;
    this._configLoading = true;
    try {
      const res = await this._hass.callWS({ type: 'vision_glass/config/get' });
      this._config = (res && res.config) ? res.config : { rooms: [], dock: { auto_detect: true, items: [] } };
      this._summary = (res && res.summary) ? res.summary : null;
      this._configLoaded = true;
      this._initialRenderDone = true;
      this._render();
      if (this._viewMode !== 'settings') {
        this._updateAll();
      }
      this._ensureDiscovery();
    } catch (err) {
      console.error('[VisionGlass] Failed to load backend configuration:', err);
    } finally {
      this._configLoading = false;
    }
  }

  async _ensureDiscovery() {
    if (this._discovery) return this._discovery;
    if (this._discoveryPromise) return this._discoveryPromise;
    if (!this._hass || !this._hass.callWS) return null;

    this._discoveryPromise = this._hass.callWS({ type: 'vision_glass/discovery/rooms' })
      .then((res) => {
        this._discovery = res;
        return res;
      })
      .catch((err) => {
        console.warn('[VisionGlass] Area discovery warning:', err);
        return null;
      });
    return this._discoveryPromise;
  }

  _moduleSuffix() {
    const bid = this._panel?.config?.build_id;
    return bid ? `?v=${encodeURIComponent(bid)}` : '';
  }

  async _loadSettingsModule() {
    if (this._settingsModLoaded) return;
    const mod = await import(`./settings-view.js${this._moduleSuffix()}`);
    Object.assign(VisionGlassPanel.prototype, mod.settingsMethods);
    this._settingsModLoaded = true;
  }

  async _loadStatsModule() {
    if (this._statsChartsMod) return this._statsChartsMod;
    if (this._statsModPromise) return this._statsModPromise;
    this._statsModPromise = import(`./stats-charts.js${this._moduleSuffix()}`).then((mod) => {
      this._statsChartsMod = mod;
      return mod;
    });
    return this._statsModPromise;
  }

  _setViewMode(mode) {
    if (mode === 'settings') {
      this._viewMode = 'settings';
    } else if (mode === 'stats') {
      this._viewMode = 'stats';
    } else {
      this._viewMode = 'home';
    }
    if (typeof window !== 'undefined') {
      const targetHash = this._viewMode === 'home' ? '' : `#${this._viewMode}`;
      if (window.location.hash !== targetHash) {
        window.history.replaceState(null, '', window.location.pathname + targetHash);
      }
    }
    this._render();
    if (this._viewMode === 'home' && this._hass) {
      this._updateAll();
    }
  }

  _icon(name, opts) {
    return renderIcon(name, opts);
  }

  _getWeatherIcon(state, size = 24, cls = '') {
    return getWeatherIcon(state, size, cls);
  }

  _resolveEntityIcon(entityId, stateObj) {
    return resolveEntityIcon(entityId, stateObj);
  }

  _getBuiltinDockIcon(id, size = 19) {
    return getBuiltinDockIcon(id, size);
  }

  _getWeatherEntity() {
    if (this._config?.weather_entity && this._hass?.states?.[this._config.weather_entity]) {
      return this._config.weather_entity;
    }
    return this._hass?.states ? Object.keys(this._hass.states).find(e => e.startsWith('weather.')) : null;
  }

  _getAlarmEntity() {
    if (this._config?.alarm_entity && this._hass?.states?.[this._config.alarm_entity]) {
      return this._config.alarm_entity;
    }
    return this._hass?.states ? Object.keys(this._hass.states).find(e => e.startsWith('alarm_control_panel.')) : null;
  }

  _getLockEntity() {
    if (this._config?.lock_entity && this._hass?.states?.[this._config.lock_entity]) {
      return this._config.lock_entity;
    }
    return this._hass?.states ? Object.keys(this._hass.states).find(e => e.startsWith('lock.')) : null;
  }

  _getDoorEntity() {
    if (this._config?.door_entity && this._hass?.states?.[this._config.door_entity]) {
      return this._config.door_entity;
    }
    if (!this._hass?.states) return null;
    return Object.keys(this._hass.states).find(e => {
      if (!e.startsWith('binary_sensor.')) return false;
      const dc = (this._hass.states[e].attributes?.device_class || '').toLowerCase();
      return dc === 'door' && (e.includes('haustur') || e.includes('front') || e.includes('entrance') || e.includes('eingang'));
    }) || Object.keys(this._hass.states).find(e => e.startsWith('binary_sensor.') && this._hass.states[e].attributes?.device_class === 'door') || null;
  }

  _fallbackSvgCurve(currentVal) {
    const c = parseFloat(currentVal) || 21.0;
    return {
      pathD: 'M 0 35 L 290 25',
      areaD: 'M 0 35 L 290 25 L 290 55 L 0 55 Z',
      lastPt: { x: 290, y: 25 },
      min: (c - 0.5).toFixed(1).replace('.', ','),
      max: (c + 0.5).toFixed(1).replace('.', ',')
    };
  }

  async _saveDashboardConfig(newCardConfig) {
    const toast = this.shadowRoot?.getElementById('settingsToast');
    const saveBtn = this.shadowRoot?.getElementById('btnSaveSettingsModal') || this.shadowRoot?.getElementById('btnSaveSettingsView');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = this._t('saving');
    }

    try {
      const payload = JSON.parse(JSON.stringify(newCardConfig));
      delete payload.mode;
      delete payload.view;
      if (this._hass && this._hass.callWS) {
        const res = await this._hass.callWS({ type: 'vision_glass/config/save', config: payload });
        this._config = res?.config || payload;
        if (res?.summary) this._summary = res.summary;
      } else {
        this._config = payload;
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

  async _syncAreas() {
    if (!this._hass || !this._hass.callWS) return { updatedCount: 0, discoveredCount: 0, total: 0 };
    try {
      const res = await this._hass.callWS({ type: 'vision_glass/discovery/sync' });
      if (res && res.config) {
        this._config = res.config;
        this._discovery = null;
        this._discoveryPromise = null;
        await this._ensureDiscovery();
        this._render();
      }
      return {
        updatedCount: res?.updated_count || 0,
        discoveredCount: res?.added_count || 0,
        total: res?.total || (this._config?.rooms?.length || 0)
      };
    } catch (err) {
      console.error('[VisionGlass] Area sync failed:', err);
      return { updatedCount: 0, discoveredCount: 0, total: 0 };
    }
  }

  connectedCallback() {
    this._startClock();
    try {
      localStorage.setItem('defaultPanel', JSON.stringify('vision-glass'));
    } catch (_) {}
    if (this._hass && this._hass.connection && !this._unsubConfigEvents) {
      this._hass.connection.subscribeEvents(
        () => {
          console.debug('[VisionGlass] Real-time area update event received. Refreshing backend config...');
          this._loadBackendConfig();
        },
        'vision_glass_config_updated'
      ).then((unsub) => {
        this._unsubConfigEvents = unsub;
      }).catch(() => {});
    }
  }

  disconnectedCallback() {
    if (this._timer) clearInterval(this._timer);
    const unsubEvents = this._unsubConfigEvents;
    if (unsubEvents) {
      try { unsubEvents(); } catch (_) {}
      this._unsubConfigEvents = null;
    }
    if (this._routeChangeHandler && typeof window !== 'undefined') {
      window.removeEventListener('location-changed', this._routeChangeHandler);
      window.removeEventListener('popstate', this._routeChangeHandler);
      this._routeChangeHandler = null;
    }
    // Clean up any legacy shell styles if previously injected
    try {
      const ha = document.querySelector('home-assistant');
      const main = ha?.shadowRoot?.querySelector('home-assistant-main');
      const sidebar = main?.shadowRoot?.querySelector('ha-sidebar');
      sidebar?.shadowRoot?.getElementById('vg-shell-sidebar-style')?.remove();
    } catch (e) {}
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
    return (I18N[lang] && I18N[lang][key]) ||
           (I18N['de'] && I18N['de'][key]) ||
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

    // 4. Active theme name from HA themes or Theme Switch Engine sensor
    const activeTheme = (this._hass && this._hass.themes && this._hass.themes.theme) ||
                        (this._hass && this._hass.selectedTheme && this._hass.selectedTheme.theme) ||
                        (this._hass && this._hass.states && this._hass.states['sensor.active_theme'] && this._hass.states['sensor.active_theme'].state) || '';
    if (typeof activeTheme === 'string' && activeTheme) {
      const lower = activeTheme.toLowerCase();
      if (lower === 'default' || lower === 'home assistant') {
        const sensorVariant = this._hass && this._hass.states && this._hass.states['sensor.active_theme'] && (
          this._hass.states['sensor.active_theme'].attributes?.variant ||
          this._hass.states['sensor.active_theme'].attributes?.day_night_variant
        );
        if (sensorVariant === 'light') return 'light';
        if (sensorVariant === 'dark') return 'dark';
        if (this._hass && this._hass.themes && typeof this._hass.themes.darkMode === 'boolean') {
          return this._hass.themes.darkMode ? 'dark' : 'light';
        }
        return this._isDaytime() ? 'light' : 'dark';
      }
      if (lower.includes('light') || lower.includes('hell') || lower.includes('day') || lower.includes('tag')) {
        return 'light';
      }
      if (lower.includes('dark') || lower.includes('dunkel') || lower.includes('night') || lower.includes('nacht')) {
        return 'dark';
      }
    }

    // 5. Inspect computed primary text color (if dark text is used in HA, it's a light theme)
    try {
      const computedColor = (typeof getComputedStyle === 'function') ? (
        getComputedStyle(document.body).getPropertyValue('--primary-text-color') ||
        getComputedStyle(this).getPropertyValue('--primary-text-color')
      ) : '';
      if (computedColor) {
        const trimmed = computedColor.trim();
        if (trimmed.startsWith('#')) {
          let hex = trimmed.slice(1);
          if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
          if (hex.length >= 6) {
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            return lum < 140 ? 'light' : 'dark';
          }
        }
        const match = trimmed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
          const lum = 0.299 * parseInt(match[1], 10) + 0.587 * parseInt(match[2], 10) + 0.114 * parseInt(match[3], 10);
          return lum < 140 ? 'light' : 'dark';
        }
      }
    } catch (_) {}

    // 6. HA dark mode or Sun daylight fallback
    if (this._hass && this._hass.themes && typeof this._hass.themes.darkMode === 'boolean') {
      return this._hass.themes.darkMode ? 'dark' : 'light';
    }
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

    // Default Home Assistant Theme detection
    const activeTheme = (this._hass && this._hass.themes && this._hass.themes.theme) ||
                        (this._hass && this._hass.selectedTheme && this._hass.selectedTheme.theme) ||
                        (this._hass && this._hass.states && this._hass.states['sensor.active_theme'] && this._hass.states['sensor.active_theme'].state) || '';
    const isDefaultTheme = String(activeTheme).toLowerCase() === 'default' || String(activeTheme).toLowerCase() === 'home assistant';
    if (isDefaultTheme) {
      root.classList.add('theme-default');
    } else {
      root.classList.remove('theme-default');
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
        chipWeather.innerHTML = `<span class="chip-dot dot-blue"></span> ${this._getWeatherIcon(w.state, 15, 'icon-weather')} ${this._hass?.config?.location_name || w.attributes?.friendly_name || ''} ${temp}°C`;
      }

      // Sidebar Weather Mini Pills
      const sidebarMiniHum = this.shadowRoot.getElementById('sidebarMiniHum');
      if (sidebarMiniHum && a.humidity != null) sidebarMiniHum.innerHTML = `${this._icon('droplet', { size: 13, cls: 'icon-humidity', style: 'margin-right:3px;' })} ${a.humidity}%`;
      const sidebarMiniWind = this.shadowRoot.getElementById('sidebarMiniWind');
      if (sidebarMiniWind && a.wind_speed != null) sidebarMiniWind.innerHTML = `${this._icon('wind', { size: 13, cls: 'icon-weather', style: 'margin-right:3px;' })} ${a.wind_speed} km/h`;
      const sunObj = this._hass.states['sun.sun'];
      const sidebarMiniSun = this.shadowRoot.getElementById('sidebarMiniSun');
      if (sidebarMiniSun && sunObj && sunObj.attributes) {
        const rising = sunObj.attributes.next_rising ? new Date(sunObj.attributes.next_rising) : null;
        const setting = sunObj.attributes.next_setting ? new Date(sunObj.attributes.next_setting) : null;
        let nextSunDate = null;
        let isSunrise = false;
        if (rising && setting) {
          if (rising < setting) { nextSunDate = rising; isSunrise = true; }
          else { nextSunDate = setting; isSunrise = false; }
        } else if (rising) { nextSunDate = rising; isSunrise = true; }
        else if (setting) { nextSunDate = setting; isSunrise = false; }

        if (nextSunDate) {
          const iconName = isSunrise ? 'sunrise' : 'sunset';
          const label = isSunrise ? this._t('sunrise') : this._t('sunset');
          sidebarMiniSun.setAttribute('title', `${label}: ${nextSunDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`);
          sidebarMiniSun.innerHTML = `${this._icon(iconName, { size: 13, cls: 'icon-light', style: 'margin-right:3px;' })} ${nextSunDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
        }
      }

      // Sidebar Alarm / Wecker detection & display
      let nextAlarmTime = null;
      let alarmLabel = 'Wecker';
      let alarmActive = false;

      const weckerBool = this._hass.states['input_boolean.wecker_aktiviert'];
      const weckerTime = this._hass.states['input_datetime.wecker_zeit'];
      if (weckerBool && weckerBool.state === 'on' && weckerTime && weckerTime.state) {
        alarmActive = true;
        const parts = weckerTime.state.split(':');
        nextAlarmTime = `${parts[0]}:${parts[1]}`;
      }

      if (!alarmActive) {
        const nowMs = Date.now();
        let earliestDate = null;
        Object.keys(this._hass.states).forEach(eId => {
          if (eId.includes('next_alarm') || eId.includes('nachster_wecker')) {
            const s = this._hass.states[eId];
            if (s && s.state && s.state !== 'unavailable' && s.state !== 'unknown') {
              const d = new Date(s.state);
              if (!isNaN(d.getTime()) && d.getTime() > nowMs) {
                if (!earliestDate || d < earliestDate) {
                  earliestDate = d;
                  alarmLabel = (s.attributes && s.attributes.friendly_name) ? s.attributes.friendly_name.replace(/next alarm/i, '').replace(/nächster wecker/i, '').trim() : 'Wecker';
                }
              }
            }
          }
        });
        if (earliestDate) {
          alarmActive = true;
          nextAlarmTime = earliestDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
        }
      }

      const sidebarMiniAlarm = this.shadowRoot.getElementById('sidebarMiniAlarm');
      if (sidebarMiniAlarm) {
        if (alarmActive && nextAlarmTime) {
          sidebarMiniAlarm.style.display = 'inline-flex';
          sidebarMiniAlarm.setAttribute('title', `${alarmLabel}: ${nextAlarmTime} (Klicken zum Umschalten)`);
          sidebarMiniAlarm.innerHTML = `${this._icon('alarm', { size: 13, color: '#f59e0b', style: 'margin-right:3px;' })} ${nextAlarmTime}`;
          sidebarMiniAlarm.onclick = () => {
            if (this._hass.states['input_boolean.wecker_aktiviert']) {
              this._callService('input_boolean', 'toggle', { entity_id: 'input_boolean.wecker_aktiviert' });
            }
          };
        } else if (weckerBool && weckerTime) {
          sidebarMiniAlarm.style.display = 'inline-flex';
          sidebarMiniAlarm.setAttribute('title', 'Wecker aus (Klicken zum Aktivieren)');
          sidebarMiniAlarm.innerHTML = `${this._icon('alarm', { size: 13, style: 'opacity:0.45;margin-right:3px;' })} Aus`;
          sidebarMiniAlarm.onclick = () => {
            this._callService('input_boolean', 'turn_on', { entity_id: 'input_boolean.wecker_aktiviert' });
          };
        } else {
          sidebarMiniAlarm.style.display = 'none';
        }
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
      const lockEntId = this._getLockEntity();
    const lockS = lockEntId ? this._hass.states[lockEntId] : null;
      const isLocked = lockS && lockS.state === 'locked';

      glanceEl.innerHTML = `
        <span class="sidebar-mini-pill" style="cursor:pointer;display:inline-flex;align-items:center;gap:4px;" id="glanceLights" title="${this._t('lighting')}">${this._icon('light', { size: 13, cls: 'icon-light' })} ${lightsOn} ${this._t('on')}</span>
        <span class="sidebar-mini-pill" style="cursor:pointer;display:inline-flex;align-items:center;gap:4px;${windowsOpen > 0 ? 'color:#f59e0b;font-weight:700;' : ''}" id="glanceWindows" title="${this._t('security')}">${windowsOpen > 0 ? `${this._icon('window-open', { size: 13, cls: 'icon-climate' })} ${windowsOpen} ${this._t('windows_open_count')}` : `${this._icon('window', { size: 13, cls: 'icon-security' })} ${this._t('windows_all_closed')}`}</span>
        <span class="sidebar-mini-pill" style="cursor:pointer;display:inline-flex;align-items:center;gap:4px;" id="glanceLock" title="${this._t('lock')}">${isLocked ? `${this._icon('lock-closed', { size: 13, cls: 'icon-security' })} ${this._t('door_locked_short')}` : `${this._icon('lock-open', { size: 13, cls: 'icon-light' })} ${this._t('door_unlocked_short')}`}</span>
      `;
      const openDockOrModal = (id) => {
        const item = (this._config?.dock?.items || []).find(i => i.id === id);
        if (item && item.entities && item.entities.length > 0) {
          this._openCustomDockModal(item);
        } else {
          this._openModal(id);
        }
      };
      const gL = glanceEl.querySelector('#glanceLights');
      if (gL) gL.onclick = (e) => { e.stopPropagation(); openDockOrModal('lighting'); };
      const gW = glanceEl.querySelector('#glanceWindows');
      if (gW) gW.onclick = (e) => { e.stopPropagation(); openDockOrModal('security'); };
      const gLo = glanceEl.querySelector('#glanceLock');
      if (gLo) gLo.onclick = (e) => { e.stopPropagation(); openDockOrModal('security'); };
    }

    // 3. Update Chips
    // Persons Chips (Dynamically rendered for all or configured persons)
    const personsContainer = this.shadowRoot.getElementById('chipsPersonsList');
    if (personsContainer) {
      if (this._config.top_bar_show_persons === false) {
        personsContainer.innerHTML = '';
      } else {
        const configuredPersons = this._config?.top_bar_persons;
        const allPersonIds = Object.keys(this._hass.states).filter(e => e.startsWith('person.'));
        const activePersonIds = (Array.isArray(configuredPersons) && configuredPersons.length > 0)
          ? configuredPersons.filter(id => this._hass.states[id])
          : allPersonIds;

        if (activePersonIds.length === 0) {
          personsContainer.innerHTML = '';
        } else {
          let homeCount = 0;
          const personData = activePersonIds.map(pId => {
            const pState = this._hass.states[pId];
            const isHome = pState && pState.state === 'home';
            if (isHome) homeCount++;
            const name = pState?.attributes?.friendly_name || pId.replace('person.', '');
            const pic = pState?.attributes?.entity_picture;
            const statusText = isHome
              ? this._t('home')
              : (pState ? (pState.state === 'not_home' ? this._t('away') : pState.state) : this._t('unknown'));
            return { id: pId, name, pic, isHome, statusText };
          });

          let summaryLabel = '';
          if (homeCount === personData.length) {
            summaryLabel = personData.length === 1 ? '1 daheim' : `${personData.length} daheim`;
          } else if (homeCount === 0) {
            summaryLabel = 'Niemand daheim';
          } else {
            summaryLabel = `${homeCount}/${personData.length} daheim`;
          }

          const personsKey = personData.map(p => `${p.id}:${p.isHome}:${p.statusText}:${p.pic || ''}`).join('|') + `|${summaryLabel}`;
          if (this._lastPersonsKey !== personsKey || !personsContainer.querySelector('#chipPersonsCluster')) {
            this._lastPersonsKey = personsKey;
            personsContainer.innerHTML = `
              <div class="chip chip-persons-cluster" id="chipPersonsCluster" title="Anwesenheit (${summaryLabel})">
                <!-- Inline layout anchor: flex width never changes -->
                <div class="cluster-anchor">
                  <div class="cluster-stack">
                    ${personData.map((p, idx) => `
                      <div class="cluster-avatar-wrap" style="--stack-idx: ${idx}; z-index: ${personData.length - idx};" data-person-id="${p.id}" title="${p.name}: ${p.statusText}">
                        ${p.pic
                          ? `<img src="${p.pic}" class="cluster-avatar ${p.isHome ? 'avatar-online' : 'avatar-offline'}" alt="${p.name}" />`
                          : `<div class="cluster-avatar cluster-avatar-initial ${p.isHome ? 'avatar-online' : 'avatar-offline'}">${p.name.charAt(0).toUpperCase()}</div>`
                        }
                        <span class="cluster-status-dot ${p.isHome ? 'dot-green' : 'dot-gray'}"></span>
                      </div>
                    `).join('')}
                  </div>
                  <div class="cluster-collapsed-label">${summaryLabel}</div>
                </div>

                <!-- Floating overlay flyout: absolute, zero footprint in flex flow, ZERO jitter -->
                <div class="cluster-floating-overlay">
                  <div class="cluster-stack cluster-stack-fanned">
                    ${personData.map((p, idx) => `
                      <div class="cluster-avatar-wrap" style="--stack-idx: ${idx}; z-index: ${personData.length - idx};" data-person-id="${p.id}" title="${p.name}: ${p.statusText}">
                        ${p.pic
                          ? `<img src="${p.pic}" class="cluster-avatar ${p.isHome ? 'avatar-online' : 'avatar-offline'}" alt="${p.name}" />`
                          : `<div class="cluster-avatar cluster-avatar-initial ${p.isHome ? 'avatar-online' : 'avatar-offline'}">${p.name.charAt(0).toUpperCase()}</div>`
                        }
                        <span class="cluster-status-dot ${p.isHome ? 'dot-green' : 'dot-gray'}"></span>
                      </div>
                    `).join('')}
                  </div>
                  <div class="cluster-expanded-list">
                    ${personData.map(p => `
                      <div class="cluster-expanded-item" data-person-id="${p.id}" title="${p.name} Details öffnen">
                        <span class="cluster-dot ${p.isHome ? 'dot-green' : 'dot-gray'}"></span>
                        <span class="cluster-user-name">${p.name}</span>
                        <span class="cluster-user-status">(${p.statusText})</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
            `;

            personsContainer.querySelectorAll('[data-person-id]').forEach(el => {
              el.onclick = (e) => {
                e.stopPropagation();
                const pId = el.getAttribute('data-person-id');
                if (pId) this._openPersonModal(pId);
              };
            });
          }
        }
      }
    }

    // Custom Chips
    const customChipsContainer = this.shadowRoot.getElementById('chipsCustomList');
    if (customChipsContainer) {
      const customChips = this._config?.top_bar_custom_chips || [];
      customChipsContainer.innerHTML = customChips.map((c, cIdx) => {
        const s = this._hass.states[c.entity_id];
        if (!s) return '';
        const name = c.name || s.attributes?.friendly_name || c.entity_id;
        const val = s.state + (s.attributes?.unit_of_measurement ? ' ' + s.attributes.unit_of_measurement : '');
        return `
          <div class="chip chip-custom" data-entity-id="${c.entity_id}" title="${name}">
            <span style="display:inline-flex;align-items:center;">${this._icon(c.icon || 'star', { size: 14, style: 'margin-right:4px;' })}</span>
            <span>${name}: <strong>${val}</strong></span>
          </div>
        `;
      }).join('');
      customChipsContainer.querySelectorAll('.chip-custom[data-entity-id]').forEach(chip => {
        chip.onclick = () => {
          const eId = chip.getAttribute('data-entity-id');
          this._fireMoreInfo(eId);
        };
      });
    }

    // Lights Chip (Counts only individual rooms, strictly excluding Wohnung aggregate)
    const chipLights = this.shadowRoot.getElementById('chipLights');
    if (chipLights) {
      if (this._config.top_bar_show_lights === false) {
        chipLights.style.display = 'none';
      } else {
        chipLights.style.display = 'inline-flex';
        let activeLightsCount = 0;
        this._config.rooms.forEach(r => {
          if (r.id === 'wohnung' || r.light_entity === 'light.licht_wohnung' || r.light_entity === this._config.all_lights_entity) return;
          if (r.light_entity && this._hass.states[r.light_entity] && this._hass.states[r.light_entity].state === 'on') {
            activeLightsCount++;
          }
        });
        if (activeLightsCount > 0) {
          const lightText = activeLightsCount === 1 ? this._t('light_on_single') : this._t('lights_on_multi');
          chipLights.innerHTML = `<span class="chip-dot dot-amber"></span> ${this._icon('light', { size: 14, cls: 'icon-light', style: 'margin-right:4px;' })} ${activeLightsCount} ${lightText}`;
        } else {
          chipLights.innerHTML = `<span class="chip-dot dot-gray"></span> ${this._icon('light', { size: 14, style: 'margin-right:4px;' })} ${this._t('lights_off')}`;
        }
      }
    }

    // Warning / DWD / NINA Chip
    const chipWarning = this.shadowRoot.getElementById('chipWarning');
    if (chipWarning) {
      let activeWarning = null;
      if (this._config.top_bar_show_warnings !== false) {
        Object.keys(this._hass.states).forEach(eId => {
          if (eId.startsWith('binary_sensor.warning_') || eId.startsWith('sensor.region_') || eId.includes('dwd_weather_warnings') || eId.includes('nina')) {
            const s = this._hass.states[eId];
            if (s && ((s.state === 'on') || (!isNaN(parseInt(s.state)) && parseInt(s.state) > 0))) {
              activeWarning = s.attributes?.headline || s.attributes?.event || s.attributes?.description || s.attributes?.friendly_name || 'Amtliche Warnung!';
            }
          }
        });
      }
      if (activeWarning) {
        chipWarning.style.display = 'inline-flex';
        chipWarning.innerHTML = `<span class="chip-dot" style="background:#ef4444;box-shadow:0 0 8px #ef4444;"></span> ${this._icon('alert-circle', { size: 14, color: '#ef4444', style: 'margin-right:4px;' })} ${activeWarning}`;
      } else {
        chipWarning.style.display = 'none';
      }
    }

    // Media Playing Chip
    const chipMedia = this.shadowRoot.getElementById('chipMedia');
    if (chipMedia) {
      let playingPlayer = null;
      if (this._config.top_bar_show_media !== false) {
        Object.keys(this._hass.states).forEach(eId => {
          if (eId.startsWith('media_player.')) {
            const s = this._hass.states[eId];
            if (s && s.state === 'playing') {
              playingPlayer = s;
            }
          }
        });
      }
      if (playingPlayer) {
        chipMedia.style.display = 'inline-flex';
        const title = playingPlayer.attributes?.media_title || playingPlayer.attributes?.friendly_name || 'Musik';
        chipMedia.innerHTML = `<span class="chip-dot dot-blue" style="background:#a855f7;box-shadow:0 0 8px #a855f7;"></span> <ha-icon icon="mdi:music" style="--mdc-icon-size:14px;margin-right:3px;vertical-align:middle;"></ha-icon> ${title}`;
      } else {
        chipMedia.style.display = 'none';
      }
    }

    // Climate Chip (calculate active heating radiators & average temperature)
    const chipClimate = this.shadowRoot.getElementById('chipClimate');
    if (chipClimate) {
      if (this._config.top_bar_show_climate === false) {
        chipClimate.style.display = 'none';
      } else {
        chipClimate.style.display = 'inline-flex';
        const climateIds = (this._config.rooms || [])
          .map(r => r.climate_entity)
          .filter(Boolean);
        let temps = [];
        let heatingCount = 0;
        climateIds.forEach(cid => {
          const cs = this._hass.states[cid];
          if (cs && cs.attributes) {
            if (cs.attributes.current_temperature != null) {
              temps.push(parseFloat(cs.attributes.current_temperature));
            }
            const isHeating = cs.attributes.hvac_action === 'heating' || cs.attributes.call_for_heat === true || (cs.attributes.heating_power && cs.attributes.heating_power > 0.05);
            if (isHeating) heatingCount++;
          }
        });
        const avgT = temps.length > 0 ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1).replace('.', ',') : '21,0';
        if (heatingCount > 0) {
          const heatVerb = heatingCount === 1 ? this._t('heating_single') : this._t('heating_multi');
          chipClimate.innerHTML = `<span class="chip-dot dot-amber" style="background:#f59e0b;box-shadow:0 0 8px #f59e0b;"></span> ${this._icon('flame', { size: 14, color: '#f59e0b', cls: 'pulsing-flame', style: 'margin-right:4px;' })} ${heatingCount} ${heatVerb} • Ø ${avgT}°C`;
        } else {
          chipClimate.innerHTML = `<span class="chip-dot dot-blue"></span> ${this._icon('climate', { size: 14, cls: 'icon-climate', style: 'margin-right:4px;' })} ${this._t('all_eco') || 'Alle Eco'} • Ø ${avgT}°C`;
        }
      }
    }

    // Lock & Door Chip (3 states)
    const lockEntity = this._config.lock_entity || 'lock.wohnungsschloss';
    const chipLock = this.shadowRoot.getElementById('chipLock');
    if (chipLock) {
      if (this._config.top_bar_show_lock === false) {
        chipLock.style.display = 'none';
      } else {
        chipLock.style.display = 'inline-flex';
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
    }

    // Alarmo Chip
    const chipAlarmo = this.shadowRoot.getElementById('chipAlarmo');
    if (chipAlarmo) {
      const alEnt = this._getAlarmEntity();
      const al = alEnt ? this._hass.states[alEnt] : null;
      if (this._config.top_bar_show_alarmo === false || !al) {
        chipAlarmo.style.display = 'none';
      } else {
        chipAlarmo.style.display = 'inline-flex';
        const ast = al.state || 'disarmed';
        if (ast === 'disarmed') {
          chipAlarmo.innerHTML = `<span class="chip-dot dot-green"></span> ${this._icon('shield-check', { size: 14, cls: 'icon-security', style: 'margin-right:4px;' })} ${this._t('alarmo')}: ${this._t('deactivated')}`;
        } else if (ast === 'triggered') {
          chipAlarmo.innerHTML = `<span class="chip-dot dot-amber"></span> ${this._icon('siren', { size: 14, cls: 'icon-temp', style: 'margin-right:4px;' })} ${this._t('alarmo')}: ${this._t('alarm_triggered')}`;
        } else {
          chipAlarmo.innerHTML = `<span class="chip-dot dot-blue"></span> ${this._icon('shield', { size: 14, cls: 'icon-alarmo', style: 'margin-right:4px;' })} ${this._t('alarmo')}: ${this._t('armed_away')}`;
        }
      }
    }

    // Weather Chip
    const chipWeather = this.shadowRoot.getElementById('chipWeather');
    if (chipWeather) {
      if (this._config.top_bar_show_weather === false) {
        chipWeather.style.display = 'none';
      } else {
        chipWeather.style.display = 'inline-flex';
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
      } else if (this._activeModal === 'devices_helpers' || (typeof this._activeModal === 'object' && this._activeModal?.type === 'devices_helpers')) {
        this._syncDevicesModalStates();
      } else if (this._activeModal === 'stats') {
        // preserve stats modal without re-render flicker
      } else if (this._activeModal.type === 'person') {
        this._renderPersonModal(this._activeModal.targetEntityId);
      } else if (this._activeModal.type === 'room') {
        this._updateRoomModalValues();
      }
    }
  }

  _getRoomBentoActions(room) {
    const stdDefaults = [
      { type: 'light', enabled: Boolean(room?.light_entity && room.light_entity.trim()), title: this._t('toggle_light') || 'Licht', icon: 'mdi:lightbulb', entity_id: room?.light_entity || '' },
      { type: 'climate', enabled: Boolean(room?.climate_entity && room.climate_entity.trim()), title: this._t('open_climate') || 'Heizung', icon: 'mdi:thermometer', entity_id: room?.climate_entity || '' },
      { type: 'media', enabled: Boolean((room?.media_entity && room.media_entity.trim()) || (room?.audio_entity && room.audio_entity.trim()) || (room?.video_entity && room.video_entity.trim())), title: this._t('toggle_media') || 'Medien', icon: 'mdi:music', entity_id: room?.media_entity || room?.audio_entity || room?.video_entity || '' },
      { type: 'lock', enabled: Boolean(room?.lock_entity && room.lock_entity.trim()), title: this._t('toggle_lock') || 'Schloss', icon: 'mdi:lock', entity_id: room?.lock_entity || '' },
      { type: 'devices_helpers', enabled: true, title: this._t('devices_and_helpers') || 'Geräte & Helfer', icon: 'mdi:tune-vertical', entity_id: '' }
    ];

    if (!Array.isArray(room?.bento_actions) || room.bento_actions.length === 0) {
      return stdDefaults;
    }

    const acts = room.bento_actions.filter(a => a.type !== 'switch');
    const result = [];
    stdDefaults.forEach(def => {
      const existing = acts.find(a => a.type === def.type);
      if (existing) {
        result.push({
          ...def,
          ...existing,
          icon: existing.icon || def.icon,
          title: existing.title || def.title,
          entity_id: (existing.entity_id !== undefined && existing.entity_id !== null) ? existing.entity_id : def.entity_id
        });
      } else {
        result.push({ ...def });
      }
    });

    acts.filter(a => a.type === 'custom').forEach(ca => {
      result.push(ca);
    });

    return result;
  }

  _getRoomBentoBadges(room) {
    if (!room) return [];
    if (Array.isArray(room.bento_badges)) {
      return room.bento_badges;
    }
    if (this._config && Array.isArray(this._config.bento_badges) && this._config.bento_badges.length > 0) {
      const matching = this._config.bento_badges.filter(b => (!b.rooms || b.rooms.includes('all') || b.rooms.includes(room.id)));
      if (matching.length > 0) return matching;
    }
    const badges = [];
    if (room.temp_entity || room.climate_entity) {
      badges.push({
        id: 'badge_temp',
        name: 'Temperatur',
        icon: 'mdi:thermometer',
        entity_id: room.temp_entity || (room.climate_entity || '')
      });
    }
    if (room.humidity_entity) {
      badges.push({
        id: 'badge_humidity',
        name: 'Luftfeuchtigkeit',
        icon: 'mdi:water-percent',
        entity_id: room.humidity_entity
      });
    }
    if (room.illuminance_entity) {
      badges.push({
        id: 'badge_lux',
        name: 'Helligkeit',
        icon: 'mdi:brightness-6',
        entity_id: room.illuminance_entity
      });
    }
    return badges;
  }

  _getEffectiveBentoBadges() {
    if (this._config && Array.isArray(this._config.bento_badges) && this._config.bento_badges.length > 0) {
      return this._config.bento_badges;
    }
    return [
      {
        id: 'badge_temp',
        name: 'Temperatur',
        entity_prop: 'temp_entity',
        icon: 'thermometer',
        icon_color_light: '#ea580c',
        icon_color_dark: '#fb923c',
        bg_light: 'rgba(234, 88, 12, 0.16)',
        border_light: 'rgba(234, 88, 12, 0.45)',
        hover_light: 'rgba(234, 88, 12, 0.28)',
        bg_dark: 'rgba(251, 146, 60, 0.18)',
        border_dark: 'rgba(251, 146, 60, 0.45)',
        hover_dark: 'rgba(251, 146, 60, 0.35)',
        rooms: ['all']
      },
      {
        id: 'badge_humidity',
        name: 'Luftfeuchtigkeit',
        entity_prop: 'humidity_entity',
        icon: 'droplet',
        icon_color_light: '#0284c7',
        icon_color_dark: '#38bdf8',
        bg_light: 'rgba(2, 132, 199, 0.16)',
        border_light: 'rgba(2, 132, 199, 0.45)',
        hover_light: 'rgba(2, 132, 199, 0.28)',
        bg_dark: 'rgba(56, 189, 248, 0.18)',
        border_dark: 'rgba(56, 189, 248, 0.45)',
        hover_dark: 'rgba(56, 189, 248, 0.35)',
        rooms: ['all']
      },
      {
        id: 'badge_lux',
        name: 'Helligkeit',
        entity_prop: 'illuminance_entity',
        icon: 'lux',
        icon_color_light: '#d97706',
        icon_color_dark: '#f59e0b',
        bg_light: 'rgba(217, 119, 6, 0.16)',
        border_light: 'rgba(217, 119, 6, 0.45)',
        hover_light: 'rgba(217, 119, 6, 0.28)',
        bg_dark: 'rgba(245, 158, 11, 0.18)',
        border_dark: 'rgba(245, 158, 11, 0.45)',
        hover_dark: 'rgba(245, 158, 11, 0.35)',
        rooms: ['all']
      }
    ];
  }

  _resolveBentoBadgeValue(badge, room) {
    if (!this._hass) return null;
    let entityId = badge.entity_id;
    if (!entityId && badge.entity_prop && badge.entity_prop !== 'custom') {
      entityId = room[badge.entity_prop];
    }
    if (!entityId && (badge.id === 'badge_temp' || badge.id === 'temp')) {
      entityId = room.temp_entity;
    }
    if (!entityId && (badge.id === 'badge_temp' || badge.id === 'temp') && room.climate_entity && this._hass.states[room.climate_entity]) {
      const cObj = this._hass.states[room.climate_entity];
      const curTemp = cObj.attributes?.current_temperature ?? cObj.attributes?.temperature;
      if (curTemp != null && !isNaN(parseFloat(curTemp))) {
        return { text: `${parseFloat(curTemp).toFixed(1)}°C`, entityId: room.climate_entity, isAlert: false, iconName: 'mdi:thermometer' };
      }
    }
    if (!entityId || typeof entityId !== 'string' || !entityId.trim()) return null;
    const s = this._hass.states[entityId.trim()];
    if (!s || s.state === 'unavailable' || s.state === 'unknown') return null;

    const devClass = (s.attributes?.device_class || '').toLowerCase();
    const unit = s.attributes?.unit_of_measurement || '';
    const lang = this._getLang();
    let displayVal = s.state;
    let isAlert = false;
    let dynamicIcon = null;

    if (!isNaN(parseFloat(s.state))) {
      const num = parseFloat(s.state);
      if (unit === '°C' || unit === '°F' || badge.id === 'badge_temp' || badge.id === 'temp' || badge.entity_prop === 'temp_entity') {
        displayVal = `${num.toFixed(1)}${unit || '°C'}`;
      } else if (unit === '%' || badge.id === 'badge_humidity' || badge.id === 'humidity' || badge.entity_prop === 'humidity_entity') {
        displayVal = `${Math.round(num)}%`;
      } else if (unit === 'lx' || badge.id === 'badge_lux' || badge.id === 'lux' || badge.entity_prop === 'illuminance_entity') {
        displayVal = `${Math.round(num)} lx`;
      } else {
        displayVal = `${num} ${unit}`.trim();
      }
      if (devClass === 'battery' && num < 15) {
        isAlert = true;
      }
    } else {
      const st = String(s.state).toLowerCase();
      if (devClass === 'window' || devClass === 'door' || devClass === 'garage_door' || devClass === 'opening') {
        if (st === 'on' || st === 'open') {
          isAlert = true;
          displayVal = lang === 'en' ? 'Open' : (lang === 'id' ? 'Terbuka' : 'Offen');
          dynamicIcon = devClass === 'window' ? 'mdi:window-open-variant' : 'mdi:door-open';
        } else {
          displayVal = lang === 'en' ? 'Closed' : (lang === 'id' ? 'Tertutup' : 'Zu');
          dynamicIcon = devClass === 'window' ? 'mdi:window-closed-variant' : 'mdi:door-closed';
        }
      } else if (devClass === 'motion' || devClass === 'occupancy' || devClass === 'presence') {
        if (st === 'on' || st === 'detected') {
          isAlert = true;
          displayVal = lang === 'en' ? 'Occupied' : (lang === 'id' ? 'Terisi' : 'Belegt');
          dynamicIcon = 'mdi:motion-sensor';
        } else {
          displayVal = lang === 'en' ? 'Clear' : (lang === 'id' ? 'Kosong' : 'Frei');
          dynamicIcon = 'mdi:motion-sensor-off';
        }
      } else if (devClass === 'lock') {
        if (st === 'locked') {
          displayVal = lang === 'en' ? 'Locked' : (lang === 'id' ? 'Terkunci' : 'Zu');
          dynamicIcon = 'mdi:lock';
        } else {
          isAlert = true;
          displayVal = lang === 'en' ? 'Unlocked' : (lang === 'id' ? 'Tidak terkunci' : 'Offen');
          dynamicIcon = 'mdi:lock-open-variant';
        }
      } else if (devClass === 'moisture') {
        if (st === 'on' || st === 'wet') {
          isAlert = true;
          displayVal = lang === 'en' ? 'Wet' : (lang === 'id' ? 'Basah' : 'Nass');
          dynamicIcon = 'mdi:water-alert';
        } else {
          displayVal = lang === 'en' ? 'Dry' : (lang === 'id' ? 'Kering' : 'Trocken');
          dynamicIcon = 'mdi:water-check';
        }
      } else if (devClass === 'smoke' || devClass === 'gas' || devClass === 'problem' || devClass === 'safety') {
        if (st === 'on' || st === 'problem') {
          isAlert = true;
          displayVal = 'Alarm';
          dynamicIcon = 'mdi:alert-circle';
        } else {
          displayVal = 'OK';
          dynamicIcon = 'mdi:check-circle';
        }
      } else if (st === 'on') {
        displayVal = lang === 'en' ? 'On' : (lang === 'id' ? 'Nyala' : 'An');
        isAlert = true;
      } else if (st === 'off') {
        displayVal = lang === 'en' ? 'Off' : (lang === 'id' ? 'Mati' : 'Aus');
      }
    }

    let finalIcon = dynamicIcon;
    if (!finalIcon && badge.icon && badge.icon.trim()) {
      finalIcon = badge.icon.trim();
    }
    if (!finalIcon && s.attributes?.icon) {
      finalIcon = s.attributes.icon;
    }
    if (!finalIcon) {
      finalIcon = 'mdi:chart-box-outline';
    }

    return { text: displayVal, entityId: entityId.trim(), isAlert, iconName: finalIcon };
  }

  _updateRoomCard(room, idx) {
    const card = this.shadowRoot.getElementById(`roomCard_${idx}`);
    if (!card) return;

    // Configurable Bento Badges
    const badgesForRoom = this._getRoomBentoBadges(room);
    const envBar = card.querySelector('.room-env-bar');

    if (envBar) {
      // Remove any pills for badges that are no longer assigned to this room
      envBar.querySelectorAll('.bento-badge-pill').forEach(pill => {
        const bId = pill.id.replace(`badge_${idx}_`, '');
        if (!badgesForRoom.some((b, bIdx) => String(b.id || bIdx) === bId)) {
          pill.remove();
        }
      });

      badgesForRoom.forEach((b, bIdx) => {
        const bId = b.id || bIdx;
        let bEl = card.querySelector(`#badge_${idx}_${bId}`);
        const valObj = this._resolveBentoBadgeValue(b, room);
        if (valObj && valObj.text) {
          if (!bEl) {
            bEl = document.createElement('span');
            bEl.className = 'env-pill bento-badge-pill';
            bEl.id = `badge_${idx}_${bId}`;
            const battWarn = envBar.querySelector('.env-batt-warn');
            if (battWarn) envBar.insertBefore(bEl, battWarn);
            else envBar.appendChild(bEl);
          }
          const iconName = valObj.iconName || ((b.icon && b.icon.includes(':')) ? b.icon : (MDI_ICON_MAP[b.icon] || (b.icon ? 'mdi:' + b.icon : 'mdi:chart-box-outline')));
          bEl.innerHTML = `${this._icon(iconName, { size: 11, style: 'margin-right:3px;' })} <span>${valObj.text}</span>`;
          bEl.style.display = 'inline-flex';
          bEl.title = `${b.name || 'Badge'}: ${valObj.text}`;
          if (valObj.isAlert) {
            bEl.classList.add('badge-alert');
            bEl.style.borderColor = 'rgba(245,158,11,0.55)';
            bEl.style.background = 'rgba(245,158,11,0.18)';
            bEl.style.color = '#fbbf24';
            bEl.style.fontWeight = '700';
          } else {
            bEl.classList.remove('badge-alert');
            bEl.style.borderColor = '';
            bEl.style.background = '';
            bEl.style.color = '';
            bEl.style.fontWeight = '';
          }
        } else if (bEl) {
          bEl.remove();
        }
      });
    }

    // 4. Battery warning (< 10%) on Bento Card
    let battWarnEl = card.querySelector('.env-batt-warn');
    if (!battWarnEl) {
      const envBar = card.querySelector('.room-env-bar');
      if (envBar) {
        battWarnEl = document.createElement('span');
        battWarnEl.className = 'env-pill env-batt-warn badge-battery-warn';
        battWarnEl.style.cssText = 'background:rgba(239,68,68,0.22);border:1px solid rgba(239,68,68,0.55);color:#ef4444;font-size:11px;font-weight:700;padding:2px 8px;border-radius:12px;display:none;align-items:center;gap:3px;';
        envBar.appendChild(battWarnEl);
      }
    }
    if (battWarnEl) {
      const roomEntities = [
        room.temp_entity, room.target_temp_entity, room.climate_entity,
        room.humidity_entity, room.illuminance_entity, room.light_entity,
        room.media_entity, room.switch_entity, room.presence_entity, room.window_entity,
        ...(room.overlay_categories ? room.overlay_categories.flatMap(c => c.entities || []) : [])
      ].filter(Boolean);

      let lowestBatt = null;
      roomEntities.forEach(eId => {
        const s = this._hass.states[eId];
        if (s) {
          const val = s.attributes?.battery_level ?? s.attributes?.battery ?? (s.attributes?.device_class === 'battery' ? parseFloat(s.state) : null);
          if (val != null && !isNaN(val)) {
            if (lowestBatt == null || val < lowestBatt) lowestBatt = val;
          }
        }
      });

      if (lowestBatt != null && lowestBatt < 10) {
        battWarnEl.innerHTML = `${this._icon('battery-critical', { size: 11, color: '#ef4444' })} ${Math.round(lowestBatt)}%`;
        battWarnEl.style.display = 'inline-flex';
        battWarnEl.title = `Batterie kritisch: ${Math.round(lowestBatt)}%`;
      } else {
        battWarnEl.style.display = 'none';
      }
    }

    // 5. Quick Target Temp Stepper
    const targetValEl = card.querySelector(`#targetTemp_${idx}`);
    const stepperEl = card.querySelector('.quick-climate-stepper');
    if (targetValEl && room.climate_entity && this._hass.states[room.climate_entity]) {
      const cObj = this._hass.states[room.climate_entity];
      let targetTemp = cObj.attributes.temperature != null ? parseFloat(cObj.attributes.temperature) : 21.0;
      const isHeating = cObj.attributes.hvac_action === 'heating' || cObj.attributes.call_for_heat === true || (cObj.attributes.heating_power && cObj.attributes.heating_power > 0.05);
      const isWindowOpen = cObj.attributes.window_open === true || (room.window_entity && this._hass.states[room.window_entity]?.state === 'on');

      if (isWindowOpen) {
        targetValEl.innerHTML = `${targetTemp.toFixed(1)}° <span title="Fenster offen (Heizpause)" style="display:inline-flex;align-items:center;vertical-align:middle;"><ha-icon icon="mdi:window-open-variant" style="--mdc-icon-size:12px;color:#ef4444;"></ha-icon></span>`;
      } else {
        targetValEl.textContent = `${targetTemp.toFixed(1)}°`;
      }

      if (stepperEl) {
        if (isHeating) {
          stepperEl.style.boxShadow = '0 0 14px rgba(245,158,11,0.35)';
          stepperEl.style.borderColor = 'rgba(245,158,11,0.6)';
        } else {
          stepperEl.style.boxShadow = '';
          stepperEl.style.borderColor = '';
        }
      }
    }

    // Subtitle / Status (bereinigt: kein "Bereit", kein "Licht an", kein "Belegt")
    const subEl = card.querySelector('.room-sub');
    if (subEl) {
      const isWindowOpen = room.window_entity && this._hass.states[room.window_entity] && this._hass.states[room.window_entity].state === 'on';
      const isLocked = room.lock_entity && this._hass.states[room.lock_entity] && this._hass.states[room.lock_entity].state === 'locked';

      let status = [];
      if (isWindowOpen) status.push('Fenster offen');
      if (room.lock_entity && isLocked) status.push('Verriegelt');

      subEl.textContent = status.join(' • ');
      subEl.style.display = status.length > 0 ? 'block' : 'none';
    }

    // Action Circles
    // Light
    const lightBtn = card.querySelector('.action-light');
    if (lightBtn && room.light_entity && this._hass.states[room.light_entity]) {
      const isOn = this._hass.states[room.light_entity].state === 'on';
      lightBtn.classList.toggle('active-amber', isOn);
    }

    // Climate (Heizung Farblogik: Heizen = Rot/Warm #ef4444, Aus/Idle = Cool Blue #38bdf8)
    const climateBtn = card.querySelector('.action-climate');
    if (climateBtn && room.climate_entity && this._hass.states[room.climate_entity]) {
      const cObj = this._hass.states[room.climate_entity];
      const isHeating = cObj.state === 'heat' || cObj.attributes?.hvac_action === 'heating' || cObj.attributes?.call_for_heat === true || (cObj.attributes?.heating_power && cObj.attributes.heating_power > 0.05);
      climateBtn.classList.toggle('active-heat', isHeating);
      climateBtn.classList.toggle('cool-idle', !isHeating);
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

    // Custom Actions
    card.querySelectorAll('.action-circle.action-custom').forEach(btn => {
      const entId = btn.getAttribute('data-entity');
      if (entId && this._hass.states[entId]) {
        const s = this._hass.states[entId];
        const isOn = s && (s.state === 'on' || s.state === 'open' || s.state === 'active' || s.state === 'playing');
        btn.classList.toggle('active', isOn);
      }
    });
  }

  _updateAgenda() {
    const agendaEl = this.shadowRoot.getElementById('sidebarAgenda');
    if (!agendaEl || !this._hass) return;

    let items = [];

    // Calendars (Trash & Events discovered dynamically)
    Object.keys(this._hass.states).filter(e => e.startsWith('calendar.')).forEach(calId => {
      const s = this._hass.states[calId];
      if (!s || !s.attributes || !s.attributes.start_time) return;
      const fn = (s.attributes.friendly_name || calId).toLowerCase();
      const lower = `${calId.toLowerCase()} ${fn}`;
      const isWaste = /(abfall|müll|muell|restabfall|bioabfall|gelber|leichtverpackung|papier|wertstoff|trash|waste|recycl)/i.test(lower);
      if (!isWaste) return;
      let iconName = 'calendar';
      let color = 'dot-blue';
      let label = s.attributes.friendly_name || calId;
      if (lower.includes('restabfall') || lower.includes('restmüll') || lower.includes('trash')) {
        iconName = 'trash'; color = 'dot-gray'; label = 'Restabfall';
      } else if (lower.includes('leichtverpack') || lower.includes('gelb') || lower.includes('plastic')) {
        iconName = 'recycle-sack'; color = 'dot-amber'; label = 'Gelber Sack';
      } else if (lower.includes('bio') || lower.includes('green') || lower.includes('compost')) {
        iconName = 'leaf'; color = 'dot-green'; label = 'Bioabfall';
      } else if (lower.includes('papier') || lower.includes('paper') || lower.includes('pappe')) {
        iconName = 'box'; color = 'dot-blue'; label = 'Papiermüll';
      }
      const d = new Date(s.attributes.start_time);
      items.push({
        date: d,
        text: `${this._icon(iconName, { size: 14, style: 'margin-right:5px;' })} ${label} (${d.toLocaleDateString(this._getLocale(), { weekday: 'short', day: 'numeric', month: 'numeric' })})`,
        color
      });
    });

    // Sun times (Dynamic next event: Sunrise or Sunset)
    const sunState = this._hass.states['sun.sun'];
    if (sunState && sunState.attributes) {
      const rising = sunState.attributes.next_rising ? new Date(sunState.attributes.next_rising) : null;
      const setting = sunState.attributes.next_setting ? new Date(sunState.attributes.next_setting) : null;
      let nextSun = null;
      let isRising = false;
      if (rising && setting) {
        if (rising < setting) { nextSun = rising; isRising = true; }
        else { nextSun = setting; isRising = false; }
      } else if (rising) { nextSun = rising; isRising = true; }
      else if (setting) { nextSun = setting; isRising = false; }

      if (nextSun) {
        items.push({
          date: nextSun,
          text: `${this._icon(isRising ? 'sunrise' : 'sunset', { size: 14, cls: 'icon-light', style: 'margin-right:5px;' })} ${isRising ? this._t('sunrise') : this._t('sunset')} ${nextSun.toLocaleTimeString(this._getLocale(), { hour: '2-digit', minute: '2-digit' })}`,
          color: 'dot-amber'
        });
      }
    }

    // Active Alarms in Agenda
    const weckerBool = this._hass.states['input_boolean.wecker_aktiviert'];
    const weckerTime = this._hass.states['input_datetime.wecker_zeit'];
    if (weckerBool && weckerBool.state === 'on' && weckerTime && weckerTime.state) {
      const parts = weckerTime.state.split(':');
      const aD = new Date();
      aD.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
      if (aD < new Date()) aD.setDate(aD.getDate() + 1); // tomorrow
      items.push({
        date: aD,
        text: `${this._icon('alarm', { size: 14, color: '#f59e0b', style: 'margin-right:5px;' })} ${this._t('alarm') || 'Wecker'} ${aD.toLocaleTimeString(this._getLocale(), { hour: '2-digit', minute: '2-digit' })}`,
        color: 'dot-amber'
      });
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

    this._updateDockVisibility();
  }

  _updateDockVisibility() {
    if (!this._hass) return;
    const dockCfg = this._config?.dock || { auto_detect: true, items: [] };
    const states = this._hass.states || {};
    const hasAlarmo = Object.keys(states).some(e => e.startsWith('alarm_control_panel.'));
    const hasLights = Object.keys(states).some(e => e.startsWith('light.'));
    const hasClimate = Object.keys(states).some(e => e.startsWith('climate.'));
    const hasSwitches = Object.keys(states).some(e => e.startsWith('switch.'));
    const hasBatteries = Object.keys(states).some(e => e.includes('battery') || states[e]?.attributes?.device_class === 'battery');

    this.shadowRoot?.querySelectorAll('.dock-item[data-dock-id]').forEach(el => {
      const dockId = el.getAttribute('data-dock-id');
      if (dockId === 'settings') return;
      if (dockCfg.auto_detect === false) {
        el.style.display = 'flex';
        return;
      }
      const items = dockCfg.items || [];
      const item = items.find(i => i.id === dockId);
      let show = true;
      if (item && item.entities && item.entities.length > 0) {
        show = true;
      } else if (item?.auto_hide) {
        if (dockId === 'alarmo') show = hasAlarmo;
        else if (dockId === 'lighting') show = hasLights;
        else if (dockId === 'climate') show = hasClimate;
        else if (dockId === 'switches') show = hasSwitches;
        else if (dockId === 'battery') show = hasBatteries;
      }
      el.style.display = show ? 'flex' : 'none';
    });
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


  _render() {
    if (!this._configLoaded) {
      this.shadowRoot.innerHTML = `
        <style>${VISION_GLASS_STYLES}</style>
        <div class="dashboard-root theme-dark" style="min-height:100vh;display:flex;align-items:center;justify-content:center;">
          <div style="padding:20px 28px;border-radius:18px;background:var(--bg-card);border:1px solid var(--border-glass);color:var(--text-primary);font-weight:600;">
            Vision Glass lädt...
          </div>
        </div>
      `;
      this._applyThemeClass();
      return;
    }
    const isSettings = this._viewMode === 'settings';
    const isStats = this._viewMode === 'stats';
    const effMode = this._resolveEffectiveThemeMode();
    const isLight = effMode === 'light';
    const bgStyle = (this._config && this._config.background_style) || 'aurora';
    const animSpeed = (this._config && this._config.ambient_speed) || 'normal';
    const rootClass = `dashboard-root ${isLight ? 'theme-light' : 'theme-dark'} bg-${bgStyle} anim-${animSpeed}`;

    this.shadowRoot.innerHTML = `
      <style>${VISION_GLASS_STYLES}</style>

      ${isSettings ? `
        <div class="${rootClass}" style="min-height:100vh;padding:28px 32px 80px 32px;box-sizing:border-box;">
          <!-- Liquid Background Morphing Orbs -->
          <div class="liquid-backdrop" aria-hidden="true">
            <div class="liquid-orb liquid-orb-1"></div>
            <div class="liquid-orb liquid-orb-2"></div>
            <div class="liquid-orb liquid-orb-3"></div>
            <div class="liquid-orb liquid-orb-4"></div>
          </div>
          <div id="settingsPageContainer" style="max-width:960px;margin:14px auto 0 auto;position:relative;z-index:1;"></div>
        </div>
      ` : isStats ? `
        <div class="${rootClass}" style="min-height:100vh;padding:28px 32px 80px 32px;box-sizing:border-box;">
          <!-- Liquid Background Morphing Orbs -->
          <div class="liquid-backdrop" aria-hidden="true">
            <div class="liquid-orb liquid-orb-1"></div>
            <div class="liquid-orb liquid-orb-2"></div>
            <div class="liquid-orb liquid-orb-3"></div>
            <div class="liquid-orb liquid-orb-4"></div>
          </div>
          <div style="max-width:1100px;margin:0 auto 18px auto;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;position:relative;z-index:2;">
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="width:42px;height:42px;border-radius:12px;background:rgba(56,189,248,0.15);border:1px solid rgba(56,189,248,0.3);display:flex;align-items:center;justify-content:center;color:var(--accent);">
                ${this._icon('chart-bar', { size: 24, cls: 'icon-stats' })}
              </div>
              <div>
                <div style="font-size:20px;font-weight:700;">${this._t('stats_title')}</div>
                <div style="font-size:12px;color:var(--text-secondary);">${this._t('detailed_stats_sub')}</div>
              </div>
            </div>
            <button type="button" id="btnStatsBackToDashboard" class="btn btn-sm" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;">
              &larr; Zum Dashboard
            </button>
          </div>
          <div id="statsPageContainer" style="max-width:1100px;margin:0 auto;position:relative;z-index:2;"></div>
        </div>
      ` : `
        <div class="${rootClass}">
          <!-- Liquid Background Morphing Orbs (Fluide Lichtwellen & Wasserbrechung) -->
          <div class="liquid-backdrop" aria-hidden="true">
            <div class="liquid-orb liquid-orb-1"></div>
            <div class="liquid-orb liquid-orb-2"></div>
            <div class="liquid-orb liquid-orb-3"></div>
            <div class="liquid-orb liquid-orb-4"></div>
          </div>

        <!-- Top Bar Navigation & Status Chips -->
        <div class="top-bar">
          <div style="display:flex;align-items:center;gap:12px;">
            <button type="button" id="vgSidebarToggle" class="vg-sidebar-toggle-btn ${this._narrow ? 'visible' : ''}" title="Menü">${this._icon('list', { size: 18 })} </button>
            <div>
            <div class="date-title" id="dateTitle">...</div>
            <div class="name-day" id="subHeader">${this._t('welcome')}${(this._hass && this._hass.user && this._hass.user.name) ? ', ' + this._hass.user.name : ''} • ${this._t('smart_home_center')}</div>
            </div>
          </div>

          <div class="chips-container">
            <div id="chipsPersonsList" style="display:contents;"></div>
            <div class="chip" id="chipWarning" style="display:none;"></div>
            <div class="chip" id="chipMedia" style="display:none;"></div>
            <div class="chip" id="chipLights">${this._icon('light', { size: 14, cls: 'icon-light', style: 'margin-right:4px;' })} ${this._t('lights_loading')}</div>
            <div class="chip" id="chipClimate">${this._icon('climate', { size: 14, cls: 'icon-climate', style: 'margin-right:4px;' })} ${this._t('climate_loading')}</div>
            <div class="chip" id="chipLock">${this._icon('lock-closed', { size: 14, cls: 'icon-security', style: 'margin-right:4px;' })} ${this._t('lock_loading')}</div>
            <div class="chip" id="chipAlarmo">${this._icon('shield', { size: 14, cls: 'icon-alarmo', style: 'margin-right:4px;' })} ${this._t('alarmo_loading')}</div>
            <div class="chip" id="chipWeather">${this._icon('weather-partlycloudy', { size: 14, cls: 'icon-weather', style: 'margin-right:4px;' })} ${this._t('weather_loading')}</div>
            <div id="chipsCustomList" style="display:contents;"></div>
            <div class="chip chip-stats" id="chipStatsNav" title="${this._t('stats')}">
              ${this._icon('chart-bar', { size: 14, style: 'margin-right:4px;' })} <span>${this._t('stats')}</span>
            </div>
            <div class="chip chip-settings" id="chipSettings" title="${this._t('settings')}">
              ${this._icon('settings', { size: 14, style: 'margin-right:4px;' })} <span>${this._t('settings')}</span>
            </div>
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
                <span class="sidebar-mini-pill" id="sidebarMiniAlarm" style="display:none;cursor:pointer;"></span>
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

                  <!-- Room Environmental Readings / Configurable Bento Badges -->
                  <div class="room-env-bar">
                    ${(() => {
                      const badgesForRoom = this._getRoomBentoBadges(room);
                      return badgesForRoom.map((b, bIdx) => {
                        const valObj = this._resolveBentoBadgeValue(b, room);
                        if (!valObj || !valObj.text) return '';
                        const bId = b.id || bIdx;
                        const iconName = valObj.iconName || ((b.icon && b.icon.includes(':')) ? b.icon : (MDI_ICON_MAP[b.icon] || (b.icon ? 'mdi:' + b.icon : 'mdi:chart-box-outline')));
                        const alertStyle = valObj.isAlert
                          ? 'border-color:rgba(245,158,11,0.55);background:rgba(245,158,11,0.18);color:#fbbf24;font-weight:700;'
                          : '';
                        return `<span class="env-pill bento-badge-pill ${valObj.isAlert ? 'badge-alert' : ''}" id="badge_${idx}_${bId}" style="display:inline-flex;${alertStyle}" title="${b.name || 'Badge'}: ${valObj.text}">${this._icon(iconName, { size: 11, style: 'margin-right:3px;' })} <span>${valObj.text}</span></span>`;
                      }).join('');
                    })()}
                  </div>

                  <!-- Bottom Row: Actions & Heating Quick Stepper -->
                  <div class="room-bottom-row">
                    <div class="room-actions">
                      ${(() => {
                        const acts = this._getRoomBentoActions(room);
                        const out = [];
                        acts.forEach(a => {
                          if (a.enabled === false) return;
                          const title = a.title || '';

                          if (a.type === 'light') {
                            const ent = (a.entity_id && a.entity_id.trim()) ? a.entity_id.trim() : (room.light_entity && room.light_entity.trim());
                            if (ent) {
                              const s = this._hass && this._hass.states[ent];
                              const isOn = s && s.state === 'on';
                              const inheritedIcon = s?.attributes?.icon;
                              const iconName = (a.icon && a.icon.trim()) ? a.icon.trim() : (inheritedIcon || 'mdi:lightbulb');
                              out.push(`<div class="action-circle action-light ${isOn ? 'active active-amber' : ''}" title="${title || this._t('toggle_light')}" data-action="light" data-entity="${ent}" data-idx="${idx}">${this._icon(iconName, { size: 16, cls: 'icon-light' })}</div>`);
                            }
                          } else if (a.type === 'climate') {
                            const ent = (a.entity_id && a.entity_id.trim()) ? a.entity_id.trim() : (room.climate_entity && room.climate_entity.trim());
                            if (ent) {
                              const s = this._hass && this._hass.states[ent];
                              const isHeating = s && (s.state === 'heat' || s.attributes?.hvac_action === 'heating' || s.attributes?.call_for_heat === true || (s.attributes?.heating_power && s.attributes.heating_power > 0.05));
                              const inheritedIcon = s?.attributes?.icon;
                              const iconName = (a.icon && a.icon.trim()) ? a.icon.trim() : (inheritedIcon || 'mdi:thermometer');
                              out.push(`<div class="action-circle action-climate ${isHeating ? 'active-heat' : 'cool-idle'}" title="${title || this._t('open_climate')}" data-action="climate" data-entity="${ent}" data-idx="${idx}">${this._icon(iconName, { size: 16, cls: 'icon-climate' })}</div>`);
                            }
                          } else if (a.type === 'media') {
                            const ent = (a.entity_id && a.entity_id.trim()) ? a.entity_id.trim() : ((room.media_entity && room.media_entity.trim()) || (room.audio_entity && room.audio_entity.trim()) || (room.video_entity && room.video_entity.trim()));
                            if (ent) {
                              const s = this._hass && this._hass.states[ent];
                              const isOn = s && (s.state === 'playing' || s.state === 'on');
                              const inheritedIcon = s?.attributes?.icon;
                              const iconName = (a.icon && a.icon.trim()) ? a.icon.trim() : (inheritedIcon || 'mdi:music');
                              out.push(`<div class="action-circle action-media ${isOn ? 'active' : ''}" title="${title || this._t('toggle_media')}" data-action="media" data-entity="${ent}" data-idx="${idx}">${this._icon(iconName, { size: 16, cls: 'icon-media' })}</div>`);
                            }
                          } else if (a.type === 'lock') {
                            const ent = (a.entity_id && a.entity_id.trim()) ? a.entity_id.trim() : (room.lock_entity && room.lock_entity.trim());
                            if (ent) {
                              const s = this._hass && this._hass.states[ent];
                              const isLocked = s && s.state === 'locked';
                              const inheritedIcon = s?.attributes?.icon;
                              const iconName = (a.icon && a.icon.trim()) ? a.icon.trim() : (inheritedIcon || (isLocked ? 'mdi:lock' : 'mdi:lock-open-variant'));
                              out.push(`<div class="action-circle action-lock ${isLocked ? 'active-green' : 'active-amber'}" title="${title || this._t('toggle_lock')}" data-action="lock" data-entity="${ent}" data-idx="${idx}">${this._icon(iconName, { size: 16, cls: 'icon-security' })}</div>`);
                            }
                          } else if (a.type === 'devices_helpers') {
                            out.push(`<div class="action-circle action-devices-helpers" title="${title || (this._t('devices_and_helpers') || 'Geräte & Helfer')}" data-action="devices_helpers" data-idx="${idx}">${this._icon(a.icon || 'mdi:tune-vertical', { size: 16 })}</div>`);
                          } else if (a.type === 'custom' && a.entity_id) {
                            const ent = a.entity_id.trim();
                            const s = this._hass && this._hass.states[ent];
                            const isOn = s && (s.state === 'on' || s.state === 'open' || s.state === 'active' || s.state === 'playing' || s.state === 'heat' || s.state === 'cool' || s.state === 'unlocked');
                            let iconName = (a.icon && a.icon.trim()) ? a.icon.trim() : '';
                            if (!iconName) {
                              if (s?.attributes?.icon) {
                                iconName = s.attributes.icon;
                              } else if (ent.startsWith('switch.') || ent.startsWith('input_boolean.')) {
                                iconName = isOn ? 'mdi:toggle-switch' : 'mdi:toggle-switch-off';
                              } else if (ent.startsWith('cover.')) {
                                iconName = s?.state === 'open' ? 'mdi:window-shutter-open' : 'mdi:window-shutter';
                              } else if (ent.startsWith('binary_sensor.')) {
                                const dc = (s?.attributes?.device_class || '').toLowerCase();
                                if (dc === 'window') iconName = isOn ? 'mdi:window-open-variant' : 'mdi:window-closed-variant';
                                else if (dc === 'door') iconName = isOn ? 'mdi:door-open' : 'mdi:door-closed';
                                else if (dc === 'motion') iconName = isOn ? 'mdi:motion-sensor' : 'mdi:motion-sensor-off';
                                else iconName = isOn ? 'mdi:checkbox-marked-circle' : 'mdi:checkbox-blank-circle-outline';
                              } else {
                                iconName = 'mdi:star';
                              }
                            }
                            out.push(`<div class="action-circle action-custom ${isOn ? 'active' : ''}" title="${title || s?.attributes?.friendly_name || ent}" data-action="custom" data-entity="${ent}" data-idx="${idx}">${this._icon(iconName, { size: 16 })}</div>`);
                          }
                        });
                        return out.join('');
                      })()}
                    </div>

                    ${(room.show_temp_control !== false && (room.climate_entity || room.target_temp_entity)) ? `
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
          ${(() => {
            const dockCfg = this._config.dock || { auto_detect: true, items: [] };
            const defaultDockItems = [
              { id: 'lighting', title: this._t('lighting'), enabled: true, auto_hide: true },
              { id: 'climate', title: this._t('climate'), enabled: true, auto_hide: true },
              { id: 'stats', title: this._t('stats'), enabled: true, auto_hide: false },
              { id: 'devices_helpers', title: this._t('devices_helpers_title') || this._t('devices_and_helpers'), enabled: true, auto_hide: false },
              { id: 'security', title: this._t('security'), enabled: true, auto_hide: false },
              { id: 'alarmo', title: this._t('alarmo'), enabled: true, auto_hide: true },
              { id: 'switches', title: this._t('switches'), enabled: true, auto_hide: true },
              { id: 'battery', title: this._t('battery'), enabled: true, auto_hide: true },
              { id: 'weather', title: this._t('weather'), enabled: true, auto_hide: false }
            ];
            const effItems = (dockCfg.items && dockCfg.items.length > 0) ? dockCfg.items : defaultDockItems;

            const itemsHtml = effItems.map(item => {
              if (item.enabled === false) return '';
              const iconHtml = item.icon ? this._icon(item.icon, { size: 19 }) : this._getBuiltinDockIcon(item.id, 19);
              return `<div class="dock-item" data-dock-id="${item.id}" title="${item.title || item.id}">${iconHtml}</div>`;
            }).join('');

            const hasHelpers = effItems.some(i => i.id === 'devices_helpers' && i.enabled !== false);
            const helpersHtml = !hasHelpers ? `<div class="dock-item" data-dock-id="devices_helpers" title="${this._t('devices_helpers_title') || this._t('devices_and_helpers')}">${this._getBuiltinDockIcon('devices_helpers', 19)}</div>` : '';

            return itemsHtml + helpersHtml;
          })()}
          <div class="dock-item" data-dock-id="settings" title="${this._t('settings')}" style="color:var(--accent);">${this._icon('settings', { size: 19 })}</div>
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
      if (cont) {
        if (this._renderSettingsContent) {
          this._renderSettingsContent(cont, false);
          this._applyThemeClass();
        } else {
          cont.innerHTML = `<div style="padding:36px;text-align:center;color:var(--text-secondary);">${this._t('loading')}</div>`;
          this._loadSettingsModule().then(() => {
            if (this._viewMode === 'settings') {
              this._renderSettingsContent(cont, false);
              this._applyThemeClass();
            }
          });
        }
      }
      return;
    }

    if (isStats) {
      const cont = this.shadowRoot.getElementById('statsPageContainer');
      const backBtn = this.shadowRoot.getElementById('btnStatsBackToDashboard');
      if (backBtn) backBtn.onclick = () => this._setViewMode('home');
      if (cont) {
        if (this._renderStatsPageView) {
          this._renderStatsPageView(cont);
          this._applyThemeClass();
        } else {
          cont.innerHTML = `<div style="padding:36px;text-align:center;color:var(--text-secondary);">${this._t('loading')}</div>`;
          this._loadStatsModule().then(() => {
            if (this._viewMode === 'stats') {
              this._renderStatsPageView(cont);
              this._applyThemeClass();
            }
          });
        }
      }
      return;
    }

    // Event Listeners
    // Sidebar Weather Card Click -> Open Weather Modal
    const swEl = this.shadowRoot.getElementById('sidebarWeather');
    if (swEl) swEl.addEventListener('click', () => this._openModal('weather'));

    // Top Bar Chips
    this.shadowRoot.getElementById('chipLights').addEventListener('click', () => this._openModal('lighting'));
    this.shadowRoot.getElementById('chipClimate').addEventListener('click', () => this._openModal('climate'));
    this.shadowRoot.getElementById('chipLock').addEventListener('click', () => this._openModal('security'));
    this.shadowRoot.getElementById('chipAlarmo').addEventListener('click', () => this._openModal('alarmo'));
    this.shadowRoot.getElementById('chipWeather').addEventListener('click', () => this._openModal('weather'));

    // Dock Items (Dynamic click binding)
    const navigateToSettings = () => {
      this._setViewMode('settings');
    };
    const menuBtn = this.shadowRoot.getElementById('vgSidebarToggle');
    if (menuBtn) {
      menuBtn.onclick = () => this.dispatchEvent(new CustomEvent('hass-toggle-menu', { bubbles: true, composed: true }));
    }

    this.shadowRoot.querySelectorAll('.dock-item[data-dock-id]').forEach(itemEl => {
      itemEl.onclick = () => {
        const dockId = itemEl.getAttribute('data-dock-id');
        if (dockId === 'settings') {
          navigateToSettings();
        } else if (dockId === 'stats') {
          this._setViewMode('stats');
        } else {
          const dockCfg = this._config?.dock || {};
          const items = dockCfg.items || [];
          const item = items.find(i => i.id === dockId);
          if (item && item.entities && item.entities.length > 0) {
            this._openCustomDockModal(item);
          } else if (['lighting', 'climate', 'security', 'alarmo', 'switches', 'battery', 'weather', 'devices_helpers'].includes(dockId)) {
            this._openModal(dockId);
          } else if (item) {
            this._openCustomDockModal(item);
          }
        }
      };
    });
    const cStatsNav = this.shadowRoot.getElementById('chipStatsNav');
    if (cStatsNav) cStatsNav.onclick = () => this._setViewMode('stats');
    const cSet = this.shadowRoot.getElementById('chipSettings');
    if (cSet) cSet.addEventListener('click', navigateToSettings);
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

        if (action === 'light') {
          const lEnt = btn.getAttribute('data-entity') || room.light_entity;
          if (lEnt) this._callService('light', 'toggle', { entity_id: lEnt });
        } else if (action === 'climate') {
          this._openModal('climate');
        } else if (action === 'media') {
          const mEnt = btn.getAttribute('data-entity') || room.media_entity || room.audio_entity || room.video_entity;
          if (mEnt) this._callService('media_player', 'media_play_pause', { entity_id: mEnt });
        } else if (action === 'lock') {
          const lEnt = btn.getAttribute('data-entity') || room.lock_entity;
          if (lEnt) {
            const lState = this._hass && this._hass.states[lEnt];
            const isLocked = lState && lState.state === 'locked';
            this._callService('lock', isLocked ? 'unlock' : 'lock', { entity_id: lEnt });
          }
        } else if (action === 'devices_helpers') {
          this._openModal('devices_helpers');
        } else if (action === 'switch' && room.switch_entity) {
          this._callService('switch', 'toggle', { entity_id: room.switch_entity });
        } else if (action === 'custom') {
          const entId = btn.getAttribute('data-entity');
          if (entId) {
            const domain = entId.split('.')[0];
            if (domain === 'script' || domain === 'scene') {
              this._callService(domain, 'turn_on', { entity_id: entId });
            } else {
              this._callService('homeassistant', 'toggle', { entity_id: entId });
            }
          }
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
          } else if (room.target_temp_entity && this._hass && this._hass.states[room.target_temp_entity]) {
            const tObj = this._hass.states[room.target_temp_entity];
            let curTarget = parseFloat(tObj.state) || 21.0;
            const newTarget = Math.min(28.0, Math.round((curTarget + 0.5) * 10) / 10);
            this._callService('input_number', 'set_value', { entity_id: room.target_temp_entity, value: newTarget });
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
          } else if (room.target_temp_entity && this._hass && this._hass.states[room.target_temp_entity]) {
            const tObj = this._hass.states[room.target_temp_entity];
            let curTarget = parseFloat(tObj.state) || 21.0;
            const newTarget = Math.max(14.0, Math.round((curTarget - 0.5) * 10) / 10);
            this._callService('input_number', 'set_value', { entity_id: room.target_temp_entity, value: newTarget });
            const valEl = this.shadowRoot.getElementById(`targetTemp_${idx}`);
            if (valEl) valEl.textContent = `${newTarget.toFixed(1)}°`;
          }
        }
      });
    });
  }

}

Object.assign(VisionGlassPanel.prototype, tactileMethods, modalMethods);

if (!customElements.get('vision-glass-panel')) {
  customElements.define('vision-glass-panel', VisionGlassPanel);
}

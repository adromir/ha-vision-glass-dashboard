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
          light_entity: 'light.livingroom',
          media_entity: 'media_player.denon_avr_x3300w_3',
          switch_entity: 'switch.switch_livingroom_tv_smartplug_switch',
          presence_entity: 'binary_sensor.prasenzmelder_wohnzimmer_presence',
          window_entity: 'binary_sensor.fensterkontakte_wohnzimmer'
        },
        {
          id: 'arbeitszimmer',
          name: 'Arbeitszimmer',
          picture: '/api/image/serve/bafdc8f4ac59eaa27f9821b007af5cd1/512x512',
          temp_entity: 'sensor.bewegungsmelder_arbeitszimmer_temperatur',
          target_temp_entity: 'input_number.arbeitszimmer_komfort_temperatur',
          climate_entity: 'climate.better_thermostat_arbeitszimmer',
          light_entity: 'light.light_studyroom_tomada',
          media_entity: 'media_player.arbeitszimmer_andreas_echo_show',
          switch_entity: 'switch.switch_denon_659190_smartplug_switch',
          presence_entity: 'binary_sensor.prasenzmelder_arbeitszimmer_presence',
          window_entity: 'binary_sensor.fensterkontakt_arbeitszimmerfenster_contact'
        },
        {
          id: 'schlafzimmer',
          name: 'Schlafzimmer',
          picture: '/api/image/serve/c232467fe87758f1622031d777e965b5/512x512',
          temp_entity: 'sensor.bewegungsmelder_schlafzimmer_temperature',
          target_temp_entity: 'input_number.schlafzimmer_komfort_temperatur',
          climate_entity: 'climate.better_thermostat_schlafzimmer',
          light_entity: 'light.schlafzimmerlicht',
          media_entity: 'media_player.schlafzimmer_tv_2',
          switch_entity: 'switch.switch_bedroom_tv_smartplug_switch',
          presence_entity: 'binary_sensor.prasenzmelder_schlafzimmer_presence',
          window_entity: 'binary_sensor.fensterkontakt_schlafzimmer_contact'
        },
        {
          id: 'kuche',
          name: 'Küche',
          picture: '/api/image/serve/f95a2403326e0cbe78953ca98a93f878/512x512',
          temp_entity: 'sensor.bewegungsmelder_kuche_temperature',
          target_temp_entity: 'input_number.kuche_komfort_temperatur',
          climate_entity: 'climate.better_thermostat_kuche',
          light_entity: 'light.light_kitchen_tomada',
          presence_entity: 'binary_sensor.prasenzmelder_kuche_presence',
          window_entity: 'binary_sensor.fensterkontakt_kuche_contact'
        },
        {
          id: 'badezimmer',
          name: 'Badezimmer',
          picture: '/api/image/serve/ce49978764aa284ddd21dfaac0f671f1/512x512',
          temp_entity: 'sensor.badezimmer_temperatur',
          target_temp_entity: 'input_number.bad_komfort_temperatur',
          climate_entity: 'climate.better_thermostat_badezimmer',
          light_entity: 'light.light_bathroom_tomada',
          switch_entity: 'switch.switch_washingmachine_smartplug_switch',
          presence_entity: 'binary_sensor.prasenzmelder_badezimmer_presence'
        },
        {
          id: 'flur',
          name: 'Flur',
          picture: '/api/image/serve/bb7e01034e0b85ae2cfb23fa422d252e/512x512',
          temp_entity: 'sensor.bewegungsmelder_flur_temperatur',
          target_temp_entity: 'input_number.flur_komfort_temperatur',
          climate_entity: 'climate.better_thermostat_flur',
          light_entity: 'light.light_hallway_tomada',
          lock_entity: 'lock.wohnungsschloss',
          presence_entity: 'binary_sensor.prasenzmelder_flur_presence',
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
      rooms: (config.rooms && config.rooms.length > 0) ? config.rooms : stub.rooms
    };
    this._render();
    this._initialRenderDone = true;
  }

  set hass(hass) {
    this._hass = hass;
    if (this._initialRenderDone) {
      this._updateAll();
    }
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
      themeBtn.innerHTML = isDay ? '☀️' : '🌙';
      themeBtn.title = isDay ? 'Tagmodus aktiv (Klick für Nachtmodus)' : 'Nachtmodus aktiv (Klick für Tagmodus)';
    }
  }

  _callService(domain, service, data) {
    if (!this._hass) return;
    this._hass.callService(domain, service, data);
  }

  _openRoomModal(room) {
    this._activeModal = { type: 'room', room };
    const modalEl = this.shadowRoot.getElementById('modalContainer');
    if (modalEl) {
      modalEl.classList.remove('hidden');
      this._renderRoomModal(room);
    }
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
    const otherSwitches = [];
    const otherSensors = [];

    Object.keys(this._hass.states).forEach(eId => {
      if (eId === room.light_entity || eId === room.climate_entity || eId === room.presence_entity || eId === room.window_entity || eId === room.switch_entity || eId === room.media_entity || eId === room.temp_entity) return;

      const eIdLower = eId.toLowerCase();
      const fnLower = ((this._hass.states[eId].attributes && this._hass.states[eId].attributes.friendly_name) || '').toLowerCase();

      if (eIdLower.includes(roomSlug) || fnLower.includes(roomSlug) || fnLower.includes(room.name.toLowerCase())) {
        if (eId.startsWith('switch.') || eId.startsWith('light.')) {
          otherSwitches.push({ id: eId, state: this._hass.states[eId] });
        } else if (eId.startsWith('sensor.') || eId.startsWith('binary_sensor.')) {
          otherSensors.push({ id: eId, state: this._hass.states[eId] });
        }
      }
    });

    body.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.06);border:1px solid var(--border-subtle);border-radius:20px;padding:16px 20px;">
          <div>
            <div style="font-size:22px;font-weight:700;">${room.name}</div>
            <div style="font-size:13px;color:var(--text-secondary);margin-top:3px;">
              ${isPres ? '🟢 Person anwesend' : '⚪ Keine Bewegung'} • ${isWinOpen ? '⚠️ Fenster geöffnet' : '✔️ Fenster geschlossen'}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:24px;font-weight:700;color:var(--accent);">${curTemp}°C</div>
            <div style="font-size:12px;color:var(--text-secondary);">Raumtemperatur</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;">
          ${room.light_entity ? `
            <div class="control-row">
              <div>
                <div style="font-weight:600;font-size:14px;">💡 Beleuchtung</div>
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
                <span style="font-weight:600;font-size:14px;">🌡️ Thermostat</span>
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
                <div style="font-weight:600;font-size:14px;">🔌 ${(switchObj && switchObj.attributes.friendly_name) || 'Steckdose'}</div>
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
                <div style="font-weight:600;font-size:14px;">🎵 ${(mediaObj && mediaObj.attributes.friendly_name) || 'Medien'}</div>
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
              return `
                <div class="control-row">
                  <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;" title="${name}">
                    ${domain === 'light' ? '💡' : '🔌'} ${name}
                  </div>
                  <button class="toggle-pill ${isOn ? 'active' : ''}" data-dyn-toggle="${s.id}" data-dyn-domain="${domain}">
                    ${isOn ? 'EIN' : 'AUS'}
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}

        ${otherSensors.length > 0 ? `
          <div style="font-size:14px;font-weight:700;margin-top:8px;">Messwerte & Sensoren (${otherSensors.length})</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;">
            ${otherSensors.slice(0, 16).map(s => {
              const name = (s.state && s.state.attributes.friendly_name) || s.id;
              const val = s.state ? s.state.state : '--';
              const unit = (s.state && s.state.attributes.unit_of_measurement) || '';
              return `
                <div class="control-row" style="padding:8px 12px;">
                  <span style="font-size:12px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px;" title="${name}">${name}</span>
                  <span style="font-size:12px;font-weight:700;">${val} ${unit}</span>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}
      </div>
    `;

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

    // 1. Update Date Header
    const now = new Date();
    const dateTitleEl = this.shadowRoot.getElementById('dateTitle');
    if (dateTitleEl) {
      const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      dateTitleEl.textContent = now.toLocaleDateString('de-DE', options);
    }

    // 2. Update Weather
    const wEntity = this._config.weather_entity;
    if (wEntity && this._hass.states[wEntity]) {
      const w = this._hass.states[wEntity];
      const temp = w.attributes.temperature;
      const weatherTempEl = this.shadowRoot.getElementById('weatherTemp');
      const weatherStateEl = this.shadowRoot.getElementById('weatherCondition');
      const weatherIconEl = this.shadowRoot.getElementById('weatherIcon');
      const chipWeather = this.shadowRoot.getElementById('chipWeather');

      if (weatherTempEl && temp !== undefined) weatherTempEl.textContent = `${temp}°C`;
      if (weatherStateEl) {
        weatherStateEl.textContent = this._translateWeather(w.state);
      }
      if (weatherIconEl) {
        weatherIconEl.textContent = this._getWeatherEmoji(w.state);
      }
      if (chipWeather && temp !== undefined) {
        chipWeather.textContent = `🌦️ Hannover ${temp}°C`;
      }
    }

    // 3. Update Chips
    // Persons Chips
    const chipPA = this.shadowRoot.getElementById('chipPersonAndreas');
    if (chipPA) {
      const pA = this._hass.states['person.andreas'];
      const isHome = pA && pA.state === 'home';
      chipPA.innerHTML = `<span class="chip-dot ${isHome ? 'dot-green' : 'dot-gray'}"></span> 👤 Andreas: ${isHome ? 'Zuhause' : (pA ? (pA.state === 'not_home' ? 'Abwesend' : pA.state) : 'Unbekannt')}`;
    }
    const chipPS = this.shadowRoot.getElementById('chipPersonShanty');
    if (chipPS) {
      const pS = this._hass.states['person.shanty'];
      const isHome = pS && pS.state === 'home';
      chipPS.innerHTML = `<span class="chip-dot ${isHome ? 'dot-green' : 'dot-gray'}"></span> 👤 Shanty: ${isHome ? 'Zuhause' : (pS ? (pS.state === 'not_home' ? 'Abwesend' : pS.state) : 'Unbekannt')}`;
    }

    // Lights Chip
    const allLightsState = this._hass.states[this._config.all_lights_entity];
    const chipLights = this.shadowRoot.getElementById('chipLights');
    if (chipLights) {
      let activeLightsCount = 0;
      this._config.rooms.forEach(r => {
        if (r.light_entity && this._hass.states[r.light_entity] && this._hass.states[r.light_entity].state === 'on') {
          activeLightsCount++;
        }
      });
      if (activeLightsCount > 0) {
        chipLights.innerHTML = `<span class="chip-dot dot-amber"></span> ${activeLightsCount} Licht${activeLightsCount > 1 ? 'er' : ''} an`;
      } else if (allLightsState && allLightsState.state === 'on') {
        chipLights.innerHTML = `<span class="chip-dot dot-amber"></span> Licht an`;
      } else {
        chipLights.innerHTML = `<span class="chip-dot dot-gray"></span> Alle Lichter aus`;
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
        chipClimate.innerHTML = `<span class="chip-dot dot-blue"></span> Raumklima ${minT} - ${maxT} °C`;
      } else {
        chipClimate.innerHTML = `<span class="chip-dot dot-blue"></span> Raumklima 22°C`;
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
        chipLock.innerHTML = `<span class="chip-dot dot-amber"></span> 🚪 Tür offen`;
      } else if (!isLocked) {
        chipLock.innerHTML = `<span class="chip-dot dot-amber"></span> 🔓 Schloss entriegelt`;
      } else {
        chipLock.innerHTML = `<span class="chip-dot dot-green"></span> 🔒 Tür zu & verriegelt`;
      }
    }

    // Alarmo Chip
    const chipAlarmo = this.shadowRoot.getElementById('chipAlarmo');
    if (chipAlarmo) {
      const al = this._hass.states['alarm_control_panel.alarmo'];
      const ast = al ? al.state : 'disarmed';
      if (ast === 'disarmed') {
        chipAlarmo.innerHTML = `<span class="chip-dot dot-green"></span> 🛡️ Alarmo: Unscharf`;
      } else if (ast === 'triggered') {
        chipAlarmo.innerHTML = `<span class="chip-dot dot-amber"></span> 🚨 Alarmo: ALARM!`;
      } else {
        chipAlarmo.innerHTML = `<span class="chip-dot dot-blue"></span> 🛡️ Alarmo: Scharf`;
      }
    }

    // 4. Update Room Cards
    this._config.rooms.forEach((room, idx) => {
      this._updateRoomCard(room, idx);
    });

    // 5. Update Agenda
    this._updateAgenda();

    // 6. Update Active Modal if open
    if (this._activeModal) {
      if (typeof this._activeModal === 'string') {
        this._renderModalContent(this._activeModal);
      } else if (this._activeModal.type === 'room') {
        this._renderRoomModal(this._activeModal.room);
      }
    }
  }

  _updateRoomCard(room, idx) {
    const card = this.shadowRoot.getElementById(`roomCard_${idx}`);
    if (!card) return;

    // Temperature Badge
    const tempEl = card.querySelector('.room-temp-badge');
    if (tempEl) {
      let tVal = null;
      if (room.climate_entity && this._hass.states[room.climate_entity]) {
        const c = this._hass.states[room.climate_entity];
        tVal = c.attributes.current_temperature || c.attributes.temperature;
      }
      if (!tVal && room.temp_entity && this._hass.states[room.temp_entity]) {
        tVal = this._hass.states[room.temp_entity].state;
      }
      if (tVal) {
        tempEl.textContent = `${parseFloat(tVal).toFixed(1)}°C`;
      } else {
        tempEl.textContent = '';
      }
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
      lockBtn.innerHTML = isLocked ? '🔒' : '🔓';
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
      { id: 'calendar.das_muhlenfeld_misburg_nord_4_restabfall', label: 'Restabfall', icon: '🗑️', color: 'dot-gray' },
      { id: 'calendar.das_muhlenfeld_misburg_nord_4_leichtverpackungen', label: 'Gelber Sack', icon: '🟡', color: 'dot-amber' },
      { id: 'calendar.das_muhlenfeld_misburg_nord_4_bioabfall', label: 'Bioabfall', icon: '🌿', color: 'dot-green' },
      { id: 'calendar.das_muhlenfeld_misburg_nord_4_papier', label: 'Papiermüll', icon: '📦', color: 'dot-blue' }
    ];

    trashCalendars.forEach(c => {
      const s = this._hass.states[c.id];
      if (s && s.attributes && s.attributes.start_time) {
        const d = new Date(s.attributes.start_time);
        items.push({
          date: d,
          text: `${c.icon} ${c.label} (${d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' })})`,
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
          text: `🌅 Sonnenuntergang ${dSet.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`,
          color: 'dot-amber'
        });
      }
    }

    // Sort by date
    items.sort((a, b) => a.date - b.date);

    if (items.length > 0) {
      agendaEl.innerHTML = `
        <div class="agenda-title">Termine & Müllabfuhr</div>
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
    const map = {
      'clear-night': '🌙',
      'cloudy': '☁️',
      'fog': '🌫️',
      'hail': '🌨️',
      'lightning': '⚡',
      'lightning-rainy': '⛈️',
      'partlycloudy': '⛅',
      'pouring': '🌧️',
      'rainy': '🌦️',
      'snowy': '❄️',
      'snowy-rainy': '🌨️',
      'sunny': '☀️',
      'windy': '💨'
    };
    return map[state] || '⛅';
  }

  _openModal(type) {
    this._activeModal = type;
    const modalEl = this.shadowRoot.getElementById('modalContainer');
    if (modalEl) {
      modalEl.classList.remove('hidden');
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
      title.textContent = '💡 Beleuchtungs-Steuerung';
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
              <div class="control-row">
                <div style="flex:1;">
                  <div style="font-weight:600;font-size:14px;">${l.name}</div>
                  <div style="font-size:12px;color:var(--text-secondary);">${isOn ? `An (${bri}%)` : 'Aus'}</div>
                </div>
                <button class="toggle-pill ${isOn ? 'active' : ''}" data-light="${l.id}">
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
      title.textContent = '🌡️ Heizung, Raumklima & Temperaturkurven';
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
      title.textContent = '🔒 Sicherheit, Schloss & Kontakte';
      const lockObj = this._hass.states['lock.wohnungsschloss'];
      const doorObj = this._hass.states['binary_sensor.turkontakt_hausture_contact'];
      const isLocked = lockObj && lockObj.state === 'locked';
      const isDoorOpen = doorObj && doorObj.state === 'on';

      let stateText = '';
      let stateColor = '#10b981';
      let stateIcon = '🔒';
      let stateBg = 'rgba(16, 185, 129, 0.15)';

      if (isDoorOpen) {
        stateText = 'Tür ist GEÖFFNET (Offen)';
        stateColor = '#ef4444';
        stateIcon = '🚪 ⚠️';
        stateBg = 'rgba(239, 68, 68, 0.20)';
      } else if (!isLocked) {
        stateText = 'Tür geschlossen • Aktuell ENTRIEGELT';
        stateColor = '#f59e0b';
        stateIcon = '🔓';
        stateBg = 'rgba(245, 158, 11, 0.18)';
      } else {
        stateText = 'Tür geschlossen & Sicher VERRIEGELT';
        stateColor = '#10b981';
        stateIcon = '🔒 ✔️';
        stateBg = 'rgba(16, 185, 129, 0.15)';
      }

      const contacts = [
        { id: 'binary_sensor.turkontakt_hausture_contact', name: 'Haustüre', icon: '🚪' },
        { id: 'binary_sensor.turkontakt_balkontur_contact', name: 'Balkontüre', icon: '🚪' },
        { id: 'binary_sensor.fensterkontakte_wohnzimmer', name: 'Wohnzimmerfenster', icon: '🪟' },
        { id: 'binary_sensor.fensterkontakt_arbeitszimmerfenster_contact', name: 'Arbeitszimmerfenster', icon: '🪟' },
        { id: 'binary_sensor.fensterkontakt_kuche_contact', name: 'Küchenfenster', icon: '🪟' },
        { id: 'binary_sensor.fensterkontakt_flur_contact', name: 'Flurfenster', icon: '🪟' },
        { id: 'binary_sensor.fensterkontakt_schlafzimmer_contact', name: 'Schlafzimmerfenster', icon: '🪟' }
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
                🔒 Verriegeln
              </button>
              <button class="btn-micro ${!isLocked ? 'active-amber' : ''}" id="btnUnlockAction" style="flex:1;padding:12px;font-size:14px;font-weight:700;">
                🔓 Entriegeln
              </button>
            </div>
          </div>

          <div style="font-size:15px;font-weight:700;margin-top:4px;">Fenster- & Türkontakte</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;">
            ${contacts.map(c => {
              const cs = this._hass.states[c.id];
              const isOpen = cs && cs.state === 'on';
              return `
                <div class="control-row">
                  <div>
                    <div style="font-weight:600;font-size:14px;">${c.icon} ${c.name}</div>
                    <div style="font-size:12px;color:var(--text-secondary);">${isOpen ? '⚠️ Geöffnet' : '✔️ Geschlossen'}</div>
                  </div>
                  <span class="toggle-pill ${isOpen ? 'active-amber' : ''}">${isOpen ? 'OFFEN' : 'ZU'}</span>
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
      title.textContent = '🛡️ Alarmanlage (Alarmo)';
      const alarmo = this._hass.states['alarm_control_panel.alarmo'];
      const st = alarmo ? alarmo.state : 'disarmed';

      const stMap = {
        'disarmed': { label: 'Unscharf (Deaktiviert)', color: '#10b981', icon: '🟢', bg: 'rgba(16, 185, 129, 0.15)' },
        'armed_home': { label: 'Scharf (Zuhause)', color: '#0284c7', icon: '🏠', bg: 'rgba(2, 132, 199, 0.15)' },
        'armed_away': { label: 'Scharf (Abwesend)', color: '#f59e0b', icon: '🚶', bg: 'rgba(245, 158, 11, 0.15)' },
        'armed_night': { label: 'Scharf (Nacht)', color: '#6366f1', icon: '🌙', bg: 'rgba(99, 102, 241, 0.15)' },
        'arming': { label: 'Schärfung läuft...', color: '#f59e0b', icon: '⏳', bg: 'rgba(245, 158, 11, 0.2)' },
        'triggered': { label: '🚨 ALARM AUSGELÖST!', color: '#ef4444', icon: '🚨', bg: 'rgba(239, 68, 68, 0.25)' }
      };

      const info = stMap[st] || { label: st, color: '#94a3b8', icon: '🛡️', bg: 'rgba(255,255,255,0.1)' };

      body.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:18px;">
          <!-- Status Banner -->
          <div style="background:${info.bg};border:1px solid ${info.color};border-radius:20px;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;">
            <div>
              <div style="font-size:13px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:1px;font-weight:600;">Status</div>
              <div style="font-size:22px;font-weight:700;color:${info.color};margin-top:2px;">${info.label}</div>
            </div>
            <div style="font-size:36px;">${info.icon}</div>
          </div>

          <!-- Mode Buttons -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;">
            <button class="btn-micro ${st === 'disarmed' ? 'active-green' : ''}" id="btnAlarmoDisarm" style="padding:12px;font-weight:700;">
              🟢 Unscharf
            </button>
            <button class="btn-micro ${st === 'armed_home' ? 'active' : ''}" id="btnAlarmoHome" style="padding:12px;font-weight:700;">
              🏠 Zuhause
            </button>
            <button class="btn-micro ${st === 'armed_away' ? 'active-amber' : ''}" id="btnAlarmoAway" style="padding:12px;font-weight:700;">
              🚶 Abwesend
            </button>
            <button class="btn-micro ${st === 'armed_night' ? 'active' : ''}" id="btnAlarmoNight" style="padding:12px;font-weight:700;">
              🌙 Nacht
            </button>
          </div>

          <!-- Optional PIN display & Keypad -->
          <div style="background:rgba(255,255,255,0.06);border:1px solid var(--border-subtle);border-radius:18px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px;">
            <div style="display:flex;align-items:center;justify-content:space-between;width:100%;max-width:240px;">
              <span style="font-size:13px;color:var(--text-secondary);">PIN Code:</span>
              <span style="font-size:20px;letter-spacing:4px;font-family:monospace;font-weight:700;" id="alarmoPinDisplay">${this._alarmoCode ? '•'.repeat(this._alarmoCode.length) : 'Keine Eingabe'}</span>
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
      title.textContent = '🔋 Batteriestatus & Geräte-Wartung';

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
              let icon = '🔋';
              if (d.level < 20) {
                color = '#ef4444';
                icon = '🪫';
              } else if (d.level <= 40) {
                color = '#f59e0b';
                icon = '🔋';
              }
              return `
                <div class="control-row" style="flex-direction:column;align-items:stretch;gap:8px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:210px;" title="${d.name}">
                      ${icon} ${d.name}
                    </div>
                    <span style="font-weight:700;font-size:14px;color:${color};">${d.level}%</span>
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
      title.textContent = '🔌 Geräte & Steckdosen';
      const switches = [
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
            return `
              <div class="control-row">
                <div style="flex:1;">
                  <div style="font-weight:600;font-size:14px;">${sw.name}</div>
                  <div style="font-size:12px;color:var(--text-secondary);">${isOn ? (pwrSensor ? `Aktiv • ${pwrSensor}` : 'Ein') : 'Aus'}</div>
                </div>
                <button class="toggle-pill ${isOn ? 'active' : ''}" data-switch="${sw.id}">
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
      title.textContent = '🌦️ Wetter Hannover (DWD)';
      const w = this._hass.states['weather.hannover_hannover'];
      if (!w) {
        body.innerHTML = '<div>Keine Wetterdaten verfügbar.</div>';
        return;
      }
      const a = w.attributes;
      body.innerHTML = `
        <div style="display:flex;gap:24px;align-items:center;margin-bottom:20px;">
          <div style="font-size:56px;">${this._getWeatherEmoji(w.state)}</div>
          <div>
            <div style="font-size:32px;font-weight:700;">${a.temperature}°C</div>
            <div style="font-size:16px;color:var(--text-secondary);">${this._translateWeather(w.state)}</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;">
          <div class="control-row" style="flex-direction:column;align-items:flex-start;">
            <span style="font-size:12px;color:var(--text-secondary);">Luftfeuchtigkeit</span>
            <span style="font-size:18px;font-weight:600;">${a.humidity}%</span>
          </div>
          <div class="control-row" style="flex-direction:column;align-items:flex-start;">
            <span style="font-size:12px;color:var(--text-secondary);">Luftdruck</span>
            <span style="font-size:18px;font-weight:600;">${a.pressure} mbar</span>
          </div>
          <div class="control-row" style="flex-direction:column;align-items:flex-start;">
            <span style="font-size:12px;color:var(--text-secondary);">Wind</span>
            <span style="font-size:18px;font-weight:600;">${a.wind_speed} km/h (${a.wind_bearing})</span>
          </div>
          <div class="control-row" style="flex-direction:column;align-items:flex-start;">
            <span style="font-size:12px;color:var(--text-secondary);">Sichtweite</span>
            <span style="font-size:18px;font-weight:600;">${a.visibility} km</span>
          </div>
        </div>
      `;
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
          --bg-surface: rgba(255, 255, 255, 0.65);
          --bg-surface-hover: rgba(255, 255, 255, 0.85);
          --bg-card: rgba(255, 255, 255, 0.55);
          --border-glass: rgba(255, 255, 255, 0.85);
          --border-subtle: rgba(255, 255, 255, 0.5);
          --text-primary: #0f172a;
          --text-secondary: #475569;
          --accent: #0284c7;
          --accent-amber: #ea580c;
          --accent-green: #10b981;
          --dock-bg: rgba(255, 255, 255, 0.65);
          --shadow-ambient: 0 10px 30px rgba(31, 38, 135, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.95);
          --card-overlay: linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%);
        }

        .dashboard-root.theme-dark {
          --bg-surface: rgba(24, 32, 48, 0.70);
          --bg-surface-hover: rgba(30, 41, 59, 0.85);
          --bg-card: rgba(20, 27, 42, 0.65);
          --border-glass: rgba(255, 255, 255, 0.12);
          --border-subtle: rgba(255, 255, 255, 0.08);
          --text-primary: #f8fafc;
          --text-secondary: #94a3b8;
          --accent: #38bdf8;
          --accent-amber: #f59e0b;
          --accent-green: #10b981;
          --dock-bg: rgba(18, 24, 38, 0.75);
          --shadow-ambient: 0 12px 35px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.15);
          --card-overlay: linear-gradient(180deg, rgba(20,27,42,0.7) 0%, rgba(12,16,24,0.5) 100%);
        }

        .dashboard-root {
          min-height: calc(100vh - 64px);
          padding: 32px 36px 120px 36px;
          box-sizing: border-box;
          position: relative;
          color: var(--text-primary);
          transition: background 0.5s ease, color 0.3s ease;
        }

        /* Top Bar */
        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .date-title {
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .name-day {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .chips-container {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-surface);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-glass);
          border-radius: 9999px;
          padding: 7px 14px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          box-shadow: var(--shadow-ambient);
          transition: transform 0.2s, background 0.2s;
        }
        .chip:hover {
          transform: translateY(-1px);
          background: var(--bg-surface-hover);
        }

        .chip-dot {
          width: 8px;
          height: 8px;
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
          width: 36px;
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
          box-shadow: var(--shadow-ambient);
          transition: transform 0.2s;
        }
        .theme-toggle:hover {
          transform: scale(1.08);
        }

        /* Layout Grid */
        .dashboard-body {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 24px;
        }
        @media (max-width: 1024px) {
          .dashboard-body { grid-template-columns: 1fr; }
        }

        /* Left Sidebar */
        .sidebar-card {
          background: var(--bg-card);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border: 1px solid var(--border-glass);
          border-radius: 24px;
          padding: 24px;
          box-shadow: var(--shadow-ambient);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .clock-display {
          font-size: 44px;
          font-weight: 700;
          letter-spacing: -1px;
          line-height: 1;
        }

        .weather-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 18px;
          border: 1px solid var(--border-subtle);
        }
        .weather-temp {
          font-size: 26px;
          font-weight: 700;
        }

        .agenda-block {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 10px;
        }
        .agenda-title {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-secondary);
          font-weight: 600;
        }
        .agenda-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
        }

        /* Rooms Bento Grid */
        .rooms-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 1280px) {
          .rooms-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 680px) {
          .rooms-grid { grid-template-columns: 1fr; }
        }

        .room-card {
          position: relative;
          min-height: 170px;
          border-radius: 24px;
          overflow: hidden;
          background: var(--bg-card);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border: 1px solid var(--border-glass);
          box-shadow: var(--shadow-ambient);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 20px;
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s;
        }
        .room-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.28);
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
          font-size: 18px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .room-sub {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 3px;
        }

        .room-temp-badge {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border: 1px solid var(--border-glass);
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
        }

        .room-actions {
          position: relative;
          z-index: 2;
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .action-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border-glass);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
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

        /* Floating Dock */
        .dock-container {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--dock-bg);
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          border: 1px solid var(--border-glass);
          border-radius: 9999px;
          padding: 8px 18px;
          display: flex;
          gap: 14px;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.25);
          z-index: 100;
        }

        .dock-item {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          cursor: pointer;
          transition: transform 0.2s, background 0.2s;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid transparent;
        }
        .dock-item:hover {
          transform: translateY(-4px) scale(1.15);
          background: rgba(255, 255, 255, 0.22);
          border-color: var(--border-glass);
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
          background: var(--bg-card);
          backdrop-filter: blur(35px) saturate(190%);
          -webkit-backdrop-filter: blur(35px) saturate(190%);
          border: 1px solid var(--border-glass);
          border-radius: 28px;
          width: 100%;
          max-width: 720px;
          max-height: 85vh;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.55);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          overscroll-behavior: contain;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-subtle);
          padding: 20px 28px;
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
          padding: 24px 28px;
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
          padding: 14px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .btn-micro {
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid var(--border-glass);
          border-radius: 12px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
        }
        .btn-micro.active {
          background: var(--accent);
          color: #fff;
        }
        .btn-micro.active-amber {
          background: #f59e0b;
          color: #fff;
        }
        .btn-micro.active-green {
          background: #10b981;
          color: #fff;
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
      </style>

      <div class="dashboard-root theme-dark">
        <!-- Top Bar Navigation & Status Chips -->
        <div class="top-bar">
          <div>
            <div class="date-title" id="dateTitle">Mittwoch, 11. November</div>
            <div class="name-day" id="subHeader">Willkommen Andreas Pilz • Smart Home Zentrale</div>
          </div>

          <div class="chips-container">
            <div class="chip" id="chipPersonAndreas" title="Status Andreas">👤 Andreas laden...</div>
            <div class="chip" id="chipPersonShanty" title="Status Shanty">👤 Shanty laden...</div>
            <div class="chip" id="chipLights">💡 Lichter laden...</div>
            <div class="chip" id="chipClimate">🌡️ Klima laden...</div>
            <div class="chip" id="chipLock">🔒 Schloss laden...</div>
            <div class="chip" id="chipAlarmo">🛡️ Alarmo laden...</div>
            <div class="chip" id="chipWeather">🌦️ Wetter...</div>
            <button class="theme-toggle" id="themeToggleBtn" title="Tag/Nacht umschalten">☀️</button>
          </div>
        </div>

        <!-- Dashboard Body Layout -->
        <div class="dashboard-body">
          <!-- Left Glanceable Sidebar -->
          <div class="sidebar-card">
            <div class="clock-display" id="liveClock">--:--:--</div>

            <div class="weather-banner" id="sidebarWeather">
              <div>
                <div class="weather-temp" id="weatherTemp">--°C</div>
                <div style="color:var(--text-secondary);font-size:13px;" id="weatherCondition">Laden...</div>
              </div>
              <div style="font-size:36px;" id="weatherIcon">⛅</div>
            </div>

            <div class="agenda-block" id="sidebarAgenda">
              <div class="agenda-title">Termine & Müllabfuhr</div>
              <div class="agenda-item"><span>Wird geladen...</span></div>
            </div>
          </div>

          <!-- Rooms Grid -->
          <div class="rooms-grid" id="roomsContainer">
            ${this._config.rooms.map((room, idx) => `
              <div class="room-card" id="roomCard_${idx}" data-room-idx="${idx}">
                ${room.picture ? `<div class="room-bg-image" style="background-image:url('${room.picture}');"></div>` : ''}
                <div class="room-header">
                  <div>
                    <div class="room-name">${room.name} &rsaquo;</div>
                    <div class="room-sub">Wird geladen...</div>
                  </div>
                  <div class="room-temp-badge">--°C</div>
                </div>

                <div class="room-actions">
                  ${room.light_entity ? `<div class="action-circle action-light" title="Licht umschalten" data-action="light" data-idx="${idx}">💡</div>` : ''}
                  ${room.climate_entity ? `<div class="action-circle action-climate" title="Heizung öffnen" data-action="climate" data-idx="${idx}">🌡️</div>` : ''}
                  ${room.media_entity ? `<div class="action-circle action-media" title="Medien abspielen/pausieren" data-action="media" data-idx="${idx}">🎵</div>` : ''}
                  ${room.lock_entity ? `<div class="action-circle action-lock" title="Schloss verriegeln/entriegeln" data-action="lock" data-idx="${idx}">🔒</div>` : ''}
                  ${room.switch_entity ? `<div class="action-circle action-switch" title="Steckdose/Gerät umschalten" data-action="switch" data-idx="${idx}">🔌</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Floating Glass Dock -->
        <div class="dock-container">
          <div class="dock-item" id="dockLighting" title="Beleuchtung">💡</div>
          <div class="dock-item" id="dockClimate" title="Heizung & Temperaturkurven">🌡️</div>
          <div class="dock-item" id="dockSecurity" title="Sicherheit & Wohnungsschloss">🔒</div>
          <div class="dock-item" id="dockAlarmo" title="Alarmanlage (Alarmo)">🛡️</div>
          <div class="dock-item" id="dockSwitches" title="Geräte & Steckdosen">🔌</div>
          <div class="dock-item" id="dockBattery" title="Batteriestatus & Wartung">🔋</div>
          <div class="dock-item" id="dockWeather" title="Wetter & Vorhersage">🌦️</div>
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

    // Event Listeners
    this.shadowRoot.getElementById('themeToggleBtn').addEventListener('click', () => this._toggleDayNight());

    // Top Bar Chips
    this.shadowRoot.getElementById('chipPersonAndreas').addEventListener('click', () => this._openModal('security'));
    this.shadowRoot.getElementById('chipPersonShanty').addEventListener('click', () => this._openModal('security'));
    this.shadowRoot.getElementById('chipLights').addEventListener('click', () => this._openModal('lighting'));
    this.shadowRoot.getElementById('chipClimate').addEventListener('click', () => this._openModal('climate'));
    this.shadowRoot.getElementById('chipLock').addEventListener('click', () => this._openModal('security'));
    this.shadowRoot.getElementById('chipAlarmo').addEventListener('click', () => this._openModal('alarmo'));
    this.shadowRoot.getElementById('chipWeather').addEventListener('click', () => this._openModal('weather'));

    // Dock Items
    this.shadowRoot.getElementById('dockLighting').addEventListener('click', () => this._openModal('lighting'));
    this.shadowRoot.getElementById('dockClimate').addEventListener('click', () => this._openModal('climate'));
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
        if (e.target.closest('.action-circle')) return;
        const idx = parseInt(card.getAttribute('data-room-idx'));
        const room = this._config.rooms[idx];
        if (room) {
          this._openRoomModal(room);
        }
      });
    });

    // Room Action Circles
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

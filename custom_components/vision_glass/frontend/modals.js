import { ICONS } from './icons.js';

export const modalMethods = {
  _openPersonModal(targetEntityId) {
    this._activeModal = { type: 'person', targetEntityId };
    const modalEl = this.shadowRoot.getElementById('modalContainer');
    if (modalEl) {
      modalEl.classList.remove('hidden');
      this._renderPersonModal(targetEntityId);
    }
  },

  _renderPersonModal(targetEntityId) {
    const body = this.shadowRoot.getElementById('modalBody');
    const title = this.shadowRoot.getElementById('modalTitle');
    if (!body || !title || !this._hass) return;

    title.innerHTML = `${this._icon('user', { size: 22, cls: 'icon-security', style: 'margin-right:8px;' })} ${this._t('residents')}`;

    const configuredPersons = this._config?.top_bar_persons;
    const allPersonIds = Object.keys(this._hass.states).filter(e => e.startsWith('person.'));
    const activePersonIds = (Array.isArray(configuredPersons) && configuredPersons.length > 0)
      ? configuredPersons.filter(id => this._hass.states[id])
      : allPersonIds;

    const persons = activePersonIds.map(pId => {
      const stateObj = this._hass.states[pId];
      const name = stateObj?.attributes?.friendly_name || pId.replace('person.', '');
      const defaultPic = stateObj?.attributes?.entity_picture || null;
      const cleanName = pId.replace('person.', '').toLowerCase();
      const batKey = Object.keys(this._hass.states).find(e =>
        e.startsWith('sensor.') && e.includes(cleanName) && (e.includes('battery') || e.includes('batterie'))
      );
      return { id: pId, name, defaultPic, batteryEntity: batKey };
    });

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
  },

  _openRoomModal(room) {
    this._activeModal = { type: 'room', room };
    const modalEl = this.shadowRoot.getElementById('modalContainer');
    if (modalEl) {
      modalEl.classList.remove('hidden');
      this._renderRoomModal(room);
    }
  },

  async _fetchWeatherForecast() {
    if (!this._hass) return;
    const wEntity = this._getWeatherEntity();

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
  },

  _updateWeatherModalValues() {
    const body = this.shadowRoot.getElementById('modalBody');
    if (!body || !this._hass) return;
    const wEntity = this._getWeatherEntity();
    const w = wEntity ? this._hass.states[wEntity] : null;
    if (!w) return;
    const a = w.attributes;
    const locName = this._hass?.config?.location_name || 'Home';

    const tempEl = body.querySelector('#weatherHeroTemp');
    if (tempEl && a.temperature != null) tempEl.textContent = `${a.temperature}°C`;

    const condEl = body.querySelector('#weatherHeroCond');
    if (condEl) condEl.textContent = `${this._translateWeather(w.state)} • ${locName}`;

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
  },

  _updateAlarmoModalValues() {
    const body = this.shadowRoot.getElementById('modalBody');
    if (!body || !this._hass) return;
    const alarmo = (this._getAlarmEntity() ? this._hass.states[this._getAlarmEntity()] : null);
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
  },

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
  },

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
  },

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
  },

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
  },
  _openCustomDockModal(item) {
    const modal = this.shadowRoot.getElementById('modalContainer');
    const title = this.shadowRoot.getElementById('modalTitle');
    const body = this.shadowRoot.getElementById('modalBody');
    if (!modal || !title || !body || !this._hass) return;

    const iconName = item.icon || 'star';
    title.innerHTML = `${this._icon(iconName, { size: 22, cls: 'icon-light', style: 'margin-right:8px;' })} ${item.title || 'Menüpunkt'}`;

    const entities = (item.entities || []).map(id => ({ id, state: this._hass.states[id] })).filter(e => e.state);

    if (entities.length === 0) {
      body.innerHTML = `
        <div style="text-align:center;padding:36px 16px;color:var(--text-secondary);">
          <div style="margin-bottom:12px;opacity:0.6;"><ha-icon icon="mdi:folder-outline" style="--mdc-icon-size:36px;"></ha-icon></div>
          <div style="font-size:15px;font-weight:600;color:var(--text-primary);margin-bottom:4px;">Keine Entitäten zugeordnet</div>
          <div style="font-size:13px;">Füge in den Einstellungen unter „Dock & Buttons“ Entitäten zu diesem Menüpunkt hinzu.</div>
        </div>
      `;
      modal.classList.remove('hidden');
      return;
    }

    const switches = entities.filter(e => e.id.startsWith('switch.') || e.id.startsWith('input_boolean.'));
    const lights = entities.filter(e => e.id.startsWith('light.'));
    const climates = entities.filter(e => e.id.startsWith('climate.'));
    const sensors = entities.filter(e => e.id.startsWith('sensor.') || e.id.startsWith('binary_sensor.'));
    const others = entities.filter(e => !switches.includes(e) && !lights.includes(e) && !climates.includes(e) && !sensors.includes(e));

    body.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px;">
        ${switches.length > 0 ? `
          <div style="font-size:13px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;">Schalter & Steckdosen (${switches.length})</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;">
            ${switches.map(s => this._renderSwitchControlRow(s.id, s.state)).join('')}
          </div>
        ` : ''}

        ${lights.length > 0 ? `
          <div style="font-size:13px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;">Beleuchtung (${lights.length})</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;">
            ${lights.map(l => this._renderSwitchControlRow(l.id, l.state)).join('')}
          </div>
        ` : ''}

        ${climates.length > 0 ? `
          <div style="font-size:13px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;">Thermostate (${climates.length})</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;">
            ${climates.map(c => this._renderClimateControlRow(c.id, c.state)).join('')}
          </div>
        ` : ''}

        ${sensors.length > 0 ? `
          <div style="font-size:13px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;">Sensoren & Messwerte (${sensors.length})</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px;">
            ${sensors.map(s => this._renderSensorBadgeHtml(s.id, s.state)).join('')}
          </div>
        ` : ''}

        ${others.length > 0 ? `
          <div style="font-size:13px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;">Weitere Geräte (${others.length})</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px;">
            ${others.map(o => this._renderGenericEntityRow(o.id, o.state)).join('')}
          </div>
        ` : ''}
      </div>
    `;

    this._bindInteractiveRows(body);
    modal.classList.remove('hidden');
  },

  _renderRoomModal(room) {
    const body = this.shadowRoot.getElementById('modalBody');
    const title = this.shadowRoot.getElementById('modalTitle');
    if (!body || !title || !this._hass) return;

    title.textContent = `${room.name} – ${this._t('overview_devices')}`;

    const lightObj = (room.light_entity && room.light_entity.trim()) ? this._hass.states[room.light_entity.trim()] : null;
    const climateObj = (room.climate_entity && room.climate_entity.trim()) ? this._hass.states[room.climate_entity.trim()] : null;
    const presObj = (room.presence_entity && room.presence_entity.trim()) ? this._hass.states[room.presence_entity.trim()] : null;
    const winObj = (room.window_entity && room.window_entity.trim()) ? this._hass.states[room.window_entity.trim()] : null;
    const switchObj = (room.switch_entity && room.switch_entity.trim()) ? this._hass.states[room.switch_entity.trim()] : null;
    const mediaObj = (room.media_entity && room.media_entity.trim()) ? this._hass.states[room.media_entity.trim()] : null;
    const tempObj = (room.temp_entity && room.temp_entity.trim()) ? this._hass.states[room.temp_entity.trim()] : null;
    const doorObj = (room.door_entity && room.door_entity.trim()) ? this._hass.states[room.door_entity.trim()] : null;

    const hasTemp = Boolean((climateObj && climateObj.attributes && climateObj.attributes.current_temperature != null) || (tempObj && tempObj.state && !isNaN(parseFloat(tempObj.state))));
    const curTemp = (climateObj && climateObj.attributes && climateObj.attributes.current_temperature != null)
      ? climateObj.attributes.current_temperature
      : (tempObj && tempObj.state && !isNaN(parseFloat(tempObj.state)) ? parseFloat(tempObj.state).toFixed(1) : null);

    const hasPres = Boolean(presObj && presObj.state != null);
    const hasWin = Boolean(winObj && winObj.state != null);
    const hasDoor = Boolean(doorObj && doorObj.state != null);

    const isLightOn = lightObj && lightObj.state === 'on';
    const isHeat = climateObj && climateObj.state === 'heat';
    const isPres = presObj && presObj.state === 'on';
    const isWinOpen = winObj && winObj.state === 'on';
    const isDoorOpen = doorObj && doorObj.state === 'on';

    const statusPills = [];
    if (hasPres) {
      statusPills.push(isPres ? (this._icon('motion', { size: 14, cls: 'icon-security', style: 'margin-right:4px;' }) + ' ' + this._t('person_present')) : (this._icon('motion-idle', { size: 14, style: 'margin-right:4px;' }) + ' ' + this._t('no_motion')));
    }
    if (hasWin) {
      statusPills.push(isWinOpen ? (this._icon('window-open', { size: 14, cls: 'icon-climate', style: 'margin-right:4px;' }) + ' ' + this._t('window_open')) : (this._icon('window', { size: 14, cls: 'icon-security', style: 'margin-right:4px;' }) + ' ' + this._t('window_closed')));
    } else if (hasDoor) {
      statusPills.push(isDoorOpen ? (this._icon('door-open', { size: 14, cls: 'icon-climate', style: 'margin-right:4px;' }) + ' ' + this._t('door_open')) : (this._icon('door', { size: 14, cls: 'icon-security', style: 'margin-right:4px;' }) + ' ' + this._t('door_closed')));
    }

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
            ${statusPills.length > 0 ? `
              <div style="font-size:13px;color:var(--text-secondary);margin-top:3px;">
                ${statusPills.join(' • ')}
              </div>
            ` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            ${(hasTemp && curTemp != null) ? `
              <div style="text-align:center;padding:6px 12px;background:rgba(255,255,255,0.06);border:1px solid var(--border-subtle);border-radius:14px;">
                <div style="font-size:19px;font-weight:700;color:var(--accent);">${curTemp}°C</div>
                <div style="font-size:11px;color:var(--text-secondary);display:flex;align-items:center;justify-content:center;gap:3px;margin-top:1px;">${this._icon('thermometer', { size: 11, cls: 'icon-temp' })} ${this._t('temp')}</div>
              </div>
            ` : ''}
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
              <div class="vg-switch ${mmSwitchObj.state === 'on' ? 'active' : ''}" id="roomModalMultimediaToggle" role="switch">
                <div class="vg-switch-thumb"></div>
              </div>
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
            const switchesOrLights = ents.filter(e => e.id.startsWith('switch.') || e.id.startsWith('light.') || e.id.startsWith('input_boolean.'));
            const sensorsOrBin = ents.filter(e => e.id.startsWith('sensor.') || e.id.startsWith('binary_sensor.'));
            const otherEnts = ents.filter(e => !switchesOrLights.includes(e) && !sensorsOrBin.includes(e));
            return `
              <div style="font-size:14px;font-weight:700;margin-top:10px;">${cat.name} (${ents.length})</div>
              ${switchesOrLights.length > 0 ? `
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;">
                  ${switchesOrLights.map(s => this._renderSwitchControlRow(s.id, s.state)).join('')}
                </div>
              ` : ''}
              ${sensorsOrBin.length > 0 ? `
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px;">
                  ${sensorsOrBin.map(s => this._renderSensorBadgeHtml(s.id, s.state)).join('')}
                </div>
              ` : ''}
              ${otherEnts.length > 0 ? `
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;">
                  ${otherEnts.map(o => this._renderGenericEntityRow(o.id, o.state)).join('')}
                </div>
              ` : ''}
            `;
          }).join('')}
        ` : `
          ${otherSwitches.length > 0 ? `
            <div style="font-size:14px;font-weight:700;margin-top:8px;">${this._t('other_devices')} (${otherSwitches.length})</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;">
              ${otherSwitches.map(s => this._renderSwitchControlRow(s.id, s.state)).join('')}
            </div>
          ` : ''}

          ${otherSensors.length > 0 ? `
            <div style="font-size:14px;font-weight:700;margin-top:8px;">${this._t('measurements_sensors')} (${otherSensors.length})</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px;">
              ${otherSensors.map(s => this._renderSensorBadgeHtml(s.id, s.state)).join('')}
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
    if (mmSwitchObj && body.querySelector('#roomModalMultimediaToggle')) {
      body.querySelector('#roomModalMultimediaToggle').onclick = () => {
        const sw = body.querySelector('#roomModalMultimediaToggle');
        sw.classList.toggle('active');
        this._callService('switch', 'toggle', { entity_id: room.multimedia_switch });
      };
    }
    this._bindInteractiveRows(body);
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
  },
  _getWeatherEmoji(state) {
    return this._getWeatherIcon(state, 24);
  },

  _openModal(type) {
    if (type === 'settings') {
      this._setViewMode('settings');
      return;
    }
    this._activeModal = type;
    const modalEl = this.shadowRoot.getElementById('modalContainer');
    if (modalEl) {
      modalEl.classList.remove('hidden');
      if (type === 'weather') {
        this._fetchWeatherForecast();
      }
      this._renderModalContent(type);
    }
  },

  _closeModal() {
    this._activeModal = null;
    const modalEl = this.shadowRoot.getElementById('modalContainer');
    if (modalEl) modalEl.classList.add('hidden');
  },

  _renderStatsPageView(container) {
    if (!container || !this._hass) return;
    this._renderModalContent('stats', container);
  },

  _renderModalContent(type, customContainer = null) {
    const body = customContainer || this.shadowRoot.getElementById('modalBody');
    const title = customContainer ? null : this.shadowRoot.getElementById('modalTitle');
    if (!body || (!customContainer && !title) || !this._hass) return;

    if (type === 'lighting') {
      title.innerHTML = `${this._icon('light', { size: 22, cls: 'icon-light', style: 'margin-right:8px;' })} ${this._t('lighting_control')}`;
      const seenLights = new Set();
      const allLights = [];
      const allLightsEntity = this._config.all_lights_entity || Object.keys(this._hass.states).find(e => e.startsWith('light.') && (e.includes('alle') || e.includes('all') || e.includes('wohnung') || e.includes('home')));
      if (allLightsEntity && this._hass.states[allLightsEntity]) {
        seenLights.add(allLightsEntity);
        allLights.push({ id: allLightsEntity, name: this._hass.states[allLightsEntity].attributes?.friendly_name || this._t('all_lights_apartment') });
      }
      (this._config.rooms || []).forEach(r => {
        if (r.light_entity && !seenLights.has(r.light_entity) && this._hass.states[r.light_entity]) {
          seenLights.add(r.light_entity);
          allLights.push({ id: r.light_entity, name: `${r.name || r.id} ${this._t('lighting')}` });
        }
      });
      Object.keys(this._hass.states).filter(e => e.startsWith('light.') && !seenLights.has(e)).slice(0, 20).forEach(eId => {
        seenLights.add(eId);
        allLights.push({ id: eId, name: this._hass.states[eId].attributes?.friendly_name || eId });
      });

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
        const tgt = this._config.all_lights_entity || allLights.map(l => l.id); this._callService('light', 'turn_on', { entity_id: tgt });
      };
      body.querySelector('#modalAllOff').onclick = () => {
        const tgt = this._config.all_lights_entity || allLights.map(l => l.id); this._callService('light', 'turn_off', { entity_id: tgt });
      };
      body.querySelectorAll('.toggle-pill[data-light]').forEach(btn => {
        btn.onclick = () => {
          const lId = btn.getAttribute('data-light');
          this._callService('light', 'toggle', { entity_id: lId });
        };
      });
    } else if (type === 'climate') {
      title.innerHTML = `${this._icon('climate', { size: 22, cls: 'icon-climate', style: 'margin-right:8px;' })} ${this._t('climate_control')}`;
      const thermostats = [];
      const seenClimates = new Set();
      (this._config.rooms || []).forEach(r => {
        if (r.climate_entity && this._hass.states[r.climate_entity] && !seenClimates.has(r.climate_entity)) {
          seenClimates.add(r.climate_entity);
          thermostats.push({
            id: r.climate_entity,
            roomName: r.name || r.id,
            tempSensor: r.temp_entity || r.climate_entity,
            targetHelper: r.target_temp_entity || null
          });
        }
      });
      Object.keys(this._hass.states).filter(e => e.startsWith('climate.') && !seenClimates.has(e)).forEach(cId => {
        seenClimates.add(cId);
        thermostats.push({
          id: cId,
          roomName: this._hass.states[cId].attributes?.friendly_name || cId,
          tempSensor: cId,
          targetHelper: null
        });
      });

      if (!this._historyFetched && thermostats.length > 0) {
        this._historyFetched = true;
        this._loadStatsModule().then(async (sc) => {
          const histIds = [...new Set(thermostats.map(t => t.tempSensor).filter(Boolean))];
          const series = await sc.fetchHistoryViaBackend(this._hass, histIds, 24, 96);
          Object.entries(series).forEach(([eId, entry]) => {
            if (entry && Array.isArray(entry.points) && entry.points.length > 0) {
              this._tempHistory[eId] = entry.points.map(p => p[1]);
            }
          });
          if (this._activeModal === 'climate') this._renderModalContent('climate');
        });
      }

      body.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:14px;">
          ${thermostats.map((t, idx) => {
            const s = this._hass.states[t.id];
            const cur = s && s.attributes.current_temperature ? s.attributes.current_temperature : (this._hass.states[t.tempSensor] ? this._hass.states[t.tempSensor].state : '--');
            const target = s && s.attributes.temperature ? s.attributes.temperature : 21.0;
            const isHeat = s && s.state === 'heat';
            const roomName = t.roomName;

            const historyVals = this._tempHistory[t.tempSensor];
            const curve = this._statsChartsMod ? this._statsChartsMod.generateSvgCurve(historyVals, cur, 290, 55) : this._fallbackSvgCurve(cur);

            const komfortHelperId = t.targetHelper || null;
            const ecoHelperId = null;
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
      const lockEntity = this._config.lock_entity || Object.keys(this._hass.states).find(e => e.startsWith('lock.'));
      const lockObj = lockEntity ? this._hass.states[lockEntity] : null;
      const allDoorContacts = Object.keys(this._hass.states).filter(e => {
        if (!e.startsWith('binary_sensor.')) return false;
        const dc = (this._hass.states[e].attributes?.device_class || '').toLowerCase();
        return dc === 'door' || dc === 'window' || dc === 'opening' || e.includes('fenster') || e.includes('turkontakt') || e.includes('door') || e.includes('window');
      });
      const mainDoorId = this._config.door_entity || allDoorContacts.find(e => e.includes('haustur') || e.includes('front_door') || this._hass.states[e].attributes?.device_class === 'door');
      const doorObj = mainDoorId ? this._hass.states[mainDoorId] : null;
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

      const contacts = allDoorContacts.map(eId => {
        const dc = (this._hass.states[eId].attributes?.device_class || '').toLowerCase();
        return {
          id: eId,
          name: this._hass.states[eId].attributes?.friendly_name || eId,
          iconName: (dc === 'door' || eId.includes('tur')) ? 'door' : 'window'
        };
      });

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
        if (lockEntity) this._callService('lock', 'lock', { entity_id: lockEntity });
      };
      body.querySelector('#btnUnlockAction').onclick = () => {
        if (lockEntity) this._callService('lock', 'unlock', { entity_id: lockEntity });
      };
    } else if (type === 'alarmo') {
      title.innerHTML = `${this._icon('shield', { size: 22, cls: 'icon-alarmo', style: 'margin-right:8px;' })} ${this._t('alarmo')}`;
      const alarmo = (this._getAlarmEntity() ? this._hass.states[this._getAlarmEntity()] : null);
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
      const seenSw = new Set();
      const switches = [];
      (this._config.rooms || []).forEach(r => {
        [r.multimedia_switch, r.switch_entity].filter(Boolean).forEach(sId => {
          if (!seenSw.has(sId) && this._hass.states[sId]) {
            seenSw.add(sId);
            switches.push({ id: sId });
          }
        });
      });
      Object.keys(this._hass.states).filter(e => e.startsWith('switch.') && !seenSw.has(e) && !e.includes('indicator') && !e.includes('restart')).slice(0, 24).forEach(sId => {
        seenSw.add(sId);
        switches.push({ id: sId });
      });

      body.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;">
          ${switches.map(sw => {
            const s = this._hass.states[sw.id];
            return this._renderSwitchControlRow(sw.id, s);
          }).join('')}
        </div>
      `;

      this._bindInteractiveRows(body);
    } else if (type === 'weather') {
      title.innerHTML = `${this._icon('weather-partlycloudy', { size: 22, cls: 'icon-weather', style: 'margin-right:8px;' })} ${this._t('weather_modal_title')}`;

      const existingIframe = body.querySelector('#weatherRadarIframe');
      if (existingIframe) {
        this._updateWeatherModalValues();
        this._updateForecastCarousels();
        return;
      }

      const wEntity = this._getWeatherEntity();
      const w = wEntity ? this._hass.states[wEntity] : null;
      if (!w) {
        body.innerHTML = `<div>${this._t('no_data_available')}</div>`;
        return;
      }
      const a = w.attributes;
      const lat = Number(this._hass?.config?.latitude ?? 52.3889).toFixed(4);
      const lon = Number(this._hass?.config?.longitude ?? 9.8297).toFixed(4);
      const locName = this._hass?.config?.location_name || 'Home';
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
                <div style="font-size:16px;color:var(--text-secondary);font-weight:500;" id="weatherHeroCond">${this._translateWeather(w.state)} • ${locName}</div>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:12px;color:var(--text-secondary);font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${this._t('today')}</div>
              <div style="font-size:18px;font-weight:700;margin-top:2px;" id="weatherHeroToday">
                ${dailyItems[0] && dailyItems[0].templow != null ? `${Math.round(dailyItems[0].templow)}° / ` : ''}${dailyItems[0] ? `${Math.round(dailyItems[0].temperature)}°C` : `${a.temperature}°C`}
              </div>
              <div style="font-size:11px;color:var(--accent);margin-top:4px;">${a.attribution || w.attributes?.friendly_name || 'Weather'}</div>
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
                <a href="https://www.rainviewer.com/map.html?loc=${lat},${lon},9" target="_blank" rel="noopener" style="font-size:12px;color:var(--accent);text-decoration:none;font-weight:600;margin-left:4px;">
                  ${this._t('fullscreen')} &nearr;
                </a>
              </div>
            </div>
<div style="position:relative;width:100%;height:340px;border-radius:20px;overflow:hidden;border:1px solid var(--border-glass);background:rgba(0,0,0,0.3);box-shadow:0 8px 24px rgba(0,0,0,0.25);">
              <iframe
                id="weatherRadarIframe"
                src="https://www.rainviewer.com/map.html?loc=${lat},${lon},9&oFa=0&oC=1&oU=0&oCS=1&oF=0&oAP=1&rmt=4&c=1&o=83&lm=1&th=0&sm=1&sn=1"
                width="100%"
                height="100%"
                frameborder="0"
                style="border:none;"
                loading="lazy"
                title="Niederschlagsradar">
              </iframe>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--text-secondary);margin-top:2px;">
              <span>${this._icon('map-pin', { size: 12, style: 'margin-right:4px;' })} ${locName} (${lat}° N, ${lon}° E)</span>
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
          iframe.src = 'https://www.rainviewer.com/map.html?loc=${lat},${lon},9&oFa=0&oC=1&oU=0&oCS=1&oF=0&oAP=1&rmt=4&c=1&o=83&lm=1&th=0&sm=1&sn=1';
          if (lbl) lbl.textContent = 'RainViewer HD Niederschlagsradar';
        };
        btnWindy.onclick = () => {
          btnWindy.classList.add('active');
          btnRain.classList.remove('active');
          iframe.src = 'https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&zoom=9&level=surface&overlay=radar&product=radar&menu=&message=&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1';
          if (lbl) lbl.textContent = 'Windy Wetterradar';
        };
      }
    } else if (type === 'stats') {
      if (title) {
        title.innerHTML = `${this._icon('chart-bar', { size: 22, cls: 'icon-stats', style: 'margin-right:8px;' })} ${this._t('stats_title')}`;
      }

      const updateStatsUi = () => {
        if (customContainer) {
          this._renderStatsPageView(customContainer);
        } else if (this._activeModal === 'stats') {
          this._renderModalContent('stats');
        }
      };

      if (!this._statsChartsMod) {
        body.innerHTML = `<div style="padding:28px;text-align:center;color:var(--text-secondary);">${this._t('loading')}</div>`;
        this._loadStatsModule().then(() => {
          updateStatsUi();
        });
        return;
      }

      if (!this._statsHistoryFetched) {
        this._statsHistoryFetched = true;
        const statEntities = this._statsChartsMod.collectDashboardStatEntities(this);
        this._statsChartsMod.fetchHistoryViaBackend(this._hass, statEntities, 24, 120).then((series) => {
          Object.assign(this._statsHistory, series);
          updateStatsUi();
        });
      }

      const statsConf = this._config.stats || {};
      const roomStatsConf = statsConf.rooms || {};
      const customSections = Array.isArray(statsConf.custom_sections) ? statsConf.custom_sections : [];

      let tab = this._statsTab || 'temperature';
      // Ensure tab is valid
      const validTabs = [];
      if (statsConf.show_temperature !== false) validTabs.push('temperature');
      if (statsConf.show_illuminance !== false) validTabs.push('illuminance');
      if (statsConf.show_battery !== false) validTabs.push('battery');
      customSections.forEach(cs => validTabs.push(`custom_${cs.id}`));
      if (validTabs.length > 0 && !validTabs.includes(tab)) {
        tab = validTabs[0];
        this._statsTab = tab;
      }

      const palette = ['#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#a855f7', '#6366f1', '#14b8a6'];
      const roomSensorsConfig = {};
      (this._config.rooms || []).forEach(r => {
        if (!r) return;
        const roomCfg = roomStatsConf[r.id];
        let isEnabled = true;
        if (roomCfg && typeof roomCfg.enabled === 'boolean') {
          isEnabled = roomCfg.enabled;
        } else if (Array.isArray(statsConf.enabled_rooms)) {
          isEnabled = statsConf.enabled_rooms.includes(r.id);
        } else {
          // Default: enable if room has any temp, climate or illuminance entity
          const hasAny = r.temp_entity || r.climate_entity || r.illuminance_entity;
          isEnabled = !!hasAny;
        }
        if (!isEnabled) return;

        // Determine temperature entities for this room
        let tempIds = [];
        if (roomCfg && Array.isArray(roomCfg.temp_entities)) {
          tempIds = roomCfg.temp_entities;
        } else {
          const discoveredTemp = new Set();
          if (r.temp_entity) discoveredTemp.add(r.temp_entity);
          if (this._discovery && this._discovery.entities) {
            Object.values(this._discovery.entities).forEach(meta => {
              if (meta.area_id === r.id && meta.domain === 'sensor' && meta.device_class === 'temperature') {
                discoveredTemp.add(meta.entity_id);
              }
            });
          }
          if (discoveredTemp.size === 0 && r.climate_entity && this._hass?.states[r.climate_entity]) {
            discoveredTemp.add(r.climate_entity);
          }
          tempIds = [...discoveredTemp];
        }

        // Determine illuminance entities for this room
        let illumIds = [];
        if (roomCfg && Array.isArray(roomCfg.illum_entities)) {
          illumIds = roomCfg.illum_entities;
        } else {
          const discoveredIllum = new Set();
          if (r.illuminance_entity) discoveredIllum.add(r.illuminance_entity);
          if (this._discovery && this._discovery.entities) {
            Object.values(this._discovery.entities).forEach(meta => {
              if (meta.area_id === r.id && meta.domain === 'sensor' && meta.device_class === 'illuminance') {
                discoveredIllum.add(meta.entity_id);
              }
            });
          }
          illumIds = [...discoveredIllum];
        }

        roomSensorsConfig[r.id] = {
          name: r.name || r.id,
          climate_entity: r.climate_entity || null,
          light_entity: r.light_entity || null,
          presence_entity: r.presence_entity || null,
          temp_sensors: tempIds.map((id, i) => {
            const friendly = this._hass.states[id]?.attributes?.friendly_name;
            const fallbackName = id.startsWith('climate.') ? `${r.name || r.id} Thermostat` : id;
            return {
              id,
              name: friendly || fallbackName,
              color: palette[i % palette.length]
            };
          }),
          illum_sensors: illumIds.map((id, i) => ({
            id,
            name: this._hass.states[id]?.attributes?.friendly_name || id,
            color: palette[i % palette.length]
          }))
        };
      });

      const roomKeys = Object.keys(roomSensorsConfig);
      const selectedRoom = (this._statsRoom && roomSensorsConfig[this._statsRoom]) ? this._statsRoom : (roomKeys[0] || null);
      let tabContent = '';

      if (tab.startsWith('custom_')) {
        const customId = tab.replace('custom_', '');
        const customSec = customSections.find(s => s.id === customId);
        if (!customSec) {
          tabContent = `<div style="padding:18px;color:var(--text-secondary);">${this._t('no_data_available')}</div>`;
        } else {
          const seriesData = (customSec.entities || []).map((ent, i) => {
            const eId = typeof ent === 'string' ? ent : ent?.id;
            const customName = (typeof ent === 'object' && ent.name) ? ent.name : (this._hass.states[eId]?.attributes?.friendly_name || eId);
            const customColor = (typeof ent === 'object' && ent.color) ? ent.color : palette[i % palette.length];
            return {
              id: eId,
              name: customName,
              color: customColor,
              currentVal: this._hass.states[eId]?.state ?? null
            };
          });
          const chart = this._statsChartsMod.renderMultiLineSvgChart(this, {
            series: seriesData,
            width: 780,
            height: 320,
            unit: customSec.unit || '',
            timeSpanHours: 24
          });
          tabContent = `
            <div style="background:rgba(255,255,255,0.06);border:1px solid var(--border-subtle);border-radius:20px;padding:16px 18px;display:flex;flex-direction:column;gap:12px;">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                <div>
                  <span style="font-weight:700;font-size:16px;display:flex;align-items:center;gap:6px;">
                    ${customSec.icon ? `<ha-icon icon="${customSec.icon}" style="--mdc-icon-size:18px;"></ha-icon>` : ''} ${customSec.title}
                  </span>
                  <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">24h Verlauf (${customSec.unit || 'Werte'})</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:11px;color:var(--text-secondary);">Min: ${chart.min}${customSec.unit || ''} • Max: ${chart.max}${customSec.unit || ''}</div>
                </div>
              </div>
              <div style="width:100%;overflow-x:auto;">${chart.svg}</div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;">
              ${seriesData.map(s => `
                <div class="control-row" style="padding:10px 14px;border-left:4px solid ${s.color};min-width:0;box-sizing:border-box;">
                  <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:6px;">
                      <span style="width:10px;height:10px;border-radius:50%;background:${s.color};display:inline-block;flex-shrink:0;"></span>
                      <span style="font-weight:600;font-size:13px;white-space:normal;line-height:1.3;word-break:break-word;">${s.name}</span>
                    </div>
                  </div>
                  <div style="text-align:right;flex-shrink:0;margin-left:10px;">
                    <span style="font-size:16px;font-weight:700;color:${s.color};white-space:nowrap;">${s.currentVal != null ? `${s.currentVal}${customSec.unit || ''}` : '--'}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        }
      } else if (roomKeys.length === 0 && (tab === 'temperature' || tab === 'illuminance')) {
        tabContent = `<div style="padding:18px;color:var(--text-secondary);">${this._t('no_data_available')}</div>`;
      } else if (tab === 'temperature') {
        const currentRoomConf = roomSensorsConfig[selectedRoom];
        if (!currentRoomConf || !currentRoomConf.temp_sensors || currentRoomConf.temp_sensors.length === 0) {
          tabContent = `
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
              ${roomKeys.map(rKey => `<button class="btn-micro ${selectedRoom === rKey ? 'active' : ''}" data-stat-room="${rKey}">${roomSensorsConfig[rKey].name}</button>`).join('')}
            </div>
            <div style="background:rgba(255,255,255,0.06);border:1px solid var(--border-subtle);border-radius:20px;padding:32px;text-align:center;color:var(--text-secondary);">
              Keine Temperatur-Sensoren in diesem Raum konfiguriert.
            </div>
          `;
        } else {
          const seriesData = currentRoomConf.temp_sensors.map(s => ({
            ...s,
            currentVal: this._hass.states[s.id]?.state ?? null
          }));
          const climObj = currentRoomConf.climate_entity ? this._hass.states[currentRoomConf.climate_entity] : null;
          const isHeating = climObj && (climObj.state === 'heat' || climObj.attributes?.hvac_action === 'heating' || climObj.attributes?.call_for_heat === true);
          const chart = this._statsChartsMod.renderMultiLineSvgChart(this, {
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
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
              ${roomKeys.map(rKey => `<button class="btn-micro ${selectedRoom === rKey ? 'active' : ''}" data-stat-room="${rKey}">${roomSensorsConfig[rKey].name}</button>`).join('')}
            </div>
            <div style="background:rgba(255,255,255,0.06);border:1px solid var(--border-subtle);border-radius:20px;padding:16px 18px;display:flex;flex-direction:column;gap:12px;">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                <div>
                  <span style="font-weight:700;font-size:16px;">${currentRoomConf.name} • ${this._t('temp_curve_heating')}</span>
                  <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">${this._t('all_sensors_24h')}</div>
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
              <div style="width:100%;overflow-x:auto;">${chart.svg}</div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;">
              ${seriesData.map(s => `
                <div class="control-row" style="padding:10px 14px;border-left:4px solid ${s.color};min-width:0;box-sizing:border-box;">
                  <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:6px;">
                      <span style="width:10px;height:10px;border-radius:50%;background:${s.color};display:inline-block;flex-shrink:0;"></span>
                      <span style="font-weight:600;font-size:13px;white-space:normal;line-height:1.3;word-break:break-word;">${s.name}</span>
                    </div>
                  </div>
                  <div style="text-align:right;flex-shrink:0;margin-left:10px;">
                    <span style="font-size:16px;font-weight:700;color:${s.color};white-space:nowrap;">${s.currentVal != null ? `${s.currentVal}°C` : '--'}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        }
      } else if (tab === 'illuminance') {
        const currentRoomConf = roomSensorsConfig[selectedRoom];
        if (!currentRoomConf || !currentRoomConf.illum_sensors || currentRoomConf.illum_sensors.length === 0) {
          tabContent = `
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
              ${roomKeys.map(rKey => `<button class="btn-micro ${selectedRoom === rKey ? 'active' : ''}" data-stat-room="${rKey}">${roomSensorsConfig[rKey].name}</button>`).join('')}
            </div>
            <div style="background:rgba(255,255,255,0.06);border:1px solid var(--border-subtle);border-radius:20px;padding:32px;text-align:center;color:var(--text-secondary);">
              Keine Helligkeits-Sensoren in diesem Raum konfiguriert.
            </div>
          `;
        } else {
          const seriesData = currentRoomConf.illum_sensors.map(s => ({
            ...s,
            currentVal: this._hass.states[s.id]?.state ?? null
          }));
          const lightObj = currentRoomConf.light_entity ? this._hass.states[currentRoomConf.light_entity] : null;
          const isLightOn = lightObj && lightObj.state === 'on';
          const chart = this._statsChartsMod.renderMultiLineSvgChart(this, {
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
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
              ${roomKeys.map(rKey => `<button class="btn-micro ${selectedRoom === rKey ? 'active' : ''}" data-stat-room="${rKey}">${roomSensorsConfig[rKey].name}</button>`).join('')}
            </div>
            <div style="background:rgba(255,255,255,0.06);border:1px solid var(--border-subtle);border-radius:20px;padding:16px 18px;display:flex;flex-direction:column;gap:12px;">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                <div>
                  <span style="font-weight:700;font-size:16px;">${currentRoomConf.name} • ${this._t('illum_curve_lighting')}</span>
                  <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">${this._t('lux_curve_24h')}</div>
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
              <div style="width:100%;overflow-x:auto;">${chart.svg}</div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;">
              ${seriesData.map(s => `
                <div class="control-row" style="padding:10px 14px;border-left:4px solid ${s.color};min-width:0;box-sizing:border-box;">
                  <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:6px;">
                      <span style="width:10px;height:10px;border-radius:50%;background:${s.color};display:inline-block;flex-shrink:0;"></span>
                      <span style="font-weight:600;font-size:13px;white-space:normal;line-height:1.3;word-break:break-word;">${s.name}</span>
                    </div>
                  </div>
                  <div style="text-align:right;flex-shrink:0;margin-left:10px;">
                    <span style="font-size:16px;font-weight:700;color:${s.color};white-space:nowrap;">${s.currentVal != null ? `${s.currentVal} lx` : '--'}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        }
      } else if (tab === 'battery') {
        const battSum = this._summary?.batteries;
        const battPool = battSum
          ? [...(battSum.critical || []), ...(battSum.low || []), ...(battSum.good || [])].slice(0, 6)
          : Object.keys(this._hass.states)
              .filter(e => e.startsWith('sensor.') && this._hass.states[e]?.attributes?.device_class === 'battery')
              .slice(0, 6)
              .map(e => ({ entity_id: e, name: this._hass.states[e]?.attributes?.friendly_name || e }));

        const seriesData = battPool.map((b, i) => ({
          id: b.entity_id,
          name: b.name,
          color: palette[i % palette.length],
          currentVal: this._hass.states[b.entity_id]?.state ?? null
        }));
        const chart = this._statsChartsMod.renderMultiLineSvgChart(this, {
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
              <div style="text-align:right;"><span style="font-size:13px;color:var(--accent);font-weight:700;">24h Status</span></div>
            </div>
            <div style="width:100%;overflow-x:auto;">${chart.svg}</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;">
            ${seriesData.map(s => `
              <div class="control-row" style="padding:10px 14px;border-left:4px solid ${s.color};min-width:0;box-sizing:border-box;">
                <div style="flex:1;min-width:0;">
                  <div style="font-weight:600;font-size:13px;white-space:normal;line-height:1.3;word-break:break-word;">${s.name}</div>
                </div>
                <div style="text-align:right;flex-shrink:0;margin-left:10px;"><span style="font-size:16px;font-weight:700;color:${s.color};">${s.currentVal != null ? `${s.currentVal}%` : '--'}</span></div>
              </div>
            `).join('')}
          </div>
        `;
      }

      body.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
            ${statsConf.show_temperature !== false ? `<button class="btn-micro ${tab === 'temperature' ? 'active' : ''}" id="btnStatsTabTemp">${this._icon('thermometer', { size: 14, style: 'margin-right:4px;' })} ${this._t('room_temperatures')}</button>` : ''}
            ${statsConf.show_illuminance !== false ? `<button class="btn-micro ${tab === 'illuminance' ? 'active' : ''}" id="btnStatsTabIllum">${this._icon('lux', { size: 14, style: 'margin-right:4px;' })} ${this._t('illuminance_lux')}</button>` : ''}
            ${statsConf.show_battery !== false ? `<button class="btn-micro ${tab === 'battery' ? 'active' : ''}" id="btnStatsTabBat">${this._icon('battery-full', { size: 14, style: 'margin-right:4px;' })} ${this._t('battery_curves')}</button>` : ''}
            ${customSections.map(cs => `
              <button class="btn-micro ${tab === 'custom_' + cs.id ? 'active' : ''}" data-custom-stat-tab="${cs.id}">
                ${cs.icon ? `<ha-icon icon="${cs.icon}" style="--mdc-icon-size:14px;margin-right:4px;"></ha-icon>` : ''} ${cs.title}
              </button>
            `).join('')}
            ${!customContainer ? `
              <button type="button" class="btn-micro" id="btnOpenFullStatsView" style="margin-left:auto;color:var(--accent);">
                ${this._icon('chart-bar', { size: 14, style: 'margin-right:4px;' })} ${this._t('open_full_stats')}
              </button>
            ` : ''}
          </div>
          ${tabContent}
        </div>
      `;

      const btnTemp = body.querySelector('#btnStatsTabTemp');
      if (btnTemp) btnTemp.onclick = () => { this._statsTab = 'temperature'; updateStatsUi(); };
      const btnIllum = body.querySelector('#btnStatsTabIllum');
      if (btnIllum) btnIllum.onclick = () => { this._statsTab = 'illuminance'; updateStatsUi(); };
      const btnBat = body.querySelector('#btnStatsTabBat');
      if (btnBat) btnBat.onclick = () => { this._statsTab = 'battery'; updateStatsUi(); };

      body.querySelectorAll('[data-custom-stat-tab]').forEach(btn => {
        btn.onclick = () => {
          this._statsTab = 'custom_' + btn.getAttribute('data-custom-stat-tab');
          updateStatsUi();
        };
      });
      body.querySelectorAll('[data-stat-room]').forEach(btn => {
        btn.onclick = () => { this._statsRoom = btn.getAttribute('data-stat-room'); updateStatsUi(); };
      });
      const btnFull = body.querySelector('#btnOpenFullStatsView');
      if (btnFull) {
        btnFull.onclick = () => {
          this._closeModal();
          this._setViewMode('stats');
        };
      }
    }
  }
};

import { ICONS } from './icons.js';

export const settingsMethods = {
  _isEntityInRoom(eId, roomId, roomName) {
    if (!eId) return false;
    if (!roomId && !roomName) return true;
    const rId = (roomId || '').toLowerCase();
    const rName = (roomName || '').toLowerCase();
    const eLower = eId.toLowerCase();

    // 0. Python backend registry mapping
    if (this._discovery?.entities?.[eId]?.area_id) {
      if (this._discovery.entities[eId].area_id.toLowerCase() === rId) return true;
    }
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
  },

  _showEntityPicker({ currentValue = '', roomId = null, roomName = null, defaultDomain = 'all', onSelect }) {
    let pickerOverlay = this.shadowRoot.getElementById('entityPickerOverlay');
    if (pickerOverlay) pickerOverlay.remove();

    pickerOverlay = document.createElement('div');
    pickerOverlay.id = 'entityPickerOverlay';
    pickerOverlay.style.cssText = `
      position: fixed;
      top: var(--header-height, 56px);
      left: 0;
      right: 0;
      bottom: 0;
      height: calc(100vh - var(--header-height, 56px));
      background: rgba(0, 0, 0, 0.72);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      z-index: 200;
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
        max-height: calc(100vh - var(--header-height, 56px) - 32px);
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
  },

  _renderSettingsContent(container, isModal = false) {
    if (!container || !this._config) return;
    this._ensureDiscovery?.();

    if (!this._settingsActiveTab) this._settingsActiveTab = 'rooms';
    const activeTab = this._settingsActiveTab;

    const rooms = this._config.rooms || [];
    const defaultDockItems = [
      { id: 'lighting', title: this._t('lighting'), enabled: true, auto_hide: true },
      { id: 'climate', title: this._t('climate'), enabled: true, auto_hide: true },
      { id: 'stats', title: this._t('stats'), enabled: true, auto_hide: false },
      { id: 'security', title: this._t('security'), enabled: true, auto_hide: false },
      { id: 'alarmo', title: this._t('alarmo'), enabled: true, auto_hide: true },
      { id: 'switches', title: this._t('switches'), enabled: true, auto_hide: true },
      { id: 'battery', title: this._t('battery'), enabled: true, auto_hide: true },
      { id: 'weather', title: this._t('weather'), enabled: true, auto_hide: false }
    ];
    if (!this._config.dock) {
      this._config.dock = { auto_detect: true, items: JSON.parse(JSON.stringify(defaultDockItems)) };
    } else if (!this._config.dock.items || this._config.dock.items.length === 0) {
      this._config.dock.items = JSON.parse(JSON.stringify(defaultDockItems));
    }
    const dock = this._config.dock;
    const allEntities = this._hass ? Object.keys(this._hass.states).sort() : [];
    if (!this._config.bento_badges) {
      this._config.bento_badges = this._getEffectiveBentoBadges();
    }
    const bentoBadges = this._config.bento_badges;

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
        <button type="button" id="btnBackToDashboard" class="btn btn-sm" style="display:inline-flex;align-items:center;gap:6px;">
          &larr; Zum Dashboard
        </button>
      </div>

      <!-- Settings Navigation Tabs -->
      <div class="nav-tabs" style="display:flex;flex-wrap:wrap;gap:8px;border-bottom:1px solid var(--border-subtle);padding-bottom:12px;margin-bottom:16px;">
        <button class="nav-tab ${activeTab === 'rooms' ? 'active' : ''}" data-stab="rooms">🏠 ${this._t('rooms_and_cards')} (${rooms.length})</button>
        <button class="nav-tab ${activeTab === 'badges' ? 'active' : ''}" data-stab="badges">🏷️ Bento-Badges (${bentoBadges.length})</button>
        <button class="nav-tab ${activeTab === 'overlays' ? 'active' : ''}" data-stab="overlays">📂 Raum-Overlays</button>
        <button class="nav-tab ${activeTab === 'dock' ? 'active' : ''}" data-stab="dock">⚓ ${this._t('dock_navigation')}</button>
        <button class="nav-tab ${activeTab === 'controls' ? 'active' : ''}" data-stab="controls">🎛️ Helfer-Kontrollen</button>
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

                <!-- Bento Card Action Icons Configuration -->
                <div style="margin-top:12px;padding-top:10px;border-top:1px dashed var(--border-subtle);grid-column:1 / -1;">
                  <label style="font-size:11px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;display:block;margin-bottom:6px;">Aktions-Icons auf Bento-Karte</label>
                  <div style="display:flex;gap:12px;flex-wrap:wrap;">
                    ${(() => {
                      const acts = this._getRoomBentoActions(r);
                      const allTypes = [
                        { type: 'light', label: '💡 Licht', has: Boolean(r.light_entity) },
                        { type: 'climate', label: '🌡️ Heizung', has: Boolean(r.climate_entity) },
                        { type: 'media', label: '🎵 Medien', has: Boolean(r.media_entity || r.audio_entity || r.video_entity) },
                        { type: 'lock', label: '🔒 Schloss', has: Boolean(r.lock_entity) },
                        { type: 'switch', label: '🔌 Steckdose', has: Boolean(r.switch_entity) }
                      ];
                      return allTypes.map(at => {
                        const configured = acts.find(a => a.type === at.type);
                        const isChecked = configured ? configured.enabled !== false : at.has;
                        return `
                          <label style="font-size:12px;display:inline-flex;align-items:center;gap:5px;cursor:pointer;">
                            <input type="checkbox" class="chk-bento-action" data-ridx="${rIdx}" data-act-type="${at.type}" ${isChecked ? 'checked' : ''}>
                            <span>${at.label}</span>
                          </label>
                        `;
                      }).join('');
                    })()}
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- TAB: BENTO-BADGES -->
      <div id="stabContentBadges" style="${activeTab === 'badges' ? '' : 'display:none;'}">
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:14px;line-height:1.5;">
          Hier konfigurierst du die Sensor-Badges für deine 3x3 Bento-Karten zentral. Jede Badge besitzt ein Icon, Iconfarbe, Hintergrund-, Rahmen- und Hover-Farben (getrennt für helles und dunkles Theme). Mit den Raum-Checkboxen wählst du direkt aus, auf welchen Bento-Karten die Badge erscheinen soll.
        </div>

        <div style="display:flex;flex-direction:column;gap:14px;" id="bentoBadgesList">
          ${(bentoBadges || []).map((b, bIdx) => {
            const isAll = !b.rooms || b.rooms.includes('all');
            return `
              <div class="card-box" style="background:var(--bg-card);border:1px solid var(--border-glass);border-radius:14px;padding:16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:8px;flex-wrap:wrap;">
                  <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:200px;">
                    <div style="width:34px;height:34px;border-radius:10px;background:rgba(56,189,248,0.15);border:1px solid rgba(56,189,248,0.3);display:flex;align-items:center;justify-content:center;color:var(--accent);">
                      ${this._icon(b.icon || 'star', { size: 18 })}
                    </div>
                    <input type="text" class="in-badge-name" data-bidx="${bIdx}" value="${b.name || ''}" placeholder="Badge Name (z.B. Temperatur)" style="padding:6px 10px;border-radius:8px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);font-size:14px;font-weight:700;flex:1;min-width:140px;">
                  </div>
                  <button type="button" class="btn btn-sm btn-del-bento-badge" data-bidx="${bIdx}" style="color:#ef4444;border-color:rgba(239,68,68,0.4);cursor:pointer;padding:6px 12px;">
                    ✕ Badge löschen
                  </button>
                </div>

                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:12px;margin-bottom:14px;">
                  <div class="form-group">
                    <label style="font-size:11px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;display:block;margin-bottom:4px;">Entitäts-Zuordnung</label>
                    <select class="sel-badge-entity-type" data-bidx="${bIdx}" style="width:100%;padding:8px 10px;border-radius:8px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);font-size:13px;font-weight:600;cursor:pointer;">
                      <option value="temp_entity" ${b.entity_prop === 'temp_entity' ? 'selected' : ''}>Raum-Temperatur (temp_entity)</option>
                      <option value="humidity_entity" ${b.entity_prop === 'humidity_entity' ? 'selected' : ''}>Raum-Luftfeuchtigkeit (humidity_entity)</option>
                      <option value="illuminance_entity" ${b.entity_prop === 'illuminance_entity' ? 'selected' : ''}>Raum-Helligkeit / Lux (illuminance_entity)</option>
                      <option value="target_temp_entity" ${b.entity_prop === 'target_temp_entity' ? 'selected' : ''}>Raum-Zieltemperatur (target_temp_entity)</option>
                      <option value="window_entity" ${b.entity_prop === 'window_entity' ? 'selected' : ''}>Raum-Fensterkontakt (window_entity)</option>
                      <option value="presence_entity" ${b.entity_prop === 'presence_entity' ? 'selected' : ''}>Raum-Präsenzmelder (presence_entity)</option>
                      <option value="custom" ${b.entity_prop === 'custom' ? 'selected' : ''}>Feste / Spezifische Entität</option>
                    </select>
                  </div>

                  ${b.entity_prop === 'custom' ? `
                    <div class="form-group">
                      <label style="font-size:11px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;display:block;margin-bottom:4px;">Spezifische Entität</label>
                      <div style="display:flex;gap:6px;">
                        <input type="text" class="in-badge-custom-entity" data-bidx="${bIdx}" value="${b.entity_id || ''}" placeholder="sensor.xyz" style="flex:1;padding:8px 10px;border-radius:8px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);font-size:13px;font-family:monospace;">
                        <button type="button" class="btn btn-sm btn-pick-badge-entity" data-bidx="${bIdx}" style="padding:6px 10px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;">🔍</button>
                      </div>
                    </div>
                  ` : ''}

                  <div class="form-group">
                    <label style="font-size:11px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;display:block;margin-bottom:4px;">Icon</label>
                    <select class="sel-badge-icon" data-bidx="${bIdx}" style="width:100%;padding:8px 10px;border-radius:8px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);font-size:13px;font-weight:600;cursor:pointer;">
                      ${['thermometer', 'droplet', 'lux', 'light', 'wind', 'sun', 'flame', 'leaf', 'battery-good', 'shield', 'plug', 'star', 'music', 'lock-closed', 'clock', 'eye'].map(ic => `
                        <option value="${ic}" ${b.icon === ic ? 'selected' : ''}>${ic}</option>
                      `).join('')}
                    </select>
                  </div>
                </div>

                <!-- Colors Configuration: Light & Dark Mode -->
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:12px;margin-bottom:14px;">
                  <!-- Light Mode Colors -->
                  <div style="background:rgba(255,255,255,0.04);border:1px solid var(--border-subtle);border-radius:10px;padding:12px;">
                    <div style="font-size:12px;font-weight:700;color:#fbbf24;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
                      ☀️ Helles Theme
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                      <div>
                        <label style="font-size:10px;color:var(--text-secondary);display:block;margin-bottom:2px;">Iconfarbe</label>
                        <input type="text" class="in-badge-color" data-bidx="${bIdx}" data-prop="icon_color_light" value="${b.icon_color_light || '#ea580c'}" style="width:100%;padding:5px 8px;border-radius:6px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);font-size:11px;font-family:monospace;box-sizing:border-box;">
                      </div>
                      <div>
                        <label style="font-size:10px;color:var(--text-secondary);display:block;margin-bottom:2px;">Hintergrund</label>
                        <input type="text" class="in-badge-color" data-bidx="${bIdx}" data-prop="bg_light" value="${b.bg_light || 'rgba(234,88,12,0.1)'}" style="width:100%;padding:5px 8px;border-radius:6px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);font-size:11px;font-family:monospace;box-sizing:border-box;">
                      </div>
                      <div>
                        <label style="font-size:10px;color:var(--text-secondary);display:block;margin-bottom:2px;">Rahmen</label>
                        <input type="text" class="in-badge-color" data-bidx="${bIdx}" data-prop="border_light" value="${b.border_light || 'rgba(234,88,12,0.25)'}" style="width:100%;padding:5px 8px;border-radius:6px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);font-size:11px;font-family:monospace;box-sizing:border-box;">
                      </div>
                      <div>
                        <label style="font-size:10px;color:var(--text-secondary);display:block;margin-bottom:2px;">Hover-Farbe</label>
                        <input type="text" class="in-badge-color" data-bidx="${bIdx}" data-prop="hover_light" value="${b.hover_light || 'rgba(234,88,12,0.22)'}" style="width:100%;padding:5px 8px;border-radius:6px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);font-size:11px;font-family:monospace;box-sizing:border-box;">
                      </div>
                    </div>
                  </div>

                  <!-- Dark Mode Colors -->
                  <div style="background:rgba(0,0,0,0.14);border:1px solid var(--border-subtle);border-radius:10px;padding:12px;">
                    <div style="font-size:12px;font-weight:700;color:#38bdf8;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
                      🌙 Dunkles Theme
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                      <div>
                        <label style="font-size:10px;color:var(--text-secondary);display:block;margin-bottom:2px;">Iconfarbe</label>
                        <input type="text" class="in-badge-color" data-bidx="${bIdx}" data-prop="icon_color_dark" value="${b.icon_color_dark || '#fb923c'}" style="width:100%;padding:5px 8px;border-radius:6px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);font-size:11px;font-family:monospace;box-sizing:border-box;">
                      </div>
                      <div>
                        <label style="font-size:10px;color:var(--text-secondary);display:block;margin-bottom:2px;">Hintergrund</label>
                        <input type="text" class="in-badge-color" data-bidx="${bIdx}" data-prop="bg_dark" value="${b.bg_dark || 'rgba(251,146,60,0.15)'}" style="width:100%;padding:5px 8px;border-radius:6px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);font-size:11px;font-family:monospace;box-sizing:border-box;">
                      </div>
                      <div>
                        <label style="font-size:10px;color:var(--text-secondary);display:block;margin-bottom:2px;">Rahmen</label>
                        <input type="text" class="in-badge-color" data-bidx="${bIdx}" data-prop="border_dark" value="${b.border_dark || 'rgba(251,146,60,0.35)'}" style="width:100%;padding:5px 8px;border-radius:6px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);font-size:11px;font-family:monospace;box-sizing:border-box;">
                      </div>
                      <div>
                        <label style="font-size:10px;color:var(--text-secondary);display:block;margin-bottom:2px;">Hover-Farbe</label>
                        <input type="text" class="in-badge-color" data-bidx="${bIdx}" data-prop="hover_dark" value="${b.hover_dark || 'rgba(251,146,60,0.30)'}" style="width:100%;padding:5px 8px;border-radius:6px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);font-size:11px;font-family:monospace;box-sizing:border-box;">
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Room Assignment Checkboxes -->
                <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-subtle);border-radius:10px;padding:12px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <div style="font-size:12px;font-weight:700;color:var(--text-primary);">
                      📍 Auf welchen Bento-Karten anzeigen?
                    </div>
                    <label style="font-size:12px;display:flex;align-items:center;gap:6px;cursor:pointer;color:var(--accent);">
                      <input type="checkbox" class="chk-badge-room-all" data-bidx="${bIdx}" ${isAll ? 'checked' : ''}>
                      <span>Auf allen Räumen</span>
                    </label>
                  </div>
                  <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:6px;">
                    ${rooms.map(r => `
                      <label style="font-size:12px;display:flex;align-items:center;gap:6px;cursor:pointer;padding:4px 6px;border-radius:6px;background:rgba(255,255,255,0.02);">
                        <input type="checkbox" class="chk-badge-room-one" data-bidx="${bIdx}" data-rid="${r.id}" ${(isAll || (b.rooms && b.rooms.includes(r.id))) ? 'checked' : ''} ${isAll ? 'disabled' : ''}>
                        <span>${r.name || r.id}</span>
                      </label>
                    `).join('')}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <button type="button" class="btn btn-sm btn-primary" id="btnAddBentoBadge" style="margin-top:14px;padding:8px 16px;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
          + Neue Bento-Badge anlegen
        </button>
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

        <div style="display:flex;flex-direction:column;gap:10px;">
          ${(dock.items || []).map((item, dIdx) => {
            const isCustom = !['lighting', 'climate', 'stats', 'security', 'alarmo', 'switches', 'battery', 'weather'].includes(item.id);
            const iconHtml = item.icon ? this._icon(item.icon, { size: 18 }) : this._getBuiltinDockIcon(item.id, 18);
            return `
              <div class="card-box" style="background:var(--bg-card);border:1px solid var(--border-glass);border-radius:14px;padding:14px 16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                  <div style="display:flex;align-items:center;gap:10px;">
                    <input type="checkbox" class="chk-dock-enable" data-didx="${dIdx}" ${item.enabled !== false ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer;">
                    <div style="width:32px;height:32px;border-radius:8px;background:${isCustom ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.06)'};display:flex;align-items:center;justify-content:center;color:var(--accent);">
                      ${iconHtml}
                    </div>
                    <div>
                      <span style="font-weight:700;font-size:14px;">${item.title || item.id}</span>
                      <span style="font-size:11px;padding:2px 6px;border-radius:6px;background:${isCustom ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.08)'};color:${isCustom ? 'var(--accent)' : 'var(--text-secondary)'};font-weight:600;margin-left:6px;">
                        ${isCustom ? 'Eigener Bereich' : 'Standard'}
                      </span>
                    </div>
                  </div>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <button type="button" class="btn btn-sm btn-set-dock-up" data-didx="${dIdx}" ${dIdx === 0 ? 'disabled' : ''} title="Nach oben">▲</button>
                    <button type="button" class="btn btn-sm btn-set-dock-down" data-didx="${dIdx}" ${dIdx === (dock.items.length - 1) ? 'disabled' : ''} title="Nach unten">▼</button>
                    ${isCustom ? `<button type="button" class="btn btn-sm btn-danger btn-del-dock-item" data-didx="${dIdx}" style="padding:4px 8px;margin-left:4px;" title="Löschen">✕</button>` : ''}
                  </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 140px;gap:10px;margin-bottom:12px;">
                  <div>
                    <label style="font-size:11px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:4px;">Titel im Dock</label>
                    <input type="text" class="inp-custom-dock-title" data-didx="${dIdx}" value="${item.title || ''}" placeholder="${item.id}" style="width:100%;padding:8px 10px;border-radius:8px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);box-sizing:border-box;">
                  </div>
                  <div>
                    <label style="font-size:11px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:4px;">Icon</label>
                    <select class="sel-custom-dock-icon" data-didx="${dIdx}" style="width:100%;padding:8px 10px;border-radius:8px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);box-sizing:border-box;">
                      <option value="" ${!item.icon ? 'selected' : ''}>Standard (${item.id})</option>
                      ${['light', 'climate', 'stats', 'lock-closed', 'shield', 'zap', 'battery', 'weather', 'star', 'camera', 'fan', 'vacuum', 'music', 'tv', 'blinds', 'bell', 'eye', 'flame', 'clock', 'robot', 'sliders', 'speaker'].map(ic => `
                        <option value="${ic}" ${item.icon === ic ? 'selected' : ''}>${ic}</option>
                      `).join('')}
                    </select>
                  </div>
                </div>

                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <div style="font-size:12px;font-weight:600;color:var(--text-secondary);">Zugeordnete Entitäten im Modal (${(item.entities || []).length})</div>
                    ${(!isCustom && (!item.entities || item.entities.length === 0)) ? `
                      <span style="font-size:11px;color:var(--accent);">⚡ Standard: Automatische System-Erkennung</span>
                    ` : ''}
                  </div>
                  <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">
                    ${(item.entities || []).map((entId, eIdx) => `
                      <span class="badge" style="display:inline-flex;align-items:center;gap:6px;background:var(--bg-surface);border:1px solid var(--border-subtle);padding:4px 8px;border-radius:6px;font-size:12px;font-family:monospace;">
                        ${this._resolveEntityIcon(entId, this._hass?.states[entId])}
                        <span>${entId}</span>
                        <button type="button" class="btn-micro btn-del-cust-entity" data-didx="${dIdx}" data-eidx="${eIdx}" style="padding:0 4px;font-size:12px;cursor:pointer;color:#ef4444;background:none;border:none;">&times;</button>
                      </span>
                    `).join('')}
                    ${(!item.entities || item.entities.length === 0) ? `
                      <span style="font-size:12px;color:var(--text-secondary);font-style:italic;">
                        ${isCustom ? 'Noch keine Entitäten zugeordnet' : 'Keine manuellen Entitäten definiert – nutzt automatisches System-Modal. Klicke auf „+ Entität hinzufügen“, um gezielt eigene Entitäten festzulegen.'}
                      </span>
                    ` : ''}
                  </div>
                  <button type="button" class="btn btn-sm btn-add-cust-entity" data-didx="${dIdx}" style="background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.3);color:var(--accent);display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;">
                    🔍 + Entität zu diesem Modal hinzufügen
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <button type="button" class="btn btn-sm btn-primary" id="btnAddCustomDockItem" style="margin-top:14px;padding:8px 16px;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
          + Eigenen Dock-Punkt mit Modal hinzufügen
        </button>
      </div>

      <!-- TAB 4: HELFER-KONTROLLEN -->
      <div id="stabContentControls" style="${activeTab === 'controls' ? '' : 'display:none;'}">
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:14px;line-height:1.5;">
          Konfiguriere hier die visuelle Darstellung deiner Home Assistant Helfer (<code style="color:var(--accent);">input_boolean</code>, <code style="color:var(--accent);">input_number</code>, <code style="color:var(--accent);">input_select</code>, <code style="color:var(--accent);">input_datetime</code>, <code style="color:var(--accent);">timer</code>, <code style="color:var(--accent);">counter</code>, etc.) mit den taktil-animierten Kontrollen aus <code style="color:var(--accent);">ha-advanced-helper-controls-card</code>.
        </div>

        <div style="display:flex;flex-direction:column;gap:10px;" id="helperControlsList">
          ${(() => {
            const helperControls = this._config.helper_controls || {};
            const helperEntities = new Set(Object.keys(helperControls));
            if (this._hass && this._hass.states) {
              const helperPrefixes = ['input_boolean.', 'input_number.', 'input_select.', 'input_datetime.', 'input_text.', 'input_button.', 'timer.', 'counter.', 'schedule.'];
              Object.keys(this._hass.states).forEach(eId => {
                if (helperPrefixes.some(p => eId.startsWith(p))) {
                  helperEntities.add(eId);
                }
              });
            }
            const sorted = Array.from(helperEntities).sort();
            if (sorted.length === 0) {
              return '<div style="font-size:13px;color:var(--text-secondary);padding:14px;">Keine Helfer im System gefunden. Klicke unten, um eine Entität hinzuzufügen.</div>';
            }

            return sorted.map(eId => {
              const s = this._hass && this._hass.states[eId];
              const fname = s?.attributes?.friendly_name || eId;
              const domain = eId.split('.')[0];
              const curType = helperControls[eId] || (domain === 'input_number' ? 'slider' : (domain === 'input_select' ? 'segmented' : (domain === 'input_datetime' ? 'time_input' : (domain === 'timer' ? 'circular-timer' : 'switch'))));

              let options = [];
              if (domain === 'input_boolean' || domain === 'switch') {
                options = [
                  { value: 'switch', label: 'Schalter (Glass Switch)' },
                  { value: 'rocker-switch', label: 'Wippschalter (VisionOS Rocker)' },
                  { value: 'hold-action', label: 'Hold-Button (1.4s Ring-Animation)' },
                  { value: 'push_button', label: 'Taster (Push-Button)' },
                  { value: 'icon_button', label: 'Icon-Button (Kreis)' },
                  { value: 'badge', label: 'Status-Badge' }
                ];
              } else if (domain === 'input_number' || domain === 'counter') {
                options = [
                  { value: 'slider', label: 'Schieberegler (Slider mit Live-Wert)' },
                  { value: 'rotary-knob', label: 'Rotary Knob (360° Drehregler)' },
                  { value: 'open-arc', label: 'Open Arc (270° Hufeisen-Bogen)' },
                  { value: 'half-circle', label: 'Half Circle (180° Halbkreis)' },
                  { value: 'wedge-slider', label: 'Wedge Slider (Farbkeil-Schieber)' },
                  { value: 'vertical-slider', label: 'Vertical Slider (Vertikalbalken)' },
                  { value: 'stepper-presets', label: 'Stepper & Schnellwahltasten' },
                  { value: 'stepper', label: '+ / - Stepper' },
                  { value: 'badge', label: 'Status-Badge' }
                ];
              } else if (domain === 'input_select') {
                options = [
                  { value: 'segmented', label: 'Segmentierte Tabs (Pills)' },
                  { value: 'dropdown', label: 'Dropdown-Auswahl' },
                  { value: 'badge', label: 'Status-Badge' }
                ];
              } else if (domain === 'timer') {
                options = [
                  { value: 'circular-timer', label: 'Kreisförmiger Timer (mit Controls)' },
                  { value: 'badge', label: 'Status-Badge' }
                ];
              } else if (domain === 'input_datetime') {
                options = [
                  { value: 'time_input', label: 'Uhrzeit-Picker' },
                  { value: 'badge', label: 'Status-Badge' }
                ];
              } else if (domain === 'input_button' || domain === 'button') {
                options = [
                  { value: 'push_button', label: 'Taster (Push-Button)' },
                  { value: 'hold-action', label: 'Hold-Button (1.4s Ring-Animation)' },
                  { value: 'icon_button', label: 'Icon-Button (Kreis)' }
                ];
              } else {
                options = [
                  { value: 'badge', label: 'Standard Badge' },
                  { value: 'push_button', label: 'Taster' }
                ];
              }

              return `
                <div class="card-box" style="display:flex;justify-content:space-between;align-items:center;background:var(--bg-card);border:1px solid var(--border-glass);border-radius:12px;padding:12px 16px;gap:12px;">
                  <div style="flex:1;min-width:0;">
                    <div style="font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${fname}</div>
                    <div style="font-size:11px;color:var(--text-secondary);font-family:monospace;">${eId}</div>
                  </div>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <select class="sel-helper-ctrl" data-entity="${eId}" style="padding:6px 10px;border-radius:8px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);font-size:12px;font-weight:600;">
                      ${options.map(opt => `<option value="${opt.value}" ${opt.value === curType ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                    <button type="button" class="btn btn-sm btn-del-helper-ctrl" data-entity="${eId}" style="color:#ef4444;background:none;border:none;cursor:pointer;font-size:14px;padding:4px;" title="Zurücksetzen">✕</button>
                  </div>
                </div>
              `;
            }).join('');
          })()}
        </div>

        <button type="button" class="btn btn-sm btn-primary" id="btnAddHelperControl" style="margin-top:14px;padding:8px 16px;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
          🔍 + Weitere Helfer-Entität konfigurieren
        </button>
      </div>

      <!-- TAB 5: DESIGN & ALLGEMEIN -->
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

        <div class="card-box" style="background:var(--bg-card);border:1px solid var(--border-glass);border-radius:14px;padding:16px;margin-top:14px;">
          <div style="font-weight:700;font-size:15px;margin-bottom:12px;">🏷️ Top-Bar Badges & Personen</div>
          <div style="font-size:12px;color:var(--text-secondary);margin-bottom:14px;">Wähle, welche Badges in der Kopfleiste angezeigt werden sollen, und bestimme die angezeigten Personen.</div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-bottom:14px;">
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
              <input type="checkbox" id="chkTopPersons" ${(this._config.top_bar_show_persons !== false) ? 'checked' : ''}>
              <span>Personen-Badges</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
              <input type="checkbox" id="chkTopLights" ${(this._config.top_bar_show_lights !== false) ? 'checked' : ''}>
              <span>Lichter-Zähler</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
              <input type="checkbox" id="chkTopClimate" ${(this._config.top_bar_show_climate !== false) ? 'checked' : ''}>
              <span>Heizung / Temperatur</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
              <input type="checkbox" id="chkTopLock" ${(this._config.top_bar_show_lock !== false) ? 'checked' : ''}>
              <span>Schloss / Sicherheit</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
              <input type="checkbox" id="chkTopAlarmo" ${(this._config.top_bar_show_alarmo !== false) ? 'checked' : ''}>
              <span>Alarmo Status</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
              <input type="checkbox" id="chkTopWeather" ${(this._config.top_bar_show_weather !== false) ? 'checked' : ''}>
              <span>Wetter-Badge</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
              <input type="checkbox" id="chkTopWarnings" ${(this._config.top_bar_show_warnings !== false) ? 'checked' : ''}>
              <span>Amtliche Warnungen</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
              <input type="checkbox" id="chkTopMedia" ${(this._config.top_bar_show_media !== false) ? 'checked' : ''}>
              <span>Aktive Medien</span>
            </label>
          </div>

          <div style="border-top:1px solid var(--border-subtle);padding-top:12px;margin-bottom:14px;">
            <div style="font-weight:600;font-size:13px;margin-bottom:6px;">Personen-Auswahl</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;" id="topPersonsSelection">
              ${(() => {
                const allPersons = this._hass ? Object.keys(this._hass.states).filter(e => e.startsWith('person.')) : [];
                const confPersons = this._config.top_bar_persons || [];
                return allPersons.map(pId => {
                  const s = this._hass.states[pId];
                  const name = s?.attributes?.friendly_name || pId.replace('person.', '');
                  const isChecked = confPersons.length === 0 || confPersons.includes(pId);
                  return `
                    <label style="display:inline-flex;align-items:center;gap:6px;background:var(--bg-surface);border:1px solid var(--border-subtle);padding:6px 10px;border-radius:8px;font-size:12px;cursor:pointer;">
                      <input type="checkbox" class="chk-person-select" data-person-id="${pId}" ${isChecked ? 'checked' : ''}>
                      <span>${name}</span>
                      <code style="font-size:10px;color:var(--text-secondary);">${pId}</code>
                    </label>
                  `;
                }).join('') || '<span style="font-size:12px;color:var(--text-secondary);">Keine Personen im System gefunden.</span>';
              })()}
            </div>
          </div>

          <div style="border-top:1px solid var(--border-subtle);padding-top:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <div style="font-weight:600;font-size:13px;">Zusätzliche Entitäten in der Top-Bar (${(this._config.top_bar_custom_chips || []).length})</div>
              <button type="button" class="btn btn-sm btn-primary" id="btnAddTopCustomChip" style="padding:4px 10px;font-size:12px;">+ Badge hinzufügen</button>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;" id="topCustomChipsList">
              ${(this._config.top_bar_custom_chips || []).map((c, cIdx) => `
                <span class="badge" style="display:inline-flex;align-items:center;gap:6px;background:var(--bg-surface);border:1px solid var(--border-subtle);padding:4px 8px;border-radius:6px;font-size:12px;font-family:monospace;">
                  <span>${c.name || c.entity_id}</span>
                  <button type="button" class="btn-micro btn-del-top-chip" data-cidx="${cIdx}" style="padding:0 4px;font-size:12px;cursor:pointer;color:#ef4444;background:none;border:none;">&times;</button>
                </span>
              `).join('')}
              ${(!this._config.top_bar_custom_chips || this._config.top_bar_custom_chips.length === 0) ? `<span style="font-size:12px;color:var(--text-secondary);font-style:italic;">Keine zusätzlichen Badges angelegt</span>` : ''}
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
        const backBtn = container.querySelector('#btnBackToDashboard');
    if (backBtn) backBtn.onclick = () => this._setViewMode('home');
    const toast = container.querySelector('#settingsToast');
        if (toast) {
          toast.textContent = `✓ ${this._t('sync_areas_success')} (${res ? res.total : 0} Bereiche)`;
          toast.style.display = 'block';
          setTimeout(() => { if (toast) toast.style.display = 'none'; }, 4000);
        }
      };
    }

    // Dock up / down / toggle / custom items
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

    const btnAddDock = container.querySelector('#btnAddCustomDockItem');
    if (btnAddDock) {
      btnAddDock.onclick = () => {
        if (!this._config.dock) this._config.dock = { auto_detect: true, items: [] };
        if (!this._config.dock.items) this._config.dock.items = [];
        this._config.dock.items.push({
          id: 'custom_' + Date.now(),
          title: 'Neuer Menüpunkt',
          icon: 'star',
          enabled: true,
          type: 'modal',
          entities: []
        });
        this._renderSettingsContent(container, isModal);
      };
    }

    container.querySelectorAll('.btn-del-dock-item').forEach(b => {
      b.onclick = () => {
        const idx = parseInt(b.getAttribute('data-didx'));
        if (this._config.dock?.items) {
          this._config.dock.items.splice(idx, 1);
          this._renderSettingsContent(container, isModal);
        }
      };
    });

    container.querySelectorAll('.inp-custom-dock-title').forEach(inp => {
      inp.oninput = () => {
        const idx = parseInt(inp.getAttribute('data-didx'));
        if (this._config.dock?.items?.[idx]) {
          this._config.dock.items[idx].title = inp.value;
        }
      };
    });

    container.querySelectorAll('.sel-custom-dock-icon').forEach(sel => {
      sel.onchange = () => {
        const idx = parseInt(sel.getAttribute('data-didx'));
        if (this._config.dock?.items?.[idx]) {
          this._config.dock.items[idx].icon = sel.value;
          this._renderSettingsContent(container, isModal);
        }
      };
    });

    container.querySelectorAll('.btn-add-cust-entity').forEach(b => {
      b.onclick = () => {
        const dIdx = parseInt(b.getAttribute('data-didx'));
        const item = this._config.dock?.items?.[dIdx];
        if (item) {
          this._showEntityPicker({
            currentValue: '',
            defaultDomain: 'all',
            onSelect: (selectedId) => {
              if (selectedId) {
                if (!item.entities) item.entities = [];
                if (!item.entities.includes(selectedId)) {
                  item.entities.push(selectedId);
                  this._renderSettingsContent(container, isModal);
                }
              }
            }
          });
        }
      };
    });

    container.querySelectorAll('.btn-del-cust-entity').forEach(b => {
      b.onclick = () => {
        const dIdx = parseInt(b.getAttribute('data-didx'));
        const eIdx = parseInt(b.getAttribute('data-eidx'));
        if (this._config.dock?.items?.[dIdx]?.entities) {
          this._config.dock.items[dIdx].entities.splice(eIdx, 1);
          this._renderSettingsContent(container, isModal);
        }
      };
    });

    // Entity Picker for Room Properties
    const openRoomPicker = (rIdx, prop, targetInp) => {
      const room = this._config.rooms && this._config.rooms[rIdx];
      if (!room) return;
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

    container.querySelectorAll('.btn-pick-entity').forEach(btn => {
      btn.onclick = () => {
        const rIdx = parseInt(btn.getAttribute('data-ridx'));
        const prop = btn.getAttribute('data-prop');
        const targetInp = container.querySelector(`.in-room-prop[data-ridx="${rIdx}"][data-prop="${prop}"]`);
        openRoomPicker(rIdx, prop, targetInp);
      };
    });

    container.querySelectorAll('.in-room-prop').forEach(inp => {
      inp.style.cursor = 'pointer';
      inp.onclick = () => {
        const rIdx = parseInt(inp.getAttribute('data-ridx'));
        const prop = inp.getAttribute('data-prop');
        openRoomPicker(rIdx, prop, inp);
      };
      inp.oninput = () => {
        const rIdx = parseInt(inp.getAttribute('data-ridx'));
        const prop = inp.getAttribute('data-prop');
        if (this._config.rooms && this._config.rooms[rIdx]) {
          this._config.rooms[rIdx][prop] = inp.value.trim();
        }
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

    // Bento Actions Checkboxes
    container.querySelectorAll('.chk-bento-action').forEach(chk => {
      chk.onchange = () => {
        const rIdx = parseInt(chk.getAttribute('data-ridx'));
        const actType = chk.getAttribute('data-act-type');
        const room = this._config.rooms?.[rIdx];
        if (!room) return;
        if (!Array.isArray(room.bento_actions)) {
          room.bento_actions = this._getRoomBentoActions(room);
        }
        let act = room.bento_actions.find(a => a.type === actType);
        if (!act) {
          act = { type: actType, enabled: chk.checked };
          room.bento_actions.push(act);
        } else {
          act.enabled = chk.checked;
        }
      };
    });

    // Bento-Badges Handlers
    const btnAddBadge = container.querySelector('#btnAddBentoBadge');
    if (btnAddBadge) {
      btnAddBadge.onclick = () => {
        if (!this._config.bento_badges) this._config.bento_badges = this._getEffectiveBentoBadges();
        this._config.bento_badges.push({
          id: 'badge_' + Date.now(),
          name: 'Neue Badge',
          entity_prop: 'temp_entity',
          icon: 'star',
          icon_color_light: '#0284c7',
          icon_color_dark: '#38bdf8',
          bg_light: 'rgba(2, 132, 199, 0.10)',
          border_light: 'rgba(2, 132, 199, 0.25)',
          hover_light: 'rgba(2, 132, 199, 0.22)',
          bg_dark: 'rgba(56, 189, 248, 0.15)',
          border_dark: 'rgba(56, 189, 248, 0.35)',
          hover_dark: 'rgba(56, 189, 248, 0.30)',
          rooms: ['all']
        });
        this._renderSettingsContent(container, isModal);
      };
    }

    container.querySelectorAll('.btn-del-bento-badge').forEach(btn => {
      btn.onclick = () => {
        const bIdx = parseInt(btn.getAttribute('data-bidx'));
        if (this._config.bento_badges && this._config.bento_badges[bIdx]) {
          this._config.bento_badges.splice(bIdx, 1);
          this._renderSettingsContent(container, isModal);
        }
      };
    });

    container.querySelectorAll('.in-badge-name').forEach(inp => {
      inp.oninput = () => {
        const bIdx = parseInt(inp.getAttribute('data-bidx'));
        if (this._config.bento_badges?.[bIdx]) {
          this._config.bento_badges[bIdx].name = inp.value;
        }
      };
    });

    container.querySelectorAll('.sel-badge-entity-type').forEach(sel => {
      sel.onchange = () => {
        const bIdx = parseInt(sel.getAttribute('data-bidx'));
        if (this._config.bento_badges?.[bIdx]) {
          this._config.bento_badges[bIdx].entity_prop = sel.value;
          this._renderSettingsContent(container, isModal);
        }
      };
    });

    container.querySelectorAll('.in-badge-custom-entity').forEach(inp => {
      inp.oninput = () => {
        const bIdx = parseInt(inp.getAttribute('data-bidx'));
        if (this._config.bento_badges?.[bIdx]) {
          this._config.bento_badges[bIdx].entity_id = inp.value.trim();
        }
      };
    });

    container.querySelectorAll('.btn-pick-badge-entity').forEach(btn => {
      btn.onclick = () => {
        const bIdx = parseInt(btn.getAttribute('data-bidx'));
        const badge = this._config.bento_badges?.[bIdx];
        if (!badge) return;
        this._showEntityPicker({
          currentValue: badge.entity_id || '',
          defaultDomain: 'sensor',
          onSelect: (selectedId) => {
            badge.entity_id = selectedId;
            this._renderSettingsContent(container, isModal);
          }
        });
      };
    });

    container.querySelectorAll('.sel-badge-icon').forEach(sel => {
      sel.onchange = () => {
        const bIdx = parseInt(sel.getAttribute('data-bidx'));
        if (this._config.bento_badges?.[bIdx]) {
          this._config.bento_badges[bIdx].icon = sel.value;
          this._renderSettingsContent(container, isModal);
        }
      };
    });

    container.querySelectorAll('.in-badge-color').forEach(inp => {
      inp.oninput = () => {
        const bIdx = parseInt(inp.getAttribute('data-bidx'));
        const prop = inp.getAttribute('data-prop');
        if (this._config.bento_badges?.[bIdx]) {
          this._config.bento_badges[bIdx][prop] = inp.value;
        }
      };
    });

    container.querySelectorAll('.chk-badge-room-all').forEach(chk => {
      chk.onchange = () => {
        const bIdx = parseInt(chk.getAttribute('data-bidx'));
        const badge = this._config.bento_badges?.[bIdx];
        if (!badge) return;
        if (chk.checked) {
          badge.rooms = ['all'];
        } else {
          badge.rooms = (this._config.rooms || []).map(r => r.id);
        }
        this._renderSettingsContent(container, isModal);
      };
    });

    container.querySelectorAll('.chk-badge-room-one').forEach(chk => {
      chk.onchange = () => {
        const bIdx = parseInt(chk.getAttribute('data-bidx'));
        const rId = chk.getAttribute('data-rid');
        const badge = this._config.bento_badges?.[bIdx];
        if (!badge) return;
        if (!Array.isArray(badge.rooms) || badge.rooms.includes('all')) {
          badge.rooms = (this._config.rooms || []).map(r => r.id);
        }
        if (chk.checked) {
          if (!badge.rooms.includes(rId)) badge.rooms.push(rId);
        } else {
          badge.rooms = badge.rooms.filter(id => id !== rId);
        }
      };
    });

    // Helper Controls Handlers
    const btnAddHelper = container.querySelector('#btnAddHelperControl');
    if (btnAddHelper) {
      btnAddHelper.onclick = () => {
        this._showEntityPicker({
          defaultDomain: 'input_number',
          onSelect: (eId) => {
            if (!this._config.helper_controls) this._config.helper_controls = {};
            const domain = eId.split('.')[0];
            const defType = domain === 'input_number' ? 'slider' : (domain === 'input_select' ? 'segmented' : (domain === 'input_datetime' ? 'time_input' : 'switch'));
            this._config.helper_controls[eId] = defType;
            this._renderSettingsContent(container, isModal);
          }
        });
      };
    }
    container.querySelectorAll('.btn-del-helper-ctrl').forEach(btn => {
      btn.onclick = () => {
        const eId = btn.getAttribute('data-entity');
        if (this._config.helper_controls && this._config.helper_controls[eId]) {
          delete this._config.helper_controls[eId];
          this._renderSettingsContent(container, isModal);
        }
      };
    });

    // Top-Bar Custom Chip Handlers
    const btnAddTopChip = container.querySelector('#btnAddTopCustomChip');
    if (btnAddTopChip) {
      btnAddTopChip.onclick = () => {
        this._showEntityPicker({
          defaultDomain: 'all',
          onSelect: (selectedId) => {
            if (selectedId) {
              if (!this._config.top_bar_custom_chips) this._config.top_bar_custom_chips = [];
              const s = this._hass?.states[selectedId];
              this._config.top_bar_custom_chips.push({
                entity_id: selectedId,
                name: s?.attributes?.friendly_name || selectedId,
                icon: 'star'
              });
              this._renderSettingsContent(container, isModal);
            }
          }
        });
      };
    }
    container.querySelectorAll('.btn-del-top-chip').forEach(btn => {
      btn.onclick = () => {
        const cIdx = parseInt(btn.getAttribute('data-cidx'));
        if (this._config.top_bar_custom_chips) {
          this._config.top_bar_custom_chips.splice(cIdx, 1);
          this._renderSettingsContent(container, isModal);
        }
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

        // Collect Top-Bar settings
        const chkTPersons = container.querySelector('#chkTopPersons');
        if (chkTPersons) this._config.top_bar_show_persons = chkTPersons.checked;
        const chkTLights = container.querySelector('#chkTopLights');
        if (chkTLights) this._config.top_bar_show_lights = chkTLights.checked;
        const chkTClimate = container.querySelector('#chkTopClimate');
        if (chkTClimate) this._config.top_bar_show_climate = chkTClimate.checked;
        const chkTLock = container.querySelector('#chkTopLock');
        if (chkTLock) this._config.top_bar_show_lock = chkTLock.checked;
        const chkTAlarmo = container.querySelector('#chkTopAlarmo');
        if (chkTAlarmo) this._config.top_bar_show_alarmo = chkTAlarmo.checked;
        const chkTWeather = container.querySelector('#chkTopWeather');
        if (chkTWeather) this._config.top_bar_show_weather = chkTWeather.checked;
        const chkTWarn = container.querySelector('#chkTopWarnings');
        if (chkTWarn) this._config.top_bar_show_warnings = chkTWarn.checked;
        const chkTMedia = container.querySelector('#chkTopMedia');
        if (chkTMedia) this._config.top_bar_show_media = chkTMedia.checked;

        const selPersons = [];
        container.querySelectorAll('.chk-person-select:checked').forEach(c => {
          selPersons.push(c.getAttribute('data-person-id'));
        });
        if (container.querySelector('#topPersonsSelection')) {
          this._config.top_bar_persons = selPersons;
        }

        // Collect helper controls
        const helperCtrls = {};
        container.querySelectorAll('.sel-helper-ctrl').forEach(sel => {
          const eId = sel.getAttribute('data-entity');
          if (eId) helperCtrls[eId] = sel.value;
        });
        this._config.helper_controls = helperCtrls;

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
};

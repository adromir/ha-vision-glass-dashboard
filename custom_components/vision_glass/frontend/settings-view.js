import { ICONS, POPULAR_HA_ICONS } from './icons.js';

function toHexColor(str) {
  if (!str) return '#38bdf8';
  str = String(str).trim();
  if (str.startsWith('#')) {
    if (str.length === 7) return str;
    if (str.length === 4) return '#' + str[1] + str[1] + str[2] + str[2] + str[3] + str[3];
    if (str.length >= 7) return str.slice(0, 7);
  }
  const rgbaMatch = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbaMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbaMatch[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  return '#38bdf8';
}

function hexToRgba(hex, alpha = 0.2) {
  const clean = toHexColor(hex);
  const r = parseInt(clean.slice(1, 3), 16);
  const g = parseInt(clean.slice(3, 5), 16);
  const b = parseInt(clean.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function updateBadgeLivePreview(container, bIdx, badge, iconRenderer) {
  const lightBox = container.querySelector(`#previewBadgeLight_${bIdx}`);
  const darkBox = container.querySelector(`#previewBadgeDark_${bIdx}`);
  const nameInp = container.querySelector(`.in-badge-name[data-bidx="${bIdx}"]`);
  const displayName = nameInp?.value || badge.name || '21.5°C';
  const iconName = badge.icon || 'star';

  if (lightBox) {
    lightBox.style.color = badge.icon_color_light || '#ea580c';
    lightBox.style.background = badge.bg_light || 'rgba(234,88,12,0.1)';
    lightBox.style.borderColor = badge.border_light || 'rgba(234,88,12,0.25)';
    const iconSpan = lightBox.querySelector('.preview-badge-icon');
    if (iconSpan) iconSpan.innerHTML = iconRenderer(iconName, { size: 14, color: badge.icon_color_light || '#ea580c' });
    const textSpan = lightBox.querySelector('.preview-badge-text');
    if (textSpan) textSpan.textContent = displayName;
  }
  if (darkBox) {
    darkBox.style.color = badge.icon_color_dark || '#fb923c';
    darkBox.style.background = badge.bg_dark || 'rgba(251,146,60,0.15)';
    darkBox.style.borderColor = badge.border_dark || 'rgba(251,146,60,0.35)';
    const iconSpan = darkBox.querySelector('.preview-badge-icon');
    if (iconSpan) iconSpan.innerHTML = iconRenderer(iconName, { size: 14, color: badge.icon_color_dark || '#fb923c' });
    const textSpan = darkBox.querySelector('.preview-badge-text');
    if (textSpan) textSpan.textContent = displayName;
  }
}

export const settingsMethods = {
  _showIconPicker({ currentValue = '', onSelect }) {
    let pickerOverlay = this.shadowRoot.getElementById('iconPickerOverlay');
    if (pickerOverlay) pickerOverlay.remove();

    pickerOverlay = document.createElement('div');
    pickerOverlay.id = 'iconPickerOverlay';
    pickerOverlay.style.cssText = `
      position: fixed;
      top: var(--header-height, 56px);
      left: 0;
      right: 0;
      bottom: 0;
      height: calc(100vh - var(--header-height, 56px));
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      z-index: 250;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      box-sizing: border-box;
    `;

    let activeCategory = 'all';
    let searchQuery = '';
    let customVal = currentValue || '';

    // Build icon list
    const builtinList = Object.keys(ICONS || {}).map(k => ({ name: k, label: k, isMdi: false }));
    const popularCategories = POPULAR_HA_ICONS || [];
    const allPopularMdi = [];
    popularCategories.forEach(cat => {
      cat.icons.forEach(ic => {
        if (!allPopularMdi.some(x => x.name === ic)) {
          allPopularMdi.push({ name: ic, label: ic.replace('mdi:', ''), category: cat.category, isMdi: true });
        }
      });
    });

    const categories = [
      { id: 'all', label: '<ha-icon icon="mdi:star" style="--mdc-icon-size:16px;"></ha-icon> Alle Favoriten' },
      ...popularCategories.map(c => ({ id: c.category, label: c.category })),
      { id: 'builtin', label: '<ha-icon icon="mdi:palette" style="--mdc-icon-size:16px;"></ha-icon> Vision Glass Icons' }
    ];

    pickerOverlay.innerHTML = `
      <div class="icon-picker-card" style="
        background: var(--bg-card, rgba(15, 23, 42, 0.95));
        border: 1px solid var(--border-glass, rgba(255, 255, 255, 0.2));
        border-radius: 18px;
        width: 100%;
        max-width: 640px;
        max-height: calc(100vh - var(--header-height, 56px) - 32px);
        display: flex;
        flex-direction: column;
        box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7);
        overflow: hidden;
        color: var(--text-primary, #ffffff);
        font-family: inherit;
      ">
        <!-- Header -->
        <div style="padding: 16px 20px 12px; border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.1)); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03);">
          <div>
            <div style="font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
              <ha-icon icon="mdi:palette" style="--mdc-icon-size:18px;color:var(--accent);"></ha-icon> Icon auswählen
            </div>
            <div style="font-size: 12px; color: var(--text-secondary, #94a3b8); margin-top: 2px;">
              Wähle aus Standard-Icons oder gib ein beliebiges Home Assistant Icon ein (z.B. <code style="color:var(--accent,#38bdf8);">mdi:thermometer</code>)
            </div>
          </div>
          <button id="btnIconPickerClose" style="background: transparent; border: none; font-size: 26px; color: var(--text-secondary, #94a3b8); cursor: pointer; padding: 0 6px; line-height: 1; border-radius: 6px;">&times;</button>
        </div>

        <!-- Custom Icon Input & Search Bar -->
        <div style="padding: 12px 20px; border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); display: flex; flex-direction: column; gap: 10px;">
          <!-- Direct MDI input bar -->
          <div style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.04);padding:8px 12px;border-radius:10px;border:1px solid var(--border-subtle, rgba(255,255,255,0.1));">
            <div id="iconPickerCustomPreview" style="width:36px;height:36px;border-radius:8px;background:var(--bg-surface);border:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:center;color:var(--accent,#38bdf8);flex-shrink:0;">
              ${this._icon(customVal || 'star', { size: 22 })}
            </div>
            <input type="text" id="iconPickerCustomInp" value="${customVal}" placeholder="mdi:xyz oder Icon-Name..." style="flex:1;padding:8px 12px;border-radius:8px;border:1px solid var(--border-glass, rgba(255,255,255,0.2));background:rgba(255,255,255,0.07);color:var(--text-primary,#ffffff);font-size:13px;font-family:monospace;outline:none;">
            <button type="button" id="btnApplyCustomIcon" style="padding:8px 14px;border-radius:8px;background:var(--accent,#38bdf8);color:#ffffff;border:none;font-weight:700;font-size:12px;cursor:pointer;white-space:nowrap;">
              Übernehmen
            </button>
          </div>

          <!-- Live Search filter -->
          <input type="text" id="iconPickerSearchInp" placeholder="Schnellsuche in Favoriten..." style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-subtle, rgba(255,255,255,0.15)); background: rgba(255,255,255,0.04); color: var(--text-primary, #ffffff); font-size: 13px; outline: none; box-sizing: border-box;">

          <!-- Category Pills -->
          <div id="iconPickerCategoryPills" style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px;">
            ${categories.map(c => `
              <button type="button" class="icon-cat-pill ${c.id === 'all' ? 'active' : ''}" data-cat="${c.id}" style="
                padding: 4px 10px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: 600;
                border: 1px solid ${c.id === 'all' ? 'var(--accent, #38bdf8)' : 'var(--border-subtle, rgba(255,255,255,0.15))'};
                background: ${c.id === 'all' ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)'};
                color: ${c.id === 'all' ? 'var(--accent, #38bdf8)' : 'var(--text-secondary, #94a3b8)'};
                cursor: pointer;
                white-space: nowrap;
                transition: all 0.15s ease;
              ">
                ${c.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Scrollable Icon Grid -->
        <div id="iconPickerGridContainer" style="padding: 16px 20px; overflow-y: auto; flex: 1; max-height: 380px;">
          <div id="iconPickerGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(78px, 1fr)); gap: 8px;">
            <!-- Rendered by updateGrid() -->
          </div>
        </div>
      </div>
    `;

    this.shadowRoot.appendChild(pickerOverlay);

    const updateGrid = () => {
      const grid = pickerOverlay.querySelector('#iconPickerGrid');
      if (!grid) return;

      let list = [];
      if (activeCategory === 'builtin') {
        list = builtinList;
      } else if (activeCategory === 'all') {
        list = [...builtinList, ...allPopularMdi];
      } else {
        const catObj = popularCategories.find(c => c.category === activeCategory);
        list = (catObj?.icons || []).map(ic => ({ name: ic, label: ic.replace('mdi:', ''), isMdi: true }));
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        list = list.filter(item => item.name.toLowerCase().includes(q) || item.label.toLowerCase().includes(q));
      }

      if (list.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-secondary, #94a3b8); font-size: 13px;">
            Kein passendes Icon in den Favoriten gefunden. Gib den Namen oben im MDI-Feld direkt ein!
          </div>
        `;
        return;
      }

      grid.innerHTML = list.map(item => `
        <button type="button" class="btn-select-icon" data-icon="${item.name}" style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 4px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.12));
          color: var(--text-primary, #ffffff);
          cursor: pointer;
          transition: all 0.15s ease;
          overflow: hidden;
        ">
          <div style="color: var(--accent, #38bdf8); display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;">
            ${this._icon(item.name, { size: 24 })}
          </div>
          <div style="font-size: 10px; color: var(--text-secondary, #94a3b8); max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 2px;">
            ${item.label}
          </div>
        </button>
      `).join('');

      grid.querySelectorAll('.btn-select-icon').forEach(btn => {
        btn.onmouseenter = () => {
          btn.style.background = 'rgba(56, 189, 248, 0.15)';
          btn.style.borderColor = 'var(--accent, #38bdf8)';
        };
        btn.onmouseleave = () => {
          btn.style.background = 'rgba(255, 255, 255, 0.04)';
          btn.style.borderColor = 'var(--border-subtle, rgba(255, 255, 255, 0.12))';
        };
        btn.onclick = () => {
          const selected = btn.getAttribute('data-icon');
          if (onSelect) onSelect(selected);
          pickerOverlay.remove();
        };
      });
    };

    updateGrid();

    // Event listeners
    const customInp = pickerOverlay.querySelector('#iconPickerCustomInp');
    const customPrev = pickerOverlay.querySelector('#iconPickerCustomPreview');
    if (customInp && customPrev) {
      customInp.oninput = () => {
        const val = customInp.value.trim() || 'star';
        customPrev.innerHTML = this._icon(val, { size: 22 });
      };
    }

    const btnApply = pickerOverlay.querySelector('#btnApplyCustomIcon');
    if (btnApply && customInp) {
      btnApply.onclick = () => {
        const val = customInp.value.trim();
        if (val && onSelect) onSelect(val);
        pickerOverlay.remove();
      };
    }

    const searchInp = pickerOverlay.querySelector('#iconPickerSearchInp');
    if (searchInp) {
      searchInp.oninput = () => {
        searchQuery = searchInp.value.trim();
        updateGrid();
      };
    }

    pickerOverlay.querySelectorAll('.icon-cat-pill').forEach(pill => {
      pill.onclick = () => {
        activeCategory = pill.getAttribute('data-cat');
        pickerOverlay.querySelectorAll('.icon-cat-pill').forEach(p => {
          p.style.borderColor = 'var(--border-subtle, rgba(255,255,255,0.15))';
          p.style.background = 'rgba(255, 255, 255, 0.04)';
          p.style.color = 'var(--text-secondary, #94a3b8)';
        });
        pill.style.borderColor = 'var(--accent, #38bdf8)';
        pill.style.background = 'rgba(56, 189, 248, 0.18)';
        pill.style.color = 'var(--accent, #38bdf8)';
        updateGrid();
      };
    });

    const closeBtn = pickerOverlay.querySelector('#btnIconPickerClose');
    if (closeBtn) closeBtn.onclick = () => pickerOverlay.remove();

    pickerOverlay.onclick = (e) => {
      if (e.target === pickerOverlay) pickerOverlay.remove();
    };
  },
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
      { id: 'light', label: '<ha-icon icon="mdi:lightbulb" style="--mdc-icon-size:14px;"></ha-icon> Licht' },
      { id: 'climate', label: '<ha-icon icon="mdi:thermometer" style="--mdc-icon-size:14px;"></ha-icon> Klima' },
      { id: 'sensor', label: '<ha-icon icon="mdi:chart-box-outline" style="--mdc-icon-size:14px;"></ha-icon> Sensoren' },
      { id: 'binary_sensor', label: '<ha-icon icon="mdi:motion-sensor" style="--mdc-icon-size:14px;"></ha-icon> Binär' },
      { id: 'switch', label: '<ha-icon icon="mdi:power-socket-eu" style="--mdc-icon-size:14px;"></ha-icon> Schalter' },
      { id: 'media_player', label: '<ha-icon icon="mdi:television" style="--mdc-icon-size:14px;"></ha-icon> Media' },
      { id: 'lock', label: '<ha-icon icon="mdi:lock" style="--mdc-icon-size:14px;"></ha-icon> Schloss' },
      { id: 'input_number', label: '<ha-icon icon="mdi:tune" style="--mdc-icon-size:14px;"></ha-icon> Helfer' }
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
              <ha-icon icon="mdi:magnify" style="--mdc-icon-size:18px;color:var(--accent);"></ha-icon> Entität auswählen
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
          <button type="button" id="btnPickerClear" style="color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.1); padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
            <ha-icon icon="mdi:close" style="--mdc-icon-size:14px;"></ha-icon> Entität leeren
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
            <div style="margin-bottom: 8px; opacity: 0.5;"><ha-icon icon="mdi:magnify" style="--mdc-icon-size:32px;"></ha-icon></div>
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
              ${inRoom ? `<span style="font-size: 10px; background: rgba(56, 189, 248, 0.15); color: var(--accent, #38bdf8); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.3); display: inline-flex; align-items: center; gap: 3px;"><ha-icon icon="mdi:map-marker" style="--mdc-icon-size:11px;"></ha-icon> ${roomName || roomId}</span>` : ''}
              <span style="font-size: 11px; color: var(--text-secondary, #94a3b8); background: rgba(255, 255, 255, 0.07); padding: 2px 7px; border-radius: 6px; white-space: nowrap;">
                ${stateVal} ${unit}
              </span>
              ${isSelected ? `<ha-icon icon="mdi:check" style="--mdc-icon-size:14px;color:var(--accent,#38bdf8);"></ha-icon>` : ''}
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
          <ha-icon icon="mdi:arrow-left" style="--mdc-icon-size:16px;"></ha-icon> Zum Dashboard
        </button>
      </div>

      <!-- Settings Navigation Tabs -->
      <div class="nav-tabs" style="display:flex;flex-wrap:wrap;gap:8px;border-bottom:1px solid var(--border-subtle);padding-bottom:12px;margin-bottom:16px;">
        <button class="nav-tab ${activeTab === 'rooms' ? 'active' : ''}" data-stab="rooms" style="display:inline-flex;align-items:center;gap:6px;"><ha-icon icon="mdi:home-outline" style="--mdc-icon-size:16px;"></ha-icon> ${this._t('rooms_and_cards')} (${rooms.length})</button>
        <button class="nav-tab ${activeTab === 'badges' ? 'active' : ''}" data-stab="badges" style="display:inline-flex;align-items:center;gap:6px;"><ha-icon icon="mdi:tag-outline" style="--mdc-icon-size:16px;"></ha-icon> Bento-Badges (${bentoBadges.length})</button>
        <button class="nav-tab ${activeTab === 'overlays' ? 'active' : ''}" data-stab="overlays" style="display:inline-flex;align-items:center;gap:6px;"><ha-icon icon="mdi:folder-outline" style="--mdc-icon-size:16px;"></ha-icon> Raum-Overlays</button>
        <button class="nav-tab ${activeTab === 'dock' ? 'active' : ''}" data-stab="dock" style="display:inline-flex;align-items:center;gap:6px;"><ha-icon icon="mdi:dock-bottom" style="--mdc-icon-size:16px;"></ha-icon> ${this._t('dock_navigation')}</button>
        <button class="nav-tab ${activeTab === 'controls' ? 'active' : ''}" data-stab="controls" style="display:inline-flex;align-items:center;gap:6px;"><ha-icon icon="mdi:tune" style="--mdc-icon-size:16px;"></ha-icon> Helfer-Kontrollen</button>
        <button class="nav-tab ${activeTab === 'stats' ? 'active' : ''}" data-stab="stats" style="display:inline-flex;align-items:center;gap:6px;"><ha-icon icon="mdi:chart-timeline-variant" style="--mdc-icon-size:16px;"></ha-icon> Statistiken</button>
        <button class="nav-tab ${activeTab === 'general' ? 'active' : ''}" data-stab="general" style="display:inline-flex;align-items:center;gap:6px;"><ha-icon icon="mdi:cog-outline" style="--mdc-icon-size:16px;"></ha-icon> Design & Allgemein</button>
      </div>

      <!-- TAB 1: RÄUME & BENTO-KARTEN -->
      <div id="stabContentRooms" style="${activeTab === 'rooms' ? '' : 'display:none;'}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
          <span style="font-size:12px;color:var(--text-secondary);">${this._t('reorder_rooms')}</span>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-sm btn-primary" id="btnSyncAreas" style="display:inline-flex;align-items:center;gap:6px;"><ha-icon icon="mdi:refresh" style="--mdc-icon-size:16px;"></ha-icon> ${this._t('sync_areas_btn')}</button>
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
                ${r.picture ? `<img src="${r.picture}" style="width:46px;height:46px;border-radius:8px;object-fit:cover;border:1px solid var(--border-glass);" />` : `<div style="width:46px;height:46px;border-radius:8px;background:var(--bg-surface);display:flex;align-items:center;justify-content:center;"><ha-icon icon="mdi:home" style="--mdc-icon-size:24px;color:var(--accent);"></ha-icon></div>`}
                <div style="flex:1;">
                  <div style="font-weight:700;font-size:15px;color:var(--text-primary);">${r.name || r.id}</div>
                  <div style="font-size:12px;color:var(--text-secondary);display:flex;align-items:center;gap:6px;margin-top:2px;">
                    <span>HA-Bereich ID:</span>
                    <code style="background:rgba(0,0,0,0.2);padding:2px 6px;border-radius:4px;font-family:monospace;color:var(--accent);">${r.id}</code>
                  </div>
                </div>
                <div style="font-size:11px;color:var(--text-secondary);background:rgba(255,255,255,0.06);padding:4px 8px;border-radius:6px;text-align:right;display:inline-flex;align-items:center;gap:4px;">
                  <ha-icon icon="mdi:lock-outline" style="--mdc-icon-size:14px;"></ha-icon> ${this._t('managed_by_ha_areas')}
                </div>
              </div>
              <div style="font-size:11px;color:var(--text-secondary);margin-bottom:12px;line-height:1.4;">
                ${this._t('ha_area_notice')}
              </div>

              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:8px;margin-top:6px;border-top:1px dashed var(--border-subtle);padding-top:8px;">
                <div class="row">
                  <label style="display:inline-flex;align-items:center;gap:4px;"><ha-icon icon="mdi:lightbulb" style="--mdc-icon-size:14px;"></ha-icon> Beleuchtung (light.*)</label>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input type="text" list="dl_all_entities" class="in-room-prop" data-ridx="${rIdx}" data-prop="light_entity" value="${r.light_entity || ''}" placeholder="light.livingroom" style="flex:1;">
                    <button type="button" class="btn btn-sm btn-pick-entity" data-ridx="${rIdx}" data-prop="light_entity" title="Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><ha-icon icon="mdi:magnify" style="--mdc-icon-size:14px;"></ha-icon></button>
                  </div>
                </div>
                <div class="row">
                  <label style="display:inline-flex;align-items:center;gap:4px;"><ha-icon icon="mdi:thermometer" style="--mdc-icon-size:14px;"></ha-icon> Thermostat (climate.*)</label>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input type="text" list="dl_all_entities" class="in-room-prop" data-ridx="${rIdx}" data-prop="climate_entity" value="${r.climate_entity || ''}" placeholder="climate.better_thermostat_..." style="flex:1;">
                    <button type="button" class="btn btn-sm btn-pick-entity" data-ridx="${rIdx}" data-prop="climate_entity" title="Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><ha-icon icon="mdi:magnify" style="--mdc-icon-size:14px;"></ha-icon></button>
                  </div>
                </div>
                <div class="row">
                  <label style="display:inline-flex;align-items:center;gap:4px;"><ha-icon icon="mdi:target" style="--mdc-icon-size:14px;"></ha-icon> Zieltemp. Helfer (input_number.*)</label>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input type="text" list="dl_all_entities" class="in-room-prop" data-ridx="${rIdx}" data-prop="target_temp_entity" value="${r.target_temp_entity || ''}" placeholder="input_number.*_komfort_temperatur" style="flex:1;">
                    <button type="button" class="btn btn-sm btn-pick-entity" data-ridx="${rIdx}" data-prop="target_temp_entity" title="Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><ha-icon icon="mdi:magnify" style="--mdc-icon-size:14px;"></ha-icon></button>
                  </div>
                </div>
                <div class="row">
                  <label style="display:inline-flex;align-items:center;gap:4px;"><ha-icon icon="mdi:thermometer" style="--mdc-icon-size:14px;"></ha-icon> Ist-Temperatur Sensor</label>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input type="text" list="dl_all_entities" class="in-room-prop" data-ridx="${rIdx}" data-prop="temp_entity" value="${r.temp_entity || ''}" placeholder="sensor.*_temperatur" style="flex:1;">
                    <button type="button" class="btn btn-sm btn-pick-entity" data-ridx="${rIdx}" data-prop="temp_entity" title="Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><ha-icon icon="mdi:magnify" style="--mdc-icon-size:14px;"></ha-icon></button>
                  </div>
                </div>
                <div class="row">
                  <label style="display:inline-flex;align-items:center;gap:4px;"><ha-icon icon="mdi:water-percent" style="--mdc-icon-size:14px;"></ha-icon> Luftfeuchtigkeit Sensor</label>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input type="text" list="dl_all_entities" class="in-room-prop" data-ridx="${rIdx}" data-prop="humidity_entity" value="${r.humidity_entity || ''}" placeholder="sensor.*_humidity" style="flex:1;">
                    <button type="button" class="btn btn-sm btn-pick-entity" data-ridx="${rIdx}" data-prop="humidity_entity" title="Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><ha-icon icon="mdi:magnify" style="--mdc-icon-size:14px;"></ha-icon></button>
                  </div>
                </div>
                <div class="row">
                  <label style="display:inline-flex;align-items:center;gap:4px;"><ha-icon icon="mdi:brightness-6" style="--mdc-icon-size:14px;"></ha-icon> Helligkeit / Lux Sensor</label>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input type="text" list="dl_all_entities" class="in-room-prop" data-ridx="${rIdx}" data-prop="illuminance_entity" value="${r.illuminance_entity || ''}" placeholder="sensor.*_illuminance" style="flex:1;">
                    <button type="button" class="btn btn-sm btn-pick-entity" data-ridx="${rIdx}" data-prop="illuminance_entity" title="Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><ha-icon icon="mdi:magnify" style="--mdc-icon-size:14px;"></ha-icon></button>
                  </div>
                </div>
                <div class="row">
                  <label style="display:inline-flex;align-items:center;gap:4px;"><ha-icon icon="mdi:motion-sensor" style="--mdc-icon-size:14px;"></ha-icon> Präsenz / Bewegung</label>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input type="text" list="dl_all_entities" class="in-room-prop" data-ridx="${rIdx}" data-prop="presence_entity" value="${r.presence_entity || ''}" placeholder="binary_sensor.*_occupied" style="flex:1;">
                    <button type="button" class="btn btn-sm btn-pick-entity" data-ridx="${rIdx}" data-prop="presence_entity" title="Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><ha-icon icon="mdi:magnify" style="--mdc-icon-size:14px;"></ha-icon></button>
                  </div>
                </div>
                <div class="row">
                  <label style="display:inline-flex;align-items:center;gap:4px;"><ha-icon icon="mdi:window-closed" style="--mdc-icon-size:14px;"></ha-icon> Fensterkontakt</label>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input type="text" list="dl_all_entities" class="in-room-prop" data-ridx="${rIdx}" data-prop="window_entity" value="${r.window_entity || ''}" placeholder="binary_sensor.fenster..." style="flex:1;">
                    <button type="button" class="btn btn-sm btn-pick-entity" data-ridx="${rIdx}" data-prop="window_entity" title="Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><ha-icon icon="mdi:magnify" style="--mdc-icon-size:14px;"></ha-icon></button>
                  </div>
                </div>
                <div class="row">
                  <label style="display:inline-flex;align-items:center;gap:4px;"><ha-icon icon="mdi:power-socket-eu" style="--mdc-icon-size:14px;"></ha-icon> Steckdose / Schalter (switch.*)</label>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input type="text" list="dl_all_entities" class="in-room-prop" data-ridx="${rIdx}" data-prop="switch_entity" value="${r.switch_entity || ''}" placeholder="switch.smartplug..." style="flex:1;">
                    <button type="button" class="btn btn-sm btn-pick-entity" data-ridx="${rIdx}" data-prop="switch_entity" title="Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><ha-icon icon="mdi:magnify" style="--mdc-icon-size:14px;"></ha-icon></button>
                  </div>
                </div>
                <div class="row">
                  <label style="display:inline-flex;align-items:center;gap:4px;"><ha-icon icon="mdi:television" style="--mdc-icon-size:14px;"></ha-icon> ${this._t('tv_display')}</label>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input type="text" list="dl_all_entities" class="in-room-prop" data-ridx="${rIdx}" data-prop="tv_entity" value="${r.tv_entity || ''}" placeholder="media_player.wohnzimmer_tv_2" style="flex:1;">
                    <button type="button" class="btn btn-sm btn-pick-entity" data-ridx="${rIdx}" data-prop="tv_entity" title="Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><ha-icon icon="mdi:magnify" style="--mdc-icon-size:14px;"></ha-icon></button>
                  </div>
                </div>
                <div class="row">
                  <label style="display:inline-flex;align-items:center;gap:4px;"><ha-icon icon="mdi:gamepad-variant" style="--mdc-icon-size:14px;"></ha-icon> ${this._t('video_player')}</label>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input type="text" list="dl_all_entities" class="in-room-prop" data-ridx="${rIdx}" data-prop="video_entity" value="${r.video_entity || ''}" placeholder="media_player.shield_android_tv" style="flex:1;">
                    <button type="button" class="btn btn-sm btn-pick-entity" data-ridx="${rIdx}" data-prop="video_entity" title="Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><ha-icon icon="mdi:magnify" style="--mdc-icon-size:14px;"></ha-icon></button>
                  </div>
                </div>
                <div class="row">
                  <label style="display:inline-flex;align-items:center;gap:4px;"><ha-icon icon="mdi:music" style="--mdc-icon-size:14px;"></ha-icon> ${this._t('audio_player')}</label>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input type="text" list="dl_all_entities" class="in-room-prop" data-ridx="${rIdx}" data-prop="media_entity" value="${r.media_entity || ''}" placeholder="media_player.echo_show" style="flex:1;">
                    <button type="button" class="btn btn-sm btn-pick-entity" data-ridx="${rIdx}" data-prop="media_entity" title="Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><ha-icon icon="mdi:magnify" style="--mdc-icon-size:14px;"></ha-icon></button>
                  </div>
                </div>

                <!-- Bento Card Action Icons Configuration -->
                <div style="margin-top:12px;padding-top:10px;border-top:1px dashed var(--border-subtle);grid-column:1 / -1;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <label style="font-size:11px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;display:block;">Aktions-Icons auf Bento-Karte</label>
                    <button type="button" class="btn btn-sm btn-add-custom-room-action" data-ridx="${rIdx}" style="padding:4px 8px;font-size:11px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.3);color:var(--accent);border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
                      <ha-icon icon="mdi:plus" style="--mdc-icon-size:13px;"></ha-icon> Eigenes Aktions-Icon
                    </button>
                  </div>

                  <!-- Standard Actions -->
                  <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:8px;">
                    ${(() => {
                      const acts = this._getRoomBentoActions(r);
                      const stdTypes = [
                        { type: 'light', label: 'Licht', icon: 'mdi:lightbulb', has: Boolean(r.light_entity) },
                        { type: 'climate', label: 'Heizung', icon: 'mdi:thermometer', has: Boolean(r.climate_entity) },
                        { type: 'media', label: 'Medien', icon: 'mdi:music', has: Boolean(r.media_entity || r.audio_entity || r.video_entity) },
                        { type: 'lock', label: 'Schloss', icon: 'mdi:lock', has: Boolean(r.lock_entity) },
                        { type: 'switch', label: 'Steckdose', icon: 'mdi:power-socket-eu', has: Boolean(r.switch_entity) }
                      ];
                      return stdTypes.map(st => {
                        const configured = acts.find(a => a.type === st.type);
                        const isChecked = configured ? configured.enabled !== false : st.has;
                        return `
                          <label style="font-size:12px;display:inline-flex;align-items:center;gap:6px;cursor:pointer;background:var(--bg-surface);padding:4px 8px;border-radius:6px;border:1px solid var(--border-subtle);">
                            <input type="checkbox" class="chk-bento-action" data-ridx="${rIdx}" data-act-type="${st.type}" ${isChecked ? 'checked' : ''}>
                            <ha-icon icon="${st.icon}" style="--mdc-icon-size:14px;color:var(--accent);"></ha-icon>
                            <span>${st.label}</span>
                          </label>
                        `;
                      }).join('');
                    })()}
                  </div>

                  <!-- Custom Action Icons for Room -->
                  ${(() => {
                    const acts = this._getRoomBentoActions(r);
                    const customActs = acts.filter(a => a.type === 'custom');
                    if (customActs.length === 0) return '';
                    return `
                      <div style="display:flex;flex-direction:column;gap:6px;margin-top:8px;">
                        ${customActs.map((ca, caIdx) => `
                          <div style="display:flex;align-items:center;gap:8px;background:var(--bg-surface);padding:6px 10px;border-radius:8px;border:1px solid var(--border-subtle);flex-wrap:wrap;">
                            <div id="roomActIconBox_${rIdx}_${caIdx}" style="width:28px;height:28px;border-radius:6px;background:rgba(56,189,248,0.12);display:flex;align-items:center;justify-content:center;color:var(--accent);flex-shrink:0;">
                              <ha-icon icon="${ca.icon || 'mdi:star'}" style="--mdc-icon-size:16px;"></ha-icon>
                            </div>
                            <input type="text" class="in-custom-act-title" data-ridx="${rIdx}" data-caidx="${caIdx}" value="${ca.title || ''}" placeholder="Titel (z.B. Ventilator)" style="width:130px;padding:4px 8px;border-radius:6px;border:1px solid var(--border-subtle);background:var(--bg-card);color:var(--text-primary);font-size:12px;">
                            <div style="display:flex;align-items:center;gap:4px;flex:1;min-width:180px;">
                              <input type="text" class="in-custom-act-entity" data-ridx="${rIdx}" data-caidx="${caIdx}" value="${ca.entity_id || ''}" placeholder="switch.xyz oder script.xyz" style="flex:1;padding:4px 8px;border-radius:6px;border:1px solid var(--border-subtle);background:var(--bg-card);color:var(--text-primary);font-size:11px;font-family:monospace;">
                              <button type="button" class="btn btn-sm btn-pick-custom-act-entity" data-ridx="${rIdx}" data-caidx="${caIdx}" style="padding:4px 8px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.3);color:var(--accent);border-radius:6px;cursor:pointer;">
                                <ha-icon icon="mdi:magnify" style="--mdc-icon-size:14px;"></ha-icon>
                              </button>
                            </div>
                            <button type="button" class="btn btn-sm btn-pick-custom-act-icon" data-ridx="${rIdx}" data-caidx="${caIdx}" style="padding:4px 8px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.3);color:var(--accent);border-radius:6px;cursor:pointer;font-size:11px;display:inline-flex;align-items:center;gap:4px;">
                              <ha-icon icon="mdi:palette-outline" style="--mdc-icon-size:13px;"></ha-icon> Icon
                            </button>
                            <button type="button" class="btn-micro btn-del-custom-act" data-ridx="${rIdx}" data-caidx="${caIdx}" style="color:#ef4444;background:none;border:none;cursor:pointer;padding:2px 6px;">
                              <ha-icon icon="mdi:close" style="--mdc-icon-size:14px;"></ha-icon>
                            </button>
                          </div>
                        `).join('')}
                      </div>
                    `;
                  })()}
                </div>

                <!-- Bento Card Badges Assignment -->
                <div style="margin-top:12px;padding-top:10px;border-top:1px dashed var(--border-subtle);grid-column:1 / -1;">
                  <label style="font-size:11px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;display:block;margin-bottom:6px;">Sensor-Badges auf dieser Bento-Karte</label>
                  <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    ${(() => {
                      const allBadges = this._getEffectiveBentoBadges();
                      return allBadges.map(b => {
                        const isChecked = !b.rooms || b.rooms.includes('all') || b.rooms.includes(r.id);
                        return `
                          <label style="font-size:12px;display:inline-flex;align-items:center;gap:6px;cursor:pointer;background:var(--bg-surface);padding:5px 10px;border-radius:8px;border:1px solid var(--border-subtle);">
                            <input type="checkbox" class="chk-bento-badge-for-room" data-ridx="${rIdx}" data-bid="${b.id}" ${isChecked ? 'checked' : ''}>
                            <span style="color:${b.icon_color_light || 'var(--accent)'};display:inline-flex;">${this._icon(b.icon || 'star', { size: 14 })}</span>
                            <span style="font-weight:600;">${b.name || b.id}</span>
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
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:8px;flex-wrap:wrap;">
                  <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:200px;">
                    <div id="badgeHeaderIconBox_${bIdx}" style="width:34px;height:34px;border-radius:10px;background:rgba(56,189,248,0.15);border:1px solid rgba(56,189,248,0.3);display:flex;align-items:center;justify-content:center;color:var(--accent);">
                      ${this._icon(b.icon || 'star', { size: 18 })}
                    </div>
                    <input type="text" class="in-badge-name" data-bidx="${bIdx}" value="${b.name || ''}" placeholder="Badge Name (z.B. Temperatur)" style="padding:6px 10px;border-radius:8px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);font-size:14px;font-weight:700;flex:1;min-width:140px;">
                  </div>
                  <button type="button" class="btn btn-sm btn-del-bento-badge" data-bidx="${bIdx}" style="color:#ef4444;border-color:rgba(239,68,68,0.4);cursor:pointer;padding:6px 12px;display:inline-flex;align-items:center;gap:4px;">
                    <ha-icon icon="mdi:close" style="--mdc-icon-size:14px;"></ha-icon> Badge löschen
                  </button>
                </div>

                <!-- Live Preview Row: Light Mode & Dark Mode -->
                <div style="display:flex;align-items:center;gap:12px;background:var(--bg-surface);padding:8px 12px;border-radius:10px;border:1px solid var(--border-subtle);margin-bottom:12px;flex-wrap:wrap;">
                  <div style="font-size:11px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;">Live-Vorschau:</div>
                  <div style="background:#f8fafc;padding:5px 10px;border-radius:8px;display:flex;align-items:center;gap:6px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
                    <ha-icon icon="mdi:weather-sunny" style="--mdc-icon-size:14px;color:#d97706;"></ha-icon>
                    <span id="previewBadgeLight_${bIdx}" class="env-pill" style="color:${b.icon_color_light || '#ea580c'};background:${b.bg_light || 'rgba(234,88,12,0.1)'};border:1px solid ${b.border_light || 'rgba(234,88,12,0.25)'};display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:999px;font-size:12px;font-weight:600;">
                      <span class="preview-badge-icon">${this._icon(b.icon || 'star', { size: 14, color: b.icon_color_light || '#ea580c' })}</span>
                      <span class="preview-badge-text">${b.name || '21.5°C'}</span>
                    </span>
                  </div>
                  <div style="background:#0b111e;padding:5px 10px;border-radius:8px;display:flex;align-items:center;gap:6px;box-shadow:0 1px 3px rgba(0,0,0,0.3);">
                    <ha-icon icon="mdi:weather-night" style="--mdc-icon-size:14px;color:#38bdf8;"></ha-icon>
                    <span id="previewBadgeDark_${bIdx}" class="env-pill" style="color:${b.icon_color_dark || '#fb923c'};background:${b.bg_dark || 'rgba(251,146,60,0.15)'};border:1px solid ${b.border_dark || 'rgba(251,146,60,0.35)'};display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:999px;font-size:12px;font-weight:600;">
                      <span class="preview-badge-icon">${this._icon(b.icon || 'star', { size: 14, color: b.icon_color_dark || '#fb923c' })}</span>
                      <span class="preview-badge-text">${b.name || '21.5°C'}</span>
                    </span>
                  </div>
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
                        <button type="button" class="btn btn-sm btn-pick-badge-entity" data-bidx="${bIdx}" style="padding:6px 10px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><ha-icon icon="mdi:magnify" style="--mdc-icon-size:14px;"></ha-icon></button>
                      </div>
                    </div>
                  ` : ''}

                  <div class="form-group">
                    <label style="font-size:11px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;display:block;margin-bottom:4px;">Icon (MDI oder Built-in)</label>
                    <div style="display:flex;align-items:center;gap:6px;">
                      <div id="badgeIconBox_${bIdx}" style="width:34px;height:34px;border-radius:8px;background:var(--bg-surface);border:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:center;color:var(--accent);flex-shrink:0;">
                        ${this._icon(b.icon || 'star', { size: 18 })}
                      </div>
                      <input type="text" class="in-badge-icon" data-bidx="${bIdx}" value="${b.icon || 'star'}" placeholder="mdi:thermometer oder star" style="flex:1;min-width:0;padding:7px 10px;border-radius:8px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);font-size:13px;font-family:monospace;">
                      <button type="button" class="btn btn-sm btn-pick-badge-icon" data-bidx="${bIdx}" style="padding:7px 10px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;white-space:nowrap;font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:4px;">
                        <ha-icon icon="mdi:magnify" style="--mdc-icon-size:14px;"></ha-icon> Icon
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Colors Configuration with Color Picker Swatches: Light & Dark Mode -->
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:12px;margin-bottom:14px;">
                  <!-- Light Mode Colors -->
                  <div style="background:rgba(255,255,255,0.04);border:1px solid var(--border-subtle);border-radius:10px;padding:12px;">
                    <div style="font-size:12px;font-weight:700;color:#fbbf24;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
                      <ha-icon icon="mdi:weather-sunny" style="--mdc-icon-size:16px;"></ha-icon> Helles Theme (Farben)
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                      <div>
                        <label style="font-size:10px;color:var(--text-secondary);display:block;margin-bottom:2px;">Iconfarbe</label>
                        <div style="display:flex;align-items:center;gap:4px;">
                          <input type="color" class="color-picker-swatch" data-bidx="${bIdx}" data-prop="icon_color_light" value="${toHexColor(b.icon_color_light || '#ea580c')}" style="width:28px;height:28px;padding:0;border:1px solid var(--border-subtle);border-radius:6px;cursor:pointer;background:none;flex-shrink:0;">
                          <input type="text" class="in-badge-color" data-bidx="${bIdx}" data-prop="icon_color_light" value="${b.icon_color_light || '#ea580c'}" style="flex:1;min-width:0;padding:5px 6px;border-radius:6px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);font-size:11px;font-family:monospace;box-sizing:border-box;">
                        </div>
                      </div>
                      <div>
                        <label style="font-size:10px;color:var(--text-secondary);display:block;margin-bottom:2px;">Hintergrund</label>
                        <div style="display:flex;align-items:center;gap:4px;">
                          <input type="color" class="color-picker-swatch" data-bidx="${bIdx}" data-prop="bg_light" value="${toHexColor(b.bg_light || 'rgba(234,88,12,0.1)')}" style="width:28px;height:28px;padding:0;border:1px solid var(--border-subtle);border-radius:6px;cursor:pointer;background:none;flex-shrink:0;">
                          <input type="text" class="in-badge-color" data-bidx="${bIdx}" data-prop="bg_light" value="${b.bg_light || 'rgba(234,88,12,0.1)'}" style="flex:1;min-width:0;padding:5px 6px;border-radius:6px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);font-size:11px;font-family:monospace;box-sizing:border-box;">
                        </div>
                      </div>
                      <div>
                        <label style="font-size:10px;color:var(--text-secondary);display:block;margin-bottom:2px;">Rahmen</label>
                        <div style="display:flex;align-items:center;gap:4px;">
                          <input type="color" class="color-picker-swatch" data-bidx="${bIdx}" data-prop="border_light" value="${toHexColor(b.border_light || 'rgba(234,88,12,0.25)')}" style="width:28px;height:28px;padding:0;border:1px solid var(--border-subtle);border-radius:6px;cursor:pointer;background:none;flex-shrink:0;">
                          <input type="text" class="in-badge-color" data-bidx="${bIdx}" data-prop="border_light" value="${b.border_light || 'rgba(234,88,12,0.25)'}" style="flex:1;min-width:0;padding:5px 6px;border-radius:6px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);font-size:11px;font-family:monospace;box-sizing:border-box;">
                        </div>
                      </div>
                      <div>
                        <label style="font-size:10px;color:var(--text-secondary);display:block;margin-bottom:2px;">Hover-Farbe</label>
                        <div style="display:flex;align-items:center;gap:4px;">
                          <input type="color" class="color-picker-swatch" data-bidx="${bIdx}" data-prop="hover_light" value="${toHexColor(b.hover_light || 'rgba(234,88,12,0.22)')}" style="width:28px;height:28px;padding:0;border:1px solid var(--border-subtle);border-radius:6px;cursor:pointer;background:none;flex-shrink:0;">
                          <input type="text" class="in-badge-color" data-bidx="${bIdx}" data-prop="hover_light" value="${b.hover_light || 'rgba(234,88,12,0.22)'}" style="flex:1;min-width:0;padding:5px 6px;border-radius:6px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);font-size:11px;font-family:monospace;box-sizing:border-box;">
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Dark Mode Colors -->
                  <div style="background:rgba(0,0,0,0.14);border:1px solid var(--border-subtle);border-radius:10px;padding:12px;">
                    <div style="font-size:12px;font-weight:700;color:#38bdf8;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
                      <ha-icon icon="mdi:weather-night" style="--mdc-icon-size:16px;"></ha-icon> Dunkles Theme (Farben)
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                      <div>
                        <label style="font-size:10px;color:var(--text-secondary);display:block;margin-bottom:2px;">Iconfarbe</label>
                        <div style="display:flex;align-items:center;gap:4px;">
                          <input type="color" class="color-picker-swatch" data-bidx="${bIdx}" data-prop="icon_color_dark" value="${toHexColor(b.icon_color_dark || '#fb923c')}" style="width:28px;height:28px;padding:0;border:1px solid var(--border-subtle);border-radius:6px;cursor:pointer;background:none;flex-shrink:0;">
                          <input type="text" class="in-badge-color" data-bidx="${bIdx}" data-prop="icon_color_dark" value="${b.icon_color_dark || '#fb923c'}" style="flex:1;min-width:0;padding:5px 6px;border-radius:6px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);font-size:11px;font-family:monospace;box-sizing:border-box;">
                        </div>
                      </div>
                      <div>
                        <label style="font-size:10px;color:var(--text-secondary);display:block;margin-bottom:2px;">Hintergrund</label>
                        <div style="display:flex;align-items:center;gap:4px;">
                          <input type="color" class="color-picker-swatch" data-bidx="${bIdx}" data-prop="bg_dark" value="${toHexColor(b.bg_dark || 'rgba(251,146,60,0.15)')}" style="width:28px;height:28px;padding:0;border:1px solid var(--border-subtle);border-radius:6px;cursor:pointer;background:none;flex-shrink:0;">
                          <input type="text" class="in-badge-color" data-bidx="${bIdx}" data-prop="bg_dark" value="${b.bg_dark || 'rgba(251,146,60,0.15)'}" style="flex:1;min-width:0;padding:5px 6px;border-radius:6px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);font-size:11px;font-family:monospace;box-sizing:border-box;">
                        </div>
                      </div>
                      <div>
                        <label style="font-size:10px;color:var(--text-secondary);display:block;margin-bottom:2px;">Rahmen</label>
                        <div style="display:flex;align-items:center;gap:4px;">
                          <input type="color" class="color-picker-swatch" data-bidx="${bIdx}" data-prop="border_dark" value="${toHexColor(b.border_dark || 'rgba(251,146,60,0.35)')}" style="width:28px;height:28px;padding:0;border:1px solid var(--border-subtle);border-radius:6px;cursor:pointer;background:none;flex-shrink:0;">
                          <input type="text" class="in-badge-color" data-bidx="${bIdx}" data-prop="border_dark" value="${b.border_dark || 'rgba(251,146,60,0.35)'}" style="flex:1;min-width:0;padding:5px 6px;border-radius:6px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);font-size:11px;font-family:monospace;box-sizing:border-box;">
                        </div>
                      </div>
                      <div>
                        <label style="font-size:10px;color:var(--text-secondary);display:block;margin-bottom:2px;">Hover-Farbe</label>
                        <div style="display:flex;align-items:center;gap:4px;">
                          <input type="color" class="color-picker-swatch" data-bidx="${bIdx}" data-prop="hover_dark" value="${toHexColor(b.hover_dark || 'rgba(251,146,60,0.30)')}" style="width:28px;height:28px;padding:0;border:1px solid var(--border-subtle);border-radius:6px;cursor:pointer;background:none;flex-shrink:0;">
                          <input type="text" class="in-badge-color" data-bidx="${bIdx}" data-prop="hover_dark" value="${b.hover_dark || 'rgba(251,146,60,0.30)'}" style="flex:1;min-width:0;padding:5px 6px;border-radius:6px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);font-size:11px;font-family:monospace;box-sizing:border-box;">
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Room Assignment Checkboxes -->
                <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-subtle);border-radius:10px;padding:12px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <div style="font-size:12px;font-weight:700;color:var(--text-primary);display:inline-flex;align-items:center;gap:5px;">
                      <ha-icon icon="mdi:checkbox-marked-outline" style="--mdc-icon-size:14px;color:var(--accent);"></ha-icon> Auf welchen Bento-Karten anzeigen?
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
                        <button type="button" class="btn btn-sm btn-del-cat" data-cidx="${cIdx}" style="color:#ef4444;display:inline-flex;align-items:center;" title="Kategorie löschen"><ha-icon icon="mdi:close" style="--mdc-icon-size:14px;"></ha-icon></button>
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
                            <button type="button" class="btn-del-cat-ent" data-cidx="${cIdx}" data-eidx="${eIdx}" style="background:none;border:none;color:#ef4444;cursor:pointer;padding:0;font-size:13px;line-height:1;display:flex;align-items:center;" title="Entfernen"><ha-icon icon="mdi:close" style="--mdc-icon-size:13px;"></ha-icon></button>
                          </span>
                        `;
                      }).join('')}
                    </div>

                    <button type="button" class="btn btn-sm btn-add-cat-ent" data-cidx="${cIdx}" style="background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.3);color:var(--accent);display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;">
                      <ha-icon icon="mdi:plus" style="--mdc-icon-size:14px;"></ha-icon> Entität hinzufügen
                    </button>
                  </div>
                `).join('')}
                <button type="button" class="btn btn-sm btn-primary" id="btnAddOverlayCategory" style="align-self:flex-start;padding:8px 16px;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;"><ha-icon icon="mdi:plus" style="--mdc-icon-size:15px;"></ha-icon> Neue Kategorie hinzufügen</button>
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
                    ${isCustom ? `<button type="button" class="btn btn-sm btn-danger btn-del-dock-item" data-didx="${dIdx}" style="padding:4px 8px;margin-left:4px;display:inline-flex;align-items:center;" title="Löschen"><ha-icon icon="mdi:close" style="--mdc-icon-size:14px;"></ha-icon></button>` : ''}
                  </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr minmax(220px, 1fr);gap:10px;margin-bottom:12px;">
                  <div>
                    <label style="font-size:11px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:4px;">Titel im Dock</label>
                    <input type="text" class="inp-custom-dock-title" data-didx="${dIdx}" value="${item.title || ''}" placeholder="${item.id}" style="width:100%;padding:8px 10px;border-radius:8px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);box-sizing:border-box;">
                  </div>
                  <div>
                    <label style="font-size:11px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:4px;">Icon (MDI oder Standard)</label>
                    <div style="display:flex;align-items:center;gap:6px;">
                      <div id="dockIconBox_${dIdx}" style="width:34px;height:34px;border-radius:8px;background:var(--bg-surface);border:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:center;color:var(--accent);flex-shrink:0;">
                        ${this._icon(item.icon || 'star', { size: 18 })}
                      </div>
                      <input type="text" class="inp-custom-dock-icon" data-didx="${dIdx}" value="${item.icon || ''}" placeholder="Standard (${item.id})" style="flex:1;min-width:0;padding:7px 10px;border-radius:8px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);font-size:12px;font-family:monospace;">
                      <button type="button" class="btn btn-sm btn-pick-dock-icon" data-didx="${dIdx}" style="padding:7px 10px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;white-space:nowrap;font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:4px;">
                        <ha-icon icon="mdi:magnify" style="--mdc-icon-size:14px;"></ha-icon> Icon
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <div style="font-size:12px;font-weight:600;color:var(--text-secondary);">Zugeordnete Entitäten im Modal (${(item.entities || []).length})</div>
                    ${(!isCustom && (!item.entities || item.entities.length === 0)) ? `
                      <span style="font-size:11px;color:var(--accent);display:inline-flex;align-items:center;gap:4px;"><ha-icon icon="mdi:flash-outline" style="--mdc-icon-size:13px;"></ha-icon> Standard: Automatische System-Erkennung</span>
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
                    <ha-icon icon="mdi:plus" style="--mdc-icon-size:14px;"></ha-icon> Entität zu diesem Modal hinzufügen
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
                    <button type="button" class="btn btn-sm btn-del-helper-ctrl" data-entity="${eId}" style="color:#ef4444;background:none;border:none;cursor:pointer;font-size:14px;padding:4px;display:inline-flex;align-items:center;" title="Zurücksetzen"><ha-icon icon="mdi:close" style="--mdc-icon-size:14px;"></ha-icon></button>
                  </div>
                </div>
              `;
            }).join('');
          })()}
        </div>

        <button type="button" class="btn btn-sm btn-primary" id="btnAddHelperControl" style="margin-top:14px;padding:8px 16px;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
          <ha-icon icon="mdi:plus" style="--mdc-icon-size:15px;"></ha-icon> Weitere Helfer-Entität konfigurieren
        </button>
      </div>

      <!-- TAB 5: DESIGN & ALLGEMEIN -->
      <div id="stabContentGeneral" style="${activeTab === 'general' ? '' : 'display:none;'}">
        <div class="card-box" style="background:var(--bg-card);border:1px solid var(--border-glass);border-radius:14px;padding:16px;margin-bottom:14px;">
          <div style="font-weight:700;font-size:15px;margin-bottom:12px;display:inline-flex;align-items:center;gap:6px;"><ha-icon icon="mdi:palette-outline" style="--mdc-icon-size:18px;color:var(--accent);"></ha-icon> Erscheinungsbild & Theme</div>

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
          <div style="font-weight:700;font-size:15px;margin-bottom:12px;display:inline-flex;align-items:center;gap:6px;"><ha-icon icon="mdi:earth" style="--mdc-icon-size:18px;color:var(--accent);"></ha-icon> Globale Entitäten</div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;">
            <div class="row">
              <label>${this._t('dashboard_title_label')}</label>
              <div style="font-size:13px;font-weight:600;color:var(--text-primary);padding:8px 12px;background:var(--bg-surface);border-radius:8px;border:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:space-between;">
                <span>${this._t('smart_home_center')}</span>
                <span style="font-size:11px;color:var(--text-secondary);font-weight:400;display:inline-flex;align-items:center;gap:4px;"><ha-icon icon="mdi:translate" style="--mdc-icon-size:13px;"></ha-icon> ${this._t('auto_localized')} (${this._getLang().toUpperCase()})</span>
              </div>
            </div>
            <div class="row">
              <label>Wetter-Entität</label>
              <div style="display:flex;gap:4px;align-items:center;">
                <input type="text" list="dl_all_entities" id="cfgWeather" value="${this._config.weather_entity || ''}" placeholder="weather.hannover_hannover" style="flex:1;">
                <button type="button" class="btn btn-sm btn-pick-global" data-target="cfgWeather" data-domain="weather" title="Wetter-Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><ha-icon icon="mdi:magnify" style="--mdc-icon-size:14px;"></ha-icon></button>
              </div>
            </div>
            <div class="row">
              <label>Wohnungsschloss-Entität</label>
              <div style="display:flex;gap:4px;align-items:center;">
                <input type="text" list="dl_all_entities" id="cfgLock" value="${this._config.lock_entity || ''}" placeholder="lock.wohnungsschloss" style="flex:1;">
                <button type="button" class="btn btn-sm btn-pick-global" data-target="cfgLock" data-domain="lock" title="Schloss-Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><ha-icon icon="mdi:magnify" style="--mdc-icon-size:14px;"></ha-icon></button>
              </div>
            </div>
            <div class="row">
              <label>Alle-Lichter-Entität (Hauptschalter)</label>
              <div style="display:flex;gap:4px;align-items:center;">
                <input type="text" list="dl_all_entities" id="cfgAllLights" value="${this._config.all_lights_entity || ''}" placeholder="light.licht_wohnung" style="flex:1;">
                <button type="button" class="btn btn-sm btn-pick-global" data-target="cfgAllLights" data-domain="light" title="Licht-Entität suchen..." style="padding:6px 9px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:var(--accent);border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><ha-icon icon="mdi:magnify" style="--mdc-icon-size:14px;"></ha-icon></button>
              </div>
            </div>
          </div>
        </div>

        <div class="card-box" style="background:var(--bg-card);border:1px solid var(--border-glass);border-radius:14px;padding:16px;margin-top:14px;">
          <div style="font-weight:700;font-size:15px;margin-bottom:12px;display:inline-flex;align-items:center;gap:6px;"><ha-icon icon="mdi:badge-account-horizontal-outline" style="--mdc-icon-size:18px;color:var(--accent);"></ha-icon> Top-Bar Badges & Personen</div>
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

          <!-- Standard-Startseite (Default Dashboard) -->
          <div style="border-top:1px solid var(--border-subtle);padding-top:14px;margin-top:16px;">
            <div style="font-weight:700;font-size:14px;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
              <ha-icon icon="mdi:home-export-outline" style="--mdc-icon-size:18px;color:var(--accent);"></ha-icon> Standard-Startseite
            </div>
            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:10px;">
              Lege fest, ob Vision Glass beim Aufrufen von Home Assistant automatisch als primäres Dashboard geöffnet werden soll.
            </div>
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
              <button type="button" class="btn btn-sm btn-primary" id="btnSetAsDefaultDashboard" style="display:inline-flex;align-items:center;gap:6px;">
                <ha-icon icon="mdi:check-circle-outline" style="--mdc-icon-size:16px;"></ha-icon> Vision Glass als Standard festlegen
              </button>
              <span id="lblDefaultDashboardStatus" style="font-size:12px;font-weight:600;"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB: STATISTIKEN -->
      <div id="stabContentStats" style="${activeTab === 'stats' ? '' : 'display:none;'}">
        <div class="card-box" style="margin-bottom:16px;">
          <div style="font-weight:700;font-size:15px;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
            <ha-icon icon="mdi:home-group" style="--mdc-icon-size:18px;color:var(--accent);"></ha-icon> Räume & Sensor-Auswahl für Standard-Verläufe
          </div>
          <div style="font-size:12px;color:var(--text-secondary);margin-bottom:14px;">
            Wähle, welche Räume im Statistik-Verlauf angezeigt werden und welche Temperatur- bzw. Helligkeitssensoren in den 24h-Diagrammen dargestellt werden sollen.
          </div>
          <div style="display:flex;flex-direction:column;gap:12px;">
            ${rooms.map(r => {
              const statsConf = this._config.stats || {};
              const roomStatsConf = statsConf.rooms || {};
              const roomStats = roomStatsConf[r.id] || {};

              // Discover candidates for this room
              const candTemp = new Set();
              if (r.temp_entity) candTemp.add(r.temp_entity);
              if (this._discovery?.entities) {
                Object.values(this._discovery.entities).forEach(meta => {
                  if (meta.area_id === r.id && meta.domain === 'sensor' && meta.device_class === 'temperature') {
                    candTemp.add(meta.entity_id);
                  }
                });
              }
              if (candTemp.size === 0 && r.climate_entity && this._hass?.states[r.climate_entity]) {
                candTemp.add(r.climate_entity);
              }
              (roomStats.temp_entities || []).forEach(e => { if (typeof e === 'string') candTemp.add(e); });

              const candIllum = new Set();
              if (r.illuminance_entity) candIllum.add(r.illuminance_entity);
              if (this._discovery?.entities) {
                Object.values(this._discovery.entities).forEach(meta => {
                  if (meta.area_id === r.id && meta.domain === 'sensor' && meta.device_class === 'illuminance') {
                    candIllum.add(meta.entity_id);
                  }
                });
              }
              (roomStats.illum_entities || []).forEach(e => { if (typeof e === 'string') candIllum.add(e); });

              const candTempList = [...candTemp];
              const candIllumList = [...candIllum];

              let isRoomChecked = true;
              if (typeof roomStats.enabled === 'boolean') {
                isRoomChecked = roomStats.enabled;
              } else if (Array.isArray(statsConf.enabled_rooms)) {
                isRoomChecked = statsConf.enabled_rooms.includes(r.id);
              } else {
                isRoomChecked = (candTempList.length > 0 || candIllumList.length > 0 || !!r.climate_entity);
              }

              const selectedTemp = Array.isArray(roomStats.temp_entities)
                ? roomStats.temp_entities
                : (candTempList.length > 0 ? [candTempList[0]] : []);

              const selectedIllum = Array.isArray(roomStats.illum_entities)
                ? roomStats.illum_entities
                : (candIllumList.length > 0 ? [candIllumList[0]] : []);

              return `
                <div class="card-box stat-room-card" style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:14px;padding:12px 16px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                    <label style="display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:700;cursor:pointer;">
                      <input type="checkbox" class="chk-stat-room" data-room-id="${r.id}" ${isRoomChecked ? 'checked' : ''}>
                      <span>${r.name || r.id}</span>
                    </label>
                    <span style="font-size:11px;color:var(--text-secondary);">${selectedTemp.length} Temp-Sensor(en) • ${selectedIllum.length} Lux-Sensor(en)</span>
                  </div>

                  <div class="stat-room-entities-box" data-room-box="${r.id}" style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border-subtle);display:${isRoomChecked ? 'block' : 'none'};">
                    <!-- Temp entities selection -->
                    <div style="margin-bottom:10px;">
                      <div style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;">
                        <span>🌡️ Temperatur-Sensoren im Verlauf:</span>
                        <button type="button" class="btn btn-micro btn-add-stat-temp" data-room-id="${r.id}" style="font-size:11px;padding:2px 8px;">+ Sensor wählen</button>
                      </div>
                      <div style="display:flex;flex-wrap:wrap;gap:6px;">
                        ${candTempList.length === 0 ? `<span style="font-size:11px;color:var(--text-secondary);font-style:italic;">Keine Temperatursensoren erkannt</span>` : ''}
                        ${candTempList.map(tId => {
                          const fn = this._hass?.states[tId]?.attributes?.friendly_name || tId;
                          const isTChecked = selectedTemp.includes(tId);
                          return `
                            <label style="display:inline-flex;align-items:center;gap:6px;font-size:12px;background:var(--bg-glass);padding:4px 8px;border-radius:6px;border:1px solid var(--border-subtle);cursor:pointer;">
                              <input type="checkbox" class="chk-stat-room-temp" data-room-id="${r.id}" data-eid="${tId}" ${isTChecked ? 'checked' : ''}>
                              <span title="${tId}">${fn}</span>
                            </label>
                          `;
                        }).join('')}
                      </div>
                    </div>

                    <!-- Illuminance entities selection -->
                    <div>
                      <div style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;">
                        <span>💡 Beleuchtungsstärke (Lux) im Verlauf:</span>
                        <button type="button" class="btn btn-micro btn-add-stat-illum" data-room-id="${r.id}" style="font-size:11px;padding:2px 8px;">+ Sensor wählen</button>
                      </div>
                      <div style="display:flex;flex-wrap:wrap;gap:6px;">
                        ${candIllumList.length === 0 ? `<span style="font-size:11px;color:var(--text-secondary);font-style:italic;">Keine Helligkeitssensoren erkannt</span>` : ''}
                        ${candIllumList.map(iId => {
                          const fn = this._hass?.states[iId]?.attributes?.friendly_name || iId;
                          const isIChecked = selectedIllum.includes(iId);
                          return `
                            <label style="display:inline-flex;align-items:center;gap:6px;font-size:12px;background:var(--bg-glass);padding:4px 8px;border-radius:6px;border:1px solid var(--border-subtle);cursor:pointer;">
                              <input type="checkbox" class="chk-stat-room-illum" data-room-id="${r.id}" data-eid="${iId}" ${isIChecked ? 'checked' : ''}>
                              <span title="${iId}">${fn}</span>
                            </label>
                          `;
                        }).join('')}
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="card-box" style="margin-bottom:16px;">
          <div style="font-weight:700;font-size:15px;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
            <ha-icon icon="mdi:chart-box-outline" style="--mdc-icon-size:18px;color:var(--accent);"></ha-icon> Standard-Verläufe
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;margin-top:10px;">
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
              <input type="checkbox" id="chkStatShowTemp" ${(this._config.stats?.show_temperature !== false) ? 'checked' : ''}>
              <span>Temperaturkurven & Heizstatus (24h)</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
              <input type="checkbox" id="chkStatShowIllum" ${(this._config.stats?.show_illuminance !== false) ? 'checked' : ''}>
              <span>Beleuchtungsstärke (Lux) & Beleuchtungsstatus (24h)</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
              <input type="checkbox" id="chkStatShowBat" ${(this._config.stats?.show_battery !== false) ? 'checked' : ''}>
              <span>Batterie-Entladungskurven</span>
            </label>
          </div>
        </div>

        <div class="card-box">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
            <div>
              <div style="font-weight:700;font-size:15px;display:flex;align-items:center;gap:6px;">
                <ha-icon icon="mdi:chart-timeline-variant-shimmer" style="--mdc-icon-size:18px;color:var(--accent);"></ha-icon> Eigene Statistikbereiche (z. B. Solar, Energie, etc.)
              </div>
              <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">
                Erstelle eigene Verlaufsdiagramme mit beliebigen Home-Assistant-Entitäten.
              </div>
            </div>
            <button type="button" class="btn btn-sm btn-primary" id="btnAddCustomStatSection" style="display:inline-flex;align-items:center;gap:6px;">
              <ha-icon icon="mdi:plus" style="--mdc-icon-size:16px;"></ha-icon> Bereich hinzufügen
            </button>
          </div>

          <div style="display:flex;flex-direction:column;gap:14px;" id="customStatSectionsList">
            ${((this._config.stats?.custom_sections) || []).map((sec, sIdx) => `
              <div class="control-row" style="flex-direction:column;align-items:stretch;gap:10px;padding:14px 16px;border:1px solid var(--border-glass);border-radius:12px;" data-sec-idx="${sIdx}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:36px;height:36px;border-radius:10px;background:rgba(56,189,248,0.15);display:flex;align-items:center;justify-content:center;">
                      ${sec.icon ? `<ha-icon icon="${sec.icon}" style="--mdc-icon-size:20px;color:var(--accent);"></ha-icon>` : `<ha-icon icon="mdi:chart-bell-curve" style="--mdc-icon-size:20px;color:var(--accent);"></ha-icon>`}
                    </div>
                    <div>
                      <div style="font-weight:700;font-size:15px;">${sec.title || 'Neuer Bereich'}</div>
                      <div style="font-size:11px;color:var(--text-secondary);">Einheit: <code style="color:var(--accent);">${sec.unit || 'keine'}</code> • Entitäten: ${(sec.entities || []).length}</div>
                    </div>
                  </div>
                  <div style="display:flex;gap:6px;">
                    <button type="button" class="btn-micro btn-del-custom-stat-sec" data-sidx="${sIdx}" style="color:#ef4444;" title="Bereich löschen">
                      <ha-icon icon="mdi:delete-outline" style="--mdc-icon-size:16px;"></ha-icon>
                    </button>
                  </div>
                </div>

                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;border-top:1px solid var(--border-subtle);padding-top:10px;">
                  <div>
                    <label style="font-size:11px;color:var(--text-secondary);">Titel des Bereichs</label>
                    <input type="text" class="input input-sm txt-stat-sec-title" data-sidx="${sIdx}" value="${sec.title || ''}" style="width:100%;box-sizing:border-box;">
                  </div>
                  <div>
                    <label style="font-size:11px;color:var(--text-secondary);">Einheit (z. B. W, kW, kWh, %, ppm)</label>
                    <input type="text" class="input input-sm txt-stat-sec-unit" data-sidx="${sIdx}" value="${sec.unit || ''}" style="width:100%;box-sizing:border-box;">
                  </div>
                  <div>
                    <label style="font-size:11px;color:var(--text-secondary);">Icon</label>
                    <div style="display:flex;gap:4px;">
                      <input type="text" class="input input-sm txt-stat-sec-icon" data-sidx="${sIdx}" value="${sec.icon || 'mdi:chart-timeline-variant'}" style="flex:1;box-sizing:border-box;">
                      <button type="button" class="btn btn-sm btn-pick-stat-sec-icon" data-sidx="${sIdx}" title="Icon wählen">
                        <ha-icon icon="mdi:magnify" style="--mdc-icon-size:16px;"></ha-icon>
                      </button>
                    </div>
                  </div>
                </div>

                <div style="border-top:1px solid var(--border-subtle);padding-top:8px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <span style="font-size:12px;font-weight:600;color:var(--text-secondary);">Entitäten im Diagramm</span>
                    <button type="button" class="btn btn-sm btn-add-stat-sec-entity" data-sidx="${sIdx}" style="font-size:11px;padding:3px 8px;">
                      <ha-icon icon="mdi:plus" style="--mdc-icon-size:14px;"></ha-icon> Entität hinzufügen
                    </button>
                  </div>
                  <div style="display:flex;flex-direction:column;gap:6px;">
                    ${(sec.entities || []).map((ent, eIdx) => {
                      const eId = typeof ent === 'string' ? ent : ent.id;
                      const eName = typeof ent === 'object' && ent.name ? ent.name : '';
                      const eColor = typeof ent === 'object' && ent.color ? ent.color : '#38bdf8';
                      return `
                        <div style="display:flex;align-items:center;gap:8px;background:var(--bg-surface);padding:6px 10px;border-radius:8px;border:1px solid var(--border-subtle);flex-wrap:wrap;">
                          <input type="color" class="color-picker-input cp-stat-ent-color" data-sidx="${sIdx}" data-eidx="${eIdx}" value="${eColor}" style="width:28px;height:28px;border-radius:6px;border:none;cursor:pointer;padding:0;">
                          <div style="flex:1;min-width:180px;">
                            <input type="text" class="input input-sm txt-stat-ent-name" data-sidx="${sIdx}" data-eidx="${eIdx}" placeholder="Bezeichnung (z. B. Solar-Produktion)" value="${eName}" style="width:100%;box-sizing:border-box;">
                          </div>
                          <div style="flex:1;min-width:180px;display:flex;gap:4px;">
                            <input type="text" class="input input-sm txt-stat-ent-id" data-sidx="${sIdx}" data-eidx="${eIdx}" placeholder="sensor.solar_power" value="${eId || ''}" style="flex:1;font-family:monospace;box-sizing:border-box;">
                            <button type="button" class="btn btn-sm btn-pick-stat-ent-id" data-sidx="${sIdx}" data-eidx="${eIdx}" title="Entität suchen">
                              <ha-icon icon="mdi:magnify" style="--mdc-icon-size:14px;"></ha-icon>
                            </button>
                          </div>
                          <button type="button" class="btn-micro btn-del-stat-sec-ent" data-sidx="${sIdx}" data-eidx="${eIdx}" style="color:#ef4444;" title="Entität entfernen">
                            <ha-icon icon="mdi:close" style="--mdc-icon-size:16px;"></ha-icon>
                          </button>
                        </div>
                      `;
                    }).join('')}
                    ${(!sec.entities || sec.entities.length === 0) ? `<div style="font-size:12px;color:var(--text-secondary);font-style:italic;">Noch keine Entitäten hinzugefügt. Klicke auf „+ Entität hinzufügen“.</div>` : ''}
                  </div>
                </div>
              </div>
            `).join('')}
            ${(!this._config.stats?.custom_sections || this._config.stats.custom_sections.length === 0) ? `
              <div style="padding:20px;text-align:center;color:var(--text-secondary);border:1px dashed var(--border-subtle);border-radius:12px;">
                Keine eigenen Statistikbereiche angelegt. Klicke auf „+ Bereich hinzufügen“, um z. B. PV-Erzeugung, Stromverbrauch oder Temperaturvergleiche anzulegen.
              </div>
            ` : ''}
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
          <button class="btn btn-primary" id="btnSaveDashboardSettings" style="background:var(--accent);color:white;font-weight:700;padding:8px 20px;border-radius:10px;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
            <ha-icon icon="mdi:content-save" style="--mdc-icon-size:16px;"></ha-icon> ${this._t('save_changes')}
          </button>
        </div>
      </div>
    `;

    // Hook up Event Listeners
    const backBtn = container.querySelector('#btnBackToDashboard');
    if (backBtn) backBtn.onclick = () => this._setViewMode('home');
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
        btnSync.innerHTML = '<ha-icon icon="mdi:loading" class="spin" style="--mdc-icon-size:16px;"></ha-icon> Synchronisiere...';
        const res = await this._syncAreas();
        btnSync.disabled = false;
        btnSync.innerHTML = '<ha-icon icon="mdi:refresh" style="--mdc-icon-size:16px;"></ha-icon> ' + this._t('sync_areas_btn');
        this._renderSettingsContent(container);
        const toast = container.querySelector('#settingsToast');
        if (toast) {
          toast.textContent = `${this._t('sync_areas_success')} (${res ? res.total : 0} Bereiche)`;
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

    container.querySelectorAll('.inp-custom-dock-icon').forEach(inp => {
      inp.oninput = () => {
        const idx = parseInt(inp.getAttribute('data-didx'));
        if (this._config.dock?.items?.[idx]) {
          this._config.dock.items[idx].icon = inp.value.trim();
          const box = container.querySelector('#dockIconBox_' + idx);
          if (box) box.innerHTML = this._icon(this._config.dock.items[idx].icon || 'star', { size: 18 });
        }
      };
    });

    container.querySelectorAll('.btn-pick-dock-icon').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute('data-didx'));
        const item = this._config.dock?.items?.[idx];
        if (!item) return;
        this._showIconPicker({
          currentValue: item.icon || 'star',
          onSelect: (newIcon) => {
            item.icon = newIcon;
            this._renderSettingsContent(container, isModal);
          }
        });
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
          room.bento_actions = [...this._getRoomBentoActions(room)];
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

    // Custom Room Action Icons
    container.querySelectorAll('.btn-add-custom-room-action').forEach(btn => {
      btn.onclick = () => {
        const rIdx = parseInt(btn.getAttribute('data-ridx'));
        const room = this._config.rooms?.[rIdx];
        if (!room) return;
        if (!Array.isArray(room.bento_actions)) {
          room.bento_actions = [...this._getRoomBentoActions(room)];
        }
        room.bento_actions.push({
          id: 'custom_act_' + Date.now(),
          type: 'custom',
          title: 'Neues Icon',
          icon: 'mdi:star',
          entity_id: '',
          enabled: true
        });
        this._renderSettingsContent(container, isModal);
      };
    });

    container.querySelectorAll('.btn-del-custom-act').forEach(btn => {
      btn.onclick = () => {
        const rIdx = parseInt(btn.getAttribute('data-ridx'));
        const caIdx = parseInt(btn.getAttribute('data-caidx'));
        const room = this._config.rooms?.[rIdx];
        if (!room || !Array.isArray(room.bento_actions)) return;
        const customActs = room.bento_actions.filter(a => a.type === 'custom');
        const targetAct = customActs[caIdx];
        if (targetAct) {
          room.bento_actions = room.bento_actions.filter(a => a !== targetAct);
          this._renderSettingsContent(container, isModal);
        }
      };
    });

    container.querySelectorAll('.in-custom-act-title').forEach(inp => {
      inp.oninput = () => {
        const rIdx = parseInt(inp.getAttribute('data-ridx'));
        const caIdx = parseInt(inp.getAttribute('data-caidx'));
        const room = this._config.rooms?.[rIdx];
        const customActs = room?.bento_actions?.filter(a => a.type === 'custom');
        if (customActs?.[caIdx]) {
          customActs[caIdx].title = inp.value;
        }
      };
    });

    container.querySelectorAll('.in-custom-act-entity').forEach(inp => {
      inp.oninput = () => {
        const rIdx = parseInt(inp.getAttribute('data-ridx'));
        const caIdx = parseInt(inp.getAttribute('data-caidx'));
        const room = this._config.rooms?.[rIdx];
        const customActs = room?.bento_actions?.filter(a => a.type === 'custom');
        if (customActs?.[caIdx]) {
          customActs[caIdx].entity_id = inp.value.trim();
        }
      };
    });

    container.querySelectorAll('.btn-pick-custom-act-entity').forEach(btn => {
      btn.onclick = () => {
        const rIdx = parseInt(btn.getAttribute('data-ridx'));
        const caIdx = parseInt(btn.getAttribute('data-caidx'));
        const room = this._config.rooms?.[rIdx];
        const customActs = room?.bento_actions?.filter(a => a.type === 'custom');
        if (!customActs?.[caIdx]) return;
        this._showEntityPicker({
          currentValue: customActs[caIdx].entity_id || '',
          defaultDomain: 'all',
          roomId: room.id,
          roomName: room.name,
          onSelect: (selectedId) => {
            customActs[caIdx].entity_id = selectedId;
            if (!customActs[caIdx].title || customActs[caIdx].title === 'Neues Icon') {
              const s = this._hass?.states?.[selectedId];
              customActs[caIdx].title = s?.attributes?.friendly_name || selectedId;
            }
            this._renderSettingsContent(container, isModal);
          }
        });
      };
    });

    container.querySelectorAll('.btn-pick-custom-act-icon').forEach(btn => {
      btn.onclick = () => {
        const rIdx = parseInt(btn.getAttribute('data-ridx'));
        const caIdx = parseInt(btn.getAttribute('data-caidx'));
        const room = this._config.rooms?.[rIdx];
        const customActs = room?.bento_actions?.filter(a => a.type === 'custom');
        if (!customActs?.[caIdx]) return;
        this._showIconPicker({
          currentValue: customActs[caIdx].icon || 'mdi:star',
          onSelect: (newIcon) => {
            customActs[caIdx].icon = newIcon;
            this._renderSettingsContent(container, isModal);
          }
        });
      };
    });

    // Bento-Badge Assignment per Room Checkbox (Item 2)
    container.querySelectorAll('.chk-bento-badge-for-room').forEach(chk => {
      chk.onchange = () => {
        const rIdx = parseInt(chk.getAttribute('data-ridx'));
        const bId = chk.getAttribute('data-bid');
        const room = this._config.rooms?.[rIdx];
        if (!room) return;
        if (!this._config.bento_badges) {
          this._config.bento_badges = this._getEffectiveBentoBadges();
        }
        const badge = this._config.bento_badges.find(b => b.id === bId);
        if (!badge) return;

        const allRoomIds = (this._config.rooms || []).map(rm => rm.id);
        if (!Array.isArray(badge.rooms)) badge.rooms = ['all'];

        if (chk.checked) {
          if (badge.rooms.includes('all')) {
            // Already active for all
          } else if (!badge.rooms.includes(room.id)) {
            badge.rooms.push(room.id);
            if (allRoomIds.length > 0 && allRoomIds.every(id => badge.rooms.includes(id))) {
              badge.rooms = ['all'];
            }
          }
        } else {
          if (badge.rooms.includes('all')) {
            badge.rooms = allRoomIds.filter(id => id !== room.id);
          } else {
            badge.rooms = badge.rooms.filter(id => id !== room.id);
          }
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
          updateBadgeLivePreview(container, bIdx, this._config.bento_badges[bIdx], (name, opt) => this._icon(name, opt));
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

    container.querySelectorAll('.in-badge-icon').forEach(inp => {
      inp.oninput = () => {
        const bIdx = parseInt(inp.getAttribute('data-bidx'));
        const badge = this._config.bento_badges?.[bIdx];
        if (badge) {
          badge.icon = inp.value.trim();
          const box = container.querySelector('#badgeIconBox_' + bIdx);
          if (box) box.innerHTML = this._icon(badge.icon || 'star', { size: 18 });
          const headerBox = container.querySelector('#badgeHeaderIconBox_' + bIdx);
          if (headerBox) headerBox.innerHTML = this._icon(badge.icon || 'star', { size: 18 });
          updateBadgeLivePreview(container, bIdx, badge, (name, opt) => this._icon(name, opt));
        }
      };
    });

    container.querySelectorAll('.btn-pick-badge-icon').forEach(btn => {
      btn.onclick = () => {
        const bIdx = parseInt(btn.getAttribute('data-bidx'));
        const badge = this._config.bento_badges?.[bIdx];
        if (!badge) return;
        this._showIconPicker({
          currentValue: badge.icon || 'star',
          onSelect: (newIcon) => {
            badge.icon = newIcon;
            this._renderSettingsContent(container, isModal);
          }
        });
      };
    });

    container.querySelectorAll('.color-picker-swatch').forEach(swatch => {
      swatch.oninput = () => {
        const bIdx = parseInt(swatch.getAttribute('data-bidx'));
        const prop = swatch.getAttribute('data-prop');
        const badge = this._config.bento_badges?.[bIdx];
        if (!badge) return;
        const hex = swatch.value;
        const textInp = container.querySelector(`.in-badge-color[data-bidx="${bIdx}"][data-prop="${prop}"]`);

        if (prop.startsWith('icon_color')) {
          badge[prop] = hex;
          if (textInp) textInp.value = hex;
        } else if (prop.startsWith('bg')) {
          const alpha = prop.includes('light') ? 0.12 : 0.16;
          const rgba = hexToRgba(hex, alpha);
          badge[prop] = rgba;
          if (textInp) textInp.value = rgba;
        } else if (prop.startsWith('border')) {
          const alpha = prop.includes('light') ? 0.35 : 0.40;
          const rgba = hexToRgba(hex, alpha);
          badge[prop] = rgba;
          if (textInp) textInp.value = rgba;
        } else if (prop.startsWith('hover')) {
          const alpha = prop.includes('light') ? 0.25 : 0.30;
          const rgba = hexToRgba(hex, alpha);
          badge[prop] = rgba;
          if (textInp) textInp.value = rgba;
        } else {
          badge[prop] = hex;
          if (textInp) textInp.value = hex;
        }
        updateBadgeLivePreview(container, bIdx, badge, (name, opt) => this._icon(name, opt));
      };
    });

    container.querySelectorAll('.in-badge-color').forEach(inp => {
      inp.oninput = () => {
        const bIdx = parseInt(inp.getAttribute('data-bidx'));
        const prop = inp.getAttribute('data-prop');
        const badge = this._config.bento_badges?.[bIdx];
        if (!badge) return;
        badge[prop] = inp.value;
        const swatch = container.querySelector(`.color-picker-swatch[data-bidx="${bIdx}"][data-prop="${prop}"]`);
        if (swatch) swatch.value = toHexColor(inp.value);
        updateBadgeLivePreview(container, bIdx, badge, (name, opt) => this._icon(name, opt));
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

    // Set as Default Dashboard button handler
    const btnSetDefault = container.querySelector('#btnSetAsDefaultDashboard');
    const lblDefaultStatus = container.querySelector('#lblDefaultDashboardStatus');
    if (btnSetDefault && this._hass) {
      btnSetDefault.onclick = async () => {
        try {
          await this._hass.callWS({ type: 'frontend/set_user_data', key: 'core', value: { default_panel: 'vision-glass' } });
          await this._hass.callWS({ type: 'frontend/set_system_data', key: 'core', value: { default_panel: 'vision-glass' } });
          if (lblDefaultStatus) {
            lblDefaultStatus.textContent = '✓ Gespeichert! Vision Glass öffnet sich nun automatisch beim Start.';
            lblDefaultStatus.style.color = '#10b981';
          }
        } catch (e) {
          console.warn('Set default dashboard failed', e);
          if (lblDefaultStatus) {
            lblDefaultStatus.textContent = 'Fehler beim Speichern: ' + (e.message || e);
            lblDefaultStatus.style.color = '#ef4444';
          }
        }
      };
    }

    // Custom Stat Sections Handlers
    const btnAddStatSec = container.querySelector('#btnAddCustomStatSection');
    if (btnAddStatSec) {
      btnAddStatSec.onclick = () => {
        if (!this._config.stats) this._config.stats = {};
        if (!Array.isArray(this._config.stats.custom_sections)) this._config.stats.custom_sections = [];
        const newId = 'sec_' + Date.now().toString(36);
        this._config.stats.custom_sections.push({
          id: newId,
          title: 'Neuer Bereich',
          icon: 'mdi:chart-timeline-variant',
          unit: 'W',
          entities: []
        });
        this._renderSettingsContent(container, isModal);
      };
    }

    container.querySelectorAll('.btn-del-custom-stat-sec').forEach(btn => {
      btn.onclick = () => {
        const sIdx = parseInt(btn.getAttribute('data-sidx'));
        if (this._config.stats?.custom_sections) {
          this._config.stats.custom_sections.splice(sIdx, 1);
          this._renderSettingsContent(container, isModal);
        }
      };
    });

    container.querySelectorAll('.btn-pick-stat-sec-icon').forEach(btn => {
      btn.onclick = () => {
        const sIdx = parseInt(btn.getAttribute('data-sidx'));
        const sec = this._config.stats?.custom_sections?.[sIdx];
        if (!sec) return;
        this._showIconPicker({
          currentValue: sec.icon || 'mdi:chart-timeline-variant',
          onSelect: (chosenIcon) => {
            sec.icon = chosenIcon;
            this._renderSettingsContent(container, isModal);
          }
        });
      };
    });

    container.querySelectorAll('.btn-add-stat-sec-entity').forEach(btn => {
      btn.onclick = () => {
        const sIdx = parseInt(btn.getAttribute('data-sidx'));
        const sec = this._config.stats?.custom_sections?.[sIdx];
        if (!sec) return;
        this._showEntityPicker({
          defaultDomain: 'sensor',
          onSelect: (selectedId) => {
            if (selectedId) {
              if (!Array.isArray(sec.entities)) sec.entities = [];
              const s = this._hass?.states[selectedId];
              const friendly = s?.attributes?.friendly_name || selectedId;
              const palette = ['#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#a855f7'];
              sec.entities.push({
                id: selectedId,
                name: friendly,
                color: palette[sec.entities.length % palette.length]
              });
              this._renderSettingsContent(container, isModal);
            }
          }
        });
      };
    });

    container.querySelectorAll('.btn-del-stat-sec-ent').forEach(btn => {
      btn.onclick = () => {
        const sIdx = parseInt(btn.getAttribute('data-sidx'));
        const eIdx = parseInt(btn.getAttribute('data-eidx'));
        const sec = this._config.stats?.custom_sections?.[sIdx];
        if (sec && Array.isArray(sec.entities)) {
          sec.entities.splice(eIdx, 1);
          this._renderSettingsContent(container, isModal);
        }
      };
    });

    container.querySelectorAll('.btn-pick-stat-ent-id').forEach(btn => {
      btn.onclick = () => {
        const sIdx = parseInt(btn.getAttribute('data-sidx'));
        const eIdx = parseInt(btn.getAttribute('data-eidx'));
        const sec = this._config.stats?.custom_sections?.[sIdx];
        if (!sec || !sec.entities || !sec.entities[eIdx]) return;
        this._showEntityPicker({
          defaultDomain: 'sensor',
          onSelect: (selectedId) => {
            if (selectedId) {
              const s = this._hass?.states[selectedId];
              if (typeof sec.entities[eIdx] === 'string') {
                sec.entities[eIdx] = { id: selectedId, name: s?.attributes?.friendly_name || selectedId, color: '#38bdf8' };
              } else {
                sec.entities[eIdx].id = selectedId;
                if (!sec.entities[eIdx].name) sec.entities[eIdx].name = s?.attributes?.friendly_name || selectedId;
              }
              this._renderSettingsContent(container, isModal);
            }
          }
        });
      };
    });

    // Room stats entity listeners
    container.querySelectorAll('.chk-stat-room').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const rId = e.target.getAttribute('data-room-id');
        if (!this._config.stats) this._config.stats = {};
        if (!this._config.stats.rooms) this._config.stats.rooms = {};
        if (!this._config.stats.rooms[rId]) this._config.stats.rooms[rId] = {};
        this._config.stats.rooms[rId].enabled = e.target.checked;
        const box = container.querySelector(`.stat-room-entities-box[data-room-box="${rId}"]`);
        if (box) box.style.display = e.target.checked ? 'block' : 'none';
      });
    });

    container.querySelectorAll('.chk-stat-room-temp').forEach(chk => {
      chk.addEventListener('change', () => {
        const rId = chk.getAttribute('data-room-id');
        if (!this._config.stats) this._config.stats = {};
        if (!this._config.stats.rooms) this._config.stats.rooms = {};
        if (!this._config.stats.rooms[rId]) this._config.stats.rooms[rId] = {};
        const checked = Array.from(container.querySelectorAll(`.chk-stat-room-temp[data-room-id="${rId}"]:checked`)).map(c => c.getAttribute('data-eid'));
        this._config.stats.rooms[rId].temp_entities = checked;
      });
    });

    container.querySelectorAll('.chk-stat-room-illum').forEach(chk => {
      chk.addEventListener('change', () => {
        const rId = chk.getAttribute('data-room-id');
        if (!this._config.stats) this._config.stats = {};
        if (!this._config.stats.rooms) this._config.stats.rooms = {};
        if (!this._config.stats.rooms[rId]) this._config.stats.rooms[rId] = {};
        const checked = Array.from(container.querySelectorAll(`.chk-stat-room-illum[data-room-id="${rId}"]:checked`)).map(c => c.getAttribute('data-eid'));
        this._config.stats.rooms[rId].illum_entities = checked;
      });
    });

    container.querySelectorAll('.btn-add-stat-temp').forEach(btn => {
      btn.onclick = () => {
        const rId = btn.getAttribute('data-room-id');
        this._showEntityPicker({
          defaultDomain: 'sensor',
          onSelect: (chosenId) => {
            if (!chosenId) return;
            if (!this._config.stats) this._config.stats = {};
            if (!this._config.stats.rooms) this._config.stats.rooms = {};
            if (!this._config.stats.rooms[rId]) this._config.stats.rooms[rId] = {};
            if (!Array.isArray(this._config.stats.rooms[rId].temp_entities)) {
              this._config.stats.rooms[rId].temp_entities = [];
            }
            if (!this._config.stats.rooms[rId].temp_entities.includes(chosenId)) {
              this._config.stats.rooms[rId].temp_entities.push(chosenId);
            }
            this._renderSettingsContent(container, isModal);
          }
        });
      };
    });

    container.querySelectorAll('.btn-add-stat-illum').forEach(btn => {
      btn.onclick = () => {
        const rId = btn.getAttribute('data-room-id');
        this._showEntityPicker({
          defaultDomain: 'sensor',
          onSelect: (chosenId) => {
            if (!chosenId) return;
            if (!this._config.stats) this._config.stats = {};
            if (!this._config.stats.rooms) this._config.stats.rooms = {};
            if (!this._config.stats.rooms[rId]) this._config.stats.rooms[rId] = {};
            if (!Array.isArray(this._config.stats.rooms[rId].illum_entities)) {
              this._config.stats.rooms[rId].illum_entities = [];
            }
            if (!this._config.stats.rooms[rId].illum_entities.includes(chosenId)) {
              this._config.stats.rooms[rId].illum_entities.push(chosenId);
            }
            this._renderSettingsContent(container, isModal);
          }
        });
      };
    });

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

        // Collect stats settings
        if (!this._config.stats) this._config.stats = {};
        if (!this._config.stats.rooms) this._config.stats.rooms = {};

        container.querySelectorAll('.chk-stat-room').forEach(chk => {
          const rId = chk.getAttribute('data-room-id');
          if (!this._config.stats.rooms[rId]) this._config.stats.rooms[rId] = {};
          this._config.stats.rooms[rId].enabled = chk.checked;
        });

        // Collect checked temp entities
        const tempByRoom = {};
        container.querySelectorAll('.chk-stat-room-temp:checked').forEach(chk => {
          const rId = chk.getAttribute('data-room-id');
          const eId = chk.getAttribute('data-eid');
          if (!tempByRoom[rId]) tempByRoom[rId] = [];
          tempByRoom[rId].push(eId);
        });
        container.querySelectorAll('.chk-stat-room').forEach(chk => {
          const rId = chk.getAttribute('data-room-id');
          if (container.querySelector(`.chk-stat-room-temp[data-room-id="${rId}"]`)) {
            if (!this._config.stats.rooms[rId]) this._config.stats.rooms[rId] = {};
            this._config.stats.rooms[rId].temp_entities = tempByRoom[rId] || [];
          }
        });

        // Collect checked illum entities
        const illumByRoom = {};
        container.querySelectorAll('.chk-stat-room-illum:checked').forEach(chk => {
          const rId = chk.getAttribute('data-room-id');
          const eId = chk.getAttribute('data-eid');
          if (!illumByRoom[rId]) illumByRoom[rId] = [];
          illumByRoom[rId].push(eId);
        });
        container.querySelectorAll('.chk-stat-room').forEach(chk => {
          const rId = chk.getAttribute('data-room-id');
          if (container.querySelector(`.chk-stat-room-illum[data-room-id="${rId}"]`)) {
            if (!this._config.stats.rooms[rId]) this._config.stats.rooms[rId] = {};
            this._config.stats.rooms[rId].illum_entities = illumByRoom[rId] || [];
          }
        });

        const enabledList = Object.keys(this._config.stats.rooms).filter(rId => this._config.stats.rooms[rId].enabled !== false);
        this._config.stats.enabled_rooms = enabledList;

        const chkStatT = container.querySelector('#chkStatShowTemp');
        if (chkStatT) this._config.stats.show_temperature = chkStatT.checked;
        const chkStatI = container.querySelector('#chkStatShowIllum');
        if (chkStatI) this._config.stats.show_illuminance = chkStatI.checked;
        const chkStatB = container.querySelector('#chkStatShowBat');
        if (chkStatB) this._config.stats.show_battery = chkStatB.checked;

        // Custom stat sections inputs
        container.querySelectorAll('.txt-stat-sec-title').forEach(inp => {
          const sIdx = parseInt(inp.getAttribute('data-sidx'));
          if (this._config.stats.custom_sections && this._config.stats.custom_sections[sIdx]) {
            this._config.stats.custom_sections[sIdx].title = inp.value.trim();
          }
        });
        container.querySelectorAll('.txt-stat-sec-unit').forEach(inp => {
          const sIdx = parseInt(inp.getAttribute('data-sidx'));
          if (this._config.stats.custom_sections && this._config.stats.custom_sections[sIdx]) {
            this._config.stats.custom_sections[sIdx].unit = inp.value.trim();
          }
        });
        container.querySelectorAll('.txt-stat-sec-icon').forEach(inp => {
          const sIdx = parseInt(inp.getAttribute('data-sidx'));
          if (this._config.stats.custom_sections && this._config.stats.custom_sections[sIdx]) {
            this._config.stats.custom_sections[sIdx].icon = inp.value.trim();
          }
        });
        container.querySelectorAll('.txt-stat-ent-name').forEach(inp => {
          const sIdx = parseInt(inp.getAttribute('data-sidx'));
          const eIdx = parseInt(inp.getAttribute('data-eidx'));
          const sec = this._config.stats.custom_sections?.[sIdx];
          if (sec && sec.entities && sec.entities[eIdx]) {
            if (typeof sec.entities[eIdx] === 'string') {
              sec.entities[eIdx] = { id: sec.entities[eIdx], name: inp.value.trim(), color: '#38bdf8' };
            } else {
              sec.entities[eIdx].name = inp.value.trim();
            }
          }
        });
        container.querySelectorAll('.txt-stat-ent-id').forEach(inp => {
          const sIdx = parseInt(inp.getAttribute('data-sidx'));
          const eIdx = parseInt(inp.getAttribute('data-eidx'));
          const sec = this._config.stats.custom_sections?.[sIdx];
          if (sec && sec.entities && sec.entities[eIdx]) {
            if (typeof sec.entities[eIdx] === 'string') {
              sec.entities[eIdx] = { id: inp.value.trim(), name: '', color: '#38bdf8' };
            } else {
              sec.entities[eIdx].id = inp.value.trim();
            }
          }
        });
        container.querySelectorAll('.cp-stat-ent-color').forEach(inp => {
          const sIdx = parseInt(inp.getAttribute('data-sidx'));
          const eIdx = parseInt(inp.getAttribute('data-eidx'));
          const sec = this._config.stats.custom_sections?.[sIdx];
          if (sec && sec.entities && sec.entities[eIdx]) {
            if (typeof sec.entities[eIdx] === 'string') {
              sec.entities[eIdx] = { id: sec.entities[eIdx], name: '', color: inp.value };
            } else {
              sec.entities[eIdx].color = inp.value;
            }
          }
        });

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

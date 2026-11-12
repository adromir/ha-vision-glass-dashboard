// Build Script for Vision Glass Dashboard v2.0.0
// Author: Adromir
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../dist/vision-glass-dashboard.js');
let code = fs.readFileSync(filePath, 'utf8');

console.log(`Loaded vision-glass-dashboard.js (${code.length} bytes)...`);

// 1. Add static async getConfigElement() to VisionGlassDashboard
if (!code.includes('getConfigElement')) {
  const target = 'class VisionGlassDashboard extends HTMLElement {';
  const replacement = `class VisionGlassDashboard extends HTMLElement {
  static async getConfigElement() {
    return document.createElement('vision-glass-dashboard-editor');
  }`;
  code = code.replace(target, replacement);
  console.log('Added static async getConfigElement()');
}

// 2. Add Auto-Provisioning & Config Handling in setConfig and set hass
const autoProvisionLogic = `
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
`;

// Insert autoProvisionLogic before setConfig
const setConfigIndex = code.indexOf('setConfig(config) {');
if (setConfigIndex !== -1 && !code.includes('_autoProvision(hass)')) {
  code = code.slice(0, setConfigIndex) + autoProvisionLogic + '\n  ' + code.slice(setConfigIndex);
  console.log('Injected _autoProvision logic');
}

// 3. Update set hass to trigger auto-provisioning if uninitialized
const targetSetHass = `  set hass(hass) {
    this._hass = hass;
    if (!this._initialRenderDone) return;`;

const replacementSetHass = `  set hass(hass) {
    this._hass = hass;
    if (!this._initialRenderDone) return;
    if (this._config && !this._config._initialized && (!this._config.rooms || this._config.rooms.length === 0 || this._config.auto_provision)) {
      this._autoProvision(hass);
    }`;

if (code.includes(targetSetHass) && !code.includes('this._autoProvision(hass)')) {
  code = code.replace(targetSetHass, replacementSetHass);
  console.log('Updated set hass(hass) with auto-provision check');
}

// 4. Update setConfig to handle dock and custom categories
const targetSetConfigBody = `      washing_machine_switch: config.washing_machine_switch || stub.washing_machine_switch,
      washing_machine_power: config.washing_machine_power || stub.washing_machine_power,
      rooms: (config.rooms && config.rooms.length > 0) ? config.rooms.map(r => {`;

const replacementSetConfigBody = `      washing_machine_switch: config.washing_machine_switch || stub.washing_machine_switch,
      washing_machine_power: config.washing_machine_power || stub.washing_machine_power,
      _initialized: config._initialized === true,
      dock: config.dock || {
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
      },
      rooms: (config.rooms && config.rooms.length > 0) ? config.rooms.map(r => {`;

if (code.includes(targetSetConfigBody) && !code.includes('_initialized: config._initialized === true')) {
  code = code.replace(targetSetConfigBody, replacementSetConfigBody);
  console.log('Updated setConfig body with _initialized and dock items');
}

// 5. Update room map in setConfig to preserve overlay_categories
const targetRoomMap = `          ...r,
          humidity_entity: r.humidity_entity || sr.humidity_entity,
          illuminance_entity: r.illuminance_entity || sr.illuminance_entity
        };`;

const replacementRoomMap = `          ...r,
          humidity_entity: r.humidity_entity || sr.humidity_entity,
          illuminance_entity: r.illuminance_entity || sr.illuminance_entity,
          overlay_categories: r.overlay_categories || sr.overlay_categories || null
        };`;

if (code.includes(targetRoomMap)) {
  code = code.replace(targetRoomMap, replacementRoomMap);
  console.log('Preserved overlay_categories in setConfig');
}

// 6. Dynamic Dock Rendering
const targetDockHtml = `        <!-- Floating Glass Dock -->
        <div class="dock-container">
          <div class="dock-item" id="dockLighting" title="Beleuchtung">\${this._icon('light', { size: 19, cls: 'icon-light' })}</div>
          <div class="dock-item" id="dockClimate" title="Heizung & Schnellregler">\${this._icon('climate', { size: 19, cls: 'icon-climate' })}</div>
          <div class="dock-item" id="dockStats" title="Statistiken & Verläufe">\${this._icon('chart-bar', { size: 19, cls: 'icon-stats' })}</div>
          <div class="dock-item" id="dockSecurity" title="Sicherheit & Wohnungsschloss">\${this._icon('lock-closed', { size: 19, cls: 'icon-security' })}</div>
          <div class="dock-item" id="dockAlarmo" title="Alarmanlage (Alarmo)">\${this._icon('shield', { size: 19, cls: 'icon-alarmo' })}</div>
          <div class="dock-item" id="dockSwitches" title="Geräte & Steckdosen">\${this._icon('plug', { size: 19, cls: 'icon-switch' })}</div>
          <div class="dock-item" id="dockBattery" title="Wartung & Batteriestatus">\${this._icon('battery-50', { size: 19, cls: 'icon-battery' })}</div>
          <div class="dock-item" id="dockWeather" title="Wettervorhersage & Niederschlag">\${this._icon('sun', { size: 19, cls: 'icon-weather' })}</div>
        </div>`;

const replacementDockHtml = `        <!-- Floating Dynamic Glass Dock -->
        <div class="dock-container">
          \${this._renderDynamicDock()}
        </div>`;

if (code.includes(targetDockHtml)) {
  code = code.replace(targetDockHtml, replacementDockHtml);
  console.log('Replaced static dock HTML with dynamic dock renderer');
}

// Add _renderDynamicDock & Custom Modal methods
const dynamicDockMethods = `
  _renderDynamicDock() {
    const dockConf = this._config.dock || { auto_detect: true, items: [] };
    const autoDetect = dockConf.auto_detect !== false;
    const items = dockConf.items && dockConf.items.length > 0 ? dockConf.items : [
      { id: 'lighting', title: 'Beleuchtung', enabled: true, auto_hide: true },
      { id: 'climate', title: 'Heizung', enabled: true, auto_hide: true },
      { id: 'stats', title: 'Statistiken', enabled: true, auto_hide: false },
      { id: 'security', title: 'Sicherheit', enabled: true, auto_hide: false },
      { id: 'alarmo', title: 'Alarmo', enabled: true, auto_hide: true },
      { id: 'switches', title: 'Geräte', enabled: true, auto_hide: true },
      { id: 'battery', title: 'Batteriestatus', enabled: true, auto_hide: true },
      { id: 'weather', title: 'Wetter', enabled: true, auto_hide: false }
    ];

    const hasStates = this._hass && this._hass.states;
    const hasAlarmo = hasStates && Object.keys(this._hass.states).some(e => e.startsWith('alarm_control_panel.'));
    const hasLights = hasStates && Object.keys(this._hass.states).some(e => e.startsWith('light.'));
    const hasClimate = hasStates && Object.keys(this._hass.states).some(e => e.startsWith('climate.'));
    const hasSwitches = hasStates && Object.keys(this._hass.states).some(e => e.startsWith('switch.'));
    const hasBatteries = hasStates && Object.keys(this._hass.states).some(e => e.includes('battery') || this._hass.states[e]?.attributes?.device_class === 'battery');

    return items.map((item, idx) => {
      if (item.enabled === false) return '';
      if (autoDetect && item.auto_hide) {
        if (item.id === 'alarmo' && !hasAlarmo) return '';
        if (item.id === 'lighting' && !hasLights) return '';
        if (item.id === 'climate' && !hasClimate) return '';
        if (item.id === 'switches' && !hasSwitches) return '';
        if (item.id === 'battery' && !hasBatteries) return '';
      }

      // Standard Icon Map
      let iconSvg = '';
      if (item.id === 'lighting') iconSvg = this._icon('light', { size: 19, cls: 'icon-light' });
      else if (item.id === 'climate') iconSvg = this._icon('climate', { size: 19, cls: 'icon-climate' });
      else if (item.id === 'stats') iconSvg = this._icon('chart-bar', { size: 19, cls: 'icon-stats' });
      else if (item.id === 'security') iconSvg = this._icon('lock-closed', { size: 19, cls: 'icon-security' });
      else if (item.id === 'alarmo') iconSvg = this._icon('shield', { size: 19, cls: 'icon-alarmo' });
      else if (item.id === 'switches') iconSvg = this._icon('plug', { size: 19, cls: 'icon-switch' });
      else if (item.id === 'battery') iconSvg = this._icon('battery-50', { size: 19, cls: 'icon-battery' });
      else if (item.id === 'weather') iconSvg = this._icon('sun', { size: 19, cls: 'icon-weather' });
      else {
        // Custom item icon
        iconSvg = this._icon(item.icon || 'star', { size: 19, cls: 'icon-custom' });
      }

      return \`<div class="dock-item" data-dock-id="\${item.id}" data-dock-idx="\${idx}" title="\${item.title}">\${iconSvg}</div>\`;
    }).join('');
  }

  _bindDynamicDockEvents() {
    this.shadowRoot.querySelectorAll('.dock-item[data-dock-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-dock-id');
        const idx = parseInt(btn.getAttribute('data-dock-idx'));
        const dockConf = this._config.dock || {};
        const items = dockConf.items || [];
        const item = items[idx] || { id };

        if (['lighting', 'climate', 'stats', 'security', 'alarmo', 'switches', 'battery', 'weather'].includes(id)) {
          this._openModal(id);
        } else {
          // Custom dock tab
          if (item.type === 'navigate' && item.navigation_path) {
            window.history.pushState(null, '', item.navigation_path);
            window.dispatchEvent(new CustomEvent('location-changed'));
          } else if (item.type === 'service' && item.service) {
            const [domain, srv] = item.service.split('.');
            this._callService(domain, srv, item.service_data || {});
          } else {
            // Modal overlay for custom tab
            this._openCustomDockModal(item);
          }
        }
      });
    });
  }

  _openCustomDockModal(item) {
    this._activeModal = { type: 'custom_dock', item };
    const modalEl = this.shadowRoot.getElementById('modalContainer');
    if (!modalEl) return;
    modalEl.classList.remove('hidden');

    const titleEl = this.shadowRoot.getElementById('modalTitle');
    const bodyEl = this.shadowRoot.getElementById('modalBody');
    if (titleEl) {
      titleEl.innerHTML = \`\${this._icon(item.icon || 'star', { size: 22, style: 'margin-right:8px;' })} \${item.title}\`;
    }
    if (bodyEl) {
      const categories = item.overlay_categories || [];
      if (categories.length === 0) {
        bodyEl.innerHTML = \`
          <div style="text-align:center;padding:32px;color:var(--text-secondary);">
            <div style="font-size:32px;margin-bottom:8px;">📂</div>
            <div style="font-size:16px;font-weight:600;">\${item.title}</div>
            <div style="font-size:13px;margin-top:4px;">Noch keine Kategorien oder Entitäten für diesen Bereich konfiguriert. Füge sie im Karten-Editor hinzu!</div>
          </div>
        \`;
        return;
      }

      bodyEl.innerHTML = \`
        <div style="display:flex;flex-direction:column;gap:18px;">
          \${categories.map(cat => \`
            <div style="background:rgba(255,255,255,0.04);border:1px solid var(--border-subtle);border-radius:18px;padding:16px;">
              <div style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;margin-bottom:12px;color:var(--accent);">
                \${this._icon(cat.icon || 'folder', { size: 18 })}
                <span>\${cat.name}</span>
                <span style="font-size:12px;opacity:0.6;font-weight:500;">(\${(cat.entities || []).length})</span>
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px;">
                \${(cat.entities || []).map(eId => this._renderModalEntityTile(eId)).join('')}
              </div>
            </div>
          \`).join('')}
        </div>
      \`;
      this._bindModalEntityEvents(bodyEl);
    }
  }

  _renderModalEntityTile(eId) {
    const s = this._hass && this._hass.states[eId];
    if (!s) {
      return \`<div style="padding:10px 14px;background:rgba(255,255,255,0.03);border-radius:12px;font-size:12px;color:var(--text-secondary);">\${eId} (offline)</div>\`;
    }
    const fn = (s.attributes && s.attributes.friendly_name) || eId;
    const isOn = s.state === 'on';
    const isLight = eId.startsWith('light.');
    const isSwitch = eId.startsWith('switch.');
    const isClimate = eId.startsWith('climate.');

    return \`
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:rgba(255,255,255,0.06);border:1px solid var(--border-subtle);border-radius:14px;">
        <div style="min-width:0;flex:1;margin-right:12px;">
          <div style="font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">\${fn}</div>
          <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">\${s.state} \${(s.attributes && s.attributes.unit_of_measurement) || ''}</div>
        </div>
        <div>
          \${(isLight || isSwitch) ? \`
            <button class="btn-micro" data-action="toggle" data-entity="\${eId}" style="\${isOn ? 'background:var(--accent);color:white;' : ''}">\${isOn ? 'AN' : 'AUS'}</button>
          \` : \`
            <span style="font-size:13px;font-weight:700;color:var(--accent);">\${s.state} \${(s.attributes && s.attributes.unit_of_measurement) || ''}</span>
          \`}
        </div>
      </div>
    \`;
  }

  _bindModalEntityEvents(container) {
    container.querySelectorAll('[data-action="toggle"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const eId = btn.getAttribute('data-entity');
        const [domain] = eId.split('.');
        this._callService(domain, 'toggle', { entity_id: eId });
      });
    });
  }
`;

// Insert dynamicDockMethods
if (!code.includes('_renderDynamicDock()')) {
  const insertPoint = code.indexOf('_bindEvents() {');
  if (insertPoint !== -1) {
    code = code.slice(0, insertPoint) + dynamicDockMethods + '\n  ' + code.slice(insertPoint);
    console.log('Added _renderDynamicDock & custom dock modal methods');
  }
}

// Update _bindEvents() to call _bindDynamicDockEvents() instead of static dock listeners
const targetBindDock = `    this.shadowRoot.getElementById('dockLighting').addEventListener('click', () => this._openModal('lighting'));
    this.shadowRoot.getElementById('dockClimate').addEventListener('click', () => this._openModal('climate'));
    this.shadowRoot.getElementById('dockStats').addEventListener('click', () => this._openModal('stats'));
    this.shadowRoot.getElementById('dockSecurity').addEventListener('click', () => this._openModal('security'));
    this.shadowRoot.getElementById('dockAlarmo').addEventListener('click', () => this._openModal('alarmo'));
    this.shadowRoot.getElementById('dockSwitches').addEventListener('click', () => this._openModal('switches'));
    this.shadowRoot.getElementById('dockBattery').addEventListener('click', () => this._openModal('battery'));
    this.shadowRoot.getElementById('dockWeather').addEventListener('click', () => this._openModal('weather'));`;

const replacementBindDock = `    this._bindDynamicDockEvents();`;

if (code.includes(targetBindDock)) {
  code = code.replace(targetBindDock, replacementBindDock);
  console.log('Updated dock event listeners to use _bindDynamicDockEvents()');
}

// 7. Enhance _renderRoomModal to render custom categories if configured
const targetRoomModalCategories = `    body.innerHTML = \`
      <div style="display:flex;flex-direction:column;gap:16px;">`;

const replacementRoomModalCategories = `    const customCategoriesHtml = (room.overlay_categories && room.overlay_categories.length > 0) ? \`
      <div style="display:flex;flex-direction:column;gap:16px;margin-top:12px;">
        \${room.overlay_categories.map(cat => \`
          <div style="background:rgba(255,255,255,0.04);border:1px solid var(--border-subtle);border-radius:18px;padding:16px;">
            <div style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:8px;margin-bottom:12px;color:var(--accent);">
              \${this._icon(cat.icon || 'folder', { size: 17 })}
              <span>\${cat.name}</span>
              <span style="font-size:11px;opacity:0.6;font-weight:500;">(\${(cat.entities || []).length})</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;">
              \${(cat.entities || []).map(eId => this._renderModalEntityTile(eId)).join('')}
            </div>
          </div>
        \`).join('')}
      </div>
    \` : '';

    body.innerHTML = \`
      <div style="display:flex;flex-direction:column;gap:16px;">
        \${customCategoriesHtml}`;

if (code.includes(targetRoomModalCategories) && !code.includes('customCategoriesHtml')) {
  code = code.replace(targetRoomModalCategories, replacementRoomModalCategories);
  console.log('Enhanced _renderRoomModal with custom category rendering');
}

// 8. Add VisionGlassDashboardEditor Custom Element
const editorComponent = `
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
    this.render();
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

    this.shadowRoot.innerHTML = \`
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
        \${allEntities.map(e => \`<option value="\${e}"></option>\`).join('')}
      </datalist>

      <div class="editor-container">
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
          <button class="nav-tab \${this._activeTab === 'rooms' ? 'active' : ''}" data-tab="rooms">🏠 Räume & Bento-Karten (\${rooms.length})</button>
          <button class="nav-tab \${this._activeTab === 'overlays' ? 'active' : ''}" data-tab="overlays">📂 Raum-Overlays (Kategorien)</button>
          <button class="nav-tab \${this._activeTab === 'dock' ? 'active' : ''}" data-tab="dock">⚓ Bottom-Leiste (Dock)</button>
          <button class="nav-tab \${this._activeTab === 'general' ? 'active' : ''}" data-tab="general">⚙️ Allgemein</button>
        </div>

        <!-- TAB 1: RÄUME & BENTO KARTEN -->
        \${this._activeTab === 'rooms' ? \`
          <div class="banner">
            Hier konfigurierst du die <strong>Bento-Raumkarten</strong> auf dem Dashboard. Ändere die Reihenfolge mit [▲] [▼] oder füge neue Räume hinzu.
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <label>Vorhandene Räume</label>
            <button class="btn btn-sm btn-primary" id="btnAddRoom">+ Raum hinzufügen</button>
          </div>
          <div class="item-list">
            \${rooms.map((r, rIdx) => \`
              <div class="card-box" style="margin-bottom:10px;">
                <div class="row-horiz" style="margin-bottom:8px;">
                  <strong style="font-size:14px;">\${r.name || r.id}</strong>
                  <div class="reorder-btns">
                    <button class="btn btn-sm btn-room-up" data-idx="\${rIdx}" \${rIdx === 0 ? 'disabled' : ''}>▲</button>
                    <button class="btn btn-sm btn-room-down" data-idx="\${rIdx}" \${rIdx === rooms.length - 1 ? 'disabled' : ''}>▼</button>
                    <button class="btn btn-sm btn-room-del" data-idx="\${rIdx}" style="color:#ef4444;">✕</button>
                  </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                  <div class="row">
                    <label>Raumname</label>
                    <input type="text" class="room-name-input" data-idx="\${rIdx}" value="\${r.name || ''}">
                  </div>
                  <div class="row">
                    <label>Raum ID</label>
                    <input type="text" class="room-id-input" data-idx="\${rIdx}" value="\${r.id || ''}">
                  </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                  <div class="row">
                    <label>Hauptlicht</label>
                    <input type="text" list="all_entities" class="room-light-input" data-idx="\${rIdx}" value="\${r.light_entity || ''}" placeholder="light.wohnzimmer">
                  </div>
                  <div class="row">
                    <label>Thermostat</label>
                    <input type="text" list="all_entities" class="room-climate-input" data-idx="\${rIdx}" value="\${r.climate_entity || ''}" placeholder="climate.thermostat">
                  </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                  <div class="row">
                    <label>Präsenz / Bewegung</label>
                    <input type="text" list="all_entities" class="room-pres-input" data-idx="\${rIdx}" value="\${r.presence_entity || ''}" placeholder="binary_sensor.occupied">
                  </div>
                  <div class="row">
                    <label>Fensterkontakt</label>
                    <input type="text" list="all_entities" class="room-win-input" data-idx="\${rIdx}" value="\${r.window_entity || ''}" placeholder="binary_sensor.fenster">
                  </div>
                </div>
                <div class="row">
                  <label>Hintergrundbild URL</label>
                  <input type="text" class="room-pic-input" data-idx="\${rIdx}" value="\${r.picture || ''}" placeholder="/local/rooms/wohnzimmer.jpg">
                </div>
              </div>
            \`).join('')}
          </div>
        \` : ''}

        <!-- TAB 2: OVERLAYS (BENUTZERDEFINIERTE KATEGORIEN) -->
        \${this._activeTab === 'overlays' ? \`
          <div class="banner">
            Definiere <strong>eigene Kategorien</strong> für das Detail-Modal jedes Raums (z. B. <em>"Hauptlicht"</em>, <em>"Ambiente"</em>, <em>"Multimedia"</em>, <em>"Steckdosen"</em>) und sortiere die Entitäten frei mit Pfeiltasten!
          </div>

          <div class="row">
            <label>Raum auswählen</label>
            <select id="selectRoomOverlay">
              \${rooms.map((r, idx) => \`<option value="\${idx}" \${idx === this._selectedRoomIdx ? 'selected' : ''}>\${r.name || r.id}</option>\`).join('')}
            </select>
          </div>

          \${curRoom ? \`
            <div style="display:flex;justify-content:space-between;align-items:center;margin:12px 0 8px 0;">
              <strong style="font-size:14px;">Kategorien in \${curRoom.name || curRoom.id}</strong>
              <button class="btn btn-sm btn-primary" id="btnAddCategory">+ Neue Kategorie</button>
            </div>

            <div class="item-list">
              \${(curRoom.overlay_categories || []).map((cat, cIdx) => \`
                <div class="card-box" style="margin-bottom:10px;">
                  <div class="row-horiz" style="margin-bottom:8px;">
                    <div style="display:flex;align-items:center;gap:8px;flex:1;">
                      <input type="text" class="cat-name-input" data-cidx="\${cIdx}" value="\${cat.name || ''}" placeholder="Kategoriename (z.B. Beleuchtung)" style="font-weight:700;max-width:200px;">
                      <input type="text" class="cat-icon-input" data-cidx="\${cIdx}" value="\${cat.icon || ''}" placeholder="ci:light-cove-strip" style="max-width:140px;">
                    </div>
                    <div class="reorder-btns">
                      <button class="btn btn-sm btn-cat-up" data-cidx="\${cIdx}" \${cIdx === 0 ? 'disabled' : ''}>▲</button>
                      <button class="btn btn-sm btn-cat-down" data-cidx="\${cIdx}" \${cIdx === (curRoom.overlay_categories.length - 1) ? 'disabled' : ''}>▼</button>
                      <button class="btn btn-sm btn-cat-del" data-cidx="\${cIdx}" style="color:#ef4444;">✕</button>
                    </div>
                  </div>

                  <div class="item-list" style="margin:8px 0;">
                    \${(cat.entities || []).map((eId, eIdx) => \`
                      <div class="list-item" style="padding:6px 10px;">
                        <span style="font-size:12px;font-family:monospace;">\${eId}</span>
                        <div class="reorder-btns">
                          <button class="btn btn-sm btn-ent-up" data-cidx="\${cIdx}" data-eidx="\${eIdx}" \${eIdx === 0 ? 'disabled' : ''}>▲</button>
                          <button class="btn btn-sm btn-ent-down" data-cidx="\${cIdx}" data-eidx="\${eIdx}" \${eIdx === (cat.entities.length - 1) ? 'disabled' : ''}>▼</button>
                          <button class="btn btn-sm btn-ent-del" data-cidx="\${cIdx}" data-eidx="\${eIdx}" style="color:#ef4444;">✕</button>
                        </div>
                      </div>
                    \`).join('')}
                  </div>

                  <div style="display:flex;gap:6px;margin-top:8px;">
                    <input type="text" list="all_entities" class="new-ent-input" data-cidx="\${cIdx}" placeholder="Entität hinzufügen (z.B. light.tv_ambilight)">
                    <button class="btn btn-sm btn-add-ent-to-cat" data-cidx="\${cIdx}">+ Hinzufügen</button>
                  </div>
                </div>
              \`).join('')}
            </div>
          \` : '<div style="color:var(--secondary-text-color);">Kein Raum vorhanden.</div>'}
        \` : ''}

        <!-- TAB 3: BOTTOM-LEISTE (DOCK) -->
        \${this._activeTab === 'dock' ? \`
          <div class="banner">
            Die Bottom-Leiste blendet inaktive Standard-Buttons automatisch aus (z.B. wenn kein Alarmo oder keine Lichter installiert sind). Hier kannst du auch <strong>komplett eigene Dock-Bereiche</strong> (z.B. Kameras, Garten, Szenen) anlegen!
          </div>

          <div class="card-box" style="margin-bottom:12px;">
            <label class="row-horiz" style="cursor:pointer;font-size:13px;text-transform:none;">
              <span>Automatische Erkennung aktivieren (Inaktive Buttons automatisch ausblenden)</span>
              <input type="checkbox" id="chkAutoDetect" \${dock.auto_detect !== false ? 'checked' : ''}>
            </label>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <label>Dock-Elemente & Eigene Bereiche</label>
            <button class="btn btn-sm btn-primary" id="btnAddDockItem">+ Eigenen Bereich hinzufügen</button>
          </div>

          <div class="item-list">
            \${(dock.items || []).map((item, dIdx) => \`
              <div class="card-box" style="margin-bottom:8px;">
                <div class="row-horiz">
                  <div style="display:flex;align-items:center;gap:8px;flex:1;">
                    <input type="checkbox" class="chk-dock-item" data-didx="\${dIdx}" \${item.enabled !== false ? 'checked' : ''}>
                    <input type="text" class="dock-title-input" data-didx="\${dIdx}" value="\${item.title || item.id}" style="font-weight:600;max-width:160px;">
                    <input type="text" class="dock-icon-input" data-didx="\${dIdx}" value="\${item.icon || ''}" placeholder="Icon (z.B. ci:washing-machine-spin)" style="max-width:160px;">
                  </div>
                  <div class="reorder-btns">
                    <button class="btn btn-sm btn-dock-up" data-didx="\${dIdx}" \${dIdx === 0 ? 'disabled' : ''}>▲</button>
                    <button class="btn btn-sm btn-dock-down" data-didx="\${dIdx}" \${dIdx === (dock.items.length - 1) ? 'disabled' : ''}>▼</button>
                    \${item.is_custom ? \`<button class="btn btn-sm btn-dock-del" data-didx="\${dIdx}" style="color:#ef4444;">✕</button>\` : ''}
                  </div>
                </div>

                \${item.is_custom ? \`
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
                    <div class="row">
                      <label>Aktionstyp</label>
                      <select class="dock-type-select" data-didx="\${dIdx}">
                        <option value="modal" \${item.type === 'modal' ? 'selected' : ''}>Modal-Overlay</option>
                        <option value="navigate" \${item.type === 'navigate' ? 'selected' : ''}>Dashboard-Link</option>
                        <option value="service" \${item.type === 'service' ? 'selected' : ''}>Service / Skript</option>
                      </select>
                    </div>
                    <div class="row">
                      <label>\${item.type === 'navigate' ? 'Ziel-Pfad' : (item.type === 'service' ? 'Service Name' : 'Hinweis')}</label>
                      \${item.type === 'navigate' ? \`
                        <input type="text" class="dock-path-input" data-didx="\${dIdx}" value="\${item.navigation_path || ''}" placeholder="/lovelace/energy">
                      \` : (item.type === 'service' ? \`
                        <input type="text" class="dock-srv-input" data-didx="\${dIdx}" value="\${item.service || ''}" placeholder="script.gute_nacht">
                      \` : \`
                        <span style="font-size:12px;color:var(--secondary-text-color);padding-top:8px;">Öffnet eigenes Glass-Modal</span>
                      \`)}
                    </div>
                  </div>
                \` : ''}
              </div>
            \`).join('')}
          </div>
        \` : ''}

        <!-- TAB 4: ALLGEMEIN -->
        \${this._activeTab === 'general' ? \`
          <div class="card-box">
            <div class="row">
              <label>Dashboard Titel</label>
              <input type="text" id="cfgTitle" value="\${this._config.title || ''}" placeholder="Wohnung Andreas">
            </div>
            <div class="row">
              <label>Wetter-Entität</label>
              <input type="text" list="all_entities" id="cfgWeather" value="\${this._config.weather_entity || ''}" placeholder="weather.hannover_hannover">
            </div>
            <div class="row">
              <label>Wohnungsschloss-Entität</label>
              <input type="text" list="all_entities" id="cfgLock" value="\${this._config.lock_entity || ''}" placeholder="lock.wohnungsschloss">
            </div>
            <div class="row">
              <label>Alle Lichter Gruppe</label>
              <input type="text" list="all_entities" id="cfgAllLights" value="\${this._config.all_lights_entity || ''}" placeholder="light.licht_wohnung">
            </div>
            <div class="row-horiz" style="margin-top:12px;">
              <label style="cursor:pointer;font-size:13px;text-transform:none;">
                <span>Automatischer Tag/Nacht-Wechsel (Sonnenstand)</span>
                <input type="checkbox" id="chkDayNight" \${this._config.auto_day_night !== false ? 'checked' : ''}>
              </label>
            </div>
          </div>
        \` : ''}
      </div>
    \`;

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

    this.shadowRoot.querySelectorAll('.btn-room-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        if (confirm('Diesen Raum wirklich entfernen?')) {
          this._config.rooms.splice(idx, 1);
          this._fireConfigChanged();
          this.render();
        }
      });
    });

    const btnAddR = this.shadowRoot.getElementById('btnAddRoom');
    if (btnAddR) {
      btnAddR.addEventListener('click', () => {
        const newId = 'raum_' + Date.now().toString().slice(-4);
        this._config.rooms.push({
          id: newId,
          name: 'Neuer Raum',
          overlay_categories: [
            { id: 'light', name: 'Beleuchtung', icon: 'ci:light-cove-strip', entities: [] },
            { id: 'climate', name: 'Klima', icon: 'mdi:radiator', entities: [] }
          ]
        });
        this._fireConfigChanged();
        this.render();
      });
    }

    // Room input fields
    this.shadowRoot.querySelectorAll('.room-name-input').forEach(i => {
      i.addEventListener('change', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'));
        this._config.rooms[idx].name = e.target.value;
        this._fireConfigChanged();
      });
    });
    this.shadowRoot.querySelectorAll('.room-id-input').forEach(i => {
      i.addEventListener('change', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'));
        this._config.rooms[idx].id = e.target.value;
        this._fireConfigChanged();
      });
    });
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
    this.shadowRoot.querySelectorAll('.room-pic-input').forEach(i => {
      i.addEventListener('change', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'));
        this._config.rooms[idx].picture = e.target.value;
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
        const input = this.shadowRoot.querySelector(\`.new-ent-input[data-cidx="\${cIdx}"]\`);
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
    const cfgT = this.shadowRoot.getElementById('cfgTitle');
    if (cfgT) cfgT.addEventListener('change', (e) => { this._config.title = e.target.value; this._fireConfigChanged(); });
    const cfgW = this.shadowRoot.getElementById('cfgWeather');
    if (cfgW) cfgW.addEventListener('change', (e) => { this._config.weather_entity = e.target.value; this._fireConfigChanged(); });
    const cfgL = this.shadowRoot.getElementById('cfgLock');
    if (cfgL) cfgL.addEventListener('change', (e) => { this._config.lock_entity = e.target.value; this._fireConfigChanged(); });
    const cfgA = this.shadowRoot.getElementById('cfgAllLights');
    if (cfgA) cfgA.addEventListener('change', (e) => { this._config.all_lights_entity = e.target.value; this._fireConfigChanged(); });
    const chkDN = this.shadowRoot.getElementById('chkDayNight');
    if (chkDN) chkDN.addEventListener('change', (e) => { this._config.auto_day_night = e.target.checked; this._fireConfigChanged(); });
  }
}

customElements.define('vision-glass-dashboard-editor', VisionGlassDashboardEditor);
`;

// Append editorComponent if not present
if (!code.includes('class VisionGlassDashboardEditor')) {
  code += '\n' + editorComponent;
  console.log('Appended VisionGlassDashboardEditor custom element definition');
}

fs.writeFileSync(filePath, code, 'utf8');
console.log(`Successfully written upgraded vision-glass-dashboard.js (${code.length} bytes)`);


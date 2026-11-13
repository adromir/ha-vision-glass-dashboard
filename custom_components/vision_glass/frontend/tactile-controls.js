import { ICONS } from './icons.js';

export const tactileMethods = {
  _renderClimateControlRow(entityId, stateObj) {
    if (!stateObj) return '';
    const name = stateObj.attributes?.friendly_name || entityId;
    const curTemp = stateObj.attributes?.current_temperature != null ? parseFloat(stateObj.attributes.current_temperature).toFixed(1) : '--';
    const targetTemp = stateObj.attributes?.temperature != null ? parseFloat(stateObj.attributes.temperature).toFixed(1) : '21.0';
    const isHeating = stateObj.attributes?.hvac_action === 'heating' || stateObj.attributes?.call_for_heat === true || (stateObj.attributes?.heating_power && stateObj.attributes.heating_power > 0.05);
    const isOff = stateObj.state === 'off' || stateObj.attributes?.hvac_action === 'off';
    const isWindowOpen = stateObj.attributes?.window_open === true;

    // Battery warning check (< 10%)
    let battWarningHtml = '';
    const battVal = stateObj?.attributes?.battery_level ?? stateObj?.attributes?.battery ?? (stateObj?.attributes?.device_class === 'battery' ? parseFloat(stateObj.state) : null);
    if (battVal != null && !isNaN(battVal) && battVal < 10) {
      battWarningHtml = `
        <span class="badge-battery-warn" style="background:rgba(239,68,68,0.22);border:1px solid rgba(239,68,68,0.5);color:#ef4444;border-radius:6px;padding:1px 5px;font-size:10px;font-weight:700;display:inline-flex;align-items:center;gap:2px;margin-left:4px;" title="Batterie kritisch: ${Math.round(battVal)}%">
          ${this._icon('battery-critical', { size: 10, color: '#ef4444' })} ${Math.round(battVal)}%
        </span>
      `;
    }

    return `
      <div class="control-row climate-control-badge ${isHeating ? 'is-heating' : ''}" style="padding:10px 14px;min-height:54px;display:flex;align-items:center;justify-content:space-between;border-radius:14px;border:1px solid ${isHeating ? 'rgba(245,158,11,0.5)' : 'var(--border-glass)'};background:var(--bg-card);box-shadow:${isHeating ? '0 0 14px rgba(245,158,11,0.18)' : 'var(--shadow-ambient)'};">
        <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;margin-right:12px;">
          <div class="climate-icon-wrap ${isHeating ? 'pulsing-flame' : ''}" style="width:34px;height:34px;border-radius:10px;background:${isHeating ? 'rgba(245,158,11,0.2)' : 'rgba(56,189,248,0.12)'};display:flex;align-items:center;justify-content:center;color:${isHeating ? '#f59e0b' : 'var(--accent)'};flex-shrink:0;">
            ${this._icon(isHeating ? 'flame' : 'climate', { size: 18 })}
          </div>
          <div style="min-width:0;">
            <div style="font-size:13px;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:6px;flex-wrap:wrap;line-height:1.3;" title="${name}">
              <span>${name}</span>
              ${isHeating ? `<span style="background:rgba(245,158,11,0.25);border:1px solid rgba(245,158,11,0.5);color:#f59e0b;padding:1px 6px;border-radius:6px;font-size:10px;font-weight:700;display:inline-flex;align-items:center;gap:3px;"><ha-icon icon="mdi:fire" style="--mdc-icon-size:12px;"></ha-icon> Heizen</span>` : (isOff ? `<span style="background:rgba(255,255,255,0.06);color:var(--text-secondary);padding:1px 6px;border-radius:6px;font-size:10px;">Aus</span>` : `<span style="background:rgba(56,189,248,0.15);color:var(--accent);padding:1px 6px;border-radius:6px;font-size:10px;">Bereit</span>`)}
              ${isWindowOpen ? `<span style="background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.4);color:#ef4444;padding:1px 6px;border-radius:6px;font-size:10px;font-weight:700;display:inline-flex;align-items:center;gap:3px;"><ha-icon icon="mdi:window-open-variant" style="--mdc-icon-size:12px;"></ha-icon> Fenster offen</span>` : ''}
              ${battWarningHtml}
            </div>
            <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">
              <span>Ist: <b style="color:var(--text-primary);">${curTemp}°C</b></span>
              <span style="margin:0 4px;">•</span>
              <span>Ziel: <b style="color:var(--accent);">${targetTemp}°C</b></span>
            </div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
          <button class="btn-step" data-cust-climate="${entityId}" data-delta="-0.5" title="Temperatur -0.5°C" style="width:28px;height:28px;border-radius:8px;font-size:14px;padding:0;display:flex;align-items:center;justify-content:center;">-</button>
          <span style="font-size:14px;font-weight:800;color:var(--accent);min-width:40px;text-align:center;">${targetTemp}°</span>
          <button class="btn-step" data-cust-climate="${entityId}" data-delta="0.5" title="Temperatur +0.5°C" style="width:28px;height:28px;border-radius:8px;font-size:14px;padding:0;display:flex;align-items:center;justify-content:center;">+</button>
        </div>
      </div>
    `;
  },

  _renderSwitchControlRow(entityId, stateObj) {
    const isOn = stateObj && (stateObj.state === 'on' || stateObj.state === 'playing');
    const name = (stateObj && stateObj.attributes.friendly_name) || entityId;
    const domain = entityId.split('.')[0];
    const icon = this._resolveEntityIcon(entityId, stateObj);

    // Battery warning check (< 10%)
    let battWarningHtml = '';
    const battVal = stateObj?.attributes?.battery_level ?? stateObj?.attributes?.battery ?? (stateObj?.attributes?.device_class === 'battery' ? parseFloat(stateObj.state) : null);
    if (battVal != null && !isNaN(battVal) && battVal < 10) {
      battWarningHtml = `
        <span class="badge-battery-warn" style="background:rgba(239,68,68,0.22);border:1px solid rgba(239,68,68,0.5);color:#ef4444;border-radius:8px;padding:2px 6px;font-size:10px;font-weight:700;display:inline-flex;align-items:center;gap:3px;margin-left:6px;" title="Batterie kritisch: ${Math.round(battVal)}%">
          ${this._icon('battery-critical', { size: 11, color: '#ef4444' })} ${Math.round(battVal)}%
        </span>
      `;
    }

    const pwr = stateObj?.attributes?.current_power_w ?? stateObj?.attributes?.power ?? stateObj?.attributes?.load_power;
    const pwrDisplay = (pwr != null && !isNaN(parseFloat(pwr))) ? ` • ${Math.round(parseFloat(pwr))} W` : '';

    const prefCtrl = this._config?.helper_controls?.[entityId];
    if (prefCtrl === 'badge') {
      return this._renderSensorBadgeHtml(entityId, stateObj);
    }
    if (prefCtrl === 'rocker-switch') {
      return `
        <div class="control-row" style="padding:10px 14px;min-height:50px;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;margin-right:12px;">
            <div style="flex-shrink:0;">${icon}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:600;line-height:1.3;word-break:break-word;white-space:normal;color:var(--text-primary);display:flex;align-items:center;flex-wrap:wrap;gap:4px;" title="${name}">
                <span>${name}</span>
                ${battWarningHtml}
              </div>
              <div style="font-size:11px;color:var(--text-secondary);">${isOn ? `${this._t('on')}${pwrDisplay}` : this._t('off')}</div>
            </div>
          </div>
          <div class="rocker-container ${isOn ? 'is-on' : ''}" data-rocker-entity="${entityId}">
            <div class="rocker-pill"></div>
            <div class="rocker-half half-off">AUS</div>
            <div class="rocker-half half-on">AN</div>
          </div>
        </div>
      `;
    }
    if (prefCtrl === 'hold-action') {
      return `
        <div class="control-row" style="padding:10px 14px;min-height:58px;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;margin-right:12px;">
            <div style="flex-shrink:0;">${icon}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:600;line-height:1.3;word-break:break-word;white-space:normal;color:var(--text-primary);display:flex;align-items:center;flex-wrap:wrap;gap:4px;" title="${name}">
                <span>${name}</span>
                ${battWarningHtml}
              </div>
              <div style="font-size:11px;color:var(--text-secondary);">${isOn ? `${this._t('on')}${pwrDisplay}` : this._t('off')}</div>
            </div>
          </div>
          <div class="hold-btn-container" data-hold-entity="${entityId}">
            <svg viewBox="0 0 100 100" style="position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg);">
              <circle class="hold-ring" cx="50" cy="50" r="44" fill="none" stroke="var(--accent)" stroke-width="7" stroke-dasharray="276.4" stroke-dashoffset="276.4"/>
            </svg>
            <div class="hold-btn-bg">${isOn ? 'AUS' : 'AN'}</div>
          </div>
        </div>
      `;
    }
    if (prefCtrl === 'push_button') {
      return `
        <div class="control-row" style="padding:10px 14px;min-height:48px;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;margin-right:12px;">
            <div style="flex-shrink:0;">${icon}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:600;line-height:1.3;word-break:break-word;white-space:normal;color:var(--text-primary);display:flex;align-items:center;flex-wrap:wrap;gap:4px;" title="${name}">
                <span>${name}</span>
                ${battWarningHtml}
              </div>
              <div style="font-size:11px;color:var(--text-secondary);">${isOn ? `${this._t('on')}${pwrDisplay}` : this._t('off')}</div>
            </div>
          </div>
          <button type="button" class="vg-push-btn ${isOn ? 'active' : ''}" data-push-entity="${entityId}" data-push-domain="${domain}">
            ${isOn ? this._t('on') : this._t('off')}
          </button>
        </div>
      `;
    }
    if (prefCtrl === 'icon_button') {
      return `
        <div class="control-row" style="padding:10px 14px;min-height:48px;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;margin-right:12px;">
            <div style="flex-shrink:0;">${icon}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:600;line-height:1.3;word-break:break-word;white-space:normal;color:var(--text-primary);display:flex;align-items:center;flex-wrap:wrap;gap:4px;" title="${name}">
                <span>${name}</span>
                ${battWarningHtml}
              </div>
              <div style="font-size:11px;color:var(--text-secondary);">${isOn ? `${this._t('on')}${pwrDisplay}` : this._t('off')}</div>
            </div>
          </div>
          <button type="button" class="vg-icon-btn ${isOn ? 'active' : ''}" data-icon-entity="${entityId}" data-icon-domain="${domain}" title="${isOn ? this._t('on') : this._t('off')}">
            ${icon}
          </button>
        </div>
      `;
    }

    return `
      <div class="control-row" style="padding:10px 14px;min-height:48px;">
        <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;margin-right:12px;">
          <div style="flex-shrink:0;">${icon}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:600;line-height:1.3;word-break:break-word;white-space:normal;color:var(--text-primary);display:flex;align-items:center;flex-wrap:wrap;gap:4px;" title="${name}">
              <span>${name}</span>
              ${battWarningHtml}
            </div>
            <div style="font-size:11px;color:var(--text-secondary);">${isOn ? `${this._t('on')}${pwrDisplay}` : this._t('off')}</div>
          </div>
        </div>
        <div class="vg-switch ${isOn ? 'active' : ''}" data-vg-switch="${entityId}" data-vg-domain="${domain}" role="switch" aria-checked="${isOn ? 'true' : 'false'}" title="${isOn ? this._t('on') : this._t('off')}">
          <div class="vg-switch-thumb"></div>
        </div>
      </div>
    `;
  },

  _renderSensorBadgeHtml(entityId, stateObj) {
    const name = (stateObj && stateObj.attributes.friendly_name) || entityId;
    let rawVal = stateObj ? stateObj.state : '--';
    const unit = (stateObj && stateObj.attributes.unit_of_measurement) || '';
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
    const icon = this._resolveEntityIcon(entityId, stateObj);

    // Battery warning check (< 10%)
    let battWarningHtml = '';
    const battVal = stateObj?.attributes?.battery_level ?? stateObj?.attributes?.battery ?? (stateObj?.attributes?.device_class === 'battery' ? parseFloat(stateObj.state) : null);
    if (battVal != null && !isNaN(battVal) && battVal < 10) {
      battWarningHtml = `
        <span class="badge-battery-warn" style="background:rgba(239,68,68,0.22);border:1px solid rgba(239,68,68,0.5);color:#ef4444;border-radius:6px;padding:1px 5px;font-size:10px;font-weight:700;display:inline-flex;align-items:center;gap:2px;margin-left:4px;" title="Batterie kritisch: ${Math.round(battVal)}%">
          ${this._icon('battery-critical', { size: 10, color: '#ef4444' })} ${Math.round(battVal)}%
        </span>
      `;
    }

    return `
      <div class="sensor-badge" style="display:flex;align-items:center;justify-content:space-between;background:var(--bg-card);border:1px solid var(--border-glass);border-radius:12px;padding:8px 12px;">
        <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;margin-right:8px;">
          <div style="flex-shrink:0;">${icon}</div>
          <div style="font-size:12px;color:var(--text-secondary);line-height:1.25;word-break:break-word;white-space:normal;display:flex;align-items:center;flex-wrap:wrap;" title="${name}">
            <span>${name}</span>
            ${battWarningHtml}
          </div>
        </div>
        <div style="font-size:12px;font-weight:700;color:${valColor};white-space:nowrap;flex-shrink:0;text-align:right;">${valDisplay}</div>
      </div>
    `;
  },

  _renderGenericEntityRow(entityId, stateObj) {
    if (!stateObj) return '';
    const name = stateObj.attributes?.friendly_name || entityId;
    const icon = this._resolveEntityIcon(entityId, stateObj);
    const domain = entityId.split('.')[0];
    const val = stateObj.state != null ? stateObj.state : '--';

    // Battery warning check
    let battWarningHtml = '';
    const battVal = stateObj.attributes?.battery_level ?? stateObj.attributes?.battery ?? (stateObj.attributes?.device_class === 'battery' ? parseFloat(stateObj.state) : null);
    if (battVal != null && !isNaN(battVal) && battVal < 10) {
      battWarningHtml = `
        <span class="badge-battery-warn" style="background:rgba(239,68,68,0.22);border:1px solid rgba(239,68,68,0.5);color:#ef4444;border-radius:6px;padding:1px 5px;font-size:10px;font-weight:700;display:inline-flex;align-items:center;gap:2px;margin-left:4px;" title="Batterie kritisch: ${Math.round(battVal)}%">
          ${this._icon('battery-critical', { size: 10, color: '#ef4444' })} ${Math.round(battVal)}%
        </span>
      `;
    }

    if (domain === 'climate') {
      return this._renderClimateControlRow(entityId, stateObj);
    }

    const prefCtrl = this._config?.helper_controls?.[entityId];

    if (domain === 'switch' || domain === 'input_boolean') {
      return this._renderSwitchControlRow(entityId, stateObj);
    }

    if (domain === 'input_number' || domain === 'number') {
      const numVal = parseFloat(val) || 0;
      const min = stateObj.attributes?.min ?? 0;
      const max = stateObj.attributes?.max ?? 100;
      const step = stateObj.attributes?.step ?? 1;
      const unit = stateObj.attributes?.unit_of_measurement || '';

      if (prefCtrl === 'badge') {
        return this._renderSensorBadgeHtml(entityId, stateObj);
      }

      if (prefCtrl === 'rotary-knob') {
        const pct = max > min ? Math.max(0, Math.min(1, (numVal - min) / (max - min))) : 0;
        const offset = 251.2 * (1 - pct);
        return `
          <div class="control-row" style="padding:10px 14px;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;margin-right:12px;">
              <div style="flex-shrink:0;">${icon}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:600;color:var(--text-primary);">${name}</div>
                <div style="font-size:11px;color:var(--text-secondary);">${min} - ${max} ${unit}</div>
              </div>
            </div>
            <div class="rotary-container" data-rotary-entity="${entityId}" data-min="${min}" data-max="${max}" data-step="${step}">
              <svg class="rotary-svg" viewBox="0 0 100 100">
                <circle class="rotary-bg-arc" cx="50" cy="50" r="40" stroke-dasharray="251.2" stroke-dashoffset="0"></circle>
                <circle class="rotary-val-arc" cx="50" cy="50" r="40" stroke-dasharray="251.2" stroke-dashoffset="${offset}"></circle>
              </svg>
              <div class="rotary-center-val">
                <span class="rotary-num">${numVal}</span>
                <span class="rotary-unit">${unit}</span>
              </div>
            </div>
          </div>
        `;
      }

      if (prefCtrl === 'open-arc') {
        const pct = max > min ? Math.max(0, Math.min(1, (numVal - min) / (max - min))) : 0;
        const offset = 188.5 * (1 - pct);
        const angleRad = (135 + pct * 270) * (Math.PI / 180);
        const handleX = 50 + 40 * Math.cos(angleRad);
        const handleY = 50 + 40 * Math.sin(angleRad);
        return `
          <div class="control-row" style="padding:10px 14px;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;margin-right:12px;">
              <div style="flex-shrink:0;">${icon}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:600;color:var(--text-primary);">${name}</div>
                <div style="font-size:11px;color:var(--text-secondary);">${min} - ${max} ${unit}</div>
              </div>
            </div>
            <div class="openarc-container" data-openarc-entity="${entityId}" data-min="${min}" data-max="${max}" data-step="${step}">
              <svg viewBox="0 0 100 100" style="width:100%;height:100%;">
                <path d="M 21.7 78.3 A 40 40 0 1 1 78.3 78.3" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="8" stroke-linecap="round"/>
                <path class="openarc-val-path" d="M 21.7 78.3 A 40 40 0 1 1 78.3 78.3" fill="none" stroke="var(--accent)" stroke-width="8" stroke-linecap="round" stroke-dasharray="188.5" stroke-dashoffset="${offset}"/>
                <circle class="openarc-handle" cx="${handleX}" cy="${handleY}" r="6" fill="#ffffff" stroke="var(--accent)" stroke-width="2" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); pointer-events:none;"/>
              </svg>
              <div class="openarc-center">
                <span class="rotary-num">${numVal}</span>
                <span class="rotary-unit">${unit}</span>
              </div>
            </div>
          </div>
        `;
      }

      if (prefCtrl === 'half-circle') {
        const pct = max > min ? Math.max(0, Math.min(1, (numVal - min) / (max - min))) : 0;
        const offset = 125.6 * (1 - pct);
        const angleRad = (180 - pct * 180) * (Math.PI / 180);
        const handleX = 50 + 40 * Math.cos(angleRad);
        const handleY = 50 - 40 * Math.sin(angleRad);
        return `
          <div class="control-row" style="padding:10px 14px;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;margin-right:12px;">
              <div style="flex-shrink:0;">${icon}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:600;color:var(--text-primary);">${name}</div>
                <div style="font-size:11px;color:var(--text-secondary);">${numVal} ${unit}</div>
              </div>
            </div>
            <div class="halfcircle-container" data-halfcircle-entity="${entityId}" data-min="${min}" data-max="${max}" data-step="${step}">
              <svg viewBox="0 0 100 55" style="width:100%;height:100%;">
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="8" stroke-linecap="round"/>
                <path class="halfcircle-val-path" d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="var(--accent)" stroke-width="8" stroke-linecap="round" stroke-dasharray="125.6" stroke-dashoffset="${offset}"/>
                <circle class="halfcircle-handle" cx="${handleX}" cy="${handleY}" r="5.5" fill="#ffffff" stroke="var(--accent)" stroke-width="2" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3)); pointer-events:none;"/>
              </svg>
            </div>
          </div>
        `;
      }

      if (prefCtrl === 'wedge-slider') {
        const pct = max > min ? Math.max(0, Math.min(1, (numVal - min) / (max - min))) : 0;
        const cleanId = entityId.replace(/[^a-zA-Z0-9_]/g, '_');
        return `
          <div class="control-row" style="padding:10px 14px;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;margin-right:12px;">
              <div style="flex-shrink:0;">${icon}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:600;color:var(--text-primary);">${name}</div>
                <div style="font-size:11px;color:var(--text-secondary);">${numVal} ${unit}</div>
              </div>
            </div>
            <div class="wedge-container" data-wedge-entity="${entityId}" data-min="${min}" data-max="${max}" data-step="${step}">
              <svg class="wedge-svg" viewBox="0 0 200 60" preserveAspectRatio="none">
                <defs>
                  <clipPath id="wedge-clip-${cleanId}">
                    <polygon points="0,55 200,5 200,55" />
                  </clipPath>
                  <linearGradient id="wedge-grad-${cleanId}" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#38bdf8"/>
                    <stop offset="50%" stop-color="#f59e0b"/>
                    <stop offset="100%" stop-color="#ef4444"/>
                  </linearGradient>
                </defs>
                <polygon points="0,55 200,5 200,55" fill="rgba(255,255,255,0.12)" />
                <rect class="wedge-val-rect" x="0" y="0" width="${pct * 200}" height="60" fill="url(#wedge-grad-${cleanId})" clip-path="url(#wedge-clip-${cleanId})" />
              </svg>
            </div>
          </div>
        `;
      }

      if (prefCtrl === 'vertical-slider') {
        const pct = max > min ? Math.max(0, Math.min(1, (numVal - min) / (max - min))) : 0;
        return `
          <div class="control-row" style="padding:10px 14px;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;margin-right:12px;">
              <div style="flex-shrink:0;">${icon}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:600;color:var(--text-primary);">${name}</div>
                <div style="font-size:11px;color:var(--text-secondary);">${numVal} ${unit}</div>
              </div>
            </div>
            <div class="vslider-container" data-vslider-entity="${entityId}" data-min="${min}" data-max="${max}" data-step="${step}">
              <div class="vslider-fill" style="height:${pct * 100}%;"></div>
              <div class="vslider-handle" style="bottom:calc(${pct * 100}% - 4px);"></div>
            </div>
          </div>
        `;
      }

      if (prefCtrl === 'stepper-presets') {
        const span = max - min;
        const presets = [
          min + span * 0.2,
          min + span * 0.4,
          min + span * 0.6,
          min + span * 0.8
        ].map(v => Math.round(v / step) * step);
        return `
          <div class="control-row" style="padding:10px 14px;display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;width:100%;">
              <div style="display:flex;align-items:center;gap:8px;">
                <div style="flex-shrink:0;">${icon}</div>
                <div style="font-size:13px;font-weight:600;color:var(--text-primary);">${name}</div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-weight:700;font-size:13px;color:var(--accent);">${numVal} ${unit}</span>
                <button class="btn-step" data-helper="${entityId}" data-delta="-${step}">-</button>
                <button class="btn-step" data-helper="${entityId}" data-delta="${step}">+</button>
              </div>
            </div>
            <div class="presets-row">
              ${presets.map(p => `
                <button type="button" class="preset-pill ${Math.abs(p - numVal) < (step / 2) ? 'active' : ''}" data-preset-entity="${entityId}" data-preset-val="${p}">${p}${unit}</button>
              `).join('')}
            </div>
          </div>
        `;
      }

      if (prefCtrl === 'slider') {
        const cleanId = entityId.replace(/[^a-zA-Z0-9_]/g, '_');
        return `
          <div class="control-row" style="padding:10px 14px;min-height:50px;display:flex;flex-direction:column;gap:6px;">
            <div style="display:flex;justify-content:space-between;align-items:center;width:100%;">
              <div style="display:flex;align-items:center;gap:8px;">
                <div style="flex-shrink:0;">${icon}</div>
                <div style="font-size:13px;font-weight:600;color:var(--text-primary);">${name}</div>
                ${battWarningHtml}
              </div>
              <div class="vg-slider-val" id="vgVal_${cleanId}">${numVal}${unit ? ' ' + unit : ''}</div>
            </div>
            <div class="vg-slider-wrap">
              <input type="range" class="vg-range-slider" data-slider-entity="${entityId}" data-slider-val-target="vgVal_${cleanId}" data-slider-unit="${unit}" min="${min}" max="${max}" step="${step}" value="${numVal}">
            </div>
          </div>
        `;
      }

      return `
        <div class="control-row" style="padding:10px 14px;min-height:48px;">
          <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;margin-right:10px;">
            <div style="flex-shrink:0;">${icon}</div>
            <div style="font-size:13px;font-weight:600;color:var(--text-primary);word-break:break-word;" title="${name}">
              <span>${name}</span>
              ${battWarningHtml}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-weight:700;font-size:13px;color:var(--accent);">${numVal}${unit ? ' ' + unit : ''}</span>
            <button class="btn-step" data-helper="${entityId}" data-delta="-${step}" style="width:26px;height:26px;padding:0;">-</button>
            <button class="btn-step" data-helper="${entityId}" data-delta="${step}" style="width:26px;height:26px;padding:0;">+</button>
          </div>
        </div>
      `;
    }

    if (domain === 'input_select' || domain === 'select') {
      const options = stateObj.attributes?.options || [];
      if (prefCtrl === 'dropdown') {
        return `
          <div class="control-row" style="padding:10px 14px;min-height:48px;">
            <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;margin-right:10px;">
              <div style="flex-shrink:0;">${icon}</div>
              <div style="font-size:13px;font-weight:600;color:var(--text-primary);">${name}</div>
              ${battWarningHtml}
            </div>
            <select class="vg-glass-select" data-select-entity="${entityId}" style="background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);border-radius:8px;padding:6px 10px;font-size:12px;cursor:pointer;">
              ${options.map(opt => `<option value="${opt}" ${opt === val ? 'selected' : ''}>${opt}</option>`).join('')}
            </select>
          </div>
        `;
      }

      return `
        <div class="control-row" style="padding:10px 14px;min-height:48px;display:flex;flex-direction:column;gap:6px;">
          <div style="display:flex;align-items:center;gap:8px;width:100%;">
            <div style="flex-shrink:0;">${icon}</div>
            <div style="font-size:13px;font-weight:600;color:var(--text-primary);">${name}</div>
            ${battWarningHtml}
          </div>
          <div class="vg-seg-group">
            ${options.map(opt => `
              <button type="button" class="vg-seg-pill ${opt === val ? 'active' : ''}" data-seg-entity="${entityId}" data-seg-option="${opt}">${opt}</button>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (domain === 'input_datetime') {
      return `
        <div class="control-row" style="padding:10px 14px;min-height:48px;">
          <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;margin-right:10px;">
            <div style="flex-shrink:0;">${icon}</div>
            <div style="font-size:13px;font-weight:600;color:var(--text-primary);">${name}</div>
            ${battWarningHtml}
          </div>
          <input type="time" class="vg-time-input" data-time-entity="${entityId}" value="${val.slice(0, 5)}">
        </div>
      `;
    }

    if (domain === 'timer') {
      const remaining = stateObj.attributes?.remaining || stateObj.state;
      return `
        <div class="control-row" style="padding:10px 14px;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;margin-right:12px;">
            <div style="flex-shrink:0;">${this._icon('clock', { size: 16, cls: 'icon-calendar' })}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:600;color:var(--text-primary);">${name}</div>
              <div style="font-size:11px;color:var(--text-secondary);">${stateObj.state}</div>
            </div>
          </div>
          <div class="timer-container" data-timer-entity="${entityId}">
            <svg viewBox="0 0 100 100" style="width:100%;height:100%;transform:rotate(-90deg);">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="7"/>
              <circle class="timer-val-arc" cx="50" cy="50" r="42" fill="none" stroke="var(--accent)" stroke-width="7" stroke-dasharray="263.8" stroke-dashoffset="${stateObj.state === 'active' ? '60' : '0'}"/>
            </svg>
            <div class="timer-center">
              <span class="rotary-num" style="font-size:13px;">${remaining}</span>
              <div class="timer-btns">
                <button class="timer-micro-btn" data-timer-action="start" data-timer-entity="${entityId}">Start</button>
                <button class="timer-micro-btn" data-timer-action="pause" data-timer-entity="${entityId}">Pause</button>
                <button class="timer-micro-btn" data-timer-action="cancel" data-timer-entity="${entityId}">Reset</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (domain === 'button' || domain === 'input_button') {
      return `
        <div class="control-row" style="padding:10px 14px;min-height:48px;">
          <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;margin-right:10px;">
            <div style="flex-shrink:0;">${icon}</div>
            <div style="font-size:13px;font-weight:600;color:var(--text-primary);">${name}</div>
            ${battWarningHtml}
          </div>
          <button class="btn btn-sm btn-primary" data-dyn-action="${entityId}" data-dyn-domain="${domain}" data-dyn-service="press">Ausführen</button>
        </div>
      `;
    }

    if (domain === 'script') {
      return `
        <div class="control-row" style="padding:10px 14px;min-height:48px;">
          <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;margin-right:10px;">
            <div style="flex-shrink:0;">${icon}</div>
            <div style="font-size:13px;font-weight:600;color:var(--text-primary);">${name}</div>
            ${battWarningHtml}
          </div>
          <button class="btn btn-sm btn-primary" data-dyn-action="${entityId}" data-dyn-domain="${domain}" data-dyn-service="turn_on">Starten</button>
        </div>
      `;
    }

    return `
      <div class="control-row" style="padding:10px 14px;min-height:48px;">
        <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
          <div style="flex-shrink:0;">${icon}</div>
          <div style="font-size:13px;font-weight:600;color:var(--text-primary);display:flex;align-items:center;flex-wrap:wrap;" title="${name}">
            <span>${name}</span>
            ${battWarningHtml}
          </div>
        </div>
        <div style="font-size:12px;font-weight:600;color:var(--text-secondary);">${val}</div>
      </div>
    `;
  },

  _bindInteractiveRows(rootEl) {
    if (!rootEl) return;
    rootEl.querySelectorAll('.vg-switch[data-vg-switch]').forEach(sw => {
      sw.onclick = (e) => {
        e.stopPropagation();
        const entityId = sw.getAttribute('data-vg-switch');
        const domain = sw.getAttribute('data-vg-domain') || entityId.split('.')[0];
        const wasActive = sw.classList.contains('active');
        sw.classList.toggle('active', !wasActive);
        sw.setAttribute('aria-checked', !wasActive ? 'true' : 'false');
        this._callService(domain, 'toggle', { entity_id: entityId });
      };
    });
    rootEl.querySelectorAll('.vg-push-btn[data-push-entity]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const eId = btn.getAttribute('data-push-entity');
        const domain = btn.getAttribute('data-push-domain') || eId.split('.')[0];
        btn.classList.toggle('active');
        this._callService(domain, 'toggle', { entity_id: eId });
      };
    });
    rootEl.querySelectorAll('.vg-icon-btn[data-icon-entity]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const eId = btn.getAttribute('data-icon-entity');
        const domain = btn.getAttribute('data-icon-domain') || eId.split('.')[0];
        btn.classList.toggle('active');
        this._callService(domain, 'toggle', { entity_id: eId });
      };
    });
    rootEl.querySelectorAll('.vg-range-slider[data-slider-entity]').forEach(sl => {
      sl.oninput = (e) => {
        e.stopPropagation();
        const targetId = sl.getAttribute('data-slider-val-target');
        const unit = sl.getAttribute('data-slider-unit') || '';
        const valEl = rootEl.querySelector('#' + targetId);
        if (valEl) valEl.textContent = `${sl.value}${unit ? ' ' + unit : ''}`;
      };
      sl.onchange = (e) => {
        e.stopPropagation();
        const eId = sl.getAttribute('data-slider-entity');
        const domain = eId.split('.')[0];
        this._callService(domain, 'set_value', { entity_id: eId, value: parseFloat(sl.value) });
      };
    });
    rootEl.querySelectorAll('.vg-seg-pill[data-seg-entity]').forEach(pill => {
      pill.onclick = (e) => {
        e.stopPropagation();
        const eId = pill.getAttribute('data-seg-entity');
        const opt = pill.getAttribute('data-seg-option');
        pill.parentElement.querySelectorAll('.vg-seg-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this._callService('input_select', 'select_option', { entity_id: eId, option: opt });
      };
    });
    rootEl.querySelectorAll('.vg-glass-select[data-select-entity]').forEach(sel => {
      sel.onchange = (e) => {
        e.stopPropagation();
        const eId = sel.getAttribute('data-select-entity');
        this._callService('input_select', 'select_option', { entity_id: eId, option: sel.value });
      };
    });
    rootEl.querySelectorAll('.vg-time-input[data-time-entity]').forEach(ti => {
      ti.onchange = (e) => {
        e.stopPropagation();
        const eId = ti.getAttribute('data-time-entity');
        this._callService('input_datetime', 'set_datetime', { entity_id: eId, time: ti.value + ':00' });
      };
    });
    rootEl.querySelectorAll('.btn-step[data-helper]').forEach(b => {
      b.onclick = (e) => {
        e.stopPropagation();
        const hId = b.getAttribute('data-helper');
        const delta = parseFloat(b.getAttribute('data-delta'));
        const s = this._hass.states[hId];
        if (s && s.state != null) {
          const curVal = parseFloat(s.state) || 0;
          const newVal = Math.round((curVal + delta) * 2) / 2;
          this._callService('input_number', 'set_value', { entity_id: hId, value: newVal });
        }
      };
    });
    rootEl.querySelectorAll('.btn-step[data-cust-climate]').forEach(b => {
      b.onclick = (e) => {
        e.stopPropagation();
        const cId = b.getAttribute('data-cust-climate');
        const delta = parseFloat(b.getAttribute('data-delta'));
        const s = this._hass.states[cId];
        if (s && s.attributes) {
          const curTarget = s.attributes.temperature || 21.0;
          const newTarget = Math.round((curTarget + delta) * 2) / 2;
          this._callService('climate', 'set_temperature', { entity_id: cId, temperature: newTarget });
        }
      };
    });
    rootEl.querySelectorAll('[data-dyn-action]').forEach(b => {
      b.onclick = (e) => {
        e.stopPropagation();
        const entityId = b.getAttribute('data-dyn-action');
        const domain = b.getAttribute('data-dyn-domain');
        const service = b.getAttribute('data-dyn-service') || 'turn_on';
        this._callService(domain, service, { entity_id: entityId });
      };
    });

    // Tactile Controls from ha-advanced-helper-controls-card
    rootEl.querySelectorAll('.rocker-container[data-rocker-entity]').forEach(r => {
      r.onclick = (e) => {
        e.stopPropagation();
        const entityId = r.getAttribute('data-rocker-entity');
        const domain = entityId.split('.')[0];
        const wasOn = r.classList.contains('is-on');
        r.classList.toggle('is-on', !wasOn);
        this._callService(domain, 'toggle', { entity_id: entityId });
      };
    });

    rootEl.querySelectorAll('.hold-btn-container[data-hold-entity]').forEach(btn => {
      const entityId = btn.getAttribute('data-hold-entity');
      const domain = entityId.split('.')[0];
      const ring = btn.querySelector('.hold-ring');
      let holdTimer = null;
      const cancelHold = () => {
        if (holdTimer) { clearInterval(holdTimer); holdTimer = null; }
        if (ring) ring.style.strokeDashoffset = '276.4';
      };
      btn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (ring) ring.style.strokeDashoffset = '276.4';
        const totalSteps = 45;
        let step = 0;
        holdTimer = setInterval(() => {
          step++;
          const progress = step / totalSteps;
          if (ring) ring.style.strokeDashoffset = `${276.4 * (1 - Math.min(1, progress))}`;
          if (step >= totalSteps) {
            cancelHold();
            this._callService(domain, 'toggle', { entity_id: entityId });
          }
        }, 30);
      });
      btn.addEventListener('pointerup', cancelHold);
      btn.addEventListener('pointerleave', cancelHold);
      btn.addEventListener('pointercancel', cancelHold);
    });

    rootEl.querySelectorAll('.preset-pill[data-preset-entity]').forEach(pill => {
      pill.onclick = (e) => {
        e.stopPropagation();
        const eId = pill.getAttribute('data-preset-entity');
        const val = parseFloat(pill.getAttribute('data-preset-val') || pill.getAttribute('data-val'));
        pill.parentElement.querySelectorAll('.preset-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this._callService('input_number', 'set_value', { entity_id: eId, value: val });
      };
    });

    rootEl.querySelectorAll('.timer-micro-btn[data-timer-action]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const eId = btn.getAttribute('data-timer-entity');
        const act = btn.getAttribute('data-timer-action');
        this._callService('timer', act, { entity_id: eId });
      };
    });

    const startTactileDrag = (e, type, el, min, max, step, eId) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = el.getBoundingClientRect();
      const onMove = (moveEv) => {
        let pct = 0;
        if (type === 'rotary') {
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          let angle = Math.atan2(moveEv.clientY - cy, moveEv.clientX - cx) * (180 / Math.PI) + 90;
          if (angle < 0) angle += 360;
          pct = angle / 360;
        } else if (type === 'vslider') {
          const relY = Math.max(0, Math.min(rect.height, rect.bottom - moveEv.clientY));
          pct = relY / rect.height;
        } else if (type === 'wedge') {
          const relX = Math.max(0, Math.min(rect.width, moveEv.clientX - rect.left));
          pct = relX / rect.width;
        } else if (type === 'openarc') {
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          let angle = Math.atan2(moveEv.clientY - cy, moveEv.clientX - cx) * (180 / Math.PI);
          if (angle < 0) angle += 360;
          if (angle >= 45 && angle <= 135) return;
          let normAngle = angle - 135;
          if (normAngle < 0) normAngle += 360;
          pct = Math.max(0, Math.min(1, normAngle / 270));
        } else if (type === 'halfcircle') {
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height;
          let angle = Math.atan2(cy - moveEv.clientY, cx - moveEv.clientX) * (180 / Math.PI);
          if (angle < 0 || angle > 180) return;
          pct = Math.max(0, Math.min(1, 1 - angle / 180));
        }
        let rawVal = min + pct * (max - min);
        rawVal = Math.round(rawVal / step) * step;
        const domain = eId.split('.')[0];
        this._callService(domain, 'set_value', { entity_id: eId, value: rawVal });
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    };

    ['rotary', 'vslider', 'wedge', 'openarc', 'halfcircle'].forEach(type => {
      rootEl.querySelectorAll(`.${type}-container[data-${type}-entity]`).forEach(el => {
        el.onpointerdown = (e) => {
          const eId = el.getAttribute(`data-${type}-entity`);
          const min = parseFloat(el.getAttribute('data-min')) || 0;
          const max = parseFloat(el.getAttribute('data-max')) || 100;
          const step = parseFloat(el.getAttribute('data-step')) || 1;
          startTactileDrag(e, type, el, min, max, step, eId);
        };
      });
    });
  }
};

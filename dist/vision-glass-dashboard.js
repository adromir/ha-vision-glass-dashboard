/**
 * Vision Glass Dashboard for Home Assistant
 * An ultra-modern Apple VisionOS & macOS inspired spatial glassmorphism dashboard.
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
  }

  static getStubConfig() {
    return {
      title: 'Aether Residence',
      auto_day_night: true,
      weather_entity: 'weather.forecast_home',
      rooms: [
        { name: 'Living Room', icon: 'weekend', temp_entity: '', light_entity: '', blinds_entity: '', media_entity: '' },
        { name: 'Office', icon: 'desk', temp_entity: '', light_entity: '', blinds_entity: '' },
        { name: 'WC', icon: 'water_drop', temp_entity: '', light_entity: '' },
        { name: 'Kitchen', icon: 'countertops', temp_entity: '', light_entity: '' },
        { name: 'Kids Room', icon: 'crib', temp_entity: '', light_entity: '', blinds_entity: '' },
        { name: 'Laundry', icon: 'local_laundry_service', temp_entity: '', light_entity: '' },
        { name: 'Hallway', icon: 'sensor_door', temp_entity: '', light_entity: '' },
        { name: 'Bedroom', icon: 'bed', temp_entity: '', light_entity: '', blinds_entity: '' },
        { name: 'Bathroom', icon: 'bathtub', temp_entity: '', light_entity: '' }
      ]
    };
  }

  setConfig(config) {
    this._config = {
      title: config.title || 'Aether Residence',
      auto_day_night: config.auto_day_night !== false,
      weather_entity: config.weather_entity || 'weather.forecast_home',
      rooms: config.rooms || VisionGlassDashboard.getStubConfig().rooms
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._updateStates();
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
        clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
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
    return hour >= 7 && hour < 19;
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
      themeBtn.title = isDay ? 'Day Mode Active (Click for Night)' : 'Night Mode Active (Click for Day)';
    }
  }

  _updateStates() {
    if (!this._hass) return;
    this._applyThemeClass();

    // Update Weather if entity exists
    if (this._config.weather_entity && this._hass.states[this._config.weather_entity]) {
      const wState = this._hass.states[this._config.weather_entity];
      const temp = wState.attributes.temperature;
      const weatherTempEl = this.shadowRoot.getElementById('weatherTemp');
      const weatherStateEl = this.shadowRoot.getElementById('weatherCondition');
      if (weatherTempEl && temp !== undefined) weatherTempEl.textContent = `${temp}°C`;
      if (weatherStateEl) weatherStateEl.textContent = wState.state.replace('_', ' ').toUpperCase();
    }
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
    if (!body || !title) return;

    if (type === 'lighting') {
      title.textContent = '💡 Lighting Control & Scenes';
      body.innerHTML = `
        <div class="modal-grid">
          <div class="modal-col">
            <h4 class="section-title">Automations & Presets</h4>
            <div class="preset-pill-list">
              <button class="glass-pill active" onclick="alert('Daylight Scene Activated')">Circadian Daylight (On)</button>
              <button class="glass-pill" onclick="alert('Movie Cinema Scene Activated')">Cinema Ambiance (Off)</button>
              <button class="glass-pill" onclick="alert('Evening Relaxation Activated')">Evening Warm Glow (Off)</button>
              <button class="glass-pill" onclick="alert('Nightlight Activated')">Nightlight Path (Auto)</button>
            </div>
          </div>
          <div class="modal-col">
            <div class="flex-between">
              <h4 class="section-title">Room Dimmers</h4>
              <div>
                <button class="btn-micro" id="modalAllOn">All On</button>
                <button class="btn-micro" id="modalAllOff">All Off</button>
              </div>
            </div>
            <div class="slider-row">
              <span>Living Room Ceiling</span>
              <input type="range" min="0" max="100" value="85" class="glass-slider">
              <span>85%</span>
            </div>
            <div class="slider-row">
              <span>Kitchen Counter LED</span>
              <input type="range" min="0" max="100" value="70" class="glass-slider">
              <span>70%</span>
            </div>
            <div class="slider-row">
              <span>Office Desk Light</span>
              <input type="range" min="0" max="100" value="100" class="glass-slider">
              <span>100%</span>
            </div>
            <div class="slider-row">
              <span>Bedroom Sconces</span>
              <input type="range" min="0" max="100" value="30" class="glass-slider">
              <span>30%</span>
            </div>
          </div>
        </div>
      `;
    } else if (type === 'climate') {
      title.textContent = '🌡️ Room Heating & Climate Curves';
      body.innerHTML = `
        <div class="modal-grid">
          <div class="modal-col">
            <h4 class="section-title">Heating Status</h4>
            <div class="chip-group">
              <span class="status-chip active">🔥 Comfort</span>
              <span class="status-chip">🏠 Home</span>
              <span class="status-chip">🌙 Sleep</span>
            </div>
            <div class="metric-card">
              <div class="metric-label">Supply Water Temperature</div>
              <div class="metric-val">39.5 °C</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Domestic Hot Water (DHW)</div>
              <div class="metric-val">47.4 °C</div>
            </div>
          </div>
          <div class="modal-col">
            <h4 class="section-title">Living Room Curve (23.1°C Target: 24.0°C)</h4>
            <svg class="curve-chart" viewBox="0 0 300 100">
              <defs>
                <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.6"/>
                  <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.0"/>
                </linearGradient>
              </defs>
              <path d="M 0,70 Q 50,40 100,55 T 200,30 T 300,45 L 300,100 L 0,100 Z" fill="url(#curveGrad)"/>
              <path d="M 0,70 Q 50,40 100,55 T 200,30 T 300,45" fill="none" stroke="#f59e0b" stroke-width="3"/>
            </svg>
            <div class="stepper-box">
              <button class="step-btn">-</button>
              <span class="step-val">24.0 °C</span>
              <button class="step-btn">+</button>
            </div>
          </div>
        </div>
      `;
    } else if (type === 'blinds') {
      title.textContent = '🪟 Intelligent Blinds & Shading';
      body.innerHTML = `
        <div class="modal-grid">
          <div class="modal-col">
            <h4 class="section-title">Solar Tracking & Azimuth</h4>
            <div class="compass-dial">
              <div class="compass-pointer"></div>
              <div class="compass-label">Sun 32° • 150° Azimuth</div>
            </div>
            <div class="metric-label mt-2">Sun status: Below Shading Threshold</div>
          </div>
          <div class="modal-col">
            <div class="flex-between">
              <h4 class="section-title">Blinds Position</h4>
              <div>
                <button class="btn-micro">Raise All</button>
                <button class="btn-micro">Close All</button>
              </div>
            </div>
            <div class="slider-row">
              <span>Office Window</span>
              <input type="range" min="0" max="100" value="100" class="glass-slider">
              <span>100% Up</span>
            </div>
            <div class="slider-row">
              <span>Kids Room Blinds</span>
              <input type="range" min="0" max="100" value="40" class="glass-slider">
              <span>40% Up</span>
            </div>
            <div class="slider-row">
              <span>Bedroom Blackout</span>
              <input type="range" min="0" max="100" value="0" class="glass-slider">
              <span>Closed</span>
            </div>
          </div>
        </div>
      `;
    } else if (type === 'weather') {
      title.textContent = '🌦️ Weather Forecast & Radar';
      body.innerHTML = `
        <div class="modal-grid">
          <div class="modal-col">
            <h4 class="section-title">Precipitation & Cloud Radar</h4>
            <div class="radar-box">
              <div class="radar-text">Interactive Live Radar Simulation</div>
              <div class="radar-ping"></div>
            </div>
          </div>
          <div class="modal-col">
            <h4 class="section-title">Air Quality & Analytics</h4>
            <div class="aqi-grid">
              <div class="aqi-pill"><span class="aqi-num">16</span><span class="aqi-tag">PM2.5 Good</span></div>
              <div class="aqi-pill"><span class="aqi-num">24</span><span class="aqi-tag">PM10 Good</span></div>
              <div class="aqi-pill"><span class="aqi-num">4.2</span><span class="aqi-tag">NO2 Clean</span></div>
              <div class="aqi-pill"><span class="aqi-num">11.5</span><span class="aqi-tag">O3 Optimal</span></div>
            </div>
            <h4 class="section-title mt-4">7-Day Atmospheric Outlook</h4>
            <div class="forecast-row"><span>Mon</span> <span>⛅ 9° / 2°</span></div>
            <div class="forecast-row"><span>Tue</span> <span>☁️ 8° / 2°</span></div>
            <div class="forecast-row"><span>Wed</span> <span>☀️ 11° / 3°</span></div>
            <div class="forecast-row"><span>Thu</span> <span>🌧️ 7° / 1°</span></div>
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
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif;
          box-sizing: border-box;
          --blur: 24px;
        }

        /* --- THEME STYLES --- */
        .dashboard-root {
          position: relative;
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
          padding: 24px 32px 100px 32px;
          box-sizing: border-box;
          transition: background 0.6s cubic-bezier(0.16, 1, 0.3, 1), color 0.4s ease;
        }

        /* Day Mode (Light Glassmorphism) */
        .dashboard-root.theme-light {
          background: radial-gradient(circle at 50% 15%, #dbe7f6 0%, #bcd2eb 45%, #9ebbdc 100%);
          color: #1c2438;
          --card-bg: rgba(255, 255, 255, 0.55);
          --card-border: rgba(255, 255, 255, 0.75);
          --card-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.95);
          --dock-bg: rgba(255, 255, 255, 0.65);
          --dock-border: rgba(255, 255, 255, 0.85);
          --text-primary: #1c2438;
          --text-secondary: #52637a;
          --accent-blue: #0284c7;
          --accent-amber: #ea580c;
        }

        /* Night Mode (Dark Glassmorphism) */
        .dashboard-root.theme-dark {
          background: radial-gradient(circle at 50% 15%, #1d2538 0%, #121826 50%, #0a0e17 100%);
          color: #f8fafc;
          --card-bg: rgba(24, 32, 48, 0.70);
          --card-border: rgba(255, 255, 255, 0.12);
          --card-shadow: 0 10px 35px 0 rgba(0, 0, 0, 0.45), inset 0 1px 1px 0 rgba(255, 255, 255, 0.12);
          --dock-bg: rgba(18, 24, 38, 0.75);
          --dock-border: rgba(255, 255, 255, 0.15);
          --text-primary: #f8fafc;
          --text-secondary: #94a3b8;
          --accent-blue: #38bdf8;
          --accent-amber: #fbbf24;
        }

        /* Ambient Dynamic Light Blobs */
        .ambient-blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          z-index: 0;
          opacity: 0.4;
          transition: all 1s ease;
        }
        .blob-1 { top: 5%; left: 15%; width: 500px; height: 500px; background: rgba(56, 189, 248, 0.25); }
        .blob-2 { bottom: 10%; right: 10%; width: 450px; height: 450px; background: rgba(245, 158, 11, 0.2); }

        /* --- TOP HEADER BAR --- */
        .top-bar {
          position: relative;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .date-title {
          font-size: 20px;
          font-weight: 600;
          letter-spacing: -0.01em;
        }
        .name-day {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 2px;
        }
        .chips-container {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 9999px;
          background: var(--card-bg);
          backdrop-filter: blur(var(--blur));
          -webkit-backdrop-filter: blur(var(--blur));
          border: 1px solid var(--card-border);
          box-shadow: var(--card-shadow);
          font-size: 12px;
          font-weight: 500;
        }
        .chip-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }
        .dot-amber { background: #f59e0b; box-shadow: 0 0 8px #f59e0b; }
        .dot-green { background: #10b981; box-shadow: 0 0 8px #10b981; }
        .dot-blue  { background: #38bdf8; box-shadow: 0 0 8px #38bdf8; }

        .theme-toggle {
          cursor: pointer;
          font-size: 16px;
          padding: 8px 12px;
          border-radius: 9999px;
          border: 1px solid var(--card-border);
          background: var(--card-bg);
          backdrop-filter: blur(var(--blur));
          transition: transform 0.2s ease;
        }
        .theme-toggle:active { transform: scale(0.92); }

        /* --- DASHBOARD MAIN LAYOUT --- */
        .dashboard-body {
          position: relative;
          z-index: 10;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 24px;
        }
        @media (max-width: 1024px) {
          .dashboard-body { grid-template-columns: 1fr; }
        }

        /* --- LEFT SIDEBAR --- */
        .sidebar-card {
          background: var(--card-bg);
          backdrop-filter: blur(var(--blur));
          -webkit-backdrop-filter: blur(var(--blur));
          border: 1px solid var(--card-border);
          box-shadow: var(--card-shadow);
          border-radius: 28px;
          padding: 24px;
          display: flex;
          flex-col;
          flex-direction: column;
          gap: 20px;
        }
        .clock-display {
          font-size: 48px;
          font-weight: 300;
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .weather-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
        }
        .weather-temp {
          font-size: 36px;
          font-weight: 400;
        }
        .hourly-forecast {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          text-align: center;
        }
        .forecast-pill {
          display: flex;
          flex-direction: column;
          gap: 4px;
          color: var(--text-secondary);
        }
        .agenda-block {
          font-size: 13px;
        }
        .agenda-title {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }
        .agenda-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        /* --- 3x3 BENTO ROOM GRID --- */
        .rooms-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 1280px) {
          .rooms-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .rooms-grid { grid-template-columns: 1fr; }
        }

        .room-card {
          position: relative;
          background: var(--card-bg);
          backdrop-filter: blur(var(--blur));
          -webkit-backdrop-filter: blur(var(--blur));
          border: 1px solid var(--card-border);
          box-shadow: var(--card-shadow);
          border-radius: 24px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 160px;
          overflow: hidden;
          transition: transform 0.25s ease, border-color 0.25s ease;
        }
        .room-card:hover {
          transform: translateY(-3px);
          border-color: rgba(255, 255, 255, 0.4);
        }
        .room-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 2;
        }
        .room-name {
          font-size: 16px;
          font-weight: 600;
          letter-spacing: -0.01em;
        }
        .room-temp-badge {
          font-size: 12px;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
        }
        .room-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 2;
          margin-top: 24px;
        }
        .action-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(12px);
          transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
          font-size: 16px;
        }
        .action-circle:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(1.08);
        }
        .action-circle:active { transform: scale(0.92); }
        .action-circle.active {
          background: var(--accent-blue);
          color: #ffffff;
          box-shadow: 0 0 16px var(--accent-blue);
          border-color: #ffffff;
        }
        .action-circle.active-amber {
          background: var(--accent-amber);
          color: #ffffff;
          box-shadow: 0 0 16px var(--accent-amber);
          border-color: #ffffff;
        }

        /* --- FLOATING VISIONOS DOCK BAR --- */
        .dock-bar {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 40;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 18px;
          border-radius: 9999px;
          background: var(--dock-bg);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          border: 1px solid var(--dock-border);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.2);
        }
        .dock-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          color: var(--text-primary);
          font-size: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .dock-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-4px) scale(1.1);
        }
        .dock-btn:active { transform: scale(0.92); }

        /* --- INTERACTIVE MODAL OVERLAYS --- */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          box-sizing: border-box;
        }
        .modal-overlay.hidden { display: none; }
        .modal-card {
          width: 100%;
          max-width: 780px;
          border-radius: 32px;
          background: var(--card-bg);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid var(--card-border);
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
          padding: 28px;
          color: var(--text-primary);
          box-sizing: border-box;
          animation: popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.94); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
        }
        .modal-title {
          font-size: 20px;
          font-weight: 600;
        }
        .close-btn {
          cursor: pointer;
          background: rgba(255, 255, 255, 0.15);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-primary);
          font-size: 16px;
        }
        .modal-body {
          padding-top: 20px;
        }
        .modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media (max-width: 640px) {
          .modal-grid { grid-template-columns: 1fr; }
        }
        .section-title {
          font-size: 13px;
          text-transform: uppercase;
          color: var(--text-secondary);
          letter-spacing: 0.05em;
          margin-bottom: 12px;
        }
        .glass-pill {
          display: block;
          width: 100%;
          text-align: left;
          padding: 10px 14px;
          margin-bottom: 8px;
          border-radius: 12px;
          border: 1px solid var(--card-border);
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
          cursor: pointer;
        }
        .glass-pill.active {
          background: var(--accent-blue);
          color: #ffffff;
        }
        .slider-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
          font-size: 13px;
        }
        .glass-slider {
          flex: 1;
          accent-color: var(--accent-blue);
        }
        .curve-chart {
          width: 100%;
          height: 120px;
          background: rgba(0, 0, 0, 0.15);
          border-radius: 16px;
        }
        .stepper-box {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-top: 14px;
        }
        .step-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1px solid var(--card-border);
          background: rgba(255, 255, 255, 0.15);
          color: var(--text-primary);
          font-size: 20px;
          cursor: pointer;
        }
        .step-val {
          font-size: 20px;
          font-weight: 600;
        }
        .compass-dial {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          border: 2px dashed var(--card-border);
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .compass-pointer {
          width: 4px;
          height: 50px;
          background: #f59e0b;
          border-radius: 2px;
          transform: rotate(45deg);
        }
        .flex-between {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .btn-micro {
          padding: 4px 10px;
          border-radius: 8px;
          border: 1px solid var(--card-border);
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
          cursor: pointer;
          font-size: 11px;
        }
      </style>

      <div class="dashboard-root theme-dark">
        <!-- Ambient Atmospheric Blobs -->
        <div class="ambient-blob blob-1"></div>
        <div class="ambient-blob blob-2"></div>

        <!-- Top Header Navigation & Status Chips -->
        <div class="top-bar">
          <div>
            <div class="date-title" id="dateTitle">Monday, October 19</div>
            <div class="name-day">Name day: Michael • Climate Control Active</div>
          </div>

          <div class="chips-container">
            <div class="chip"><span class="chip-dot dot-amber"></span> DHW 47.4 °C</div>
            <div class="chip"><span class="chip-dot dot-green"></span> 4.2 kW Solar</div>
            <div class="chip"><span class="chip-dot dot-blue"></span> 8.4 kWh Batt</div>
            <div class="chip">⏱️ 42 min Wash</div>
            <div class="chip">📺 Plex: 1</div>
            <button class="theme-toggle" id="themeToggleBtn" title="Toggle Day / Night Mode">☀️</button>
          </div>
        </div>

        <!-- Dashboard Body Layout -->
        <div class="dashboard-body">
          <!-- Left Glanceable Sidebar -->
          <div class="sidebar-card">
            <div class="clock-display" id="liveClock">10:38:00</div>

            <div class="weather-banner" id="sidebarWeather">
              <div>
                <div class="weather-temp" id="weatherTemp">7°C</div>
                <div style="color:var(--text-secondary);font-size:13px;" id="weatherCondition">CLOUDY</div>
              </div>
              <div style="font-size:32px;">⛅</div>
            </div>

            <div class="hourly-forecast">
              <div class="forecast-pill"><span>11:00</span><span>☁️</span><span>7°</span></div>
              <div class="forecast-pill"><span>12:00</span><span>⛅</span><span>8°</span></div>
              <div class="forecast-pill"><span>13:00</span><span>☁️</span><span>9°</span></div>
              <div class="forecast-pill"><span>14:00</span><span>🌧️</span><span>9°</span></div>
              <div class="forecast-pill"><span>15:00</span><span>⛅</span><span>9°</span></div>
            </div>

            <div class="agenda-block">
              <div class="agenda-title">Today's Agenda</div>
              <div class="agenda-item"><span class="chip-dot dot-blue"></span> 15:30 Dentist - Emma</div>
              <div class="agenda-item"><span class="chip-dot dot-green"></span> 17:00 Soccer Training</div>
            </div>
          </div>

          <!-- 3x3 Bento Room Grid -->
          <div class="rooms-grid">
            <!-- Living Room -->
            <div class="room-card">
              <div class="room-header">
                <div>
                  <div class="room-name">Living Room &rsaquo;</div>
                  <div style="font-size:12px;color:var(--text-secondary);">4 Devices Active</div>
                </div>
                <div class="room-temp-badge">21.5°C</div>
              </div>
              <div class="room-actions">
                <div class="action-circle active-amber" title="Light" onclick="this.classList.toggle('active-amber')">💡</div>
                <div class="action-circle active" title="TV" onclick="this.classList.toggle('active')">📺</div>
                <div class="action-circle" title="Blinds" onclick="this.classList.toggle('active')">🪟</div>
                <div class="action-circle" title="Gaming" onclick="this.classList.toggle('active')">🎮</div>
              </div>
            </div>

            <!-- Office -->
            <div class="room-card">
              <div class="room-header">
                <div>
                  <div class="room-name">Office &rsaquo;</div>
                  <div style="font-size:12px;color:var(--text-secondary);">Desk & Monitors On</div>
                </div>
                <div class="room-temp-badge">22.0°C</div>
              </div>
              <div class="room-actions">
                <div class="action-circle active-amber" title="Desk Lamp" onclick="this.classList.toggle('active-amber')">💡</div>
                <div class="action-circle active" title="Monitors" onclick="this.classList.toggle('active')">🖥️</div>
                <div class="action-circle" title="Audio" onclick="this.classList.toggle('active')">🎧</div>
              </div>
            </div>

            <!-- WC -->
            <div class="room-card">
              <div class="room-header">
                <div>
                  <div class="room-name">WC &rsaquo;</div>
                  <div style="font-size:12px;color:var(--text-secondary);">Motion Ready</div>
                </div>
                <div class="room-temp-badge">20.0°C</div>
              </div>
              <div class="room-actions">
                <div class="action-circle" title="Ceiling Light" onclick="this.classList.toggle('active-amber')">💡</div>
                <div class="action-circle" title="Exhaust Fan" onclick="this.classList.toggle('active')">💨</div>
              </div>
            </div>

            <!-- Kitchen -->
            <div class="room-card">
              <div class="room-header">
                <div>
                  <div class="room-name">Kitchen &rsaquo;</div>
                  <div style="font-size:12px;color:var(--text-secondary);">Under-cabinet LED On</div>
                </div>
                <div class="room-temp-badge">21.0°C</div>
              </div>
              <div class="room-actions">
                <div class="action-circle active-amber" title="Pendant" onclick="this.classList.toggle('active-amber')">💡</div>
                <div class="action-circle active-amber" title="Counter LED" onclick="this.classList.toggle('active-amber')">✨</div>
                <div class="action-circle" title="Espresso Machine" onclick="this.classList.toggle('active')">☕</div>
              </div>
            </div>

            <!-- Kids Room -->
            <div class="room-card">
              <div class="room-header">
                <div>
                  <div class="room-name">Kids' Room &rsaquo;</div>
                  <div style="font-size:12px;color:var(--text-secondary);">Star Projector On</div>
                </div>
                <div class="room-temp-badge">21.5°C</div>
              </div>
              <div class="room-actions">
                <div class="action-circle active" title="Star Projector" onclick="this.classList.toggle('active')">⭐</div>
                <div class="action-circle" title="Ceiling" onclick="this.classList.toggle('active-amber')">💡</div>
                <div class="action-circle" title="Blinds" onclick="this.classList.toggle('active')">🪟</div>
              </div>
            </div>

            <!-- Laundry -->
            <div class="room-card">
              <div class="room-header">
                <div>
                  <div class="room-name">Laundry &rsaquo;</div>
                  <div style="font-size:12px;color:var(--text-secondary);">Washer Active • 42m</div>
                </div>
                <div class="room-temp-badge">19.5°C</div>
              </div>
              <div class="room-actions">
                <div class="action-circle active" title="Washer" onclick="this.classList.toggle('active')">🧺</div>
                <div class="action-circle" title="Light" onclick="this.classList.toggle('active-amber')">💡</div>
              </div>
            </div>

            <!-- Hallway -->
            <div class="room-card">
              <div class="room-header">
                <div>
                  <div class="room-name">Hallway &rsaquo;</div>
                  <div style="font-size:12px;color:var(--text-secondary);">Welcome Light Auto</div>
                </div>
                <div class="room-temp-badge">20.5°C</div>
              </div>
              <div class="room-actions">
                <div class="action-circle" title="Spotlights" onclick="this.classList.toggle('active-amber')">💡</div>
                <div class="action-circle active" title="Door Lock" onclick="this.classList.toggle('active')">🔒</div>
              </div>
            </div>

            <!-- Bedroom -->
            <div class="room-card">
              <div class="room-header">
                <div>
                  <div class="room-name">Bedroom &rsaquo;</div>
                  <div style="font-size:12px;color:var(--text-secondary);">Climate Sleep 19°</div>
                </div>
                <div class="room-temp-badge">20.0°C</div>
              </div>
              <div class="room-actions">
                <div class="action-circle" title="Main Light" onclick="this.classList.toggle('active-amber')">💡</div>
                <div class="action-circle active-amber" title="Bedside Sconce" onclick="this.classList.toggle('active-amber')">🌙</div>
                <div class="action-circle" title="Blinds" onclick="this.classList.toggle('active')">🪟</div>
              </div>
            </div>

            <!-- Bathroom -->
            <div class="room-card">
              <div class="room-header">
                <div>
                  <div class="room-name">Bathroom &rsaquo;</div>
                  <div style="font-size:12px;color:var(--text-secondary);">Towel Heater On</div>
                </div>
                <div class="room-temp-badge">23.0°C</div>
              </div>
              <div class="room-actions">
                <div class="action-circle active-amber" title="Mirror Light" onclick="this.classList.toggle('active-amber')">💡</div>
                <div class="action-circle active" title="Towel Heater" onclick="this.classList.toggle('active')">♨️</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Floating Apple VisionOS Style Dock Bar -->
        <div class="dock-bar">
          <button class="dock-btn" title="Lighting Control" id="dockLighting">💡</button>
          <button class="dock-btn" title="Heating & Climate" id="dockClimate">🌡️</button>
          <button class="dock-btn" title="Blinds & Shading" id="dockBlinds">🪟</button>
          <button class="dock-btn" title="Weather & Radar" id="dockWeather">🌦️</button>
          <button class="dock-btn" title="Audio & Music" onclick="alert('Music Scene Overlay')">🎵</button>
          <button class="dock-btn" title="Cameras & Security" onclick="alert('Cameras Security Grid')">📹</button>
        </div>

        <!-- Interactive Popup Modal Container -->
        <div class="modal-overlay hidden" id="modalContainer">
          <div class="modal-card">
            <div class="modal-header">
              <div class="modal-title" id="modalTitle">Modal Window</div>
              <button class="close-btn" id="modalCloseBtn">&times;</button>
            </div>
            <div class="modal-body" id="modalBody">
              <!-- Dynamically populated via JS -->
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind event listeners
    this.shadowRoot.getElementById('themeToggleBtn').addEventListener('click', () => this._toggleDayNight());
    this.shadowRoot.getElementById('dockLighting').addEventListener('click', () => this._openModal('lighting'));
    this.shadowRoot.getElementById('dockClimate').addEventListener('click', () => this._openModal('climate'));
    this.shadowRoot.getElementById('dockBlinds').addEventListener('click', () => this._openModal('blinds'));
    this.shadowRoot.getElementById('dockWeather').addEventListener('click', () => this._openModal('weather'));

    this.shadowRoot.getElementById('modalCloseBtn').addEventListener('click', () => this._closeModal());
    this.shadowRoot.getElementById('modalContainer').addEventListener('click', (e) => {
      if (e.target.id === 'modalContainer') this._closeModal();
    });

    // Set localized date
    const dateEl = this.shadowRoot.getElementById('dateTitle');
    if (dateEl) {
      const now = new Date();
      dateEl.textContent = now.toLocaleDateString('de-DE', { weekday: 'long', month: 'long', day: 'numeric' });
    }

    this._applyThemeClass();
  }
}

customElements.define('vision-glass-dashboard', VisionGlassDashboard);

// Register in Home Assistant Lovelace Custom Card list
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'vision-glass-dashboard',
  name: 'Vision Glass Dashboard',
  description: 'Ultra-modern translucent glassmorphism smart home dashboard with interactive modals, day/night auto-switching and floating dock.'
});


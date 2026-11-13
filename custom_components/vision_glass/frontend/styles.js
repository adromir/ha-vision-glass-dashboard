/** Shared Glassmorphism CSS styles for Vision Glass panel. */
export const VISION_GLASS_STYLES = `
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          box-sizing: border-box;
          width: 100%;
          min-height: 100vh;
          height: 100%;
          background: inherit;
        }

        /* --- THEME DESIGN TOKENS --- */
        .dashboard-root.theme-light {
          background: radial-gradient(circle at 15% 15%, rgba(255, 255, 255, 0.95) 0%, transparent 45%),
                      radial-gradient(circle at 85% 80%, rgba(186, 230, 253, 0.55) 0%, transparent 50%),
                      linear-gradient(135deg, #dbeafe 0%, #eff6ff 35%, #f8fafc 70%, #ede9fe 100%);
          --bg-surface: var(--ha-card-background, rgba(255, 255, 255, 0.92));
          --bg-surface-hover: var(--secondary-background-color, #ffffff);
          --bg-card: var(--ha-card-background, rgba(255, 255, 255, 0.90));
          --border-glass: var(--divider-color, rgba(148, 163, 184, 0.42));
          --border-subtle: var(--divider-color, rgba(203, 213, 225, 0.88));
          --text-primary: var(--primary-text-color, #0f172a);
          --text-secondary: var(--secondary-text-color, #334155);
          --accent: var(--primary-color, #0284c7);
          --accent-amber: #ea580c;
          --accent-green: #10b981;
          --dock-bg: var(--ha-card-background, rgba(255, 255, 255, 0.96));
          --shadow-ambient: 0 14px 35px rgba(15, 23, 42, 0.12), 0 3px 8px rgba(15, 23, 42, 0.06);
          --card-overlay: linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.60) 100%);
          --glass-refraction:
            inset 0 1.5px 1px 0 #ffffff,
            inset 0 -1.5px 1.5px 0 rgba(15, 23, 42, 0.08),
            inset 1.5px 0 1.5px 0 rgba(255, 255, 255, 0.95),
            0 0 0 1px rgba(148, 163, 184, 0.32);
        }

        .dashboard-root.theme-dark {
          background: radial-gradient(circle at 85% 15%, rgba(56, 189, 248, 0.14) 0%, transparent 45%),
                      radial-gradient(circle at 15% 85%, rgba(30, 58, 138, 0.22) 0%, transparent 50%),
                      linear-gradient(135deg, #090e18 0%, #0f172a 35%, #162032 70%, #0a101b 100%);
          --bg-surface: var(--ha-card-background, rgba(24, 32, 48, 0.70));
          --bg-surface-hover: var(--secondary-background-color, rgba(30, 41, 59, 0.85));
          --bg-card: var(--ha-card-background, rgba(18, 25, 38, 0.62));
          --border-glass: var(--divider-color, rgba(255, 255, 255, 0.18));
          --border-subtle: var(--divider-color, rgba(255, 255, 255, 0.08));
          --text-primary: var(--primary-text-color, #f8fafc);
          --text-secondary: var(--secondary-text-color, #94a3b8);
          --accent: var(--primary-color, #38bdf8);
          --accent-amber: #f59e0b;
          --accent-green: #10b981;
          --dock-bg: var(--ha-card-background, rgba(16, 22, 34, 0.72));
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
          min-height: 100vh;
          width: 100%;
          padding: 10px 24px 80px 24px;
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
          color: var(--text-primary, var(--primary-text-color, #f8fafc));
          background: var(--lovelace-background, var(--primary-background-color, #0f172a));
          --bg-surface: var(--ha-card-background, var(--card-background-color, rgba(24, 32, 48, 0.70)));
          --bg-surface-hover: var(--secondary-background-color, rgba(30, 41, 59, 0.85));
          --bg-card: var(--ha-card-background, var(--card-background-color, rgba(18, 25, 38, 0.62)));
          --border-glass: var(--divider-color, rgba(255, 255, 255, 0.18));
          --border-subtle: var(--divider-color, rgba(255, 255, 255, 0.08));
          --text-primary: var(--primary-text-color, #f8fafc);
          --text-secondary: var(--secondary-text-color, #94a3b8);
          --accent: var(--primary-color, #38bdf8);
          --accent-amber: #f59e0b;
          --accent-green: #10b981;
          --dock-bg: var(--ha-card-background, rgba(16, 22, 34, 0.72));
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
          gap: 6px;
          background: linear-gradient(145deg, rgba(24, 32, 48, 0.85) 0%, rgba(15, 23, 42, 0.92) 100%);
          backdrop-filter: blur(24px) saturate(190%);
          -webkit-backdrop-filter: blur(24px) saturate(190%);
          border: 1px solid var(--border-glass, rgba(255, 255, 255, 0.14));
          border-radius: 12px;
          padding: 5px 12px;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.2px;
          cursor: pointer;
          color: var(--text-primary, #f8fafc);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.35), inset 0 -1px 1px rgba(0, 0, 0, 0.2);
          transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.25s, background 0.25s;
          user-select: none;
        }
        .chip:hover {
          transform: translateY(-2px) scale(1.02);
          border-color: rgba(56, 189, 248, 0.55);
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.36), 0 0 14px rgba(56, 189, 248, 0.25), inset 0 1px 1.5px rgba(255, 255, 255, 0.6);
        }

        .theme-light .chip {
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.92) 0%, rgba(241, 245, 249, 0.85) 100%);
          border: 1px solid rgba(203, 213, 225, 0.90);
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04), inset 0 1.5px 1px #ffffff, inset 0 -1px 1px rgba(148, 163, 184, 0.25);
          color: #0f172a;
          font-weight: 600;
        }
        .theme-light .chip:hover {
          transform: translateY(-2px) scale(1.02);
          background: linear-gradient(145deg, #ffffff 0%, rgba(248, 250, 252, 0.95) 100%);
          border-color: rgba(2, 132, 199, 0.65);
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12), 0 0 14px rgba(2, 132, 199, 0.20), inset 0 1.5px 1px #ffffff;
        }

        /* Presence Avatar Cluster with Fanning Animation (Jitter-free, Crosshair-free) */
        .chip.chip-persons-cluster,
        .chip.chip-persons-cluster:hover,
        .theme-light .chip.chip-persons-cluster,
        .theme-light .chip.chip-persons-cluster:hover {
          transform: none !important;
        }

        .chip-persons-cluster {
          position: relative;
          padding: 4px 10px 4px 6px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        .chip-persons-cluster:hover {
          border-color: rgba(56, 189, 248, 0.5);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.32), 0 0 12px rgba(56, 189, 248, 0.20), inset 0 1px 1.5px rgba(255, 255, 255, 0.5);
        }
        .theme-light .chip-persons-cluster:hover {
          border-color: rgba(2, 132, 199, 0.6);
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.10), 0 0 12px rgba(2, 132, 199, 0.18), inset 0 1.5px 1px #ffffff;
        }

        .cluster-stack {
          display: inline-flex;
          align-items: center;
          flex-shrink: 0;
        }
        .cluster-avatar-wrap {
          position: relative;
          margin-right: -10px;
          transition: margin-right 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 50%;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
          isolation: isolate;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .cluster-avatar-wrap:last-child {
          margin-right: 0;
        }
        .cluster-avatar {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          object-fit: cover;
          display: block;
          box-sizing: border-box;
          border: 2px solid rgba(255, 255, 255, 0.9);
          clip-path: circle(50% at 50% 50%);
          -webkit-clip-path: circle(50% at 50% 50%);
          filter: none !important;
          -webkit-filter: none !important;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .theme-light .cluster-avatar {
          border-color: #ffffff;
        }
        .cluster-avatar-initial {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 10px;
          color: #fff;
          background: linear-gradient(135deg, #0284c7, #818cf8);
          box-sizing: border-box;
          border: 2px solid rgba(255, 255, 255, 0.9);
          clip-path: circle(50% at 50% 50%);
          -webkit-clip-path: circle(50% at 50% 50%);
          filter: none !important;
          -webkit-filter: none !important;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .avatar-online {
          border-color: #10b981 !important;
        }
        .avatar-offline {
          border-color: #94a3b8 !important;
          opacity: 0.8;
        }
        .cluster-status-dot {
          position: absolute;
          bottom: 0px;
          right: 0px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          border: 1px solid var(--ha-card-background, #101826);
          filter: none !important;
          -webkit-filter: none !important;
          z-index: 2;
        }
        .theme-light .cluster-status-dot {
          border-color: #ffffff;
        }

        .cluster-collapsed-label {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-secondary, #94a3b8);
          white-space: nowrap;
          max-width: 140px;
          opacity: 1;
          overflow: hidden;
          display: inline-block;
          transition: max-width 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease, margin 0.28s ease;
          pointer-events: none;
        }

        .cluster-expanded-list {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          max-width: 0;
          opacity: 0;
          overflow: hidden;
          white-space: nowrap;
          transition: max-width 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
          pointer-events: none;
        }
        .cluster-expanded-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          white-space: nowrap;
          padding: 2px 6px;
          border-radius: 8px;
          transition: background 0.15s;
        }
        .cluster-expanded-item:hover {
          background: rgba(255, 255, 255, 0.12);
        }
        .theme-light .cluster-expanded-item:hover {
          background: rgba(2, 132, 199, 0.10);
        }
        .cluster-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .cluster-user-name {
          font-weight: 600;
          font-size: 11px;
        }
        .cluster-user-status {
          font-size: 10px;
          color: var(--text-secondary, #94a3b8);
        }

        /* Hover expansion: Fan out avatars! */
        .chip-persons-cluster:hover .cluster-avatar-wrap {
          margin-right: 6px;
        }
        .chip-persons-cluster:hover .cluster-avatar-wrap:last-child {
          margin-right: 0;
        }
        .chip-persons-cluster:hover .cluster-avatar-wrap:hover {
          z-index: 5 !important;
        }
        .chip-persons-cluster:hover .cluster-avatar-wrap:hover .cluster-avatar {
          border-color: #38bdf8 !important;
          box-shadow: 0 0 8px rgba(56, 189, 248, 0.6);
        }
        .chip-persons-cluster:hover .cluster-collapsed-label {
          max-width: 0;
          opacity: 0;
          margin: 0;
          padding: 0;
        }
        .chip-persons-cluster:hover .cluster-expanded-list {
          max-width: 480px;
          opacity: 1;
          pointer-events: auto;
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

        .sidebar-card:hover {
          transform: translateY(-2px);
          border-color: rgba(56, 189, 248, 0.4);
          box-shadow: 0 16px 38px rgba(0, 0, 0, 0.42);
        }

        .theme-light .sidebar-card {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(148, 163, 184, 0.42);
          box-shadow: 0 14px 32px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.05);
        }

        .theme-light .sidebar-card:hover {
          transform: translateY(-2px);
          border-color: rgba(2, 132, 199, 0.45);
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.14);
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
          background: rgba(240, 246, 254, 0.92);
          border: 1px solid rgba(148, 163, 184, 0.40);
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
          border: 1px solid rgba(148, 163, 184, 0.38);
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
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.88) 0%, rgba(241, 245, 249, 0.72) 55%, rgba(226, 232, 240, 0.62) 100%);
          backdrop-filter: blur(30px) saturate(190%);
          -webkit-backdrop-filter: blur(30px) saturate(190%);
          border: 1px solid rgba(203, 213, 225, 0.90);
          box-shadow:
            0 16px 36px -4px rgba(15, 23, 42, 0.14),
            0 4px 12px rgba(15, 23, 42, 0.06),
            inset 0 1.5px 1.5px 0 #ffffff,
            inset 0 -1.5px 1.5px 0 rgba(148, 163, 184, 0.28),
            inset 0 0 0 1px rgba(255, 255, 255, 0.70);
        }

        .theme-light .room-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 6%;
          right: 6%;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.95), transparent);
          pointer-events: none;
          z-index: 3;
        }

        .theme-light .room-card::after {
          background: linear-gradient(115deg,
            transparent 0%,
            transparent 35%,
            rgba(255, 255, 255, 0.75) 50%,
            rgba(255, 255, 255, 0.25) 55%,
            transparent 70%);
          background-size: 250% 250%;
          background-position: -120% -120%;
          pointer-events: none;
          z-index: 2;
          opacity: 0.7;
          transition: background-position 0.75s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s;
        }

        .theme-light .room-card:hover::after {
          background-position: 140% 140%;
          opacity: 1;
        }

        .theme-light .room-card:hover {
          transform: translateY(-6px) scale(1.018);
          border-color: rgba(2, 132, 199, 0.65);
          box-shadow:
            0 26px 52px -6px rgba(15, 23, 42, 0.20),
            0 0 24px rgba(2, 132, 199, 0.24),
            inset 0 2px 2px #ffffff,
            inset 0 -1.5px 1.5px rgba(148, 163, 184, 0.35);
        }

        /* Eliminate crosshair rendering artifact on scale/transform */
        .room-card .vg-icon,
        .room-card ha-icon,
        .action-circle .vg-icon,
        .action-circle ha-icon,
        .env-pill .vg-icon,
        .env-pill ha-icon {
          filter: none !important;
          pointer-events: none;
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
          z-index: 4;
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
          z-index: 4;
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
          background: var(--bg-pill, rgba(241, 245, 249, 0.94));
          border: 1px solid rgba(148, 163, 184, 0.42);
          color: #0f172a;
          font-weight: 700;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
        }

        .room-bottom-row {
          position: relative;
          z-index: 4;
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
        .action-circle.active-heat {
          background: #ef4444;
          color: #fff;
          box-shadow: 0 0 16px rgba(239, 68, 68, 0.7);
          border-color: #f87171;
        }
        .action-circle.cool-idle {
          background: rgba(56, 189, 248, 0.12);
          color: #38bdf8;
          border-color: rgba(56, 189, 248, 0.3);
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
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(148, 163, 184, 0.45);
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
          color: #0f172a;
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
          background: rgba(255, 255, 255, 0.96);
          background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.99) 0%, rgba(241, 245, 249, 0.94) 100%);
          backdrop-filter: blur(32px) saturate(200%);
          -webkit-backdrop-filter: blur(32px) saturate(200%);
          border: 1px solid rgba(148, 163, 184, 0.45);
          box-shadow:
            inset 0 2px 1.5px 0 #ffffff,
            inset 0 -1.5px 1.5px 0 rgba(15, 23, 42, 0.08),
            0 16px 40px rgba(15, 23, 42, 0.16),
            0 2px 8px rgba(15, 23, 42, 0.08);
        }

        .theme-light .dock-item {
          color: #334155;
        }
        .theme-light .dock-item:hover {
          color: var(--accent);
          background: rgba(2, 132, 199, 0.12);
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
          top: var(--header-height, 56px);
          left: 0;
          right: 0;
          bottom: 0;
          height: calc(100vh - var(--header-height, 56px));
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 16px;
          box-sizing: border-box;
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
          max-height: calc(100vh - var(--header-height, 56px) - 32px);
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

        /* VisionOS Glass Toggle Switch */
        .vg-switch {
          position: relative;
          width: 44px;
          height: 24px;
          background: rgba(255, 255, 255, 0.16);
          border: 1px solid var(--border-glass);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          padding: 2px;
          box-sizing: border-box;
        }
        .vg-switch.active {
          background: var(--accent);
          border-color: var(--accent);
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.45);
        }
        .vg-switch .vg-switch-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateX(0);
        }
        .vg-switch.active .vg-switch-thumb {
          transform: translateX(20px);
        }
        .theme-light .vg-switch {
          background: rgba(0, 0, 0, 0.14);
          border-color: rgba(0, 0, 0, 0.16);
        }
        .theme-light .vg-switch.active {
          background: var(--accent);
          border-color: var(--accent);
        }
        .theme-light .vg-switch .vg-switch-thumb {
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
        }

        /* Pulsing Battery Warning Badge */
        .badge-battery-warn {
          animation: pulse-warn 2s infinite ease-in-out;
        }
        @keyframes pulse-warn {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.75; transform: scale(0.97); }
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
           ADVANCED HELPER CONTROLS - TACTILE SUITE
           ================================================================ */
        /* 1. ROTARY KNOB */
        .rotary-container {
          position: relative;
          width: 80px;
          height: 80px;
          touch-action: none;
          cursor: grab;
          flex-shrink: 0;
        }
        .rotary-container:active { cursor: grabbing; }
        .rotary-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
        .rotary-bg-arc { fill: none; stroke: rgba(255, 255, 255, 0.12); stroke-width: 8; stroke-linecap: round; }
        .theme-light .rotary-bg-arc { stroke: rgba(0, 0, 0, 0.1); }
        .rotary-val-arc { fill: none; stroke: var(--accent); stroke-width: 8; stroke-linecap: round; transition: stroke-dashoffset 0.08s ease; }
        .rotary-center-val {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .rotary-num { font-size: 15px; font-weight: 800; line-height: 1.1; color: var(--text-primary); }
        .rotary-unit { font-size: 10px; font-weight: 600; color: var(--text-secondary); }

        /* 2. VERTICAL SLIDER */
        .vslider-container {
          position: relative;
          width: 36px;
          height: 100px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 18px;
          overflow: hidden;
          touch-action: none;
          cursor: pointer;
          box-shadow: inset 0 2px 5px rgba(0,0,0,0.2);
          border: 1px solid var(--border-subtle);
          flex-shrink: 0;
        }
        .theme-light .vslider-container { background: rgba(0, 0, 0, 0.08); }
        .vslider-fill { position: absolute; bottom: 0; left: 0; right: 0; border-radius: 18px; background: var(--accent); transition: height 0.06s ease; }
        .vslider-handle { position: absolute; width: 28px; height: 8px; left: 3px; border-radius: 4px; background: #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.4); pointer-events: none; }

        /* 3. WEDGE SLIDER */
        .wedge-container {
          width: 140px;
          height: 44px;
          position: relative;
          touch-action: none;
          cursor: pointer;
          flex-shrink: 0;
        }
        .wedge-svg { width: 100%; height: 100%; }

        /* 4. OPEN THERMOSTAT ARC (270°) */
        .openarc-container {
          position: relative;
          width: 85px;
          height: 85px;
          touch-action: none;
          cursor: grab;
          flex-shrink: 0;
        }
        .openarc-container:active { cursor: grabbing; }
        .openarc-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; }

        /* 5. HALF-CIRCLE (180°) */
        .halfcircle-container {
          position: relative;
          width: 100px;
          height: 55px;
          touch-action: none;
          cursor: grab;
          flex-shrink: 0;
        }
        .halfcircle-container:active { cursor: grabbing; }

        /* 6. STEPPER PRESETS */
        .presets-row { display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end; }
        .preset-pill {
          padding: 3px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          border: 1px solid var(--border-subtle);
          background: var(--bg-surface);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .preset-pill.active { background: var(--accent); color: #ffffff; border-color: var(--accent); }

        /* 7. SEGMENTED PILLS */
        .segmented-container {
          display: flex;
          background: rgba(255, 255, 255, 0.08);
          padding: 3px;
          border-radius: 12px;
          gap: 4px;
          width: 100%;
          box-sizing: border-box;
          border: 1px solid var(--border-subtle);
        }
        .theme-light .segmented-container { background: rgba(0, 0, 0, 0.06); }
        .seg-item {
          flex: 1;
          min-width: 44px;
          padding: 5px 10px;
          border-radius: 9px;
          text-align: center;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          color: var(--text-secondary);
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .seg-item.active {
          background: var(--bg-surface);
          color: var(--accent);
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }

        /* 8. CIRCULAR TIMER */
        .timer-container {
          position: relative;
          width: 85px;
          height: 85px;
          flex-shrink: 0;
        }
        .timer-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .timer-btns { display: flex; gap: 4px; margin-top: 4px; }
        .timer-micro-btn {
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 700;
          border: 1px solid var(--border-subtle);
          background: var(--bg-surface);
          color: var(--text-primary);
          cursor: pointer;
        }

        /* 9. ROCKER SWITCH */
        .rocker-container {
          display: flex;
          width: 84px;
          height: 34px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid var(--border-glass);
          border-radius: 17px;
          padding: 2px;
          box-sizing: border-box;
          cursor: pointer;
          position: relative;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.25);
          flex-shrink: 0;
        }
        .theme-light .rocker-container {
          background: rgba(0, 0, 0, 0.1);
        }
        .rocker-half {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
          color: var(--text-secondary);
          z-index: 2;
          letter-spacing: 0.5px;
        }
        .rocker-pill {
          position: absolute;
          width: 38px;
          height: 28px;
          top: 2px;
          left: 2px;
          background: #ffffff;
          border-radius: 14px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          transition: transform 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .rocker-container.is-on .rocker-pill {
          transform: translateX(40px);
          background: var(--accent);
        }
        .rocker-container.is-on .rocker-half.half-on { color: #ffffff; }

        /* 10. HOLD BUTTON */
        .hold-btn-container {
          position: relative;
          width: 50px;
          height: 50px;
          touch-action: none;
          cursor: pointer;
          flex-shrink: 0;
        }
        .hold-btn-bg {
          position: absolute;
          inset: 4px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--border-glass);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
          color: var(--text-primary);
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
        .action-circle.active-heat .vg-icon,
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
          flex-wrap: wrap;
          gap: 8px;
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 12px;
          margin-bottom: 16px;
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

        /* --- Enhanced Climate & Flame Styles --- */
        .pulsing-flame {
          animation: pulseFlame 1.8s ease-in-out infinite alternate;
        }
        @keyframes pulseFlame {
          0% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(245, 158, 11, 0.4)); }
          100% { transform: scale(1.15); filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.85)); }
        }
        .climate-control-badge.is-heating {
          border-color: rgba(245, 158, 11, 0.5) !important;
          background: rgba(245, 158, 11, 0.08) !important;
          box-shadow: 0 0 16px rgba(245, 158, 11, 0.22) !important;
        }

        /* --- Helper Controls: Push Button, Icon Button, Slider, Segmented, Time --- */
        .vg-push-btn {
          padding: 8px 16px;
          border-radius: 12px;
          border: 1px solid var(--border-glass);
          background: var(--bg-surface);
          color: var(--text-primary);
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: var(--shadow-ambient);
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .vg-push-btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.1);
        }
        .vg-push-btn:active {
          transform: translateY(1px);
        }
        .vg-push-btn.active {
          background: var(--accent);
          color: #ffffff;
          border-color: var(--accent);
          box-shadow: 0 0 14px rgba(56, 189, 248, 0.45);
        }

        .vg-icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1px solid var(--border-glass);
          background: var(--bg-surface);
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: var(--shadow-ambient);
        }
        .vg-icon-btn:hover {
          transform: scale(1.08);
        }
        .vg-icon-btn.active {
          background: var(--accent);
          color: #ffffff;
          border-color: var(--accent);
          box-shadow: 0 0 14px rgba(56, 189, 248, 0.45);
        }

        .vg-slider-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          max-width: 220px;
        }
        .vg-range-slider {
          -webkit-appearance: none;
          appearance: none;
          flex: 1;
          height: 6px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.15);
          outline: none;
          transition: background 0.2s;
        }
        .theme-light .vg-range-slider {
          background: rgba(15, 23, 42, 0.15);
        }
        .vg-range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
          transition: transform 0.15s;
        }
        .vg-range-slider::-webkit-slider-thumb:hover {
          transform: scale(1.18);
        }
        .vg-slider-val {
          font-size: 13px;
          font-weight: 700;
          color: var(--accent);
          min-width: 44px;
          text-align: right;
        }

        .vg-seg-group {
          display: flex;
          background: rgba(0, 0, 0, 0.18);
          padding: 3px;
          border-radius: 10px;
          gap: 3px;
          border: 1px solid var(--border-subtle);
        }
        .theme-light .vg-seg-group {
          background: rgba(15, 23, 42, 0.06);
        }
        .vg-seg-pill {
          padding: 5px 12px;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .vg-seg-pill.active {
          background: var(--accent);
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(56, 189, 248, 0.35);
        }

        .vg-time-input {
          padding: 6px 10px;
          border-radius: 8px;
          background: var(--bg-surface);
          color: var(--text-primary);
          border: 1px solid var(--border-subtle);
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          outline: none;
        }
        .vg-time-input:focus {
          border-color: var(--accent);
        }

  .vg-sidebar-toggle-btn {
    display: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 12px;
    border: 1px solid var(--border-glass);
    background: var(--bg-surface);
    color: var(--text-primary);
    cursor: pointer;
    flex-shrink: 0;
  }
  .vg-sidebar-toggle-btn.visible {
    display: inline-flex;
  }
`;

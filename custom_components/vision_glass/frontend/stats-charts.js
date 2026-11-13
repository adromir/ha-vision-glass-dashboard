/**
 * Lazy-loaded chart & statistics helpers backed by Python Recorder downsampling (`vision_glass/stats/history`).
 */

export async function fetchHistoryViaBackend(hass, entityIds, hours = 24, maxPoints = 120) {
  const cleanIds = [...new Set((entityIds || []).filter((e) => typeof e === 'string' && e.includes('.')))];
  if (!hass || !hass.callWS || cleanIds.length === 0) return {};

  try {
    const res = await hass.callWS({
      type: 'vision_glass/stats/history',
      entity_ids: cleanIds,
      hours,
      max_points: maxPoints,
    });
    return (res && res.series) || {};
  } catch (err) {
    console.warn('[VisionGlass] Stats history fetch error:', err);
    return {};
  }
}

export function collectDashboardStatEntities(panel) {
  const ids = new Set();
  const rooms = panel?._config?.rooms || [];
  const states = panel?._hass?.states || {};
  const discovery = panel?._discovery;

  rooms.forEach((r) => {
    if (r.temp_entity) ids.add(r.temp_entity);
    if (r.humidity_entity) ids.add(r.humidity_entity);
    if (r.illuminance_entity) ids.add(r.illuminance_entity);
    if (r.climate_entity) ids.add(r.climate_entity);
    if (r.light_entity) ids.add(r.light_entity);
    if (r.presence_entity) ids.add(r.presence_entity);

    if (discovery && discovery.entities) {
      Object.values(discovery.entities).forEach((meta) => {
        if (meta.area_id !== r.id) return;
        if (meta.domain === 'sensor' && (meta.device_class === 'temperature' || meta.device_class === 'illuminance')) {
          ids.add(meta.entity_id);
        }
      });
    }
  });

  const batteries = panel?._summary?.batteries;
  if (batteries) {
    [...(batteries.critical || []), ...(batteries.low || []), ...(batteries.good || [])].slice(0, 12).forEach((b) => {
      ids.add(b.entity_id);
    });
  } else {
    Object.keys(states).forEach((eId) => {
      if (eId.startsWith('sensor.') && states[eId]?.attributes?.device_class === 'battery') {
        ids.add(eId);
      }
    });
  }

  return [...ids];
}

export function renderMultiLineSvgChart(panel, { series, stateOverlay = null, width = 780, height = 320, unit = '°C', timeSpanHours = 24 }) {
  const padL = 52;
  const padR = 24;
  const padT = 24;
  const padB = 40;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const tEnd = Date.now();
  const tStart = tEnd - timeSpanHours * 3600 * 1000;
  const timeSpan = tEnd - tStart;

  const hasOverlay = Boolean(stateOverlay && stateOverlay.entity_id);
  const trackH = hasOverlay ? 12 : 0;
  const trackY = hasOverlay ? padT + plotH - trackH - 2 : 0;
  const curvePlotH = hasOverlay ? plotH - trackH - 12 : plotH;

  let overlayBandsMarkup = '';
  let overlayTimelineMarkup = '';
  let activeIntervalCount = 0;

  if (hasOverlay) {
    const hist = panel._statsHistory && panel._statsHistory[stateOverlay.entity_id];
    const activeColor = stateOverlay.activeColor || '#f59e0b';
    const intervals = hist && Array.isArray(hist.intervals) ? hist.intervals : [];

    if (intervals.length > 0) {
      let lastEnd = tStart;
      intervals.forEach(([sMs, eMs]) => {
        const clampedStart = Math.max(tStart, sMs);
        const clampedEnd = Math.min(tEnd, eMs);
        if (clampedEnd <= clampedStart) return;
        if (clampedStart > lastEnd) {
          const ix1 = padL + ((lastEnd - tStart) / timeSpan) * plotW;
          const ix2 = padL + ((clampedStart - tStart) / timeSpan) * plotW;
          overlayTimelineMarkup += `<rect x="${ix1.toFixed(1)}" y="${trackY.toFixed(1)}" width="${Math.max(1, ix2 - ix1).toFixed(1)}" height="${trackH}" rx="2" fill="rgba(255,255,255,0.06)" />`;
        }
        const x1 = padL + ((clampedStart - tStart) / timeSpan) * plotW;
        const x2 = padL + ((clampedEnd - tStart) / timeSpan) * plotW;
        const bandW = Math.max(1, x2 - x1);
        activeIntervalCount++;
        overlayBandsMarkup += `<rect x="${x1.toFixed(1)}" y="${padT}" width="${bandW.toFixed(1)}" height="${curvePlotH.toFixed(1)}" fill="${activeColor}" opacity="0.12" />`;
        overlayTimelineMarkup += `<rect x="${x1.toFixed(1)}" y="${trackY.toFixed(1)}" width="${bandW.toFixed(1)}" height="${trackH}" rx="2" fill="${activeColor}" opacity="0.95" />`;
        lastEnd = clampedEnd;
      });
      if (lastEnd < tEnd) {
        const ix1 = padL + ((lastEnd - tStart) / timeSpan) * plotW;
        const ix2 = padL + plotW;
        overlayTimelineMarkup += `<rect x="${ix1.toFixed(1)}" y="${trackY.toFixed(1)}" width="${Math.max(1, ix2 - ix1).toFixed(1)}" height="${trackH}" rx="2" fill="rgba(255,255,255,0.06)" />`;
      }
    } else {
      overlayTimelineMarkup += `<rect x="${padL.toFixed(1)}" y="${trackY.toFixed(1)}" width="${plotW.toFixed(1)}" height="${trackH}" rx="2" fill="rgba(255,255,255,0.06)" />`;
    }
  }

  const allVals = [];
  const processedSeries = series.map((s) => {
    const rawPoints = [];
    const hist = panel._statsHistory && panel._statsHistory[s.id];
    if (hist && Array.isArray(hist.points)) {
      hist.points.forEach(([t, v]) => {
        if (typeof v === 'number' && !isNaN(v)) {
          rawPoints.push({ t, v });
        }
      });
    } else if (Array.isArray(hist)) {
      hist.forEach((item) => {
        const v = parseFloat(item.s);
        const t = item.lu ? item.lu * 1000 : item.last_updated ? new Date(item.last_updated).getTime() : null;
        if (!isNaN(v) && t) rawPoints.push({ t, v });
      });
    }

    const curValNum = parseFloat(s.currentVal);
    if (!isNaN(curValNum)) rawPoints.push({ t: tEnd, v: curValNum });
    rawPoints.sort((a, b) => a.t - b.t);
    rawPoints.forEach((p) => allVals.push(p.v));
    return { ...s, ptsRaw: rawPoints };
  });

  if (allVals.length === 0) allVals.push(20, 22);

  let minVal = Math.min(...allVals);
  let maxVal = Math.max(...allVals);
  if (maxVal === minVal) {
    maxVal += 1;
    minVal -= 1;
  } else {
    const span = maxVal - minVal;
    maxVal += span * 0.08;
    minVal -= span * 0.08;
  }

  if (unit === '%') {
    minVal = Math.max(0, Math.floor(minVal / 5) * 5);
    maxVal = Math.min(100, Math.ceil(maxVal / 5) * 5);
    if (maxVal - minVal < 10) maxVal = Math.min(100, minVal + 10);
  }
  if (unit === ' lx') {
    minVal = 0;
  }

  const valSpan = maxVal - minVal || 1;
  const isIntUnit = unit === ' lx' || unit === '%';
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((r) => {
    const val = minVal + valSpan * r;
    return {
      y: padT + curvePlotH - curvePlotH * r,
      label: isIntUnit ? Math.round(val).toString() : val.toFixed(1).replace('.', ','),
    };
  });

  const timeTicks = [0, 0.25, 0.5, 0.75, 1].map((r) => {
    const t = tStart + timeSpan * r;
    const d = new Date(t);
    const label = r === 1 ? 'Jetzt' : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return { ratio: r, label };
  });

  const seriesMarkup = processedSeries
    .map((s) => {
      if (s.ptsRaw.length === 0) return '';
      const pts = s.ptsRaw.map((p) => {
        const clampedT = Math.max(tStart, Math.min(tEnd, p.t));
        return {
          x: padL + ((clampedT - tStart) / timeSpan) * plotW,
          y: padT + curvePlotH - ((p.v - minVal) / valSpan) * curvePlotH,
        };
      });

      let pathD = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        const mx = (p0.x + p1.x) / 2;
        pathD += ` C ${mx.toFixed(1)} ${p0.y.toFixed(1)}, ${mx.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
      }
      const last = pts[pts.length - 1];
      return `
        <path d="${pathD}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="4.5" fill="${s.color}" stroke="#ffffff" stroke-width="1.5" />
      `;
    })
    .join('');

  const svg = `
    <svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto;max-height:320px;overflow:visible;">
      ${yTicks
        .map(
          (tk) => `
        <line x1="${padL}" y1="${tk.y.toFixed(1)}" x2="${padL + plotW}" y2="${tk.y.toFixed(1)}" stroke="rgba(255,255,255,0.10)" stroke-width="1" stroke-dasharray="4 4" />
        <text x="${padL - 8}" y="${(tk.y + 4).toFixed(1)}" text-anchor="end" fill="var(--text-secondary)" font-size="10.5px" font-weight="600">${tk.label}${unit}</text>
      `
        )
        .join('')}
      ${overlayBandsMarkup}
      ${
        hasOverlay
          ? `
        <g>
          ${overlayTimelineMarkup}
          <text x="${padL - 8}" y="${(trackY + trackH - 2).toFixed(1)}" text-anchor="end" fill="${stateOverlay.activeColor || '#f59e0b'}" font-size="9.5px" font-weight="700">${stateOverlay.label || 'Status'}</text>
        </g>
      `
          : ''
      }
      ${timeTicks
        .map((t) => {
          const x = padL + plotW * t.ratio;
          return `
          <line x1="${x.toFixed(1)}" y1="${padT + plotH}" x2="${x.toFixed(1)}" y2="${padT + plotH + 5}" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
          <text x="${x.toFixed(1)}" y="${(padT + plotH + 18).toFixed(1)}" text-anchor="${t.ratio === 0 ? 'start' : t.ratio === 1 ? 'end' : 'middle'}" fill="var(--text-secondary)" font-size="10.5px" font-weight="600">${t.label}</text>
        `;
        })
        .join('')}
      ${seriesMarkup}
    </svg>
  `;

  return {
    svg,
    min: isIntUnit ? Math.round(minVal) : minVal.toFixed(1).replace('.', ','),
    max: isIntUnit ? Math.round(maxVal) : maxVal.toFixed(1).replace('.', ','),
    hasOverlay,
    activeIntervalCount,
  };
}

export function generateSvgCurve(vals, currentVal, width = 290, height = 55) {
  if (!vals || vals.length < 2) {
    const c = parseFloat(currentVal) || 21.0;
    vals = [c - 0.4, c - 0.2, c + 0.1, c - 0.1, c + 0.3, c];
  }
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min === 0 ? 1 : max - min;
  const padY = 8;
  const innerH = height - padY * 2;

  const stepX = width / (vals.length - 1);
  const pts = vals.map((v, i) => ({
    x: i * stepX,
    y: height - padY - ((v - min) / range) * innerH,
  }));

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
    max: max.toFixed(1).replace('.', ','),
  };
}

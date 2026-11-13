import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(__dirname, '../custom_components/vision_glass/frontend');

const reg = new Map();
globalThis.HTMLElement = class {};
globalThis.customElements = { get: (k) => reg.get(k), define: (k, v) => reg.set(k, v) };
globalThis.document = { createElement: () => ({}), addEventListener() {} };
globalThis.window = { addEventListener() {}, removeEventListener() {} };

const { I18N } = await import(`file://${path.join(frontendDir, 'i18n.js')}`);
const { ICONS, renderIcon } = await import(`file://${path.join(frontendDir, 'icons.js')}`);
const { settingsMethods } = await import(`file://${path.join(frontendDir, 'settings-view.js')}`);
const statsCharts = await import(`file://${path.join(frontendDir, 'stats-charts.js')}`);
await import(`file://${path.join(frontendDir, 'vision-glass-panel.js')}`);

const Panel = reg.get('vision-glass-panel');
assert.ok(Panel, 'vision-glass-panel custom element must register cleanly');

// 1. I18N DE <-> EN parity
const deKeys = new Set(Object.keys(I18N.de || {}));
const enKeys = new Set(Object.keys(I18N.en || {}));
assert.ok(deKeys.size > 50, 'I18N.de must contain translations');
assert.deepEqual([...deKeys].filter((k) => !enKeys.has(k)), [], 'All DE I18N keys must exist in EN');

// 2. Icons render cleanly
assert.ok(Object.keys(ICONS).length >= 20, 'ICONS map should expose built-in SVGs');
const iconOut = renderIcon('light', { size: 18 });
assert.ok(
  (iconOut.includes('<ha-icon') && iconOut.includes('</ha-icon>')) ||
  (iconOut.includes('<svg') && iconOut.includes('</svg>')),
  'renderIcon must produce valid icon markup (ha-icon or svg)'
);

// 3. No missing `this.<method>(` calls across all panel mixins
const proto = new Set([
  ...Object.getOwnPropertyNames(Panel.prototype),
  ...Object.keys(settingsMethods),
]);
const domMethods = new Set([
  'attachShadow',
  'dispatchEvent',
  'closest',
  'querySelector',
  'querySelectorAll',
  'setAttribute',
  'removeAttribute',
  'addEventListener',
]);
for (const file of ['settings-view.js', 'modals.js', 'tactile-controls.js', 'vision-glass-panel.js']) {
  const src = fs.readFileSync(path.join(frontendDir, file), 'utf8');
  for (const m of src.matchAll(/\bthis\.([a-zA-Z0-9_]+)\s*\(/g)) {
    const methodName = m[1];
    assert.ok(
      domMethods.has(methodName) || proto.has(methodName),
      `Unresolved method call this.${methodName}() in ${file}`,
    );
  }
}

// 4. Stats chart helpers
const curve = statsCharts.generateSvgCurve([20.1, 20.5, 21.0], 21.0, 200, 60);
assert.ok(curve.pathD.startsWith('M '), 'generateSvgCurve must return SVG path');
assert.ok(curve.areaD.endsWith('Z'), 'generateSvgCurve must return closed areaD');

console.log('Frontend ESM checks passed.');

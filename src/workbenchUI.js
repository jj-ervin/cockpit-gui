(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.CockpitWorkbenchUI = factory;
}(typeof window !== 'undefined' ? window : globalThis, function createWorkbenchUI(options) {
  'use strict';
  const c = options || {};
  if (!c.document || !c.layout || !c.explorer || !c.content || !c.context) {
    throw new TypeError('WorkbenchUI requires document, layout, explorer, content and context');
  }
  const doc = c.document, layout = c.layout;
  const storage = c.storage || null;
  const storageKey = c.storageKey || 'cockpit-workbench-layout-v1';
  const activities = Array.isArray(c.activities) && c.activities.length ? c.activities : [
    { id: 'project', label: 'Project', glyph: '▤' },
    { id: 'manuscripts', label: 'Documents', glyph: '▣' },
    { id: 'assets', label: 'Assets', glyph: '◇' },
    { id: 'assistant', label: 'Assistant', glyph: '✦' },
    { id: 'console', label: 'Commands', glyph: '⌘' }
  ];
  function clamp(value, lo, hi) { return Math.min(hi, Math.max(lo, value)); }
  function read() {
    try { return JSON.parse(storage && storage.getItem(storageKey) || '{}') || {}; }
    catch { return {}; }
  }
  const previous = read();
  const widths = {
    explorer: clamp(Number(previous.explorer) || 240, 180, 420),
    context: clamp(Number(previous.context) || 300, 220, 480)
  };
  layout.classList.add('cockpit-workbench');
  const rail = doc.createElement('nav');
  rail.className = 'cockpit-workbench__activity';
  rail.setAttribute('aria-label', 'Workspace activities');
  const activityButtons = new Map();
  activities.forEach(function (activity) {
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'cockpit-workbench__activity-button';
    button.title = activity.label;
    button.setAttribute('aria-label', activity.label);
    button.dataset.activity = activity.id;
    const symbol = doc.createElement('span');
    symbol.setAttribute('aria-hidden', 'true');
    symbol.textContent = activity.glyph || '◫';
    button.appendChild(symbol);
    button.addEventListener('click', function () {
      if (typeof c.onActivity === 'function') c.onActivity(activity.id);
    });
    rail.appendChild(button);
    activityButtons.set(activity.id, button);
  });
  layout.insertBefore(rail, layout.firstChild);
  function persist() {
    try { if (storage) storage.setItem(storageKey, JSON.stringify(widths)); } catch {}
  }
  function apply() {
    layout.style.setProperty('--cockpit-explorer-width', widths.explorer + 'px');
    layout.style.setProperty('--cockpit-context-width', widths.context + 'px');
  }
  function addResize(before, side, name) {
    const grip = doc.createElement('div');
    grip.className = 'cockpit-workbench__resize cockpit-workbench__resize--' + side;
    grip.tabIndex = 0;
    grip.setAttribute('role', 'separator');
    grip.setAttribute('aria-label', 'Resize ' + name + ' panel');
    grip.setAttribute('aria-orientation', 'vertical');
    grip.setAttribute('aria-valuemin', String(side === 'left' ? 180 : 220));
    grip.setAttribute('aria-valuemax', String(side === 'left' ? 420 : 480));
    function update(delta) {
      const key = side === 'left' ? 'explorer' : 'context';
      widths[key] = clamp(widths[key] + delta, key === 'explorer' ? 180 : 220, key === 'explorer' ? 420 : 480);
      grip.setAttribute('aria-valuenow', String(widths[key]));
      apply(); persist();
    }
    grip.setAttribute('aria-valuenow', String(widths[side === 'left' ? 'explorer' : 'context']));
    grip.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        const dir = event.key === 'ArrowRight' ? 1 : -1;
        update((side === 'right' ? -dir : dir) * (event.shiftKey ? 40 : 16));
      }
    });
    grip.addEventListener('pointerdown', function (event) {
      if (event.button !== 0) return;
      const start = event.clientX, initial = widths[side === 'left' ? 'explorer' : 'context'];
      grip.setPointerCapture(event.pointerId);
      function move(e) {
        const key = side === 'left' ? 'explorer' : 'context';
        widths[key] = clamp(initial + (side === 'left' ? 1 : -1) * (e.clientX - start),
          key === 'explorer' ? 180 : 220, key === 'explorer' ? 420 : 480);
        grip.setAttribute('aria-valuenow', String(widths[key])); apply();
      }
      function stop() {
        grip.removeEventListener('pointermove', move);
        grip.removeEventListener('pointerup', stop);
        grip.removeEventListener('pointercancel', stop);
        persist();
      }
      grip.addEventListener('pointermove', move);
      grip.addEventListener('pointerup', stop);
      grip.addEventListener('pointercancel', stop);
    });
    layout.insertBefore(grip, before);
    return grip;
  }
  const left = addResize(c.content, 'left', 'Explorer');
  const right = addResize(c.context, 'right', 'Context');
  function activate(id) {
    activityButtons.forEach(function (button, key) {
      if (key === id) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  }
  apply();
  activate(c.initialActivity || 'project');
  return Object.freeze({ activate: activate, widths: function () { return Object.assign({}, widths); } });
}));

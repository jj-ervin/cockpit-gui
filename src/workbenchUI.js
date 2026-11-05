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
  let contextHeight = clamp(Number(previous.contextHeight) || 240, 160, 480);
  let contextDock = ['left', 'right', 'bottom'].includes(previous.contextDock) ? previous.contextDock : 'right';
  const visibility = {
    explorer: previous.explorerVisible !== false,
    context: previous.contextVisible !== false
  };
  layout.classList.add('cockpit-workbench');
  c.explorer.classList.add('cockpit-workbench__explorer');
  c.content.classList.add('cockpit-workbench__content');
  c.context.classList.add('cockpit-workbench__context');
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
    try { if (storage) storage.setItem(storageKey, JSON.stringify({
      ...widths, contextHeight, contextDock,
      explorerVisible: visibility.explorer, contextVisible: visibility.context
    })); } catch {}
  }
  function apply() {
    layout.style.setProperty('--cockpit-explorer-width', widths.explorer + 'px');
    layout.style.setProperty('--cockpit-context-width', widths.context + 'px');
    layout.style.setProperty('--cockpit-context-height', contextHeight + 'px');
    layout.classList[contextDock === 'bottom' ? 'add' : 'remove']('context-bottom');
    layout.classList[contextDock === 'left' ? 'add' : 'remove']('context-left');
    c.explorer.hidden = !visibility.explorer;
    c.context.hidden = !visibility.context;
    layout.classList[visibility.explorer ? 'remove' : 'add']('explorer-hidden');
    layout.classList[visibility.context ? 'remove' : 'add']('context-hidden');
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
    function resizeKey() { return contextDock === 'left' ? (side === 'left' ? 'context' : 'explorer') : (side === 'left' ? 'explorer' : 'context'); }
    function update(delta) {
      const key = resizeKey();
      if (side === 'right' && contextDock === 'bottom') contextHeight = clamp(contextHeight - delta, 160, 480);
      else widths[key] = clamp(widths[key] + delta, key === 'explorer' ? 180 : 220, key === 'explorer' ? 420 : 480);
      grip.setAttribute('aria-valuenow', String(side === 'right' && contextDock === 'bottom' ? contextHeight : widths[key]));
      apply(); persist();
    }
    grip.setAttribute('aria-valuenow', String(widths[side === 'left' ? 'explorer' : 'context']));
    grip.addEventListener('keydown', function (event) {
      if (side === 'right' && contextDock === 'bottom' && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        event.preventDefault();
        update((event.key === 'ArrowDown' ? 1 : -1) * (event.shiftKey ? 40 : 16));
        return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        if (side === 'right' && contextDock === 'bottom') return;
        event.preventDefault();
        const dir = event.key === 'ArrowRight' ? 1 : -1;
        update((side === 'right' ? -dir : dir) * (event.shiftKey ? 40 : 16));
      }
    });
    grip.addEventListener('pointerdown', function (event) {
      if (event.button !== 0) return;
      const bottom = side === 'right' && contextDock === 'bottom';
      const start = bottom ? event.clientY : event.clientX;
      const initial = bottom ? contextHeight : widths[resizeKey()];
      grip.setPointerCapture(event.pointerId);
      function move(e) {
        const key = resizeKey();
        if (bottom) contextHeight = clamp(initial - (e.clientY - start), 160, 480);
        else widths[key] = clamp(initial + (side === 'left' ? 1 : -1) * (e.clientX - start),
          key === 'explorer' ? 180 : 220, key === 'explorer' ? 420 : 480);
        grip.setAttribute('aria-valuenow', String(bottom ? contextHeight : widths[key])); apply();
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
  // The host keeps the panel content; the workbench persists only its layout.
  function setPanelVisible(panel, visible) {
    if (panel !== 'explorer' && panel !== 'context') throw new TypeError('Unknown workbench panel');
    const element = panel === 'explorer' ? c.explorer : c.context;
    const next = Boolean(visible);
    visibility[panel] = next;
    element.hidden = !next;
    layout.classList[next ? 'remove' : 'add'](panel + '-hidden');
    persist();
    return next;
  }
  function panelVisible(panel) {
    if (panel !== 'explorer' && panel !== 'context') throw new TypeError('Unknown workbench panel');
    return visibility[panel];
  }
  function dockContext(position) {
    if (position !== 'left' && position !== 'right' && position !== 'bottom') throw new TypeError('Unknown context dock');
    contextDock = position;
    left.setAttribute('aria-label', position === 'left' ? 'Resize Context panel' : 'Resize Explorer panel');
    left.setAttribute('aria-valuemin', String(position === 'left' ? 220 : 180));
    left.setAttribute('aria-valuemax', String(position === 'left' ? 480 : 420));
    left.setAttribute('aria-valuenow', String(widths[position === 'left' ? 'context' : 'explorer']));
    right.setAttribute('aria-orientation', position === 'bottom' ? 'horizontal' : 'vertical');
    right.setAttribute('aria-label', position === 'bottom' ? 'Resize bottom panel' : position === 'left' ? 'Resize Explorer panel' : 'Resize Context panel');
    right.setAttribute('aria-valuemin', String(position === 'bottom' ? 160 : position === 'left' ? 180 : 220));
    right.setAttribute('aria-valuemax', String(position === 'left' ? 420 : 480));
    right.setAttribute('aria-valuenow', String(position === 'bottom' ? contextHeight : widths[position === 'left' ? 'explorer' : 'context']));
    apply(); persist();
    return position;
  }
  function resetLayout() {
    widths.explorer = 240; widths.context = 300; contextHeight = 240;
    visibility.explorer = true; visibility.context = true;
    left.setAttribute('aria-valuenow', '240');
    dockContext('right');
    persist();
  }
  apply();
  dockContext(contextDock);
  activate(c.initialActivity || 'project');
  return Object.freeze({
    activate: activate,
    widths: function () { return Object.assign({}, widths); },
    setPanelVisible: setPanelVisible,
    panelVisible: panelVisible,
    dockContext: dockContext,
    contextDock: function () { return contextDock; },
    resetLayout: resetLayout
  });
}));

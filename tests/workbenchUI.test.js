'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const createWorkbenchUI = require('../src/workbenchUI.js');

function element() {
  const handlers = new Map();
  const attrs = {};
  const classes = new Set();
  const children = [];
  const styles = new Map();
  return {
    children, attrs, dataset: {},
    get firstChild() { return children[0] || null; },
    style: { setProperty(name, value) { styles.set(name, value); }, getPropertyValue(name) { return styles.get(name); } },
    classList: { add(name) { classes.add(name); }, remove(name) { classes.delete(name); }, contains(name) { return classes.has(name); } },
    setAttribute(k, v) { attrs[k] = String(v); },
    removeAttribute(k) { delete attrs[k]; },
    addEventListener(k, fn) { handlers.set(k, fn); },
    fire(k, data = {}) { handlers.get(k)?.({ preventDefault() {}, ...data }); },
    appendChild(n) { children.push(n); },
    insertBefore(n, before) {
      const i = children.indexOf(before);
      if (i < 0) children.push(n);
      else children.splice(i, 0, n);
    },
    set className(value) { value.split(/\s+/).forEach(n => classes.add(n)); },
  };
}

test('workbench mounts reusable activity rail, panels, accessible resize controls and persists width', () => {
  const layout = element(), explorer = element(), content = element(), context = element();
  layout.appendChild(explorer); layout.appendChild(content); layout.appendChild(context);
  const saved = new Map();
  const selected = [];
  const ui = createWorkbenchUI({
    document: { createElement: element }, layout, explorer, content, context,
    storage: { getItem: k => saved.get(k), setItem: (k,v) => saved.set(k,v) },
    activities: [{ id: 'documents', label: 'Documents', glyph: 'D' }],
    initialActivity: 'documents',
    onActivity: id => selected.push(id)
  });
  assert.equal(layout.children.length, 6);
  const rail = layout.children[0], button = rail.children[0];
  assert.equal(rail.attrs['aria-label'], 'Workspace activities');
  assert.equal(button.attrs['aria-current'], 'page');
  button.fire('click'); assert.deepEqual(selected, ['documents']);
  const separator = layout.children[2];
  assert.equal(separator.attrs.role, 'separator');
  separator.fire('keydown', { key: 'ArrowRight' });
  assert.equal(ui.widths().explorer, 256);
  assert.equal(JSON.parse(saved.get('cockpit-workbench-layout-v1')).explorer, 256);
  ui.activate('none');
  assert.equal(button.attrs['aria-current'], undefined);
});


test('workbench panels can be collapsed and restored independently without losing host content', () => {
  const layout = element(), explorer = element(), content = element(), context = element();
  layout.appendChild(explorer); layout.appendChild(content); layout.appendChild(context);
  const doc = { createElement: element };
  const ui = createWorkbenchUI({ document: doc, layout, explorer, content, context });
  assert.equal(ui.panelVisible('explorer'), true);
  assert.equal(ui.panelVisible('context'), true);
  assert.equal(ui.setPanelVisible('explorer', false), false);
  assert.equal(explorer.hidden, true);
  assert.equal(layout.classList.contains('explorer-hidden'), true);
  assert.equal(content.hidden, undefined);
  ui.setPanelVisible('context', false);
  assert.equal(context.hidden, true);
  assert.equal(layout.classList.contains('context-hidden'), true);
  ui.setPanelVisible('explorer', true);
  ui.setPanelVisible('context', true);
  assert.equal(explorer.hidden, false);
  assert.equal(context.hidden, false);
  assert.equal(layout.classList.contains('explorer-hidden'), false);
  assert.equal(layout.classList.contains('context-hidden'), false);
  assert.throws(() => ui.panelVisible('wrong'), /Unknown workbench panel/);
  assert.throws(() => ui.setPanelVisible('wrong', false), /Unknown workbench panel/);
});

test('context docks to bottom, resizes by keyboard, restores from storage and resets', () => {
  const saved = new Map();
  const storage = { getItem: k => saved.get(k), setItem: (k,v) => saved.set(k,v) };
  function mount() {
    const layout = element(), explorer = element(), content = element(), context = element();
    layout.appendChild(explorer); layout.appendChild(content); layout.appendChild(context);
    return { layout, explorer, context, ui: createWorkbenchUI({ document: {createElement: element}, layout, explorer, content, context, storage }) };
  }
  const first = mount();
  assert.equal(first.ui.dockContext('bottom'), 'bottom');
  const grip = first.layout.children[4];
  assert.equal(grip.attrs['aria-orientation'], 'horizontal');
  grip.fire('keydown', {key: 'ArrowUp'});
  assert.equal(first.layout.style.getPropertyValue('--cockpit-context-height'), '256px');
  first.ui.setPanelVisible('explorer', false);
  const second = mount();
  assert.equal(second.ui.contextDock(), 'bottom');
  assert.equal(second.ui.panelVisible('explorer'), false);
  assert.equal(second.layout.style.getPropertyValue('--cockpit-context-height'), '256px');
  second.ui.resetLayout();
  assert.equal(second.ui.contextDock(), 'right');
  assert.equal(second.ui.panelVisible('explorer'), true);
  assert.equal(second.layout.style.getPropertyValue('--cockpit-context-height'), '240px');
  assert.equal(second.ui.dockContext('left'), 'left');
  assert.equal(second.layout.classList.contains('context-left'), true);
  assert.equal(second.layout.children[2].attrs['aria-label'], 'Resize Context panel');
  assert.equal(second.layout.children[4].attrs['aria-label'], 'Resize Explorer panel');
  const swapped = mount();
  assert.equal(swapped.ui.contextDock(), 'left');
  swapped.ui.resetLayout();
  assert.equal(swapped.ui.contextDock(), 'right');
  assert.throws(() => second.ui.dockContext('floating'), /Unknown context dock/);
});

test('optional bottom slot stays independent of side context and persists its own height', () => {
  const saved = new Map();
  const storage = {getItem: key => saved.get(key), setItem: (key,value) => saved.set(key,value)};
  function mount() {
    const layout = element(), explorer = element(), content = element(), context = element(), bottom = element();
    layout.appendChild(explorer); layout.appendChild(content); layout.appendChild(context); layout.appendChild(bottom);
    return {layout, context, bottom, ui:createWorkbenchUI({document:{createElement:element},layout,explorer,content,context,bottom,storage})};
  }
  const first = mount();
  assert.equal(first.ui.panelVisible('bottom'), false);
  first.ui.setPanelVisible('bottom', true);
  assert.equal(first.ui.panelVisible('context'), true);
  assert.equal(first.context.hidden, false);
  assert.equal(first.layout.classList.contains('has-bottom'), true);
  const grip = first.layout.children.find(child => child.attrs['aria-label'] === 'Resize bottom panel');
  assert.equal(grip.attrs['aria-orientation'], 'horizontal');
  grip.fire('keydown',{key:'ArrowUp'});
  assert.equal(first.ui.bottomHeight(), 256);
  first.ui.setPanelVisible('context',false);
  assert.equal(first.ui.panelVisible('bottom'),true);
  const second = mount();
  assert.equal(second.ui.panelVisible('bottom'),true);
  assert.equal(second.ui.panelVisible('context'),false);
  assert.equal(second.ui.bottomHeight(),256);
  assert.throws(() => second.ui.dockContext('bottom'), /Unknown context dock/);
  second.ui.resetLayout();
  assert.equal(second.ui.panelVisible('bottom'),false);
  assert.equal(second.ui.panelVisible('context'),true);
  assert.equal(second.ui.bottomHeight(),240);
});

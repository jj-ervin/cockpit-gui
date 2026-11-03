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
    classList: { add(name) { classes.add(name); }, contains(name) { return classes.has(name); } },
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

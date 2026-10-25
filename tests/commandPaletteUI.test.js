'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const createUI = require('../src/commandPaletteUI.js');

function element(tag) {
  const handlers = {};
  return {
    tagName: tag, children: [], dataset: {}, textContent: '', disabled: false,
    type: '', value: '', checked: false, parentNode: null,
    appendChild(child) { this.children.push(child); child.parentNode = this; return child; },
    removeChild(child) { this.children.splice(this.children.indexOf(child), 1); child.parentNode = null; },
    addEventListener(name, callback) { handlers[name] = callback; },
    click() { if (handlers.click) handlers.click(); },
  };
}
function find(root, predicate) {
  if (predicate(root)) return root;
  for (const child of root.children) { const found = find(child, predicate); if (found) return found; }
  return null;
}
function setup() {
  const posted = [], root = element('div');
  const command = { id: 'demo.install', title: 'Install' };
  const catalog = { providers: [{ id: 'demo', name: 'Demo', commands: [command] }] };
  const flow = {
    select() { return { ok: true, parameterSchema: { fields: [] } }; },
    parameterize() { return { ok: true, parameters: {} }; },
    review() { return { ok: true, approved: false }; },
    approve() { return { ok: true, approved: true }; },
    invoke() { posted.push('invoked'); },
  };
  const ui = createUI({
    document: { createElement: element }, root, list: element('div'), catalog,
    host: {}, resolverFactory: () => ({ resolve: () => ({ parameterSchema: { fields: [] } }) }),
    commandInterfaceFactory: () => ({}),
    parameterInteractionFactory: () => ({ fields: () => [] }),
    reviewFactory: () => ({}), flowFactory: () => flow,
  });
  return { ui, root, posted };
}
test('unknown command does not render', () => {
  const { ui, root } = setup();
  ui.select('unknown');
  assert.equal(root.children.length, 0);
});
test('selection and review do not invoke; explicit approval does', () => {
  const { ui, root, posted } = setup();
  ui.select('demo.install');
  assert.equal(root.children.length, 1);
  const approve = find(root, n => n.textContent === 'Approve & Invoke');
  const review = find(root, n => n.textContent === 'Review');
  assert.equal(approve.disabled, true);
  assert.deepEqual(posted, []);
  review.click();
  assert.equal(approve.disabled, false);
  assert.deepEqual(posted, []);
  approve.click();
  assert.deepEqual(posted, ['invoked']);
});
test('cancel removes panel without invocation', () => {
  const { ui, root, posted } = setup();
  ui.select('demo.install');
  find(root, n => n.textContent === 'Cancel').click();
  assert.equal(root.children.length, 0);
  assert.deepEqual(posted, []);
});

test('refresh retains an active selection present in the catalog', () => {
  const { ui, root } = setup();
  ui.select('demo.install');
  assert.equal(root.children[0].dataset.commandId, 'demo.install');
  ui.refresh();
  assert.equal(root.children.length, 1);
});

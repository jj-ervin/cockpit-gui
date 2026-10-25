'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const createUI = require('../src/commandPaletteUI.js');

let activeElement = null;
function element(tag) {
  const handlers = {};
  return {
    tagName: tag, children: [], dataset: {}, textContent: '', disabled: false,
    type: '', value: '', checked: false, parentNode: null, attributes: {},
    setAttribute(name,value) { this.attributes[name]=String(value); },
    removeAttribute(name) { delete this.attributes[name]; },
    focus() { this.focused=true; activeElement=this; },
    appendChild(child) { this.children.push(child); child.parentNode = this; return child; },
    removeChild(child) { this.children.splice(this.children.indexOf(child), 1); child.parentNode = null; },
    addEventListener(name, callback) { handlers[name] = callback; },
    click() { if (handlers.click) handlers.click(); },
    keydown(key) { if (handlers.keydown) handlers.keydown({ key, preventDefault() {} }); },
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
    document: { createElement: element, get activeElement() { return activeElement; } }, root, list: element('div'), catalog,
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

test('Escape dismisses the panel and restores focus to its trigger', () => {
  const { ui, root } = setup();
  const trigger = element('button');
  const triggerParent = element('div');
  triggerParent.appendChild(trigger);
  ui.select('demo.install', trigger);
  root.children[0].keydown('Escape');
  assert.equal(root.children.length, 0);
  assert.equal(trigger.focused, true);
});

test('refresh retains an active selection present in the catalog', () => {
  const { ui, root } = setup();
  ui.select('demo.install');
  assert.equal(root.children[0].dataset.commandId, 'demo.install');
  ui.refresh();
  assert.equal(root.children.length, 1);
});

test('validation errors identify and focus the field, then recover for review', () => {
  const root = element('div');
  const request = { ok: true, parameterSchema: { fields: [{ id: 'target', label: 'Target', required: true }] } };
  const flow = {
    select() { return request; },
    parameterize(unused, values) {
      return values.target
        ? { ok: true, parameters: values }
        : { ok: false, errors: [{ field: 'target', error: 'Required.' }] };
    },
    review(unused, result) { return { ok: true, parameters: result.parameters }; },
    approve(review) { return review; },
    invoke() {},
  };
  const ui = createUI({
    document: { createElement: element, get activeElement() { return activeElement; } },
    root,
    list: element('div'),
    catalog: { providers: [{ id: 'demo', name: 'Demo', commands: [{ id: 'demo.install', title: 'Install' }] }] },
    host: {},
    resolverFactory: () => ({ resolve: () => ({ parameterSchema: request.parameterSchema }) }),
    commandInterfaceFactory: () => ({}),
    parameterInteractionFactory: schema => ({ fields: () => schema.fields || [] }),
    reviewFactory: () => ({}),
    flowFactory: () => flow,
  });

  ui.select('demo.install');
  const input = find(root, node => node.dataset.fieldId === 'target');
  const review = find(root, node => node.textContent === 'Review');
  const approve = find(root, node => node.textContent === 'Approve & Invoke');
  const status = find(root, node => node.attributes['aria-live'] === 'polite');
  review.click();
  assert.equal(root.children[0].dataset.state, 'error');
  assert.equal(status.attributes.role, 'alert');
  assert.equal(status.attributes['aria-live'], 'assertive');
  assert.equal(input.attributes['aria-invalid'], 'true');
  assert.equal(activeElement, input);
  assert.equal(approve.disabled, true);

  input.value = 'local-preview';
  review.click();
  assert.equal(root.children[0].dataset.state, 'recovery');
  assert.equal(status.attributes.role, 'status');
  assert.equal(status.attributes['aria-live'], 'polite');
  assert.equal(input.attributes['aria-invalid'], undefined);
  assert.equal(approve.disabled, false);
});

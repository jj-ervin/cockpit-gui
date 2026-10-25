'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const createWorkspaceUI = require('../src/workspaceUI.js');

let activeElement = null;
function element(tag) {
  const handlers = {};
  const classes = new Set();
  return {
    tagName: tag, children: [], dataset: {}, attributes: {}, textContent: '',
    parentNode: null, hidden: false, tabIndex: 0, type: '', id: '',
    classList: { add(...values) { values.forEach(value => classes.add(value)); }, contains(value) { return classes.has(value); } },
    set className(value) { value.split(/\s+/).filter(Boolean).forEach(name => classes.add(name)); },
    get className() { return Array.from(classes).join(' '); },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    removeAttribute(name) { delete this.attributes[name]; },
    appendChild(child) { this.children.push(child); child.parentNode = this; return child; },
    removeChild(child) { this.children.splice(this.children.indexOf(child), 1); child.parentNode = null; },
    get firstChild() { return this.children[0] || null; },
    addEventListener(name, callback) { handlers[name] = callback; },
    click() { if (handlers.click) handlers.click(); },
    keydown(key) { if (handlers.keydown) handlers.keydown({ key, preventDefault() {} }); },
    focus() { activeElement = this; },
  };
}

function find(root, predicate) {
  if (predicate(root)) return root;
  for (const child of root.children) { const result = find(child, predicate); if (result) return result; }
  return null;
}

function setup() {
  const navigationRoot = element('nav');
  const panelRoot = element('main');
  const document = { createElement: element, get activeElement() { return activeElement; } };
  const ui = createWorkspaceUI({
    document, navigationRoot, panelRoot, initialId: 'commands',
    items: [
      { id: 'overview', label: 'Overview', state: 'populated', payload: { text: 'Ready.' } },
      { id: 'commands', label: 'Commands', state: 'empty' },
      { id: 'service', label: 'Service', state: 'error', payload: { message: 'Offline.' } },
    ],
  });
  return { ui, navigationRoot, panelRoot };
}

test('navigation exposes one consistent selected tab and panel', () => {
  const { ui, navigationRoot, panelRoot } = setup();
  assert.equal(ui.activeId(), 'commands');
  assert.deepEqual(navigationRoot.children.map(tab => tab.attributes['aria-selected']), ['false', 'true', 'false']);
  assert.deepEqual(panelRoot.children.map(panel => panel.hidden), [true, false, true]);
  navigationRoot.children[2].click();
  assert.equal(ui.activeId(), 'service');
  assert.deepEqual(panelRoot.children.map(panel => panel.hidden), [true, true, false]);
});

test('arrow, Home and End keys move focus and active navigation together', () => {
  const { ui, navigationRoot } = setup();
  navigationRoot.children[1].keydown('ArrowRight');
  assert.equal(ui.activeId(), 'service');
  assert.equal(activeElement, navigationRoot.children[2]);
  navigationRoot.children[2].keydown('Home');
  assert.equal(ui.activeId(), 'overview');
  navigationRoot.children[0].keydown('End');
  assert.equal(ui.activeId(), 'service');
});

test('panel states cover populated, empty, loading, error and recovery', () => {
  const { ui } = setup();
  for (const state of ['populated', 'empty', 'loading', 'error', 'recovery']) {
    ui.setPanelState('service', state, state === 'populated' ? { text: 'Content' } : {});
    const panel = ui.panel('service');
    assert.equal(panel.dataset.state, state);
    assert.equal(panel.attributes['aria-busy'], state === 'loading' ? 'true' : 'false');
  }
});

test('error retry action can transition through loading to recovery', () => {
  const { ui } = setup();
  ui.setPanelState('service', 'error', {
    onRetry(workspace, id) {
      workspace.setPanelState(id, 'loading');
      workspace.setPanelState(id, 'recovery');
    },
  });
  const retry = find(ui.panel('service'), node => node.textContent === 'Try again');
  retry.click();
  assert.equal(ui.panel('service').dataset.state, 'recovery');
});

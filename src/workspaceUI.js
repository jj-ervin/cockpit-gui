(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.CockpitWorkspaceUI = factory;
}(typeof window !== 'undefined' ? window : globalThis, function createWorkspaceUI(options) {
  'use strict';

  const c = options || {};
  if (!c.document || !c.navigationRoot || !c.panelRoot || !Array.isArray(c.items) || !c.items.length) {
    throw new TypeError('WorkspaceUI requires document, navigationRoot, panelRoot, and at least one item');
  }

  const allowedStates = new Set(['populated', 'empty', 'loading', 'error', 'recovery']);
  const items = c.items.map(function (item) {
    if (!item || !item.id || !item.label) throw new TypeError('WorkspaceUI items require id and label');
    return item;
  });
  const records = new Map();
  let activeId = null;

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function textElement(tag, value, className) {
    const node = c.document.createElement(tag);
    node.textContent = String(value == null ? '' : value);
    if (className) node.className = className;
    return node;
  }

  function safeId(value) {
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '-');
  }

  function renderPayload(target, payload) {
    if (payload && payload.node) target.appendChild(payload.node);
    else if (payload && typeof payload.render === 'function') payload.render(target);
    else if (payload && payload.text != null) target.appendChild(textElement('p', payload.text));
  }

  function setPanelState(id, state, payload) {
    if (!allowedStates.has(state)) throw new TypeError('Unsupported panel state: ' + state);
    const record = records.get(id);
    if (!record) throw new TypeError('Unknown panel: ' + id);
    const detail = payload || {};
    record.panel.dataset.state = state;
    record.panel.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');
    clear(record.body);

    if (state === 'populated') {
      renderPayload(record.body, detail);
      return;
    }

    const stateView = c.document.createElement('div');
    stateView.className = 'cockpit-panel-state cockpit-panel-state--' + state;
    stateView.setAttribute('role', state === 'error' ? 'alert' : 'status');
    const defaults = {
      empty: ['Nothing here yet', 'This panel has no items to show.'],
      loading: ['Loading', 'Panel content is loading.'],
      error: ['Unable to load panel', 'The panel could not be loaded.'],
      recovery: ['Panel restored', 'The panel recovered and is ready to use.'],
    };
    const fallback = defaults[state];
    stateView.appendChild(textElement('h3', detail.title || fallback[0]));
    stateView.appendChild(textElement('p', detail.message || fallback[1]));
    if (state === 'loading') {
      const progress = c.document.createElement('progress');
      progress.removeAttribute('value');
      progress.setAttribute('aria-label', detail.progressLabel || 'Loading panel');
      stateView.appendChild(progress);
    }
    if ((state === 'error' || state === 'recovery') && typeof detail.onRetry === 'function') {
      const retry = textElement('button', detail.actionLabel || (state === 'error' ? 'Try again' : 'Refresh'));
      retry.type = 'button';
      retry.addEventListener('click', function () { detail.onRetry(api, id); });
      stateView.appendChild(retry);
    }
    record.body.appendChild(stateView);
  }

  function activate(id, moveFocus) {
    const next = records.get(id);
    if (!next) return false;
    records.forEach(function (record, recordId) {
      const selected = recordId === id;
      record.tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      record.tab.tabIndex = selected ? 0 : -1;
      record.panel.hidden = !selected;
    });
    activeId = id;
    if (moveFocus && typeof next.tab.focus === 'function') next.tab.focus();
    if (typeof c.onNavigate === 'function') c.onNavigate(id);
    return true;
  }

  function moveFrom(id, delta) {
    const index = items.findIndex(function (item) { return item.id === id; });
    const nextIndex = (index + delta + items.length) % items.length;
    activate(items[nextIndex].id, true);
  }

  c.navigationRoot.classList.add('cockpit-navigation');
  c.navigationRoot.setAttribute('role', 'tablist');
  c.navigationRoot.setAttribute('aria-label', c.navigationLabel || 'Workspace sections');
  c.panelRoot.classList.add('cockpit-panel-stack');

  items.forEach(function (item) {
    const id = safeId(item.id);
    const tab = textElement('button', item.label, 'cockpit-navigation__item');
    tab.type = 'button';
    tab.id = 'cockpit-tab-' + id;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', 'cockpit-panel-' + id);

    const panel = c.document.createElement('section');
    panel.id = 'cockpit-panel-' + id;
    panel.className = 'cockpit-panel';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;
    panel.appendChild(textElement('h2', item.title || item.label, 'cockpit-panel__title'));
    const body = c.document.createElement('div');
    body.className = 'cockpit-panel__body';
    panel.appendChild(body);

    records.set(item.id, { tab: tab, panel: panel, body: body });
    c.navigationRoot.appendChild(tab);
    c.panelRoot.appendChild(panel);

    tab.addEventListener('click', function () { activate(item.id, false); });
    tab.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault(); moveFrom(item.id, 1);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault(); moveFrom(item.id, -1);
      } else if (event.key === 'Home') {
        event.preventDefault(); activate(items[0].id, true);
      } else if (event.key === 'End') {
        event.preventDefault(); activate(items[items.length - 1].id, true);
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault(); activate(item.id, false);
      }
    });

    setPanelState(item.id, item.state || 'empty', item.payload || {});
  });

  const api = Object.freeze({
    activate: activate,
    activeId: function () { return activeId; },
    setPanelState: setPanelState,
    panel: function (id) { const record = records.get(id); return record ? record.panel : null; },
  });
  activate(c.initialId && records.has(c.initialId) ? c.initialId : items[0].id, false);
  return api;
}));

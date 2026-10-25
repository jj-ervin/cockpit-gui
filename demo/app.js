(function () {
  'use strict';

  const state = {
    intents: [],
    service: 'unavailable',
  };
  const eventLog = document.getElementById('event-log');
  const summary = document.getElementById('workspace-summary');
  const commandContent = document.getElementById('command-content');
  const overviewContent = document.getElementById('overview-content');
  commandContent.hidden = false;
  overviewContent.hidden = false;

  function renderSummary() {
    const intentLabel = state.intents.length === 1 ? '1 submitted intent' : state.intents.length + ' submitted intents';
    summary.textContent = intentLabel + ' · Demo service ' + state.service;
  }

  function renderEventLog() {
    eventLog.textContent = state.intents.length
      ? state.intents.map(function (intent) { return intent.message; }).join('\n')
      : 'No commands submitted.';
  }

  function renderActivity(target) {
    const list = document.createElement('ol');
    list.className = 'activity-list';
    state.intents.forEach(function (intent) {
      const item = document.createElement('li');
      const title = document.createElement('strong');
      title.textContent = intent.commandId;
      const detail = document.createElement('span');
      detail.textContent = intent.target + ' · inert demonstration intent';
      item.appendChild(title);
      item.appendChild(detail);
      list.appendChild(item);
    });
    target.appendChild(list);
  }

  function syncActivity(workspace) {
    if (state.intents.length) {
      workspace.setPanelState('activity', 'populated', { render: renderActivity });
    } else {
      workspace.setPanelState('activity', 'empty', {
        title: 'No activity yet',
        message: 'Approved host intents will appear here and in the command log.',
      });
    }
    renderEventLog();
    renderSummary();
  }

  function retryService(workspace, id) {
    state.service = 'checking';
    renderSummary();
    workspace.setPanelState(id, 'loading', { message: 'Checking the local demo…' });
    window.setTimeout(function () {
      state.service = 'ready';
      renderSummary();
      workspace.setPanelState(id, 'recovery', {
        message: 'Local-only mode is ready.',
        actionLabel: 'Check again',
        onRetry: retryService,
      });
    }, 50);
  }

  const workspace = window.CockpitWorkspaceUI({
    document: document,
    navigationRoot: document.getElementById('workspace-navigation'),
    panelRoot: document.getElementById('workspace-panels'),
    initialId: 'commands',
    items: [
      { id: 'overview', label: 'Overview', state: 'populated', payload: { node: overviewContent } },
      { id: 'commands', label: 'Commands', state: 'populated', payload: { node: commandContent } },
      { id: 'activity', label: 'Activity', state: 'empty' },
      {
        id: 'service',
        label: 'Service',
        state: 'error',
        payload: {
          title: 'Demo service unavailable',
          message: 'This inert demo has no remote service.',
          onRetry: retryService,
        },
      },
    ],
  });

  document.getElementById('clear-log').addEventListener('click', function () {
    state.intents = [];
    syncActivity(workspace);
  });

  const parameterSchema = {
    fields: [
      { id: 'target', label: 'Preview target', type: 'text', required: true },
      { id: 'dryRun', label: 'Keep as dry run', type: 'boolean' },
    ],
  };
  const catalog = {
    providers: [{
      id: 'demo',
      name: 'Demo provider',
      commands: [{ id: 'demo.preview', title: 'Create preview' }],
    }],
  };
  const flow = {
    select: function () { return { ok: true, parameterSchema: parameterSchema }; },
    parameterize: function (request, values) {
      const target = String(values.target || '').trim();
      if (!target) return { ok: false, errors: [{ field: 'target', error: 'Enter a preview target.' }] };
      return { ok: true, parameters: { target: target, dryRun: Boolean(values.dryRun) } };
    },
    review: function (request, result) {
      return {
        ok: true,
        approved: false,
        providerId: 'demo',
        commandId: 'demo.preview',
        parameters: result.parameters,
      };
    },
    approve: function (review) { return Object.assign({}, review, { approved: true }); },
    invoke: function (approved) {
      if (!approved.approved) throw new Error('approval required');
      state.intents.push({
        commandId: approved.commandId,
        target: approved.parameters.target,
        message: 'Host intent received: ' + approved.commandId + ' → ' + approved.parameters.target + ' (demo only)',
      });
      syncActivity(workspace);
    },
  };
  const ui = window.CockpitCommandPaletteUI({
    document: document,
    root: document.getElementById('palette'),
    list: document.getElementById('list'),
    catalog: catalog,
    host: {},
    resolverFactory: function () { return { resolve: function () { return { parameterSchema: parameterSchema }; } }; },
    commandInterfaceFactory: function () { return {}; },
    parameterInteractionFactory: function (schema) { return { fields: function () { return schema.fields || []; } }; },
    reviewFactory: function () { return {}; },
    flowFactory: function () { return flow; },
  });

  document.getElementById('launch').addEventListener('click', function (event) {
    ui.select('demo.preview', event.currentTarget);
  });
  syncActivity(workspace);
}());

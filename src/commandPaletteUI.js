(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.CockpitCommandPaletteUI = factory;
}(typeof window !== 'undefined' ? window : globalThis, function createCommandPaletteUI(options) {
  'use strict';

  const c = options || {};
  if (!c.document || !c.root || !c.list || !c.catalog || !c.flowFactory) {
    throw new TypeError('CommandPaletteUI requires document, root, list, catalog, and flowFactory');
  }

  let active = null;

  function textElement(tag, value) {
    const node = c.document.createElement(tag);
    node.textContent = String(value == null ? '' : value);
    return node;
  }

  function entry(id) {
    for (const provider of c.catalog.providers || []) {
      for (const command of provider.commands || []) {
        if (command && command.id === id) return { provider: provider, command: command };
      }
    }
    return null;
  }

  function close() {
    const restore = active && active.restoreFocus;
    if (active && active.panel && active.panel.parentNode) active.panel.parentNode.removeChild(active.panel);
    active = null;
    if (restore && restore.parentNode && typeof restore.focus === 'function') restore.focus();
  }

  function select(id, trigger) {
    close();
    const restoreFocus = trigger || (c.document && c.document.activeElement);
    const selected = entry(id);
    if (!selected) return;

    const resolver = c.resolverFactory(c.catalog);
    const resolved = resolver.resolve(id);
    if (!resolved) return;
    const flow = c.flowFactory({
      commandInterface: c.commandInterfaceFactory({ host: c.host, resolve: resolver.resolve }),
      parameterInteraction: c.parameterInteractionFactory(resolved.parameterSchema),
      commandReview: c.reviewFactory(),
    });
    const request = flow.select(id);
    if (!request.ok) return;

    const panel = c.document.createElement('section');
    panel.className = 'command-palette-flow';
    panel.dataset.commandId = id;
    panel.dataset.state = 'populated';
    panel.setAttribute('aria-label', 'Command review: ' + selected.command.title);
    panel.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    });
    panel.appendChild(textElement('h3', selected.provider.name + ' — ' + selected.command.title));
    panel.appendChild(textElement('p', id));

    const form = c.document.createElement('div');
    form.className = 'command-palette-form';
    const inputs = {};
    c.parameterInteractionFactory(request.parameterSchema || {}).fields().forEach(function (field) {
      const label = textElement('label', field.label || field.id);
      const input = c.document.createElement('input');
      input.dataset.fieldId = field.id;
      input.id = 'command-field-' + String(field.id).replace(/[^a-zA-Z0-9_-]/g, '-');
      input.type = field.type === 'number' ? 'number' : field.type === 'boolean' ? 'checkbox' : 'text';
      if (field.required) input.setAttribute('required', '');
      label.setAttribute('for', input.id);
      label.appendChild(input);
      form.appendChild(label);
      inputs[field.id] = input;
    });
    panel.appendChild(form);

    const status = textElement('p', 'Enter parameters, then review before invocation.');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    panel.appendChild(status);

    const actions = c.document.createElement('div');
    actions.className = 'command-palette-actions';
    const review = textElement('button', 'Review');
    review.type = 'button';
    const approve = textElement('button', 'Approve & Invoke');
    approve.type = 'button';
    approve.disabled = true;
    const cancel = textElement('button', 'Cancel');
    cancel.type = 'button';
    actions.appendChild(review);
    actions.appendChild(approve);
    actions.appendChild(cancel);
    panel.appendChild(actions);

    review.addEventListener('click', function () {
      const values = {};
      Object.keys(inputs).forEach(function (key) {
        inputs[key].removeAttribute('aria-invalid');
        values[key] = inputs[key].type === 'checkbox' ? inputs[key].checked : inputs[key].value;
      });
      const result = flow.parameterize(request, values);
      if (!result.ok) {
        const errors = Array.isArray(result.errors) ? result.errors : [];
        panel.dataset.state = 'error';
        status.setAttribute('role', 'alert');
        status.setAttribute('aria-live', 'assertive');
        status.textContent = errors.length
          ? errors.map(function (error) { return error.field + ': ' + error.error; }).join(' | ')
          : 'The command parameters could not be reviewed.';
        approve.disabled = true;
        active.reviewed = null;
        const firstInvalid = errors.map(function (error) { return inputs[error.field]; }).find(Boolean);
        errors.forEach(function (error) {
          if (inputs[error.field]) inputs[error.field].setAttribute('aria-invalid', 'true');
        });
        if (firstInvalid && typeof firstInvalid.focus === 'function') firstInvalid.focus();
        return;
      }

      panel.dataset.state = 'recovery';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      active.reviewed = flow.review(request, result);
      status.textContent = 'Review ready. Explicit approval is required before invocation.';
      approve.disabled = false;
    });

    approve.addEventListener('click', function () {
      if (!active || !active.reviewed) return;
      try {
        flow.invoke(flow.approve(active.reviewed));
      } catch (error) {
        panel.dataset.state = 'error';
        status.setAttribute('role', 'alert');
        status.setAttribute('aria-live', 'assertive');
        status.textContent = 'Invocation could not be submitted. Review the command and try again.';
        if (typeof c.onInvokeError === 'function') c.onInvokeError(error);
        return;
      }
      panel.dataset.state = 'populated';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      status.textContent = 'Invocation submitted to the existing host intent seam.';
      approve.disabled = true;
      review.disabled = true;
      if (c.onInvoke) c.onInvoke();
    });
    cancel.addEventListener('click', close);

    c.root.appendChild(panel);
    active = { panel: panel, reviewed: null, restoreFocus: restoreFocus };
    if (typeof review.focus === 'function') review.focus();
  }

  function refresh() {
    if (active && !entry(active.panel.dataset.commandId)) close();
  }

  return Object.freeze({ select: select, refresh: refresh, close: close });
}));

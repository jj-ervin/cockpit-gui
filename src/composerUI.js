(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.CockpitComposerUI = factory;
}(typeof window !== 'undefined' ? window : globalThis, function createComposerUI(options) {
  'use strict';
  const c = options || {};
  if (!c.document || !c.form || !c.input || !c.suggestions || !c.attachments || !c.fileInput) {
    throw new TypeError('ComposerUI requires document, form, input, suggestions, attachments and fileInput');
  }
  const doc = c.document;
  const files = [];
  let choices = [];
  const announce = () => c.onAttachmentsChange?.(files.slice());
  function renderFiles() {
    c.attachments.replaceChildren();
    files.forEach((file, index) => {
      const chip = doc.createElement('span');
      chip.className = 'cockpit-composer__attachment';
      const name = doc.createElement('span');
      name.textContent = `${file.name} (${Math.ceil(file.size / 1024)} KB)`;
      const remove = doc.createElement('button');
      remove.type = 'button';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `Remove ${file.name}`);
      remove.addEventListener('click', () => {
        files.splice(index, 1);
        renderFiles();
        announce();
        c.input.focus();
      });
      chip.append(name, remove);
      c.attachments.append(chip);
    });
  }
  function clearSuggestions() {
    choices = [];
    c.suggestions.replaceChildren();
  }
  function choose(index) {
    const choice = choices[index];
    if (!choice) return;
    c.input.value = c.input.value.replace(/(?:^|\s)[#@/][^\s]*$/, match =>
      (match.startsWith(' ') ? ' ' : '') + choice + ' ');
    clearSuggestions();
    c.input.focus();
  }
  function renderSuggestions() {
    const match = c.input.value.match(/(?:^|\s)([#@/])([^\s]*)$/);
    const candidates = match && typeof c.getSuggestions === 'function'
      ? c.getSuggestions(match[1], match[2]) : [];
    choices = Array.isArray(candidates) ? candidates.filter(value => typeof value === 'string').slice(0, 6) : [];
    c.suggestions.replaceChildren();
    choices.forEach((value, index) => {
      const button = doc.createElement('button');
      button.type = 'button';
      button.textContent = value;
      button.addEventListener('click', () => choose(index));
      c.suggestions.append(button);
    });
  }
  c.fileInput.addEventListener('change', event => {
    files.push(...event.target.files);
    event.target.value = '';
    renderFiles();
    announce();
  });
  c.input.addEventListener('input', renderSuggestions);
  c.input.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' && choices.length) {
      event.preventDefault();
      c.suggestions.querySelector('button')?.focus();
    } else if (event.key === 'Escape') clearSuggestions();
    else if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      c.form.requestSubmit();
    }
  });
  c.suggestions.addEventListener('keydown', event => {
    const buttons = [...c.suggestions.querySelectorAll('button')];
    const index = buttons.indexOf(doc.activeElement);
    if (event.key === 'ArrowDown' && buttons.length) {
      event.preventDefault(); buttons[(index + 1) % buttons.length].focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault(); (index <= 0 ? c.input : buttons[index - 1]).focus();
    } else if (event.key === 'Escape') {
      event.preventDefault(); clearSuggestions(); c.input.focus();
    }
  });
  c.form.addEventListener('submit', clearSuggestions);
  return Object.freeze({ files: () => files.slice(), clearSuggestions, clearAttachments: () => {
    files.length = 0; renderFiles(); announce();
  }});
}));

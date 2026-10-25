'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');

test('real Chromium loads UMD GUI, preserves review gate, invokes only after explicit approval', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<main id="root"></main><div id="list"></div>');
    await page.addScriptTag({ path: path.resolve(__dirname, '../src/commandPaletteUI.js') });
    const result = await page.evaluate(() => {
      const invoked = [];
      const catalog = { providers: [{ id: 'demo', name: 'Demo', commands: [{ id: 'demo.run', title: 'Run' }] }] };
      const flow = {
        select: () => ({ ok: true, parameterSchema: {} }),
        parameterize: () => ({ ok: true, parameters: {} }),
        review: () => ({ ok: true, approved: false }),
        approve: () => ({ ok: true, approved: true }),
        invoke: () => invoked.push('host-intent'),
      };
      const ui = window.CockpitCommandPaletteUI({
        document,
        root: document.querySelector('#root'),
        list: document.querySelector('#list'),
        catalog,
        host: {},
        resolverFactory: () => ({ resolve: () => ({ parameterSchema: {} }) }),
        commandInterfaceFactory: () => ({}),
        parameterInteractionFactory: () => ({ fields: () => [] }),
        reviewFactory: () => ({}),
        flowFactory: () => flow,
      });
      ui.select('demo.run');
      const buttons = Array.from(document.querySelectorAll('button'));
      const review = buttons.find(b => b.textContent === 'Review');
      const approve = buttons.find(b => b.textContent === 'Approve & Invoke');
      const before = { rendered: Boolean(document.querySelector('.command-palette-flow')), disabled: approve.disabled, invoked: invoked.length };
      ui.refresh();
      const afterRefresh = Boolean(document.querySelector('.command-palette-flow'));
      review.click();
      const afterReview = { disabled: approve.disabled, invoked: invoked.length };
      approve.click();
      return { before, afterRefresh, afterReview, afterApprove: invoked.length };
    });
    assert.deepEqual(result, {
      before: { rendered: true, disabled: true, invoked: 0 },
      afterRefresh: true,
      afterReview: { disabled: false, invoked: 0 },
      afterApprove: 1,
    });
  } finally {
    await browser.close();
  }
});

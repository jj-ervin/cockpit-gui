'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const browserType = require('playwright')[process.env.CKP_BROWSER || 'chromium'];

const demoUrl = pathToFileURL(path.resolve(__dirname, '../demo/index.html')).href;

async function withDemo(viewport, run) {
  const browser = await browserType.launch({ headless: true });
  try {
    const page = await browser.newPage(viewport ? { viewport: viewport } : {});
    await page.goto(demoUrl);
    await run(page);
  } finally {
    await browser.close();
  }
}

async function submitPreview(page, target) {
  await page.getByRole('button', { name: 'Create local preview' }).click();
  await page.getByLabel('Preview target').fill(target);
  await page.getByRole('button', { name: 'Review', exact: true }).click();
  await page.getByRole('button', { name: 'Approve & Invoke' }).click();
}

test('validated command recovers from input error and updates shared activity state', async () => {
  await withDemo(null, async page => {
    await page.getByRole('button', { name: 'Create local preview' }).click();
    const review = page.getByRole('button', { name: 'Review', exact: true });
    const approve = page.getByRole('button', { name: 'Approve & Invoke' });
    const target = page.getByLabel('Preview target');
    assert.equal(await review.evaluate(element => document.activeElement === element), true);
    assert.equal(await approve.isDisabled(), true);

    await review.click();
    assert.match(await page.getByRole('alert').innerText(), /Enter a preview target/);
    assert.equal(await target.getAttribute('aria-invalid'), 'true');
    assert.equal(await target.evaluate(element => document.activeElement === element), true);

    await target.fill('workspace-a');
    await review.click();
    assert.equal(await page.locator('.command-palette-flow').getAttribute('data-state'), 'recovery');
    assert.equal(await target.getAttribute('aria-invalid'), null);
    assert.equal(await approve.isEnabled(), true);
    await approve.click();
    assert.match(await page.locator('#event-log').innerText(), /demo\.preview → workspace-a/);

    await page.getByRole('tab', { name: 'Activity' }).click();
    assert.equal(await page.getByRole('tabpanel').getAttribute('data-state'), 'populated');
    assert.match(await page.getByRole('tabpanel').innerText(), /workspace-a · inert demonstration intent/);
  });
});

test('clearing the command log returns the shared Activity panel to empty', async () => {
  await withDemo(null, async page => {
    await submitPreview(page, 'workspace-b');
    await page.getByRole('button', { name: 'Clear intent log' }).click();
    assert.equal(await page.locator('#event-log').innerText(), 'No commands submitted.');
    await page.getByRole('tab', { name: 'Activity' }).click();
    assert.equal(await page.getByRole('tabpanel').getAttribute('data-state'), 'empty');
    assert.match(await page.getByRole('status').innerText(), /No activity yet/);
  });
});

test('service error retry announces loading and reaches a repeatable recovery state', async () => {
  await withDemo(null, async page => {
    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now() + 60_000));
    await page.getByRole('tab', { name: 'Service' }).click();
    assert.match(await page.getByRole('alert').innerText(), /Demo service unavailable/);
    await page.getByRole('button', { name: 'Try again' }).click();
    assert.equal(await page.getByRole('tabpanel').getAttribute('data-state'), 'loading');
    assert.equal(await page.getByRole('tabpanel').getAttribute('aria-busy'), 'true');
    await page.clock.runFor(60);
    await page.waitForSelector('.cockpit-panel[data-state="recovery"]');
    assert.match(await page.getByRole('status').innerText(), /Local-only mode is ready/);
    await page.getByRole('button', { name: 'Check again' }).click();
    assert.equal(await page.getByRole('tabpanel').getAttribute('data-state'), 'loading');
    await page.clock.runFor(60);
    await page.waitForSelector('.cockpit-panel[data-state="recovery"]');
    assert.equal(await page.getByRole('tabpanel').getAttribute('aria-busy'), 'false');
  });
});

test('keyboard navigation and Escape preserve focus and avoid state mutation', async () => {
  await withDemo(null, async page => {
    const commands = page.getByRole('tab', { name: 'Commands' });
    await commands.focus();
    await commands.press('ArrowRight');
    const activity = page.getByRole('tab', { name: 'Activity' });
    assert.equal(await activity.getAttribute('aria-selected'), 'true');
    assert.equal(await activity.evaluate(element => document.activeElement === element), true);
    await activity.press('Home');
    assert.equal(await page.getByRole('tab', { name: 'Overview' }).getAttribute('aria-selected'), 'true');
    await page.getByRole('tab', { name: 'Commands' }).click();

    const launch = page.getByRole('button', { name: 'Create local preview' });
    await launch.click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.command-palette-flow').count(), 0);
    assert.equal(await launch.evaluate(element => document.activeElement === element), true);
    assert.equal(await page.locator('#event-log').innerText(), 'No commands submitted.');
  });
});

test('responsive layouts contain overflow at phone, tablet and desktop widths', async () => {
  for (const viewport of [
    { width: 360, height: 760 },
    { width: 768, height: 900 },
    { width: 1280, height: 900 },
  ]) {
    await withDemo(viewport, async page => {
      await page.getByRole('tab', { name: 'Overview' }).click();
      const sizing = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: innerWidth,
        overflowScroll: document.querySelector('.cockpit-overflow').scrollWidth,
        overflowClient: document.querySelector('.cockpit-overflow').clientWidth,
        columns: getComputedStyle(document.querySelector('.cockpit-shell')).gridTemplateColumns,
        navigationDirection: getComputedStyle(document.querySelector('.cockpit-navigation')).flexDirection,
      }));
      assert.equal(sizing.documentWidth <= sizing.viewportWidth, true, 'document overflow at ' + viewport.width + 'px');
      assert.equal(sizing.overflowScroll >= sizing.overflowClient, true, 'invalid overflow sizing at ' + viewport.width + 'px');
      if (viewport.width <= 640) {
        assert.equal(sizing.overflowScroll > sizing.overflowClient, true, 'contained overflow absent at ' + viewport.width + 'px');
        assert.equal(sizing.columns.split(' ').length, 1);
        assert.equal(sizing.navigationDirection, 'row');
      } else {
        assert.equal(sizing.columns.split(' ').length, 2);
        assert.equal(sizing.navigationDirection, 'column');
      }
    });
  }
});

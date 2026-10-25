'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const browserType = require('playwright')[process.env.CKP_BROWSER || 'chromium'];
const axePath = require.resolve('axe-core');
const demoUrl = pathToFileURL(path.resolve(__dirname, '../demo/index.html')).href;
const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function withDemo(viewport, run) {
  const browser = await browserType.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: viewport || { width: 1280, height: 900 } });
    await page.goto(demoUrl);
    await run(page);
  } finally {
    await browser.close();
  }
}

async function auditWCAG(page, state) {
  await page.addScriptTag({ path: axePath });
  const result = await page.evaluate(async tags => {
    const audit = await axe.run(document, { runOnly: { type: 'tag', values: tags } });
    return {
      violations: audit.violations.map(item => ({
        id: item.id,
        impact: item.impact,
        targets: item.nodes.map(node => node.target),
      })),
      passes: audit.passes.length,
      incomplete: audit.incomplete.length,
    };
  }, wcagTags);
  assert.deepEqual(result.violations, [], state + ' WCAG 2.2 AA axe violations');
  return result;
}

test('axe WCAG 2.2 AA audits the initial, error, recovery and submitted states', async () => {
  await withDemo(null, async page => {
    const audits = [];
    audits.push(await auditWCAG(page, 'initial'));

    await page.getByRole('button', { name: 'Create local preview' }).click();
    await page.getByRole('button', { name: 'Review', exact: true }).click();
    audits.push(await auditWCAG(page, 'input error'));

    await page.getByLabel('Preview target').fill('workspace-a');
    await page.getByRole('button', { name: 'Review', exact: true }).click();
    audits.push(await auditWCAG(page, 'review recovery'));

    await page.getByRole('button', { name: 'Approve & Invoke' }).click();
    audits.push(await auditWCAG(page, 'submitted'));

    await page.getByRole('tab', { name: 'Service' }).click();
    audits.push(await auditWCAG(page, 'service error'));
    await page.getByRole('button', { name: 'Try again' }).click();
    await page.waitForSelector('.cockpit-panel[data-state="recovery"]');
    audits.push(await auditWCAG(page, 'service recovery'));

    assert.equal(audits.length, 6);
  });
});

test('tab and panel semantics expose one selected, named and connected tab', async () => {
  await withDemo(null, async page => {
    const tabs = page.getByRole('tab');
    assert.equal(await tabs.count(), 4);
    assert.equal(await page.getByRole('tablist', { name: 'Workspace sections' }).count(), 1);
    assert.equal(await page.getByRole('tabpanel').count(), 1);

    const relationships = await tabs.evaluateAll(nodes => nodes.map(tab => {
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      return {
        name: tab.textContent.trim(),
        selected: tab.getAttribute('aria-selected'),
        tabIndex: tab.tabIndex,
        panelRole: panel && panel.getAttribute('role'),
        panelLabelledBy: panel && panel.getAttribute('aria-labelledby'),
        tabId: tab.id,
      };
    }));
    assert.equal(relationships.filter(item => item.selected === 'true').length, 1);
    assert.equal(relationships.filter(item => item.tabIndex === 0).length, 1);
    for (const item of relationships) {
      assert.equal(item.panelRole, 'tabpanel', item.name + ' panel role');
      assert.equal(item.panelLabelledBy, item.tabId, item.name + ' panel accessible name');
    }

    const commands = page.getByRole('tab', { name: 'Commands' });
    await commands.focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.getByRole('tab', { name: 'Activity' }).getAttribute('aria-selected'), 'true');
    await page.keyboard.press('Home');
    assert.equal(await page.getByRole('tab', { name: 'Overview' }).getAttribute('aria-selected'), 'true');
    await page.keyboard.press('End');
    assert.equal(await page.getByRole('tab', { name: 'Service' }).getAttribute('aria-selected'), 'true');
  });
});

test('error recovery and approval keep keyboard focus and accessible status', async () => {
  await withDemo(null, async page => {
    const launch = page.getByRole('button', { name: 'Create local preview' });
    await launch.click();
    const review = page.getByRole('button', { name: 'Review', exact: true });
    const target = page.getByLabel('Preview target');
    const approve = page.getByRole('button', { name: 'Approve & Invoke' });

    assert.equal(await review.evaluate(element => document.activeElement === element), true);
    assert.equal(await approve.isDisabled(), true);
    await review.click();
    assert.equal(await target.getAttribute('aria-invalid'), 'true');
    assert.equal(await target.evaluate(element => document.activeElement === element), true);
    assert.match(await page.getByRole('alert').innerText(), /Enter a preview target/);

    await target.fill('workspace-a');
    await review.click();
    assert.equal(await target.getAttribute('aria-invalid'), null);
    assert.match(await page.locator('.command-palette-flow [role="status"]').innerText(), /Explicit approval is required/);
    assert.equal(await approve.isEnabled(), true);
    assert.equal(await page.locator('#event-log').innerText(), 'No commands submitted.');

    await review.focus();
    await page.keyboard.press('Escape');
    assert.equal(await launch.evaluate(element => document.activeElement === element), true);
    assert.equal(await page.locator('#event-log').innerText(), 'No commands submitted.');
  });
});

test('forced-colors mode preserves a visible keyboard focus indicator', async () => {
  await withDemo({ width: 1280, height: 900 }, async page => {
    await page.emulateMedia({ forcedColors: 'active' });
    const commands = page.getByRole('tab', { name: 'Commands' });
    await commands.focus();
    const colors = await commands.evaluate(element => {
      const style = getComputedStyle(element);
      const root = getComputedStyle(document.documentElement);
      function rgb(value) {
        const parts = value.match(/[\d.]+/g).map(Number);
        return parts.slice(0, 3).map(channel => {
          const normalized = channel / 255;
          return normalized <= 0.04045 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
        });
      }
      function ratio(foreground, background) {
        const luminance = color => 0.2126 * color[0] + 0.7152 * color[1] + 0.0722 * color[2];
        const values = [luminance(rgb(foreground)), luminance(rgb(background))].sort((a, b) => b - a);
        return (values[0] + 0.05) / (values[1] + 0.05);
      }
      return {
        forcedColors: matchMedia('(forced-colors: active)').matches,
        outlineStyle: style.outlineStyle,
        outlineWidth: parseFloat(style.outlineWidth),
        outlineColor: style.outlineColor,
        textContrast: ratio(getComputedStyle(document.body).color, root.backgroundColor),
        focusContrast: ratio(style.outlineColor, root.backgroundColor),
      };
    });
    assert.equal(colors.forcedColors, true);
    assert.notEqual(colors.outlineStyle, 'none');
    assert.ok(colors.outlineWidth >= 2, 'focus indicator is at least 2 CSS pixels');
    assert.ok(colors.textContrast >= 4.5, 'forced-colors body text reaches 4.5:1 contrast');
    assert.ok(colors.focusContrast >= 3, 'forced-colors focus indicator reaches 3:1 contrast');
  });
});

test('320 CSS pixel reflow, mobile tab discoverability and touch targets', async () => {
  await withDemo({ width: 320, height: 800 }, async page => {
    const layout = await page.evaluate(() => {
      const navigation = document.querySelector('[role="tablist"]');
      return {
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        tabClient: navigation.clientWidth,
        tabScroll: navigation.scrollWidth,
        targets: [...document.querySelectorAll('button, input, [role="tab"]')]
          .filter(element => element.getClientRects().length)
          .map(element => ({
            label: element.textContent.trim() || element.getAttribute('aria-label') || element.id,
            width: element.getBoundingClientRect().width,
            height: element.getBoundingClientRect().height,
          })),
      };
    });
    assert.equal(layout.viewport, 320);
    assert.ok(layout.document <= layout.viewport, 'reflow avoids document-level horizontal scrolling');
    assert.ok(layout.tabScroll > layout.tabClient, 'mobile tab row is discoverably scrollable');
    for (const target of layout.targets) {
      assert.ok(target.width >= 24 && target.height >= 24, target.label + ' touch target is at least 24 by 24 CSS pixels');
    }

    const service = page.getByRole('tab', { name: 'Service' });
    await page.getByRole('tab', { name: 'Commands' }).focus();
    await page.keyboard.press('End');
    const visible = await page.evaluate(() => {
      const navigation = document.querySelector('[role="tablist"]');
      const tab = document.querySelector('#cockpit-tab-service');
      const nav = navigation.getBoundingClientRect();
      const item = tab.getBoundingClientRect();
      const visibleLeft = nav.left + navigation.clientLeft;
      const visibleRight = visibleLeft + navigation.clientWidth;
      return {
        scrollLeft: navigation.scrollLeft,
        visibleLeft,
        visibleRight,
        tabLeft: item.left,
        tabRight: item.right,
        visible: item.left >= visibleLeft && item.right <= visibleRight,
        active: document.activeElement === tab,
      };
    });
    assert.ok(visible.scrollLeft > 0, 'keyboard focus scrolls the tab strip');
    assert.equal(visible.visible, true, 'focused Service tab is fully visible: ' + JSON.stringify(visible));
    assert.equal(visible.active, true);

    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    const reflow = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    assert.ok(reflow.scroll <= reflow.width, '200 percent text resizing preserves reflow');
    await service.focus();
  });
});

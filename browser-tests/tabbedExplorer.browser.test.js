'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const browserType = require('playwright')[process.env.CKP_BROWSER || 'chromium'];

test('host-neutral Explorer preserves view state, navigates a tree, and keeps unavailable providers explicit', async () => {
  const browser = await browserType.launch({headless:true});
  try {
    const page = await browser.newPage({viewport:{width:390,height:844}});
    await page.setContent('<!doctype html><html lang="en" data-cockpit-theme="light"><head><title>Explorer check</title></head><body><main><div id="explorer"></div></main></body></html>');
    await page.addStyleTag({path:path.resolve(__dirname,'../src/cockpitGUI.css')});
    await page.addScriptTag({path:path.resolve(__dirname,'../src/tabbedExplorerUI.js')});
    await page.evaluate(() => {
      const values = new Map(), opened = [];
      window.explorerTest = {opened,ui:window.CockpitTabbedExplorerUI({
        document,root:document.getElementById('explorer'),storage:{getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)},
        tabs:[
          {id:'projects',label:'Projects',icon:'▤',provider:{getNodes:() => [
            {id:'z',label:'Zulu',children:[{id:'child',label:'Note <script>',kind:'note'}]},
            {id:'a',label:'Alpha'}
          ],open:node=>opened.push(node.id)}},
          {id:'git',label:'Git',icon:'⑂',unavailableMessage:'Git is not connected.'}
        ]
      })};
    });
    const root = page.locator('#explorer');
    assert.deepEqual(await root.getByRole('treeitem').allTextContents(),['·Alpha','▸Zulu']);
    await root.getByRole('button',{name:'Expand Zulu in Explorer'}).click();
    assert.equal(await root.getByRole('treeitem',{name:'Note <script>'}).count(),1);
    await root.getByRole('treeitem',{name:'Zulu'}).focus();
    await page.keyboard.press('ArrowDown');
    assert.equal(await root.getByRole('treeitem',{name:'Note <script>'}).evaluate(node => document.activeElement === node),true);
    await page.keyboard.press('ArrowLeft');
    assert.equal(await root.getByRole('treeitem',{name:'Zulu'}).evaluate(node => document.activeElement === node),true);
    assert.equal(await page.evaluate(() => window.bad),undefined);
    await root.getByRole('treeitem',{name:'Note <script>'}).click();
    assert.deepEqual(await page.evaluate(() => window.explorerTest.opened),['child']);
    await root.getByRole('searchbox',{name:'Filter Projects'}).fill('Note');
    assert.equal(await root.getByRole('treeitem').count(),2);
    await root.getByRole('tab',{name:'Git'}).click();
    assert.match(await root.getByRole('status').textContent(),/not connected/);
    await root.getByRole('tab',{name:'Projects'}).click();
    assert.equal(await root.getByRole('searchbox',{name:'Filter Projects'}).inputValue(),'Note');
    await root.getByRole('combobox',{name:'Sort Projects'}).selectOption('name-desc');
    await root.getByRole('searchbox',{name:'Filter Projects'}).fill('');
    assert.equal(await root.getByRole('treeitem').first().getAttribute('aria-label'),null);
    assert.equal(await root.getByRole('treeitem').first().textContent().then(text=>text.includes('Zulu')),true);
    await root.getByLabel('Customize Explorer tabs').click();
    await root.getByRole('checkbox',{name:'Show Git tab'}).uncheck();
    assert.equal(await root.getByRole('tab',{name:'Git'}).count(),0);
    const axePath = require.resolve('axe-core');
    await page.addScriptTag({path:axePath});
    const violations = await page.evaluate(async () => (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}})).violations.map(v=>v.id));
    assert.deepEqual(violations,[]);
  } finally { await browser.close(); }
});

'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
test('standalone demo opens, reviews and submits inert host intent',async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage();
    await page.goto(pathToFileURL(path.resolve(__dirname,'../demo/index.html')).href);
    await page.getByRole('button',{name:'Open demo command'}).click();
    const approve=page.getByRole('button',{name:'Approve & Invoke'});
    assert.equal(await page.getByRole('button',{name:'Review',exact:true}).evaluate(el => document.activeElement === el),true);
    assert.equal(await page.locator('.command-palette-flow [role="status"]').count(),1);
    assert.equal(await approve.isDisabled(),true);
    assert.match(await page.locator('#event-log').innerText(),/No commands submitted/);
    await page.getByRole('button',{name:'Review',exact:true}).click();
    assert.equal(await approve.isEnabled(),true);
    await approve.click();
    assert.match(await page.locator('#event-log').innerText(),/Host intent received: demo.preview/);
    await page.getByRole('button',{name:'Clear intent log'}).click();
    assert.equal(await page.locator('#event-log').innerText(),'No commands submitted.');
    await page.getByRole('button',{name:'Cancel'}).click();
    assert.equal(await page.getByRole('button',{name:'Open demo command'}).evaluate(el => document.activeElement === el),true);
  }finally{await browser.close();}
});

test('workspace navigation, panel states and narrow overflow remain usable', async () => {
  const browser=await chromium.launch({headless:true});
  try {
    const page=await browser.newPage({viewport:{width:360,height:760}});
    await page.goto(pathToFileURL(path.resolve(__dirname,'../demo/index.html')).href);
    const tabs=page.getByRole('tab');
    assert.deepEqual(await tabs.evaluateAll(nodes => nodes.map(node => [node.textContent,node.getAttribute('aria-selected'),node.tabIndex])),[
      ['Overview','false',-1],['Commands','true',0],['Activity','false',-1],['Service','false',-1],
    ]);
    await page.getByRole('tab',{name:'Commands'}).press('ArrowRight');
    assert.equal(await page.getByRole('tab',{name:'Activity'}).getAttribute('aria-selected'),'true');
    assert.match(await page.getByRole('tabpanel').innerText(),/No activity yet/);
    await page.getByRole('tab',{name:'Activity'}).press('End');
    assert.equal(await page.getByRole('tab',{name:'Service'}).getAttribute('aria-selected'),'true');
    assert.match(await page.getByRole('alert').innerText(),/Demo service unavailable/);
    await page.getByRole('button',{name:'Try again'}).click();
    await page.waitForSelector('.cockpit-panel[data-state="recovery"]');
    assert.match(await page.getByRole('status').innerText(),/Local-only mode is ready/);
    await page.getByRole('tab',{name:'Overview'}).click();
    const sizing=await page.evaluate(() => ({documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,overflowScroll:document.querySelector('.cockpit-overflow').scrollWidth,overflowClient:document.querySelector('.cockpit-overflow').clientWidth,columns:getComputedStyle(document.querySelector('.cockpit-shell')).gridTemplateColumns}));
    assert.equal(sizing.documentWidth<=sizing.viewportWidth,true);
    assert.equal(sizing.overflowScroll>sizing.overflowClient,true);
    assert.equal(sizing.columns.split(' ').length,1);
  } finally { await browser.close(); }
});

test('Escape dismisses the command review without submitting', async () => {
  const browser=await chromium.launch({headless:true});
  try {
    const page=await browser.newPage();
    await page.goto(pathToFileURL(path.resolve(__dirname,'../demo/index.html')).href);
    await page.getByRole('button',{name:'Open demo command'}).click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.command-palette-flow').count(),0);
    assert.equal(await page.locator('#event-log').innerText(),'No commands submitted.');
  } finally { await browser.close(); }
});

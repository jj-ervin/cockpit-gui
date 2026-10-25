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
    assert.equal(await approve.isDisabled(),true);
    assert.match(await page.locator('#event-log').innerText(),/No commands submitted/);
    await page.getByRole('button',{name:'Review',exact:true}).click();
    assert.equal(await approve.isEnabled(),true);
    await approve.click();
    assert.match(await page.locator('#event-log').innerText(),/Host intent received: demo.preview/);
  }finally{await browser.close();}
});

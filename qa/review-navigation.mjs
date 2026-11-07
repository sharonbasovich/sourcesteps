import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {startServer} from './server.mjs';
import {mkdir} from 'node:fs/promises';
const {server,origin}=await startServer(process.env.SOURCESTEPS_REVIEW_QA_PORT||15173);let browser;const results=[];
try{
 browser=await chromium.launch({channel:process.env.SOURCESTEPS_BROWSER||'chrome'});
 for(const width of [1280,390,320]){
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});const page=await context.newPage();page.setDefaultTimeout(7000);page.setDefaultNavigationTimeout(30000);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto(origin);await page.locator('#source').fill('Keep context.\nRepeated instruction.\nRepeated instruction.\nAsk the teacher.');await page.locator('#apply-source').click();
 await page.locator('#label-0').selectOption('reference');await page.locator('#label-2').selectOption('action');await page.locator('#label-3').selectOption('unclear');
 const focus=await page.locator('#focus-content').innerText();
 await page.locator('#review-next').click();assert.equal(await page.locator('#label-1').evaluate(e=>e===document.activeElement),true);
 await page.locator('#label-1').selectOption('reference');await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Read piece from start');await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Next piece needing review');await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'label-3');
 await page.locator('#piece-3').getByRole('button',{name:'Next piece needing review',exact:true}).click();assert.equal(await page.evaluate(()=>document.activeElement.id),'label-3');assert.equal(await page.locator('#focus-content').innerText(),focus.replace('1 unreviewed','0 unreviewed'));
 await page.locator('#source').fill('Draft not applied');await page.locator('#review-unclear').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'label-3');assert.equal(await page.locator('#context').textContent(),'Keep context.\nRepeated instruction.\nRepeated instruction.\nAsk the teacher.');
 await page.locator('#discard-source').click();await page.locator('#label-3').selectOption('reference');assert.equal(await page.locator('#review-next').isDisabled(),true);assert.match(await page.locator('#review-guidance').innerText(),/not an assignment-complete/);
 await page.locator('#label-1').selectOption('unclear');await page.locator('#review-unclear').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'label-1');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await mkdir('qa/evidence',{recursive:true});await page.screenshot({path:`qa/evidence/review-navigation-${width}.png`,fullPage:true});assert.deepEqual(errors,[]);results.push({width,status:'passed'});await context.close();
 }
 for(const width of [390,320]){const context=await browser.newContext({viewport:{width,height:844}});const page=await context.newPage();page.setDefaultTimeout(7000);page.setDefaultNavigationTimeout(30000);page.on('dialog',d=>d.accept());await page.goto(origin);const long='Start of the original instruction. '+('Keep every word in view. '.repeat(200));await page.locator('#source').fill(long);await page.locator('#apply-source').click();await page.locator('#review-next').click();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Read piece from start');await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'piece-title-0');const heading=await page.locator('#piece-title-0').boundingBox();assert.ok(heading.y>=0&&heading.y<844);await page.screenshot({path:`qa/evidence/review-long-start-${width}.png`});await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'label-0');assert.equal(await page.locator('#context').textContent(),long);await context.close();results.push({name:'long piece start and return',width,status:'passed'});}
 console.log(JSON.stringify(results));
}finally{await browser?.close();server.kill();}


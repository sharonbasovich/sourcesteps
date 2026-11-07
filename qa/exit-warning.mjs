import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {startServer} from './server.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {create,label,toggle,sample,serialize} from '../core.js';
import {withDialog} from './dialog.mjs';
import assert from 'node:assert/strict';

const output=new URL('./evidence/exit/',import.meta.url);await mkdir(output,{recursive:true});
const {server,origin}=await startServer(14173);
const results=[];let browser;
async function snapshot(page){return page.evaluate(()=>({source:document.querySelector('#context').textContent,draft:document.querySelector('#source').value,labels:[...document.querySelectorAll('#segments select')].map(e=>e.value),focus:document.querySelector('#focus-content').textContent,checked:[...document.querySelectorAll('#focus-content input')].map(e=>e.checked),summary:document.querySelector('#summary').textContent}));}
async function warning(page,expected){assert.equal(await page.locator('#exit-warning').isVisible(),expected);}
async function reload(page,action){
 let count=0;const seen=d=>{assert.equal(d.type(),'beforeunload');count++;};page.on('dialog',seen);
 try{await withDialog(page,action,()=>page.reload({timeout:2000}).catch(error=>{if(action!=='dismiss'||count!==1||!/ERR_ABORTED|Timeout/.test(error.message))throw error;}));assert.equal(count,1);}finally{page.off('dialog',seen);}
}
async function cleanReload(page){const dialogs=[];const handler=async d=>{dialogs.push(d.type());await d.accept();};page.on('dialog',handler);try{await page.reload();assert.deepEqual(dialogs,[]);}finally{page.off('dialog',handler);}}
async function imported(page,state,answer='accept'){
 await withDialog(page,answer,()=>page.locator('#import').setInputFiles({name:'synthetic.json',mimeType:'application/json',buffer:Buffer.from(serialize(state))}));
 if(answer==='accept')await page.waitForFunction(s=>document.querySelector('#context').textContent===s,state.source);
}
async function confirm(page,id,answer='accept'){await withDialog(page,answer,()=>page.locator('#'+id).click());}
async function run(name,fn,options={}){
 const context=await browser.newContext({viewport:{width:1280,height:900},...options});const page=await context.newPage();page.setDefaultTimeout(7000);
 // Navigation can be slower on shared runners; keep the action budget separate.
 page.setDefaultNavigationTimeout(30000);
 const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(origin)&&!r.url().startsWith('blob:'))external.push(r.url());});
 try{await page.goto(origin);await fn(page);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);results.push({name,status:'passed'});console.log('PASS '+name);}finally{await context.close();}
}
try{
 browser=await chromium.launch({channel:process.env.SOURCESTEPS_BROWSER||'chrome',headless:process.env.HEADED!=='1'});
 await run('unchanged sample and focus/details alone reload without warning',async page=>{
  await page.locator('#source').click();await page.locator('summary').first().click();await warning(page,false);await cleanReload(page);
  const state=create('Read\nWrite');label(state,0,'action');label(state,1,'action');await imported(page,state);
  await page.getByRole('button',{name:'Next action',exact:true}).click();await page.getByRole('button',{name:'Back to source piece',exact:true}).click();await warning(page,false);await cleanReload(page);
 });
 await run('Cancel preserves review, draft, selected action and usable focus; Leave reloads',async page=>{
  await page.locator('#label-0').selectOption('action');await page.locator('#label-1').selectOption('action');await page.locator('#piece-1').getByRole('button',{name:'Focus this action',exact:true}).click();await page.getByRole('checkbox').check();await page.locator('#source').fill('Unapplied 🧠 café\nDraft');
  const before=await snapshot(page);await warning(page,true);await reload(page,'dismiss');assert.deepEqual(await snapshot(page),before);
  await page.getByRole('button',{name:'Back to source piece',exact:true}).click();assert.equal(await page.evaluate(()=>document.activeElement.id),'label-1');await page.getByRole('checkbox').uncheck();await page.getByRole('checkbox').check();
  await page.screenshot({path:fileURLToPath(new URL('desktop-warning.png',output)),fullPage:true});
  await reload(page,'accept');assert.equal(await page.locator('#context').textContent(),sample);assert.equal(await page.locator('#label-0').inputValue(),'unreviewed');await warning(page,false);
 });
 await run('draft only warning reverts and discards cleanly through repeated cycles',async page=>{
  for(let i=0;i<3;i++){await page.locator('#source').fill(sample+' ');await warning(page,true);await reload(page,'dismiss');await page.locator('#source').fill(sample);await warning(page,false);await page.locator('#source').fill('Draft');await page.locator('#discard-source').click();await warning(page,false);await cleanReload(page);}
 });
 await run('exact imported CRLF Unicode maps, normalized drafts and export initiation',async page=>{
  const source='Read 🧠 café é 中文\r\nWrite 🧠\r\n';const state=create(source);label(state,0,'reference');label(state,1,'action');toggle(state,1);await imported(page,state);await warning(page,false);
  assert.equal(await page.locator('#source').inputValue(),source.replaceAll('\r\n','\n'));assert.equal(await page.locator('#context').textContent(),source);
  await page.locator('#source').fill(source.replaceAll('\r\n','\n')+' draft');await warning(page,true);assert.equal(await page.locator('#export').isDisabled(),true);await reload(page,'dismiss');await page.locator('#discard-source').click();await warning(page,false);
  await page.getByRole('checkbox').uncheck();await warning(page,true);await page.getByRole('checkbox').check();await warning(page,false);
  await page.locator('#label-0').selectOption('unclear');await warning(page,true);
  const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadPromise;await warning(page,true);await reload(page,'dismiss');await download.cancel();await warning(page,true);
  await page.locator('#label-0').selectOption('reference');await warning(page,false);
  const savedPromise=page.waitForEvent('download');await page.locator('#export').click();const saved=await savedPromise;const path=fileURLToPath(new URL('exact-import-export.json',output));await saved.saveAs(path);assert.deepEqual(JSON.parse(await readFile(path,'utf8')),state);await warning(page,false);
  await cleanReload(page);
 });
 await run('custom source remains dirty after apply, discard, restart and completed export',async page=>{
  await page.locator('#source').fill('Private instructions 🧠');await page.locator('#apply-source').click();await warning(page,true);
  await page.locator('#source').fill('Draft');await page.locator('#discard-source').click();await warning(page,true);
  for(let i=0;i<2;i++){await confirm(page,'restart');await warning(page,true);await reload(page,'dismiss');}
  const pending=page.waitForEvent('download');await page.locator('#export').click();const download=await pending;await download.saveAs(fileURLToPath(new URL('custom-export.json',output)));await warning(page,true);await reload(page,'dismiss');
  await confirm(page,'sample','dismiss');await warning(page,true);await confirm(page,'sample');await warning(page,false);await confirm(page,'clear');await warning(page,false);await cleanReload(page);
 });
 await run('boundary changes with equal piece counts protect source mappings and can return clean',async page=>{
  const state=create('abcdef\nghij');await imported(page,state);await warning(page,false);
  async function boundary(name,offset){await page.locator('#piece-0 details').evaluate(e=>e.open=true);if(offset!==undefined)await page.locator('#offset-0').fill(String(offset));await page.locator('#piece-0').getByRole('button',{name,exact:true}).click();}
  await boundary('Merge with next piece');await boundary('Split piece',3);assert.equal(await page.locator('#segments article').count(),2);await warning(page,true);await reload(page,'dismiss');
  await boundary('Merge with next piece');await boundary('Split piece',7);await warning(page,false);await cleanReload(page);
 });
 await run('invalid imports and canceled import or Apply do not clear warnings',async page=>{
  const state=create('Retained');label(state,0,'action');await imported(page,state);await page.locator('#source').fill('Draft');await confirm(page,'apply-source','dismiss');await warning(page,true);assert.equal(await page.locator('#source').inputValue(),'Draft');
  await imported(page,create('Other'),'dismiss');await warning(page,true);assert.equal(await page.locator('#source').inputValue(),'Draft');
  for(const buffer of [Buffer.from('{'),Buffer.alloc(2000001,32)]){await page.locator('#import').setInputFiles({name:'bad.json',mimeType:'application/json',buffer});await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Import rejected.'));await warning(page,true);}
  await page.locator('#discard-source').click();await warning(page,false);await page.locator('#source').fill('x'.repeat(100001));await page.locator('#apply-source').click();await warning(page,true);assert.match(await page.locator('#status').textContent(),/Draft retained/);await page.locator('#discard-source').click();await warning(page,false);
 });
 await run('tab close Cancel keeps the tab and its source draft',async page=>{
  await page.locator('#source').click();await page.locator('#source').fill('Keep this draft');
  await withDialog(page,'dismiss',()=>page.close({runBeforeUnload:true}));assert.equal(page.isClosed(),false);assert.equal(await page.locator('#source').inputValue(),'Keep this draft');
 });
 // Fresh target: Chromium's DevTools Page.close can suppress a second request
 // after a canceled close; avoid mistaking that automation limit for app state.
 await run('tab close Leave closes the tab',async page=>{
  await page.locator('#source').click();await page.locator('#source').fill('Leave this draft');
  const closed=page.waitForEvent('close');await withDialog(page,'accept',()=>page.close({runBeforeUnload:true}));await closed;assert.equal(page.isClosed(),true);
 });
 for(const width of [320,390])await run(`warning and draft layout at ${width}px reduced motion`,async page=>{
  await page.locator('#source').fill('Unapplied instructions 🧠');await warning(page,true);assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#discard-source').focus();await page.keyboard.press('Enter');await warning(page,false);assert.equal(await page.evaluate(()=>document.activeElement.id),'source');
  await page.locator('#label-0').selectOption('action');await warning(page,true);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:fileURLToPath(new URL(`warning-${width}.png`,output)),fullPage:true});await reload(page,'dismiss');
 },{viewport:{width,height:844},reducedMotion:'reduce'});
 await writeFile(new URL('results.json',output),JSON.stringify({channel:process.env.SOURCESTEPS_BROWSER||'chrome',browser:browser.version(),headed:process.env.HEADED==='1',results,limits:['Synthetic setInputFiles only; native picker deliberately not exercised.','beforeunload is browser-controlled and best effort; no mobile/process-kill/save-completion guarantee.','No external requests observed.']},null,2));
}catch(error){await writeFile(new URL('failure.txt',output),String(error.stack));throw error;}finally{await browser?.close();server.kill();}

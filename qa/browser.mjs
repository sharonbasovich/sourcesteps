import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
const evidence=new URL('./evidence/',import.meta.url);await mkdir(evidence,{recursive:true});
const server=spawn(process.execPath,['server.js'],{stdio:'inherit'});
const results=[];let browser;
const text='Read one source.\nWrite two sentences.\nAsk a question.';
async function setup(page,source=text){await page.goto('http://127.0.0.1:4173/');await page.locator('#source').fill(source);await page.locator('#apply-source').click();await page.locator('#label-0').selectOption('action');await page.locator('#label-1').selectOption('action');await page.locator('#piece-1').getByRole('button',{name:'Focus this action',exact:true}).click();}
async function rejected(page,offset,piece=0){
 const source=await page.locator('#context').innerText(),summary=await page.locator('#summary').innerText();
 await page.locator(`#piece-${piece} details`).evaluate(e=>e.open=true);
 await page.locator(`#offset-${piece}`).fill(offset);
 await page.locator(`#piece-${piece}`).getByRole('button',{name:'Split piece',exact:true}).click();
 assert.match(await page.locator('#status').innerText(),/Choose a position|Cannot split|Maximum 500/);
 assert.equal(await page.locator('#context').innerText(),source);
 assert.equal(await page.locator('#summary').innerText(),summary);
 assert.match(await page.locator('#focus-content').innerText(),/source piece 2/);
 await page.getByRole('button',{name:'Back to source piece',exact:true}).click();
 assert.equal(await page.evaluate(()=>document.activeElement.id),'label-1');
 await page.getByRole('checkbox',{name:'I have completed this action'}).check();
 assert.match(await page.locator('#summary').innerText(),/1 \/ 2/);
 await page.getByRole('checkbox',{name:'I have completed this action'}).uncheck();
 assert.match(await page.locator('#summary').innerText(),/0 \/ 2/);
}
async function run(name,fn,options={}){const context=await browser.newContext({viewport:{width:1280,height:900},...options});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));try{await fn(page);assert.deepEqual(errors,[]);results.push({name,status:'passed'});}finally{await context.close();}}
try{
 for(let n=0;n<50;n++){try{if((await fetch('http://127.0.0.1:4173/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();
 await run('rejected offsets retain explicit non-first action and working controls',async page=>{await setup(page);for(const offset of ['0','1.5','','17'])await rejected(page,offset);await rejected(page,'0',1);await page.screenshot({path:new URL('desktop-rejected-split.png',evidence).pathname,fullPage:true});});
 await run('Unicode and CRLF rejections preserve focus without changing exact source',async page=>{await setup(page,'A🧠Z\nSecond action.');await rejected(page,'2');const source='First\r\nSecond action.',state={version:1,source,segments:[{start:0,end:7,label:'action',done:false},{start:7,end:source.length,label:'action',done:false}]};page.once('dialog',d=>d.accept());await page.locator('#import').setInputFiles({name:'synthetic-crlf.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(state))});await page.locator('#piece-1').getByRole('button',{name:'Focus this action',exact:true}).click();await rejected(page,'6');assert.equal(await page.locator('#context').textContent(),source);});
 await run('500-piece rejection preserves selected action',async page=>{await setup(page,Array.from({length:500},(_,i)=>`Action ${i}`).join('\n'));await rejected(page,'2');});
 await run('successful split and merge reset affected labels and checks',async page=>{await setup(page);await page.getByRole('checkbox',{name:'I have completed this action'}).check();await page.locator('#piece-1 details').evaluate(e=>e.open=true);await page.locator('#offset-1').fill('5');await page.locator('#piece-1').getByRole('button',{name:'Split piece',exact:true}).click();assert.equal(await page.locator('#label-1').inputValue(),'unreviewed');assert.equal(await page.locator('#label-2').inputValue(),'unreviewed');assert.equal(await page.locator('#label-1').evaluate(e=>e===document.activeElement),true);assert.match(await page.locator('#summary').innerText(),/0 \/ 1/);await page.locator('#piece-1 details').evaluate(e=>e.open=true);await page.locator('#piece-1').getByRole('button',{name:'Merge with next piece',exact:true}).click();assert.equal(await page.locator('#context').textContent(),text);assert.equal(await page.locator('#segments article').count(),3);assert.equal(await page.locator('#label-1').inputValue(),'unreviewed');});
 await run('source replacement, navigation and canceled destructive flows remain intact',async page=>{await setup(page);await page.getByRole('button',{name:'Previous action',exact:true}).click();assert.match(await page.locator('#focus-content').innerText(),/source piece 1/);await page.getByRole('button',{name:'Next action',exact:true}).click();await page.getByRole('checkbox',{name:'I have completed this action'}).check();page.once('dialog',d=>d.dismiss());await page.locator('#clear').click();assert.equal(await page.locator('#context').textContent(),text);assert.match(await page.locator('#summary').innerText(),/1 \/ 2/);await page.locator('#source').fill('Replacement instructions');page.once('dialog',d=>d.accept());await page.locator('#apply-source').click();assert.equal(await page.locator('#segments article').count(),1);assert.equal(await page.locator('#label-0').inputValue(),'unreviewed');assert.equal(await page.getByRole('checkbox').count(),0);page.once('dialog',d=>d.accept());await page.locator('#clear').click();assert.equal(await page.locator('#context').textContent(),'');});

 await run('draft source preserves review, cancel Apply retains both, discard restores exact applied text',async page=>{
  await setup(page);await page.getByRole('checkbox').check();const before=await page.locator('#summary').innerText();
  await page.locator('#source').fill(text+' ');
  assert.equal(await page.locator('#context').textContent(),text);assert.equal(await page.locator('#summary').innerText(),before);assert.equal(await page.locator('#export').isDisabled(),true);
  page.once('dialog',d=>d.dismiss());await page.locator('#apply-source').click();assert.equal(await page.locator('#source').inputValue(),text+' ');assert.equal(await page.locator('#summary').innerText(),before);
  await page.locator('#discard-source').click();assert.equal(await page.locator('#source').inputValue(),text);assert.equal(await page.getByRole('checkbox').isChecked(),true);assert.equal(await page.evaluate(()=>document.activeElement.id),'source');
  await page.locator('#source').fill('Replacement');page.once('dialog',d=>d.accept());await page.locator('#apply-source').click();assert.equal(await page.locator('#context').textContent(),'Replacement');assert.equal(await page.locator('#label-0').inputValue(),'unreviewed');assert.equal(await page.getByRole('checkbox').count(),0);
 });
 await run('imported CRLF stays exact when a browser-normalized draft is discarded',async page=>{
  await page.goto('http://127.0.0.1:4173/');const source='First\r\nSecond🧠';const state={version:1,source,segments:[{start:0,end:7,label:'reference',done:false},{start:7,end:source.length,label:'action',done:true}]};page.once('dialog',d=>d.accept());await page.locator('#import').setInputFiles({name:'synthetic-crlf.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(state))});
  assert.equal(await page.locator('#source').inputValue(),'First\nSecond🧠');assert.equal(await page.locator('#context').textContent(),source);await page.locator('#source').fill('First\nSecond🧠 changed');await page.locator('#discard-source').click();assert.equal(await page.locator('#context').textContent(),source);assert.equal(await page.getByRole('checkbox').isChecked(),true);assert.equal(await page.locator('#source-draft').isVisible(),false);
 });

 await run('downloaded review restores exact source, mappings and checks after reload',async page=>{
  await page.goto('http://127.0.0.1:4173/');
  const source='Read 🧠 carefully.\r\nRead 🧠 carefully.\r\nAsk about <script>literal</script>.\r\n';
  const ends=[source.indexOf('\r\n')+2,source.indexOf('\r\n',source.indexOf('\r\n')+2)+2,source.length];
  const state={version:1,source,segments:ends.map((end,i)=>({start:i?ends[i-1]:0,end,label:['reference','action','unclear'][i],done:i===1}))};
  const imported=new Promise(resolve=>page.once('dialog',async d=>{await d.accept();resolve();}));await page.locator('#import').setInputFiles({name:'synthetic-review.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(state))});await imported;await page.waitForFunction(s=>document.querySelector('#context').textContent===s,source);
  const pending=page.waitForEvent('download');await page.locator('#export').click();const download=await pending;
  assert.equal(download.suggestedFilename(),'sourcesteps.json');const saved=new URL('roundtrip-downloaded.json',evidence).pathname;await download.saveAs(saved);
  assert.equal(await download.failure(),null);const bytes=await readFile(saved);assert.deepEqual(JSON.parse(bytes),state);
  await page.reload();assert.notEqual(await page.locator('#context').textContent(),source);
  const canceled=new Promise(resolve=>page.once('dialog',async d=>{await d.dismiss();resolve();}));await page.locator('#import').setInputFiles(saved);await canceled;assert.notEqual(await page.locator('#context').textContent(),source);
  const restored=new Promise(resolve=>page.once('dialog',async d=>{await d.accept();resolve();}));await page.locator('#import').setInputFiles(saved);await restored;await page.waitForFunction(s=>document.querySelector('#context').textContent===s,source);
  assert.equal(await page.locator('#context').textContent(),source);assert.equal(await page.locator('#label-0').inputValue(),'reference');assert.equal(await page.locator('#label-1').inputValue(),'action');assert.equal(await page.locator('#label-2').inputValue(),'unclear');assert.equal(await page.getByRole('checkbox').isChecked(),true);
  await page.getByRole('button',{name:'Back to source piece',exact:true}).click();assert.equal(await page.evaluate(()=>document.activeElement.id),'label-1');
  const again=page.waitForEvent('download');await page.locator('#export').click();const second=await again;const secondPath=new URL('roundtrip-redownloaded.json',evidence).pathname;await second.saveAs(secondPath);assert.deepEqual(await readFile(secondPath),bytes);
  await page.screenshot({path:new URL('desktop-restored-review.png',evidence).pathname,fullPage:true});
 });
 for(const width of [320,390])await run(`mobile ${width}px keyboard and reduced motion`,async page=>{await setup(page);await page.locator('#piece-0 details').evaluate(e=>e.open=true);await page.locator('#offset-0').fill('0');await page.locator('#piece-0').getByRole('button',{name:'Split piece',exact:true}).focus();await page.keyboard.press('Enter');await page.getByRole('button',{name:'Back to source piece',exact:true}).focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'label-1');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('#source').fill(text+' draft');assert.equal(await page.locator('#context').textContent(),text);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:new URL(`mobile-${width}-source-draft.png`,evidence).pathname,fullPage:true});await page.locator('#discard-source').focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'source');},{viewport:{width,height:844},reducedMotion:'reduce'});
 await writeFile(new URL('results.json',evidence),JSON.stringify({sourceCommit:process.env.GITHUB_SHA,results,limits:['Synthetic HTTP Chromium only; native file chooser interaction, direct-file compatibility, physical devices and native screen readers are not covered.']},null,2));console.log(JSON.stringify(results));
}catch(error){await writeFile(new URL('failure.txt',evidence),String(error.stack));throw error;}finally{await browser?.close();server.kill();}

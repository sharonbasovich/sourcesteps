import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
const evidence=new URL('./evidence/',import.meta.url);await mkdir(evidence,{recursive:true});
const server=spawn(process.execPath,['server.js'],{stdio:'inherit'});
let browser;
try{
 for(let n=0;n<50;n++){try{if((await fetch('http://127.0.0.1:4173/')).ok)break;}catch{} await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/');
 await page.locator('#source').fill('Read one source.\nWrite two sentences.\nAsk a question.');
 await page.locator('#label-0').selectOption('action');
 await page.locator('#label-1').selectOption('action');
 await page.locator('#piece-1').getByRole('button',{name:'Focus this action',exact:true}).click();
 await page.locator('#piece-0').getByText('Adjust piece boundaries',{exact:true}).click();
 await page.locator('#offset-0').fill('0');
 await page.locator('#piece-0').getByRole('button',{name:'Split piece',exact:true}).click();
 assert.match(await page.locator('#status').innerText(),/Choose a position inside/);
 assert.match(await page.locator('#focus-content').innerText(),/source piece 2/);
 await page.getByRole('checkbox',{name:'I have completed this action'}).check();
 assert.match(await page.locator('#status').innerText(),/Only an action can be checked/);
 assert.match(await page.locator('#summary').innerText(),/0 \/ 2/);
 await page.getByRole('button',{name:'Back to source piece',exact:true}).click();
 assert.ok(errors.some(e=>e.includes('focus')),JSON.stringify(errors));
 await page.screenshot({path:new URL('baseline-invalid-split.png',evidence).pathname,fullPage:true});
 const result={baseline:'reproduced',sourceCommit:process.env.GITHUB_SHA,observation:'Invalid split leaves piece 2 visibly focused, but completion is rejected and return-to-source throws.',errors};
 await writeFile(new URL('results.json',evidence),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser?.close();server.kill();}

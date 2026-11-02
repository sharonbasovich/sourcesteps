import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as core from '../core.js';

// Execute the actual app handlers with a minimal DOM and a controllable native
// confirmation result. This verifies mutation boundaries, not browser dialog UX.
const source = await readFile(new URL('../app.js', import.meta.url),'utf8');
const body = source.replace(/^import [^\n]+\n/,'');
assert.notEqual(body,source,'App import must be replaced only for this harness');
function harness(){
 const ids=new Map();let answer=false,confirmations=0,focused=null;
 class Element {
  constructor(tag){this.tagName=tag;this.children=[];this.handlers={};this._text='';this.value='';this.checked=false;}
  set id(value){this._id=value;ids.set(value,this);}get id(){return this._id;}
  set textContent(value){this._text=String(value);this.children=[];}
  get textContent(){return this._text+this.children.map(x=>x.textContent??'').join('');}
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this._text='';this.children=nodes;}
  addEventListener(name,fn){this.handlers[name]=fn;}
  focus(){focused=this.id;}
 }
 for(const id of ['source','summary','context','segments','focus-title','focus-content','export','status','sample','clear','restart','import','source-draft','apply-source','discard-source','review-state']){const x=new Element('div');x.id=id;}
 const document={getElementById:id=>ids.get(id),createElement:tag=>new Element(tag)};
 vm.runInNewContext(body,{...core,document,confirm:()=>{confirmations++;return answer;},setTimeout,URL,Blob},{filename:'app.js'});
 const get=id=>ids.get(id);
 const visit=(node,predicate)=>node.children.flatMap(x=>[...(predicate(x)?[x]:[]),...visit(x,predicate)]);
 const snapshot=()=>({source:get('context').textContent,labels:visit(get('segments'),x=>x.tagName==='select').map(x=>x.value),checked:visit(get('focus-content'),x=>x.tagName==='input').map(x=>x.checked),summary:get('summary').textContent,status:get('status').textContent});
 return {get,snapshot,confirmations:()=>confirmations,focused:()=>focused,
  draft(text){get('source').value=text;get('source').handlers.input();},
  edit(text){get('source').value=text;get('source').handlers.input();const prior=answer;answer=true;get('apply-source').onclick();answer=prior;},
  label(i,value){const x=get(`label-${i}`);x.value=value;x.handlers.change();},
  check(){const x=visit(get('focus-content'),x=>x.tagName==='input')[0];x.checked=!x.checked;x.handlers.change();},
  focusAction(i){visit(get('segments').children[i],x=>x.tagName==='button'&&x.textContent==='Focus this action')[0].handlers.click();},
  boundary(i,kind,offset){if(offset!==undefined)get(`offset-${i}`).value=String(offset);const b=visit(get('segments').children[i],x=>x.tagName==='button'&&x.textContent===kind)[0];assert.equal(b.disabled,false);b.handlers.click();},
  back(){visit(get('focus-content'),x=>x.tagName==='button'&&x.textContent==='Back to source piece')[0].handlers.click();},
  focusText(){return get('focus-content').textContent;},
  invoke(id,confirmed){answer=confirmed;get(id).focus();get(id).onclick();},
 };
}
test('cancelled destructive operations leave exact source, labels and checks untouched',()=>{
 const h=harness();h.edit('  café 🧠\nKeep this.\nKeep this.');h.label(0,'reference');h.label(1,'action');h.check();h.label(2,'unclear');
 const before=h.snapshot();for(const id of ['restart','clear','sample','restart','clear']){h.invoke(id,false);assert.deepEqual(h.snapshot(),before);assert.equal(h.focused(),id);}assert.equal(h.confirmations(),5);
});
test('confirmed restart only resets review and repeated restart is idempotent',()=>{
 const h=harness(),source='  café 🧠\nKeep this.\nKeep this.';h.edit(source);h.label(1,'action');h.check();h.label(2,'unclear');h.invoke('restart',true);
 const restarted=h.snapshot();assert.equal(restarted.source,source);assert.deepEqual(restarted.labels,['unreviewed','unreviewed','unreviewed']);assert.deepEqual(restarted.checked,[]);assert.match(restarted.summary,/0 \/ 0actions checked/);h.invoke('restart',true);assert.deepEqual(h.snapshot(),restarted);
});
test('confirmed clear remains empty on repeat and cancelled sample cannot repopulate it',()=>{
 const h=harness();h.label(0,'action');h.check();h.invoke('clear',true);const cleared=h.snapshot();assert.equal(cleared.source,'');assert.deepEqual(cleared.labels,[]);assert.equal(h.get('source').value,'');assert.equal(h.get('export').disabled,true);h.invoke('clear',true);assert.deepEqual(h.snapshot(),cleared);h.invoke('sample',false);assert.deepEqual(h.snapshot(),cleared);
});
test('confirmed sample replacement resets review without duplicate content',()=>{
 const h=harness();h.edit('Old\nSource');h.label(0,'action');h.check();h.invoke('sample',true);const loaded=h.snapshot();assert.equal(loaded.source,core.sample);assert.equal(loaded.labels.length,core.create(core.sample).segments.length);assert.ok(loaded.labels.every(x=>x==='unreviewed'));h.invoke('sample',true);assert.deepEqual(h.snapshot(),loaded);
});
test('source edit during file read invalidates the pending import',async()=>{
 const h=harness();h.edit('Original');let finishRead;const text=new Promise(resolve=>{finishRead=resolve;});
 const pending=h.get('import').onchange({target:{files:[{size:100,text:()=>text}],value:'fixture.json'}});
 h.edit('New source 🧠');h.label(0,'unclear');const expected=h.snapshot();finishRead(core.serialize(core.create('Stale imported source')));await pending;
 const after=h.snapshot();assert.equal(after.source,expected.source);assert.deepEqual(after.labels,expected.labels);assert.equal(h.confirmations(),0);assert.match(after.status,/Workspace changed while reading/);
});
test('cancelled validated import preserves source, labels and checks',async()=>{
 const h=harness();h.edit('Keep this');h.label(0,'action');h.check();const expected=h.snapshot();
 await h.get('import').onchange({target:{files:[{size:100,text:async()=>core.serialize(core.create('Replacement'))}],value:'fixture.json'}});
 assert.deepEqual(h.snapshot(),expected);assert.equal(h.confirmations(),1);
});
test('oversized and malformed imports leave the session intact',async()=>{
 const h=harness();h.edit('Keep this');h.label(0,'reference');const expected=h.snapshot();let read=false;
 await h.get('import').onchange({target:{files:[{size:2000001,text:async()=>{read=true;return '';}}],value:'large.json'}});
 assert.equal(read,false);assert.equal(h.snapshot().source,expected.source);assert.deepEqual(h.snapshot().labels,expected.labels);assert.match(h.snapshot().status,/2 MB/);
 await h.get('import').onchange({target:{files:[{size:3,text:async()=>'{'}],value:'broken.json'}});
 assert.equal(h.snapshot().source,expected.source);assert.deepEqual(h.snapshot().labels,expected.labels);assert.equal(h.confirmations(),0);assert.match(h.snapshot().status,/Import rejected/);
});

test('newer file selection supersedes an older read even before the newer read completes',async()=>{
 const h=harness();h.edit('Keep current work');h.label(0,'action');h.invoke('restart',true);
 let finishOld,finishNew;
 const oldText=new Promise(resolve=>{finishOld=resolve;});
 const newText=new Promise(resolve=>{finishNew=resolve;});
 const oldRead=h.get('import').onchange({target:{files:[{size:100,text:()=>oldText}],value:'old.json'}});
 const newRead=h.get('import').onchange({target:{files:[{size:100,text:()=>newText}],value:'new.json'}});
 finishOld(core.serialize(core.create('Older selection')));await oldRead;
 assert.equal(h.snapshot().source,'Keep current work');
 assert.equal(h.confirmations(),1,'Superseded import must not open a confirmation');
 finishNew(core.serialize(core.create('Newest selection')));await newRead;
 assert.equal(h.snapshot().source,'Newest selection');
 assert.equal(h.confirmations(),2);
});
test('superseded read failure cannot overwrite newer import status',async()=>{
 const h=harness();h.invoke('restart',true);let failOld;
 const oldText=new Promise((resolve,reject)=>{failOld=reject;});
 const oldRead=h.get('import').onchange({target:{files:[{size:100,text:()=>oldText}],value:'old.json'}});
 await h.get('import').onchange({target:{files:[{size:100,text:async()=>core.serialize(core.create('Newest selection'))}],value:'new.json'}});
 const expected=h.snapshot();failOld(Error('Older read failed'));await oldRead;
 assert.deepEqual(h.snapshot(),expected);
});
test('invalid newer selection still supersedes older pending import without data loss',async()=>{
 const h=harness();h.edit('Keep current work');h.invoke('restart',true);let finishOld;
 const oldText=new Promise(resolve=>{finishOld=resolve;});
 const oldRead=h.get('import').onchange({target:{files:[{size:100,text:()=>oldText}],value:'old.json'}});
 await h.get('import').onchange({target:{files:[{size:1,text:async()=>'{'}],value:'invalid.json'}});
 const expected=h.snapshot();finishOld(core.serialize(core.create('Older selection')));await oldRead;
 assert.deepEqual(h.snapshot(),expected);assert.equal(h.snapshot().source,'Keep current work');assert.equal(h.confirmations(),1);
});
test('older successful read cannot replace a newer import that finishes first',async()=>{
 const h=harness();h.invoke('restart',true);let finishOld;
 const oldRead=h.get('import').onchange({target:{files:[{size:100,text:()=>new Promise(resolve=>{finishOld=resolve;})}],value:'old.json'}});
 await h.get('import').onchange({target:{files:[{size:100,text:async()=>core.serialize(core.create('Newest'))}],value:'new.json'}});
 const expected=h.snapshot(),count=h.confirmations();
 finishOld(core.serialize(core.create('Old')));await oldRead;
 assert.deepEqual(h.snapshot(),expected);assert.equal(h.confirmations(),count);
});
test('latest read failure preserves reviewed work and suppresses older success',async()=>{
 const h=harness();h.edit('Keep this');h.label(0,'action');h.check();let finishOld;
 const before=h.snapshot();
 const oldRead=h.get('import').onchange({target:{files:[{size:100,text:()=>new Promise(resolve=>{finishOld=resolve;})}],value:'old.json'}});
 await h.get('import').onchange({target:{files:[{size:100,text:async()=>{throw Error('Unreadable newest file');}}],value:'new.json'}});
 const rejected=h.snapshot();
 assert.equal(rejected.source,before.source);assert.deepEqual(rejected.labels,before.labels);assert.deepEqual(rejected.checked,before.checked);assert.equal(rejected.summary,before.summary);
 assert.match(rejected.status,/Unreadable newest file/);
 finishOld(core.serialize(core.create('Old')));await oldRead;
 assert.deepEqual(h.snapshot(),rejected);assert.equal(h.confirmations(),0);
});
test('cancelling the newest validated import cannot revive an older pending read',async()=>{
 const h=harness();h.edit('Keep this');h.label(0,'action');h.check();let finishOld;
 const expected=h.snapshot();
 const oldRead=h.get('import').onchange({target:{files:[{size:100,text:()=>new Promise(resolve=>{finishOld=resolve;})}],value:'old.json'}});
 await h.get('import').onchange({target:{files:[{size:100,text:async()=>core.serialize(core.create('Newest'))}],value:'new.json'}});
 assert.deepEqual(h.snapshot(),expected);assert.equal(h.confirmations(),1);
 finishOld(core.serialize(core.create('Old')));await oldRead;
 assert.deepEqual(h.snapshot(),expected);assert.equal(h.confirmations(),1);
});
test('an empty selection event supersedes a pending read without changing work',async()=>{
 const h=harness();h.edit('Keep this');h.label(0,'action');h.check();let finishOld;
 const expected=h.snapshot();
 const oldRead=h.get('import').onchange({target:{files:[{size:100,text:()=>new Promise(resolve=>{finishOld=resolve;})}],value:'old.json'}});
 await h.get('import').onchange({target:{files:[],value:''}});
 finishOld(core.serialize(core.create('Old')));await oldRead;
 assert.deepEqual(h.snapshot(),expected);assert.equal(h.confirmations(),0);
});

// Failed boundary edits must not invalidate the still-rendered action controls.
for(const [name,source,offset,error] of [
 ['zero offset','First action\nSecond action',0,/Choose a position/],
 ['end offset','First action\nSecond action',13,/Choose a position/],
 ['fractional offset','First action\nSecond action',1.5,/Choose a position/],
 ['blank offset','First action\nSecond action','',/Choose a position/],
 ['surrogate pair','🧠 First action\nSecond action',1,/Unicode pair/],
 ['CRLF boundary','First action\r\nSecond action',13,/line ending/],
 ['piece limit','First action\nSecond action\n'+'Extra\n'.repeat(498),1,/Maximum 500 pieces/],
])test(`rejected split (${name}) preserves explicit focus and its live controls`,()=>{
 const h=harness();h.edit(source);h.label(0,'action');h.label(1,'action');h.focusAction(1);h.check();
 const before=h.snapshot(),focusBefore=h.focusText();
 // Reject editing a different piece from the explicitly selected second action.
 h.boundary(0,'Split piece',offset);
 const after=h.snapshot();assert.match(after.status,error);
 assert.deepEqual({...after,status:before.status},before);
 assert.equal(h.focusText(),focusBefore);assert.match(h.focusText(),/source piece 2/);
 h.back();assert.equal(h.focused(),'label-1');
 h.check();assert.match(h.snapshot().status,/action check was updated/);
 assert.deepEqual(h.snapshot().checked,[false]);assert.match(h.snapshot().summary,/0 \/ 2actions checked/);
 h.check();assert.deepEqual(h.snapshot().checked,[true]);assert.match(h.snapshot().summary,/1 \/ 2actions checked/);
 h.back();assert.equal(h.focused(),'label-1');
});
test('rejected split of the focused action preserves its checked state and controls',()=>{
 const h=harness();h.edit('First action\nSecond action');h.label(0,'action');h.label(1,'action');h.focusAction(1);h.check();
 const before=h.snapshot();h.boundary(1,'Split piece',0);
 assert.deepEqual({...h.snapshot(),status:before.status},before);
 h.back();assert.equal(h.focused(),'label-1');h.check();assert.deepEqual(h.snapshot().checked,[false]);
 assert.match(h.snapshot().status,/action check was updated/);
});
test('successful split clears affected review and remaps surviving focus controls',()=>{
 const h=harness();h.edit('First action\nSecond action');h.label(0,'action');h.label(1,'action');h.focusAction(0);h.check();
 h.boundary(0,'Split piece',5);
 assert.deepEqual(h.snapshot().labels,['unreviewed','unreviewed','action']);
 assert.equal(h.snapshot().source,'First action\nSecond action');
 assert.deepEqual(h.snapshot().checked,[false]);assert.match(h.snapshot().summary,/0 \/ 1actions checked/);
 assert.match(h.focusText(),/source piece 3/);assert.equal(h.focused(),'label-0');
 h.back();assert.equal(h.focused(),'label-2');h.check();assert.deepEqual(h.snapshot().checked,[true]);
 assert.match(h.snapshot().summary,/1 \/ 1actions checked/);
});
test('successful merge clears both affected reviews and remaps surviving focus controls',()=>{
 const h=harness();h.edit('First action\nSecond action\nThird action');
 for(let i=0;i<3;i++){h.label(i,'action');h.focusAction(i);h.check();}
 h.focusAction(1);h.boundary(0,'Merge with next piece');
 assert.deepEqual(h.snapshot().labels,['unreviewed','action']);
 assert.equal(h.snapshot().source,'First action\nSecond action\nThird action');
 assert.deepEqual(h.snapshot().checked,[true]);assert.match(h.snapshot().summary,/1 \/ 1actions checked/);
 assert.match(h.focusText(),/source piece 2/);assert.equal(h.focused(),'label-0');
 h.back();assert.equal(h.focused(),'label-1');h.check();assert.deepEqual(h.snapshot().checked,[false]);
 assert.match(h.snapshot().summary,/0 \/ 1actions checked/);
});

test('typing a draft preserves applied source, all labels, checks and selected action',()=>{
 const h=harness();h.edit('First\nSecond');h.label(0,'reference');h.label(1,'action');h.focusAction(1);h.check();const before=h.snapshot(),focus=h.focusText();
 h.draft('First\nSecond ');assert.deepEqual({...h.snapshot(),status:before.status},before);assert.equal(h.focusText(),focus);assert.equal(h.get('export').disabled,true);assert.equal(h.get('source-draft').hidden,false);assert.equal(h.get('apply-source').disabled,false);
 h.invoke('discard-source');assert.equal(h.get('source').value,before.source);assert.deepEqual({...h.snapshot(),status:before.status},before);assert.equal(h.get('source-draft').hidden,true);assert.equal(h.get('export').disabled,false);assert.equal(h.focused(),'source');
});
test('canceling Apply retains draft and review; accepting resets mappings only then',()=>{
 const h=harness();h.edit('First\nSecond');h.label(1,'action');h.check();const before=h.snapshot();h.draft('Different');
 h.invoke('apply-source',false);assert.deepEqual({...h.snapshot(),status:before.status},before);assert.equal(h.get('source').value,'Different');assert.equal(h.focused(),'apply-source');
 h.invoke('apply-source',true);assert.equal(h.snapshot().source,'Different');assert.deepEqual(h.snapshot().labels,['unreviewed']);assert.deepEqual(h.snapshot().checked,[]);assert.equal(h.get('source-draft').hidden,true);assert.equal(h.focused(),'source');
});
test('reverting text to its draft baseline never resets review',()=>{
 const h=harness();h.edit('Same');h.label(0,'action');h.check();const before=h.snapshot();h.draft('Same ');h.draft('Same');assert.deepEqual({...h.snapshot(),status:before.status},before);assert.equal(h.get('apply-source').disabled,true);h.invoke('apply-source',true);assert.equal(h.confirmations(),0);
});
test('oversized draft is retained on rejected Apply without affecting reviewed state',()=>{
 const h=harness();h.edit('Keep');h.label(0,'action');h.check();const before=h.snapshot();h.draft('x'.repeat(100001));h.invoke('apply-source',true);assert.equal(h.get('source').value.length,100001);assert.deepEqual({...h.snapshot(),status:before.status},before);assert.match(h.snapshot().status,/Draft retained/);assert.equal(h.confirmations(),0);
});
test('pending draft invalidates an older file read without a destructive prompt',async()=>{
 const h=harness();h.edit('Keep');h.label(0,'action');let resolve;
 const read=h.get('import').onchange({target:{files:[{size:50,text:()=>new Promise(r=>resolve=r)}],value:'a'}});
 h.draft('Unapplied');resolve(core.serialize(core.create('Stale')));await read;
 assert.equal(h.snapshot().source,'Keep');assert.equal(h.get('source').value,'Unapplied');assert.equal(h.confirmations(),0);assert.match(h.snapshot().status,/Workspace changed/);
});
test('canceling replacement while drafting preserves both versions',()=>{
 const h=harness();h.edit('Keep');h.label(0,'action');h.check();h.draft('Draft');const before=h.snapshot();
 for(const id of ['restart','clear','sample']){h.invoke(id,false);assert.deepEqual(h.snapshot(),before);assert.equal(h.get('source').value,'Draft');assert.equal(h.get('source-draft').hidden,false);}
});
test('accepted restart discards draft and resets review of applied source',()=>{
 const h=harness();h.edit('Keep');h.label(0,'action');h.draft('Draft');h.invoke('restart',true);assert.equal(h.snapshot().source,'Keep');assert.equal(h.get('source').value,'Keep');assert.deepEqual(h.snapshot().labels,['unreviewed']);assert.equal(h.get('source-draft').hidden,true);
});
test('accepted import resets draft baseline, rejected import retains it',async()=>{
 const h=harness();h.draft('Draft');const source='A\r\nB🧠';
 await h.get('import').onchange({target:{files:[{size:100,text:async()=>core.serialize(core.create(source))}],value:'x'}});
 assert.equal(h.get('source').value,'Draft');h.invoke('restart',true);h.draft('Draft2');
 await h.get('import').onchange({target:{files:[{size:100,text:async()=>core.serialize(core.create(source))}],value:'x'}});
 assert.equal(h.snapshot().source,source);assert.equal(h.get('source').value,source);assert.equal(h.get('source-draft').hidden,true);
});
test('review actions during drafting stay linked to applied source and draft survives rerender',()=>{
 const h=harness();h.edit('First\nSecond');h.draft('Different');h.label(1,'action');h.check();assert.equal(h.get('source').value,'Different');assert.equal(h.get('source-draft').hidden,false);assert.match(h.focusText(),/Second/);h.invoke('discard-source');assert.deepEqual(h.snapshot().labels,['unreviewed','action']);assert.deepEqual(h.snapshot().checked,[true]);
});
test('export handler refuses unapplied draft even if invoked directly',()=>{
 const h=harness();h.draft('Draft');h.invoke('export');assert.match(h.snapshot().status,/Apply or discard/);assert.equal(h.get('source').value,'Draft');
});

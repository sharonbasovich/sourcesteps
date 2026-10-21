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
 for(const id of ['source','summary','context','segments','focus-title','focus-content','export','status','sample','clear','restart','import']){const x=new Element('div');x.id=id;}
 const document={getElementById:id=>ids.get(id),createElement:tag=>new Element(tag)};
 vm.runInNewContext(body,{...core,document,confirm:()=>{confirmations++;return answer;},setTimeout,URL,Blob},{filename:'app.js'});
 const get=id=>ids.get(id);
 const visit=(node,predicate)=>node.children.flatMap(x=>[...(predicate(x)?[x]:[]),...visit(x,predicate)]);
 const snapshot=()=>({source:get('context').textContent,labels:visit(get('segments'),x=>x.tagName==='select').map(x=>x.value),checked:visit(get('focus-content'),x=>x.tagName==='input').map(x=>x.checked),summary:get('summary').textContent,status:get('status').textContent});
 return {get,snapshot,confirmations:()=>confirmations,focused:()=>focused,
  edit(text){get('source').value=text;get('source').handlers.input();},
  label(i,value){const x=get(`label-${i}`);x.value=value;x.handlers.change();},
  check(){visit(get('focus-content'),x=>x.tagName==='input')[0].handlers.change();},
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

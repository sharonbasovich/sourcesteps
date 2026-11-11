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
 const listeners=new Set();
 const window={addEventListener:(name,fn)=>{assert.equal(name,"beforeunload");listeners.add(fn);},removeEventListener:(name,fn)=>{assert.equal(name,"beforeunload");listeners.delete(fn);}};
 const ids=new Map();let answer=false,confirmations=0,focused=null,prompt=null;
 class Element {
  constructor(tag){this.tagName=tag;this.children=[];this.handlers={};this._text='';this.value='';this.checked=false;}
  set id(value){this._id=value;ids.set(value,this);}get id(){return this._id;}
  set textContent(value){this._text=String(value);this.children=[];}
  get textContent(){return this._text+this.children.map(x=>x.textContent??'').join('');}
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this._text='';this.children=nodes;}
  addEventListener(name,fn){this.handlers[name]=fn;}
  click(){this.handlers.click?.();}
  focus(){focused=this.id;}
 }
 for(const id of ['source','summary','context','segments','focus-title','focus-content','export','status','sample','clear','restart','import','source-draft','apply-source','discard-source','review-state','exit-warning','review-next','review-unclear','review-guidance']){const x=new Element('div');x.id=id;}
 const document={getElementById:id=>ids.get(id),createElement:tag=>new Element(tag)};
 const context=vm.createContext({...core,document,window,confirm:message=>{prompt=message;confirmations++;return answer;},setTimeout});
 vm.runInContext(body,context,{filename:'app.js'});
 const get=id=>ids.get(id);
 const visit=(node,predicate)=>node.children.flatMap(x=>[...(predicate(x)?[x]:[]),...visit(x,predicate)]);
 const snapshot=()=>({source:get('context').textContent,labels:visit(get('segments'),x=>x.tagName==='select').map(x=>x.value),checked:visit(get('focus-content'),x=>x.tagName==='input').map(x=>x.checked),summary:get('summary').textContent,status:get('status').textContent});
 return {get,snapshot,
  review:()=>JSON.parse(vm.runInContext('serialize(state)',context)),
  prompt:()=>prompt,
  confirmations:()=>confirmations,focused:()=>focused,
  draft(text){get('source').value=text;get('source').handlers.input();},
  edit(text){get('source').value=text;get('source').handlers.input();const prior=answer;answer=true;get('apply-source').onclick();answer=prior;},
  label(i,value){const x=get(`label-${i}`);x.value=value;x.handlers.change();},
  check(){const x=visit(get('focus-content'),x=>x.tagName==='input')[0];x.checked=!x.checked;x.handlers.change();},
  focusAction(i){visit(get('segments').children[i],x=>x.tagName==='button'&&x.textContent==='Focus this action')[0].handlers.click();},
  boundary(i,kind,offset){if(offset!==undefined)get(`offset-${i}`).value=String(offset);const b=visit(get('segments').children[i],x=>x.tagName==='button'&&x.textContent===kind)[0];assert.equal(b.disabled,false);b.handlers.click();},
  back(){visit(get('focus-content'),x=>x.tagName==='button'&&x.textContent==='Back to source piece')[0].handlers.click();},
  invoke(id,confirmed){assert.ok(!['import','export'].includes(id),'File operations are outside this harness');answer=confirmed;get(id).focus();get(id).onclick();},
 };
}

const disclosure='Restart review? This removes all manual splits and merges, labels, and checks. The exact source text is kept.';

function reviewedWorkspace(){
 const h=harness();
 // Equal piece counts before/after hide boundary loss unless exact ranges are checked.
 h.edit('First 🧠 line\r\nSecond line\nThird line');
 h.boundary(0,'Split piece',5);
 h.boundary(2,'Merge with next piece');
 h.label(0,'reference');h.label(1,'action');h.check();
 h.label(2,'action');h.focusAction(2);h.check();
 return h;
}

test('Restart discloses manual splits/merges, labels and checks before cancel preserves complete review',()=>{
 const h=reviewedWorkspace();const before=h.review(),visible=h.snapshot();
 assert.equal(before.segments.length,core.create(before.source).segments.length);
 assert.notDeepEqual(before.segments.map(x=>[x.start,x.end]),core.create(before.source).segments.map(x=>[x.start,x.end]));
 assert.equal(before.segments.filter(x=>x.done).length,2);
 for(let attempt=0;attempt<2;attempt++){
  const count=h.confirmations();h.invoke('restart',false);
  assert.equal(h.confirmations(),count+1);assert.equal(h.prompt(),disclosure);
  assert.deepEqual(h.review(),before);assert.deepEqual(h.snapshot(),visible);
  h.back();assert.equal(h.focused(),'label-2');
 }
});

test('confirmed Restart preserves exact Unicode/CRLF source but restores initial boundaries and clears every label/check',()=>{
 const h=reviewedWorkspace();const before=h.review();
 h.invoke('restart',true);assert.equal(h.prompt(),disclosure);
 assert.equal(h.review().source,before.source);
 assert.deepEqual(h.review(),core.create(before.source));
 assert.deepEqual(h.snapshot().checked,[]);
 assert.equal(h.get('source').value,before.source);
 assert.match(h.snapshot().status,/Exact source preserved/);
 // A repeated restart must also leave a coherent initial review.
 h.invoke('restart',true);assert.deepEqual(h.review(),core.create(before.source));
});

test('Restart with pending draft discloses draft loss; cancellation preserves draft and all review before acceptance',()=>{
 const h=reviewedWorkspace();const before=h.review();
 h.draft('Pending replacement');const visible=h.snapshot();
 h.invoke('restart',false);
 assert.ok(h.prompt().includes(disclosure));assert.match(h.prompt(),/draft/i);
 assert.deepEqual(h.review(),before);assert.deepEqual(h.snapshot(),visible);
 assert.equal(h.get('source').value,'Pending replacement');
 h.invoke('restart',true);
 assert.deepEqual(h.review(),core.create(before.source));
 assert.equal(h.get('source').value,before.source);assert.equal(h.get('source-draft').hidden,true);
});

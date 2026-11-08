import {test} from 'node:test';
import assert from 'node:assert/strict';
import {create,split,merge,label,toggle,serialize,parse} from '../core.js';

// Independent streams and scaled uint32 output avoid low-bit/modulo coupling.
function rng(seed){return n=>{seed+=0x6D2B79F5;let t=seed;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return Math.floor(((t^(t>>>14))>>>0)/4294967296*n);};}
function boundaries(text){const out=[];for(let i=1;i<text.length;i++){const a=text.charCodeAt(i-1),b=text.charCodeAt(i);if(a===13&&b===10)continue;if(a>=0xD800&&a<=0xDBFF&&b>=0xDC00&&b<=0xDFFF)continue;out.push(i);}return out;}
function initial(source){const segments=[];let start=0;for(let i=0;i<source.length;i++){if(source[i]!=='\r'&&source[i]!=='\n')continue;if(source[i]==='\r'&&source[i+1]==='\n')i++;segments.push({start,end:i+1,label:'unreviewed',done:false});start=i+1;}if(start<source.length)segments.push({start,end:source.length,label:'unreviewed',done:false});return {version:1,source,segments};}
function invariant(state,expected){
 assert.deepEqual(state,expected,'Full independent expected state, including changed review and exact ranges');
 let end=0;for(const piece of state.segments){assert.equal(piece.start,end);assert.ok(Number.isInteger(piece.end)&&piece.end>piece.start&&piece.end<=state.source.length);end=piece.end;}
 assert.equal(end,state.source.length);assert.equal(state.segments.map(x=>state.source.slice(x.start,x.end)).join(''),state.source);
 assert.deepEqual(parse(serialize(state)),expected,'Serialization retains the independently expected state');
}
test('seeded mixed operations preserve independent exact state with non-vacuous coverage',(t)=>{
 const chooseOp=rng(0x20261107),choosePiece=rng(0x4B12F092),chooseContent=rng(0xA19CE731);
 const counts={label:0,toggle:0,split:0,merge:0,checked:0,unchecked:0,unaffectedChecked:0};
 const labels={unreviewed:0,action:0,reference:0,unclear:0};
 const atoms=['same\n','same\r\n','\r','\n','\t',' ','\uD83E\uDDE0','e\u0301','\u0000','<tag>','\u2028','Z'];
 for(let run=0;run<200;run++){
  const source='same\nsame\n'+Array.from({length:3+chooseContent(30)},()=>atoms[chooseContent(atoms.length)]).join('');
  let expected=initial(source),state=create(source);invariant(state,expected);
  for(let step=0;step<40;step++){
   const before=structuredClone(expected),pieces=before.segments;
   const splittable=pieces.map((p,i)=>({i,positions:boundaries(source.slice(p.start,p.end))})).filter(x=>x.positions.length);
   const actions=pieces.map((p,i)=>p.label==='action'?i:-1).filter(i=>i>=0);
   const available=['label',...(actions.length?['toggle']:[]),...(splittable.length?['split']:[]),...(pieces.length>1?['merge']:[])];
   const op=available[chooseOp(available.length)];let i,removed=1;
   if(op==='label'){
    i=choosePiece(pieces.length);const options=Object.keys(labels).filter(x=>x!==pieces[i].label),value=options[choosePiece(options.length)];
    expected.segments[i]={...pieces[i],label:value,done:false};state=label(state,i,value);labels[value]++;
   }else if(op==='toggle'){
    i=actions[choosePiece(actions.length)];expected.segments[i]={...pieces[i],done:!pieces[i].done};state=toggle(state,i);counts[expected.segments[i].done?'checked':'unchecked']++;
   }else if(op==='split'){
    const chosen=splittable[choosePiece(splittable.length)];i=chosen.i;const at=pieces[i].start+chosen.positions[choosePiece(chosen.positions.length)];
    expected.segments.splice(i,1,{start:pieces[i].start,end:at,label:'unreviewed',done:false},{start:at,end:pieces[i].end,label:'unreviewed',done:false});state=split(state,i,at-pieces[i].start);
   }else{
    i=choosePiece(pieces.length-1);removed=2;expected.segments.splice(i,2,{start:pieces[i].start,end:pieces[i+1].end,label:'unreviewed',done:false});state=merge(state,i);
   }
   counts[op]++;
   invariant(state,expected);
   assert.notDeepEqual(state,before,'Every selected operation must actually change state');
   for(let j=0;j<pieces.length;j++)if(j<i||j>=i+removed){const old=pieces[j],surviving=state.segments.find(x=>x.start===old.start&&x.end===old.end);assert.ok(surviving,'Every unaffected range must survive');assert.deepEqual(surviving,old);if(old.done)counts.unaffectedChecked++;}
  }
 }
 for(const op of ['label','toggle','split','merge'])assert.ok(counts[op]>=200,`${op} actual coverage: ${counts[op]}`);
 assert.equal(counts.label+counts.toggle+counts.split+counts.merge,8000);
 for(const [value,count] of Object.entries(labels))assert.ok(count>=100,`${value} actual label coverage: ${count}`);
 for(const key of ['checked','unchecked','unaffectedChecked'])assert.ok(counts[key]>=100,`${key} actual coverage: ${counts[key]}`);
 t.diagnostic(JSON.stringify({seed:'20261107/4B12F092/A19CE731',documents:200,actual:counts,labelValues:labels,noOps:0}));
});

test('parser rejects reordered duplicate ranges and multi-span coverage corruption',()=>{
 const valid={version:1,source:'same\r\nsame\r\nend',segments:[{start:0,end:6,label:'action',done:true},{start:6,end:12,label:'reference',done:false},{start:12,end:15,label:'unclear',done:false}]};
 assert.deepEqual(parse(JSON.stringify(valid)),valid);
 for(const [name,mutate] of [
  ['reverse',s=>s.segments.reverse()],
  ['swap duplicate text ranges',s=>[s.segments[0],s.segments[1]]=[s.segments[1],s.segments[0]]],
  ['middle gap',s=>s.segments[1].start++],
  ['middle overlap',s=>s.segments[1].start--],
  ['middle missing range',s=>s.segments.splice(1,1)],
  ['middle end gap',s=>s.segments[1].end-=2],
 ]){const invalid=structuredClone(valid);mutate(invalid);assert.throws(()=>parse(JSON.stringify(invalid)),/Invalid source mapping/,name);}
});

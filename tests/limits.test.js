import {test} from 'node:test';
import assert from 'node:assert/strict';
import {create,split,validate,serialize,parse,stats,MAX_PIECES} from '../core.js';
test('many lines are bounded without dropping a source unit',()=>{const source=' \r\n'.repeat(20000);const s=create(source);assert.equal(s.segments.length,MAX_PIECES);assert.equal(s.segments.map(x=>source.slice(x.start,x.end)).join(''),source);assert.equal(stats(s).covered,0);assert.equal(parse(serialize(s)).source,source);});
test('piece-limit rejection leaves the state unchanged',()=>{const s=create('a\n'.repeat(501)),before=serialize(s);assert.throws(()=>split(s,0,1),/Maximum 500/);assert.equal(serialize(s),before);});
test('oversized segment import is rejected before UI construction',()=>{const source='a'.repeat(501),segments=Array.from(source,(_,i)=>({start:i,end:i+1,label:'unreviewed',done:false}));assert.throws(()=>validate({version:1,source,segments}),/maximum 500/);});

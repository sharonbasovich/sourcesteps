import {test} from 'node:test';
import assert from 'node:assert/strict';
import {create,parse,serialize,split} from '../core.js';
for(const source of ['\uD83E\uDDE0','\r\n'])test(`import rejects the same unsafe boundary as manual split ${JSON.stringify(source)}`,()=>{
 const s={version:1,source,segments:[{start:0,end:1,label:'action',done:false},{start:1,end:2,label:'reference',done:false}]};
 assert.throws(()=>parse(JSON.stringify(s)),/Unicode pair|line ending/);
 assert.throws(()=>split(create(source),0,1),/Unicode pair|line ending/);
});
test('valid imported Unicode, line endings and unknown metadata remain lossless and canonical',()=>{
 const s=create('\uD83E\uDDE0 café\r\n\r\n  e\u0301\n');s.claim='all requirements complete';s.segments[0].text='forged display text';s.segments[0].complete=true;
 const restored=parse(JSON.stringify(s));assert.equal(restored.source,s.source);assert.equal('claim' in restored,false);assert.equal('text' in restored.segments[0],false);assert.equal('complete' in restored.segments[0],false);assert.deepEqual(parse(serialize(restored)),create(s.source));
});

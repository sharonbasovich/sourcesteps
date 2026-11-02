import {create,sample,split,merge,label,toggle,stats,serialize,parse} from './core.js';
const $=id=>document.getElementById(id);
let state=create(sample),active=null,epoch=0,importRequest=0,draftBaseline='';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const button=(text,fn,cls)=>{const b=el('button',text,cls);b.type='button';b.addEventListener('click',fn);return b;};
function announce(text){$('status').textContent=text;}
function act(fn,message,focusId){try{state=fn();epoch++;render();announce(message);if(focusId)$(focusId)?.focus();}catch(e){announce(e.message);}}
function hasDraft(){return $('source').value!==draftBaseline;}
function syncDraft(){
 const pending=hasDraft();
 $('source-draft').hidden=!pending;
 $('apply-source').disabled=!pending;
 $('discard-source').disabled=!pending;
 $('review-state').textContent=pending?'Review below still uses the applied source. Your draft has not changed any labels or checks.':'Review uses the applied source.';
 $('export').disabled=!state.source.length||pending;
}
function resetDraft(){ $('source').value=state.source;draftBaseline=$('source').value;syncDraft(); }
function replace(source,message){state=create(source);active=null;epoch++;resetDraft();render();announce(message);}
function render(){
 const n=stats(state);$('summary').replaceChildren(...[[`${n.covered} / ${n.total}`,'text units labeled'],[n.unreviewed,'unreviewed pieces'],[n.unclear,'unclear pieces'],[`${n.done} / ${n.actions}`,'actions checked']].map(([v,k])=>{const x=el('div');x.append(el('strong',String(v)),el('span',k));return x;}));
 $('context').textContent=state.source;$('segments').replaceChildren();
 if(!state.segments.length)$('segments').append(el('p','No source yet. Paste instructions or load the synthetic sample.','empty'));
 state.segments.forEach((x,i)=>{
  const row=el('article',undefined,'piece');row.id=`piece-${i}`;
  row.append(el('h3',`Piece ${i+1} · source units ${x.start}–${x.end} · ${x.label}${x.done?' · checked':''}`),el('p',state.source.slice(x.start,x.end),'quote'));
  const controls=el('div',undefined,'controls'),lab=el('label',`Label piece ${i+1}`),select=el('select');select.id=`label-${i}`;
  for(const v of ['unreviewed','action','reference','unclear']){const o=el('option',v[0].toUpperCase()+v.slice(1));o.value=v;select.append(o);}select.value=x.label;select.addEventListener('change',()=>act(()=>label(state,i,select.value),'Label saved. This is your review, not a completeness judgment.',select.id));lab.append(select);controls.append(lab);
  if(x.label==='action')controls.append(button('Focus this action',()=>{active=i;renderFocus();$('focus-title').focus();}));
  row.append(controls);
  const details=el('details'),summary=el('summary','Adjust piece boundaries');details.append(summary,el('p','Split at a character boundary using a UTF-16 offset (the same units used in the source range). Both resulting pieces become unreviewed. Merging also clears labels and checks.'));
  const offsetLabel=el('label',`Split offset for piece ${i+1}`),offset=el('input');offset.type='number';offset.min='1';offset.max=String(x.end-x.start-1);offset.value=String(Math.floor((x.end-x.start)/2));offset.id=`offset-${i}`;offsetLabel.htmlFor=offset.id;details.append(offsetLabel,offset);
  const splitButton=button('Split piece',()=>{act(()=>{const next=split(state,i,Number(offset.value));active=null;return next;},'Piece split. Review both new pieces.',`label-${i}`);});splitButton.disabled=x.end-x.start<2;details.append(splitButton);
  const mergeButton=button('Merge with next piece',()=>{act(()=>{const next=merge(state,i);active=null;return next;},'Adjacent pieces merged and set to unreviewed.',`label-${i}`);});mergeButton.disabled=i===state.segments.length-1;details.append(mergeButton);row.append(details);$('segments').append(row);
 });renderFocus();syncDraft();
}
function renderFocus(){const box=$('focus-content');box.replaceChildren();const actions=state.segments.map((x,i)=>({x,i})).filter(({x})=>x.label==='action');if(active===null||state.segments[active]?.label!=='action')active=actions.find(({x})=>!x.done)?.i??actions[0]?.i??null;
 if(active===null){box.append(el('p','Label a source piece “Action” to bring it into focus. Unreviewed and unclear text still needs attention.'));return;}
 const x=state.segments[active],index=actions.findIndex(a=>a.i===active);box.append(el('strong',`Action ${index+1} of ${actions.length} · source piece ${active+1}`),el('p',state.source.slice(x.start,x.end),'quote'));
 const lab=el('label'),check=el('input');check.type='checkbox';check.checked=x.done;check.addEventListener('change',()=>act(()=>toggle(state,active),'Your action check was updated. Review counts remain separate.','focus-title'));lab.append(check,el('span','I have completed this action'));box.append(lab);
 const prev=button('Previous action',()=>{active=actions[index-1].i;renderFocus();$('focus-title').focus();});prev.disabled=index===0;
 const next=button('Next action',()=>{active=actions[index+1].i;renderFocus();$('focus-title').focus();},'primary');next.disabled=index===actions.length-1;
 box.append(prev,next,button('Back to source piece',()=>{$(`label-${active}`).focus();}));
 const context=el('details');context.append(el('summary','Source context: previous, current and next piece'));const start=state.segments[Math.max(0,active-1)].start,end=state.segments[Math.min(state.segments.length-1,active+1)].end;context.append(el('pre',state.source.slice(start,end)));box.append(context,el('p',`${stats(state).unreviewed} unreviewed and ${stats(state).unclear} unclear pieces remain. References may contain requirements.`,'fine'));
}
resetDraft();
$('source').addEventListener('input',()=>{epoch++;syncDraft();announce(hasDraft()?'Source draft not applied. Apply it to restart review, or discard it to keep your progress.':'Draft matches the applied source. Review progress is unchanged.');});
$('apply-source').onclick=()=>{
 if(!hasDraft())return;
 let next;try{next=create($('source').value);}catch(error){announce(error.message+' Draft retained; applied source and review are unchanged.');$('source').focus();return;}
 const reviewed=state.segments.filter(x=>x.label!=='unreviewed').length,n=stats(state);
 if((reviewed||n.done)&&!confirm(`Apply the changed source? This resets ${reviewed} labeled pieces and ${n.done} checked actions. Cancel keeps your draft and existing review.`)){announce('Apply canceled. Draft and existing review kept.');$('apply-source').focus();return;}
 state=next;active=null;epoch++;resetDraft();render();announce('Source applied. Review the new pieces; previous labels, checks and focus links were reset.');$('source').focus();
};
$('discard-source').onclick=()=>{if(!hasDraft())return;epoch++;resetDraft();announce('Source draft discarded. Applied source, labels, checks and focus are unchanged.');$('source').focus();};
function confirmReplace(message,fn){if(confirm((hasDraft()?'Discard the unapplied source draft? ':'')+message))fn();}
$('sample').onclick=()=>confirmReplace('Replace this workspace with the synthetic sample? Export first to keep your work.',()=>replace(sample,'Synthetic sample loaded. Every piece is unreviewed.'));
$('clear').onclick=()=>confirmReplace('Clear all source and progress? Export first to keep your work.',()=>replace('','Workspace cleared.'));
$('restart').onclick=()=>confirmReplace('Restart all labels and checks, keeping the exact source?',()=>{state=create(state.source);active=null;epoch++;resetDraft();render();announce('Review restarted. Exact source preserved; all pieces are unreviewed.');});
$('export').onclick=()=>{if(hasDraft()){announce('Apply or discard the source draft before exporting.');return;}const url=URL.createObjectURL(new Blob([serialize(state)],{type:'application/json'}));const a=el('a');a.href=url;a.download='sourcesteps.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);announce('Export requested. Check browser downloads for sourcesteps.json; it contains your full source.');};
$('import').onchange=async e=>{const file=e.target.files[0],revision=epoch,request=++importRequest;e.target.value='';if(!file)return;try{if(file.size>2000000)throw Error('File exceeds the 2 MB limit.');const text=await file.text();if(request!==importRequest)return;const incoming=parse(text);if(revision!==epoch)throw Error('Workspace changed while reading. Import again when ready.');confirmReplace('Replace this workspace with the validated local file? Export first to keep your work.',()=>{state=incoming;active=null;epoch++;resetDraft();render();announce('Local file imported. Exact source and validated mappings restored.');});}catch(error){if(request===importRequest)announce(`Import rejected. ${error.message}`);}};
render();

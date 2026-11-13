(function(root){
 'use strict';
 const KEY='jason-maths-two-weeks-v1';
 const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 const stable=v=>JSON.stringify(v,(_,value)=>object(value)?Object.fromEntries(Object.keys(value).sort().map(key=>[key,value[key]])):value);
 function session(value){
  if(!object(value)||![1,2].includes(value.week)||!Array.isArray(value.ids)||!value.ids.length||value.ids.length>12||new Set(value.ids).size!==value.ids.length||!value.ids.every(id=>Number.isInteger(id)&&id>=0&&id<21)||!['solve','check','done'].includes(value.phase)||!Number.isFinite(value.deadline))throw Error('Invalid maths session');
  const cleanAnswers=answers=>Object.fromEntries(value.ids.filter(id=>Number.isInteger(answers?.[id])&&answers[id]>=0&&answers[id]<5).map(id=>[id,answers[id]]));
  const startedAt=Number.isFinite(value.startedAt)?value.startedAt:Math.max(0,value.deadline-(value.phase==='solve'?(value.week===1?15:18):3)*60000);
  return {id:typeof value.id==='string'?value.id:'legacy-'+value.week+'-'+value.deadline+'-'+value.ids.join('-'),startedAt,updatedAt:Number.isFinite(value.updatedAt)?value.updatedAt:startedAt,week:value.week,ids:value.ids,phase:value.phase,answers:cleanAnswers(value.answers),first:value.first===null?null:cleanAnswers(value.first),flagged:Object.fromEntries(value.ids.filter(id=>value.flagged?.[id]===true).map(id=>[id,true])),deadline:value.deadline};
 }
 function normalize(value){
  if(!object(value)||value.history!==undefined&&!Array.isArray(value.history)||value.archivedSessions!==undefined&&!Array.isArray(value.archivedSessions))throw Error('Invalid maths progress');
  return {attemptTags:Object.fromEntries(Object.entries(object(value.attemptTags)?value.attemptTags:{}).filter(([,tag])=>object(tag)&&typeof tag.preview==='boolean'&&Number.isFinite(tag.updatedAt))),history:(value.history||[]).filter(row=>object(row)&&[1,2].includes(row.week)&&Number.isInteger(row.total)&&Number.isInteger(row.first)&&Number.isInteger(row.checked)),session:value.session?session(value.session):null,archivedSessions:(value.archivedSessions||[]).map(session)};
 }
 function merge(local,remote){
  const left=normalize(local),right=normalize(remote),sessions=new Map();
  for(const item of [...left.archivedSessions,left.session,...right.archivedSessions,right.session].filter(Boolean)){
   const old=sessions.get(item.id);
   // Completed attempts are immutable; otherwise use the latest saved version.
   const rank=x=>(x.phase==='done'?2:x.phase==='check'?1:0);
   if(!old||rank(item)>rank(old)||rank(item)===rank(old)&&(item.updatedAt>old.updatedAt||item.updatedAt===old.updatedAt&&stable(item)>stable(old)))sessions.set(item.id,item);
  }
  const ordered=[...sessions.values()].sort((a,b)=>a.startedAt-b.startedAt||a.id.localeCompare(b.id));
  const history=new Map();
  for(const row of [...left.history,...right.history]){
   const key=row.id||stable([row.at,row.week,row.total,row.first,row.checked]);
   const old=history.get(key);if(!old||stable(row)>stable(old))history.set(key,row);
  }
  const attemptTags={...left.attemptTags};
  for(const [key,tag] of Object.entries(right.attemptTags)){const old=attemptTags[key];if(!old||tag.updatedAt>old.updatedAt||tag.updatedAt===old.updatedAt&&stable(tag)>stable(old))attemptTags[key]=tag}
  return {attemptTags,history:[...history.values()].sort((a,b)=>String(a.at||'').localeCompare(String(b.at||''))||stable(a).localeCompare(stable(b))),session:ordered.at(-1)||null,archivedSessions:ordered.slice(0,-1)};
 }
 function records(value){
  const saved=normalize(value),rows=new Map();
  for(const attempt of [...saved.archivedSessions,saved.session].filter(Boolean))rows.set(attempt.id,{key:attempt.id,attempt,summary:null,at:attempt.startedAt});
  for(const summary of saved.history){
   const key=summary.id||'summary-'+stable(summary);
   if(rows.has(key)){rows.get(key).summary=summary;continue}
   const hasAnswers=Array.isArray(summary.ids)&&object(summary.answers);
   const at=Date.parse(summary.at)||0;
   const attempt=hasAnswers?{id:key,week:summary.week,ids:summary.ids,phase:'done',answers:summary.answers,first:summary.firstAnswers||{},flagged:summary.flagged||{},startedAt:at,deadline:at,updatedAt:at}:null;
   rows.set(key,{key,attempt,summary,at});
  }
  return [...rows.values()].map(row=>({...row,preview:isPreview(saved,row.key)})).sort((a,b)=>b.at-a.at||a.key.localeCompare(b.key));
 }
 function mistakes(value,questions){
  const byQuestion=new Map();
  for(const record of records(value).slice().reverse()){
   const attempt=record.attempt;if(record.preview||!attempt||attempt.phase!=='done')continue;
   for(const id of attempt.ids){
    const q=questions[id];if(!q)continue;
    const first=attempt.first?.[id],answer=attempt.answers[id];
    const occurrence={key:record.key,at:record.at,first,answer,firstWrong:first!==q.a,wrong:answer!==q.a};
    if(!byQuestion.has(id))byQuestion.set(id,[]);
    byQuestion.get(id).push(occurrence);
   }
  }
  return [...byQuestion].filter(([,occurrences])=>occurrences.some(o=>o.firstWrong||o.wrong)).map(([id,occurrences])=>({id,occurrences,latest:occurrences.at(-1),needsPractice:occurrences.at(-1).wrong}));
 }
 const isPreview=(value,key)=>value.attemptTags?.[key]?.preview===true;
 const api={KEY,normalize,merge,stable,records,mistakes,isPreview};
 root.AdventureMaths=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);

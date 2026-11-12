(function(root){
 'use strict';
 const KEY='jason-maths-two-weeks-v1';
 const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 const stable=v=>JSON.stringify(v,(_,value)=>object(value)?Object.fromEntries(Object.keys(value).sort().map(key=>[key,value[key]])):value);
 function session(value){
  if(!object(value)||![1,2].includes(value.week)||!Array.isArray(value.ids)||!value.ids.length||value.ids.length>12||new Set(value.ids).size!==value.ids.length||!value.ids.every(id=>Number.isInteger(id)&&id>=0&&id<12)||!['solve','check','done'].includes(value.phase)||!Number.isFinite(value.deadline))throw Error('Invalid maths session');
  const cleanAnswers=answers=>Object.fromEntries(value.ids.filter(id=>Number.isInteger(answers?.[id])&&answers[id]>=0&&answers[id]<5).map(id=>[id,answers[id]]));
  const startedAt=Number.isFinite(value.startedAt)?value.startedAt:Math.max(0,value.deadline-(value.phase==='solve'?(value.week===1?15:18):3)*60000);
  return {id:typeof value.id==='string'?value.id:'legacy-'+value.week+'-'+value.deadline+'-'+value.ids.join('-'),startedAt,updatedAt:Number.isFinite(value.updatedAt)?value.updatedAt:startedAt,week:value.week,ids:value.ids,phase:value.phase,answers:cleanAnswers(value.answers),first:value.first===null?null:cleanAnswers(value.first),flagged:Object.fromEntries(value.ids.filter(id=>value.flagged?.[id]===true).map(id=>[id,true])),deadline:value.deadline};
 }
 function normalize(value){
  if(!object(value)||value.history!==undefined&&!Array.isArray(value.history)||value.archivedSessions!==undefined&&!Array.isArray(value.archivedSessions))throw Error('Invalid maths progress');
  return {history:(value.history||[]).filter(row=>object(row)&&[1,2].includes(row.week)&&Number.isInteger(row.total)&&Number.isInteger(row.first)&&Number.isInteger(row.checked)),session:value.session?session(value.session):null,archivedSessions:(value.archivedSessions||[]).map(session)};
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
  return {history:[...history.values()].sort((a,b)=>String(a.at||'').localeCompare(String(b.at||''))||stable(a).localeCompare(stable(b))),session:ordered.at(-1)||null,archivedSessions:ordered.slice(0,-1)};
 }
 const api={KEY,normalize,merge,stable};
 root.AdventureMaths=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);

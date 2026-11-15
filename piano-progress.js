(function(root){
 'use strict';
 const learners=['emily','jason'],tasks=['scales','piece','explore'];
 const milestones=[{days:3,icon:'🥚',title:'Meet your music buddy',detail:'Your mystery egg hatches!'},{days:5,icon:'🌸',title:'A dancing garden',detail:'Your buddy dances beside a new music flower.'},{days:10,icon:'🏡',title:'A music cottage',detail:'A cosy home appears on your island.'},{days:15,icon:'🎻',title:'A new instrument',detail:'Your buddy gets a little violin.'},{days:20,icon:'🌌',title:'The starlight stage',detail:'A sparkling stage rises above the water.'},{days:30,icon:'🎉',title:'Island concert',detail:'Your music buddy is ready for the big show!'}];
 const key=learner=>{if(!learners.includes(learner))throw Error('Unknown learner');return 'adventure-piano-v1:'+learner};
 function day(date=new Date()){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-')}
 function validDay(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value}
 function normalize(value){
  if(value==null)return {version:1,days:{}};
  if(typeof value!=='object'||Array.isArray(value)||value.version!==1||!value.days||typeof value.days!=='object'||Array.isArray(value.days))throw Error('Invalid piano record');
  const days={};for(const [date,entry] of Object.entries(value.days)){if(!validDay(date)||!entry||typeof entry!=='object'||typeof entry.at!=='string'||!Number.isFinite(Date.parse(entry.at)))continue;days[date]={at:new Date(entry.at).toISOString(),tasks:tasks.filter(t=>Array.isArray(entry.tasks)&&entry.tasks.includes(t))}}
  return {version:1,days:Object.fromEntries(Object.entries(days).sort(([a],[b])=>a.localeCompare(b)))};
 }
 function merge(left,right){const a=normalize(left),b=normalize(right),days={...a.days};for(const [date,entry] of Object.entries(b.days)){const old=days[date];days[date]=old?{at:old.at<entry.at?old.at:entry.at,tasks:tasks.filter(t=>old.tasks.includes(t)||entry.tasks.includes(t))}:entry}return normalize({version:1,days})}
 function check(value,selected=[],date=new Date()){const result=normalize(value),today=day(date);if(result.days[today])return {changed:false,value:result};result.days[today]={at:date.toISOString(),tasks:tasks.filter(t=>selected.includes(t))};return {changed:true,value:normalize(result)}}
 const count=value=>Object.keys(normalize(value).days).length;
 const next=value=>milestones.find(m=>m.days>count(value))||null;
 function duet(a,b){const right=normalize(b).days;return Object.keys(normalize(a).days).filter(date=>right[date]).length}
 function load(storage,learner){const raw=storage.getItem(key(learner));return normalize(raw?JSON.parse(raw):null)}
 const api={learners,tasks,milestones,key,day,normalize,merge,check,count,next,duet,load};root.AdventurePiano=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);

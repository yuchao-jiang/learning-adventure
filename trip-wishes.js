(function(root){
'use strict';
const KEY='jason-trip-wishes-v1',validId=id=>/^trip-([1-9]|1[0-9]|2[0-4])$/.test(id);
function normalize(value){
 const entries=value?.version===1&&value.wishes&&typeof value.wishes==='object'&&!Array.isArray(value.wishes)?Object.entries(value.wishes):[];
 return {version:1,wishes:Object.fromEntries(entries.filter(([id,row])=>validId(id)&&typeof row?.wanted==='boolean'&&Number.isSafeInteger(row.at)&&row.at>=0).sort(([a],[b])=>a.localeCompare(b)).map(([id,row])=>[id,{wanted:row.wanted,at:row.at}]))};
}
function load(storage){try{return normalize(JSON.parse(storage.getItem(KEY)||'null'))}catch{return normalize(null)}}
function merge(local,remote){
 const a=normalize(local),b=normalize(remote),wishes={};
 for(const id of new Set([...Object.keys(a.wishes),...Object.keys(b.wishes)])){
 const x=a.wishes[id],y=b.wishes[id];
 // Keep removals as dated entries so stale devices cannot resurrect a choice.
 wishes[id]=!x?y:!y?x:x.at>y.at?x:y.at>x.at?y:{wanted:x.wanted&&y.wanted,at:x.at};
 }
 return normalize({version:1,wishes});
}
function set(storage,id,wanted,now=Date.now()){
 if(!validId(id)||typeof wanted!=='boolean'||!Number.isSafeInteger(now)||now<0)throw Error('Invalid trip choice');
 const state=load(storage);state.wishes[id]={wanted,at:Math.max(now,(state.wishes[id]?.at||0)+1)};
 const clean=normalize(state);storage.setItem(KEY,JSON.stringify(clean));return clean;
}
const api={KEY,normalize,load,merge,set};root.TripWishes=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);

(function(root){
'use strict';
const badges=[['🏰','Hong Kong Explorer'],['🐳','Ocean Explorer'],['🐼','Wildlife Explorer'],['🌆','City Explorer']];
const counts={maths:[9,9,8,9],english:[6,8,11,8],thinking:[8,8,7,7]};
const thinkingNames=['Clue Detectives','Puzzle Explorers','Clever Connections','Final Quest'];
// Future boosts are chosen from each week's observations before becoming playable.
const reviewSets=[[
 {id:'review-maths',title:'🧮 Graph clues & outside edges'},
 {id:'review-english',title:'📖 Connect the sentences'},
 {id:'review-thinking',title:'💡 Plan & prove'}
],null,null,null];
function status(model,storage,setId){
 try{const rows=Object.values(model.load(storage).attempts).filter(a=>a.setId===setId&&!a.parentTest);
 return rows.some(a=>a.phase==='done')?'completed':rows.length?'in-progress':'ready';
 }catch{return 'ready'}
}
function mathsStatus(model,storage,week){
 try{const rows=model.records(JSON.parse(storage.getItem(model.KEY)||'{}')).filter(row=>!row.preview&&model.partForIds(row.attempt?.ids||row.summary?.ids)?.id==='maths-1-week-'+week);
 return rows.some(row=>row.attempt?.phase==='done')?'completed':rows.length?'in-progress':'ready';
 }catch{return 'ready'}
}
function summarize(weeks){
 const finished=weeks.map(items=>items.filter(item=>item.state==='completed').length);
 return {weeks,finished,total:finished.reduce((a,b)=>a+b,0),target:24,badges:finished.map(n=>n===6),earned:finished.filter(n=>n===6).length};
}
function read(storage,models){
 return summarize(Array.from({length:4},(_,index)=>{
 const w=index+1;
 const items=[
 {id:'maths-'+w,title:'🧮 Maths 1 · Week '+w,detail:counts.maths[index]+' questions · 20 minutes + 5 to check',state:mathsStatus(models.maths,storage,w),href:'./jason-maths.html?part=maths-1-week-'+w},
 {id:'english-'+w,title:'📖 English 1 · Week '+w,detail:counts.english[index]+' questions · 20 minutes + 5 to check',state:status(models.reading,storage,'english-1-week-'+w),href:'./jason-english.html?week='+w},
 {id:'thinking-'+w,title:'💡 '+thinkingNames[index],detail:counts.thinking[index]+' questions · 15 minutes + 5 to check',state:w===1?'completed':status(models.thinking,storage,'oc'+w),credited:w===1,href:w===1?'./jason-thinking.html?view=history':'./jason-thinking.html?week='+w}
 ];
 for(let subject=0;subject<3;subject++){
 const set=reviewSets[index]?.[subject];
 items.push(set?{...set,id:'boost-'+w+'-'+subject,detail:'2 fresh questions · about 5–10 minutes · No timer',state:status(models.review,storage,set.id),href:'./jason-review.html?set='+set.id}:{id:'boost-'+w+'-'+subject,title:['🧮 Maths skill boost','📖 English skill boost','💡 Thinking skill boost'][subject],detail:'Chosen after reviewing your work',state:'planned'});
 }
 return items;
 }));
}
const api={badges,read,summarize};root.WeeklyProgress=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);

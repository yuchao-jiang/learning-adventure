(function(root){
'use strict';
const $=id=>document.getElementById(id),P=root.WeeklyProgress,SEEN='jason-adventure-celebrations-v1';
let week=1,seen=null;
try{week=Number(localStorage.getItem('jason-dashboard-week'))||1;const saved=JSON.parse(localStorage.getItem(SEEN)||'null');if(saved?.version===1&&Array.isArray(saved.ids))seen=new Set(saved.ids.filter(id=>typeof id==='string'))}catch{}
if(![1,2,3,4].includes(week))week=1;
function element(tag,text,cls){const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e}
function card(item){
 const done=item.state==='completed',planned=item.state==='planned',a=document.createElement(planned?'div':'a');
 a.className='weekly-card'+(done?' is-complete':'');a.dataset.state=item.state;
 if(!planned)a.href=done?item.href.split('?')[0]+'?view=history':item.href;
 const state=done?(item.credited?'✓ Already finished for Week 1':'✓ Finished · Star earned'):planned?'A little practice to come':item.state==='in-progress'?'In progress':'Ready when you are';
 a.append(element('h3',item.title),element('p',item.detail),element('span',state,'weekly-status'),element('span',done?'See my work →':planned?'Coming after review':item.state==='in-progress'?'Keep going →':'Have a go →','weekly-action'));
 return a;
}
function choose(w){week=w;try{localStorage.setItem('jason-dashboard-week',String(w))}catch{}$('weekly-celebration').hidden=true;render()}
function celebrate(progress,newlyDone){
 if(!newlyDone.length)return;
 const notice=$('weekly-celebration'),all=progress.total===progress.target;
 const newBadges=progress.badges.map((earned,i)=>earned&&progress.weeks[i].some(item=>newlyDone.includes(item.id))?i:-1).filter(i=>i>=0);
 const last=newBadges.at(-1),title=all?'🌕 Moon mission complete!':last!==undefined?P.badges[last][0]+' '+P.badges[last][1]+' badge earned!':newlyDone.length>1?'⭐ More adventure stars earned!':'⭐ Another adventure star!';
 const message=all?'Four weekly badges collected. You tried, checked and kept learning.':last!==undefined?'Week '+(last+1)+' is complete. Your badge stays in your collection.':'Your effort moved you one step closer. Keep growing, Jason!';
 const dismiss=element('button','Got it','weekly-dismiss');dismiss.type='button';dismiss.onclick=()=>{notice.hidden=true};
 notice.replaceChildren(element('strong',title),element('p',message),dismiss);notice.hidden=false;
 const ship=$('weekly-ship');ship.classList.remove('weekly-launch');void ship.offsetWidth;ship.classList.add('weekly-launch');
}
function render(){
 const progress=P.read(localStorage,{maths:root.AdventureMaths,reading:root.ReadingProgress,thinking:root.ThinkingProgress,review:root.WeeklyReviewProgress});
 const finishedIds=progress.weeks.flat().filter(item=>item.state==='completed').map(item=>item.id),newlyDone=seen?finishedIds.filter(id=>!seen.has(id)):[];
 seen=seen||new Set();finishedIds.forEach(id=>seen.add(id));try{localStorage.setItem(SEEN,JSON.stringify({version:1,ids:[...seen]}))}catch{}
 $('weekly-total').textContent='★ '+progress.total+' / 24 adventure stars';$('weekly-month-progress').setAttribute('aria-valuenow',progress.total);$('weekly-month-fill').style.width=progress.total/24*100+'%';
 $('weekly-route').replaceChildren(...progress.weeks.map((items,i)=>{
 const button=document.createElement('button');button.type='button';button.className='weekly-stop'+(progress.badges[i]?' badge-earned':'');button.setAttribute('aria-pressed',i+1===week);button.setAttribute('aria-label','Week '+(i+1)+', '+progress.finished[i]+' of 6 finished, '+P.badges[i][1]+(progress.badges[i]?' badge earned':''));
 button.append(element('span',progress.badges[i]?P.badges[i][0]:'☆','weekly-badge-icon'),element('strong','Week '+(i+1)),element('span',progress.finished[i]+' / 6','weekly-week-count'),element('span',P.badges[i][1]+(progress.badges[i]?' ✓':' to earn'),'weekly-badge-name'));button.onclick=()=>choose(i+1);return button;
 }));
 const stage=progress.earned;
 $('weekly-mission-title').textContent=['Build your launch pad','Your rocket is ready','You’re exploring space','The moon is in sight','Moon mission complete!'][stage];
 $('weekly-mission-detail').textContent=stage===4?'Four badges collected. Look how far your effort has taken you.':stage+' of 4 weekly badges collected · Finish a week to earn its badge.';
 $('weekly-ship').textContent=stage===4?'🌕':stage===0?'🛠️':'🚀';
 $('weekly-title').textContent='Week '+week+' · '+progress.finished[week-1]+' of 6 finished';
 const items=progress.weeks[week-1],trail=$('weekly-trail');trail.setAttribute('aria-label',progress.finished[week-1]+' of 6 weekly stars earned');trail.replaceChildren(...items.map(item=>{const star=element('span',item.state==='completed'?'★':'☆','weekly-star'+(item.state==='completed'?' earned':''));star.setAttribute('aria-hidden','true');return star}));
 $('weekly-caption').textContent=progress.badges[week-1]?'You earned your '+P.badges[week-1][1]+' badge. Great effort!':'New questions and short practice both count. Take it one adventure at a time.';
 $('weekly-new').replaceChildren(...items.slice(0,3).map(card));$('weekly-refresh').replaceChildren(...items.slice(3).map(card));
 $('weekly-boost-note').hidden=week===1;
 celebrate(progress,newlyDone);
}
for(const event of ['thinking-restored','reading-restored','weekly-review-restored','storage','focus','pageshow'])root.addEventListener(event,render);
render();
})(window);

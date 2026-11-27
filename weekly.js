(function(root){
'use strict';
const $=id=>document.getElementById(id),P=root.WeeklyProgress,SEEN='jason-adventure-celebrations-v1';
let week=1,seen=null,wishView='discover';
try{week=Number(localStorage.getItem('jason-dashboard-week'))||1;const saved=JSON.parse(localStorage.getItem(SEEN)||'null');if(saved?.version===1&&Array.isArray(saved.ids))seen=new Set(saved.ids.filter(id=>typeof id==='string'))}catch{}
if(![1,2,3,4].includes(week))week=1;
function element(tag,text,cls){const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e}
function card(item){
 const done=item.state==='completed',planned=item.state==='planned',a=document.createElement(planned?'div':'a');
 a.className='weekly-card'+(done?' is-complete':'');a.dataset.state=item.state;
 if(!planned)a.href=done?item.href.split('?')[0]+'?view=history':item.href;
 const state=done?(item.optional?'✓ Finished · Extra practice':item.credited?'✓ Already finished for Week 1':'✓ Finished · Discovery revealed'):planned?'A little practice to come':item.state==='in-progress'?'In progress':'Ready when you are';
 a.append(element('h3',item.title),element('p',item.detail),element('span',state,'weekly-status'),element('span',done?'See my work →':planned?'Coming after review':item.state==='in-progress'?'Keep going →':'Have a go →','weekly-action'));
 return a;
}
function choose(w){week=w;wishView='discover';try{localStorage.setItem('jason-dashboard-week',String(w))}catch{}$('weekly-celebration').hidden=true;render()}
function celebrate(progress,newlyDone){
 if(!newlyDone.length)return;
 const notice=$('weekly-celebration'),all=progress.total===progress.target;
 const newBadges=progress.badges.map((earned,i)=>earned&&progress.weeks[i].some(item=>newlyDone.includes(item.id))?i:-1).filter(i=>i>=0);
 const last=newBadges.at(-1),title=all?'🎉 Your discovery collection is complete!':last!==undefined?P.badges[last][0]+' '+P.badges[last][1]+' badge earned!':newlyDone.length>1?'🎉 New discoveries are waiting!':'🎉 A new trip discovery!';
 const message=all?'Four weekly badges collected. You tried, checked and kept learning.':last!==undefined?'Week '+(last+1)+' is complete. Your badge stays in your collection.':'Your effort revealed another idea. Would you like to add it to your trip wish list?';
 const dismiss=element('button','Got it','weekly-dismiss');dismiss.type='button';dismiss.onclick=()=>{notice.hidden=true};
 notice.replaceChildren(element('strong',title),element('p',message),dismiss);notice.hidden=false;
 const ship=$('weekly-ship');ship.classList.remove('weekly-reveal');void ship.offsetWidth;ship.classList.add('weekly-reveal');
}
function render(){
 const progress=P.read(localStorage,{maths:root.AdventureMaths,reading:root.ReadingProgress,thinking:root.ThinkingProgress,review:root.WeeklyReviewProgress});
 const finishedIds=progress.weeks.flat().filter(item=>item.state==='completed').map(item=>item.id),newlyDone=seen?finishedIds.filter(id=>!seen.has(id)):[];
 seen=seen||new Set();finishedIds.forEach(id=>seen.add(id));try{localStorage.setItem(SEEN,JSON.stringify({version:1,ids:[...seen]}))}catch{}
 $('weekly-total').textContent=progress.total+' / 24 discoveries';$('weekly-month-progress').setAttribute('aria-valuenow',progress.total);$('weekly-month-fill').style.width=progress.total/24*100+'%';
 $('weekly-route').replaceChildren(...progress.weeks.map((items,i)=>{
 const button=document.createElement('button');button.type='button';button.className='weekly-stop'+(progress.badges[i]?' badge-earned':'');button.setAttribute('aria-pressed',i+1===week);button.setAttribute('aria-label','Week '+(i+1)+', '+progress.finished[i]+' of 6 finished, '+P.badges[i][1]+(progress.badges[i]?' badge earned':''));
 button.append(element('span',P.badges[i][0],'weekly-badge-icon'),element('strong','Week '+(i+1)),element('span',progress.finished[i]+' / 6','weekly-week-count'),element('span',['Hong Kong','Zhuhai Chimelong','Guangzhou Chimelong','Guangzhou city'][i],'weekly-destination'),element('span',P.badges[i][1]+(progress.badges[i]?' ✓':' to earn'),'weekly-badge-name'));button.onclick=()=>choose(i+1);return button;
 }));
 const stage=progress.earned;
 $('weekly-mission-title').textContent=stage===4?'Your discovery collection is complete!':'A new idea for your family trip';
 $('weekly-mission-detail').textContent=stage===4?'Four badges collected. Keep your favourite discoveries on your wish list.':'Finish an activity to reveal a discovery. Save the ideas you would like to try.';
 $('weekly-ship').textContent='🗺️';
 $('weekly-title').textContent='Week '+week+' · '+progress.finished[week-1]+' of 6 finished';
 const items=progress.weeks[week-1],trail=$('weekly-trail');trail.setAttribute('aria-label',progress.finished[week-1]+' of 6 weekly discoveries revealed');trail.replaceChildren(...items.map(item=>{const star=element('span',item.state==='completed'?'★':'☆','weekly-star'+(item.state==='completed'?' earned':''));star.setAttribute('aria-hidden','true');return star}));
 $('weekly-caption').textContent=progress.badges[week-1]?'You earned your '+P.badges[week-1][1]+' badge. Great effort!':'New questions and short practice both count. Take it one adventure at a time.';
 $('weekly-new').replaceChildren(...items.slice(0,3).map(card));$('weekly-refresh').replaceChildren(...items.slice(3).map(card));
 $('weekly-boost-note').hidden=week===1;
 const extras=P.extras(localStorage,{review:root.WeeklyReviewProgress},week);$('weekly-extras-section').hidden=!extras.length;$('weekly-extras').replaceChildren(...extras.map(card));
 renderDiscoveries(progress);
 celebrate(progress,newlyDone);
}
function renderDiscoveries(progress){
 const wishes=root.TripWishes.load(localStorage),all=root.TripDiscoveries;
 const favourites=all.filter(item=>wishes.wishes[item.id]?.wanted);
 $('trip-discover').setAttribute('aria-pressed',wishView==='discover');$('trip-saved').setAttribute('aria-pressed',wishView==='saved');
 $('trip-saved').textContent='♡ My wish list · '+favourites.length;
 const cards=wishView==='saved'?favourites:all.filter(item=>item.week===week),host=$('trip-cards');host.replaceChildren();
 if(!cards.length)host.append(element('p','Spot something you like? Tap “I’d like to try this!” to save it here.','trip-empty'));
 for(const item of cards){
 const revealed=wishView==='saved'||(all.filter(d=>d.week===item.week).findIndex(d=>d.id===item.id)<progress.finished[item.week-1]);
 const article=document.createElement('article');article.className='trip-discovery'+(!revealed?' trip-mystery':'');article.dataset.id=item.id;article.dataset.revealed=String(revealed);
 const art=element('div',revealed?item.icon:'?','trip-postcard');art.setAttribute('aria-hidden','true');article.append(art,element('h3',revealed?item.title:'A surprise to discover'),element('p',revealed?item.intro:'Reveal with your next finished activity.'));
 if(revealed){
 const pictures=element('a','See pictures','trip-picture-link');pictures.href=item.url;pictures.target='_blank';pictures.rel='noopener noreferrer';pictures.setAttribute('aria-label','See pictures: '+item.title);
 const wanted=!!wishes.wishes[item.id]?.wanted,button=element('button',wanted?'♥ On my wish list':'♡ I’d like to try this!','trip-wish-button');button.type='button';button.id='wish-'+item.id;button.setAttribute('aria-pressed',wanted);button.setAttribute('aria-label',(wanted?'Remove from wish list: ':'Add to wish list: ')+item.title);
 button.onclick=()=>{
 try{root.TripWishes.set(localStorage,item.id,!wanted);$('trip-save-status').textContent='Choice saved on this device.';root.dispatchEvent(new Event('adventure-trip-wishes-changed'));render();const next=$('wish-'+item.id)||$('trip-saved');next.focus?.()}
 catch{$('trip-save-status').textContent='Could not save your choice here. Please try again.'}
 };
 article.append(pictures,element('small',item.source,'trip-picture-source'),button);
 }
 host.append(article);
 }
 $('trip-caption').textContent=wishView==='saved'?'Your ideas to choose together with your family.':progress.finished[week-1]+' of 6 ideas discovered this week · Pick the ones you like.';
}
$('trip-discover').onclick=()=>{wishView='discover';render()};$('trip-saved').onclick=()=>{wishView='saved';render()};
for(const event of ['thinking-restored','reading-restored','weekly-review-restored','trip-wishes-restored','storage','focus','pageshow'])root.addEventListener(event,render);
render();
})(window);

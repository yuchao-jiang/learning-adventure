(function(){
'use strict';
const key='emily-parcel-v1';
const questions=[
 {scene:'A colourful parcel arrives at the animal rescue centre. The label reads: “For the new puppy. Open before the party!”',q:'Who is the parcel for?',options:['The new puppy','The postman','The kitten'],answer:0,hint:'Look for the words after “For”.',skill:'Reading for details'},
 {scene:'Emily opens the parcel. Inside are 4 blue ribbons and 3 yellow ribbons.',q:'How many ribbons are there altogether?',options:['6','7','8'],answer:1,hint:'Count four, then three more.',skill:'Addition'},
 {scene:'A note says: “Put the tiny red bow beside the large green box.”',q:'Which word means the opposite of “tiny”?',options:['Red','Large','Beside'],answer:1,hint:'Think of something that is very big.',skill:'Vocabulary'},
 {scene:'There are 8 biscuits for the puppies. Two puppies each eat 2 biscuits.',q:'How many biscuits are left?',options:['2','4','6'],answer:1,hint:'How many were eaten in total?',skill:'Subtraction'},
 {scene:'Emily finds a clue: “First find the star, then look under the table.”',q:'What should Emily do FIRST?',options:['Look under the table','Find the star','Open another parcel'],answer:1,hint:'The clue tells you the order.',skill:'Following instructions'},
 {scene:'The party begins at 2:00 pm. Emily arrives at 1:30 pm.',q:'How many minutes early is Emily?',options:['15 minutes','30 minutes','60 minutes'],answer:1,hint:'Count from half past one to two o’clock.',skill:'Time'},
 {scene:'The puppy wears a shiny ribbon. Emily writes a thank-you card.',q:'Which sentence is written correctly?',options:['thank you for the gift.','Thank you for the gift.','Thank you for the gift'],answer:1,hint:'Check the capital letter and full stop.',skill:'Punctuation'},
 {scene:'The final note says: “The surprise is behind the blue door.” Emily sees a red door and a blue door.',q:'Which door should she choose?',options:['The red door','The blue door','Either door'],answer:1,hint:'Read the colour in the clue.',skill:'Reading carefully'}
];
let state={step:0,solved:[],hints:[]};
try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved&&Array.isArray(saved.solved))state={...state,...saved}}catch(e){}
const $=id=>document.getElementById(id);
function save(){localStorage.setItem(key,JSON.stringify(state));window.dispatchEvent(new Event('adventure-progress-changed'))}
function render(){
 const done=questions.filter((_,i)=>state.solved[i]).length;
 $('parcel-stars').textContent='⭐'.repeat(done)||'☆';
 $('parcel-status').textContent=done===questions.length?'✅ Adventure complete!':done?'Continue your adventure':'Start the adventure';
 $('parcel-count').textContent=done+' of '+questions.length+' clues solved';
 $('parcel-fill').style.width=(done/questions.length*100)+'%';
 const area=$('parcel-question');area.replaceChildren();
 $('parcel-feedback').textContent='';
 $('parcel-next').hidden=true;
 $('parcel-hint').hidden=false;
 const step=Math.min(Number(state.step)||0,questions.length);
 if(step===questions.length){const p=document.createElement('div');p.className='end';p.textContent='🎉 Surprise! The puppies have a party! You solved every clue. ⭐ Great work, Emily!';area.append(p);$('parcel-hint').hidden=true;return}
 const q=questions[step],intro=document.createElement('p');intro.className='story';intro.style.padding='14px';intro.textContent=q.scene;area.append(intro);
 const title=document.createElement('h3');title.textContent='Clue '+(step+1)+': '+q.q;area.append(title);
 const skill=document.createElement('p');skill.className='muted';skill.textContent='Mission skill: '+q.skill;area.append(skill);
 const choices=document.createElement('div');choices.className='choices';
 q.options.forEach((option,i)=>{const b=document.createElement('button');b.type='button';b.textContent=option;b.disabled=!!state.solved[step];b.onclick=()=>{if(i===q.answer){state.solved[step]=true;save();render();$('parcel-feedback').textContent='🌟 You found the clue!';$('parcel-next').hidden=false}else{$('parcel-feedback').textContent='💛 Not quite. Read the clue and try again!'}};choices.append(b)});
 area.append(choices);
 if(state.solved[step]){$('parcel-feedback').textContent='🌟 You found the clue!';$('parcel-next').hidden=false}
 $('parcel-hint').onclick=()=>{$('parcel-feedback').textContent='💡 '+q.hint};
}
$('parcel-open').onclick=()=>{['hub','worksheet-view','shop-view','cupcake-view'].forEach(id=>$(id).hidden=true);$('parcel-view').hidden=false;render();window.scrollTo({top:0,behavior:'smooth'})};
$('parcel-back').onclick=()=>{$('parcel-view').hidden=true;$('hub').hidden=false};
$('parcel-next').onclick=()=>{state.step=Math.min(questions.length,state.step+1);save();render()};
$('parcel-save').onclick=async()=>{const ok=typeof window.adventureCloudSave==='function'&&await window.adventureCloudSave();$('parcel-save-status').textContent=ok?'🌈 Your clues are saved to the family cloud!':'Saved on this device. Cloud saving did not finish.'};
window.addEventListener('storage',e=>{if(e.key===key){try{const fresh=JSON.parse(e.newValue);if(fresh&&Array.isArray(fresh.solved)){state=fresh;render()}}catch(e){}}});
render();
})();

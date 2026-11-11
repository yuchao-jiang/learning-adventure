// Cloud sync is enabled after cloud-config.js defines window.ADVENTURE_SYNC_URL.
// Local device progress remains available independently of the cloud.
(function(){
 const configuredUrl=String(window.ADVENTURE_SYNC_URL||'').replace(/[/]$/,'');
 const url=configuredUrl.startsWith('https://')?configuredUrl:'';
 const child=document.body.dataset.learner;
 if(!['emily','jason'].includes(child))return;
 if(child==='emily'){const saveButton=document.createElement('button');saveButton.type='button';saveButton.textContent='🌟 Keep My Stars Safe!';saveButton.style.cssText='margin:12px 0;padding:12px 18px;border-radius:12px;background:#d9f3e4;border:2px solid #39976e;font-weight:700';const status=document.createElement('p');status.id='emily-cloud-status';status.setAttribute('role','status');const hub=document.getElementById('hub');if(hub){hub.append(saveButton,status);saveButton.addEventListener('click',async()=>{saveButton.disabled=true;status.textContent='Saving…';const ok=await save();status.textContent=ok?'🎉 Your stars and answers are safe!':'Cloud save did not finish. Progress remains on this device.';saveButton.disabled=false})}}
 if(child==='jason'){const indicator=document.createElement('p');indicator.id='cloud-sync-status';indicator.className='muted';indicator.setAttribute('role','status');indicator.textContent='☁️ Checking saved progress…';document.getElementById('jason-roadmap')?.append(indicator);const retry=document.createElement('button');retry.type='button';retry.textContent='↻ Reload saved progress';retry.style.marginTop='8px';retry.addEventListener('click',()=>load(true));document.getElementById('jason-roadmap')?.append(retry)}
 let sha=null,cloudExists=false;
 const pinKey='adventure-family-passphrase-session-v2';
 const say=t=>{const indicator=document.getElementById('cloud-sync-status');if(indicator)indicator.textContent=t;const emily=document.getElementById('emily-cloud-status');if(emily)emily.textContent=t};
 const endpoint=url+'?child='+encodeURIComponent(child);
 // Emily's persistence library stores versioned data; use its own storage key.
 function snapshot(){
   if(child==='emily'){
     return {storageKey:'emily-adventure-v2',raw:localStorage.getItem('emily-adventure-v2'),shop:localStorage.getItem('emily-shop-v4'),cupcake:localStorage.getItem('emily-cupcake-trial-v1')};
   }
   const notes={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('jason-reading-notes-v1-'))notes[k]=localStorage.getItem(k)}
   return {answers:localStorage.getItem('jason-reading-v1'),notes};
 }
 function mergeCupcake(remoteRaw){
   if(typeof remoteRaw!=='string')return false;
   let remote,local;try{remote=JSON.parse(remoteRaw);local=JSON.parse(localStorage.getItem('emily-cupcake-trial-v1')||'{}')}catch{return false}
   if(!remote||!Array.isArray(remote.solved))return false;
   const solved=Array.from({length:5},(_,i)=>Boolean(remote.solved[i]||local.solved?.[i]));
   const hints=Array.from({length:5},(_,i)=>Boolean(remote.hints?.[i]||local.hints?.[i]));
   let step=0;while(step<5&&solved[step])step++;
   const merged={step,solved,hints};
   const previous=JSON.stringify({step:local.step||0,solved:local.solved||[],hints:local.hints||[]});
   const changed=previous!==JSON.stringify(merged);
   localStorage.setItem('emily-cupcake-trial-v1',JSON.stringify(merged));
   return changed;
 }
 async function request(method,pin,data){
   const response=await fetch(endpoint,{method,cache:'no-store',headers:{'X-Family-Pin':pin,...(method==='POST'?{'Content-Type':'application/json'}:{})},...(method==='POST'?{body:JSON.stringify({version:1,child,sha,data})}:{})});
   const body=await response.json();
   if(body.storage!=='private-d1-v1')throw Error('This endpoint does not support private storage. Ask a parent to finish setup.');
   if(!response.ok){if(response.status===401)sessionStorage.removeItem(pinKey);throw Error(body.error||'Cloud connection failed')}
   return body;
 }
 function mergeJason(cloudData){
   if(!cloudData||typeof cloudData.answers!=='string')throw Error('Invalid cloud answers');
   let remote={},local={};
   try{remote=JSON.parse(cloudData.answers||'{}');local=JSON.parse(localStorage.getItem('jason-reading-v1')||'{}')}catch{throw Error('Invalid saved answers')}
   // Cloud-submitted work is authoritative; never unlock or overwrite a submitted set.
   const merged={...local,...remote};
   const submitted={...(local._submitted||{}),...(remote._submitted||{})};
   merged._submitted=submitted;
   for(const set of [1,2]){
     const source=remote._submitted?.[set]?remote:local._submitted?.[set]?local:null;
     if(source){
       for(const [id,value] of Object.entries(source))if(id.startsWith(set+'-'))merged[id]=value;
     }
   }
   const history={};for(const set of [1,2]){
     const events=[...(remote._history?.[set]||[]),...(local._history?.[set]||[])];
     const unique=new Map();for(const e of events)unique.set((e.type||'')+'|'+(e.at||''),e);
     history[set]=[...unique.values()].sort((a,b)=>String(a.at).localeCompare(String(b.at)));
   }
   merged._history=history;
   const raw=JSON.stringify(merged);
   let changed=JSON.stringify(local)!==raw;
   localStorage.setItem('jason-reading-v1',raw);
   for(const [k,v] of Object.entries(cloudData.notes||{})){
     if(k.startsWith('jason-reading-notes-v1-')&&typeof v==='string'&&!localStorage.getItem(k)){localStorage.setItem(k,v);changed=true}
   }
   return changed;
 }
 function mergeEmily(remoteRaw){
   const key='emily-adventure-v2',localRaw=localStorage.getItem(key);
   const remote=JSON.parse(remoteRaw),local=JSON.parse(localRaw||'{"version":2,"answers":{}}');
   if(!remote||remote.version!==2||!remote.answers||typeof remote.answers!=='object')throw Error('Invalid cloud answers');
   const answers={...remote.answers,...(local.answers||{})};
   // A completed answer must never be replaced by an unfinished answer.
   for(const [id,entry] of Object.entries(remote.answers)){
     if(entry&&entry.checked===true&&!(local.answers||{})[id]?.checked)answers[id]=entry;
   }
   const merged={version:2,tab:local.tab||remote.tab||'english',answers};
   const raw=JSON.stringify(merged);
   if(localRaw&&localRaw!==raw)localStorage.setItem('emily-before-cloud-restore',localRaw);
   localStorage.setItem(key,raw);
   return {changed:raw!==localRaw,completed:Object.values(answers).filter(v=>v?.checked===true).length};
 }
 function getPassphrase(interactive){
   const stored=sessionStorage.getItem(pinKey);
   if(stored)return stored;
   if(!interactive)return null;
   return prompt('Ask a parent for the family passphrase to unlock private cloud progress for this tab:');
 }
 async function load(interactive=false){
   if(!url){say('Cloud connection is not configured.');return}
   const pin=getPassphrase(interactive);
   if(!pin){say('Cloud progress is locked. Ask a parent to unlock it. Local work is available.');return false}
   try{
     const result=await request('GET',pin);sessionStorage.setItem(pinKey,pin);sha=result.sha||null;cloudExists=!!result.exists;
     if(!result.exists){say('No cloud save yet.');return}
     if(child==='jason'){
       const changed=mergeJason(result.data.data);
       say('🌈 Cloud progress synced.');
       if(changed)location.reload()
       return;
     }
     const remoteData=result.data.data;
     const cupcakeChanged=mergeCupcake(remoteData.cupcake);
     if(typeof remoteData.raw!=='string')throw Error('No saved English or Maths answers found');
     const merged=mergeEmily(remoteData.raw);
     if(typeof remoteData.shop==='string'){
       try{const remoteShop=JSON.parse(remoteData.shop),localShop=JSON.parse(localStorage.getItem('emily-shop-v4')||'{}');localStorage.setItem('emily-shop-v4',JSON.stringify({...remoteShop,...localShop}))}catch(e){}
     }
     say('🌈 '+merged.completed+' completed answers ready across devices!');
     if(merged.changed||cupcakeChanged)location.reload();
   }catch(e){say('Cloud load failed: '+e.message);if(child==='jason')window.adventureSyncError=e.message}
 }
 let initialLoad;
 async function save(){
   if(initialLoad)await initialLoad;
   if(!url){say('Cloud saving needs a one-time family setup. Your work is still saved on this device.');return false}
   const pin=getPassphrase(true);
   if(!pin)return false;
   try{
     // Refresh remote state before writing so a second device cannot silently replace it.
     const latest=await request('GET',pin);sha=latest.sha||null;cloudExists=!!latest.exists;
     if(cloudExists&&child==='jason')mergeJason(latest.data.data);
     if(cloudExists&&child==='emily'&&typeof latest.data.data.raw==='string')mergeEmily(latest.data.data.raw);
     if(cloudExists&&child==='emily'&&typeof latest.data.data.shop==='string'){
       try{const remote=JSON.parse(latest.data.data.shop),own=JSON.parse(localStorage.getItem('emily-shop-v4')||'{}');localStorage.setItem('emily-shop-v4',JSON.stringify({...remote,...own}))}catch(e){}
     }
     if(cloudExists&&child==='emily'&&typeof latest.data.data.cupcake==='string')mergeCupcake(latest.data.data.cupcake);
     const result=await request('POST',pin,snapshot());sha=result.sha;cloudExists=true;sessionStorage.setItem(pinKey,pin);say('🌟 Progress saved to your private family storage.');return true;
   }catch(e){if(/Incorrect family passphrase/i.test(e.message))sessionStorage.removeItem(pinKey);say('Could not save: '+e.message);return false}
 }
 if(child==='emily'){
   let pending=null;
   window.addEventListener('adventure-progress-changed',()=>{
     if(!sessionStorage.getItem(pinKey))return;
     clearTimeout(pending);
     pending=setTimeout(()=>{save().catch(()=>{});},1200);
   });
 }
 window.adventureCloudSave=save;
 window.adventureCloudLoad=()=>load(true);
 window.adventureCloudLock=()=>{sessionStorage.removeItem(pinKey);say('Cloud progress is locked. Local work remains on this device.')};
 const controls=document.createElement('div');controls.className='actions';
 const unlock=document.createElement('button');unlock.type='button';unlock.textContent='🔐 Unlock private cloud progress';unlock.addEventListener('click',()=>load(true));
 const lock=document.createElement('button');lock.type='button';lock.textContent='Lock cloud';lock.addEventListener('click',window.adventureCloudLock);
 controls.append(unlock,lock);document.getElementById(child==='emily'?'hub':'jason-roadmap')?.append(controls);
 initialLoad=load();
})();


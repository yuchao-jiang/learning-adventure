// Cloud sync is enabled after cloud-config.js defines window.ADVENTURE_SYNC_URL.
// Local device progress remains available independently of the cloud.
(function(){
 const url=String(window.ADVENTURE_SYNC_URL||'').replace(/[/]$/,'');
 const child=document.body.dataset.learner;
 if(!['emily','jason'].includes(child))return;
 const panel=document.createElement('section');panel.className='cloud-controls';
 panel.innerHTML='<strong>☁️ My Adventure</strong><div class="cloud-buttons"><button type="button" data-action="save">☁️ Save My Adventure</button><button type="button" data-action="load">🌈 Continue My Adventure</button></div><p class="cloud-message" role="status" aria-live="polite"></p>';
 const target=document.querySelector('header');
 // Cloud controls are hidden on both learner roadmaps; automatic restore remains active.
 panel.hidden=true;
 if(child==='emily'){const saveButton=document.createElement('button');saveButton.type='button';saveButton.textContent='🌟 Keep My Stars Safe!';saveButton.style.cssText='margin:12px 0;padding:12px 18px;border-radius:12px;background:#d9f3e4;border:2px solid #39976e;font-weight:700';const status=document.createElement('p');status.id='emily-cloud-status';status.setAttribute('role','status');const hub=document.getElementById('hub');if(hub){hub.append(saveButton,status);saveButton.addEventListener('click',async()=>{saveButton.disabled=true;status.textContent='Saving…';const ok=await save();status.textContent=ok?'🎉 Your stars and answers are safe!':'Cloud save did not finish. Progress remains on this device.';saveButton.disabled=false})}}
 if(child==='jason'){const indicator=document.createElement('p');indicator.id='cloud-sync-status';indicator.className='muted';indicator.setAttribute('role','status');indicator.textContent='☁️ Checking saved progress…';document.getElementById('jason-roadmap')?.append(indicator);const retry=document.createElement('button');retry.type='button';retry.textContent='↻ Reload saved progress';retry.style.marginTop='8px';retry.addEventListener('click',()=>load(true));document.getElementById('jason-roadmap')?.append(retry)}
 const message=panel.querySelector('.cloud-message');
 let sha=null,cloudExists=false;
 const pinKey='adventure-family-pin-session';
 const say=t=>{message.textContent=t;const indicator=document.getElementById('cloud-sync-status');if(indicator)indicator.textContent=t;const emily=document.getElementById('emily-cloud-status');if(emily)emily.textContent=t};
 const endpoint=url+'?child='+encodeURIComponent(child);
 const getLocal=()=>child==='emily'?localStorage.getItem('emily-adventure-v2'):localStorage.getItem('jason-reading-v1');
 // Emily's persistence library stores versioned data; use its own storage key.
 function snapshot(){
   if(child==='emily'){
     const key=Object.keys(localStorage).find(k=>k.includes('emily')&&k.includes('v2'));
     return {storageKey:key||'emily-adventure-v2',raw:key?localStorage.getItem(key):null,shop:localStorage.getItem('emily-shop-v4'),cupcake:localStorage.getItem('emily-cupcake-trial-v1')};
   }
   const notes={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('jason-reading-notes-v1-'))notes[k]=localStorage.getItem(k)}
   return {answers:localStorage.getItem('jason-reading-v1'),notes};
 }
 function restore(data){
   if(child==='emily'){
     if((data.raw!==null&&typeof data.raw!=='string')||!data.storageKey||!/^emily[-a-z0-9]+$/i.test(data.storageKey))throw Error('Invalid saved Emily progress');
     if(typeof data.raw==='string')localStorage.setItem(data.storageKey,data.raw);
     if(typeof data.shop==='string')localStorage.setItem('emily-shop-v4',data.shop);
     if(typeof data.cupcake==='string')mergeCupcake(data.cupcake);
   }else{
     if(typeof data.answers!=='string'||!data.notes||typeof data.notes!=='object')throw Error('Invalid saved Jason progress');
     localStorage.setItem('jason-reading-v1',data.answers);
     for(const [k,v] of Object.entries(data.notes))if(k.startsWith('jason-reading-notes-v1-')&&typeof v==='string')localStorage.setItem(k,v);
   }
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
   const response=await fetch(endpoint,{method,cache:'no-store',headers:{...(method==='POST'?{'Content-Type':'application/json','X-Family-Pin':pin}:{})},...(method==='POST'?{body:JSON.stringify({version:1,child,sha,data})}:{})});
   const body=await response.json();if(!response.ok)throw Error(body.error||'Cloud connection failed');return body;
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
     if(remote._submitted?.[set]){
       for(const [id,value] of Object.entries(remote))if(id.startsWith(set+'-'))merged[id]=value;
     }
   }
   const history={};for(const set of [1,2]){
     const events=[...(remote._history?.[set]||[]),...(local._history?.[set]||[])];
     const unique=new Map();for(const e of events)unique.set((e.type||'')+'|'+(e.at||''),e);
     history[set]=[...unique.values()].sort((a,b)=>String(a.at).localeCompare(String(b.at)));
   }
   merged._history=history;
   const raw=JSON.stringify(merged);
   const changed=Object.keys(remote).some(k=>JSON.stringify(local[k])!==JSON.stringify(merged[k]));
   localStorage.setItem('jason-reading-v1',raw);
   for(const [k,v] of Object.entries(cloudData.notes||{})){
     if(k.startsWith('jason-reading-notes-v1-')&&typeof v==='string'&&!localStorage.getItem(k))localStorage.setItem(k,v);
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
 async function load(automatic=false){
   if(!url){say('Cloud connection is not configured.');return}
   try{
     const result=await request('GET');sha=result.sha||null;cloudExists=!!result.exists;
     if(!result.exists){say('No cloud save yet.');return}
     if(child==='jason'){
       const changed=mergeJason(result.data.data);
       say('🌈 Cloud progress synced.');
       if(changed){sessionStorage.setItem('adventure-loaded-'+child,result.sha||'loaded');location.reload()}
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
   let pin=sessionStorage.getItem(pinKey);
   if(!pin){pin=prompt('🔐 Ask a grown-up for the family PIN (once per tab session):');if(pin===null)return false;}
   try{
     // Refresh remote state before writing so a second device cannot silently replace it.
     const latest=await request('GET');sha=latest.sha||null;cloudExists=!!latest.exists;
     if(cloudExists&&child==='jason')mergeJason(latest.data.data);
     if(cloudExists&&child==='emily'&&typeof latest.data.data.raw==='string')mergeEmily(latest.data.data.raw);
     if(cloudExists&&child==='emily'&&typeof latest.data.data.shop==='string'){
       try{const remote=JSON.parse(latest.data.data.shop),own=JSON.parse(localStorage.getItem('emily-shop-v4')||'{}');localStorage.setItem('emily-shop-v4',JSON.stringify({...remote,...own}))}catch(e){}
     }
     if(cloudExists&&child==='emily'&&typeof latest.data.data.cupcake==='string')mergeCupcake(latest.data.data.cupcake);
     const result=await request('POST',pin,snapshot());sha=result.sha;cloudExists=true;sessionStorage.setItem(pinKey,pin);say('🌟 Your adventure is safely saved!');return true;
   }catch(e){if(/Incorrect family PIN/i.test(e.message))sessionStorage.removeItem(pinKey);say('Could not save: '+e.message);return false}
 }
 window.adventureCloudSave=save;
 window.adventureCloudLoad=()=>load(false);
 panel.querySelector('[data-action="save"]').addEventListener('click',save);
 panel.querySelector('[data-action="load"]').addEventListener('click',()=>load(false));
 initialLoad=load(true);
})();

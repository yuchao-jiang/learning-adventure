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
 const say=t=>{message.textContent=t;const indicator=document.getElementById('cloud-sync-status');if(indicator)indicator.textContent=t};
 const endpoint=url+'?child='+encodeURIComponent(child);
 const getLocal=()=>child==='emily'?localStorage.getItem('emily-adventure-v2'):localStorage.getItem('jason-reading-v1');
 // Emily's persistence library stores versioned data; use its own storage key.
 function snapshot(){
   if(child==='emily'){
     const key=Object.keys(localStorage).find(k=>k.includes('emily')&&k.includes('v2'));
     return {storageKey:key||'emily-adventure-v2',raw:key?localStorage.getItem(key):null,shop:localStorage.getItem('emily-shop-v1')};
   }
   const notes={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('jason-reading-notes-v1-'))notes[k]=localStorage.getItem(k)}
   return {answers:localStorage.getItem('jason-reading-v1'),notes};
 }
 function restore(data){
   if(child==='emily'){
     if(typeof data.raw!=='string'||!data.storageKey||!/^emily[-a-z0-9]+$/i.test(data.storageKey))throw Error('Invalid saved Emily progress');
     localStorage.setItem(data.storageKey,data.raw);
     if(typeof data.shop==='string')localStorage.setItem('emily-shop-v1',data.shop);
   }else{
     if(typeof data.answers!=='string'||!data.notes||typeof data.notes!=='object')throw Error('Invalid saved Jason progress');
     localStorage.setItem('jason-reading-v1',data.answers);
     for(const [k,v] of Object.entries(data.notes))if(k.startsWith('jason-reading-notes-v1-')&&typeof v==='string')localStorage.setItem(k,v);
   }
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
     if(automatic){
       const local=snapshot();
       if(local.raw){
         // Shop progress is independent of English/Maths; restore it when absent locally.
         if(!local.shop&&typeof result.data.data.shop==='string'){localStorage.setItem('emily-shop-v1',result.data.data.shop);location.reload();return}
         say('Your local progress is safe.');return}
     }else if(!confirm('Load cloud progress? This will replace local answers.'))return;
     restore(result.data.data);
     sessionStorage.setItem('adventure-loaded-'+child,result.sha||'loaded');location.reload();
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
     const result=await request('POST',pin,snapshot());sha=result.sha;cloudExists=true;sessionStorage.setItem(pinKey,pin);say('🌟 Your adventure is safely saved!');return true;
   }catch(e){if(/Incorrect family PIN/i.test(e.message))sessionStorage.removeItem(pinKey);say('Could not save: '+e.message);return false}
 }
 window.adventureCloudSave=save;
 window.adventureCloudLoad=()=>load(true);
 panel.querySelector('[data-action="save"]').addEventListener('click',save);
 panel.querySelector('[data-action="load"]').addEventListener('click',()=>load(false));
 initialLoad=load(true);
})();

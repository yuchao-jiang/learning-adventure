// Cloud sync is enabled after cloud-config.js defines window.ADVENTURE_SYNC_URL.
// Local device progress remains available independently of the cloud.
(function(){
 const configuredUrl=String(window.ADVENTURE_SYNC_URL||'').replace(/[/]$/,'');
 const url=configuredUrl.startsWith('https://')?configuredUrl:'';
 const child=document.body.dataset.learner;
 const mathsPage=document.body.dataset.activity==='maths';
 const jasonHost=document.getElementById(mathsPage?'maths-cloud':'jason-roadmap');
 if(!['emily','jason'].includes(child))return;
 let parentSettings=null;
 if(child==='jason'&&!mathsPage){parentSettings=document.createElement('details');parentSettings.style.marginTop='12px';const summary=document.createElement('summary');summary.textContent='Parent settings';parentSettings.append(summary);document.querySelector?.('header')?.append(parentSettings)}
 if(child==='emily'){const saveButton=document.createElement('button');saveButton.type='button';saveButton.textContent='🌟 Keep My Stars Safe!';saveButton.style.cssText='margin:12px 0;padding:12px 18px;border-radius:12px;background:#d9f3e4;border:2px solid #39976e;font-weight:700';const status=document.createElement('p');status.id='emily-cloud-status';status.setAttribute('role','status');const hub=document.getElementById('hub');if(hub){hub.append(saveButton,status);saveButton.addEventListener('click',async()=>{saveButton.disabled=true;status.textContent='Saving…';const ok=await save();status.textContent=ok?'🎉 Your stars and answers are safe!':'Cloud save did not finish. Progress remains on this device.';saveButton.disabled=false})}}
 if(child==='jason'){const indicator=document.createElement('p');indicator.id='cloud-sync-status';indicator.className='muted';indicator.setAttribute('role','status');indicator.textContent=mathsPage?'Loading your work…':'☁️ Checking saved progress…';(parentSettings||jasonHost)?.append(indicator)}
 let sha=null,cloudExists=false,jasonExtras={};
 const sessionKey='adventure-cloud-session-v1',deviceKey='adventure-cloud-device-v1';
 let pending=null,unlockPromise=null,remoteMaths=null,autoBusy=false,autoQueued=false;
 // Discard credentials from the earlier passphrase-based client.
 try{sessionStorage.removeItem('adventure-family-passphrase-session-v2');sessionStorage.removeItem('adventure-family-pin-session')}catch{}
 const say=t=>{const indicator=document.getElementById('cloud-sync-status');if(indicator)indicator.textContent=mathsPage?(/failed|retry|not configured|locked|unlock|Could not/i.test(t)?'Saved on this device.':/Syncing|Saving/i.test(t)?'Saving…':/synced|saved to your private/i.test(t)?'Saved ✓':'Ready to play.'):t;const emily=document.getElementById('emily-cloud-status');if(emily)emily.textContent=t};
 const endpoint=url+'?child='+encodeURIComponent(child);
 // Emily's persistence library stores versioned data; use its own storage key.
 function snapshot(){
   if(child==='emily'){
     return {storageKey:'emily-adventure-v2',raw:localStorage.getItem('emily-adventure-v2'),shop:localStorage.getItem('emily-shop-v4'),cupcake:localStorage.getItem('emily-cupcake-trial-v1'),parcel:localStorage.getItem('emily-parcel-v1')};
   }
   const notes={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('jason-reading-notes-v1-'))notes[k]=localStorage.getItem(k)}
   return {...jasonExtras,answers:localStorage.getItem('jason-reading-v1')||'{}',notes,...(localStorage.getItem(AdventureMaths.KEY)!==null?{maths:localStorage.getItem(AdventureMaths.KEY)}:{})};
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
 function mergeParcel(remoteRaw){
   if(typeof remoteRaw!=='string')return false;
   let remote,local;
   try{remote=JSON.parse(remoteRaw);local=JSON.parse(localStorage.getItem('emily-parcel-v1')||'{}')}catch{return false}
   if(!remote||!Array.isArray(remote.solved))return false;
   const solved=Array.from({length:8},(_,i)=>Boolean(remote.solved[i]||local.solved?.[i]));
   const hints=Array.from({length:8},(_,i)=>Boolean(remote.hints?.[i]||local.hints?.[i]));
   let step=0;while(step<8&&solved[step])step++;
   const merged=JSON.stringify({step,solved,hints});
   const changed=merged!==localStorage.getItem('emily-parcel-v1');
   if(changed)localStorage.setItem('emily-parcel-v1',merged);
   return changed;
 }
 function clearSession(){
   try{sessionStorage.removeItem(sessionKey)}catch{}
   try{localStorage.removeItem(deviceKey)}catch{}
 }
 function storedSession(){
   for(const [storage,key] of [[sessionStorage,sessionKey],[localStorage,deviceKey]]){
     try{
       const value=JSON.parse(storage.getItem(key)||'null');
       if(value&&/^[a-f0-9]{64}$/.test(value.token)&&value.endpoint===url&&Number.isFinite(value.expiresAt)&&value.expiresAt>Date.now())return value;
       if(value)storage.removeItem(key);
     }catch{try{storage.removeItem(key)}catch{}}
   }
   return null;
 }
 async function api(address,method,credential,data){
   const headers=credential.passphrase!==undefined?{'X-Family-Pin':credential.passphrase}:{Authorization:'Bearer '+credential.token};
   const response=await fetch(address,{method,cache:'no-store',headers:{...headers,...(data!==undefined?{'Content-Type':'application/json'}:{})},...(data!==undefined?{body:JSON.stringify(data)}:{})});
   const body=await response.json();
   if(body.storage!=='private-d1-v1')throw Error('This endpoint does not support private storage. Ask a parent to finish setup.');
   if(!response.ok){if(response.status===401&&credential.token)clearSession();throw Error(body.error||'Cloud connection failed')}
   return body;
 }
 function request(method,session,data){
   return api(endpoint,method,session,method==='POST'?{version:1,child,sha,data}:undefined);
 }
 function parentConsent(rememberOption=true){
   return new Promise(resolve=>{
     const dialog=document.createElement('dialog');
     dialog.setAttribute('aria-label','Parent cloud access');
     dialog.style.cssText='max-width:420px;width:calc(100% - 32px);border:2px solid #39976e;border-radius:16px;padding:22px';
     dialog.innerHTML='<form method="dialog"><h2>🔐 Parent cloud access</h2><label>Family passphrase<input name="passphrase" type="password" autocomplete="current-password" required style="display:block;box-sizing:border-box;width:100%;padding:10px;margin:8px 0 16px"></label>'+(rememberOption?'<label style="display:flex;gap:8px;align-items:center"><input name="remember" type="checkbox">Remember this trusted device for 30 days</label><p>Use this only on a family device. Anyone using this browser can access cloud progress while it is remembered.</p>':'<p>This will forget every trusted device. Local work will stay on each device.</p>')+'<div style="display:flex;gap:10px;margin-top:18px"><button value="cancel" formnovalidate>Cancel</button><button value="unlock">'+(rememberOption?'Unlock':'Forget all devices')+'</button></div></form>';
     dialog.addEventListener('close',()=>{
       const input=dialog.querySelector('[name="passphrase"]');
       const result=dialog.returnValue==='unlock'?{passphrase:input.value,remember:!!dialog.querySelector('[name="remember"]')?.checked}:null;
       input.value='';dialog.remove();resolve(result);
     },{once:true});
     document.body.append(dialog);dialog.showModal();
   });
 }
 async function getSession(interactive){
   const stored=storedSession();
   if(stored)return stored;
   if(!interactive)return null;
   if(!unlockPromise)unlockPromise=(async()=>{
     const consent=await parentConsent();
     if(!consent)return null;
     try{
       const result=await api(url+'/session','POST',{passphrase:consent.passphrase},{remember:consent.remember});
       if(!/^[a-f0-9]{64}$/.test(result.token)||!Number.isFinite(result.expiresAt)||result.expiresAt<=Date.now())throw Error('Invalid cloud session');
       const session={token:result.token,expiresAt:result.expiresAt,endpoint:url};
       clearSession();
       (consent.remember?localStorage:sessionStorage).setItem(consent.remember?deviceKey:sessionKey,JSON.stringify(session));
       return session;
     }finally{consent.passphrase=''}
   })().finally(()=>{unlockPromise=null});
   return unlockPromise;
 }
 function mergeJason(cloudData){
   if(!cloudData||(cloudData.answers!=null&&typeof cloudData.answers!=='string'))throw Error('Invalid cloud answers');
   let remote={},local={};
   try{remote=JSON.parse(cloudData.answers||'{}');local=JSON.parse(localStorage.getItem('jason-reading-v1')||'{}')}catch{throw Error('Invalid saved answers')}
   jasonExtras={...cloudData};
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
   if(cloudData.maths!=null){
     if(typeof cloudData.maths!=='string')throw Error('Invalid cloud maths progress');
     const old=localStorage.getItem(AdventureMaths.KEY);
     const mergedMaths=AdventureMaths.merge(JSON.parse(old||'{}'),JSON.parse(cloudData.maths));
     const rawMaths=AdventureMaths.stable(mergedMaths);
     if(AdventureMaths.stable(JSON.parse(old||'{}'))!==rawMaths){
       localStorage.setItem(AdventureMaths.KEY,rawMaths);changed=true;
       if(typeof window.adventureMathsRestore==='function')window.adventureMathsRestore();
     }
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
 async function load(interactive=false){
   if(!url){say('Cloud connection is not configured.');return false}
   try{
     const session=await getSession(interactive);
     if(!session){say('Cloud progress is locked. Ask a parent to unlock it. Local work is available.');return false}
     const result=await request('GET',session);sha=result.sha||null;cloudExists=!!result.exists;
     if(mathsPage)remoteMaths=result.exists&&typeof result.data?.data?.maths==='string'?AdventureMaths.stable(AdventureMaths.normalize(JSON.parse(result.data.data.maths))):null;
     if(!result.exists){say('No cloud save yet.');return true}
     if(child==='jason'){
       const changed=mergeJason(result.data.data);
       say('🌈 Cloud progress synced.');
       if(changed&&!mathsPage)location.reload()
       return true;
     }
     const remoteData=result.data.data;
     const cupcakeChanged=mergeCupcake(remoteData.cupcake);
     const parcelChanged=mergeParcel(remoteData.parcel);
     if(typeof remoteData.raw!=='string')throw Error('No saved English or Maths answers found');
     const merged=mergeEmily(remoteData.raw);
     if(typeof remoteData.shop==='string'){
       try{const remoteShop=JSON.parse(remoteData.shop),localShop=JSON.parse(localStorage.getItem('emily-shop-v4')||'{}');localStorage.setItem('emily-shop-v4',JSON.stringify({...remoteShop,...localShop}))}catch(e){}
     }
     say('🌈 '+merged.completed+' completed answers ready across devices!');
     if(merged.changed||cupcakeChanged||parcelChanged)location.reload();
   }catch(e){say('Cloud load failed: '+e.message);if(child==='jason')window.adventureSyncError=e.message;return false}
 }
 let initialLoad;
 async function save(interactive=true){
   if(initialLoad)await initialLoad;
   if(!url){say('Cloud saving needs a one-time family setup. Your work is still saved on this device.');return false}
   try{
     const session=await getSession(interactive);
     if(!session)return false;
     // Refresh remote state before writing so a second device cannot silently replace it.
     const latest=await request('GET',session);sha=latest.sha||null;cloudExists=!!latest.exists;
     if(cloudExists&&child==='jason')mergeJason(latest.data.data);
     if(cloudExists&&child==='emily'&&typeof latest.data.data.raw==='string')mergeEmily(latest.data.data.raw);
     if(cloudExists&&child==='emily'&&typeof latest.data.data.shop==='string'){
       try{const remote=JSON.parse(latest.data.data.shop),own=JSON.parse(localStorage.getItem('emily-shop-v4')||'{}');localStorage.setItem('emily-shop-v4',JSON.stringify({...remote,...own}))}catch(e){}
     }
     if(cloudExists&&child==='emily'&&typeof latest.data.data.cupcake==='string')mergeCupcake(latest.data.data.cupcake);
     if(cloudExists&&child==='emily')mergeParcel(latest.data.data.parcel);
     const result=await request('POST',session,snapshot());sha=result.sha;cloudExists=true;say('🌟 Progress saved to your private family storage.');return true;
   }catch(e){say((mathsPage?'Saved on this device. Cloud save failed: ':'Could not save: ')+e.message);return false}
 }
 if(child==='emily'){
   window.addEventListener('adventure-progress-changed',()=>{
     if(!storedSession())return;
     clearTimeout(pending);
     pending=setTimeout(()=>{if(storedSession())save(false).catch(()=>{});},1200);
   });
 }
 window.adventureCloudSave=save;
 window.adventureCloudLoad=()=>mathsPage?autoSync():load(true);
 window.adventureCloudLock=async()=>{
   const session=storedSession();clearSession();clearTimeout(pending);if(mathsPage){unlock.hidden=false;lock.hidden=true}
   try{if(session)await api(url+'/session','DELETE',session);say('Cloud locked. This device is forgotten. Local work remains here.')}
   catch{say('This browser is locked, but server revocation did not finish. Ask a parent to retry Forget all trusted devices.')}
 };
 window.adventureCloudForgetAll=async()=>{
   if(!url)return;
   const consent=await parentConsent(false);if(!consent)return;
   try{await api(url+'/sessions','DELETE',{passphrase:consent.passphrase});clearSession();clearTimeout(pending);if(mathsPage){unlock.hidden=false;lock.hidden=true}say('All trusted devices are forgotten. Local work remains on each device.')}
   catch(e){say('Could not forget devices: '+e.message)}finally{consent.passphrase=''}
 };
 const controls=document.createElement('div');controls.className='actions';
 const unlock=document.createElement('button');unlock.type='button';unlock.textContent='🔐 Unlock private cloud progress';unlock.addEventListener('click',()=>load(true));
 const lock=document.createElement('button');lock.type='button';lock.textContent='Lock cloud';lock.addEventListener('click',window.adventureCloudLock);
 const forgetAll=document.createElement('button');forgetAll.type='button';forgetAll.textContent='Forget all trusted devices';forgetAll.addEventListener('click',window.adventureCloudForgetAll);
 controls.append(unlock,lock,forgetAll);
 if(!mathsPage)(child==='emily'?document.getElementById('hub'):(parentSettings||jasonHost))?.append(controls);
 async function autoSync(){
   if(autoBusy){autoQueued=true;return}
   await initialLoad;
   if(autoBusy){autoQueued=true;return}
   const unlocked=!!storedSession();unlock.hidden=unlocked;lock.hidden=!unlocked;
   if(!url||!unlocked){say(!url?'Saved on this device. Cloud connection is not configured.':'Saved on this device. Ask a parent to unlock automatic cloud sync.');return}
   autoBusy=true;autoQueued=false;
   try{
     if(!await load(false))return;
     const raw=localStorage.getItem(AdventureMaths.KEY);
     const local=raw===null?null:AdventureMaths.stable(AdventureMaths.normalize(JSON.parse(raw)));
     if(local!==null&&local!==remoteMaths){say('Saved on this device. Syncing…');await save(false)}
     else say('✓ All progress synced automatically.');
   }catch(e){say('Saved on this device. Sync will retry: '+e.message)}
   finally{autoBusy=false;unlock.hidden=!!storedSession();lock.hidden=!storedSession();if(autoQueued){clearTimeout(pending);pending=setTimeout(autoSync,1200)}}
 }
 initialLoad=mathsPage?Promise.resolve():load();
 if(mathsPage){
   window.addEventListener('adventure-maths-changed',()=>{
     autoQueued=true;say(storedSession()?'Saved on this device. Syncing…':'Saved on this device. Cloud is locked.');
     clearTimeout(pending);pending=setTimeout(autoSync,1200);
   });
   for(const event of ['focus','online'])window.addEventListener(event,autoSync);
   document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')autoSync()});
   setInterval(()=>{if(document.visibilityState!=='hidden')autoSync()},30000);
   autoSync();
 }
})();


// Cloud sync is enabled after cloud-config.js defines window.ADVENTURE_SYNC_URL.
// Local device progress remains available independently of the cloud.
(function(){
 const url=String(window.ADVENTURE_SYNC_URL||'').replace(/[/]$/,'');
 const child=document.body.dataset.learner;
 if(!['emily','jason'].includes(child))return;
 const panel=document.createElement('section');panel.className='cloud-controls';
 panel.innerHTML='<strong>☁️ My Adventure</strong><div class="cloud-buttons"><button type="button" data-action="save">☁️ Save My Adventure</button><button type="button" data-action="load">🌈 Continue My Adventure</button></div><p class="cloud-message" role="status" aria-live="polite"></p>';
 const target=document.querySelector('header');target.insertAdjacentElement('afterend',panel);
 if(child==='jason')panel.querySelector('[data-action="save"]').remove();
 const message=panel.querySelector('.cloud-message');
 let sha=null,cloudExists=false;
 const say=t=>message.textContent=t;
 const endpoint=url+'?child='+encodeURIComponent(child);
 const getLocal=()=>child==='emily'?localStorage.getItem('emily-adventure-v2'):localStorage.getItem('jason-reading-v1');
 // Emily's persistence library stores versioned data; use its own storage key.
 function snapshot(){
   if(child==='emily'){
     const key=Object.keys(localStorage).find(k=>k.includes('emily')&&k.includes('v2'));
     return {storageKey:key||'emily-adventure-v2',raw:key?localStorage.getItem(key):null};
   }
   const notes={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('jason-reading-notes-v1-'))notes[k]=localStorage.getItem(k)}
   return {answers:localStorage.getItem('jason-reading-v1'),notes};
 }
 function restore(data){
   if(child==='emily'){
     if(typeof data.raw!=='string'||!data.storageKey||!/^emily[-a-z0-9]+$/i.test(data.storageKey))throw Error('Invalid saved Emily progress');
     localStorage.setItem(data.storageKey,data.raw);
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
 async function load(automatic=false){
   if(!url){say('Cloud saving needs a one-time family setup. Your work is still saved on this device.');return}
   try{
     const result=await request('GET');sha=result.sha||null;cloudExists=!!result.exists;
     if(!result.exists){say('No cloud adventure saved yet. Use Save My Adventure first.');return}
     if(automatic){
       const local=snapshot();
       const hasLocal=child==='emily'?!!local.raw:!!local.answers&&local.answers!=='{}';
       if(hasLocal){say('Cloud adventure available! Tap Continue My Adventure to load it.');return}
     }else if(!confirm('Continue with the cloud adventure? This will replace answers saved on this device.'))return;
     restore(result.data.data);say('🌈 Adventure loaded! Opening your saved work…');setTimeout(()=>location.reload(),600);
   }catch(e){say('Could not load: '+e.message)}
 }
 async function save(){
   if(!url){say('Cloud saving needs a one-time family setup. Your work is still saved on this device.');return false}
   const pin=prompt('🔐 Ask a grown-up for the family PIN to save your adventure:');
   if(pin===null)return false;
   try{
     // Fetch latest SHA to support the first save, but never overwrite a changed cloud version silently.
     if(!cloudExists){const latest=await request('GET');sha=latest.sha||null;cloudExists=!!latest.exists;if(cloudExists){say('An adventure already exists in the cloud. Load it before saving to avoid losing work.');return false}}
     const result=await request('POST',pin,snapshot());sha=result.sha;cloudExists=true;say('🌟 Your adventure is safely saved!');return true;
   }catch(e){say('Could not save: '+e.message);return false}
 }
 window.adventureCloudSave=save;
 panel.querySelector('[data-action="save"]').addEventListener('click',save);
 panel.querySelector('[data-action="load"]').addEventListener('click',()=>load(false));
 load(true);
})();

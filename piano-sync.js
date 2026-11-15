// Reuse existing private cloud access. No GitHub credential or parent passphrase is exposed.
(function(root){
 'use strict';
 const P=root.AdventurePiano,url=String(root.ADVENTURE_SYNC_URL||'').replace(/\/$/,'');let busy=false,again=false,timer;
 const status=message=>{const el=document.getElementById('piano-cloud');if(el)el.textContent=message};
 function session(){for(const [storage,key] of [[root.sessionStorage,'adventure-cloud-session-v1'],[root.localStorage,'adventure-cloud-device-v1']]){try{const s=JSON.parse(storage.getItem(key)||'null');if(s&&s.endpoint===url&&/^[a-f0-9]{64}$/.test(s.token)&&Number.isFinite(s.expiresAt)&&s.expiresAt>Date.now())return s}catch{}}return null}
 async function request(child,method,token,payload){const response=await fetch(url+'?child='+child,{method,cache:'no-store',headers:{Authorization:'Bearer '+token,...(payload?{'Content-Type':'application/json'}:{})},...(payload?{body:JSON.stringify(payload)}:{})});const body=await response.json();if(!['private-d1-v1','private-github-v1'].includes(body.storage))throw Error('Private storage required');if(!response.ok){const error=Error('Sync failed');error.conflict=response.status===409;throw error}return body}
 async function sync(){
  if(busy){again=true;return false}const auth=session();if(!url.startsWith('https://')||!auth){status('Saved on this device.');return false}busy=true;again=false;status('Saving your music…');
  try{
   for(const child of P.learners){
    for(let retry=0;retry<3;retry++){
     const remote=await request(child,'GET',auth.token),data=remote.exists?remote.data?.data:{};if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Invalid cloud progress');
     const raw=data.piano;if(raw!=null&&typeof raw!=='string')throw Error('Invalid piano progress');
     const local=P.load(root.localStorage,child),merged=P.merge(local,raw?JSON.parse(raw):null),mergedRaw=JSON.stringify(merged);
     if(mergedRaw!==JSON.stringify(local)){root.localStorage.setItem(P.key(child),mergedRaw);root.dispatchEvent(new Event('piano-restored'))}
     if(!P.count(merged)||mergedRaw===JSON.stringify(P.normalize(raw?JSON.parse(raw):null)))break;
     try{await request(child,'POST',auth.token,{version:1,child,sha:remote.sha||null,data:{...data,piano:mergedRaw}});break}catch(error){if(!error.conflict||retry===2)throw error}
    }
   }
   status('Your music is saved ✓');return true;
  }catch{status('Saved on this device. Cloud will retry.');return false}
  finally{busy=false;if(again){clearTimeout(timer);timer=setTimeout(sync,1200)}}
 }
 root.PianoSync={sync};root.addEventListener('piano-progress-changed',()=>{clearTimeout(timer);timer=setTimeout(sync,800)});
 for(const event of ['focus','online'])root.addEventListener(event,sync);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync()});
 setInterval(()=>{if(!document.hidden)sync()},60000);sync();
})(globalThis);

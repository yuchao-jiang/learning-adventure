(function(root){
 'use strict';
 const json=value=>JSON.parse(JSON.stringify(value));
 const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
 function createRecorder({learner,storage,now=()=>Date.now(),uuid=()=>root.crypto.randomUUID(),notify=()=>{}}){
  const prefix='adventure-history-event-v1:'+learner+':',registry=new Map();let lastAt=0;
  function attempt(activity){const key='adventure-history-attempt-v1:'+learner+':'+activity;let id=storage.getItem(key);if(!id){id=uuid();storage.setItem(key,id)}return id}
  function record(activity,questionId,type,data={},attemptId){
   try{
    const event={version:1,id:uuid(),learner,activity,questionId:String(questionId),attemptId:attemptId||attempt(activity),type,at:new Date(lastAt=Math.max(now(),lastAt+1)).toISOString(),question:json(registry.get(activity+':'+questionId)||{}),data:json(data)};
    storage.setItem(prefix+event.id,JSON.stringify(event));if(type==='answer'||type==='check')storage.setItem('adventure-history-baseline-v1:'+learner+':'+activity+':'+event.attemptId+':'+questionId,'1');notify({ok:true,event});return event;
   }catch(error){notify({ok:false,error:'Learning history could not be saved on this device.'});return null}
  }
  function register(activity,questionId,question){registry.set(activity+':'+questionId,json(question))}
  function answer(activity,questionId,value,extra={},attemptId){const question=registry.get(activity+':'+questionId)||{};return record(activity,questionId,'answer',{answer:value,correct:Number.isInteger(question.correctIndex)?value===question.correctIndex:null,...extra},attemptId)}
  function baseline(activity,questionId,data,attemptId){
   try{const id=attemptId||attempt(activity),key='adventure-history-baseline-v1:'+learner+':'+activity+':'+id+':'+questionId;if(storage.getItem(key))return;const event=record(activity,questionId,'import',{...data,initialAnswerKnown:false,timingAvailable:false},id);if(event)storage.setItem(key,'1')}catch{notify({ok:false,error:'Existing learning history could not be saved.'})}
  }
  function pending(){const events=[];for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith(prefix)){try{const event=JSON.parse(storage.getItem(key));if(event?.id&&event.learner===learner)events.push(event)}catch{}}}return events.sort((a,b)=>a.at.localeCompare(b.at)||a.id.localeCompare(b.id))}
  function acknowledge(ids){for(const id of ids)storage.removeItem(prefix+id)}
  function startAttempt(activity){const id=uuid();storage.setItem('adventure-history-attempt-v1:'+learner+':'+activity,id);record(activity,'summary','start',{},id);return id}
  return {learner,register,record,event:record,answer,baseline,pending,acknowledge,attempt,startAttempt};
 }
 function summarize(events){
  const groups=new Map();
  for(const event of events.slice().sort((a,b)=>a.at.localeCompare(b.at)||a.id.localeCompare(b.id))){
   if(event.questionId==='summary')continue;
   const key=[event.learner,event.activity,event.attemptId,event.questionId].join('|');
   if(!groups.has(key))groups.set(key,{learner:event.learner,activity:event.activity,attemptId:event.attemptId,questionId:event.questionId,question:event.question||{},first:null,latest:null,firstSubmitted:null,checks:0,hints:0,flags:0,activeMs:0,revisions:0,legacy:false,notes:[]});
   const row=groups.get(key);if(Object.keys(event.question||{}).length)row.question=event.question;
   if(event.type==='parent-note')row.notes.push(event);
   if(event.type==='import'){row.legacy=true;row.imported=event.data}
   if(event.type==='answer'){if(!row.first)row.first=event;if(!row.latest||JSON.stringify(row.latest.data.answer)!==JSON.stringify(event.data.answer))row.revisions++;row.latest=event}
   if(event.type==='check'){row.checks++;if(!row.firstSubmitted)row.firstSubmitted=event;if(event.data?.answer!==undefined)row.latest=event}
   if(event.type==='hint'&&event.data?.shown!==false)row.hints++;
   if(event.type==='flag'&&event.data?.flagged)row.flags++;
   if(event.type==='time'&&Number.isFinite(event.data?.activeMs))row.activeMs+=Math.max(0,event.data.activeMs);
  }
  return [...groups.values()];
 }
 const api={createRecorder,summarize};
 if(typeof module!=='undefined')module.exports=api;
 root.LearningHistory=api;
 if(!root.document)return;
 const recorders=new Map(),writing=new Map();let syncTimer=null,syncing=false;
 const sessionKey='adventure-cloud-session-v1',deviceKey='adventure-cloud-device-v1';
 function endpoint(){const url=String(root.ADVENTURE_SYNC_URL||'').replace(/\/$/,'');return url.startsWith('https://')?url:null}
 function credential(){for(const [storage,key] of [[root.sessionStorage,sessionKey],[root.localStorage,deviceKey]]){try{const value=JSON.parse(storage.getItem(key)||'null');if(value&&/^[a-f0-9]{64}$/.test(value.token)&&value.expiresAt>Date.now()&&value.endpoint===endpoint())return value}catch{}}return null}
 function report(ok,message){root.dispatchEvent(new CustomEvent('adventure-history-status',{detail:{ok,message}}))}
 function forLearner(learner){if(!['emily','jason'].includes(learner))throw Error('Unknown learner');if(!recorders.has(learner))recorders.set(learner,createRecorder({learner,storage:root.localStorage,notify:result=>{if(!result.ok)report(false,result.error);else scheduleSync()}}));return recorders.get(learner)}
 async function request(learner,method,body,cursor){
  const url=endpoint(),session=credential();if(!url||!session)throw Error('Unlock private access from the learner roadmap first.');
  const response=await fetch(url+'/learning-history?child='+encodeURIComponent(learner)+(cursor!==undefined?'&after='+cursor:''),{method,cache:'no-store',headers:{Authorization:'Bearer '+session.token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const result=await response.json();if(result.storage!=='private-d1-v1'||result.historyVersion!==1)throw Error('Private history setup is not finished. Local records are kept for retry.');if(!response.ok)throw Error(result.error||'Private history request failed');return result;
 }
 async function sync(learner){
  if(syncing||!endpoint()||!credential())return false;syncing=true;
  try{
   for(const name of learner?[learner]:['emily','jason']){
    const recorder=forLearner(name);
    for(let batch=0;batch<5;batch++){
     const pending=recorder.pending();if(!pending.length)break;
     const events=[];for(const event of pending.slice(0,20)){if(new TextEncoder().encode(JSON.stringify({historyVersion:1,events:[...events,event]})).length>95000)break;events.push(event)}
     if(!events.length)throw Error('A history record is too large to upload. It remains on this device.');
     const result=await request(name,'POST',{historyVersion:1,events});
     if(!Array.isArray(result.accepted)||result.accepted.some(id=>!events.some(event=>event.id===id)))throw Error('Invalid history acknowledgement');
     recorder.acknowledge(result.accepted);if(result.accepted.length!==events.length)throw Error('Some history records are waiting to upload.');
    }
   }
   report(true,'Learning history synced privately.');return true;
  }catch(error){report(false,error.message);return false}finally{syncing=false}
 }
 function scheduleSync(){clearTimeout(syncTimer);syncTimer=setTimeout(()=>sync(),1200)}
 async function readHistory(learner){const events=[];let cursor=0;for(;;){const result=await request(learner,'GET',null,cursor);if(!Array.isArray(result.events))throw Error('Invalid private history');events.push(...result.events);if(!result.hasMore)break;if(!Number.isInteger(result.nextCursor)||result.nextCursor<=cursor)throw Error('Invalid history cursor');cursor=result.nextCursor}return events}
 async function login(passphrase,remember){const url=endpoint();if(!url)throw Error('Private cloud is not configured');const response=await fetch(url+'/session',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json','X-Family-Pin':passphrase},body:JSON.stringify({remember})});const result=await response.json();if(!response.ok||!/^[a-f0-9]{64}$/.test(result.token))throw Error(result.error||'Could not unlock private history');const value={token:result.token,expiresAt:result.expiresAt,endpoint:url};root.sessionStorage.removeItem(sessionKey);root.localStorage.removeItem(deviceKey);(remember?root.localStorage:root.sessionStorage).setItem(remember?deviceKey:sessionKey,JSON.stringify(value))}
 Object.assign(api,{forLearner,sync,readHistory,login,credential});
 const learner=root.document.body?.dataset.learner;
 if(!['emily','jason'].includes(learner))return;
 const recorder=forLearner(learner),tracked=new Map();let active=null,lastInteraction=Date.now();
 function visible(){return !document.hidden&&document.hasFocus()}
 function flushTime(){if(!active?.since)return;const now=Date.now(),end=Math.min(now,lastInteraction+60000);const delta=Math.max(0,end-active.since);if(delta)recorder.record(active.activity,active.questionId,'time',{activeMs:delta,phase:active.phase||null,measurement:'estimated-active-viewing',idleCutoffMs:60000},active.attemptId);active.since=visible()&&end===now?end:null}
 function activate(meta){if(active&&active.activity===meta.activity&&active.questionId===meta.questionId&&active.attemptId===meta.attemptId&&active.phase===meta.phase){if(!active.since&&visible())active.since=Date.now();return}flushTime();active={...meta,since:visible()?Date.now():null};recorder.record(meta.activity,meta.questionId,'view',{phase:meta.phase||null},meta.attemptId)}
 function viewport(){if(!visible()||Date.now()-lastInteraction>=60000){flushTime();if(active)active.since=null;return}let best=null,bestScore=-Infinity;for(const [element,meta] of tracked){if(meta.phase==='done')continue;if(!element.isConnected){tracked.delete(element);continue}const box=element.getBoundingClientRect();if(box.bottom<=0||box.top>=innerHeight||box.height<=0)continue;const score=Math.min(box.bottom,innerHeight)-Math.max(box.top,0);if(score>bestScore){bestScore=score;best=meta}}if(best)activate(best);else{flushTime();active=null}}
 function interact(event){lastInteraction=Date.now();let node=event.target?.closest?.('[data-learning-question]');if(node&&tracked.has(node))activate(tracked.get(node));else viewport()}
 function writingAnswer(activity,questionId,value,extra={}){const key=activity+':'+questionId,previous=writing.get(key);if(!previous)recorder.answer(activity,questionId,value,{draft:true,writing:true,...extra});clearTimeout(previous?.timer);const pending={activity,questionId,value,extra,timer:setTimeout(()=>flushWriting(activity,questionId),1000)};writing.set(key,pending)}
 function flushWriting(activity,questionId){for(const [key,pending] of writing){if(activity&&key!==activity+':'+questionId)continue;clearTimeout(pending.timer);recorder.answer(pending.activity,pending.questionId,pending.value,{draft:true,writing:true,...pending.extra});writing.delete(key)}}
 root.AdventureHistory={...recorder,sync,flushTime,writing:writingAnswer,flushWriting,bind(element,activity,questionId,attemptId,phase){element.dataset.learningQuestion='1';tracked.set(element,{activity,questionId:String(questionId),attemptId:attemptId||recorder.attempt(activity),phase});setTimeout(viewport,0)}};
 for(const event of ['pointerdown','keydown','focusin'])document.addEventListener(event,interact,true);
 root.addEventListener('scroll',()=>{lastInteraction=Date.now();viewport()},{passive:true});
 root.addEventListener('focus',()=>{lastInteraction=Date.now();viewport();sync()});root.addEventListener('blur',()=>{flushTime();if(active)active.since=null});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){flushWriting();flushTime();if(active)active.since=null;sync()}else{lastInteraction=Date.now();viewport();sync()}});
 root.addEventListener('pagehide',()=>{flushWriting();flushTime();sync()});root.addEventListener('online',()=>sync());
 setInterval(()=>{flushTime();viewport()},10000);setInterval(()=>sync(),30000);
})(globalThis);

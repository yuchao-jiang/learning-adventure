// Run on a trusted computer. Secrets come from the environment, never command arguments.
const fs=require('node:fs/promises');
const path=require('node:path');
const {TextEncoder}=require('node:util');
const stable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
function batches(events){const result=[];let batch=[];for(const e of events){if(new TextEncoder().encode(JSON.stringify({historyVersion:1,events:[e]})).length>95000)throw Error('An event is too large to migrate');if(batch.length===20||new TextEncoder().encode(JSON.stringify({historyVersion:1,events:[...batch,e]})).length>95000){result.push(batch);batch=[]}batch.push(e)}if(batch.length)result.push(batch);return result}
async function migrate(mode,{endpoint,passphrase,file,fetcher=fetch}){
 if(!['export','import','verify'].includes(mode)||!endpoint?.startsWith('https://')||!passphrase||!file)throw Error('Set ADVENTURE_SYNC_URL and FAMILY_PASSPHRASE; use export|import|verify <private-file>');
 const root=endpoint.replace(/\/$/,''),expected=mode==='export'?'private-d1-v1':'private-github-v1';
 async function api(child,route,method='GET',body){const response=await fetcher(root+route+(route.includes('?')?'&':'?')+'child='+child,{method,redirect:'error',headers:{'X-Family-Pin':passphrase,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});const value=await response.json();if(!response.ok||value.storage!==expected)throw Error('Private migration request failed or storage mode is incorrect');return value}
 async function history(child){const records=[];let cursor=0;for(;;){const page=await api(child,'/learning-history?after='+cursor);if(page.historyVersion!==1||!Array.isArray(page.events))throw Error('History setup is incomplete');records.push(...page.events);if(!page.hasMore)break;if(!Number.isSafeInteger(page.nextCursor)||page.nextCursor<=cursor)throw Error('Invalid history cursor');cursor=page.nextCursor}return records}
 if(mode==='export'){
  const backup={version:1,source:'private-d1-v1',exportedAt:new Date().toISOString(),learners:{}};
  for(const child of ['emily','jason']){const progress=await api(child,'/');backup.learners[child]={progress:progress.exists?progress.data.data:null,events:await history(child)}}
  await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,JSON.stringify(backup,null,2),{flag:'wx',mode:0o600});return;
 }
 const backup=JSON.parse(await fs.readFile(file,'utf8'));if(backup.version!==1||backup.source!=='private-d1-v1'||!backup.learners)throw Error('Invalid private backup');
 // Validate the entire backup before writing anything. Never replace existing different data.
 const prepared=[];
 for(const child of ['emily','jason']){const record=backup.learners[child];if(!record||!Array.isArray(record.events)||record.events.some(e=>e.learner!==child))throw Error('Invalid learner backup');prepared.push({child,record,batches:batches(record.events)});const remote=await api(child,'/');if(remote.exists&&stable(remote.data.data)!==stable(record.progress))throw Error('Different destination progress exists; migration stopped without replacing it')}
 for(const {child,record,batches:chunks} of prepared){
  const existing=await api(child,'/');
  if(mode==='import'){
   if(record.progress!==null&&!existing.exists)await api(child,'/','POST',{version:1,child,sha:null,data:record.progress});
   for(const events of chunks){const result=await api(child,'/learning-history','POST',{historyVersion:1,events});if(!Array.isArray(result.accepted)||result.accepted.length!==events.length||events.some(e=>!result.accepted.includes(e.id)))throw Error('Incomplete history migration acknowledgement')}
  }
  const progress=await api(child,'/');if(record.progress===null?progress.exists:!progress.exists||stable(progress.data.data)!==stable(record.progress))throw Error('Progress verification failed');
  const remote=new Map((await history(child)).map(e=>[e.id,stable(e)]));for(const event of record.events)if(remote.get(event.id)!==stable(event))throw Error('History verification failed');
 }
}
module.exports={migrate,batches};
if(require.main===module)migrate(process.argv[2],{endpoint:process.env.ADVENTURE_SYNC_URL,passphrase:process.env.FAMILY_PASSPHRASE,file:process.argv[3]}).then(()=>console.log('Private migration operation completed and checked. No learner contents are printed.')).catch(()=>{console.error('Migration did not complete. Keep the private backup and check setup; do not delete D1 records.');process.exitCode=1});

// Public learning pages; authenticated progress in a private D1 binding named PROGRESS_DB.
const STORAGE = 'private-d1-v1';
const MAX_BYTES = 100000;
const DAY = 24 * 60 * 60 * 1000;
const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
async function digest(value) {
 return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
}
async function sameSecret(a, b) {
 const [left, right] = await Promise.all([digest(a), digest(b)]);
 let difference = 0;
 for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
 return difference === 0;
}
async function readPayload(request) {
 const reader = request.body?.getReader();
 if (!reader) throw new Error('Invalid JSON');
 let length = 0;
 const chunks = [];
 try {
  while (true) {
   const { done, value } = await reader.read();
   if (done) break;
   length += value.byteLength;
   if (length > MAX_BYTES) { await reader.cancel(); throw new Error('Save too large'); }
   chunks.push(value);
  }
 } finally { reader.releaseLock(); }
 const bytes = new Uint8Array(length);
 let offset = 0;
 for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
 return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}
export default { async fetch(request, env, ctx) {
 const allowed = env.ALLOWED_ORIGIN || 'https://yuchao-jiang.github.io';
 const headers = {
  'Access-Control-Allow-Origin': allowed,
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Family-Pin,Authorization',
  'Cache-Control': 'no-store', 'Vary': 'Origin', 'X-Content-Type-Options': 'nosniff'
 };
 const reply = (body, status = 200, extra = {}) => new Response(JSON.stringify({ ...body, storage: STORAGE }), {
  status, headers: { ...headers, 'Content-Type': 'application/json', ...extra }
 });
 const origin = request.headers.get('Origin');
 if (origin && origin !== allowed) return reply({ error: 'Origin not allowed' }, 403);
 if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
 const url = new URL(request.url);
 const sessionRoute = url.pathname === '/session';
 const revokeAllRoute = url.pathname === '/sessions';
 const historyRoute = url.pathname === '/learning-history';
 const archiveRoute = url.pathname === '/archive';
 const notionRoute = url.pathname === '/notion-sync';
 if (sessionRoute ? !['POST', 'DELETE'].includes(request.method) : revokeAllRoute ? request.method !== 'DELETE' : !['GET', 'POST'].includes(request.method)) return reply({ error: 'Method not allowed' }, 405);
 const child = url.searchParams.get('child');
 if (!sessionRoute && !revokeAllRoute && !['emily', 'jason'].includes(child)) return reply({ error: 'Unknown learner' }, 400);
 if (!env.PROGRESS_DB || typeof env.FAMILY_PASSPHRASE !== 'string' || env.FAMILY_PASSPHRASE.length < 16 || env.FAMILY_PASSPHRASE.length > 256) {
  return reply({ error: 'Private storage is not configured' }, 503);
 }
 try {
  // Hash client identifiers with the secret; never persist raw addresses or credentials.
  const bucket = Math.floor(Date.now() / 60000);
  const clientBytes = await digest(env.FAMILY_PASSPHRASE + ':' + (request.headers.get('CF-Connecting-IP') || 'unknown'));
  const client = hex(clientBytes);
  const attempts = await env.PROGRESS_DB.prepare('SELECT attempts FROM auth_attempts WHERE client = ? AND bucket = ?').bind(client, bucket).first();
  if (attempts?.attempts >= 5) return reply({ error: 'Too many attempts. Try again in a minute.' }, 429, { 'Retry-After': '60' });
  const passphrase = request.headers.get('X-Family-Pin') || '';
  const token = (request.headers.get('Authorization') || '').match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  const tokenHash = token ? hex(await digest(env.FAMILY_PASSPHRASE + ':' + token)) : null;
  const needsParent = (sessionRoute && request.method === 'POST') || revokeAllRoute;
  let authenticated = false;
  if (!needsParent && tokenHash) {
   const session = await env.PROGRESS_DB.prepare('SELECT expires_at FROM device_sessions WHERE token_hash = ?').bind(tokenHash).first();
   authenticated = !!session && session.expires_at > Date.now();
  } else if (!request.headers.has('Authorization')) {
   authenticated = passphrase.length <= 256 && await sameSecret(passphrase, env.FAMILY_PASSPHRASE);
  }
  if (!authenticated) {
   await env.PROGRESS_DB.prepare('INSERT INTO auth_attempts (client, bucket, attempts) VALUES (?, ?, 1) ON CONFLICT(client, bucket) DO UPDATE SET attempts = attempts + 1').bind(client, bucket).run();
   await env.PROGRESS_DB.prepare('DELETE FROM auth_attempts WHERE bucket < ?').bind(bucket - 1).run();
   return reply({ error: needsParent ? 'Incorrect family passphrase' : 'Cloud session expired or invalid. Ask a parent to unlock again.' }, 401);
  }
  if (revokeAllRoute) {
   await env.PROGRESS_DB.prepare('DELETE FROM device_sessions').bind().run();
   return reply({ ok: true });
  }
  if (sessionRoute && request.method === 'DELETE') {
   if (!tokenHash) return reply({ error: 'A device token is required' }, 400);
   await env.PROGRESS_DB.prepare('DELETE FROM device_sessions WHERE token_hash = ?').bind(tokenHash).run();
   return reply({ ok: true });
  }
  if (sessionRoute) {
   let options;
   try { options = await readPayload(request); } catch { return reply({ error: 'Invalid session options' }, 400); }
   if (!isObject(options) || typeof options.remember !== 'boolean') return reply({ error: 'Invalid session options' }, 400);
   const now = Date.now(), expiresAt = now + (options.remember ? 30 * DAY : 12 * 60 * 60 * 1000);
   const deviceToken = hex(crypto.getRandomValues(new Uint8Array(32)));
   const hash = hex(await digest(env.FAMILY_PASSPHRASE + ':' + deviceToken));
   await env.PROGRESS_DB.prepare('DELETE FROM device_sessions WHERE expires_at <= ?').bind(now).run();
   await env.PROGRESS_DB.prepare('INSERT INTO device_sessions (token_hash, expires_at) VALUES (?, ?)').bind(hash, expiresAt).run();
   return reply({ token: deviceToken, expiresAt, remembered: options.remember });
  }
  await initArchive(env);
  await initNotionSync(env);
  if(notionRoute){if(request.method==='GET')return reply({notion:await notionStatus(env)});try{return reply({notion:await flushNotion(env)})}catch{return reply({error:'Notion sync unavailable; records remain saved in D1 for retry.'},503)}}
  if(archiveRoute){if(request.method==='GET')return reply({archive:await archiveStatus(env)});try{return reply({archive:await flushArchive(env)})}catch{return reply({error:'Private GitHub archive unavailable; records remain queued in D1.'},503)}}
  backgroundLearningSync(env,ctx);
  if(historyRoute){
   const historyReply=(body,status=200)=>reply({...body,historyVersion:1},status);
   if(request.method==='GET'){
    const after=Number(url.searchParams.get('after')||0);
    if(!Number.isSafeInteger(after)||after<0)return historyReply({error:'Invalid history cursor'},400);
    const result=await env.PROGRESS_DB.prepare('SELECT seq, document FROM learning_events WHERE learner = ? AND seq > ? ORDER BY seq LIMIT 100').bind(child,after).all();
    return historyReply({events:result.results.map(row=>JSON.parse(row.document)),nextCursor:result.results.at(-1)?.seq||after,hasMore:result.results.length===100});
   }
   let payload;
   try{payload=await readPayload(request)}catch(error){return historyReply({error:error.message==='Save too large'?'History batch too large':'Invalid history JSON'},error.message==='Save too large'?413:400)}
   const kinds=['answer','check','hint','view','time','completion','start','import','restart','flag','reopen','parent-note'];
   const valid=event=>isObject(event)&&event.version===1&&event.learner===child&&typeof event.id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(event.id)&&typeof event.activity==='string'&&event.activity.length>0&&event.activity.length<=100&&typeof event.questionId==='string'&&event.questionId.length<=150&&typeof event.attemptId==='string'&&event.attemptId.length<=150&&kinds.includes(event.type)&&(event.type!=='parent-note'||(event.data?.authorRole==='parent'&&typeof event.data?.text==='string'&&event.data.text.trim().length>0&&event.data.text.length<=8000))&&typeof event.at==='string'&&Number.isFinite(Date.parse(event.at))&&isObject(event.question)&&isObject(event.data)&&new TextEncoder().encode(JSON.stringify(event)).length<=64000;
   if(!isObject(payload)||payload.historyVersion!==1||!Array.isArray(payload.events)||payload.events.length<1||payload.events.length>20||!payload.events.every(valid))return historyReply({error:'Invalid history batch'},400);
   const stable=value=>JSON.stringify(value,(_,item)=>isObject(item)?Object.fromEntries(Object.keys(item).sort().map(key=>[key,item[key]])):item);
   const accepted=[];
   for(const event of payload.events){
    const document=stable(event);
    const result=await env.PROGRESS_DB.prepare('INSERT INTO learning_events (event_id, learner, occurred_at, document) VALUES (?, ?, ?, ?) ON CONFLICT(event_id) DO NOTHING').bind(event.id,child,event.at,document).run();
    if(result.meta.changes!==1){const existing=await env.PROGRESS_DB.prepare('SELECT document FROM learning_events WHERE event_id = ?').bind(event.id).first();if(existing?.document!==document)return historyReply({error:'History event already exists with different content'},409)}
    accepted.push(event.id);
   }
   backgroundLearningSync(env,ctx);
   return historyReply({ok:true,accepted});
  }
  // Both reads and writes are authenticated before touching learner records.
  if (request.method === 'GET') {
   const row = await env.PROGRESS_DB.prepare('SELECT document, revision FROM progress WHERE child = ?').bind(child).first();
   return row ? reply({ exists: true, data: JSON.parse(row.document), sha: row.revision }) : reply({ exists: false, data: null });
  }
  if (Number(request.headers.get('Content-Length') || 0) > MAX_BYTES) return reply({ error: 'Save too large' }, 413);
  let payload;
  try { payload = await readPayload(request); }
  catch (error) { return reply({ error: error.message === 'Save too large' ? error.message : 'Invalid JSON' }, error.message === 'Save too large' ? 413 : 400); }
  if (!isObject(payload) || payload.version !== 1 || payload.child !== child || !isObject(payload.data) ||
      !(payload.sha == null || typeof payload.sha === 'string')) return reply({ error: 'Invalid save format' }, 400);
  const revision = crypto.randomUUID();
  const document = JSON.stringify({ version: 1, child, data: payload.data, updatedAt: new Date().toISOString() });
  // Conditional SQL makes stale/concurrent writes fail atomically.
  const result = payload.sha == null
   ? await env.PROGRESS_DB.prepare('INSERT INTO progress (child, document, revision) VALUES (?, ?, ?) ON CONFLICT(child) DO NOTHING').bind(child, document, revision).run()
   : await env.PROGRESS_DB.prepare('UPDATE progress SET document = ?, revision = ? WHERE child = ? AND revision = ?').bind(document, revision, child, payload.sha).run();
  if (result.meta.changes !== 1) return reply({ error: 'Newer private save found. Load it before saving again.', code: 'CONFLICT' }, 409);
  backgroundLearningSync(env,ctx);
  return reply({ ok: true, sha: revision });
 } catch {
  // Never return database details, saved answers, or credentials in error messages.
  return reply({ error: 'Private storage unavailable. Try again later.' }, 503);
 }
},async scheduled(event,env,ctx){await initArchive(env);await initNotionSync(env);backgroundLearningSync(env,ctx)}};


// Durable archive: only records are queued, never request headers or family credentials.
const archiveReady = new WeakSet(), archiveBusy = new WeakSet();
const ARCHIVE_REPO = 'yuchao-jiang/learning-records';
async function initArchive(env) {
 const db=env.PROGRESS_DB;if(archiveReady.has(db))return;
 const statements=[
 `CREATE TABLE IF NOT EXISTS github_archive_queue (seq INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, learner TEXT NOT NULL, record_id TEXT NOT NULL, document TEXT NOT NULL, UNIQUE(kind,record_id))`,
 `CREATE TABLE IF NOT EXISTS github_archive_state (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
 `CREATE TRIGGER IF NOT EXISTS github_archive_progress_insert AFTER INSERT ON progress BEGIN INSERT OR IGNORE INTO github_archive_queue(kind,learner,record_id,document) VALUES('progress',NEW.child,NEW.revision,NEW.document); END`,
 `CREATE TRIGGER IF NOT EXISTS github_archive_progress_update AFTER UPDATE ON progress BEGIN INSERT OR IGNORE INTO github_archive_queue(kind,learner,record_id,document) VALUES('progress',NEW.child,NEW.revision,NEW.document); END`,
 `CREATE TRIGGER IF NOT EXISTS github_archive_event_insert AFTER INSERT ON learning_events BEGIN INSERT OR IGNORE INTO github_archive_queue(kind,learner,record_id,document) VALUES('event',NEW.learner,NEW.event_id,NEW.document); END`
 ];
 for(const sql of statements)await db.prepare(sql).bind().run();
 const backfilled=await db.prepare("SELECT value FROM github_archive_state WHERE key = 'backfilled-v1'").bind().first();
 if(!backfilled){
  await db.prepare("INSERT OR IGNORE INTO github_archive_queue(kind,learner,record_id,document) SELECT 'progress',child,revision,document FROM progress").bind().run();
  await db.prepare("INSERT OR IGNORE INTO github_archive_queue(kind,learner,record_id,document) SELECT 'event',learner,event_id,document FROM learning_events").bind().run();
  await db.prepare("INSERT OR IGNORE INTO github_archive_state(key,value) VALUES('backfilled-v1','yes')").bind().run();
 }
 archiveReady.add(db);
}
const archivePart=value=>encodeURIComponent(String(value||'unknown')).replaceAll('.', '%2E');
const safeMd=value=>String(value??'').replaceAll('<','&lt;').replaceAll('>','&gt;');
function archiveAnswer(value,question={}){if(value===undefined)return null;const options=question.options||[];return Number.isInteger(value)&&options[value]!==undefined?`${String.fromCharCode(65+value)} — ${safeMd(options[value])}`:safeMd(typeof value==='object'?JSON.stringify(value):value)}
function archiveReport(events,learner,activity,attempt){
 const lines=[`# ${learner==='emily'?'Emily':'Jason'} — ${safeMd(activity)}`,`Practice ID: ${safeMd(attempt)}`,'',`Recorded events: ${events.length}`,''];
 const groups=new Map();
 for(const e of events){if(e.type==='parent-note'){lines.push('## Parent observation',`![Parent observation](parent-notes/${archivePart(e.id)}.svg)`,'');continue}if(e.questionId==='summary'){if(e.type==='completion')lines.push(`Completion recorded: ${safeMd(e.at)}`,'');continue}if(!groups.has(e.questionId))groups.set(e.questionId,[]);groups.get(e.questionId).push(e)}
 for(const [id,rows] of groups){const q=[...rows].reverse().find(e=>Object.keys(e.question||{}).length)?.question||{},answers=rows.filter(e=>e.type==='answer'),first=answers[0],last=answers.at(-1);lines.push(`## Question ${safeMd(id)}`,'');if(q.prompt)lines.push(safeMd(q.prompt),'');if(q.context)lines.push(safeMd(q.context),'');if(q.options?.length)q.options.forEach((o,i)=>lines.push(`${String.fromCharCode(65+i)}. ${safeMd(o)}`));lines.push('');if(q.skill)lines.push(`Knowledge point: ${safeMd(q.skill)}`);if(q.outcome)lines.push(`NSW outcome: ${safeMd(q.outcome)}`);if(q.image)lines.push(`Original question image: https://yuchao-jiang.github.io/learning-adventure/${String(q.image).replace(/^\.\//,'')}`);if(first){const initial=archiveAnswer(first.data.answer,q);lines.push(`First recorded answer: ${initial}`);if(typeof first.data.correct==='boolean')lines.push(`First answer: **${first.data.correct?'Right':'Wrong'}**`);if(last!==first){lines.push(`Latest recorded answer: ${archiveAnswer(last.data.answer,q)}`);if(typeof last.data.correct==='boolean')lines.push(`Latest answer: **${last.data.correct?'Right':'Wrong'}**`)}if(Number.isInteger(q.correctIndex)&&!q.writing)lines.push(`Correct answer: ${archiveAnswer(q.correctIndex,q)}`);lines.push(`First answer recorded at: ${safeMd(first.at)}`)}const times=rows.filter(e=>e.type==='time'&&Number.isFinite(e.data.activeMs));if(times.length)lines.push(`Estimated active viewing time: ${Math.round(times.reduce((n,e)=>n+Math.max(0,e.data.activeMs),0)/1000)} seconds`);const hints=rows.filter(e=>e.type==='hint').length;if(hints)lines.push(`Hints recorded: ${hints}`);if(rows.some(e=>e.type==='import'))lines.push('Some work was imported; the first recorded answer may not be the original first attempt.');lines.push('')}
 lines.push('Raw event JSON files retain answer changes, checking, flags, timing and other recorded details. Completion and right/wrong answers are not proof of independent work or mastery.');return lines.join('\n');
}
function archiveNoteSvg(text){const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');const lines=String(text).match(/.{1,78}/gu)||[''];return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="${50+lines.length*28}" viewBox="0 0 1000 ${50+lines.length*28}"><rect width="100%" height="100%" fill="#eef5ff"/><g fill="#235bad" font-family="Arial,sans-serif" font-size="20">${lines.map((line,i)=>`<text x="20" y="${35+i*28}">${escape(line)}</text>`).join('')}</g></svg>`}
function archivePiano(document,learner){let piano;try{piano=typeof document.data?.piano==='string'?JSON.parse(document.data.piano):document.data?.piano}catch{return null}if(!piano?.days||!Object.keys(piano.days).length)return null;const lines=[`# ${learner==='emily'?'Emily':'Jason'} — Piano check-ins`,'','Dates below come from the saved practice check-ins. No duration or musical proficiency is inferred.',''];for(const [day,row] of Object.entries(piano.days).sort(([a],[b])=>a.localeCompare(b))){lines.push(`## ${safeMd(day)}`);if(row.at)lines.push(`Check-in recorded at: ${safeMd(row.at)}`);if(Array.isArray(row.tasks)&&row.tasks.length)lines.push(`Practice items: ${row.tasks.map(safeMd).join(', ')}`);lines.push('')}return lines.join('\n')}
async function archiveApi(env,path,method='GET',body){const response=await fetch('https://api.github.com/repos/'+ARCHIVE_REPO+path,{method,headers:{Authorization:'Bearer '+env.GITHUB_ARCHIVE_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'learning-adventure-private-archive',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});if(!response.ok){const error=Error('Private GitHub archive request failed');error.retry=[409,422].includes(response.status);throw error}return response.json()}
async function archiveStatus(env){const count=await env.PROGRESS_DB.prepare('SELECT COUNT(*) AS count FROM github_archive_queue').bind().first(),last=await env.PROGRESS_DB.prepare("SELECT value FROM github_archive_state WHERE key = 'last-commit'").bind().first();return {configured:typeof env.GITHUB_ARCHIVE_TOKEN==='string'&&!!env.GITHUB_ARCHIVE_TOKEN,pending:count.count,lastCommit:last?.value||null,repository:ARCHIVE_REPO}}
async function flushArchive(env){
 if(!env.GITHUB_ARCHIVE_TOKEN)return {...await archiveStatus(env),state:'not-configured'};
 const db=env.PROGRESS_DB;if(archiveBusy.has(db))return {...await archiveStatus(env),state:'busy'};archiveBusy.add(db);
 try{
  const repo=await archiveApi(env,'');if(repo.private!==true||repo.full_name!==ARCHIVE_REPO)throw Error('Destination must be the configured private repository');
  for(let batch=0;batch<3;batch++){
   const queued=(await db.prepare('SELECT seq,kind,learner,record_id,document FROM github_archive_queue ORDER BY seq LIMIT 20').bind().all()).results;if(!queued.length)break;
   const entries=[],reports=new Map();
   for(const row of queued){const record=JSON.parse(row.document);if(row.kind==='progress'){entries.push({path:`${row.learner}/progress/snapshots/${archivePart(row.record_id)}.json`,mode:'100644',type:'blob',content:row.document})}else{const folder=`${row.learner}/activities/${archivePart(record.activity)}/${archivePart(record.attemptId)}`;entries.push({path:`${folder}/events/${archivePart(record.id)}.json`,mode:'100644',type:'blob',content:row.document});reports.set(folder,{learner:row.learner,activity:record.activity,attempt:record.attemptId});if(record.type==='parent-note')entries.push({path:folder+'/parent-notes/'+archivePart(record.id)+'.svg',mode:'100644',type:'blob',content:archiveNoteSvg(record.data.text)})}}
   for(const [folder,meta] of reports){const rows=(await db.prepare("SELECT document FROM learning_events WHERE learner = ? AND json_extract(document,'$.activity') = ? AND json_extract(document,'$.attemptId') = ? ORDER BY occurred_at,seq").bind(meta.learner,meta.activity,meta.attempt).all()).results;entries.push({path:folder+'/report.md',mode:'100644',type:'blob',content:archiveReport(rows.map(r=>JSON.parse(r.document)),meta.learner,meta.activity,meta.attempt)})}
   for(const learner of new Set(queued.filter(row=>row.kind==='progress').map(row=>row.learner))){const current=await db.prepare('SELECT document FROM progress WHERE child = ?').bind(learner).first();if(current){const content=archivePiano(JSON.parse(current.document),learner);if(content)entries.push({path:learner+'/piano/check-ins.md',mode:'100644',type:'blob',content})}}
   let committed;
   for(let retry=0;retry<3;retry++){try{const head=await archiveApi(env,'/git/ref/heads/main'),base=await archiveApi(env,'/git/commits/'+head.object.sha),tree=await archiveApi(env,'/git/trees','POST',{base_tree:base.tree.sha,tree:entries}),commit=await archiveApi(env,'/git/commits','POST',{message:'Archive private learning records',tree:tree.sha,parents:[head.object.sha]});await archiveApi(env,'/git/refs/heads/main','PATCH',{sha:commit.sha,force:false});committed=commit.sha;break}catch(error){if(!error.retry||retry===2)throw error;for(const [folder,meta] of reports){const rows=(await db.prepare("SELECT document FROM learning_events WHERE learner = ? AND json_extract(document,'$.activity') = ? AND json_extract(document,'$.attemptId') = ? ORDER BY occurred_at,seq").bind(meta.learner,meta.activity,meta.attempt).all()).results;entries.find(e=>e.path===folder+'/report.md').content=archiveReport(rows.map(r=>JSON.parse(r.document)),meta.learner,meta.activity,meta.attempt)}for(const entry of entries.filter(e=>e.path.endsWith('/piano/check-ins.md'))){const learner=entry.path.split('/')[0],current=await db.prepare('SELECT document FROM progress WHERE child = ?').bind(learner).first();if(current)entry.content=archivePiano(JSON.parse(current.document),learner)||entry.content}}}
   // A failed or conflicting GitHub write leaves every queued row intact for retry.
   for(const row of queued)await db.prepare('DELETE FROM github_archive_queue WHERE seq = ?').bind(row.seq).run();
   await db.prepare("INSERT INTO github_archive_state(key,value) VALUES('last-commit',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(committed).run();
  }
  return {...await archiveStatus(env),state:'ok'};
 }finally{archiveBusy.delete(db)}
}

const notionReady=new WeakSet(),notionBusy=new WeakSet();
const notionConfigured=env=>typeof env.NOTION_SYNC_TOKEN==='string'&&!!env.NOTION_SYNC_TOKEN&&/^[a-f0-9-]{32,36}$/i.test(env.NOTION_DATA_SOURCE_ID||'');
async function initNotionSync(env){const db=env.PROGRESS_DB;if(notionReady.has(db))return;const sqls=[
 `CREATE TABLE IF NOT EXISTS notion_sync_jobs(job_key TEXT PRIMARY KEY, learner TEXT NOT NULL, kind TEXT NOT NULL, activity TEXT NOT NULL, attempt TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL, lock_owner TEXT, lease_until INTEGER NOT NULL DEFAULT 0)`,
 `CREATE TABLE IF NOT EXISTS notion_sync_pages(sync_key TEXT PRIMARY KEY,page_id TEXT NOT NULL,block_id TEXT)`,
 `CREATE TABLE IF NOT EXISTS notion_piano_state(learner TEXT NOT NULL,day TEXT NOT NULL,document TEXT NOT NULL,PRIMARY KEY(learner,day))`,
 `CREATE TRIGGER IF NOT EXISTS notion_piano_insert AFTER INSERT ON notion_piano_state BEGIN INSERT INTO notion_sync_jobs(job_key,learner,kind,activity,attempt,updated_at) VALUES(NEW.learner||':piano:'||NEW.day,NEW.learner,'piano','piano',NEW.day,datetime('now')) ON CONFLICT(job_key) DO UPDATE SET revision=revision+1,updated_at=excluded.updated_at; END`,
 `CREATE TRIGGER IF NOT EXISTS notion_piano_update AFTER UPDATE ON notion_piano_state BEGIN INSERT INTO notion_sync_jobs(job_key,learner,kind,activity,attempt,updated_at) VALUES(NEW.learner||':piano:'||NEW.day,NEW.learner,'piano','piano',NEW.day,datetime('now')) ON CONFLICT(job_key) DO UPDATE SET revision=revision+1,updated_at=excluded.updated_at; END`,
 `CREATE TRIGGER IF NOT EXISTS notion_progress_insert AFTER INSERT ON progress BEGIN INSERT INTO notion_sync_jobs(job_key,learner,kind,activity,attempt,updated_at) VALUES(NEW.child||':progress',NEW.child,'progress','progress','current',datetime('now')) ON CONFLICT(job_key) DO UPDATE SET revision=revision+1,updated_at=excluded.updated_at; END`,
 `CREATE TRIGGER IF NOT EXISTS notion_progress_update AFTER UPDATE ON progress BEGIN INSERT INTO notion_sync_jobs(job_key,learner,kind,activity,attempt,updated_at) VALUES(NEW.child||':progress',NEW.child,'progress','progress','current',datetime('now')) ON CONFLICT(job_key) DO UPDATE SET revision=revision+1,updated_at=excluded.updated_at; END`,
 `CREATE TRIGGER IF NOT EXISTS notion_event_insert AFTER INSERT ON learning_events BEGIN INSERT INTO notion_sync_jobs(job_key,learner,kind,activity,attempt,updated_at) VALUES(NEW.learner||':event:'||hex(json_extract(NEW.document,'$.activity'))||':'||hex(json_extract(NEW.document,'$.attemptId')),NEW.learner,'event',json_extract(NEW.document,'$.activity'),json_extract(NEW.document,'$.attemptId'),datetime('now')) ON CONFLICT(job_key) DO UPDATE SET revision=revision+1,updated_at=excluded.updated_at; END`
 ];for(const sql of sqls)await db.prepare(sql).bind().run();
 const done=await db.prepare("SELECT value FROM github_archive_state WHERE key='notion-backfilled-v1'").bind().first();if(!done){
 await db.prepare("INSERT OR IGNORE INTO notion_sync_jobs(job_key,learner,kind,activity,attempt,updated_at) SELECT child||':progress',child,'progress','progress','current',datetime('now') FROM progress").bind().run();
 await db.prepare("INSERT OR IGNORE INTO notion_sync_jobs(job_key,learner,kind,activity,attempt,updated_at) SELECT learner||':event:'||hex(json_extract(document,'$.activity'))||':'||hex(json_extract(document,'$.attemptId')),learner,'event',json_extract(document,'$.activity'),json_extract(document,'$.attemptId'),datetime('now') FROM learning_events").bind().run();
 await db.prepare("INSERT OR IGNORE INTO github_archive_state(key,value) VALUES('notion-backfilled-v1','yes')").bind().run();}notionReady.add(db);
}
const notionText=value=>({type:'text',text:{content:String(value)}});
const notionChunks=text=>{if(text.length>180000)throw Error('Session details exceed Notion block capacity');return (text.match(/[\s\S]{1,1800}/g)||['']).map(notionText)};
const notionDate=value=>value&&Number.isFinite(Date.parse(value))?{date:{start:new Date(value).toISOString()}}:{date:null};
function notionArea(activity){if(/thinking/i.test(activity))return 'Thinking Skills';if(/maths|math/i.test(activity))return 'Maths';if(/pony|garden|rainbow|shop|cupcake|parcel/i.test(activity))return 'English and Maths';if(/piano/i.test(activity))return 'Piano';return 'English'}
function notionLabel(activity){return {'pony-friendship':'The Lost Friendship Star','garden-club':'Zoe, Taylor and Gabby’s Garden Club','oc-thinking-pt1':'OC Thinking Skills','maths':'Maths practice'}[activity]||activity}
function notionSession(events,learner,activity,attempt){events=events.filter(e=>!e.data?.preview).sort((a,b)=>a.at.localeCompare(b.at));if(!events.some(e=>['answer','check','start','completion','parent-note'].includes(e.type)))return null;
 const answers=new Map();for(const e of events){if(e.questionId==='summary'||e.question?.writing||e.data?.writing)continue;if(e.type==='answer'){if(!answers.has(e.questionId))answers.set(e.questionId,[]);answers.get(e.questionId).push(e)}}
 const hasUnknownFirst=events.some(e=>e.type==='import'&&e.data?.initialAnswerKnown===false),firsts=[...answers.values()].map(a=>a[0]),lasts=[...answers.values()].map(a=>a.at(-1));const scoredFirst=firsts.filter(e=>typeof e.data.correct==='boolean'),scoredLast=lasts.filter(e=>typeof e.data.correct==='boolean');
 const completion=events.filter(e=>e.type==='completion').at(-1),start=events.find(e=>e.type==='start')||events.find(e=>e.type==='answer'),summary=events.filter(e=>e.questionId==='summary'&&(Number.isInteger(e.data?.gradedTotal)||Number.isInteger(e.data?.total)||Array.isArray(e.data?.ids))).at(-1);const total=summary?(summary.data.gradedTotal??summary.data.total??summary.data.ids.length):Math.max(answers.size,scoredLast.length);
 const setId=events.find(e=>typeof e.data?.setId==='string')?.data.setId,setName={oc1:'Set 1 · Clue Detectives',oc2:'Set 2 · Puzzle Explorers',oc3:'Set 3 · Clever Connections',oc4:'Set 4 · Final Quest'}[setId];const properties={Session:{title:[notionText((learner==='emily'?'Emily':'Jason')+' · '+notionLabel(activity)+(setName?' · '+setName:''))]},Child:{select:{name:learner==='emily'?'Emily':'Jason'}},Area:{select:{name:notionArea(activity)}},State:{select:{name:completion?'Completed':start?'In progress':'Saved progress'}},Started:notionDate(start?.at),Completed:notionDate(completion?.at),'First correct':{number:!hasUnknownFirst&&scoredFirst.length?scoredFirst.filter(e=>e.data.correct).length:null},'Latest correct':{number:scoredLast.length?scoredLast.filter(e=>e.data.correct).length:null},'Question count':{number:total||null},'Active seconds':{number:events.some(e=>e.type==='time')?Math.round(events.filter(e=>e.type==='time').reduce((n,e)=>n+Math.max(0,Number(e.data?.activeMs)||0),0)/1000):null},'Website updated':notionDate(events.at(-1)?.at)};
 let report=archiveReport(events,learner,activity,attempt).replace(/^#{1,6}\s+/gm,'').replace(/\*\*/g,'');for(const e of events.filter(e=>e.type==='parent-note'))report=report.replace(`![Parent observation](parent-notes/${archivePart(e.id)}.svg)`,String(e.data.text));
 if(hasUnknownFirst)report+='\n\nOriginal first-attempt scores are not inferred from imported work.';
 return {id:learner+'|'+activity+'|'+attempt,properties,report};
}
async function notionApi(env,path,method='GET',body){const response=await fetch('https://api.notion.com/v1/'+path,{method,headers:{Authorization:'Bearer '+env.NOTION_SYNC_TOKEN,'Notion-Version':'2025-09-03','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});if(!response.ok){const error=Error('Notion sync unavailable; the saved learning records remain queued');error.status=response.status;throw error}return response.json()}
async function notionWrite(env,row,recover=true){const ds=env.NOTION_DATA_SOURCE_ID.replaceAll('-',''),syncKey=ds+'|'+row.id;const properties={...row.properties,'Sync ID':{rich_text:[notionText(row.id)]}};
 // Parent observations and Support are deliberately absent: only the parent/chat edits them.
 const found=await notionApi(env,'data_sources/'+env.NOTION_DATA_SOURCE_ID+'/query','POST',{filter:{property:'Sync ID',rich_text:{equals:row.id}},page_size:2});if(found.results?.length>1)throw Error('Duplicate session identifiers need review');
 const mapped=await env.PROGRESS_DB.prepare('SELECT page_id,block_id FROM notion_sync_pages WHERE sync_key=?').bind(syncKey).first();let page=found.results?.[0]||(mapped?.page_id?{id:mapped.page_id}:null);if(page){try{await notionApi(env,'pages/'+page.id,'PATCH',{properties})}catch(error){if(error.status!==404||!recover)throw error;await env.PROGRESS_DB.prepare('DELETE FROM notion_sync_pages WHERE sync_key=?').bind(syncKey).run();return notionWrite(env,row,false)}}else{page=await notionApi(env,'pages','POST',{parent:{type:'data_source_id',data_source_id:env.NOTION_DATA_SOURCE_ID},properties});await env.PROGRESS_DB.prepare('INSERT INTO notion_sync_pages(sync_key,page_id,block_id) VALUES(?,?,NULL) ON CONFLICT(sync_key) DO UPDATE SET page_id=excluded.page_id,block_id=NULL').bind(syncKey,page.id).run()}
 let blockId;const marker='Website results · updated automatically\n';const cached=await env.PROGRESS_DB.prepare('SELECT block_id FROM notion_sync_pages WHERE sync_key = ?').bind(syncKey).first();blockId=cached?.block_id;
 if(!blockId){let cursor;do{const blocks=await notionApi(env,'blocks/'+page.id+'/children?page_size=100'+(cursor?'&start_cursor='+encodeURIComponent(cursor):''));blockId=blocks.results?.find(b=>b.type==='callout'&&b.callout?.rich_text?.[0]?.text?.content?.startsWith(marker))?.id;cursor=blocks.has_more?blocks.next_cursor:null;if(blockId)break}while(cursor)}
 const callout={rich_text:notionChunks(marker+row.report),icon:{type:'emoji',emoji:'📊'},color:'gray_background'};
 if(blockId){try{await notionApi(env,'blocks/'+blockId,'PATCH',{callout})}catch(error){if(error.status!==404||!recover)throw error;await env.PROGRESS_DB.prepare('UPDATE notion_sync_pages SET block_id=NULL WHERE sync_key=?').bind(syncKey).run();return notionWrite(env,row,false)}}else{const added=await notionApi(env,'blocks/'+page.id+'/children','PATCH',{children:[{object:'block',type:'callout',callout}]});blockId=added.results?.[0]?.id;if(!blockId)throw Error('Notion report block was not confirmed')}
 await env.PROGRESS_DB.prepare('INSERT INTO notion_sync_pages(sync_key,page_id,block_id) VALUES(?,?,?) ON CONFLICT(sync_key) DO UPDATE SET page_id=excluded.page_id,block_id=excluded.block_id').bind(syncKey,page.id,blockId).run();
}
function notionPianoRow(learner,day,check){const who=learner==='emily'?'Emily':'Jason';return {id:learner+'|piano|'+day,properties:{Session:{title:[notionText(who+' · Piano · '+day)]},Child:{select:{name:who}},Area:{select:{name:'Piano'}},State:{select:{name:'Completed'}},Started:{date:{start:day}},Completed:{date:{start:day}},'Website updated':notionDate(check.at)},report:'Practice check-in date: '+day+'\n'+(check.at?'Check-in recorded at: '+check.at+'\n':'')+(Array.isArray(check.tasks)?'Recorded items: '+check.tasks.join(', '):'')+'\nDuration and musical proficiency are not inferred.'}}
async function notionSnapshotRows(env,learner){const current=await env.PROGRESS_DB.prepare('SELECT document FROM progress WHERE child = ?').bind(learner).first();if(!current)return [];const record=JSON.parse(current.document),who=learner==='emily'?'Emily':'Jason';let piano;try{piano=JSON.parse(record.data?.piano||'null')}catch{}
 for(const [day,check] of Object.entries(piano?.days||{})){if(!/^\d{4}-\d{2}-\d{2}$/.test(day))continue;await env.PROGRESS_DB.prepare('INSERT INTO notion_piano_state(learner,day,document) VALUES(?,?,?) ON CONFLICT(learner,day) DO UPDATE SET document=excluded.document WHERE document<>excluded.document').bind(learner,day,JSON.stringify(check)).run()}
 return [{id:learner+'|saved-progress',properties:{Session:{title:[notionText(who+' · Saved website progress')]},Child:{select:{name:who}},Area:{select:{name:'Saved progress'}},State:{select:{name:'Saved progress'}},'Website updated':notionDate(record.updatedAt)},report:'Saved progress overview. This is not a dated completed practice. Detailed sessions are created from recorded activity events; missing earlier events are not invented.\n\n'+JSON.stringify(record.data,null,2)}];
}

async function notionStatus(env){const pending=await env.PROGRESS_DB.prepare('SELECT COUNT(*) AS count FROM notion_sync_jobs').bind().first(),last=await env.PROGRESS_DB.prepare("SELECT value FROM github_archive_state WHERE key='last-notion-sync'").bind().first();return {configured:notionConfigured(env),pending:pending.count,lastSuccessfulSync:last?.value||null}}
async function flushNotion(env){if(!notionConfigured(env))return {...await notionStatus(env),state:'not-configured'};const db=env.PROGRESS_DB;if(notionBusy.has(db))return {...await notionStatus(env),state:'busy'};notionBusy.add(db);try{const jobs=(await db.prepare('SELECT * FROM notion_sync_jobs WHERE lease_until < ? ORDER BY updated_at LIMIT 3').bind(Date.now()).all()).results;for(const job of jobs){const owner=crypto.randomUUID();const claimed=await db.prepare('UPDATE notion_sync_jobs SET lock_owner=?,lease_until=? WHERE job_key=? AND lease_until < ?').bind(owner,Date.now()+120000,job.job_key,Date.now()).run();if(claimed.meta.changes!==1)continue;try{let rows;if(job.kind==='event'){const result=await db.prepare("SELECT document FROM learning_events WHERE learner = ? AND json_extract(document,'$.activity') = ? AND json_extract(document,'$.attemptId') = ? ORDER BY occurred_at,seq").bind(job.learner,job.activity,job.attempt).all();const row=notionSession(result.results.map(r=>JSON.parse(r.document)),job.learner,job.activity,job.attempt);rows=row?[row]:[]}else if(job.kind==='piano'){const saved=await db.prepare('SELECT document FROM notion_piano_state WHERE learner=? AND day=?').bind(job.learner,job.attempt).first();rows=saved?[notionPianoRow(job.learner,job.attempt,JSON.parse(saved.document))]:[]}else rows=await notionSnapshotRows(env,job.learner);for(const row of rows)await notionWrite(env,row);await db.prepare('DELETE FROM notion_sync_jobs WHERE job_key=? AND revision=? AND lock_owner=?').bind(job.job_key,job.revision,owner).run();await db.prepare("INSERT INTO github_archive_state(key,value) VALUES('last-notion-sync',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(new Date().toISOString()).run()}finally{await db.prepare('UPDATE notion_sync_jobs SET lock_owner=NULL,lease_until=0 WHERE job_key=? AND lock_owner=?').bind(job.job_key,owner).run()}}
 return {...await notionStatus(env),state:'ok'};}finally{notionBusy.delete(db)}}
function backgroundLearningSync(env,ctx){if(!ctx?.waitUntil)return;if(env.GITHUB_ARCHIVE_TOKEN)ctx.waitUntil(flushArchive(env).catch(()=>{}));if(notionConfigured(env))ctx.waitUntil(flushNotion(env).catch(()=>{}))}

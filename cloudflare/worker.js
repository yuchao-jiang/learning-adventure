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
export default { async fetch(request, env) {
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
   const kinds=['answer','check','hint','view','time','completion','start','import','restart','flag','reopen'];
   const valid=event=>isObject(event)&&event.version===1&&event.learner===child&&typeof event.id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(event.id)&&typeof event.activity==='string'&&event.activity.length>0&&event.activity.length<=100&&typeof event.questionId==='string'&&event.questionId.length<=150&&typeof event.attemptId==='string'&&event.attemptId.length<=150&&kinds.includes(event.type)&&typeof event.at==='string'&&Number.isFinite(Date.parse(event.at))&&isObject(event.question)&&isObject(event.data)&&new TextEncoder().encode(JSON.stringify(event)).length<=64000;
   if(!isObject(payload)||payload.historyVersion!==1||!Array.isArray(payload.events)||payload.events.length<1||payload.events.length>20||!payload.events.every(valid))return historyReply({error:'Invalid history batch'},400);
   const stable=value=>JSON.stringify(value,(_,item)=>isObject(item)?Object.fromEntries(Object.keys(item).sort().map(key=>[key,item[key]])):item);
   const accepted=[];
   for(const event of payload.events){
    const document=stable(event);
    const result=await env.PROGRESS_DB.prepare('INSERT INTO learning_events (event_id, learner, occurred_at, document) VALUES (?, ?, ?, ?) ON CONFLICT(event_id) DO NOTHING').bind(event.id,child,event.at,document).run();
    if(result.meta.changes!==1){const existing=await env.PROGRESS_DB.prepare('SELECT document FROM learning_events WHERE event_id = ?').bind(event.id).first();if(existing?.document!==document)return historyReply({error:'History event already exists with different content'},409)}
    accepted.push(event.id);
   }
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
  return reply({ ok: true, sha: revision });
 } catch {
  // Never return database details, saved answers, or credentials in error messages.
  return reply({ error: 'Private storage unavailable. Try again later.' }, 503);
 }
}};

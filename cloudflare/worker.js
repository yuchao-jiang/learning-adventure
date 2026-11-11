// Public learning pages; authenticated progress in a private D1 binding named PROGRESS_DB.
const STORAGE = 'private-d1-v1';
const MAX_BYTES = 100000;
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
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Family-Pin',
  'Cache-Control': 'no-store', 'Vary': 'Origin', 'X-Content-Type-Options': 'nosniff'
 };
 const reply = (body, status = 200, extra = {}) => new Response(JSON.stringify({ ...body, storage: STORAGE }), {
  status, headers: { ...headers, 'Content-Type': 'application/json', ...extra }
 });
 const origin = request.headers.get('Origin');
 if (origin && origin !== allowed) return reply({ error: 'Origin not allowed' }, 403);
 if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
 if (!['GET', 'POST'].includes(request.method)) return reply({ error: 'Method not allowed' }, 405);
 const child = new URL(request.url).searchParams.get('child');
 if (!['emily', 'jason'].includes(child)) return reply({ error: 'Unknown learner' }, 400);
 if (!env.PROGRESS_DB || typeof env.FAMILY_PASSPHRASE !== 'string' || env.FAMILY_PASSPHRASE.length < 16 || env.FAMILY_PASSPHRASE.length > 256) {
  return reply({ error: 'Private storage is not configured' }, 503);
 }
 try {
  // Hash client identifiers with the secret; never persist raw addresses or credentials.
  const bucket = Math.floor(Date.now() / 60000);
  const clientBytes = await digest(env.FAMILY_PASSPHRASE + ':' + (request.headers.get('CF-Connecting-IP') || 'unknown'));
  const client = Array.from(clientBytes, b => b.toString(16).padStart(2, '0')).join('');
  const attempts = await env.PROGRESS_DB.prepare('SELECT attempts FROM auth_attempts WHERE client = ? AND bucket = ?').bind(client, bucket).first();
  if (attempts?.attempts >= 5) return reply({ error: 'Too many attempts. Try again in a minute.' }, 429, { 'Retry-After': '60' });
  const passphrase = request.headers.get('X-Family-Pin') || '';
  if (passphrase.length > 256 || !await sameSecret(passphrase, env.FAMILY_PASSPHRASE)) {
   await env.PROGRESS_DB.prepare('INSERT INTO auth_attempts (client, bucket, attempts) VALUES (?, ?, 1) ON CONFLICT(client, bucket) DO UPDATE SET attempts = attempts + 1').bind(client, bucket).run();
   await env.PROGRESS_DB.prepare('DELETE FROM auth_attempts WHERE bucket < ?').bind(bucket - 1).run();
   return reply({ error: 'Incorrect family passphrase' }, 401);
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

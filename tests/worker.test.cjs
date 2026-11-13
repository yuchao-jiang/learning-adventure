const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const source = fs.readFileSync(path.join(__dirname, '../cloudflare/worker.js'), 'utf8');
const worker = import('data:text/javascript;base64,' + Buffer.from(source).toString('base64')).then(m => m.default);
const secret = 'test-family-passphrase-with-entropy';
function setup() {
 const sqlite = new DatabaseSync(':memory:');
 sqlite.exec(fs.readFileSync(path.join(__dirname, '../cloudflare/schema.sql'), 'utf8'));
 const queries = [];
 const env = { FAMILY_PASSPHRASE: secret, PROGRESS_DB: { prepare(sql) {
  queries.push(sql);
  return { bind(...args) { const statement = sqlite.prepare(sql); return {
   async first() { return statement.get(...args) ?? null; },
   async all() { return {results:statement.all(...args)}; },
   async run() { return { meta: { changes: statement.run(...args).changes } }; }
  }; } };
 } } };
 const send = async (method = 'GET', body, headers = {}, child = 'emily', route = '/') => (await worker).fetch(new Request('https://sync.test' + route.split('&')[0] + '?child=' + child + (route.includes('&')?'&'+route.split('&').slice(1).join('&'):''), {
  method, headers: { 'X-Family-Pin': secret, 'CF-Connecting-IP': '192.0.2.1', ...headers },
  ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) })
 }), env);
 return { sqlite, queries, env, send };
}
const payload = { version: 1, child: 'emily', sha: null, data: { raw: '🌻 A plant.' } };
test('GET and POST without credentials cannot read or write learner records, even with no Origin', async () => {
 for (const method of ['GET', 'POST']) {
  const app = setup();
  const response = await app.send(method, method === 'POST' ? payload : undefined, { 'X-Family-Pin': '' });
  assert.equal(response.status, 401);
  assert.equal(app.queries.some(q => /\b(?:FROM|INTO|UPDATE) progress\b/.test(q)), false);
  assert.equal((await response.json()).data, undefined);
 }
});
test('wrong credentials are rejected with an allowed Origin too', async () => {
 const app = setup();
 assert.equal((await app.send('GET', undefined, { 'X-Family-Pin': 'wrong', Origin: 'https://yuchao-jiang.github.io' })).status, 401);
 assert.equal(app.sqlite.prepare('SELECT count(*) n FROM progress').get().n, 0);
});
test('missing database or a short PIN fails closed', async () => {
 const app = setup();
 app.env.FAMILY_PASSPHRASE = '1234';
 assert.equal((await app.send()).status, 503);
 app.env.FAMILY_PASSPHRASE = secret;
 delete app.env.PROGRESS_DB;
 assert.equal((await app.send()).status, 503);
 assert.equal(app.queries.length, 0);
});
test('CORS preflight exposes no data and incorrect origins are blocked', async () => {
 const app = setup();
 assert.equal((await app.send('OPTIONS')).status, 204);
 assert.equal((await app.send('GET', undefined, { Origin: 'https://other.test' })).status, 403);
 assert.equal(app.queries.length, 0);
});
test('private saves round trip Unicode without making any GitHub calls', async () => {
 const app = setup();
 const previous = global.fetch;
 global.fetch = () => { throw Error('Worker must not use public GitHub storage'); };
 try {
  const result = await app.send('POST', payload);
  assert.equal(result.status, 200);
  const saved = await result.json();
  assert.equal(saved.storage, 'private-d1-v1');
  const loaded = await app.send();
  assert.equal(loaded.headers.get('Cache-Control'), 'no-store');
  const body = await loaded.json();
  assert.equal(body.data.data.raw, payload.data.raw);
  assert.equal(body.sha, saved.sha);
  assert.equal((await (await app.send('GET', undefined, {}, 'jason')).json()).exists, false);
 } finally { global.fetch = previous; }
});
test('stale updates and simultaneous first saves cannot overwrite a private record', async () => {
 const app = setup();
 const first = await app.send('POST', payload);
 const revision = (await first.json()).sha;
 const updates = await Promise.all([app.send('POST', { ...payload, sha: revision }), app.send('POST', { ...payload, sha: revision })]);
 assert.deepEqual(updates.map(r => r.status).sort(), [200, 409]);
 assert.equal((await app.send('POST', payload)).status, 409);
 assert.equal(app.sqlite.prepare('SELECT count(*) n FROM progress').get().n, 1);
});
test('five failed attempts rate limit subsequent attempts, without storing raw addresses', async () => {
 const app = setup();
 for (let i = 0; i < 5; i++) assert.equal((await app.send('GET', undefined, { 'X-Family-Pin': 'wrong' })).status, 401);
 const response = await app.send();
 assert.equal(response.status, 429);
 assert.equal(response.headers.get('Retry-After'), '60');
 const row = app.sqlite.prepare('SELECT * FROM auth_attempts').get();
 assert.equal(row.attempts, 5);
 assert.equal(row.client.length, 64);
 assert.doesNotMatch(JSON.stringify(row), /192\.0\.2\.1|test-family/);
});
test('expired login failures are purged', async () => {
 const app = setup();
 app.sqlite.prepare('INSERT INTO auth_attempts VALUES (?, ?, ?)').run('old-hash', 1, 5);
 await app.send('GET', undefined, { 'X-Family-Pin': 'wrong' });
 assert.equal(app.sqlite.prepare('SELECT count(*) n FROM auth_attempts WHERE bucket = 1').get().n, 0);
});
test('invalid documents and oversized UTF-8 bodies never create learner records', async () => {
 const app = setup();
 for (const bad of ['{', { ...payload, child: 'jason' }, { ...payload, data: [] }, { ...payload, sha: 4 }]) {
  assert.equal((await app.send('POST', bad)).status, 400);
 }
 assert.equal((await app.send('POST', { ...payload, data: { raw: '🌻'.repeat(26000) } })).status, 413);
 assert.equal(app.sqlite.prepare('SELECT count(*) n FROM progress').get().n, 0);
});
test('database errors return no internal SQL or records', async () => {
 const app = setup();
 app.env.PROGRESS_DB.prepare = () => { throw Error('private database secret details'); };
 const response = await app.send();
 assert.equal(response.status, 503);
 assert.doesNotMatch(await response.text(), /secret details/);
});

test('remembered tokens last 30 days; D1 stores only their secret-bound hashes', async () => {
 const app = setup(), before = Date.now();
 const response = await app.send('POST', { remember: true }, {}, 'emily', '/session');
 assert.equal(response.status, 200);
 const session = await response.json();
 assert.match(session.token, /^[a-f0-9]{64}$/);
 assert.ok(session.expiresAt - before >= 30 * 86400000);
 assert.ok(session.expiresAt - before < 30 * 86400000 + 2000);
 const row = app.sqlite.prepare('SELECT * FROM device_sessions').get();
 assert.notEqual(row.token_hash, session.token);
 assert.equal(row.expires_at, session.expiresAt);
 for (const child of ['emily', 'jason']) {
  assert.equal((await app.send('GET', undefined, { 'X-Family-Pin': '', Authorization: 'Bearer ' + session.token }, child)).status, 200);
 }
 const saved = await app.send('POST', payload, { 'X-Family-Pin': '', Authorization: 'Bearer ' + session.token });
 assert.equal(saved.status, 200);
});
test('temporary tokens expire after 12 hours; expired and invented tokens are rejected', async () => {
 const app = setup();
 const session = await (await app.send('POST', { remember: false }, {}, 'emily', '/session')).json();
 assert.ok(session.expiresAt - Date.now() <= 12 * 3600000);
 app.sqlite.prepare('UPDATE device_sessions SET expires_at = 0').run();
 assert.equal((await app.send('GET', undefined, { Authorization: 'Bearer ' + session.token })).status, 401);
 assert.equal((await app.send('GET', undefined, { Authorization: 'Bearer ' + 'a'.repeat(64) })).status, 401);
});
test('locking one device revokes only that token; a parent can revoke all devices', async () => {
 const app = setup();
 const login = async () => (await app.send('POST', { remember: true }, {}, 'emily', '/session')).json();
 const a = await login(), b = await login();
 assert.notEqual(a.token, b.token);
 assert.equal((await app.send('DELETE', undefined, { Authorization: 'Bearer ' + a.token }, 'emily', '/session')).status, 200);
 assert.equal((await app.send('GET', undefined, { Authorization: 'Bearer ' + a.token })).status, 401);
 assert.equal((await app.send('GET', undefined, { Authorization: 'Bearer ' + b.token })).status, 200);
 assert.equal((await app.send('DELETE', undefined, { Authorization: 'Bearer ' + b.token }, 'emily', '/sessions')).status, 401);
 assert.equal((await app.send('DELETE', undefined, {}, 'emily', '/sessions')).status, 200);
 assert.equal((await app.send('GET', undefined, { Authorization: 'Bearer ' + b.token })).status, 401);
});
test('rotating the parent passphrase invalidates all old tokens', async () => {
 const app = setup();
 const session = await (await app.send('POST', { remember: true }, {}, 'emily', '/session')).json();
 app.env.FAMILY_PASSPHRASE = 'replacement-parent-passphrase';
 assert.equal((await app.send('GET', undefined, { Authorization: 'Bearer ' + session.token })).status, 401);
});
test('login requires a parent passphrase and explicit remember choice', async () => {
 const app = setup();
 assert.equal((await app.send('POST', { remember: true }, { 'X-Family-Pin': '' }, 'emily', '/session')).status, 401);
 assert.equal((await app.send('POST', { remember: 'true' }, {}, 'emily', '/session')).status, 400);
 assert.equal(app.sqlite.prepare('SELECT count(*) n FROM device_sessions').get().n, 0);
});

const historyEvent=(id,learner='jason')=>({version:1,id,learner,activity:'maths',questionId:'12',attemptId:'practice-1',type:'answer',at:'2026-11-13T10:00:00Z',question:{prompt:'Test question',skill:'Reasoning'},data:{answer:1,correct:false}});
test('learning history requires authentication on reads and writes',async()=>{
 const app=setup();for(const method of ['GET','POST'])assert.equal((await app.send(method,method==='POST'?{historyVersion:1,events:[historyEvent('a')]}:undefined,{'X-Family-Pin':''},'jason','/learning-history')).status,401);
 assert.equal(app.sqlite.prepare('SELECT count(*) n FROM learning_events').get().n,0);
});
test('learning events append privately, retry idempotently, and cannot overwrite earlier answers',async()=>{
 const app=setup();const post=events=>app.send('POST',{historyVersion:1,events},{},'jason','/learning-history');
 const first=historyEvent('answer-1'),changed={...historyEvent('answer-2'),data:{answer:2,correct:true}};
 assert.equal((await post([first,changed])).status,200);assert.equal((await post([first])).status,200);
 assert.equal((await post([{...first,data:{answer:4}}])).status,409);
 const response=await (await app.send('GET',undefined,{},'jason','/learning-history')).json();assert.deepEqual(response.events,[first,changed]);assert.equal(response.historyVersion,1);
 assert.equal((await (await app.send('GET',undefined,{},'emily','/learning-history')).json()).events.length,0);
 assert.equal(app.sqlite.prepare('SELECT count(*) n FROM progress').get().n,0);
 assert.equal((await post([historyEvent('foreign','emily')])).status,400);
 assert.equal((await post(Array.from({length:21},(_,i)=>historyEvent('x'+i)))).status,400);
});
test('learning history pagination does not skip records and rejects invalid cursors',async()=>{
 const app=setup();const insert=app.sqlite.prepare('INSERT INTO learning_events(event_id,learner,occurred_at,document) VALUES(?,?,?,?)');for(let i=0;i<102;i++){const e=historyEvent('page-'+i);insert.run(e.id,'jason',e.at,JSON.stringify(e))}
 const page=await (await app.send('GET',undefined,{},'jason','/learning-history')).json();assert.equal(page.events.length,100);assert.equal(page.hasMore,true);
 const last=await (await app.send('GET',undefined,{},'jason','/learning-history&after='+page.nextCursor)).json();assert.equal(last.events.length,2);assert.equal(last.hasMore,false);
 assert.equal((await app.send('GET',undefined,{},'jason','/learning-history&after=-1')).status,400);
});

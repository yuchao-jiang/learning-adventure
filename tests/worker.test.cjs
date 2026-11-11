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
   async run() { return { meta: { changes: statement.run(...args).changes } }; }
  }; } };
 } } };
 const send = async (method = 'GET', body, headers = {}, child = 'emily') => (await worker).fetch(new Request('https://sync.test/?child=' + child, {
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

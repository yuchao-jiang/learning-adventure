const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../cloudflare/worker.js'), 'utf8');
const worker = import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const env = { FAMILY_PIN: '1234', GITHUB_TOKEN: 'test-token' };
const request = (method = 'GET', body, headers = {}) => new Request('https://sync.test?child=emily', {
  method, headers: { Origin: 'https://yuchao-jiang.github.io', ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
const payload = { version: 1, child: 'emily', sha: 'old', data: { raw: '🌻 Emily’s answers' } };
async function withFetch(mock, run) {
  const previous = global.fetch; global.fetch = mock;
  try { return await run((await worker).default); } finally { global.fetch = previous; }
}
test('Worker rejects wrong origins and PINs before calling GitHub', async () => {
  await withFetch(() => { throw Error('Unexpected GitHub call'); }, async worker => {
    assert.equal((await worker.fetch(request('GET', undefined, { Origin: 'https://other.test' }), env)).status, 403);
    assert.equal((await worker.fetch(request('POST', payload, { 'X-Family-Pin': 'wrong' }), env)).status, 401);
    assert.equal((await worker.fetch(request('OPTIONS'), env)).status, 204);
  });
});
test('Worker refuses stale writes and leaves GitHub unchanged', async () => {
  let calls = 0;
  await withFetch(async () => { calls++; return Response.json({ sha: 'newer' }); }, async worker => {
    const response = await worker.fetch(request('POST', payload, { 'X-Family-Pin': '1234' }), env);
    assert.equal(response.status, 409); assert.equal(calls, 1);
  });
});
test('Worker saves Unicode progress with a matching version SHA', async () => {
  let written;
  await withFetch(async (url, options) => {
    if (options.method === 'PUT') { written = JSON.parse(options.body); return Response.json({ content: { sha: 'new' } }); }
    return Response.json({ sha: 'old' });
  }, async worker => {
    const response = await worker.fetch(request('POST', payload, { 'X-Family-Pin': '1234' }), env);
    assert.equal(response.status, 200);
    assert.equal(written.sha, 'old');
    assert.equal(JSON.parse(Buffer.from(written.content, 'base64').toString()).data.raw, payload.data.raw);
  });
});
test('Worker loads Unicode saves and reports malformed upstream data', async () => {
  for (const content of [Buffer.from(JSON.stringify(payload)).toString('base64'), 'not-json']) {
    await withFetch(async () => Response.json({ sha: 'old', content }), async worker => {
      const response = await worker.fetch(request(), env);
      assert.equal(response.status, content === 'not-json' ? 502 : 200);
      if (response.ok) assert.equal((await response.json()).data.data.raw, payload.data.raw);
    });
  }
});

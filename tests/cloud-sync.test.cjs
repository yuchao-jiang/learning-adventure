const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../cloud-sync.js'), 'utf8');
function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, String(v)),
    removeItem: k => values.delete(k), key: i => [...values.keys()][i], get length() { return values.size; } };
}
async function setup(child, local, remote) {
  const localStorage = storage(local), sessionStorage = storage({ 'adventure-family-pin-session': '1234' });
  let reloads = 0; const writes = [];
  const element = () => ({ style: {}, append() {}, setAttribute() {}, addEventListener() {} });
  const window = { ADVENTURE_SYNC_URL: 'https://sync.test', addEventListener() {} };
  const context = { window, localStorage, sessionStorage, document: { body: { dataset: { learner: child } },
    createElement: element, getElementById: element }, location: { reload() { reloads++; } },
    setTimeout, clearTimeout, prompt: () => '1234', fetch: async (url, options) => {
      if (options.method === 'POST') { writes.push(JSON.parse(options.body)); return { ok: true, json: async () => ({ sha: 'new' }) }; }
      return { ok: true, json: async () => ({ exists: true, sha: 'old', data: { data: remote } }) };
    } };
  vm.runInNewContext(source, context);
  await window.adventureCloudLoad();
  return { localStorage, window, writes, reloads: () => reloads };
}
test('remote Jason drafts cannot overwrite locally submitted answers', async () => {
  const app = await setup('jason', { 'jason-reading-v1': JSON.stringify({ '1-1': { answer: 'B' }, _submitted: { 1: { correct: 1 } } }) },
    { answers: JSON.stringify({ '1-1': { answer: 'A' } }), notes: {} });
  assert.equal(JSON.parse(app.localStorage.getItem('jason-reading-v1'))['1-1'].answer, 'B');
  await app.window.adventureCloudSave();
  assert.equal(JSON.parse(app.writes[0].data.answers)['1-1'].answer, 'B');
  assert.equal(app.writes[0].sha, 'old');
});
test('remote submissions restore answers, merge history, and trigger no reload once stable', async () => {
  const event = { type: 'save', at: '2026-11-01' };
  const app = await setup('jason', { 'jason-reading-v1': JSON.stringify({ _history: { 1: [event] } }) },
    { answers: JSON.stringify({ '1-1': { answer: 'A' }, _submitted: { 1: { correct: 1 } }, _history: { 1: [event] } }), notes: {} });
  const saved = JSON.parse(app.localStorage.getItem('jason-reading-v1'));
  assert.equal(saved['1-1'].answer, 'A');
  assert.equal(saved._history[1].length, 1);
  const before = app.reloads();
  await app.window.adventureCloudLoad();
  assert.equal(app.reloads(), before);
});
test('Emily saves the exact progress key and preserves completed answers', async () => {
  const app = await setup('emily', { 'emily-other-v2': 'unrelated', 'emily-adventure-v2': JSON.stringify({ version: 2, answers: { e1: { value: 1, checked: true } } }) },
    { raw: JSON.stringify({ version: 2, answers: { e1: { value: 0, checked: false }, e2: { value: 0, checked: true } } }) });
  await app.window.adventureCloudSave();
  const saved = JSON.parse(app.writes[0].data.raw);
  assert.equal(saved.answers.e1.value, 1);
  assert.equal(saved.answers.e2.checked, true);
  assert.equal(app.writes[0].data.storageKey, 'emily-adventure-v2');
});

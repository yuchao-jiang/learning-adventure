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
const sessionKey = 'adventure-cloud-session-v1', deviceKey = 'adventure-cloud-device-v1';
const token = 'a'.repeat(64);
async function setup(child, local, remote, options = {}) {
  const localStorage = options.localStorage || storage(local);
  const sessionStorage = options.sessionStorage || storage(options.locked ? {} : { [sessionKey]: JSON.stringify({ token, expiresAt: Date.now() + 100000, endpoint: 'https://sync.test' }) });
  let reloads = 0; const writes = [], requests = [], scheduled=[],events={};
  const element = () => {
    const listeners = {}, password = { value: 'test-family-passphrase' }, remember = { checked: !!options.remember };
    return { style: {}, append() {}, setAttribute() {}, remove() {},
      addEventListener(name, callback) { listeners[name] = callback; },
      querySelector(selector) { return selector.includes('passphrase') ? password : remember; },
      showModal() { this.returnValue = options.cancel ? 'cancel' : 'unlock'; listeners.close(); }
    };
  };
  const window = { ADVENTURE_SYNC_URL: options.url || 'https://sync.test', addEventListener(name,callback) { events[name]=callback; } };
  const context = { AdventureMaths: require('../maths-progress.js'), window, localStorage, sessionStorage, document: { body: { dataset: { learner: child, activity: options.mathsPage?'maths':'' }, append() {} },
    createElement: element, getElementById: element,addEventListener(name,callback){events[name]=callback},visibilityState:'visible' }, location: { reload() { reloads++; } },
    setTimeout:(fn)=>{scheduled.push(fn);return scheduled.length},clearTimeout(){},setInterval(){}, fetch: async (url, fetchOptions) => {
      requests.push({ url, method: fetchOptions.method, headers: fetchOptions.headers });
      if(options.offline)throw Error('Offline');
      if(options.unauthorized)return {ok:false,status:401,json:async()=>({storage:'private-d1-v1',error:'Cloud session expired'})};
      if(url.endsWith('/session') || url.endsWith('/sessions'))return {ok:true,json:async()=>({storage:'private-d1-v1',token,expiresAt:Date.now()+30*86400000})};
      if (fetchOptions.method === 'POST') { writes.push(JSON.parse(fetchOptions.body)); return { ok: true, json: async () => ({ sha: 'new', storage: 'private-d1-v1' }) }; }
      return { ok: true, json: async () => ({ exists: true, sha: 'old', data: { data: remote }, ...(options.legacy ? {} : { storage: 'private-d1-v1' }) }) };
    } };
  vm.runInNewContext(source, context);
  if (!options.locked) await window.adventureCloudLoad();
  return { localStorage, sessionStorage, window, writes, requests,events,scheduled, reloads: () => reloads };
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

test('locked pages make no automatic cloud requests; unlock authenticates reads', async () => {
 const app = await setup('jason', {}, { answers: '{}', notes: {} }, { locked: true });
 assert.equal(app.requests.length, 0);
 await app.window.adventureCloudLoad();
 assert.equal(app.requests.length, 2);
 assert.equal(app.requests[0].headers['X-Family-Pin'], 'test-family-passphrase');
 assert.equal(app.requests[1].headers.Authorization, 'Bearer ' + token);
 await app.window.adventureCloudLock();
 assert.equal(app.sessionStorage.getItem(sessionKey), null);
});
test('cancelling unlock never reads or writes cloud progress', async () => {
 const app = await setup('emily', {}, {}, { locked: true, cancel: true });
 await app.window.adventureCloudLoad();
 assert.equal(await app.window.adventureCloudSave(), false);
 assert.equal(app.requests.length, 0);
});
test('legacy public endpoints are refused and cannot receive a new save', async () => {
 const app = await setup('jason', {}, { answers: '{}', notes: {} }, { legacy: true });
 assert.equal(await app.window.adventureCloudSave(), false);
 assert.equal(app.writes.length, 0);
});
test('all read and write requests include credentials', async () => {
 const app = await setup('jason', {}, { answers: '{}', notes: {} });
 assert.equal(await app.window.adventureCloudSave(), true);
 assert.ok(app.requests.some(r => r.method === 'POST'));
 assert.ok(app.requests.every(r => r.headers.Authorization === 'Bearer ' + token));
});

test('failed authentication clears the tab credential and preserves local work', async () => {
 const app = await setup('jason', { 'jason-reading-v1': '{"draft":"keep"}' }, {}, { unauthorized: true });
 assert.equal(app.sessionStorage.getItem(sessionKey), null);
 assert.equal(app.localStorage.getItem('jason-reading-v1'), '{"draft":"keep"}');
 assert.equal(app.writes.length, 0);
});
test('insecure HTTP endpoints cannot receive credentials or progress', async () => {
 const app = await setup('jason', {}, {}, { url: 'http://sync.test' });
 await app.window.adventureCloudLoad();
 assert.equal(await app.window.adventureCloudSave(), false);
 assert.equal(app.requests.length, 0);
});

test('remembered devices unlock automatically in a new tab without keeping the passphrase', async () => {
 const first = await setup('jason', {}, { answers: '{}', notes: {} }, { locked: true, remember: true });
 await first.window.adventureCloudLoad();
 const saved = first.localStorage.getItem(deviceKey);
 assert.equal(JSON.parse(saved).token, token);
 assert.doesNotMatch(saved, /test-family-passphrase/);
 assert.equal(first.sessionStorage.getItem(sessionKey), null);
 const next = await setup('emily', {}, { raw: '{"version":2,"answers":{}}' }, { localStorage: first.localStorage, sessionStorage: storage() });
 assert.ok(next.requests.length > 0);
 assert.ok(next.requests.every(r => !r.headers['X-Family-Pin']));
});
test('unchecked remember stays in the tab; expired device tokens are not sent', async () => {
 const app = await setup('jason', {}, { answers: '{}', notes: {} }, { locked: true });
 await app.window.adventureCloudLoad();
 assert.equal(app.localStorage.getItem(deviceKey), null);
 assert.ok(app.sessionStorage.getItem(sessionKey));
 const old = storage({ [deviceKey]: JSON.stringify({ token, expiresAt: 0, endpoint: 'https://sync.test' }) });
 const expired = await setup('jason', {}, {}, { locked: true, localStorage: old });
 assert.equal(expired.requests.length, 0);
 assert.equal(old.getItem(deviceKey), null);
});
test('locking a remembered device removes the token and revokes it on the server', async () => {
 const app = await setup('jason', {}, { answers: '{}', notes: {} }, { locked: true, remember: true });
 await app.window.adventureCloudLoad();
 await app.window.adventureCloudLock();
 assert.equal(app.localStorage.getItem(deviceKey), null);
 assert.ok(app.requests.some(r => r.url.endsWith('/session') && r.method === 'DELETE' && r.headers.Authorization));
});
test('forget all devices reauthenticates the parent without persisting the passphrase', async () => {
 const app = await setup('jason', {}, { answers: '{}', notes: {} });
 await app.window.adventureCloudForgetAll();
 const request = app.requests.find(r => r.url.endsWith('/sessions'));
 assert.equal(request.method, 'DELETE');
 assert.equal(request.headers['X-Family-Pin'], 'test-family-passphrase');
 assert.equal(app.sessionStorage.getItem(sessionKey), null);
});

test('reading-page saves preserve maths answers that exist only in the cloud', async () => {
 const maths={history:[],session:{id:'cloud-attempt',startedAt:100,updatedAt:101,week:1,ids:[0],phase:'solve',answers:{0:2},first:null,flagged:{},deadline:Date.now()+600000}};
 const app=await setup('jason', {}, {answers:'{}',notes:{},maths:JSON.stringify(maths)});
 await app.window.adventureCloudSave();
 const saved=JSON.parse(app.writes[0].data.maths);
 assert.equal(saved.session.answers[0],2);
 assert.equal(saved.session.id,'cloud-attempt');
});
test('old reading-only cloud records keep local maths progress when saving', async () => {
 const maths={history:[],session:{id:'device-attempt',startedAt:100,updatedAt:101,week:1,ids:[0],phase:'solve',answers:{0:3},first:null,flagged:{},deadline:Date.now()+600000}};
 const app=await setup('jason', {'jason-maths-two-weeks-v1':JSON.stringify(maths)}, {answers:'{}',notes:{}});
 await app.window.adventureCloudSave();
 assert.equal(JSON.parse(app.writes[0].data.maths).session.answers[0],3);
});

const waitSync=async()=>{for(let i=0;i<30;i++)await new Promise(resolve=>setImmediate(resolve))};
const mathsRecord=()=>JSON.stringify({history:[],session:{id:'auto-attempt',startedAt:100,updatedAt:101,week:1,ids:[0],phase:'solve',answers:{0:2},first:null,flagged:{},deadline:9999999999999}});
test('maths automatically uploads existing local work on opening without a Save button',async()=>{
 const app=await setup('jason',{'jason-maths-two-weeks-v1':mathsRecord()},{answers:'{}',notes:{}},{mathsPage:true});
 await waitSync();assert.ok(app.writes.length>0);assert.equal(JSON.parse(app.writes.at(-1).data.maths).session.answers[0],2);
});
test('maths retries saved offline work when online again and reloads on focus',async()=>{
 const options={mathsPage:true,offline:true};
 const app=await setup('jason',{'jason-maths-two-weeks-v1':mathsRecord()},{answers:'{}',notes:{}},options);
 await waitSync();assert.equal(app.writes.length,0);
 options.offline=false;await app.events.online();await waitSync();assert.ok(app.writes.length>0);
 const before=app.requests.length;await app.events.focus();await waitSync();assert.ok(app.requests.length>before);
});
test('locked maths pages never silently log in or upload work',async()=>{
 const app=await setup('jason',{'jason-maths-two-weeks-v1':mathsRecord()},{answers:'{}',notes:{}},{mathsPage:true,locked:true});
 await waitSync();await app.events.online();await waitSync();assert.equal(app.requests.length,0);
});

test('child maths cannot open a parent login through its load action',async()=>{
 const app=await setup('jason',{}, {answers:'{}',notes:{}},{mathsPage:true,locked:true});
 await app.window.adventureCloudLoad();await waitSync();
 assert.equal(app.requests.length,0);
});

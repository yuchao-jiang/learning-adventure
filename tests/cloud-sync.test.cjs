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
  let reloads = 0; const writes = [], requests = [], scheduled=[],events={},created=[],reloadPositions=[];
  const element = () => {
    const listeners = {}, password = { value: 'test-family-passphrase' }, remember = { checked: !!options.remember };
    const item={ style: {}, append() {}, setAttribute(name,value) {this[name]=value}, remove() {},
      addEventListener(name, callback) { listeners[name] = callback; },
      querySelector(selector) { return selector.includes('passphrase') ? password : remember; },
      showModal() { this.returnValue = options.cancel ? 'cancel' : 'unlock'; listeners.close(); }
    };created.push(item);return item;
  };
  const window = {dispatchEvent(){},...(options.firstPractice?{EmilyPractice:require('../emily-practice.js')}:{}), ADVENTURE_SYNC_URL: options.url || 'https://sync.test', addEventListener(name,callback) { events[name]=callback; } };
  const context = {Event, AdventureMaths: require('../maths-progress.js'), window, localStorage, sessionStorage, document: { body: { dataset: { learner: child, activity: options.mathsPage?'maths':'' }, append() {} },
    createElement: element, getElementById: id=>created.find(item=>item.id===id)||element(),addEventListener(name,callback){events[name]=callback},visibilityState:'visible' }, location: { reload() { reloads++;reloadPositions.push(writes.length); } },
    setTimeout:(fn)=>{scheduled.push(fn);return scheduled.length},clearTimeout(){},setInterval(){}, fetch: async (url, fetchOptions) => {
      requests.push({ url, method: fetchOptions.method, headers: fetchOptions.headers });
      if(options.offline)throw Error('Offline');
      if(options.unauthorized)return {ok:false,status:401,json:async()=>({storage:'private-d1-v1',error:'Cloud session expired'})};
      if(url.endsWith('/session') || url.endsWith('/sessions'))return {ok:true,json:async()=>({storage:'private-d1-v1',token,expiresAt:Date.now()+30*86400000})};
      if (fetchOptions.method === 'POST') { if(options.conflictOnce){options.conflictOnce=false;return {ok:false,status:409,json:async()=>({storage:'private-d1-v1',error:'Newer save found'})}}const payload=JSON.parse(fetchOptions.body);writes.push(payload);if(options.liveRemote)remote=payload.data; return { ok: true, json: async () => ({ sha: 'new', storage: 'private-d1-v1' }) }; }
      return { ok: true, json: async () => ({ exists: true, sha: 'old', data: { data: remote }, ...(options.legacy ? {} : { storage: 'private-d1-v1' }) }) };
    } };
  vm.runInNewContext(source, context);
  if (!options.locked) await window.adventureCloudLoad();
  return { localStorage, sessionStorage, window, writes, requests,events,scheduled, reloads: () => reloads,reloadPositions,document:context.document,status:()=>created.find(item=>item.id==='cloud-sync-status') };
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

test('Rainbow Rescue progress joins Emily private snapshot and survives cross-device restore',async()=>{
 const rainbow=JSON.stringify({step:1,solved:[true],hints:[true],attemptId:'rescue',updatedAt:10});
 const app=await setup('emily',{}, {raw:null,rainbow});assert.equal(JSON.parse(app.localStorage.getItem('emily-rainbow-v1')).solved[0],true);
 await app.window.adventureCloudSave();assert.equal(JSON.parse(app.writes.at(-1).data.rainbow).attemptId,'rescue');
});
test('a new Rainbow attempt does not erase the saved newer attempt',async()=>{
 const current=JSON.stringify({step:0,solved:[],attemptId:'new',updatedAt:20});const old=JSON.stringify({step:6,solved:[true,true,true,true,true,true],attemptId:'old',updatedAt:10});
 const app=await setup('emily',{'emily-rainbow-v1':current},{raw:null,rainbow:old});await app.window.adventureCloudSave();assert.equal(JSON.parse(app.writes.at(-1).data.rainbow).attemptId,'new');assert.equal(JSON.parse(app.writes.at(-1).data.rainbow).step,0);
});

test('Emily deliberately reopened answers retain newer revisions across cloud saves',async()=>{
 const raw=JSON.stringify({version:2,answers:{'e-1':{value:1,checked:false,hint:false,updatedAt:20}}});
 const remote=JSON.stringify({version:2,answers:{'e-1':{value:0,checked:true,hint:false,updatedAt:10}}});
 const app=await setup('emily',{'emily-adventure-v2':raw},{raw:remote});await app.window.adventureCloudSave();assert.equal(JSON.parse(app.writes.at(-1).data.raw).answers['e-1'].value,1);assert.equal(JSON.parse(app.writes.at(-1).data.raw).answers['e-1'].checked,false);
});

test('learning-page saves retain piano data and other private snapshot extensions for Emily',async()=>{const piano=JSON.stringify({version:1,days:{'2026-11-01':{at:'2026-11-01T10:00:00Z',tasks:['piece']}}});const app=await setup('emily',{}, {raw:JSON.stringify({version:2,answers:{}}),piano,extraPrivateField:'retain'});await app.window.adventureCloudSave();assert.equal(app.writes.at(-1).data.piano,piano);assert.equal(app.writes.at(-1).data.extraPrivateField,'retain')});
test('Jason reading saves preserve piano data that exists only in private cloud',async()=>{const piano='{"version":1,"days":{}}';const app=await setup('jason',{}, {answers:'{}',piano});await app.window.adventureCloudSave();assert.equal(app.writes.at(-1).data.piano,piano)});


const completedSet2=()=>{const record=JSON.parse(mathsRecord());record.session={...record.session,id:'completed-set-2',ids:[16,17,18,19,20],phase:'done',answers:{16:2,17:0,18:1,19:4,20:3},first:{16:2,17:0,18:1,19:4,20:3}};record.history=[{id:'completed-set-2',week:1,total:5,first:5,checked:5,at:'2026-11-16T10:00:00Z',ids:[16,17,18,19,20],answers:record.session.answers,firstAnswers:record.session.first}];return JSON.stringify(record)};
test('opening Jason roadmap recovers completed Set 2 before reloading its display',async()=>{const app=await setup('jason',{'jason-maths-two-weeks-v1':completedSet2()},{answers:'{}',notes:{},piano:'keep-piano'},{liveRemote:true});await waitSync();assert.equal(app.writes.length,1);assert.equal(JSON.parse(app.writes[0].data.maths).session.id,'completed-set-2');assert.equal(app.writes[0].data.piano,'keep-piano');assert(app.reloadPositions.every(writes=>writes>0));});
test('a second maths device restores all Set 2 answers from the recovered cloud snapshot',async()=>{const source=await setup('jason',{'jason-maths-two-weeks-v1':completedSet2()},{answers:'{}',notes:{}},{liveRemote:true});await waitSync();const receiver=await setup('jason',{},source.writes.at(-1).data,{mathsPage:true,liveRemote:true});await waitSync();const restored=JSON.parse(receiver.localStorage.getItem('jason-maths-two-weeks-v1'));assert.equal(restored.session.phase,'done');assert.equal(restored.session.answers[20],3);assert.equal(restored.history[0].checked,5);assert.equal(receiver.status().textContent,'Saved ✓');});
test('urgent completion sync starts without waiting for the debounce timer',async()=>{const app=await setup('jason',{}, {answers:'{}',notes:{}},{mathsPage:true,liveRemote:true});await waitSync();app.localStorage.setItem('jason-maths-two-weeks-v1',completedSet2());app.events['adventure-maths-changed']({urgent:true});await waitSync();assert.equal(app.writes.length,1);assert.equal(JSON.parse(app.writes[0].data.maths).session.phase,'done');});
test('hiding a maths page immediately attempts to upload pending local work',async()=>{const app=await setup('jason',{}, {answers:'{}',notes:{}},{mathsPage:true,liveRemote:true});await waitSync();app.localStorage.setItem('jason-maths-two-weeks-v1',completedSet2());app.document.visibilityState='hidden';await app.events.visibilitychange();await waitSync();assert.equal(app.writes.length,1);});
test('a conflicting revision is fetched and retried rather than reported as saved',async()=>{const app=await setup('jason',{'jason-maths-two-weeks-v1':completedSet2()},{answers:'{}',notes:{},piano:'retain'},{mathsPage:true,conflictOnce:true,liveRemote:true});await waitSync();assert.equal(app.requests.filter(request=>request.method==='POST').length,2);assert.equal(app.writes.length,1);assert.equal(app.writes[0].data.piano,'retain');assert.equal(app.status().textContent,'Saved ✓');});
test('locked, failed and confirmed maths sync have distinct truthful statuses',async()=>{const locked=await setup('jason',{}, {},{mathsPage:true,locked:true});await waitSync();assert.equal(locked.status().textContent,'Saved here · Cloud locked');const failed=await setup('jason',{}, {},{mathsPage:true,offline:true});await waitSync();assert.equal(failed.status().textContent,'Saved here · Waiting to sync');assert.notEqual(failed.status()['data-sync-state'],'synced');});


test('Emily first-wrong evidence survives corrected progress and cloud merges',async()=>{const M=require('../emily-practice.js');const first={eventId:'wrong-first',at:'2026-11-16T10:00:00Z',activity:'worksheet-maths',questionId:'m1',answer:0,correct:false,question:{skill:'Addition',prompt:'3 + 4?',options:['6','7'],correctIndex:1}};const remote={...first,eventId:'later-correct',at:'2026-11-16T11:00:00Z',answer:1,correct:true};const app=await setup('emily',{[M.KEY]:JSON.stringify({version:1,records:{'worksheet-maths|m1':first}})},{raw:JSON.stringify({version:2,answers:{m1:{value:1,checked:true}}}),firstAttempts:JSON.stringify({version:1,records:{'worksheet-maths|m1':remote}})},{firstPractice:true});await app.window.adventureCloudSave();const saved=JSON.parse(app.writes.at(-1).data.firstAttempts);assert.equal(M.mistakes(saved).length,1);assert.equal(saved.records['worksheet-maths|m1'].answer,0);});

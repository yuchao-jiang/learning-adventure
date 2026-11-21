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
test('parent observations append privately without modifying answers and require valid note content',async()=>{const app=setup();const post=events=>app.send('POST',{historyVersion:1,events},{},'jason','/learning-history');const note={...historyEvent('parent-observation'),type:'parent-note',data:{text:'Synthetic observation',authorRole:'parent',source:'parent-entered'}};assert.equal((await post([note])).status,200);assert.equal((await post([note])).status,200);const rows=await(await app.send('GET',undefined,{},'jason','/learning-history')).json();assert.equal(rows.events[0].data.text,'Synthetic observation');assert.equal(app.sqlite.prepare('SELECT count(*) n FROM progress').get().n,0);for(const data of [{text:'',authorRole:'parent'},{text:'A'.repeat(8001),authorRole:'parent'},{text:'Example'}])assert.equal((await post([{...note,id:'invalid',data}])).status,400);assert.equal((await app.send('POST',{historyVersion:1,events:[note]},{'X-Family-Pin':''},'jason','/learning-history')).status,401)});


function mockGithub({publicRepo=false,fail=false,conflict=false}={}){const calls=[],trees=[];let commits=0;return {calls,trees,fetch:async(url,options={})=>{calls.push({url,options});if(fail)return new Response('{}',{status:503});const path=new URL(url).pathname.replace('/repos/yuchao-jiang/learning-records','');if(!path)return Response.json({private:!publicRepo,full_name:'yuchao-jiang/learning-records'});if(path==='/git/ref/heads/main')return Response.json({object:{sha:'head-'+commits}});if(path.startsWith('/git/commits/')&&options.method!=='POST')return Response.json({tree:{sha:'base-tree'}});if(path==='/git/trees'){trees.push(JSON.parse(options.body));return Response.json({sha:'tree-'+trees.length})}if(path==='/git/commits'){commits++;return Response.json({sha:'commit-'+commits})}if(path==='/git/refs/heads/main'){if(conflict){conflict=false;return new Response('{}',{status:422})}return Response.json({object:{sha:'commit-'+commits}})}throw Error('Unexpected GitHub request')}}}
test('every learner progress save and history event is atomically queued without GitHub configuration',async()=>{const app=setup();await app.send('POST',payload);await app.send('POST',{...payload,child:'jason',data:{thinking:'answers',piano:'practice'}},{},'jason');await app.send('POST',{historyVersion:1,events:[historyEvent('queued')]},{},'jason','/learning-history');const rows=app.sqlite.prepare('SELECT * FROM github_archive_queue ORDER BY seq').all();assert.equal(rows.length,3);assert.deepEqual(rows.map(r=>r.learner),['emily','jason','jason']);assert(!JSON.stringify(rows).includes(secret));const status=await(await app.send('GET',undefined,{},'jason','/archive')).json();assert.equal(status.archive.pending,3);assert.equal(status.archive.configured,false)});
test('private archive writes raw records and a readable question report, retaining first wrong and later right',async()=>{const app=setup(),github=mockGithub(),previous=global.fetch;global.fetch=github.fetch;app.env.GITHUB_ARCHIVE_TOKEN='test-token-never-in-records';try{await app.send('POST',payload);const q={prompt:'Which number?',options:['Two','Three'],correctIndex:1,skill:'Example skill'};const a={...historyEvent('original'),question:q,data:{answer:0,correct:false}},b={...historyEvent('revised'),at:'2026-11-13T10:00:10Z',question:q,data:{answer:1,correct:true}};await app.send('POST',{historyVersion:1,events:[a,b]},{},'jason','/learning-history');const response=await app.send('POST',{}, {},'jason','/archive');assert.equal(response.status,200);const status=(await response.json()).archive;assert.equal(status.pending,0);assert.equal(status.lastCommit,'commit-1');const entries=github.trees[0].tree;assert(entries.some(e=>e.path.startsWith('emily/progress/snapshots/')));assert(entries.some(e=>e.path.endsWith('/events/original.json')));const report=entries.find(e=>e.path.endsWith('/report.md')).content;assert.match(report,/First answer: \*\*Wrong\*\*/);assert.match(report,/Latest answer: \*\*Right\*\*/);assert.match(report,/A. Two/);assert.match(report,/B. Three/);assert(!JSON.stringify(entries).includes('test-token-never-in-records'));assert(!JSON.stringify(entries).includes(secret));assert(github.calls.every(c=>c.url.startsWith('https://api.github.com/repos/yuchao-jiang/learning-records')))}finally{global.fetch=previous}});
test('GitHub failures keep all records in the durable queue for a later retry',async()=>{const app=setup(),previous=global.fetch;app.env.GITHUB_ARCHIVE_TOKEN='token';await app.send('POST',payload);try{global.fetch=mockGithub({fail:true}).fetch;assert.equal((await app.send('POST',{}, {},'emily','/archive')).status,503);assert.equal(app.sqlite.prepare('SELECT COUNT(*) n FROM github_archive_queue').get().n,1);global.fetch=mockGithub().fetch;assert.equal((await app.send('POST',{}, {},'emily','/archive')).status,200);assert.equal(app.sqlite.prepare('SELECT COUNT(*) n FROM github_archive_queue').get().n,0)}finally{global.fetch=previous}});
test('a public destination is refused before any record contents are uploaded',async()=>{const app=setup(),previous=global.fetch,github=mockGithub({publicRepo:true});app.env.GITHUB_ARCHIVE_TOKEN='token';await app.send('POST',payload);try{global.fetch=github.fetch;assert.equal((await app.send('POST',{}, {},'emily','/archive')).status,503);assert.equal(github.calls.length,1);assert.equal(app.sqlite.prepare('SELECT COUNT(*) n FROM github_archive_queue').get().n,1)}finally{global.fetch=previous}});
test('archive routes require authentication and a GitHub branch conflict is retried safely',async()=>{const app=setup(),previous=global.fetch,github=mockGithub({conflict:true});for(const method of ['GET','POST'])assert.equal((await app.send(method,method==='POST'?{}:undefined,{'X-Family-Pin':''},'jason','/archive')).status,401);await app.send('POST',payload);app.env.GITHUB_ARCHIVE_TOKEN='token';try{global.fetch=github.fetch;assert.equal((await app.send('POST',{}, {},'jason','/archive')).status,200);assert.equal(github.calls.filter(c=>c.url.endsWith('/git/refs/heads/main')).length,2);assert.equal(app.sqlite.prepare('SELECT COUNT(*) n FROM github_archive_queue').get().n,0)}finally{global.fetch=previous}});
test('existing D1 data is backfilled on upgrade and duplicate event retries do not create new queue entries',async()=>{const app=setup();app.sqlite.prepare('INSERT INTO progress(child,document,revision) VALUES(?,?,?)').run('emily',JSON.stringify(payload),'old-revision');const e=historyEvent('old-event');app.sqlite.prepare('INSERT INTO learning_events(event_id,learner,occurred_at,document) VALUES(?,?,?,?)').run(e.id,e.learner,e.at,JSON.stringify(e));await app.send('GET');assert.equal(app.sqlite.prepare('SELECT COUNT(*) n FROM github_archive_queue').get().n,2);await app.send('POST',{historyVersion:1,events:[historyEvent('new-event')]},{},'jason','/learning-history');await app.send('POST',{historyVersion:1,events:[historyEvent('new-event')]},{},'jason','/learning-history');assert.equal(app.sqlite.prepare('SELECT COUNT(*) n FROM github_archive_queue').get().n,3)});
test('piano dates and practice items are readable in private Markdown as well as raw snapshots',async()=>{const app=setup(),previous=global.fetch,github=mockGithub();app.env.GITHUB_ARCHIVE_TOKEN='token';try{global.fetch=github.fetch;await app.send('POST',{...payload,data:{piano:JSON.stringify({version:1,days:{'2026-11-16':{at:'2026-11-16T10:00:00Z',tasks:['piece']}}})}});await app.send('POST',{}, {},'emily','/archive');const report=github.trees[0].tree.find(e=>e.path==='emily/piano/check-ins.md');assert(report);assert.match(report.content,/2026-11-16/);assert.match(report.content,/piece/)}finally{global.fetch=previous}});
test('parent notes remain in raw events and have a blue SVG in the Markdown report',async()=>{const app=setup(),previous=global.fetch,github=mockGithub();app.env.GITHUB_ARCHIVE_TOKEN='token';try{global.fetch=github.fetch;const note={...historyEvent('blue-note'),type:'parent-note',data:{text:'A < B & C',authorRole:'parent'}};await app.send('POST',{historyVersion:1,events:[note]},{},'jason','/learning-history');await app.send('POST',{}, {},'jason','/archive');const entries=github.trees[0].tree;const svg=entries.find(e=>e.path.endsWith('/parent-notes/blue-note.svg'));assert.match(svg.content,/#235bad/);assert.match(svg.content,/&lt; B &amp; C/);assert.match(entries.find(e=>e.path.endsWith('/report.md')).content,/parent-notes\/blue-note.svg/)}finally{global.fetch=previous}});
test('an outbox write failure rolls back the source save rather than acknowledging unqueued data',async()=>{const app=setup();await app.send('GET');app.sqlite.exec('DROP TABLE github_archive_queue');assert.equal((await app.send('POST',payload)).status,503);assert.equal(app.sqlite.prepare('SELECT COUNT(*) n FROM progress').get().n,0)});

function mockNotion({fail=false,failBlockOnce=false,onWrite}={}){const calls=[],pages=[],blocks=new Map();return {calls,pages,fetch:async(url,options={})=>{calls.push({url,options});assert(url.startsWith('https://api.notion.com/v1/'));if(fail)return new Response('{}',{status:429});const route=new URL(url).pathname.replace('/v1/',''),body=options.body?JSON.parse(options.body):{};if(route.endsWith('/query'))return Response.json({results:pages.filter(p=>p.properties['Sync ID'].rich_text[0].text.content===body.filter.rich_text.equals)});if(route==='pages'&&options.method==='POST'){const page={id:'page-'+(pages.length+1),properties:{...body.properties,'Parent observations':{rich_text:[{text:{content:'Keep my notes'}}]},Support:{select:{name:'Worked together'}}}};pages.push(page);if(onWrite)await onWrite();return Response.json(page)}if(route.startsWith('pages/')&&options.method==='PATCH'){assert(!('Parent observations' in body.properties));assert(!('Support' in body.properties));const page=pages.find(p=>p.id===route.slice(6));Object.assign(page.properties,body.properties);return Response.json(page)}if(route.endsWith('/children')&&options.method==='PATCH'){if(failBlockOnce){failBlockOnce=false;return new Response('{}',{status:429})}const id='block-'+(blocks.size+1),block={id,...body.children[0]};blocks.set(id,block);return Response.json({results:[block]})}if(route.endsWith('/children')){const pageId=route.split('/')[1];return Response.json({results:[...blocks.values()].filter(b=>!b.pageId||b.pageId===pageId),has_more:false})}if(route.startsWith('blocks/')&&options.method==='PATCH'){const id=route.slice(7);assert(blocks.has(id));blocks.set(id,{...blocks.get(id),...body});return Response.json(blocks.get(id))}throw Error('Unexpected Notion call '+route)}}}
const enableNotion=app=>{app.env.NOTION_SYNC_TOKEN='notion-test-secret';app.env.NOTION_DATA_SOURCE_ID='11111111-1111-1111-1111-111111111111'};
test('Notion session sync creates a dated result with scores and preserves parent fields on later changes',async()=>{const app=setup(),api=mockNotion(),previous=global.fetch;enableNotion(app);try{global.fetch=api.fetch;const question={prompt:'Which answer?',options:['One','Two'],correctIndex:1};const events=[{...historyEvent('notion-first'),question,data:{answer:0,correct:false}},{...historyEvent('notion-last'),at:'2026-11-13T10:01:00Z',question,data:{answer:1,correct:true}},{...historyEvent('notion-complete'),questionId:'summary',type:'completion',at:'2026-11-13T10:02:00Z',data:{total:1}}];await app.send('POST',{historyVersion:1,events},{},'jason','/learning-history');assert.equal((await app.send('POST',{}, {},'jason','/notion-sync')).status,200);assert.equal(api.pages.length,1);const page=api.pages[0];assert.equal(page.properties.State.select.name,'Completed');assert.equal(page.properties['First correct'].number,0);assert.equal(page.properties['Latest correct'].number,1);assert.equal(page.properties.Completed.date.start,'2026-11-13T10:02:00.000Z');await app.send('POST',{historyVersion:1,events:[{...historyEvent('notion-later-time'),type:'time',data:{activeMs:2000}}]},{},'jason','/learning-history');await app.send('POST',{}, {},'jason','/notion-sync');assert.equal(api.pages.length,1);assert.equal(page.properties['Parent observations'].rich_text[0].text.content,'Keep my notes');assert.equal(page.properties.Support.select.name,'Worked together')}finally{global.fetch=previous}});
test('Notion failure keeps jobs pending and retry after uncertain page creation reuses the same page',async()=>{const app=setup(),api=mockNotion({failBlockOnce:true}),previous=global.fetch;enableNotion(app);try{global.fetch=api.fetch;await app.send('POST',{historyVersion:1,events:[historyEvent('notion-retry')]},{},'jason','/learning-history');assert.equal((await app.send('POST',{}, {},'jason','/notion-sync')).status,503);assert.equal(api.pages.length,1);assert.equal(app.sqlite.prepare('SELECT COUNT(*) n FROM notion_sync_jobs').get().n,1);assert.equal((await app.send('POST',{}, {},'jason','/notion-sync')).status,200);assert.equal(api.pages.length,1);assert.equal(app.sqlite.prepare('SELECT COUNT(*) n FROM notion_sync_jobs').get().n,0)}finally{global.fetch=previous}});
test('a new revision arriving during a Notion upload stays queued',async()=>{const app=setup(),previous=global.fetch;enableNotion(app);const api=mockNotion({onWrite:async()=>{await app.send('POST',{historyVersion:1,events:[historyEvent('notion-new-revision')]},{},'jason','/learning-history')}});try{global.fetch=api.fetch;await app.send('POST',{historyVersion:1,events:[historyEvent('notion-old-revision')]},{},'jason','/learning-history');await app.send('POST',{}, {},'jason','/notion-sync');assert.equal(app.sqlite.prepare('SELECT COUNT(*) n FROM notion_sync_jobs').get().n,1);await app.send('POST',{}, {},'jason','/notion-sync');assert.equal(app.sqlite.prepare('SELECT COUNT(*) n FROM notion_sync_jobs').get().n,0);assert.equal(api.pages.length,1)}finally{global.fetch=previous}});
test('piano check-ins create separate dated Notion sessions and are not continually requeued unchanged',async()=>{const app=setup(),api=mockNotion(),previous=global.fetch;enableNotion(app);try{global.fetch=api.fetch;const data={piano:JSON.stringify({version:1,days:{'2026-11-16':{at:'2026-11-16T09:00:00Z',tasks:['piece']}}})};let saved=await(await app.send('POST',{...payload,data})).json();await app.send('POST',{}, {},'emily','/notion-sync');await app.send('POST',{}, {},'emily','/notion-sync');assert(api.pages.some(p=>p.properties.Area.select.name==='Piano'&&p.properties.Started.date.start==='2026-11-16'));saved=await(await app.send('POST',{...payload,sha:saved.sha,data})).json();await app.send('POST',{}, {},'emily','/notion-sync');assert.equal(app.sqlite.prepare("SELECT COUNT(*) n FROM notion_sync_jobs WHERE kind='piano'").get().n,0)}finally{global.fetch=previous}});
test('unauthenticated Notion routes and unconfigured Workers never send learner data to Notion',async()=>{const app=setup(),api=mockNotion(),previous=global.fetch;try{global.fetch=api.fetch;assert.equal((await app.send('GET',undefined,{'X-Family-Pin':''},'emily','/notion-sync')).status,401);await app.send('POST',payload);const response=await(await app.send('POST',{}, {},'emily','/notion-sync')).json();assert.equal(response.notion.configured,false);assert.equal(api.calls.length,0)}finally{global.fetch=previous}});
test('imported work does not invent original first-answer scores in Notion',async()=>{const app=setup(),api=mockNotion(),previous=global.fetch;enableNotion(app);try{global.fetch=api.fetch;await app.send('POST',{historyVersion:1,events:[{...historyEvent('notion-import'),type:'import',data:{initialAnswerKnown:false}},historyEvent('notion-after-import')]},{},'jason','/learning-history');await app.send('POST',{}, {},'jason','/notion-sync');assert.equal(api.pages[0].properties['First correct'].number,null)}finally{global.fetch=previous}});
test('scheduled retry updates Notion without an open website or a GitHub token',async()=>{const app=setup(),api=mockNotion(),previous=global.fetch;enableNotion(app);try{global.fetch=api.fetch;await app.send('POST',{historyVersion:1,events:[historyEvent('cron-notion')]},{},'jason','/learning-history');const pending=[];await(await worker).scheduled({},app.env,{waitUntil:p=>pending.push(p)});await Promise.all(pending);assert.equal(api.pages.length,1);assert.equal(app.sqlite.prepare('SELECT COUNT(*) n FROM notion_sync_jobs').get().n,0)}finally{global.fetch=previous}});
test('scheduled retry archives pending GitHub records without a Notion token',async()=>{const app=setup(),api=mockGithub(),previous=global.fetch;app.env.GITHUB_ARCHIVE_TOKEN='token';try{global.fetch=api.fetch;await app.send('POST',payload);const pending=[];await(await worker).scheduled({},app.env,{waitUntil:p=>pending.push(p)});await Promise.all(pending);assert.equal(app.sqlite.prepare('SELECT COUNT(*) n FROM github_archive_queue').get().n,0);assert.equal(api.trees.length,1)}finally{global.fetch=previous}});

test('English snapshot first-answer evidence survives a later edit arriving from a different device',async()=>{const app=setup(),api=mockNotion(),previous=global.fetch;enableNotion(app);try{global.fetch=api.fetch;const event={...historyEvent('english-other-device'),activity:'reading-set-1',attemptId:'reading-v1-set-1',questionId:'20',question:{prompt:'Choose gap 20.',options:['Wrong sentence','Right sentence'],correctIndex:1,subject:'English',context:'Full passage'},data:{answer:1,correct:true,initialAnswerKnown:true,originalFirstAnswer:0,originalFirstCorrect:false,originalFirstAt:'2026-11-10T09:00:00Z'}};await app.send('POST',{historyVersion:1,events:[event]},{},'jason','/learning-history');await app.send('POST',{}, {},'jason','/notion-sync');assert.equal(api.pages[0].properties['First correct'].number,0);assert.equal(api.pages[0].properties['Latest correct'].number,1);assert.match(api.pages[0].properties.Session.title[0].text.content,/English Set 1/);const github=mockGithub();global.fetch=github.fetch;app.env.GITHUB_ARCHIVE_TOKEN='token';await app.send('POST',{}, {},'jason','/archive');const report=github.trees[0].tree.find(e=>e.path.endsWith('/report.md')).content;assert.match(report,/Original first selection: A/);assert.match(report,/First answer: \*\*Wrong\*\*/)}finally{global.fetch=previous}});
test('importing an old English submission preserves the actual saved date and latest score without guessing first answers',async()=>{const app=setup(),api=mockNotion(),previous=global.fetch;enableNotion(app);try{global.fetch=api.fetch;const common={...historyEvent('legacy-q'),activity:'reading-set-1',attemptId:'reading-v1-set-1',questionId:'20',type:'import',question:{prompt:'Gap 20?',options:['A sentence','Another sentence'],correctIndex:1},data:{answer:1,submitted:true,originalSubmittedAt:'2026-11-10T09:00:00Z',initialAnswerKnown:false}},summary={...common,id:'legacy-summary',questionId:'summary',question:{},data:{submitted:true,originalSubmittedAt:'2026-11-10T09:00:00Z',correct:5,total:6,initialAnswerKnown:false}};await app.send('POST',{historyVersion:1,events:[common,summary]},{},'jason','/learning-history');await app.send('POST',{}, {},'jason','/notion-sync');assert.equal(api.pages.length,1);const props=api.pages[0].properties;assert.equal(props.Completed.date.start,'2026-11-10T09:00:00.000Z');assert.equal(props.Started.date,null);assert.equal(props.State.select.name,'Completed');assert.equal(props['First correct'].number,null);assert.equal(props['Latest correct'].number,5);assert.equal(props['Question count'].number,6);const github=mockGithub();global.fetch=github.fetch;app.env.GITHUB_ARCHIVE_TOKEN='token';await app.send('POST',{}, {},'jason','/archive');assert.match(github.trees[0].tree.find(e=>e.path.endsWith('/report.md')).content,/Imported saved answer: B/)}finally{global.fetch=previous}});

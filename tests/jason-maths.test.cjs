const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'jason-maths.html'), 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(source, 'maths application script exists');

function setup(saved = {}) {
  const elements = new Map();
  function el(id) {
    assert.ok(html.includes('id="' + id + '"'), 'Page element exists: ' + id);
    if (!elements.has(id)) elements.set(id, {
      value: '1', textContent: '', innerHTML: '', hidden: false, disabled: false,
      classList: { toggle() {} }, children: [], style:{},prepend(item){this.children.unshift(item)},setAttribute(k,v){this[k]=v}, replaceChildren(...items){this.children=items}, append(...items){this.children.push(...items)}, appendChild(item){this.children.push(item)}
    });
    return elements.get(id);
  }
  const values = new Map(Object.entries(saved));
  const storage = {
    getItem: k => values.has(k) ? values.get(k) : null,
    setItem: (k, v) => values.set(k, String(v)),
    removeItem: k => values.delete(k)
  };
  const context = {
    document: { getElementById: el, createElement: () => ({
      className: '', textContent: '', checked: false, disabled: false,
      children:[],style:{},prepend(item){this.children.unshift(item)},setAttribute(k,v){this[k]=v},append(...items){this.children.push(...items)},appendChild(item){this.children.push(item)},replaceChildren(...items){this.children=items}
    }), createTextNode: v => v },
    localStorage: storage, confirm: () => true,
    AdventureMaths: require('../maths-progress.js'),AdventureNextSet:require('../maths-next-set.js'),
    crypto: require('node:crypto').webcrypto, Event, window: { dispatchEvent() {} },
    setInterval: () => 1, clearInterval: () => {},
    Date, Math, JSON, Object, String, Number, Array
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  return { context, elements, storage, values, run: code => vm.runInContext(code, context) };
}

test('missions have child-friendly labels and checking instructions', () => {
  assert.match(html, /Careful Thinker/);
  assert.doesNotMatch(html, /<option[^>]*>[^<]*Smart Explorer|Choose a maths mission/);
  assert.match(html, /3 minutes/);
  assert.doesNotMatch(html, /Week 1 · Accuracy|Week 2 · Pacing/);
});

test('question bank has valid answer indices and unique options', () => {
  const app = setup();
  const result = app.run('data.map(q => ({topic:q.topic, choices:q.o, answer:q.a}))');
  assert.ok(result.length >= 10);
  for (const q of result) {
    assert.ok(q.topic);
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.choices.length);
    assert.equal(new Set(q.choices).size, q.choices.length);
  }
});

test('Careful Thinker starts with the nine new questions and 20 minutes', () => {
  const app = setup();
  app.run('startSession()');
  const session = JSON.parse(app.storage.getItem('jason-maths-two-weeks-v1')).session;
  assert.equal(session.ids.length, 9);
  assert.equal(session.phase, 'solve');
  assert.ok(session.deadline - Date.now() > 19 * 60000);
});

test('existing Smart Explorer sessions still restore with their original questions and timer', () => {
  const deadline=Date.now()+18*60000;
  const saved={session:{id:'legacy-smart',startedAt:Date.now(),updatedAt:Date.now(),week:2,ids:Array.from({length:10},(_,i)=>i),answers:{},first:null,flagged:{},phase:'solve',deadline},history:[]};
  const app=setup({'jason-maths-two-weeks-v1':JSON.stringify(saved)});
  assert.equal(app.run('store.session.week'),2);
  assert.equal(app.run('store.session.ids.length'),10);
  assert.equal(app.run('store.session.deadline'),deadline);
});

test('checking captures original answers and starts a three-minute timer', () => {
  const app = setup();
  app.run('startSession()');
  app.run('store.session.answers[12]=2;nextPhase()');
  const session = JSON.parse(app.storage.getItem('jason-maths-two-weeks-v1')).session;
  assert.equal(session.phase, 'check');
  assert.equal(session.first[12], 2);
  assert.ok(session.deadline - Date.now() > 2 * 60000);
});

test('finishing saves separate first-attempt and checked scores', () => {
  const app = setup();
  app.run('startSession()');
  app.run('nextPhase();nextPhase()');
  const saved = JSON.parse(app.storage.getItem('jason-maths-two-weeks-v1'));
  assert.equal(saved.history.length, 1);
  assert.equal(saved.history[0].total, 9);
  assert.equal(saved.session.phase, 'done');
});

test('there is one Careful Thinker mission and no mission selector', () => {
  assert.match(html, /<h2>🎯 Careful Thinker<\/h2>/);
  assert.doesNotMatch(html, /id="week"|chooseWeek\(|Pick a mission/);
});

test('cube question has the correct answer without a runtime correction', () => {
  const app = setup();
  assert.equal(app.run('data.find(q=>q.topic==="3D shapes").o[data.find(q=>q.topic==="3D shapes").a]'), '40');
  assert.doesNotMatch(source, /data\[6\]\.o=/);
});

test('completed records keep actual first and checked answers for cloud review', () => {
 const app=setup();app.run('startSession();store.session.answers[12]=2;nextPhase();store.session.answers[12]=1;nextPhase()');
 const saved=JSON.parse(app.storage.getItem('jason-maths-two-weeks-v1'));
 assert.equal(saved.history[0].firstAnswers[12],2);
 assert.equal(saved.history[0].answers[12],1);
 assert.equal(saved.history[0].id,saved.session.id);
});
test('cloud restoration renders an unfinished attempt with its original deadline', () => {
 const app=setup();app.run('startSession()');
 const saved=JSON.parse(app.storage.getItem('jason-maths-two-weeks-v1'));
 saved.session.answers[12]=2;app.storage.setItem('jason-maths-two-weeks-v1',JSON.stringify(saved));
 app.context.window.adventureMathsRestore();
 assert.equal(app.run('store.session.answers[12]'),2);
 assert.equal(app.run('store.session.deadline'),saved.session.deadline);
});
test('new practice archives the previous attempt instead of losing its answers', () => {
 const app=setup();app.run('startSession();store.session.answers[12]=2;startSession()');
 const saved=JSON.parse(app.storage.getItem('jason-maths-two-weeks-v1'));
 assert.equal(saved.archivedSessions.length,1);
 assert.equal(saved.archivedSessions[0].answers[12],2);
 assert.notEqual(saved.archivedSessions[0].id,saved.session.id);
});

test('All attempts includes more than five attempts and reviewing never changes current work', () => {
 const app=setup();for(let i=0;i<7;i++)app.run('startSession();store.session.answers[12]=2;persist()');
 const current=app.run('store.session.id'), count=app.run('AdventureMaths.records(store).length');
 assert.equal(count,7);
 app.run('reviewKey=AdventureMaths.records(store).find(r=>r.key!==store.session.id).key;showMathsView("history")');
 assert.equal(app.run('store.session.id'),current);
 assert.equal(app.elements.get('attempt-list').children.length,7);
 assert.equal(app.elements.get('history-page').hidden,false);
});
test('mistakes book includes a wrong answer that was corrected during checking', () => {
 const app=setup();app.run('startSession();store.session.answers[12]=0;nextPhase();store.session.answers[12]=data[12].a;nextPhase();showMathsView("mistakes")');
 assert.equal(app.run('AdventureMaths.mistakes(store,data).find(item=>item.id===12).needsPractice'),false);
 assert.equal(app.elements.get('mistakes-page').hidden,false);
});
test('child maths page has no parent, preview, classification or reset controls',()=>{
 assert.doesNotMatch(html,/Parent:|Parent answer|Include parent|Mark as parent|Count as Jason|function resetTest|showParentPreview|markParentPreview/);
 assert.match(html,/>▶ Play<|>📚 My work<|>⭐ 错题本</);
});
test('previous parent exclusions remain hidden without deleting saved records',()=>{
 const first=setup();first.run('startSession();nextPhase();nextPhase()');
 const saved=JSON.parse(first.storage.getItem('jason-maths-two-weeks-v1'));
 saved.attemptTags={[saved.session.id]:{preview:true,updatedAt:Date.now()}};
 const app=setup({'jason-maths-two-weeks-v1':JSON.stringify(saved)});
 assert.equal(app.run('AdventureMaths.records(store).length'),1);
 assert.equal(app.run('AdventureMaths.mistakes(store,data).length'),0);
 assert.equal(app.elements.get('practice').hidden,true);
 assert.equal(app.storage.getItem('jason-maths-two-weeks-v1'),JSON.stringify(saved));
});
test('active practice hides the mission chooser and completed work offers child answer review',()=>{
 const app=setup();app.run('startSession()');
 assert.equal(app.elements.get('mission-choice').hidden,true);
 assert.equal(app.elements.get('answers-box').hidden,true);
 app.run('nextPhase();nextPhase()');
 assert.equal(app.elements.get('mission-choice').hidden,false);
 assert.equal(app.elements.get('answers-box').hidden,false);
 assert.ok(app.elements.get('answers-review').children.length>0);
});

test('Careful Thinker allows flagging in solving and checking and retains flags when finished',()=>{
 const app=setup();app.run('startSession()');
 assert.equal(app.run('store.session.week'),1);
 assert.match(source,/if\(session.phase!=="done"\)/);
 assert.match(source,/Flag question /);
 app.run('store.session.flagged[12]=true;persist();nextPhase();nextPhase()');
 const saved=JSON.parse(app.storage.getItem('jason-maths-two-weeks-v1'));
 assert.equal(saved.session.flagged[12],true);
 assert.equal(saved.history[0].flagged[12],true);
});

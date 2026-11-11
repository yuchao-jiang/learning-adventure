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
      classList: { toggle() {} }, append() {}, appendChild() {}
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
      append() {}, appendChild() {}
    }), createTextNode: v => v },
    localStorage: storage, confirm: () => true,
    setInterval: () => 1, clearInterval: () => {},
    Date, Math, JSON, Object, String, Number, Array
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  return { context, elements, storage, values, run: code => vm.runInContext(code, context) };
}

test('missions have child-friendly labels and checking instructions', () => {
  assert.match(html, /Careful Thinker/);
  assert.match(html, /Smart Explorer/);
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

test('Careful Thinker starts with eight questions and 15 minutes', () => {
  const app = setup();
  app.run('startSession()');
  const session = JSON.parse(app.storage.getItem('jason-maths-two-weeks-v1')).session;
  assert.equal(session.ids.length, 8);
  assert.equal(session.phase, 'solve');
  assert.ok(session.deadline - Date.now() > 14 * 60000);
});

test('Smart Explorer starts with ten questions and 18 minutes', () => {
  const app = setup();
  app.elements.get('week').value = '2';
  app.run('startSession()');
  const session = JSON.parse(app.storage.getItem('jason-maths-two-weeks-v1')).session;
  assert.equal(session.ids.length, 10);
  assert.ok(session.deadline - Date.now() > 17 * 60000);
});

test('checking captures original answers and starts a three-minute timer', () => {
  const app = setup();
  app.run('startSession()');
  app.run('store.session.answers[0]=2;nextPhase()');
  const session = JSON.parse(app.storage.getItem('jason-maths-two-weeks-v1')).session;
  assert.equal(session.phase, 'check');
  assert.equal(session.first[0], 2);
  assert.ok(session.deadline - Date.now() > 2 * 60000);
});

test('finishing saves separate first-attempt and checked scores', () => {
  const app = setup();
  app.run('startSession()');
  app.run('nextPhase();nextPhase()');
  const saved = JSON.parse(app.storage.getItem('jason-maths-two-weeks-v1'));
  assert.equal(saved.history.length, 1);
  assert.equal(saved.history[0].total, 8);
  assert.equal(saved.session.phase, 'done');
});

test('reset clears maths records without touching reading progress', () => {
  const app = setup({ 'jason-reading-v1': '{"test":"keep"}' });
  app.run('startSession();resetTest()');
  assert.equal(app.storage.getItem('jason-maths-two-weeks-v1'), null);
  assert.equal(app.storage.getItem('jason-reading-v1'), '{"test":"keep"}');
});


test('mission selection keeps an accessible name without redundant instructions', () => {
  assert.match(html, /<select aria-label="Choose a maths mission" id="week"/);
  assert.doesNotMatch(html, /Choose a mission:|Start with Careful Thinker\./);
});

test('cube question has the correct answer without a runtime correction', () => {
  const app = setup();
  assert.equal(app.run('data.find(q=>q.topic==="3D shapes").o[data.find(q=>q.topic==="3D shapes").a]'), '40');
  assert.doesNotMatch(source, /data\[6\]\.o=/);
});

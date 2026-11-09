const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createPersistence } = require('./persistence.js');
const questions = [{ id: 'e1', choices: ['a', 'b'] }, { id: 'e5', writing: true }];
function setup(initial = {}) {
  const items = new Map(Object.entries(initial));
  const storage = { getItem: k => items.get(k) ?? null, setItem: (k, v) => items.set(k, v) };
  return { items, storage, repo: createPersistence(() => storage, questions) };
}
test('answers, hints, completion and subject survive a new instance', () => {
  const { repo, storage } = setup();
  assert.equal(repo.save({ e1: { value: 1, checked: true, hint: true }, e5: { value: '<hello>', checked: false } }, 'maths').ok, true);
  const restored = createPersistence(() => storage, questions).load();
  assert.equal(restored.tab, 'maths');
  assert.deepEqual(restored.answers.e1, { value: 1, checked: true, hint: true });
  assert.equal(restored.answers.e5.value, '<hello>');
});
test('migrates legacy progress without deleting the recovery copy', () => {
  const legacy = JSON.stringify({ e1: { value: 0, checked: true } });
  const { repo, items } = setup({ 'emily-adventure-v1': legacy });
  assert.equal(repo.load().answers.e1.checked, true);
  assert.equal(JSON.parse(items.get('emily-adventure-v2')).version, 2);
  assert.equal(items.get('emily-adventure-v1'), legacy);
});
test('rejects malformed and unsupported saved documents', () => {
  for (const value of ['{', 'null', '[]', '{"version":3,"answers":{}}']) {
    assert.equal(setup({ 'emily-adventure-v2': value }).repo.load().reason, 'invalid');
  }
});
test('filters unknown questions, invalid choices, and invalid completion', () => {
  const { repo } = setup();
  repo.save({ e1: { value: 42, checked: true, hint: 'yes' }, e5: { value: '  ', checked: true }, unknown: {} }, 'bad');
  assert.deepEqual(repo.load(), { ok: true, tab: 'english', answers: {
    e1: { checked: false, hint: false }, e5: { value: '  ', checked: false, hint: false }
  } });
});
test('storage access and quota failures return an actionable failure', () => {
  const blocked = createPersistence(() => { throw Error('denied'); }, questions);
  assert.equal(blocked.load().reason, 'unavailable');
  assert.equal(blocked.save({}, 'english').ok, false);
  const { repo, storage } = setup();
  storage.setItem = () => { throw Error('quota'); };
  assert.equal(repo.save({}, 'english').reason, 'unavailable');
});

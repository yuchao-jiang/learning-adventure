const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { activityProgress, showProgress } = require('../progress.js');

test('all activity sizes show five slots and reserve five filled stars for done', () => {
  for (const total of [3, 5, 6, 9, 15, 20]) {
    for (let done = 0; done <= total; done++) {
      const result = activityProgress(done, total);
      assert.equal([...result.stars].length, 5);
      assert.equal(result.filled === 5, done === total);
      assert.match(result.label, done === total ? /Done/ : done ? /In progress/ : /Not started/);
    }
  }
});
test('started activities with no completed tasks are distinct from untouched ones', () => {
  assert.match(activityProgress(0, 9, true).label, /In progress/);
  assert.equal(activityProgress(0, 9, true).stars, '☆☆☆☆☆');
  assert.doesNotMatch(activityProgress(0, 0).label, /Done/);
});
test('star labels expose completion counts to assistive technology', () => {
  const element = { setAttribute(k, v) { this[k] = v; } };
  showProgress(element, 9, 9);
  assert.equal(element.textContent, '★★★★★');
  assert.match(element['aria-label'], /5 of 5 stars.*Done.*9\/9 completed/);
});
test('real Emily roadmap renders completion rather than correct-answer scores', () => {
  const html = fs.readFileSync(require('node:path').join(__dirname, '../emily.html'), 'utf8');
  const source = html.slice(html.indexOf('function renderHub()'), html.indexOf('function render(){'));
  const cards = [];
  const node = () => ({ innerHTML: '', addEventListener() {}, append(...items) { cards.push(...items); } });
  const maths = Array.from({ length: 30 }, (_, i) => ({ id: 'm' + i, correct: 1 }));
  const english = [{ id: 'e1', correct: 1 }];
  const state = Object.fromEntries([...maths, ...english].map(q => [q.id, { value: 0, checked: true }]));
  const context = { data: { english, english2: english, english3: english, wordWorkshop1: english, maths }, state,
    AdventureProgress: { activityProgress }, openSet() {}, document: { getElementById: node, createElement: node } };
  vm.runInNewContext(source + ';renderHub();', context);
  const rendered = cards.filter(c => c.className === 'hub-card');
  assert.equal(rendered.length, 7);
  for (const card of rendered) {
    assert.match(card.innerHTML, /★★★★★/);
    assert.match(card.innerHTML, /✓ Done/);
    assert.equal((card.innerHTML.match(/★/g) || []).length, 5);
  }
});

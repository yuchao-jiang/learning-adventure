const test=require('node:test'),assert=require('node:assert/strict');
const {questions}=require('../maths-paper-1.js');
const catalog=require('../report-catalog.js');
test('all 35 approved questions have unique options, explanations and stable report context',()=>{
 assert.equal(questions.length,35);
 const key='BCADEDAEECBEACDBDBBDBBAEBACDEAEBDDC';
 questions.forEach((q,i)=>{
  assert.equal(q.paperQuestion,i+1);assert.equal(q.o.length,5);assert.equal(new Set(q.o).size,5);
  assert.equal('ABCDE'[q.a],key[i]);assert(q.why.length>20);
  const report=catalog.maths[i+21];assert.equal(report.prompt,q.q);assert.equal(report.correctIndex,q.a);assert.equal(report.paperQuestion,i+1);
  if(q.figure)assert(report.image&&report.image.endsWith('.svg'));
 });
});
test('rebalanced cube, chart, age, direction, reflection and work-rate questions have correct answers',()=>{
 const answer=n=>questions[n-1].o[questions[n-1].a];
 assert.equal(Number(answer(3)),4**3);
 assert.equal([8,2,12,5,9,3,6].filter(n=>n>6).length,3);
 assert.match(answer(10),/Exactly three/);
 assert.equal(answer(19),`${20/4*3} years`);
 assert.equal(answer(27),`${20-10} m`);
 const shaded=['A1','B3','C4','F1'],reflect=s=>'FEDCBA'['ABCDEF'.indexOf(s[0])]+s[1];
 assert.deepEqual(shaded.map(reflect).filter(s=>!shaded.includes(s)).sort(),['D4','E3']);
 assert.equal(answer(28),'E3 and D4');
 assert.equal(answer(32),'9:55 am');
 assert.equal(15+80/2,55);
});
test('both ticket questions carry their shared table into standalone reports',()=>{
 for(const n of [11,12]){assert.match(questions[n-1].context,/12 adult tickets and 18 child/);assert.match(questions[n-1].figure,/<svg/);assert.match(catalog.maths[n+20].context,/15 adult tickets and 9 child/);}
});

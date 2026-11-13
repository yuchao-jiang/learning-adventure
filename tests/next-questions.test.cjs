const test=require('node:test'),assert=require('node:assert/strict');
const {questions,petCounts,whitePiece,greyPiece,foldOutlines}=require('../maths-next-set.js');
const {normalize,merge}=require('../maths-progress.js');
const answer=n=>{const q=questions.find(q=>q.sourceNumber===n);return q.o[q.a]};
test('the next set transcribes all nine numbered questions with usable choices and accessible diagrams',()=>{
 assert.deepEqual(questions.map(q=>q.sourceNumber),[27,28,29,30,31,32,33,34,35]);
 for(const q of questions){assert.equal(q.o.length,5);assert.equal(new Set(q.o).size,5);assert.ok(q.why);if(q.figure){assert.match(q.figure,/role="img"/);assert.match(q.figure,/aria-label=/)}}
 assert.equal(questions.find(q=>q.sourceNumber===30).optionFigures.length,5);
});
test('graph claims match the plotted values',()=>{
 const claims=[petCounts[1]+petCounts[2]>100,petCounts[2]===3*petCounts[0],petCounts[2]-petCounts[3]===24];
 assert.deepEqual(claims,[false,false,true]);assert.equal(answer(27),'Claim 3 only');
});
test('each separated four-cube piece has eighteen exposed faces',()=>{
 const faces=piece=>{let touching=0;for(let i=0;i<piece.length;i++)for(let j=i+1;j<piece.length;j++)if(piece[i].reduce((n,c,k)=>n+Math.abs(c-piece[j][k]),0)===1)touching++;return piece.length*6-touching*2};
 assert.equal(whitePiece.length,4);assert.equal(greyPiece.length,4);
 assert.equal(faces(whitePiece),18);assert.equal(faces(greyPiece),18);
 assert.equal(Number(answer(28)),faces(whitePiece)+faces(greyPiece));
});
test('ratio, cost and remaining ruler-mark gaps give the keyed answers',()=>{
 assert.equal(Number(answer(29)),12/3*2);
 assert.equal(Number(answer(32)),1000-5*106-140);
 const marks=[0,2,3,7],gaps=new Set();for(const a of marks)for(const b of marks)if(a>b)gaps.add(a-b);
 assert.deepEqual([3,4,5,6,7].filter(n=>!gaps.has(n)),[6]);assert.equal(answer(35),'6 cm');
});
test('only folding option A has less than the minimum half-paper area',()=>{
 const area=points=>Math.abs(points.reduce((sum,p,i)=>{const next=points[(i+1)%points.length];return sum+p[0]*next[1]-p[1]*next[0]},0))/2;
 assert.equal(questions.find(q=>q.sourceNumber===30).a,0);
 assert.ok(area(foldOutlines[0])<80*80/4);
 assert.ok(foldOutlines.slice(1).every(points=>area(points)>=80*80/4));
});
test('perimeter and probability statements distinguish equal, greater and less than',()=>{
 const desiredIncrease=4,smallPerimeter=2*(2+1);
 assert.deepEqual([['P',2],['Q',1],['R',1],['S',2]].filter(([,shared])=>smallPerimeter-2*shared===desiredIncrease).map(([label])=>label),['Q','R']);
 assert.equal(answer(31),'Q and R only');
 const counters=Array.from({length:11},(_,i)=>i+1);
 assert.equal(counters.filter(n=>n%2).length,6);assert.equal(counters.filter(n=>n>6).length,counters.filter(n=>n<6).length);
 assert.equal(answer(33),'Statement 3 only');assert.equal(answer(34),'X, Y and Z');
});
test('new question indices and legacy records coexist through normalization and cloud merging',()=>{
 const session=(id,ids)=>({id,week:1,ids,startedAt:id==='old'?1:2,updatedAt:2,phase:'solve',answers:{},first:null,flagged:{},deadline:999999});
 const result=merge({session:session('old',[0,1,2,3,4,5,6,7])},{session:session('new',[12,13,14,15,16,17,18,19,20])});
 assert.equal(result.session.id,'new');assert.equal(result.archivedSessions[0].id,'old');assert.equal(normalize(result).session.ids.length,9);
});

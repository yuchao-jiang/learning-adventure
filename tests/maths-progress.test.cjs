const test=require('node:test');
const assert=require('node:assert/strict');
const {merge,normalize,stable}=require('../maths-progress.js');
function attempt(overrides={}){return {id:'a',startedAt:100,updatedAt:101,week:1,ids:[0,1],phase:'solve',answers:{0:2},first:null,flagged:{1:true},deadline:999999,...overrides}}
test('empty device restores answers, flags, deadline and first-attempt work',()=>{
 const source={session:attempt({phase:'check',first:{0:1}}),history:[]};
 const result=merge({},source);
 assert.equal(result.session.deadline,999999);
 assert.equal(result.session.answers[0],2);
 assert.equal(result.session.first[0],1);
 assert.equal(result.session.flagged[1],true);
});
test('completed attempts cannot regress when a stale device uploads a draft',()=>{
 const done={session:attempt({phase:'done',updatedAt:200,answers:{0:4},first:{0:1}})};
 const draft={session:attempt({updatedAt:300,answers:{0:0}})};
 assert.equal(merge(done,draft).session.phase,'done');
 assert.equal(merge(draft,done).session.answers[0],4);
});
test('same-attempt edits use the latest saved revision, deterministically',()=>{
 const a={session:attempt()}, b={session:attempt({updatedAt:200,answers:{0:3}})};
 assert.equal(merge(a,b).session.answers[0],3);
 assert.equal(stable(merge(a,b)),stable(merge(b,a)));
 assert.equal(stable(merge(merge(a,b),b)),stable(merge(a,b)));
});
test('independent attempts and history survive merging from both devices',()=>{
 const a={session:attempt(),history:[{id:'old',week:1,total:8,first:3,checked:5,at:'2026-11-01',answers:{0:2}}]};
 const b={session:attempt({id:'b',startedAt:200}),history:a.history};
 const result=merge(a,b);
 assert.equal(result.session.id,'b');assert.equal(result.archivedSessions[0].id,'a');
 assert.equal(result.history.length,1);assert.equal(result.history[0].answers[0],2);
});
test('legacy attempts receive stable identities; malformed remote records are rejected',()=>{
 const old=attempt();delete old.id;delete old.updatedAt;delete old.startedAt;
 assert.equal(normalize({session:old}).session.id,normalize({session:old}).session.id);
 for(const bad of [null,[],{history:{}},{session:attempt({ids:[999]})},{session:attempt({phase:'bad'})}])assert.throws(()=>normalize(bad));
});

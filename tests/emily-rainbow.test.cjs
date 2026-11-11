const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','emily-rainbow.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
test('Rainbow Rescue script parses',()=>{assert.ok(script);new vm.Script(script)});
test('Rainbow Rescue includes six valid varied challenges',()=>{
 const context={localStorage:{getItem:()=>null},document:{getElementById:()=>({})}};
 vm.createContext(context);
 vm.runInContext(script.replace(/if\(state\.step>0\)begin\(\);/,'')+';globalThis.challengeData=steps;',context);
 const steps=context.challengeData;
 assert.equal(steps.length,6);
 assert.ok(new Set(steps.map(x=>x.skill)).size>=5);
 for(const x of steps){assert.ok(x.q&&x.hint&&x.good);assert.ok(Number.isInteger(x.a)&&x.a>=0&&x.a<x.opts.length)}
});
test('Emily roadmap links to Rainbow Rescue',()=>{
 const roadmap=fs.readFileSync(path.join(__dirname,'..','emily.html'),'utf8');
 assert.match(roadmap,/href="\.\/emily-rainbow\.html"/);
});

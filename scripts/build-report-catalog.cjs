const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const run=(code,result)=>vm.runInNewContext(code+';JSON.parse(JSON.stringify('+result+'))',{}, {timeout:1000});
const snippet=(s,start,end)=>s.slice(s.indexOf(start),s.indexOf(end,s.indexOf(start)));
const plain=s=>s.replace(/<select\b[^>]*data-gap="(\d+)"[^>]*>[\s\S]*?<\/select>/g,'[Gap $1]').replace(/<(?:br|\/p|\/h[1-6]|\/section)[^>]*>/gi,'\n').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/[ \t]+/g,' ').replace(/\n\s*\n/g,'\n').trim();
const catalog={};const add=(a,id,q)=>{(catalog[a]??={})[id]=q};
const em=read('emily.html');const data=run(snippet(em,'const data=','const persistence='),'data');
const stories={};const intro=em.split("document.getElementById('intro').innerHTML=")[1].split(';\n')[0];
for(const [i,key] of ['english','english2','english3','wordWorkshop1'].entries())stories[key]=plain(run("const tab='english',englishLevel="+(i+1),intro));
for(const [set,qs] of Object.entries(data))for(const q of qs)add('worksheet-'+set,q.id,{prompt:q.q,options:q.choices||[],correctIndex:q.writing?null:q.correct,writing:!!q.writing,context:stories[set]||'',hint:q.hint,explanation:q.why||''});
const shop=run(snippet(em,'const shopLevels=','const shopKey='),'shopLevels');shop.forEach((qs,i)=>qs.forEach((q,j)=>add('shop',i+'-'+j,{prompt:q.q,options:q.opts,correctIndex:q.a})));
const cupcakes=run(snippet(em,'const cupcakeQuestions=','const cupcakeKey='),'cupcakeQuestions');cupcakes.forEach((q,i)=>add('cupcake',i,{prompt:q.q,context:q.scene,options:q.opts,correctIndex:q.a}));
const parcel=run(snippet(read('emily-parcel.js'),'const questions=','let state='),'questions');parcel.forEach((q,i)=>add('parcel',i,{prompt:q.q,context:q.scene,options:q.options,correctIndex:q.answer}));
const rainbow=run(snippet(read('emily-rainbow.html'),'const steps=','let state='),'steps');rainbow.forEach((q,i)=>add('rainbow',i,{prompt:q.q,context:q.story,options:q.opts,correctIndex:q.a}));
for(const [file,global,activity] of [['pony-data.js','PonyData','pony-friendship'],['garden-data.js','GardenData','garden-club']]){const d=run(read(file),global);for(const c of d.chapters)for(const q of c.questions)add(activity,q.id,{prompt:q.q,context:c.story+' '+(q.context||''),options:q.opts||[],correctIndex:q.a,writing:!!q.writing,skill:q.skill,outcome:q.outcome,diagram:q.diagram});}
add('pony-friendship','pony-writing',{prompt:'Which pony would you like to help? Write two sentences about what you would do.',writing:true});
const next=run(read('maths-next-set.js'),'AdventureNextSet');const maths=run(snippet(read('jason-maths.html'),'const data=','const learning=').replace('data.push(...AdventureNextSet.questions);',''),'data').concat(next.questions);maths.forEach((q,i)=>add('maths',i,{prompt:q.q,options:q.o,correctIndex:q.a,skill:q.topic,claims:q.claims||[],figure:q.figure,optionFigures:q.optionFigures,sourceNumber:q.sourceNumber}));
const thinking=run(read('thinking-data.js'),'ThinkingData');thinking.questions.forEach(q=>add('oc-thinking-pt1',q.id,{prompt:q.text,options:['A','B','C','D'],correctIndex:q.answer,image:q.image}));
const ja=read('jason.html'),constants=run(snippet(ja,'const answer1=','function readingContext'),'{answer1,answer2,qlines}');
for(const set of [1,2]){const html=ja.split('<section id="set'+set+'"')[1].split('</article>')[0];const context=plain(html.slice(html.indexOf('<article')));const opts=set===1?[...ja.split('<section id="set1"')[1].split('</article>')[1].matchAll(/<p>\s*([A-G]) ([\s\S]*?)<\/p>/g)].map(m=>plain(m[2])):[...html.matchAll(/<h3>([\s\S]*?)<\/h3>/g)].map(m=>plain(m[1]).replace(/^Text [A-D] — /,''));if(opts.length!==(set===1?7:4))throw Error('English options missing '+set+': '+opts.length);for(const id of set===1?[20,21,22,23,24,25]:[26,27,28,29,30,31,32,33])add('reading-set-'+set,id,{prompt:set===1?'Choose the sentence for gap '+id+' in The Secret Paths of City Animals.':constants.qlines.find(s=>s.startsWith(id+'.')),context,options:opts,correctIndex:'ABCDEFG'.indexOf(constants['answer'+set][id])});}
const dir=path.join(root,'report-assets');fs.mkdirSync(dir,{recursive:true});
for(const [activity,qs] of Object.entries(catalog))for(const [id,q] of Object.entries(qs)){
 if(q.figure){const name='maths-'+id+'.svg';fs.writeFileSync(path.join(dir,name),q.figure);q.image='report-assets/'+name;delete q.figure;}
 if(q.optionFigures){q.optionImages=q.optionFigures.map((svg,i)=>{const name='maths-'+id+'-option-'+i+'.svg';fs.writeFileSync(path.join(dir,name),svg);return 'report-assets/'+name});delete q.optionFigures;}
 if(q.diagram){const desc={ruler:'A stick starts at 3 cm and ends at 9 cm on the ruler.',mats:'Mat A: 2 rows of 4 equal squares. Mat B: 3 rows of 3 equal squares.',jugs:'Tall jug: 4 full cups. Short, wide jug: 6 full cups. Every cup is the same size.',scales:'Balanced scales: Rabbit equals 6 identical blocks. Bird equals 9 identical blocks.'}[q.diagram];if(desc)q.context+='\nDiagram: '+desc;delete q.diagram;}
}

const js='// Generated by scripts/build-report-catalog.cjs. Question content only; no learner records.\n(function(root){const catalog='+JSON.stringify(catalog)+';root.AdventureReportCatalog=catalog;if(typeof module!=="undefined")module.exports=catalog;})(globalThis);\n';fs.writeFileSync(path.join(root,'report-catalog.js'),js);
let worker=fs.readFileSync(path.join(root,'cloudflare/worker.js'),'utf8');const block='// BEGIN GENERATED REPORT CATALOG\nconst REPORT_CATALOG='+JSON.stringify(catalog)+';\n// END GENERATED REPORT CATALOG\n';worker=worker.includes('// BEGIN GENERATED REPORT CATALOG')?worker.replace(/\/\/ BEGIN GENERATED REPORT CATALOG[\s\S]*?\/\/ END GENERATED REPORT CATALOG\n/,block):worker+'\n'+block;fs.writeFileSync(path.join(root,'cloudflare/worker.js'),worker);

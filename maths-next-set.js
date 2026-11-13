(function(root){
 'use strict';
 const svg=(width,height,label,body)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}"><style>text{font-family:system-ui,sans-serif;fill:#24354b;font-size:18px}polygon,line,path,rect,circle{vector-effect:non-scaling-stroke}</style>${body}</svg>`;
 const text=(x,y,value,extra='')=>`<text x="${x}" y="${y}" ${extra}>${value}</text>`;
 const line=(x1,y1,x2,y2,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#344256" ${extra}/>`;
 const polygon=(points,fill='#aab8c8')=>`<polygon points="${points.map(p=>p.join(',')).join(' ')}" fill="${fill}" stroke="#344256" stroke-width="1.5"/>`;
 const petCounts=[12,40,48,24,18];
 let chart=text(70,22,'Number of children');
 for(let n=0;n<=60;n+=2){const y=285-n*4;chart+=line(70,y,530,y,`stroke-opacity="${n%10===0?'.5':'.18'}"`);if(n%10===0)chart+=text(58,y+5,n,'text-anchor="end"')}
 petCounts.forEach((n,i)=>{const x=96+i*87;chart+=`<rect x="${x}" y="${285-n*4}" width="44" height="${n*4}" fill="${i%2?'#9aa4ad':'#374151'}"/>`+text(x+22,310,i,'text-anchor="middle"')});chart+=line(70,285,530,285)+line(70,45,70,285)+text(300,344,'Number of pets','text-anchor="middle"');
 const graph=svg(570,360,'Bar graph. Pets 0: 12 children; 1: 40; 2: 48; 3: 24; 4: 18.',chart);
 const project=([x,y,z])=>[90+27*x-27*y,130+14*x+14*y-30*z];
 function cubes(points,white=false){
  const keys=new Set(points.map(p=>p.join(',')));let body='';
  for(const [x,y,z] of points.slice().sort((a,b)=>a[0]+a[1]+a[2]-b[0]-b[1]-b[2])){
   const isWhite=white||x+y+z<=1;
   const faces=[{next:[x,y,z+1],vertices:[[x,y,z+1],[x+1,y,z+1],[x+1,y+1,z+1],[x,y+1,z+1]],fill:isWhite?'#fff':'#8d9298'},
    {next:[x+1,y,z],vertices:[[x+1,y,z],[x+1,y+1,z],[x+1,y+1,z+1],[x+1,y,z+1]],fill:isWhite?'#f2f2f2':'#666d76'},
    {next:[x,y+1,z],vertices:[[x,y+1,z],[x+1,y+1,z],[x+1,y+1,z+1],[x,y+1,z+1]],fill:isWhite?'#ddd':'#4f5660'}];
   for(const face of faces)if(!keys.has(face.next.join(',')))body+=polygon(face.vertices.map(project),face.fill);
  }
  return body;
 }
 const allCubes=[];for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)allCubes.push([x,y,z]);
 const whitePiece=allCubes.filter(p=>p.reduce((a,b)=>a+b,0)<=1),greyPiece=allCubes.filter(p=>p.reduce((a,b)=>a+b,0)>1);
 const cubeFigure=svg(380,385,'A two-by-two-by-two cube separates into two four-cube corner pieces, one white and one grey.',`${text(190,24,'Together','text-anchor="middle"')}<g transform="translate(100,-15)">${cubes(allCubes)}</g>${line(190,184,190,211)}${polygon([[190,217],[185,207],[195,207]],'#344256')}<g transform="translate(0,160)">${cubes(whitePiece,true)}</g><g transform="translate(200,160)">${cubes(greyPiece)}</g>${text(90,370,'White piece','text-anchor="middle"')}${text(290,370,'Grey piece','text-anchor="middle"')}`);

 const originalTriangle=[[10,90],[90,90],[90,10]];
 const foldOutlines=[[[218,90],[270,90],[270,38]],[[190,90],[270,90],[270,50],[230,50]],[[190,90],[242,90],[242,38],[214,10],[214,66]],[[190,90],[270,90],[230,50]],[[190,90],[230,90],[230,50],[190,10]]];
 const foldLabels=['A smaller triangle facing the same direction','A trapezium with a flat top','A shape with an inward corner','A triangle with its top corner in the middle','A quadrilateral with a sloping top'];
 const optionFigures=foldOutlines.map((points,i)=>svg(300,110,foldLabels[i],polygon(originalTriangle)+line(114,53,155,53)+polygon([[155,53],[146,48],[146,58]],'#344256')+polygon(points)));
 const triangleFigure=svg(150,120,'The original right-angled triangle, with a horizontal base and vertical right side.',polygon([[25,100],[115,100],[115,10]]));
 let perimeter='';
 for(let i=0;i<4;i++)for(let j=0;j<3;j++)perimeter+=`<rect x="${110+i*45}" y="${110+j*45}" width="45" height="45" fill="#f5f8ff" stroke="#65758a"/>`;
 for(const [label,x,y] of [['P',110,65],['Q',290,110],['R',290,200],['S',155,245]])perimeter+=`<rect x="${x}" y="${y}" width="90" height="45" fill="none" stroke="#344256" stroke-dasharray="5 3"/>`+text(x+45,y+28,label,'text-anchor="middle"');
 perimeter+=line(110,35,290,35)+line(110,30,110,40)+line(290,30,290,40)+text(200,26,'4 cm','text-anchor="middle"')+line(65,110,65,245)+line(60,110,70,110)+line(60,245,70,245)+text(55,183,'3 cm','text-anchor="end"');
 const perimeterFigure=svg(415,320,'A four-by-three centimetre grid rectangle. Positions P and S share a two-centimetre edge. Positions Q and R share a one-centimetre edge.',perimeter);
 let counters='';for(let i=1;i<=11;i++){const x=40+((i-1)%6)*49+(i>6?24:0),y=i<=6?35:84;counters+=`<circle cx="${x}" cy="${y}" r="20" fill="#eef2f7" stroke="#65758a"/>`+text(x,y+5,i,'text-anchor="middle"')}
 const countersFigure=svg(330,116,'Eleven counters numbered one through eleven, one of each number.',counters);
 const pentagon=svg(230,180,'A regular pentagon with five equal sides.',polygon(Array.from({length:5},(_,i)=>{const angle=(-126+i*72)*Math.PI/180;return [115+75*Math.cos(angle),85+75*Math.sin(angle)]}),'#fff'));
 let ruler='<rect x="25" y="45" width="365" height="62" fill="#e1e6ec" stroke="#65758a"/>';
 for(const n of [0,2,3,7]){const x=45+n*45;ruler+=line(x,48,x,86)+text(x,102,n===0?'0 cm':n,'text-anchor="middle"')}
 ruler+=line(135,29,180,29)+polygon([[135,29],[142,25],[142,33]],'#344256')+polygon([[180,29],[173,25],[173,33]],'#344256')+text(157,20,'1 cm','text-anchor="middle"');
 const rulerFigure=svg(420,125,'An old ruler with marks only at zero, two, three and seven centimetres. The gap between two and three is one centimetre.',ruler);
 const questions=[
  {sourceNumber:27,topic:'Reading a graph',q:'A group of children were asked how many pets they had at home. The graph shows the results. Mary makes these three claims. Which of her claims is correct?',figure:graph,claims:['More than 100 children had 1 or 2 pets.','Exactly three times as many children had 2 pets as 0 pets.','There were 24 more children with 2 pets than children with 3 pets.'],o:['Claim 1 only','Claim 2 only','Claim 3 only','Claims 1 and 2','Claims 2 and 3'],a:2,why:'Claim 1: 40 + 48 = 88, which is less than 100. Claim 2: 3 × 12 = 36, not 48. Claim 3: 48 − 24 = 24. Only claim 3 is correct.'},
  {sourceNumber:28,topic:'Cube faces',q:'Amanda has a large cube made from four small grey cubes and four small white cubes. Looking from all directions, she can see 24 small-square faces. She separates it into the two equal objects shown. Looking at both pieces from all directions, how many small-square faces can she see now?',figure:cubeFigure,o:['24','30','36','40','48'],a:2,why:'Each piece has 4 cubes: 4 × 6 = 24 faces before joining. In each piece, 3 touching pairs hide 6 faces, leaving 18. Both pieces together have 18 + 18 = 36 visible faces.'},
  {sourceNumber:29,topic:'Sharing strawberries',q:'Jack and Sarah had 12 strawberries. They ate all of them. Sarah ate twice as many strawberries as Jack. How many strawberries did Sarah eat?',o:['3','4','6','8','24'],a:3,why:'Share the strawberries into 3 equal parts: 1 part for Jack and 2 for Sarah. Each part is 12 ÷ 3 = 4. Sarah ate 2 × 4 = 8.'},
  {sourceNumber:30,topic:'Folding a triangle',q:'Peter starts with a triangle of paper, as shown. He makes just one fold, without moving the paper in any other way. Which shape could NOT be the result?',figure:triangleFigure,o:['Shape A','Shape B','Shape C','Shape D','Shape E'],optionFigures,a:0,why:'Shape A is a much smaller triangle in the same direction. It covers less than half the original area. One fold makes at most two layers, so the outline must cover at least half the original paper. The other outlines can be made by folding a corner or side.'},
  {sourceNumber:31,topic:'Perimeter',q:'Ethan draws a rectangle 4 cm long and 3 cm wide. He adds a paper rectangle 2 cm long and 1 cm wide in position P, Q, R or S. He wants the new perimeter to be 4 cm more than the starting perimeter. Which positions are possible?',figure:perimeterFigure,o:['P and Q only','P and S only','Q and R only','R and S only','P, Q, R and S'],a:2,why:'The small rectangle has perimeter 6 cm. Joining along 1 cm hides 1 cm on each shape, so the increase is 6 − 2 = 4 cm. Q and R each share a 1 cm edge. P and S share 2 cm, so they increase the perimeter by only 2 cm.'},
  {sourceNumber:32,topic:'Points and costs',q:'I am playing a computer game and have 1000 points. I buy 5 buildings, each costing 106 points, and 1 farm. I have 140 points left. How many points did the farm cost?',o:['330','356','470','610','754'],a:0,why:'The buildings cost 5 × 106 = 530 points. The farm cost 1000 − 530 − 140 = 330 points.'},
  {sourceNumber:33,topic:'Chance',q:'Jess has eleven counters, numbered 1 to 11. Without looking, she takes one counter at random. Which statements are correct?',figure:countersFigure,claims:['Jess is equally likely to take an even number or an odd number.','Jess is more likely to take a number greater than 6 than a number less than 6.','Jess is equally likely to take the number 2 or the number 9.'],o:['Statement 2 only','Statement 3 only','Statements 1 and 2 only','Statements 1 and 3 only','Statements 1, 2 and 3'],a:1,why:'There are 6 odd numbers and 5 even numbers, so statement 1 is false. There are 5 numbers greater than 6 and 5 less than 6, so statement 2 is false. There is one counter marked 2 and one marked 9, so statement 3 is true.'},
  {sourceNumber:34,topic:'Cutting a pentagon',q:'Bruce has a regular pentagon. He makes one straight-line cut to divide it into two shapes. Which combinations can he make?',figure:pentagon,claims:['X: A triangle and a hexagon','Y: Two quadrilaterals','Z: A quadrilateral and a pentagon'],o:['X only','Y only','X and Z only','Y and Z only','X, Y and Z'],a:4,why:'X: Cut off a corner through two neighbouring sides to make a triangle and a hexagon. Y: Cut from a vertex to the opposite side to make two quadrilaterals. Z: Cut through two non-neighbouring sides to make a quadrilateral and a pentagon. All three are possible.'},
  {sourceNumber:35,topic:'Measuring with a ruler',q:'My old ruler has marks only at 0, 2, 3 and 7 centimetres. I can draw a 1 cm line between 2 and 3. Which length can I NOT draw accurately between two marks, without moving the ruler?',figure:rulerFigure,o:['3 cm','4 cm','5 cm','6 cm','7 cm'],a:3,why:'The available gaps are 1, 2, 3, 4, 5 and 7 cm. For example, 7 − 3 = 4 and 7 − 2 = 5. No pair of marks is 6 cm apart.'}
 ];
 root.AdventureNextSet={questions,petCounts,whitePiece,greyPiece,foldOutlines};
 if(typeof module!=='undefined')module.exports=root.AdventureNextSet;
})(globalThis);

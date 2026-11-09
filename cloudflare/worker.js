// Deploy as a Cloudflare Worker. Configure secrets: GITHUB_TOKEN, FAMILY_PIN.
// Set ALLOWED_ORIGIN to https://yuchao-jiang.github.io and optionally REPO.
const REPO='yuchao-jiang/learning-adventure';
export default {async fetch(request,env){
 const origin=request.headers.get('Origin')||'';
 const allowed=env.ALLOWED_ORIGIN||'https://yuchao-jiang.github.io';
 const headers={'Access-Control-Allow-Origin':allowed,'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,X-Family-Pin','Cache-Control':'no-store','Vary':'Origin'};
 const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...headers,'Content-Type':'application/json'}});
 if(origin && origin!==allowed)return reply({error:'Origin not allowed'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 const url=new URL(request.url),child=url.searchParams.get('child');
 if(!['emily','jason'].includes(child))return reply({error:'Unknown learner'},400);
 if(!['GET','POST'].includes(request.method))return reply({error:'Method not allowed'},405);
 if(request.method==='POST'){
   if(!env.GITHUB_TOKEN||!env.FAMILY_PIN)return reply({error:'Worker not configured'},503);
   const pin=request.headers.get('X-Family-Pin')||'';
   if(pin.length<4||pin.length>64||pin!==env.FAMILY_PIN)return reply({error:'Incorrect family PIN'},401);
   const length=Number(request.headers.get('Content-Length')||0);
   if(length>100000)return reply({error:'Save too large'},413);
 }
 const repo=env.REPO||REPO,path='data/'+child+'.json';
 const api='https://api.github.com/repos/'+repo+'/contents/'+path;
 const ghHeaders={'Accept':'application/vnd.github+json','User-Agent':'learning-adventure-sync','X-GitHub-Api-Version':'2022-11-28',...(env.GITHUB_TOKEN?{'Authorization':'Bearer '+env.GITHUB_TOKEN}:{})};
 const read=await fetch(api,{headers:ghHeaders,cf:{cacheTtl:0}});
 let current=null;
 if(read.ok){current=await read.json()}else if(read.status!==404){return reply({error:'Unable to read saved progress'},502)}
 if(request.method==='GET'){
   if(!current)return reply({exists:false,data:null});
   try{const raw=Uint8Array.from(atob(current.content.replace(/\s/g,'')),c=>c.charCodeAt(0));return reply({exists:true,data:JSON.parse(new TextDecoder().decode(raw)),sha:current.sha})}catch{return reply({error:'Invalid saved progress'},502)}
 }
 let payload;
 try{const raw=await request.text();if(raw.length>100000)return reply({error:'Save too large'},413);payload=JSON.parse(raw)}catch{return reply({error:'Invalid JSON'},400)}
 if(!payload||payload.version!==1||payload.child!==child||typeof payload.data!=='object'||payload.data===null||Array.isArray(payload.data))return reply({error:'Invalid save format'},400);
 if(current && payload.sha!==current.sha)return reply({error:'Newer cloud save found. Load it before saving again.',code:'CONFLICT'},409);
 if(!current && payload.sha)return reply({error:'Cloud save changed. Load again.',code:'CONFLICT'},409);
 const content=JSON.stringify({version:1,child,data:payload.data,updatedAt:new Date().toISOString()},null,2);
 const bytes=new TextEncoder().encode(content);
 let binary='';for(const b of bytes)binary+=String.fromCharCode(b);
 const write=await fetch(api,{method:'PUT',headers:{...ghHeaders,'Content-Type':'application/json'},body:JSON.stringify({message:'Save '+child+' learning progress',content:btoa(binary),...(current?{sha:current.sha}:{})})});
 if(!write.ok)return reply({error:write.status===409?'Save conflict; load again':'Unable to save progress'},write.status===409?409:502);
 const result=await write.json();return reply({ok:true,sha:result.content?.sha});
}};
import './schedule_presets.js';

// Mount inside the existing authenticated Worker, not a separate service.
export async function handlePresetRequest(request,env,{requireAuth,jsonResponse,githubHeaders}){
  const pathname=new URL(request.url).pathname;
  if(pathname !== '/api/presets' || !['GET','PUT'].includes(request.method)) return null;
  const reply=(body,status=200)=>jsonResponse(request,env,body,status,{'Cache-Control':'no-store'});
  if(request.method==='PUT' && !(await requireAuth(request,env))) return reply({error:'인증이 만료되었습니다.'},401);
  try {
    if(!env.GITHUB_TOKEN) throw new Error('Missing GitHub credentials');
    let incoming=[];
    if(request.method==='PUT'){
      const text=await request.text();
      if(new TextEncoder().encode(text).length>32768) return reply({error:'프리셋이 너무 큽니다.'},413);
      const parsed=JSON.parse(text);
      if(!Array.isArray(parsed.presets) || parsed.presets.length>10 || parsed.presets.some(p=>!p || typeof p.title!=='string' || !p.title.trim())) return reply({error:'올바르지 않은 프리셋입니다.'},400);
      incoming=globalThis.SCHEDULE_PRESETS.merge(parsed.presets);
    }
    const url=`https://api.github.com/repos/${env.GITHUB_OWNER || 'crank-schedule'}/${env.GITHUB_REPO || 'Calendar'}/contents/data/admin-presets.json`;
    const headers=githubHeaders(env);
    for(let attempt=0;attempt<3;attempt++){
      const existing=await fetch(url,{headers,cache:'no-store'});
      let sha, stored=[];
      if(existing.ok){
        const data=await existing.json(); sha=data.sha;
        const bytes=Uint8Array.from(atob(data.content.replace(/\s/g,'')),c=>c.charCodeAt(0));
        stored=JSON.parse(new TextDecoder().decode(bytes)).presets;
      } else if(existing.status!==404) throw new Error('GitHub lookup failed');
      const presets=globalThis.SCHEDULE_PRESETS.merge(stored,incoming);
      if(request.method==='GET') return reply({version:1,presets});
      const content=JSON.stringify({version:1,presets,updatedAt:new Date().toISOString()},null,2)+'\n';
      const binary=Array.from(new TextEncoder().encode(content),b=>String.fromCharCode(b)).join('');
      const saved=await fetch(url,{method:'PUT',headers,body:JSON.stringify({message:'Update shared admin presets',content:btoa(binary),...(sha?{sha}:{})})});
      if(saved.ok) return reply({version:1,presets});
      if(saved.status!==409 && saved.status!==422) throw new Error('GitHub save failed');
    }
    return reply({error:'다른 기기의 저장과 겹쳤습니다. 다시 시도해주세요.'},409);
  } catch(error){
    return reply({error:error instanceof SyntaxError ? '올바르지 않은 JSON입니다.' : '공유 프리셋 연결에 실패했습니다.'},error instanceof SyntaxError ? 400 : 502);
  }
}

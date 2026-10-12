const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const context=vm.createContext({window:{},AbortController,setTimeout,clearTimeout});
vm.runInContext(fs.readFileSync(path.join(root,'schedule_presets.js'),'utf8'),context);
const merge=(...lists)=>JSON.parse(JSON.stringify(context.window.SCHEDULE_PRESETS.merge(...lists)));
test('recent presets cap at 10 and retain latest title, time and icon',()=>{
  const old=Array.from({length:15},(_,i)=>({title:'Game '+i,time:'9PM',usedAt:i}));
  const items=merge(old,[{title:'Game 14',time:'',icon:'war3',usedAt:20}]);
  assert.equal(items.length,10); assert.equal(items[0].title,'Game 14');
  assert.equal(items[0].time,''); assert.equal(items[0].icon,'war3');
});
test('stale device does not overwrite newer remote time and legacy local presets take precedence over seed',()=>{
  assert.equal(merge([{title:'Game',time:'9PM',usedAt:20}],[{title:'Game',time:'6PM',usedAt:10}])[0].time,'9PM');
  const seed=Array.from({length:10},(_,i)=>({title:'Seed '+i}));
  assert.equal(merge(seed,[{title:'My recent',time:'8PM'}])[0].title,'My recent');
});
test('recent presets occupy the left pane without an inner scrollbar; default presets remain collapsed',()=>{
  const html=fs.readFileSync(path.join(root,'admin.html'),'utf8');
  assert.ok(html.indexOf('id="presets"')<html.indexOf('id="editArea"'));
  assert.match(html,/<details class="editor-default-presets">/);
  const css=fs.readFileSync(path.join(root,'admin_editor.css'),'utf8');
  assert.match(css,/#overlay \.presets \{[^}]*max-height:none; overflow:visible/);
  for(const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(script[1]);
});
test('Worker refuses unauthenticated writes before accessing GitHub',async()=>{
  const {handlePresetRequest}=await import('../preset-route.mjs');
  const result=await handlePresetRequest(new Request('https://worker.example/api/presets',{method:'PUT',body:'{}'}),{}, {
    requireAuth:async()=>false,jsonResponse:(req,env,data,status)=>new Response(JSON.stringify(data),{status}), githubHeaders:()=>{throw new Error('must not access GitHub');},
  });
  assert.equal(result.status,401);
});
test('network rejection falls back to GitHub JSON rather than abandoning loading',async()=>{
  const calls=[];
  const result=await context.window.SCHEDULE_PRESETS.load({workerUrl:'worker',staticUrl:'static',fetchImpl:async url=>{
    calls.push(url);
    if(url==='worker') throw new TypeError('Failed to fetch');
    return {ok:true,json:async()=>({presets:[{title:'Fallback',time:'9PM'}]})};
  }});
  assert.deepEqual(calls,['worker','static']); assert.equal(result.live,false); assert.equal(result.presets[0].time,'9PM');
});
test('timeout abort falls back and a later retry can read the live server',async()=>{
  const result=await context.window.SCHEDULE_PRESETS.load({workerUrl:'worker',staticUrl:'static',timeoutMs:5,fetchImpl:async(url,{signal})=>{
    if(url==='worker') return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('timed out'))));
    return {ok:true,json:async()=>({presets:[]})};
  }});
  assert.equal(result.live,false);
  const retried=await context.window.SCHEDULE_PRESETS.load({workerUrl:'worker',staticUrl:'static',fetchImpl:async()=>({ok:true,json:async()=>({presets:[{title:'Live'}]})})});
  assert.equal(retried.live,true);
});
test('invalid API JSON also falls back; retry handler reconnects before pending writes',async()=>{
  const result=await context.window.SCHEDULE_PRESETS.load({workerUrl:'worker',staticUrl:'static',fetchImpl:async url=>({ok:true,json:async()=>url==='worker'?{}:{presets:[]}})});
  assert.equal(result.live,false);
  const html=fs.readFileSync(path.join(root,'admin.html'),'utf8');
  const handler=html.slice(html.indexOf("document.getElementById('retryPresetSync').addEventListener"),html.indexOf('function editorDateKey('));
  assert.match(handler,/void loadSharedPresets\(\)/); assert.ok(!handler.includes('queuePresetSync()'));
});
test('Worker re-reads and merges after a concurrent GitHub write conflict',async()=>{
  const {handlePresetRequest}=await import('../preset-route.mjs');
  const original=global.fetch; let writes=0,reads=0;
  const encoded=presets=>Buffer.from(JSON.stringify({presets})).toString('base64');
  global.fetch=async(url,options)=>{
    if(options.method==='PUT'){
      writes++;
      if(writes===1) return new Response('',{status:409});
      const saved=JSON.parse(Buffer.from(JSON.parse(options.body).content,'base64').toString());
      assert.ok(saved.presets.some(p=>p.title==='Other device'));
      assert.equal(saved.presets.find(p=>p.title==='Game').time,'9PM');
      return new Response('{}');
    }
    reads++;
    return new Response(JSON.stringify({sha:'sha'+reads,content:encoded(reads===1 ? [] : [{title:'Other device',usedAt:30},{title:'Game',time:'6PM',usedAt:10}])}));
  };
  try{
    const res=await handlePresetRequest(new Request('https://worker.example/api/presets',{method:'PUT',body:JSON.stringify({presets:[{title:'Game',time:'9PM',usedAt:20}]})}),{GITHUB_TOKEN:'test'}, {
      requireAuth:async()=>true,jsonResponse:(req,env,data,status)=>new Response(JSON.stringify(data),{status}),githubHeaders:()=>({}),
    });
    assert.equal(res.status,200); assert.equal(reads,2); assert.equal(writes,2);
  } finally {global.fetch=original;}
});

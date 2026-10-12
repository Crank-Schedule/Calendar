const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'admin.html'),'utf8');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function fixture({load,blocked=false}={}){
  const storage=new Map(), elements=new Map(), jobs=[];
  const c=vm.createContext({window:{},Date,Promise,JSON,AbortController,setTimeout,clearTimeout,console:{warn(){}},
    localStorage:{getItem:key=>{if(blocked===true)throw Error('blocked');return storage.get(key)||null;},setItem:(key,value)=>{if(blocked)throw Error('quota');storage.set(key,value);},removeItem:key=>{if(blocked)throw Error('blocked');storage.delete(key);}},
    document:{getElementById:id=>{if(!elements.has(id))elements.set(id,{});return elements.get(id);}},
    WORKER_URL:'https://worker.test',getSession:()=>({}),
    monthSaveQueue:{enqueue:(key,body)=>{jobs.push({key,body});return Promise.resolve(true);}},buildPresets(){},
  });
  vm.runInContext(fs.readFileSync(path.join(root,'schedule_presets.js'),'utf8'),c);
  c.window.SCHEDULE_PRESETS.load=load || (async()=>({live:true,presets:[]}));
  vm.runInContext(html.slice(html.indexOf('let sharedPresets ='),html.indexOf('function buildPresets(){')),c);
  return {c,storage,elements,jobs};
}
test('a delayed GET cannot replace a newer successfully saved preset snapshot',async()=>{
  let resolveRead;
  const {c}=fixture({load:()=>new Promise(resolve=>{resolveRead=resolve;})});
  const loading=c.loadSharedPresets(); await flush();
  const saved=c.window.SCHEDULE_PRESETS.merge([{title:'Saved latest',time:'9PM',usedAt:20}]);
  c.acceptSavedPresets(JSON.stringify({presets:saved}),{presets:saved});
  resolveRead({live:true,presets:[{title:'Stale read',usedAt:10}]}); await loading;
  assert.equal(c.readRecentPresets()[0].title,'Saved latest');
});
test('blocked local storage still retains and queues unsaved presets in memory',()=>{
  const {c,jobs}=fixture({blocked:true});
  c.storePendingPresets([{title:'Retained',time:'9PM',usedAt:10}]);
  c.queuePresetSync();
  assert.equal(c.readPendingPresets()[0].title,'Retained');
  assert.equal(JSON.parse(jobs[0].body).presets[0].time,'9PM');
  c.acceptSavedPresets(jobs[0].body,{presets:c.readPendingPresets()});
  assert.equal(c.readPendingPresets().length,0);
  assert.equal(c.readRecentPresets()[0].title,'Retained');
});
test('refresh failure is throttled by last attempt rather than the last successful read',async()=>{
  const {c}=fixture({load:async()=>{throw Error('offline');}});
  const before=Date.now(); await c.loadSharedPresets();
  assert.ok(vm.runInContext('presetLastAttemptAt',c)>=before);
  const build=html.slice(html.indexOf('function buildPresets(){'),html.indexOf("  const query = document.getElementById('presetSearch')",html.indexOf('function buildPresets(){')));
  assert.ok(build.includes('presetLastAttemptAt'));
  assert.ok(!build.includes('Date.now()-presetLoadedAt'));
});
test('storage quota failure does not substitute stale readable disk data for the latest in-memory edit',()=>{
  const {c,storage}=fixture({blocked:'writes'});
  storage.set('crank_presets_pending_items','[]');
  c.storePendingPresets([{title:'Quota retained',usedAt:20}]);
  assert.equal(c.readPendingPresets()[0].title,'Quota retained');
});
test('a stale failed GET cannot replace the success status of a newer save',async()=>{
  let rejectRead;
  const {c,elements}=fixture({load:()=>new Promise((resolve,reject)=>{rejectRead=reject;})});
  const loading=c.loadSharedPresets();await flush();
  c.acceptSavedPresets('{"presets":[]}',{presets:[]});
  rejectRead(new Error('offline'));await loading;
  assert.equal(elements.get('presetSyncStatus').textContent,'공유 저장 완료 · 다른 기기에서도 사용');
});
test('repeated loads coalesce into one request and failed load can be retried',async()=>{
  let calls=0,resolveRead;
  const {c}=fixture({load:()=>{calls++;return new Promise(resolve=>{resolveRead=resolve;});}});
  const one=c.loadSharedPresets(),two=c.loadSharedPresets();
  assert.equal(one,two); await flush(); assert.equal(calls,1);
  resolveRead({live:true,presets:[]}); await one;
  const next=c.loadSharedPresets();await flush();assert.equal(calls,2);
  resolveRead({live:true,presets:[]});await next;
});

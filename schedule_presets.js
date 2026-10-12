// One canonical, bounded recent list across local and shared snapshots.
(function(root){
  function merge(...lists){
    const entries = new Map();
    for(const [priority,list] of lists.entries()) for(const value of Array.isArray(list) ? list : []){
      if(!value || typeof value.title !== 'string' || !value.title.trim()) continue;
      const item = {title:value.title.trim().slice(0,500), color:/^#[0-9a-f]{6}$/i.test(value.color) ? value.color : '#bb99ff', icon:typeof value.icon === 'string' ? value.icon.slice(0,40) : 'auto', time:typeof value.time === 'string' ? value.time.trim().slice(0,30) : '', usedAt:Number.isFinite(value.usedAt) && value.usedAt >= 0 ? value.usedAt : 0};
      const previous = entries.get(item.title);
      if(!previous || item.usedAt >= previous.item.usedAt) entries.set(item.title,{item,priority});
    }
    return [...entries.values()].sort((a,b)=>b.item.usedAt-a.item.usedAt || b.priority-a.priority).slice(0,10).map(value=>value.item);
  }
  async function load({workerUrl,staticUrl,fetchImpl=fetch,timeoutMs=12000}){
    async function read(url){
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),timeoutMs);
      try {
        const response=await fetchImpl(url,{cache:'no-store',signal:controller.signal});
        if(!response.ok) throw new Error(`HTTP ${response.status}`);
        const data=await response.json();
        if(!data || !Array.isArray(data.presets)) throw new Error('Invalid preset data');
        return merge(data.presets);
      } finally {clearTimeout(timer);}
    }
    try { return {presets:await read(workerUrl),live:true}; }
    catch(workerError){
      try { return {presets:await read(staticUrl),live:false}; }
      catch(_) {throw workerError;}
    }
  }
  function select({shared,local,pending,ready}){
    // Local cache is only a fallback. Only explicit unsaved edits may augment the server list.
    return ready ? merge(shared,pending) : merge(local,pending);
  }
  function acknowledge(pending,sent){
    return merge(pending).filter(item=>!sent.some(saved=>JSON.stringify(saved)===JSON.stringify(item)));
  }
  root.SCHEDULE_PRESETS = {merge,load,select,acknowledge};
})(typeof window === 'undefined' ? globalThis : window);

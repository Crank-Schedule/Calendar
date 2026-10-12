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
  root.SCHEDULE_PRESETS = {merge};
})(typeof window === 'undefined' ? globalThis : window);

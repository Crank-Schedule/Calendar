window.SCHEDULE_EDITOR_UTILS = {
  normalizeTime(value) {
    const text = String(value || '').trim();
    const twelve = text.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
    if(twelve && +twelve[1] >= 1 && +twelve[1] <= 12 && +(twelve[2] || 0) < 60) {
      return `${+twelve[1]}${+twelve[2] ? ':' + twelve[2] : ''}${twelve[3].toUpperCase()}`;
    }
    const twentyFour = text.match(/^(\d{1,2}):(\d{2})$/);
    if(twentyFour && +twentyFour[1] <= 23 && +twentyFour[2] < 60) {
      const hour = +twentyFour[1];
      return `${hour % 12 || 12}${+twentyFour[2] ? ':' + twentyFour[2] : ''}${hour >= 12 ? 'PM' : 'AM'}`;
    }
    return text;
  },
  validReplayLink(value) {
    if(!String(value || '').trim()) return true;
    try { return ['http:', 'https:'].includes(new URL(String(value).trim()).protocol); }
    catch(_) { return false; }
  },
  createHistory(limit = 25) {
    const dates = new Map();
    const get = key => {
      if(!dates.has(key)) dates.set(key, {past:[], future:[]});
      return dates.get(key);
    };
    return {
      record(key, previous) {
        const history = get(key);
        history.past.push(JSON.stringify(previous));
        history.past = history.past.slice(-limit);
        history.future = [];
      },
      undo(key, current) {
        const history = get(key);
        if(!history.past.length) return null;
        history.future.push(JSON.stringify(current));
        return JSON.parse(history.past.pop());
      },
      redo(key, current) {
        const history = get(key);
        if(!history.future.length) return null;
        history.past.push(JSON.stringify(current));
        return JSON.parse(history.future.pop());
      },
      canUndo(key) { return get(key).past.length > 0; },
      canRedo(key) { return get(key).future.length > 0; },
    };
  },
};

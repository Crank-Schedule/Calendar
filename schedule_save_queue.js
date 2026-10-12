// Serialize GitHub writes and combine edits made before the next request starts.
window.SCHEDULE_SAVE_QUEUE = {
  create({ send, onSaved, onError, onSaving }) {
    const pending = new Map();
    let active = null;
    let timer = null;

    async function drain() {
      if (active || !pending.size) return;
      clearTimeout(timer);
      timer = null;
      const [key, job] = pending.entries().next().value;
      pending.delete(key);
      active = { key, ...job };
      let success = false;
      try {
        onSaving?.(key);
        const result = await send(key, job.body);
        onSaved?.(key, job.body, result);
        success = true;
      } catch (error) {
        onError?.(key, error);
      } finally {
        const completed = active;
        active = null;
        completed.waiters.forEach(resolve => resolve(success));
        if (pending.size) void drain();
      }
    }

    return {
      enqueue(key, body, delay = 0) {
        return new Promise(resolve => {
          if (active?.key === key && active.body === body && !pending.has(key)) {
            active.waiters.push(resolve);
            return;
          }
          const job = pending.get(key) || { waiters: [] };
          job.body = body;
          job.waiters.push(resolve);
          pending.set(key, job);
          if (!active) {
            clearTimeout(timer);
            if (delay) timer = setTimeout(drain, delay);
            else void drain();
          }
        });
      },
      hasPending(key) { return active?.key === key || pending.has(key); },
    };
  },
};

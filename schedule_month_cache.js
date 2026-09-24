// Persist the last successfully fetched month for an immediate first paint on repeat visits.
window.SCHEDULE_MONTH_CACHE = (() => {
  const prefix = 'crank_month_v1:';
  function read(key) {
    try {
      const value = JSON.parse(localStorage.getItem(prefix + key) || 'null');
      return value && value.data && typeof value.data === 'object' ? value.data : null;
    } catch (_) { return null; }
  }
  function write(key, data) {
    try { localStorage.setItem(prefix + key, JSON.stringify({ data, ts: Date.now() })); }
    catch (_) { /* Storage may be full or disabled. */ }
  }
  return { read, write };
})();

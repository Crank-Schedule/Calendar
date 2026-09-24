const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

for (const page of ['crank_schedule.html', 'admin.html']) {
  test(`${page}: a failed replay provider retries without losing other links`, async () => {
    const html = fs.readFileSync(path.join(__dirname, '..', page), 'utf8');
    const start = html.indexOf('let replayDateMapPromise = null;');
    const end = html.indexOf(
      page === 'admin.html' ? 'function getSession()' : 'async function renderCalendarMonth()',
      start
    );
    assert.ok(start >= 0 && end > start);

    let youtubeCalls = 0;
    const timers = new Map();
    let nextTimerId = 1;
    const listeners = {};
    const context = vm.createContext({
      YT_CHANNELS: [{ key: 'replay' }],
      WORKER_URL: 'https://example.test',
      fetchLatestVideos: async () => {
        youtubeCalls++;
        if (youtubeCalls === 1) throw new Error('temporary YouTube outage');
        return [{ title: 'replay', url: 'https://youtube.test/replay' }];
      },
      fetch: async () => ({
        ok: true,
        json: async () => ({ content: { data: [{ videoNo: 123, thumbnailImageUrl: 'https://example.test/thumb' }] } }),
      }),
      replayDateKeyFromChzzk: () => '2026-9-1',
      replayDateKeyFromTitle: () => '2026-9-1',
      setTimeout: (callback) => {
        const id = nextTimerId++;
        timers.set(id, callback);
        return id;
      },
      clearTimeout: id => timers.delete(id),
      window: { addEventListener: (name, callback) => { listeners[name] = callback; } },
    });
    vm.runInContext(html.slice(start, end), context);
    const settle = () => new Promise(resolve => setImmediate(resolve));

    vm.runInContext('replayRefreshCallbacks.push(map => { globalThis.lastReplayMap = map; }); loadReplaysAfterSchedule();', context);
    await settle();
    assert.equal(context.lastReplayMap['2026-9-1'].source, 'chzzk');
    assert.equal(timers.size, 1);

    const retry = timers.values().next().value;
    timers.clear();
    retry();
    await settle();
    assert.equal(youtubeCalls, 2);
    assert.equal(context.lastReplayMap['2026-9-1'].source, 'youtube');
    assert.equal(timers.size, 0);
    assert.equal(vm.runInContext('replayRetryCount', context), 0);
    assert.equal(typeof listeners.online, 'function');
  });
}

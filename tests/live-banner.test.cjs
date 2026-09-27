const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

for (const page of ['crank_schedule.html', 'admin.html']) {
  test(`${page}: live banner closes on failed checks and hidden tabs`, async () => {
    const html = fs.readFileSync(path.join(__dirname, '..', page), 'utf8');
    const start = html.indexOf('// ===== 치지직 라이브 배너 =====');
    const lastLine = "window.addEventListener('online', checkChzzkLive);";
    const end = html.indexOf(lastLine, start) + lastLine.length;
    assert.ok(start >= 0 && end > start);

    const classes = () => {
      const values = new Set();
      return {
        add: name => values.add(name),
        remove: name => values.delete(name),
        contains: name => values.has(name),
      };
    };
    const banner = { classList: classes(), title: '' };
    const thumb = { hidden: true, src: '' };
    const title = { textContent: '' };
    const body = { classList: classes() };
    const listeners = {};
    let shouldFail = false;
    let reportedStatus = 'OPEN';
    let holdNextResponse = false;
    let releaseHeldResponse;
    let requestedUrl = '';
    const document = {
      hidden: false,
      body,
      documentElement: { style: { setProperty() {} } },
      getElementById(id) { return { liveBanner: banner, lbThumb: thumb, lbTitle: title }[id]; },
      addEventListener(name, callback) { listeners[name] = callback; },
    };
    const context = vm.createContext({
      document,
      window: { addEventListener(name, callback) { listeners[name] = callback; } },
      location: { search: '' },
      URLSearchParams,
      AbortController,
      WORKER_URL: 'https://example.test',
      chzzkLiveOpen: false,
      chzzkLiveImageUrl: '',
      fetch: async (url, options) => {
        requestedUrl = url;
        assert.equal(options.cache, 'no-store');
        if (shouldFail) throw new Error('temporary outage');
        if (holdNextResponse) {
          holdNextResponse = false;
          return new Promise(resolve => { releaseHeldResponse = resolve; });
        }
        return { ok: true, json: async () => ({ content: { status: reportedStatus, liveTitle: 'test broadcast' } }) };
      },
      setTimeout: () => 1,
      clearTimeout() {},
      setInterval() {},
      requestAnimationFrame: callback => callback(),
      render: async () => {},
      console: { warn() {} },
    });
    vm.runInContext(html.slice(start, end), context);
    const settle = () => new Promise(resolve => setImmediate(resolve));
    await settle();
    assert.equal(banner.classList.contains('show'), true);
    assert.equal(body.classList.contains('is-live-now'), true);
    assert.match(requestedUrl, /\?t=\d+$/);

    reportedStatus = 'CLOSE';
    await vm.runInContext('checkChzzkLive()', context);
    assert.equal(banner.classList.contains('show'), false);
    reportedStatus = 'OPEN';
    await vm.runInContext('checkChzzkLive()', context);
    assert.equal(banner.classList.contains('show'), true);

    shouldFail = true;
    await vm.runInContext('checkChzzkLive()', context);
    assert.equal(banner.classList.contains('show'), false);
    assert.equal(body.classList.contains('is-live-now'), false);
    assert.equal(thumb.hidden, true);

    shouldFail = false;
    await vm.runInContext('checkChzzkLive()', context);
    assert.equal(banner.classList.contains('show'), true);
    document.hidden = true;
    await listeners.visibilitychange();
    assert.equal(banner.classList.contains('show'), false);
    document.hidden = false;
    await listeners.visibilitychange();
    assert.equal(banner.classList.contains('show'), true);

    holdNextResponse = true;
    const slowCheck = vm.runInContext('checkChzzkLive()', context);
    reportedStatus = 'CLOSE';
    await vm.runInContext('checkChzzkLive()', context);
    releaseHeldResponse({ ok: true, json: async () => ({ content: { status: 'OPEN' } }) });
    await slowCheck;
    assert.equal(banner.classList.contains('show'), false);
  });
}

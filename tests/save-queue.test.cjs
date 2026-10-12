const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const root = path.join(__dirname, '..');
const settle = () => new Promise(resolve => setImmediate(resolve));

function createQueue(options) {
  const context = vm.createContext({ window: {}, setTimeout, clearTimeout });
  vm.runInContext(fs.readFileSync(path.join(root, 'schedule_save_queue.js'), 'utf8'), context);
  return context.window.SCHEDULE_SAVE_QUEUE.create(options);
}

test('rapid edits share one request and explicit save flushes the debounce', async () => {
  const sent = [];
  const queue = createQueue({ send: async (key, body) => sent.push([key, body]) });
  const first = queue.enqueue('october', 'first', 1000);
  const second = queue.enqueue('october', 'second', 1000);
  const explicit = queue.enqueue('october', 'latest');
  assert.deepEqual(await Promise.all([first, second, explicit]), [true, true, true]);
  assert.deepEqual(sent, [['october', 'latest']]);
});

test('writes are serialized across months and newer edits follow the in-flight snapshot', async () => {
  const sent = [];
  const releases = [];
  const queue = createQueue({ send: (key, body) => {
    sent.push([key, body]);
    return new Promise(resolve => releases.push(resolve));
  } });
  const first = queue.enqueue('october', 'first');
  const duplicate = queue.enqueue('october', 'first');
  const newer = queue.enqueue('october', 'second');
  const latest = queue.enqueue('october', 'latest');
  const otherMonth = queue.enqueue('november', 'other');
  assert.equal(sent.length, 1);
  releases.shift()();
  assert.equal(await first, true);
  assert.equal(await duplicate, true);
  await settle();
  assert.deepEqual(sent, [['october', 'first'], ['october', 'latest']]);
  releases.shift()();
  assert.equal(await newer, true);
  assert.equal(await latest, true);
  await settle();
  assert.deepEqual(sent[2], ['november', 'other']);
  releases.shift()();
  assert.equal(await otherMonth, true);
});

test('failure is reported without acknowledging a save and retry is possible', async () => {
  let fail = true;
  let saved = 0;
  let errors = 0;
  const queue = createQueue({
    send: async () => { if(fail) throw new Error('offline'); },
    onSaved: () => saved++, onError: () => errors++,
  });
  assert.equal(await queue.enqueue('october', 'retained'), false);
  assert.equal(saved, 0);
  assert.equal(errors, 1);
  fail = false;
  assert.equal(await queue.enqueue('october', 'retained'), true);
  assert.equal(saved, 1);
});

test('save acknowledgment does not mark later edits or another month as saved', () => {
  const html = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
  const start = html.indexOf('function acceptSavedMonth(');
  const end = html.indexOf('monthSaveQueue = window.SCHEDULE_SAVE_QUEUE.create(', start);
  let storedSnapshot;
  const key = 'schedule:2026-10';
  const sentBody = JSON.stringify({ 12: [{ title: 'sent' }] });
  const context = vm.createContext({
    savedMonthBodies: new Map(), dirtyMonthKeys: new Set([key, 'schedule:2026-11']), failedMonthKeys: new Set(),
    cache: { [key]: { 12: [{ title: 'new edit' }] } }, hasUnsavedChanges: true,
    activeDate: new Date(2026, 9, 12), modalOriginalEntries: null,
    storageKey: () => key, overlay: { classList: { contains: () => true } },
    localStorage: { getItem: () => '[]', setItem() {} },
    window: { SCHEDULE_MONTH_CACHE: { write: (_, data) => { storedSnapshot = data; } } },
    setSaveState() {}, showAdminToast() {},
  });
  vm.runInContext(html.slice(start, end), context);
  context.acceptSavedMonth(key, sentBody);
  assert.equal(storedSnapshot[12][0].title, 'sent');
  assert.equal(context.modalOriginalEntries[0].title, 'sent');
  assert.equal(context.hasUnsavedChanges, true);
  assert.equal(context.dirtyMonthKeys.has(key), true);
  context.cache[key] = JSON.parse(sentBody);
  context.acceptSavedMonth(key, sentBody);
  assert.equal(context.dirtyMonthKeys.has(key), false);
  assert.equal(context.dirtyMonthKeys.has('schedule:2026-11'), true);
});

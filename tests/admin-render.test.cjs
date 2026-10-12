const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const html = fs.readFileSync(path.join(__dirname, '..', 'admin.html'), 'utf8');

class Element {
  constructor() {
    this.children = []; this.dataset = {}; this.className = ''; this.id = '';
    this.style = {setProperty() {}};
    this.classList = {add: name => { this.className += ` ${name}`; }};
  }
  set innerHTML(value) { this.markup = value; this.children = []; }
  get innerHTML() { return this.markup || ''; }
  appendChild(child) { this.children.push(child); child.parent = this; }
  insertBefore(child, next) {
    const index = next ? this.children.indexOf(next) : this.children.length;
    this.children.splice(index, 0, child); child.parent = this;
  }
  replaceWith(child) {
    const index = this.parent.children.indexOf(this);
    this.parent.children[index] = child; child.parent = this.parent;
  }
  remove() { this.parent.children.splice(this.parent.children.indexOf(this), 1); }
  setAttribute(name, value) { this[name] = value; }
  addEventListener() {}
  querySelector(selector) {
    const matches = el => selector === '[data-date-day]' ? el.dataset.dateDay != null
      : selector.startsWith('[data-date-day=') ? String(el.dataset.dateDay) === selector.match(/"(\d+)"/)[1]
      : selector.startsWith('#') ? el.id === selector.slice(1)
      : selector.startsWith('.') ? el.className.split(' ').includes(selector.slice(1)) : false;
    for(const child of this.children) { if(matches(child)) return child; const nested = child.querySelector(selector); if(nested) return nested; }
    return null;
  }
}

function harness(view) {
  const elements = {grid:new Element(), agenda:new Element(), listTimeline:new Element()};
  const key = 'schedule:2026-10';
  const data = {1:[{title:'first'}], 2:[{title:'second'}]};
  const context = vm.createContext({
    current: new Date(2026,9,1), currentView:view,
    cache:{[key]:data}, resolvedReplayDateMap:{}, replayRefreshCallbacks:[],
    loadMonth:async () => data, storageKey:d => `schedule:${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,
    document:{createElement:() => new Element(), getElementById:id => elements[id]},
    window:{innerWidth:1280,scrollY:100,scrollTo() {}, SCHEDULE_REPLAY_UI:{updateCalendar(){},updateList(){}}},
    mergePersonalAndOnsydeEntries:(_, entries) => ({entries}),
    isSameYMD:(a,b) => a.toDateString() === b.toDateString(),
    getDisplayColor:color=>color, parseTitle:en=>({displayTitle:en.title,iconHtml:''}),
    buildTagEl:en=>{const el=new Element();el.textContent=en.title;return el;},
    escapeHtml:text=>text, withIcon:en=>en.title, safeUrl:()=>'', labelOnsydeBroadcast(){},
    applyDesktopLineBudget(){}, initGridDragDrop(){}, openModal(){},
    attachKnownChzzkThumbnail:video=>video, manualReplayFromEntries:()=>null, liveLinkForToday:()=>null,
    hideEmptyDays:false, updateEmptyFilterButton(){}, requestAnimationFrame:fn=>fn(),
    sessionStorage:{getItem:()=>true}, setTimeout, clearTimeout,
  });
  const start = html.indexOf('const calendarReplayCallbacks =');
  const end = html.indexOf('async function refreshScheduleDates(',start);
  vm.runInContext(html.slice(start,end),context);
  const listStart = html.indexOf('async function renderListMonth(');
  const listEnd = html.indexOf('function buildSwatches(',listStart);
  vm.runInContext(html.slice(listStart,listEnd),context);
  return {context,elements,data};
}

test('editing a calendar date replaces only that cell and its agenda row', async () => {
  const {context,elements,data} = harness('calendar');
  await context.renderCalendarMonth();
  const first = elements.grid.querySelector('[data-date-day="1"]');
  const second = elements.grid.querySelector('[data-date-day="2"]');
  const secondAgenda = elements.agenda.querySelector('[data-date-day="2"]');
  const count = elements.grid.children.length;
  data[1][0].title = 'updated';
  await context.renderCalendarMonth({days:[1]});
  assert.notEqual(elements.grid.querySelector('[data-date-day="1"]'),first);
  assert.equal(elements.grid.querySelector('[data-date-day="2"]'),second);
  assert.equal(elements.agenda.querySelector('[data-date-day="2"]'),secondAgenda);
  assert.equal(elements.grid.children.length,count);
  assert.equal(context.replayRefreshCallbacks.length,31);
});

test('list updates preserve unrelated rows and insert newly visible dates in order', async () => {
  const {context,elements,data} = harness('list');
  context.hideEmptyDays = true;
  await context.renderListMonth({preserveScroll:true});
  const second = elements.listTimeline.querySelector('#item-day-2');
  data[3] = [{title:'new date'}];
  await context.renderListMonth({preserveScroll:true,days:[3]});
  assert.equal(elements.listTimeline.querySelector('#item-day-2'),second);
  assert.ok(elements.listTimeline.querySelector('#item-day-3'));
  data[1] = [];
  await context.renderListMonth({preserveScroll:true,days:[1]});
  assert.equal(elements.listTimeline.querySelector('#item-day-1'),null);
  const order = elements.listTimeline.children.map(el=>Number(el.dataset.dateDay));
  assert.deepEqual(order,[...order].sort((a,b)=>a-b));
});

const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const test=require('node:test'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),ctx=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'schedule_core.js'),'utf8'),ctx);
const sort=entries=>Array.from(ctx.sortTimedScheduleEntries(entries));
test('recognizes morning, noon, midnight, 24-hour and legacy time formats',()=>{
  for(const [time,minutes] of [['12AM',0],['0:45AM',45],['00:30AM',30],['9:05 AM',545],['12PM',720],['6:30PM',1110],['21:00',1260],['오후 7시 30분',1170]]) assert.equal(ctx.scheduleTimeMinutes(time),minutes,time);
  for(const time of ['', '미정','3 - 8 PM','25:00','6:60PM','0PM','밤 방송']) assert.equal(ctx.scheduleTimeMinutes(time),null,time);
});
test('sorts timed slots while keeping unscheduled and ambiguous items in manually chosen positions',()=>{
  const rows=[{title:'late',time:'9PM'},{title:'manual A',time:''},{title:'early',time:'6PM'},{title:'unknown',time:'미정'},{title:'middle',time:'7:30PM'}];
  assert.deepEqual(sort(rows).map(x=>x.title),['early','manual A','middle','unknown','late']);
  assert.equal(rows[0].title,'late');
});
test('ties retain the manually chosen order and each list remains independent',()=>{
  const a={title:'A',time:'8PM'},b={title:'B',time:'20:00'},c={title:'C',time:'7PM'};
  assert.deepEqual(sort([a,b,c]).map(x=>x.title),['C','A','B']);
  assert.deepEqual(sort([b,a,c]).map(x=>x.title),['C','B','A']);
  assert.deepEqual(sort([{title:'one'}]).map(x=>x.title),['one']);
});
for(const file of ['admin.html','crank_schedule.html']) test(`${file}: merged personal events sort by displayed time, team-only events stay at bottom`,()=>{
  const html=fs.readFileSync(path.join(root,file),'utf8'),start=html.indexOf('function mergePersonalAndOnsydeEntries('),end=html.indexOf('\n}',start)+2;
  const team={title:'team only',time:'1PM'};
  const c=vm.createContext({getOnsydeEntriesForDate:()=>[team],scheduleSeriesKey:()=>'',sortTimedScheduleEntries:ctx.sortTimedScheduleEntries});
  vm.runInContext(html.slice(start,end),c);
  const result=c.mergePersonalAndOnsydeEntries(new Date(),[{title:'late',time:'9PM'},{title:'manual'},{title:'early',time:'6PM'}]);
  assert.deepEqual(Array.from(result.entries,x=>x.title),['early','manual','late','team only']);
});

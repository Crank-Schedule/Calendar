const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const root = path.join(__dirname, '..');
const context = vm.createContext({window:{}, URL});
vm.runInContext(fs.readFileSync(path.join(root,'schedule_editor_utils.js'),'utf8'),context);
const utils = context.window.SCHEDULE_EDITOR_UTILS;

test('time shortcuts normalize familiar formats without altering free-form times', () => {
  for(const [input, output] of [['21:00','9PM'],['00:30','12:30AM'],['12:00','12PM'],['9:00 pm','9PM'],['9:30pm','9:30PM'],['미정','미정'],['3 - 8 PM','3 - 8 PM'],['25:00','25:00']]) assert.equal(utils.normalizeTime(input),output);
});
test('replay links accept HTTP URLs and reject unsafe or malformed input', () => {
  for(const url of ['', 'https://youtu.be/example', 'https://chzzk.naver.com/video/123']) assert.equal(utils.validReplayLink(url),true);
  for(const url of ['javascript:alert(1)', 'file:///test', 'youtube.com/watch', 'https://']) assert.equal(utils.validReplayLink(url),false);
});
test('delete undo and redo preserve the history of separate dates', () => {
  const history=utils.createHistory();
  const first=[{title:'a'},{title:'b'}];
  history.record('12',first);
  const afterDelete=[{title:'b'}];
  history.record('13',[{title:'other date'}]);
  const restored=history.undo('12',afterDelete);
  assert.equal(JSON.stringify(restored),JSON.stringify(first));
  assert.equal(JSON.stringify(history.redo('12',restored)),JSON.stringify(afterDelete));
  assert.equal(history.canUndo('13'),true);
});
test('an edit after undo clears only that date redo and snapshots do not mutate', () => {
  const history=utils.createHistory(2);
  const entries=[{title:'original'}];
  history.record('12',entries);
  entries[0].title='changed';
  assert.equal(history.undo('12',entries)[0].title,'original');
  history.record('12',[{title:'new branch'}]);
  assert.equal(history.canRedo('12'),false);
  history.record('12',[]); history.record('12',[]);
  history.undo('12',[]); history.undo('12',[]);
  assert.equal(history.undo('12',[]),null);
});

test('composer edit retains entry metadata, normalizes time and uses autosave', () => {
  const html=fs.readFileSync(path.join(root,'admin.html'),'utf8');
  const state=vm.createContext({
    window:{SCHEDULE_EDITOR_UTILS:utils},
    titleInput:{value:'Updated'},timeInput:{value:'21:00'},linkInput:{value:'https://youtu.be/new'},
    pickedIcon:'hearthstone',pickedColor:'#123456',editingEntryIndex:0,activeDate:new Date(2026,9,12),
    composerColor:()=> '#123456',resolveScheduleIcon:(_,icon)=>icon,ICONS:[],
    list:[{title:'old',id:'stable-id',time:'6PM',icon:'sc2'}],
    commitEditorDay:(_,mutate)=> { mutate(state.list); state.saved=true; },
    updateRecentPresets(){},resetEntryEditor(){},renderEntries(){},
    showEditorError:message=>{state.validationError=message;},
  });
  const start=html.indexOf('function submitScheduleEntry(');
  const end=html.indexOf('async function saveAndCloseEditor(',start);
  vm.runInContext(html.slice(start,end),state);
  assert.equal(state.submitScheduleEntry(),true);
  assert.equal(state.list[0].id,'stable-id');
  assert.equal(state.list[0].time,'9PM');
  assert.equal(state.list[0].icon,'hearthstone');
  assert.equal(state.saved,true);
  state.saved=false; state.linkInput.value='javascript:alert(1)';
  assert.equal(state.submitScheduleEntry(),false);
  assert.equal(state.saved,false);
});

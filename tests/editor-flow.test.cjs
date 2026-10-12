const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const html = fs.readFileSync(path.join(__dirname,'..','admin.html'),'utf8');
function loadFunction(context, start, end){ vm.runInContext(html.slice(html.indexOf(start),html.indexOf(end,html.indexOf(start))),context); }

test('manually chosen colors override game defaults and auto colors still work', () => {
  const context=vm.createContext({pickedColorManually:true,pickedColor:'#ffaa00',pickedIcon:'sc2',getFixedColor:()=> '#9900ff'});
  loadFunction(context,'function composerColor(', 'function updateEntryPreview(');
  assert.equal(context.composerColor('스타 II'),'#ffaa00');
  context.pickedColorManually=false;
  assert.equal(context.composerColor('스타 II'),'#9900ff');
});

test('closing with a declined draft discard keeps the dialog and data untouched', () => {
  let saves = 0, closes = 0;
  const context=vm.createContext({
    discardComposerIfNeeded:()=>false, activeDate:new Date(2026,9,12),
    saveMonth:()=>saves++, overlay:{classList:{remove:()=>closes++}},
  });
  loadFunction(context,'function closeScheduleModal(', 'function submitScheduleEntry(');
  assert.equal(context.closeScheduleModal(),false);
  assert.equal(saves,0); assert.equal(closes,0);
});

test('a draft entered while saving is not discarded when the response arrives', async () => {
  const date=new Date(2026,9,12), key='schedule:2026-10';
  let draft=false, closes=0, resolveSave;
  const button={disabled:false,textContent:'저장하고 닫기'};
  const context=vm.createContext({
    document:{getElementById:()=>button},
    isComposerDirty:()=>draft, activeDate:date, modalOpenRequest:1,
    storageKey:()=>key, dirtyMonthKeys:new Set([key]),
    monthSaveQueue:{hasPending:()=>false},
    saveMonth:()=>new Promise(resolve=>{resolveSave=resolve;}),
    closeScheduleModal:()=>closes++,
  });
  loadFunction(context,'async function saveAndCloseEditor(', 'function changeEditorHistory(');
  const saving=context.saveAndCloseEditor();
  assert.equal(button.disabled,true);
  draft=true; context.dirtyMonthKeys.clear(); resolveSave(true);
  await saving;
  assert.equal(closes,0); assert.equal(button.disabled,false);
});

test('editor controls have unique IDs and explicitly associated input labels', () => {
  const markup=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
  const ids=Array.from(markup.matchAll(/\bid="([^"]+)"/g),m=>m[1]);
  assert.equal(ids.length,new Set(ids).size);
  for(const id of ['titleInput','timeInput','linkInput','presetSearch']) {
    assert.ok(markup.includes(`for="${id}"`));
    assert.ok(ids.includes(id));
  }
  for(const id of ['undoEntryBtn','redoEntryBtn','modalSaveStatus','modalRetrySave','editorPrevDay','editorNextDay']) assert.ok(ids.includes(id));
});

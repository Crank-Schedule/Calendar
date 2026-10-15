const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),test=require('node:test'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'admin.html'),'utf8');
const core=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'schedule_core.js'),'utf8'),core);
test('explicit and automatic icons share the same compact game label',()=>{
  for(const [title,icon,expected] of [['스타 II Tuna Cup #150','sc2','Tuna Cup #150'],['스타 II Patch Clash','sc2','Patch Clash'],['스타크래프트 2 - WardiTV','sc2','WardiTV'],['롤 내전','lol','내전'],['스타 리플레이','sc1','리플레이'],['이터널 리턴 솔랭','er','솔랭'],['스타 II','sc2','스타 II']]){
    const entry={title,icon,time:'8PM'};
    assert.equal(core.parseTitle(entry).displayTitle,expected);
    assert.equal(core.parseTitle(title).displayTitle,expected);
    assert.equal(entry.title,title);
  }
});
test('generic and deliberately different icons never strip unrelated game names',()=>{
  for(const [title,icon] of [['웰 드웰러','adventure'],['모험가 앨리엇 천 년의 이야기','adventure'],['스타 II Patch Clash','adventure'],['롤 내전','sc2'],['스타 II Patch Clash','none']]) assert.equal(core.parseTitle({title,icon}).displayTitle,title);
});
test('icon-only selector is visible outside collapsed options and preserves typed fields',()=>{
  const start=html.indexOf('id="editArea"');
  assert.ok(html.indexOf('id="iconSwatches"',start)<html.indexOf('<details class="editor-options"',start));
  const buttons=[];
  const c=vm.createContext({
    ICONS:[{id:'sc2',name:'스타 II',html:'icon',color:'#9900FF'}],pickedIcon:'auto',pickedColor:'#00ffff',pickedColorManually:true,
    titleInput:{value:'내가 입력한 제목'},timeInput:{value:'9PM'},linkInput:{value:'https://example.com/video'},
    document:{getElementById:()=>({innerHTML:'',appendChild:btn=>buttons.push(btn)}),createElement:()=>({setAttribute(){},addEventListener(type,fn){this.click=fn;}})},
    buildSwatches(){},updateEntryPreview(){},
  });
  vm.runInContext(html.slice(html.indexOf('function buildIconSwatches(){'),html.indexOf('const grid =',html.indexOf('function buildIconSwatches(){'))),c);
  c.buildIconSwatches();buttons[0].click();
  assert.equal(c.titleInput.value,'내가 입력한 제목');assert.equal(c.timeInput.value,'9PM');assert.equal(c.linkInput.value,'https://example.com/video');
  assert.equal(c.pickedIcon,'sc2');
});

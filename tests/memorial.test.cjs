const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),test=require('node:test');
const root=path.join(__dirname,'..'),c=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'schedule_core.js'),'utf8'),c);
test('saved memorial titles and rest reasons receive the quiet marker and retain their words',()=>{
  const jola={title:'졸라 무지개다리 건넌 날',icon:'adventure'};
  const murphy={title:'휴방',restReason:'멀피 무지개다리 건넌 날'};
  assert.equal(c.isMemorialEntry(jola),true);assert.equal(c.parseTitle(jola).iconHtml,'✧');assert.equal(c.parseTitle(jola).displayTitle,jola.title);
  assert.equal(c.isMemorialEntry(murphy),true);assert.match(c.withIcon(murphy),/휴방 · 멀피 무지개다리 건넌 날/);
  assert.equal(c.isMemorialEntry({title:'휴방',restReason:'개인 사정'}),false);
  assert.equal(c.isMemorialEntry({title:'무지개다리',__onsyde:true}),false);
});

const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const test=require('node:test'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),context=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'schedule_core.js'),'utf8'),context);
test('rest reasons are optional, scoped to rest entries, and escaped in details and lists',()=>{
  assert.equal(context.getRestReason({title:'휴방',restReason:'  개인 사정  '}),'개인 사정');
  assert.equal(context.getRestReason({title:'휴방'}),'');
  assert.equal(context.getRestReason({title:'게임',restReason:'개인 사정'}),'');
  const html=context.withIcon({title:'휴방',restReason:'<img src=x onerror=alert(1)>'});
  assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img src=x onerror'));
});

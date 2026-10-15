const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),c=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'schedule_core.js'),'utf8'),c);
test('all approved general games render the shared general-game icon',()=>{
  for(const title of ['모험가 앨리엇 천 년의 이야기','웰 드웰러','D1ALOGUE','동의 게임','방탈출 합방 옥난기','오구와 비밀의 숲 DLC','킵 드라이빙','- 마크서버 봉봉팜 -','프래그마타 데모','이스 10 데모','인왕 3 데모','바이오하자드 9','포코피아','허 트리즈','낙원, 헤일로','레이튼 이상한 마을','활협전, 레데리 2,','클로버핏','오버워치','갑자기 히오스 납치됐었었음','007 퍼스트 라이트?','어쌔신 크리드 신작 찍먹','팀 매니저 시뮬레이터','리틀엔젤','리듬천국']) {
    assert.ok(c.parseTitle(title).iconHtml.includes('general_game_icon.svg'),title);
  }
});
test('new unknown titles default to general while dedicated icons and explicit selections remain intact',()=>{
  assert.equal(c.resolveScheduleIcon('새로운 게임','auto'),'adventure');
  for(const title of ['스타 II WardiTV','롤','워3: 신규 확장팩','에오엠4','휴방']) assert.equal(c.resolveScheduleIcon(title,'auto'),undefined,title);
  assert.equal(c.resolveScheduleIcon('스타 II','adventure'),'adventure');
  assert.equal(c.resolveScheduleIcon('새로운 게임','none'),'none');
  assert.equal(c.resolveScheduleIcon('새로운 게임','sc2'),'sc2');
  assert.equal(c.parseTitle('공지입니다').iconHtml,'📌');
});
test('approved saved 2026 entries carry explicit general tags without changing other records',()=>{
  let count=0;
  for(const file of fs.readdirSync(path.join(root,'data')).filter(n=>/^schedule_2026-\d{2}\.json$/.test(n))){
    const data=JSON.parse(fs.readFileSync(path.join(root,'data',file),'utf8'));
    for(const entries of Object.values(data)) for(const entry of Array.isArray(entries)?entries:[]) if(c.isGeneralGameTitle(entry.title)){assert.equal(entry.icon,'adventure',entry.title);count++;}
  }
  assert.ok(count>25);
});



const COLORS = [
  {name:'cyan', hex:'#00FFFF'},
  {name:'magenta', hex:'#FF00FF'},
  {name:'amber', hex:'#FF9900'},
  {name:'lime', hex:'#33FF00'},
  {name:'violet', hex:'#9900FF'},
  {name:'red', hex:'#FF0000'},
];

const PRESETS = [
  {title:'스타 II MoG 2', color:'#00FFFF'},
  {title:'스타 II 군심 로그라이크', color:'#00FFFF'},
  {title:'이터널 리턴', color:'#FF00FF'},
  {title:'모험가 앨리엇 천 년의 이야기', color:'#FF9900'},
  {title:'유로트럭', color:'#FF9900'},
  {title:'롤', color:'#9900FF'},
  {title:'같이보기', color:'#9AD1FF'},
  {title:'야구', color:'#FF9F43'},
  {title:'휴방', color:'#FF0000'},
];

// 제목 키워드 -> 아이콘. 이미지 아이콘을 받으면 이 부분을 <img> 태그로 교체할 예정.
function getIcon(title){
  const t = title || '';
  if(t.includes('휴방')) return '😴';
  if(t.includes('스타')) return '👾';
  if(t.includes('이터널')) return '🏹';
  if(t.includes('롤')) return '⚔️';
  if(t.includes('같이보기')) return '📺';
  if(t.includes('야구')) return '⚾';
  const generalGames = ['유로트럭','앨리엇','포켓몬','제로 스페이스','스팀 데모','데모 RTS'];
  if(generalGames.some(k=>t.includes(k))) return '🎮';
  return '';
}
function withIcon(title){
  const icon = getIcon(title);
  return icon ? icon+' '+title : title;
}


const mql = window.matchMedia('(max-width: 680px)');
if (mql.matches) isWeekView = true;
mql.addEventListener('change', (e) => {
  if (e.matches) {
    if (!isWeekView) {
      isWeekView = true;
      if (typeof render === 'function') render();
    }
  } else {
    if (isWeekView) {
      isWeekView = false;
      if (typeof render === 'function') render();
    }
  }
});
let current = new Date(); // 오늘 날짜를 기본 기준으로 사용
let activeDate = null; // 모달에서 다루는 날짜 (Date 객체)
let cache = {};
let pickedColor = COLORS[0].hex;

const grid = document.getElementById('grid');
const agenda = document.getElementById('agenda');
const monthLabel = document.getElementById('monthLabel');
const overlay = document.getElementById('overlay');
const entryList = document.getElementById('entryList');
const titleInput = document.getElementById('titleInput');
const timeInput = document.getElementById('timeInput');
const linkInput = document.getElementById('linkInput');
const modalDate = document.getElementById('modalDate');
const swatchesEl = document.getElementById('swatches');
const presetsEl = document.getElementById('presets');
const editArea = document.getElementById('editArea');
const viewOnlyClose = document.getElementById('viewOnlyClose');
const modeBadge = document.getElementById('modeBadge');
const monthViewBtn = document.getElementById('monthViewBtn');
const weekViewBtn = document.getElementById('weekViewBtn');

function monthKey(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }
function storageKey(d){ return 'schedule:'+monthKey(d); }
function isSameYMD(a,b){
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}
function getWeekDates(d){
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()-d.getDay());
  return Array.from({length:7}, (_,i)=> new Date(start.getFullYear(), start.getMonth(), start.getDate()+i));
}

function seedJune2026(){
  const d = (title,time,color)=>({title,time:time||'',color,link:''});
  return {
    1:[d('포켓몬스터 블루','', '#00FFFF')],
    2:[d('올리비아 귀국','','#FF9900'), d('이터널 리턴','','#FF00FF')],
    3:[d('삼성 vs NC 야구','','#9900FF'), d('스타 II MoG 2','','#00FFFF')],
    4:[d('휴방','','#FF0000')],
    5:[d('스타 II MoG 2','','#00FFFF')],
    6:[d('토크','','#33FF00')],
    7:[d('스타 II GSL 조성주 입중계 응원','6PM','#00FFFF')],
    8:[d('스타 II 리얼스케일 에필로그','','#00FFFF'), d('유로트럭','','#33FF00')],
    9:[d('스타 II 모드, 컴까기 알아보기','','#00FFFF'), d('이터널 리턴','','#FF00FF')],
    10:[d('[휴방이었던 것]','','#FF0000'), d('스타 II 군심 로그라이크 낮방','','#00FFFF')],
    11:[d('스타 II MoG 2','','#00FFFF'), d('스타 II 군심 로그라이크','','#00FFFF')],
    12:[d('월드컵 vs 체코','11AM','#33FF00'), d('스타 II 군심 로그라이크','','#00FFFF')],
    13:[d('스타 II MoG 2','','#00FFFF')],
    14:[d('스타 II 군심 로그라이크','','#00FFFF')],
    15:[d('스타 II 군심 로그라이크','','#00FFFF')],
    16:[d('이터널 리턴','','#FF00FF'), d('모험가 앨리엇 천 년의 이야기','','#FF9900')],
    17:[d('[휴방이었던 것]','','#FF0000'), d('스타 II MoG 2','','#00FFFF'), d('스타 II 자날 로그라이크','','#00FFFF')],
    18:[d('모험가 앨리엇 천 년의 이야기','','#FF9900'), d('스타 II WardiTV 대회','','#00FFFF')],
    19:[d('월드컵 vs 멕시코','10AM','#33FF00'), d('야구: 삼성 vs 한화','','#9900FF'), d('스타 II WardiTV 대회','','#00FFFF')],
    20:[d('스팀 데모 RTS 체험','','#33FF00'), d('제로 스페이스','','#33FF00')],
    21:[d('모험가 앨리엇 천 년의 이야기','','#FF9900')],
    22:[d('모험가 앨리엇 천 년의 이야기','','#FF9900')],
    23:[d('모험가 앨리엇 천 년의 이야기','','#FF9900')],
    24:[d('휴방','','#FF0000')],
    25:[d('월드컵 vs 남아공','10AM','#33FF00'), d('스타 II Douyu Cup','3PM','#00FFFF')],
    26:[d('스타 II Douyu Cup','3PM','#00FFFF')],
    27:[d('스타 II Douyu Cup','2PM','#00FFFF')],
    28:[d('스타 II Douyu Cup','2PM','#00FFFF'), d('스타 II MoG 2','','#00FFFF')],
    29:[d('스타 II 로그라이크 3회차 (저주/재능 한 방향)','','#00FFFF')],
    30:[d('스타 II 로그라이크 3회차 (저주/재능 한 방향)','','#00FFFF')],
  };
}

async function loadMonth(d){
  const key = storageKey(d);
  if(cache[key]) return cache[key];
  
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  
  let dataFromNetwork = null;
  try {
    const baseUrl = location.protocol === 'file:' ? 'https://crank-schedule.github.io/Calendar/' : '';
    const res = await fetch(`${baseUrl}data/schedule_${y}-${m}.json?t=${Date.now()}`);
    if (res.ok) {
       dataFromNetwork = await res.json();
    }
  } catch(e) {}
  
  let dataFromLocal = null;
  try {
    const raw = localStorage.getItem('crank_storage');
    if(raw) {
        const parsed = JSON.parse(raw);
        const entry = parsed.find(item => item.key === key);
        if(entry) dataFromLocal = JSON.parse(entry.value);
    }
  } catch(e) {}
  
  cache[key] = dataFromNetwork || dataFromLocal || {};
  return cache[key];
}
// saveMonth removed

function buildTagEl(en, big){
  const t = document.createElement('div');
  t.className='tag';
  t.style.borderColor = en.color;
  t.style.color = en.color;
  t.style.background = en.color+'1A';
  let html = `<span class="title">${withIcon(en.title)}</span>`;
  if(en.time) {
      html += `<span class="t-time">${en.time}</span>`;
  }
  t.innerHTML = html;
  return t;
}

async function renderCalendarMonth(){
  const data = await loadMonth(current);
  const grid = document.getElementById('grid');
  const agenda = document.getElementById('agenda');
  if(grid) grid.innerHTML = '';
  if(agenda) agenda.innerHTML = '';

  const firstDay = new Date(current.getFullYear(), current.getMonth(), 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(current.getFullYear(), current.getMonth()+1, 0).getDate();
  const today = new Date();
  const dowNames = ['일','월','화','수','목','금','토'];

  for(let i=0;i<startOffset;i++){
    const c = document.createElement('div');
    c.className='cell empty';
    if(grid) grid.appendChild(c);
  }
  for(let day=1; day<=daysInMonth; day++){
    const cellDate = new Date(current.getFullYear(), current.getMonth(), day);
    const entries = data[day] || [];
    
    const c = document.createElement('div');
    c.className='cell';
    if(isSameYMD(cellDate, today)) c.classList.add('today');
    
    const headerWrap = document.createElement('div');
    headerWrap.style.display = 'flex';
    headerWrap.style.justifyContent = 'space-between';
    headerWrap.style.alignItems = 'flex-start';
    
    const num = document.createElement('div');
    num.className='date-num'; num.textContent=day;
    headerWrap.appendChild(num);

    const specialKeywords = ['휴방', '출국', '귀국', '입국', '결방'];
    const specials = entries.filter(e => specialKeywords.some(k => e.title.includes(k)));
    const regulars = entries.filter(e => !specialKeywords.some(k => e.title.includes(k)));

    if(specials.length > 0){
      const spWrap = document.createElement('div');
      spWrap.style.display = 'flex';
      spWrap.style.flexDirection = 'column';
      spWrap.style.alignItems = 'flex-end';
      spWrap.style.gap = '2px';
      let hasRest = false;
      let hasTrip = false;
      specials.forEach(sp => {
        const isRest = sp.title.includes('휴방');
        const isTrip = sp.title.includes('귀국') || sp.title.includes('출국');
        if (isRest) hasRest = true;
        if (isTrip) hasTrip = true;
        const s = document.createElement('span');
        s.style.fontSize = '10px';
        s.style.fontWeight = '700';
        s.style.color = isRest ? '#00FFFF' : (isTrip ? '#FF9900' : '#FF0000');
        s.style.background = isRest ? 'rgba(0,255,255,0.1)' : (isTrip ? 'rgba(255,153,0,0.1)' : 'rgba(255,0,0,0.1)');
        s.style.padding = '1px 4px';
        s.style.borderRadius = '3px';
        s.style.whiteSpace = 'nowrap';
        s.textContent = sp.title;
        spWrap.appendChild(s);
      });
      headerWrap.appendChild(spWrap);
      if(hasRest) c.classList.add('is-rest');
      if(hasTrip) c.classList.add('is-trip');
    }
    c.appendChild(headerWrap);

    const tagsWrap = document.createElement('div');
    tagsWrap.className='tags';
    regulars.slice(0,4).forEach(en=> tagsWrap.appendChild(buildTagEl(en)));
    if(regulars.length>4){
      const more = document.createElement('div');
      more.className='more'; more.textContent='+'+(regulars.length-4)+'개';
      tagsWrap.appendChild(more);
    }
    c.appendChild(tagsWrap);
    c.addEventListener('click', ()=>openModal(cellDate));
    if(grid) grid.appendChild(c);

    const row = document.createElement('div');
    row.className = 'agenda-row'+(isSameYMD(cellDate, today) ? ' today' : '');
    const dateBlock = document.createElement('div');
    dateBlock.className = 'agenda-date';
    dateBlock.innerHTML = `<span class="num">${day}</span><span class="dow">${dowNames[cellDate.getDay()]}</span>`;
    row.appendChild(dateBlock);
    if(entries.length===0){
      const empty = document.createElement('div');
      empty.className='agenda-empty'; empty.textContent='일정 없음';
      row.appendChild(empty);
    } else {
      const tagsBlock = document.createElement('div');
      tagsBlock.className = 'agenda-tags';
      entries.forEach(en=>{
        const t = document.createElement('span');
        t.className='agenda-tag';
        t.style.color = en.color;
        const label = document.createElement('span');
        label.textContent = withIcon(en.title) + (en.time ? ' · '+en.time : '');
        t.appendChild(label);
        if(en.link){
          const a = document.createElement('a');
          a.href=en.link; a.target='_blank'; a.rel='noopener'; a.textContent='🔗';
          a.addEventListener('click', e=>e.stopPropagation());
          t.appendChild(a);
        }
        tagsBlock.appendChild(t);
      });
      row.appendChild(tagsBlock);
    }
    row.addEventListener('click', ()=>openModal(cellDate));
    if(agenda) agenda.appendChild(row);
  }
}


// --- OVERRIDE RENDER FUNCTION FOR LIST LAYOUT ---
let currentView = 'list'; // 'list' or 'calendar'

async function render(){
  const y = current.getFullYear();
  const m = current.getMonth();
  const monthLabel = document.getElementById('monthLabel');
  if(monthLabel) monthLabel.textContent = `${y}년 ${m+1}월`;

  const gridSec = document.getElementById('scheduleGridSection');
  const listSec = document.getElementById('scheduleListSection');
  const monthBtn = document.getElementById('monthViewBtn');
  const weekBtn = document.getElementById('weekViewBtn');

  if(monthBtn) monthBtn.classList.toggle('active', currentView === 'calendar');
  if(weekBtn) weekBtn.classList.toggle('active', currentView === 'list');

  if (currentView === 'calendar') {
    if(gridSec) gridSec.style.display = 'block';
    if(listSec) listSec.style.display = 'none';
    await renderCalendarMonth();
  } else {
    if(gridSec) gridSec.style.display = 'none';
    if(listSec) listSec.style.display = 'block';
    await renderListMonth();
  }
}

async function renderListMonth(){
  const today = new Date();
  const dowNames = ['일','월','화','수','목','금','토'];
  
  const y = current.getFullYear();
  const m = current.getMonth();
  const daysInMonth = new Date(y, m+1, 0).getDate();

  const allDates = [];
  for(let i=1; i<=daysInMonth; i++){
    allDates.push(new Date(y, m, i));
  }

  const listTimeline = document.getElementById('listTimeline');
  if(!listTimeline) return;
  listTimeline.innerHTML = '';

  const replayChannel = YT_CHANNELS.find(c=>c.key==='replay');
  let replayVideos = (window.ALL_REPLAYS || []).slice();
  try {
    const fetched = await fetchLatestVideos(replayChannel, 50);
    const existingIds = new Set(replayVideos.map(v => v.videoId));
    fetched.reverse().forEach(v => {
      if(!existingIds.has(v.videoId)) replayVideos.unshift(v);
    });
  } catch(e) {}
  
  const videoDateMap = {}; 
  replayVideos.forEach(v => {
    const rm = v.title.match(/^(\d{2})(\d{2})(\d{2})/);
    if(rm) {
      const vy = "20" + rm[1];
      const vmo = parseInt(rm[2],10);
      const vd = parseInt(rm[3],10);
      videoDateMap[`${vy}-${vmo}-${vd}`] = v;
    }
  });

  for(const dt of allDates){
    const sk = storageKey(dt);
    if(!cache[sk]) {
        await loadMonth(dt);
    }
    const entries = (cache[sk] && cache[sk][dt.getDate()]) || [];
    
    const dtZero = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isPast = dtZero < todayZero;
    const isToday = dtZero.getTime() === todayZero.getTime();
    
    const daysDiff = Math.floor((todayZero - dtZero) / (1000 * 60 * 60 * 24));

    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.id = 'item-day-' + dt.getDate();
    if(isToday) item.classList.add('is-today');
    item.addEventListener('click', ()=> {
        if(typeof openModal === 'function') openModal(dt);
    }); 
    
    const dateCol = document.createElement('div');
    dateCol.className = 'timeline-date';
    dateCol.innerHTML = `<div class="m-d">${dt.getMonth()+1}/${dt.getDate()}</div><div class="dow">${dowNames[dt.getDay()]}</div>`;
    if(isToday) dateCol.innerHTML += `<div class="today-mark">TODAY</div>`;
    item.appendChild(dateCol);

    const contentCol = document.createElement('div');
    contentCol.className = 'timeline-content';
    if(entries.length === 0){
        contentCol.innerHTML = `<span style="color:var(--text-dim); font-size:14px;">일정 없음</span>`;
    } else {
        entries.forEach(en => {
            const t = document.createElement('span');
            t.className = 'schedule-tag';
            t.style.borderColor = en.color;
            t.innerHTML = `<span style="color:${en.color}">■</span> ${en.title} ${en.time ? '· '+en.time : ''}`;
            if(en.link) {
                t.innerHTML += ` <a href="${en.link}" target="_blank" style="margin-left:4px;" onclick="event.stopPropagation()">🔗</a>`;
            }
            contentCol.appendChild(t);
        });
    }
    item.appendChild(contentCol);

    if (isPast || isToday) {
        const dStr = `${dt.getFullYear()}-${dt.getMonth()+1}-${dt.getDate()}`;
        const vid = videoDateMap[dStr];
        
        if (vid) {
            const ytCol = document.createElement('a');
            ytCol.className = 'timeline-yt';
            ytCol.href = vid.url;
            ytCol.target = '_blank';
            ytCol.onclick = (e) => e.stopPropagation();
            ytCol.innerHTML = `<img src="${vid.thumb}" alt="replay">`;
            item.appendChild(ytCol);
        } else if (entries.length > 0 && !entries[0].title.includes("휴방")) {
            const emptyCol = document.createElement('div');
            emptyCol.className = 'timeline-yt-empty';
            
            if (daysDiff >= 3) {
                emptyCol.innerHTML = `<span style="font-size:20px; line-height:1.2;">📺</span><br>치지직 다시보기를<br>통해 봐주세요`;
            } else if (daysDiff === 0) {
                emptyCol.innerHTML = `<span>⏳</span>방송 이후<br>업데이트 예정`;
            } else {
                emptyCol.innerHTML = `<span>⏳</span>다시보기 대기중`;
            }
            item.appendChild(emptyCol);
        }
    }

    listTimeline.appendChild(item);
  }

  if (m === today.getMonth() && y === today.getFullYear()) {
    setTimeout(() => {
      const targetDay = Math.max(1, today.getDate() - 2); // 2 days before today
      const targetElem = document.getElementById('item-day-' + targetDay);
      if(targetElem) {
        const stickyHeader = document.querySelector('.top-sticky');
        const headerOffset = stickyHeader ? stickyHeader.offsetHeight : 200;
        const elementPosition = targetElem.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset - 20;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }, 200);
  } else {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
}

function buildSwatches(){
  swatchesEl.innerHTML='';
  COLORS.forEach(c=>{
    const s = document.createElement('div');
    s.className='sw'+(c.hex===pickedColor?' active':'');
    s.style.background=c.hex;
    s.addEventListener('click', ()=>{ pickedColor=c.hex; buildSwatches(); });
    swatchesEl.appendChild(s);
  });
}

function buildPresets(){
  presetsEl.innerHTML='';
  PRESETS.forEach(p=>{
    const chip = document.createElement('button');
    chip.className='preset-chip';
    chip.style.color = p.color;
    chip.textContent = withIcon(p.title);
    chip.addEventListener('click', ()=>{
      titleInput.value = p.title;
      pickedColor = p.color;
      buildSwatches();
    });
    presetsEl.appendChild(chip);
  });
}

function renderEntries(dateObj){
  const data = cache[storageKey(dateObj)];
  const entries = data[dateObj.getDate()] || [];
  entryList.innerHTML='';
  if(entries.length===0){
    const p = document.createElement('div');
    p.className='empty-note'; p.textContent='아직 등록된 방송이 없어요';
    entryList.appendChild(p);
    return;
  }
  entries.forEach((en,idx)=>{
    const row = document.createElement('div');
    row.className='entry';
    let html = `<span class="swatch" style="background:${en.color}"></span>
      <span class="e-title">${withIcon(en.title)}</span>
      <span class="e-time">${en.time||''}</span>`;
    if(en.link){
      html += `<a class="e-link" href="${en.link}" target="_blank" rel="noopener">🔗</a>`;
    }
    row.innerHTML = html;
    entryList.appendChild(row);
  });
}

async function openModal(dateObj){
  activeDate = dateObj;
  await loadMonth(dateObj); // 해당 월 데이터가 캐시에 있는지 보장
  modalDate.textContent = (dateObj.getMonth()+1)+'월 '+dateObj.getDate()+'일';
  renderEntries(dateObj);
  overlay.classList.add('show');
}

document.getElementById('closeModal').addEventListener('click', ()=>overlay.classList.remove('show'));
document.getElementById('doneBtn2').addEventListener('click', ()=>overlay.classList.remove('show'));
overlay.addEventListener('click', (e)=>{ if(e.target===overlay) overlay.classList.remove('show'); });

document.getElementById('prevBtn').addEventListener('click', ()=>{
  current = new Date(current.getFullYear(), current.getMonth()-1, 1);
  render();
});
document.getElementById('nextBtn').addEventListener('click', ()=>{
  current = new Date(current.getFullYear(), current.getMonth()+1, 1);
  render();
});
document.getElementById('todayBtn').addEventListener('click', ()=>{
  current = new Date();
  render();
});

if(monthViewBtn) monthViewBtn.addEventListener('click', ()=>{ currentView='calendar'; render(); });
if(weekViewBtn) weekViewBtn.addEventListener('click', ()=>{ currentView='list'; render(); });

// Admin UI events removed

// ===== 중계 대회 대진표 =====
const defaultTournaments = [
  { badge:'StarCraft II', name:'CranK Gathers Season 4', url:'https://liquipedia.net/starcraft2/CranK_Gathers/Season_4' },
  { badge:'StarCraft II', name:'Douyu Cup 2026', url:'https://liquipedia.net/starcraft2/Douyu_Cup/2026', noLive: true },
];
let TOURNAMENTS = [];
try {
  TOURNAMENTS = JSON.parse(localStorage.getItem('crank_tournaments_v1')) || defaultTournaments;
} catch(e) {
  TOURNAMENTS = defaultTournaments;
}
const tournamentGrid = document.getElementById('tournamentGrid');
function renderTournaments(){
  tournamentGrid.innerHTML = '';
  TOURNAMENTS.forEach(t=>{
    const a = document.createElement('a');
    a.className = 'tournament-card';
    a.href = t.url; a.target = '_blank'; a.rel = 'noopener';
    const noLiveEl = t.noLive ? `<span style="font-size:11px; color:var(--neon-red); margin-top:4px; font-weight:bold;">🚫 생중계 불가</span>` : '';
    const displayBadge = t.badge === 'StarCraft II' ? '<span class="b-full">StarCraft II</span><span class="b-short" style="display:none;">SC II</span>' : t.badge;
    a.innerHTML = `<span class="t-badge">${displayBadge}</span><span class="t-name">${t.name}</span>${noLiveEl}<span class="t-go">자세히 보기 ›</span>`;
    tournamentGrid.appendChild(a);
  });
}
renderTournaments();

// ===== 하단 네비게이션 / 팝오버 =====
const navSchedule = document.getElementById('navSchedule');
const navReplay = document.getElementById('navReplay');
const navTournament = document.getElementById('navTournament');
const navSocial = document.getElementById('navSocial');
const navCafe = document.getElementById('navCafe');
const tournamentPopover = document.getElementById('tournamentPopover');
const socialPopover = document.getElementById('socialPopover');
const scheduleSection = document.getElementById('scheduleSection');
const navButtons = [navSchedule, navReplay, navTournament, navSocial];

function setActiveNav(btn){
  navButtons.forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
}
function closePopovers(){
  tournamentPopover.classList.remove('show');
  socialPopover.classList.remove('show');
}
navSchedule.addEventListener('click', ()=>{
  closePopovers();
  setActiveNav(navSchedule);
  scheduleSection.scrollIntoView({behavior:'smooth', block:'start'});
});
navReplay.addEventListener('click', ()=>{
  window.location.href = 'replay.html';
});
navTournament.addEventListener('click', ()=>{
  const willShow = !tournamentPopover.classList.contains('show');
  closePopovers();
  if(willShow){ tournamentPopover.classList.add('show'); setActiveNav(navTournament); }
  else { setActiveNav(navSchedule); }
});
navSocial.addEventListener('click', ()=>{
  const willShow = !socialPopover.classList.contains('show');
  closePopovers();
  if(willShow){ socialPopover.classList.add('show'); setActiveNav(navSocial); }
  else { setActiveNav(navSchedule); }
});
navCafe.addEventListener('click', ()=>{
  window.open('https://cafe.naver.com/f-e/cafes/31105085/menus/0?viewType=L', '_blank', 'noopener');
});

// ===== 치지직 라이브 배너 =====
const CHZZK_CHANNEL_ID = 'de27c33ee2364c4e5007867bb3b96001';
const liveBanner = document.getElementById('liveBanner');
const lbThumb = document.getElementById('lbThumb');
const lbTitle = document.getElementById('lbTitle');
const lbMeta = document.getElementById('lbMeta');

async function checkChzzkLive(){
  try{
    const res = await fetch(`https://api.chzzk.naver.com/service/v2/channels/${CHZZK_CHANNEL_ID}/live-detail`);
    const json = await res.json();
    const live = json && json.content;
    if(live && live.status === 'OPEN'){
      lbTitle.textContent = live.liveTitle || '방송 중';
      lbMeta.textContent = `${live.liveCategoryValue || ''} · 시청자 ${ (live.concurrentUserCount||0).toLocaleString() }명`;
      lbThumb.src = (live.liveImageUrl || '').replace('{type}', '480');
      liveBanner.classList.add('show');
    } else {
      liveBanner.classList.remove('show');
    }
  }catch(e){
    console.error('치지직 라이브 상태 확인 실패', e);
  }
}
checkChzzkLive();
setInterval(checkChzzkLive, 60000);

// ===== 유튜브 최신 영상 =====
const YT_API_KEY = 'AIzaSyCipMzgxeA7Ty6AUct6y2UszlwOWHEJqgU';
const YT_CHANNELS = [
  { key:'game',   label:'게임 유튜브', handle:'@crankplus', channelUrl:'https://www.youtube.com/@crankplus' },
  { key:'cast',   label:'중계 유튜브', id:'UCS2OAdHoLt-9T6cG9A2H49Q', channelUrl:'https://www.youtube.com/channel/UCS2OAdHoLt-9T6cG9A2H49Q' },
  { key:'replay', label:'다시보기 유튜브', handle:'@crankdasibogi', channelUrl:'https://www.youtube.com/@crankdasibogi' },
];

async function fetchLatestVideos(channel, maxResults){
  const CACHE_KEY = 'yt_cache_schedule_v5_' + channel.key + '_' + maxResults;
  const CACHE_TTL = 10 * 60 * 1000;
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (cached && Date.now() - cached.time < CACHE_TTL) return cached.data;
  } catch(e){}

  let playlistId = '';
  if (channel.key === 'game') playlistId = 'UURWDHteRKunVC1Kt-GVQcGw';
  else if (channel.key === 'cast') playlistId = 'UUS2OAdHoLt-9T6cG9A2H49Q';
  else if (channel.key === 'replay') playlistId = 'UUuub1wmXjxMde_SqZwIgICQ';

  if (!playlistId) return [];

  let items = [];
  let nextPageToken = '';
  let fetchedCount = 0;
  const maxToFetch = maxResults + 10; // little buffer

  while (fetchedCount < maxToFetch) {
    const fetchLimit = Math.min(50, maxToFetch - fetchedCount);
    let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${fetchLimit}&key=${YT_API_KEY}`;
    if (nextPageToken) url += `&pageToken=${nextPageToken}`;
    
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!data.items || data.items.length === 0) break;
      items = items.concat(data.items);
      fetchedCount += data.items.length;
      nextPageToken = data.nextPageToken;
      if (!nextPageToken) break;
    } catch(e) {
      break;
    }
  }

  if(items.length === 0) return [];

  const durationMap = {};
  
  // Fetch durations in batches of 50
  for (let i = 0; i < items.length; i += 50) {
    const batch = items.slice(i, i + 50);
    const videoIds = batch.map(it => it.snippet.resourceId.videoId).join(',');
    const durationUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${YT_API_KEY}`;
    try {
      const dRes = await fetch(durationUrl);
      const dData = await dRes.json();
      if (dData.items) {
        dData.items.forEach(v => {
          durationMap[v.id] = v.contentDetails.duration;
        });
      }
    } catch(e) {}
  }

  const result = [];
  for (const it of items) {
    const vid = it.snippet.resourceId.videoId;
    const dur = durationMap[vid] || '';
    const isShort = !dur.includes('H') && (!dur.includes('M') || dur === 'PT1M');
    if (!isShort) {
      let title = it.snippet.title;
      if (channel.key === 'replay') {
        const m = title.match(/^(?:20)?(\d{2})[년\s.\-]+0?(\d{1,2})[월\s.\-]+0?(\d{1,2})[일\s.\-]*[|lI\/]*\s*(.*)/);
        if (m) title = `${m[1]}${m[2].padStart(2,'0')}${m[3].padStart(2,'0')}: ${m[4]}`;
      }
      result.push({
        title: title,
        videoId: vid,
        thumb: (it.snippet.thumbnails && it.snippet.thumbnails.medium) ? it.snippet.thumbnails.medium.url : `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${vid}`
      });
    }
    if (result.length >= maxResults) break;
  }
  
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), data: result }));
  } catch(e){}

  return result;
}

function renderVideoCardsSync() {
  const grid = document.getElementById('videoCards');
  let html = '';
  for(const c of YT_CHANNELS){
    const CACHE_KEY = 'yt_cache_schedule_v4_' + c.key;
    let cachedData = null;
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (cached && Date.now() - cached.time < 10 * 60 * 1000 && cached.data.length > 0) {
        cachedData = cached.data[0];
      }
    } catch(e){}

    if(cachedData){
      html += `
        <a class="video-card" id="vc-${c.key}" href="${cachedData.url}" target="_blank" rel="noopener">
          <img class="vc-thumb" src="${cachedData.thumb}" alt="">
          <span class="vc-label">${c.label}</span>
          <span class="vc-title">${cachedData.title}</span>
        </a>`;
    } else {
      html += `
        <a class="video-card" id="vc-${c.key}" href="${c.channelUrl}" target="_blank" rel="noopener">
          <div class="vc-thumb" style="background:#161A24;"></div>
          <span class="vc-label">${c.label}</span>
          <span class="vc-title"></span>
        </a>`;
    }
  }
  grid.innerHTML = html;
}

async function loadVideoCards(){
  renderVideoCardsSync();

  await Promise.all(YT_CHANNELS.map(async (c) => {
    try{
      const videos = await fetchLatestVideos(c, 1);
      const v = videos[0];
      const card = document.getElementById(`vc-${c.key}`);
      if(!card || !v) return;
      card.innerHTML = `
        <img class="vc-thumb" src="${v.thumb}" alt="">
        <span class="vc-label">${c.label}</span>
        <span class="vc-title">${v.title}</span>
      `;
      card.href = v.url;
      card.style.pointerEvents = 'auto';
      card.style.borderColor = '';
    }catch(e){
      console.error('최신 영상 불러오기 실패', c.key, e);
    }
  }));
}

loadVideoCards();

render();
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.textContent = document.documentElement.getAttribute('data-theme') === 'light' ? '🌙' : '☀️';
    themeToggleBtn.addEventListener('click', () => {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      if (isLight) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('crank_theme', 'dark');
        themeToggleBtn.textContent = '☀️';
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('crank_theme', 'light');
        themeToggleBtn.textContent = '🌙';
      }
    });
  }

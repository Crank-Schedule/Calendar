
  if(localStorage.getItem('crank_theme') === 'light') document.documentElement.setAttribute('data-theme', 'light');
</script>
</head>
<body>
<button id="themeToggleBtn" class="theme-toggle-btn">☀️</button>
<a class="live-banner" id="liveBanner" href="https://chzzk.naver.com/live/de27c33ee2364c4e5007867bb3b96001" target="_blank" rel="noopener">
  <img id="lbThumb" src="" alt="">
  <span class="lb-badge"><span class="lb-dot"></span>LIVE</span>
  <div class="lb-info">
    <div class="lb-title" id="lbTitle"></div>
    <div class="lb-meta" id="lbMeta"></div>
  </div>
  <span class="lb-go">치지직에서 보기 ›</span>
</a>
<div class="wrap">

  <div class="top-sticky">
<div class="header">
    <div class="header-left">
      <div class="brand">
        <span class="dot"></span><span class="brand-text">LIVE SCHEDULE</span>
        <span class="mode-badge" id="modeBadge">관리자 모드</span>
      </div>
      <h1>크랭크 <span>방송</span> 스케줄</h1>
    </div>
    <div class="nav">
      <div class="view-toggle">
        <button id="monthViewBtn" class="active">월간</button>
        <button id="weekViewBtn">주간</button>
      </div>
      <button id="prevBtn">‹</button>
      <div class="month-label" id="monthLabel">2026년 6월</div>
      <button id="nextBtn">›</button>
      <button class="today-btn" id="todayBtn">오늘</button>
    </div>
  </div>

  <div class="video-cards" id="videoCards"></div>
</div>

  <div id="scheduleListSection" style="max-width: 800px; margin: 0 auto; padding-bottom:100px;">
    <div class="list-timeline" id="listTimeline"></div>
  </div>
  </div>
</div>

<div class="popover" id="tournamentPopover">
  <div class="pop-title" style="display:flex; align-items:center; gap:8px;">
    <span style="font-size:18px;">⚠️</span>
    <span style="font-size: 13px; color: var(--text-main); font-weight: 600; line-height: 1.4; word-break: keep-all;">여기에 없는 대회는 기본적으로 중계하지 않습니다</span>
  </div>
  <div class="tournament-grid" id="tournamentGrid"></div>
</div>

<div class="popover" id="socialPopover">
  <div class="pop-title">소셜미디어</div>
  <div class="social-row">
    <a class="social-icon" href="https://x.com/ONSYDE_Crank" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.2 8.2L23 22h-6.6l-5.2-6.8L5 22H2l7.7-8.8L1.4 2H8l4.7 6.2L18.9 2z"/></svg>
      <span>크랭크 X</span>
    </a>
    <a class="social-icon" href="https://www.instagram.com/onsyde_crank/" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
      <span>크랭크 IG</span>
    </a>
    <a class="social-icon" href="https://x.com/official_onsyde" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.2 8.2L23 22h-6.6l-5.2-6.8L5 22H2l7.7-8.8L1.4 2H8l4.7 6.2L18.9 2z"/></svg>
      <span>온사이드 X</span>
    </a>
    <a class="social-icon" href="https://www.instagram.com/official_onsyde_gaming" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
      <span>온사이드 IG</span>
    </a>
  </div>
</div>

<nav class="bottom-nav">
  <button class="bn-item active" id="navSchedule"><span class="bn-icon">📅</span>일정</button>
  <button class="bn-item" id="navReplay"><span class="bn-icon">▶️</span>다시보기</button>
  <button class="bn-item" id="navTournament"><span class="bn-icon">🏆</span>대회 대진표</button>
  <button class="bn-item" id="navSocial"><span class="bn-icon">🔗</span>소셜</button>
  <button class="bn-item" id="navCafe"><span class="bn-icon">📋</span>카페</button>
</nav>

<div class="overlay" id="overlay">
  <div class="modal">
    <h2><span id="modalDate">6월 1일</span><span class="close" id="closeModal">✕</span></h2>

    <div class="entry-list" id="entryList"></div>

    <div id="viewOnlyClose">
      <div class="modal-actions"><button id="doneBtn2">닫기</button></div>
    </div>
  </div>
</div>

<script>

const COLORS = [
  {name:'cyan', hex:'#34F5D8'},
  {name:'magenta', hex:'#FF3DCB'},
  {name:'amber', hex:'#FFC857'},
  {name:'lime', hex:'#C6FF3C'},
  {name:'violet', hex:'#A56BFF'},
  {name:'red', hex:'#FF4D6D'},
];

const PRESETS = [
  {title:'스타 II MoG 2', color:'#34F5D8'},
  {title:'스타 II 군심 로그라이크', color:'#34F5D8'},
  {title:'이터널 리턴', color:'#FF3DCB'},
  {title:'모험가 앨리엇 천 년의 이야기', color:'#FFC857'},
  {title:'유로트럭', color:'#FFC857'},
  {title:'롤', color:'#A56BFF'},
  {title:'같이보기', color:'#9AD1FF'},
  {title:'야구', color:'#FF9F43'},
  {title:'휴방', color:'#FF4D6D'},
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

let isWeekView = false;
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
    1:[d('포켓몬스터 블루','', '#34F5D8')],
    2:[d('올리비아 귀국','','#FFC857'), d('이터널 리턴','','#FF3DCB')],
    3:[d('삼성 vs NC 야구','','#A56BFF'), d('스타 II MoG 2','','#34F5D8')],
    4:[d('휴방','','#FF4D6D')],
    5:[d('스타 II MoG 2','','#34F5D8')],
    6:[d('토크','','#C6FF3C')],
    7:[d('스타 II GSL 조성주 입중계 응원','6PM','#34F5D8')],
    8:[d('스타 II 리얼스케일 에필로그','','#34F5D8'), d('유로트럭','','#C6FF3C')],
    9:[d('스타 II 모드, 컴까기 알아보기','','#34F5D8'), d('이터널 리턴','','#FF3DCB')],
    10:[d('[휴방이었던 것]','','#FF4D6D'), d('스타 II 군심 로그라이크 낮방','','#34F5D8')],
    11:[d('스타 II MoG 2','','#34F5D8'), d('스타 II 군심 로그라이크','','#34F5D8')],
    12:[d('월드컵 vs 체코','11AM','#C6FF3C'), d('스타 II 군심 로그라이크','','#34F5D8')],
    13:[d('스타 II MoG 2','','#34F5D8')],
    14:[d('스타 II 군심 로그라이크','','#34F5D8')],
    15:[d('스타 II 군심 로그라이크','','#34F5D8')],
    16:[d('이터널 리턴','','#FF3DCB'), d('모험가 앨리엇 천 년의 이야기','','#FFC857')],
    17:[d('[휴방이었던 것]','','#FF4D6D'), d('스타 II MoG 2','','#34F5D8'), d('스타 II 자날 로그라이크','','#34F5D8')],
    18:[d('모험가 앨리엇 천 년의 이야기','','#FFC857'), d('스타 II WardiTV 대회','','#34F5D8')],
    19:[d('월드컵 vs 멕시코','10AM','#C6FF3C'), d('야구: 삼성 vs 한화','','#A56BFF'), d('스타 II WardiTV 대회','','#34F5D8')],
    20:[d('스팀 데모 RTS 체험','','#C6FF3C'), d('제로 스페이스','','#C6FF3C')],
    21:[d('모험가 앨리엇 천 년의 이야기','','#FFC857')],
    22:[d('모험가 앨리엇 천 년의 이야기','','#FFC857')],
    23:[d('모험가 앨리엇 천 년의 이야기','','#FFC857')],
    24:[d('휴방','','#FF4D6D')],
    25:[d('월드컵 vs 남아공','10AM','#C6FF3C'), d('스타 II Douyu Cup','3PM','#34F5D8')],
    26:[d('스타 II Douyu Cup','3PM','#34F5D8')],
    27:[d('스타 II Douyu Cup','2PM','#34F5D8')],
    28:[d('스타 II Douyu Cup','2PM','#34F5D8'), d('스타 II MoG 2','','#34F5D8')],
    29:[d('스타 II 로그라이크 3회차 (저주/재능 한 방향)','','#34F5D8')],
    30:[d('스타 II 로그라이크 3회차 (저주/재능 한 방향)','','#34F5D8')],
  };
}

async function loadMonth(d){
  const key = storageKey(d);
  if(cache[key]) return cache[key];
  try{
    const res = await window.storage.get(key, true); // 공용 데이터
    const data = res ? JSON.parse(res.value) : null;
    if(data){ cache[key]=data; return data; }
  }catch(e){ /* 키 없음 */ }
  const seeded = (d.getFullYear()===2026 && d.getMonth()===5) ? seedJune2026() : {};
  cache[key] = seeded;
  return seeded;
}
// saveMonth removed

function buildTagEl(en, big){
  const tag = document.createElement('div');
  tag.className='tag';
  tag.style.color = en.color;
  tag.style.background = en.color+'14';
  const label = document.createElement('span');
  label.textContent = withIcon(en.title);
  tag.appendChild(label);
  if(en.time){
    const t = document.createElement('span');
    t.className='t-time'; t.textContent=en.time;
    tag.appendChild(t);
  }
  if(en.link){
    const a = document.createElement('a');
    a.href = en.link; a.target='_blank'; a.rel='noopener'; a.textContent='🔗';
    a.addEventListener('click', e=>e.stopPropagation());
    tag.appendChild(a);
  }
  return tag;
}

async function render(){
  monthViewBtn.classList.toggle('active', !isWeekView);
  weekViewBtn.classList.toggle('active', isWeekView);
  grid.classList.toggle('week-mode', isWeekView);
  if(isWeekView){ await renderWeek(); } else { await renderMonth(); }
}

async function renderMonth(){
  monthLabel.textContent = current.getFullYear()+'년 '+(current.getMonth()+1)+'월';
  const data = await loadMonth(current);
  grid.innerHTML = '';
  agenda.innerHTML = '';

  const firstDay = new Date(current.getFullYear(), current.getMonth(), 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(current.getFullYear(), current.getMonth()+1, 0).getDate();
  const today = new Date();
  const dowNames = ['일','월','화','수','목','금','토'];

  for(let i=0;i<startOffset;i++){
    const c = document.createElement('div');
    c.className='cell empty';
    grid.appendChild(c);
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
    headerWrap.style.gap = '4px';

    const num = document.createElement('div');
    num.className='date-num'; num.textContent=day;
    headerWrap.appendChild(num);

    const specialKeywords = ['휴방', '출국', '입국', '귀국', '결방'];
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
        s.style.color = isRest ? '#00D1FF' : (isTrip ? '#FFC857' : '#FF4D6D');
        s.style.background = isRest ? 'rgba(0,209,255,0.1)' : (isTrip ? 'rgba(255,200,87,0.1)' : 'rgba(255,77,109,0.1)');
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
    grid.appendChild(c);

    const row = document.createElement('div');
    row.className = 'agenda-row'+(isSameYMD(cellDate, today) ? ' today' : '');
    const dateBlock = document.createElement('div');
    dateBlock.className = 'agenda-date';
    dateBlock.innerHTML = `<span class="num">${day}</span><span class="dow">${dowNames[cellDate.getDay()]}</span>`;
    row.appendChild(dateBlock);
    if(entries.length===0){
      const empty = document.createElement('div');
      empty.className='agenda-empty'; empty.textContent='—';
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
    agenda.appendChild(row);
  }
}

async function renderWeek(){
  const weekDates = getWeekDates(current);
  const s = weekDates[0], e = weekDates[6];
  monthLabel.textContent = `${s.getMonth()+1}월 ${s.getDate()}일 ~ ${e.getMonth()+1}월 ${e.getDate()}일`;

  const monthDataMap = {};
  for(const dt of weekDates){
    const mk = monthKey(dt);
    if(!monthDataMap[mk]) monthDataMap[mk] = await loadMonth(dt);
  }

  grid.innerHTML=''; agenda.innerHTML='';
  const today = new Date();
  const dowNames = ['일','월','화','수','목','금','토'];

  weekDates.forEach(dt=>{
    const entries = (monthDataMap[monthKey(dt)][dt.getDate()]) || [];

    const c = document.createElement('div');
    c.className='cell';
    if(isSameYMD(dt, today)) c.classList.add('today');
    
    const headerWrap = document.createElement('div');
    headerWrap.style.display = 'flex';
    headerWrap.style.justifyContent = 'space-between';
    headerWrap.style.alignItems = 'flex-start';
    headerWrap.style.gap = '4px';

    const num = document.createElement('div');
    num.className='date-num'; num.textContent=(dt.getMonth()+1)+'/'+dt.getDate();
    headerWrap.appendChild(num);

    const specialKeywords = ['휴방', '출국', '입국', '귀국', '결방'];
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
        s.style.color = isRest ? '#00D1FF' : (isTrip ? '#FFC857' : '#FF4D6D');
        s.style.background = isRest ? 'rgba(0,209,255,0.1)' : (isTrip ? 'rgba(255,200,87,0.1)' : 'rgba(255,77,109,0.1)');
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

    const tagsWrap = document.createElement('div'); tagsWrap.className='tags';
    regulars.forEach(en=> tagsWrap.appendChild(buildTagEl(en)));
    c.appendChild(tagsWrap);
    c.addEventListener('click', ()=>openModal(dt));
    grid.appendChild(c);

    const row = document.createElement('div');
    row.className = 'agenda-row'+(isSameYMD(dt, today) ? ' today' : '');
    const dateBlock = document.createElement('div');
    dateBlock.className = 'agenda-date';
    dateBlock.innerHTML = `<span class="num">${dt.getDate()}</span><span class="dow">${dowNames[dt.getDay()]}</span>`;
    row.appendChild(dateBlock);
    if(entries.length===0){
      const empty = document.createElement('div');
      empty.className='agenda-empty'; empty.textContent='—';
      row.appendChild(empty);
    } else {
      const tagsBlock = document.createElement('div');
      tagsBlock.className = 'agenda-tags';
      entries.forEach(en=>{
        const t = document.createElement('span');
        t.className='agenda-tag'; t.style.color = en.color;
        const label=document.createElement('span');
        label.textContent = withIcon(en.title) + (en.time ? ' · '+en.time : '');
        t.appendChild(label);
        if(en.link){
          const a=document.createElement('a');
          a.href=en.link; a.target='_blank'; a.rel='noopener'; a.textContent='🔗';
          a.addEventListener('click', ev=>ev.stopPropagation());
          t.appendChild(a);
        }
        tagsBlock.appendChild(t);
      });
      row.appendChild(tagsBlock);
    }
    row.addEventListener('click', ()=>openModal(dt));
    agenda.appendChild(row);
  });
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
  if(isWeekView){ current = new Date(current.getFullYear(), current.getMonth(), current.getDate()-7); }
  else { current = new Date(current.getFullYear(), current.getMonth()-1, 1); }
  render();
});
document.getElementById('nextBtn').addEventListener('click', ()=>{
  if(isWeekView){ current = new Date(current.getFullYear(), current.getMonth(), current.getDate()+7); }
  else { current = new Date(current.getFullYear(), current.getMonth()+1, 1); }
  render();
});
document.getElementById('todayBtn').addEventListener('click', ()=>{ current = new Date(); render(); });

monthViewBtn.addEventListener('click', ()=>{ isWeekView=false; render(); });
weekViewBtn.addEventListener('click', ()=>{ isWeekView=true; render(); });

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
  const CACHE_KEY = 'yt_cache_schedule_v4_' + channel.key;
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

  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${maxResults + 5}&key=${YT_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if(!data.items) return [];

  const videoIds = data.items.map(it => it.snippet.resourceId.videoId).join(',');
  const durationUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${YT_API_KEY}`;
  const dRes = await fetch(durationUrl);
  const dData = await dRes.json();
  
  const durationMap = {};
  if (dData.items) {
    dData.items.forEach(v => {
      durationMap[v.id] = v.contentDetails.duration;
    });
  }

  const result = [];
  for (const it of data.items) {
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
        url: `https://www.youtube.com/watch?v=${vid}`,
      });
    }
    if (result.length >= maxResults) break;
  }

  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), data: result })); } catch(e){}
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

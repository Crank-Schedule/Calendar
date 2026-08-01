// ===== 크랭크 스케줄 공통 유틸 =====
// crank_schedule.html 과 admin.html 이 공유합니다. (한 곳만 고치면 양쪽에 반영)
// 순수 함수 모음: 색상 변환 · HTML 이스케이프 · 제목/아이콘 파싱.

// ----- 라이트/다크 모드에 맞춰 색상 명도 자동 조절 -----
function hexToHsl(hex){
  let r=0,g=0,b=0;
  hex = String(hex||'').replace('#','');
  if(hex.length===3){ r=parseInt(hex[0]+hex[0],16); g=parseInt(hex[1]+hex[1],16); b=parseInt(hex[2]+hex[2],16); }
  else { r=parseInt(hex.substring(0,2),16); g=parseInt(hex.substring(2,4),16); b=parseInt(hex.substring(4,6),16); }
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h=0,s=0,l=(max+min)/2;
  if(max!==min){
    const d = max-min;
    s = l>0.5 ? d/(2-max-min) : d/(max+min);
    switch(max){
      case r: h=(g-b)/d+(g<b?6:0); break;
      case g: h=(b-r)/d+2; break;
      case b: h=(r-g)/d+4; break;
    }
    h/=6;
  }
  return [h*360, s*100, l*100];
}
function hslToHex(h,s,l){
  h/=360; s/=100; l/=100;
  let r,g,b;
  if(s===0){ r=g=b=l; }
  else{
    const hue2rgb=(p,q,t)=>{
      if(t<0) t+=1; if(t>1) t-=1;
      if(t<1/6) return p+(q-p)*6*t;
      if(t<1/2) return q;
      if(t<2/3) return p+(q-p)*(2/3-t)*6;
      return p;
    };
    const q = l<0.5 ? l*(1+s) : l+s-l*s;
    const p = 2*l-q;
    r=hue2rgb(p,q,h+1/3); g=hue2rgb(p,q,h); b=hue2rgb(p,q,h-1/3);
  }
  const toHex = v => Math.round(v*255).toString(16).padStart(2,'0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function getDisplayColor(hex){
  if(!hex) return hex;
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  try{
    const [h,s,l] = hexToHsl(hex);
    if(!isLight) {
      const newL = Math.max(l, 65);
      const newS = Math.min(100, s + 15);
      return hslToHex(h, newS, newL);
    } else {
      const isYellowish = h>=40 && h<=110;
      const cap = isYellowish ? 22 : 28;
      const newL = Math.min(l, cap);
      const newS = Math.min(100, s+10);
      return hslToHex(h, newS, newL);
    }
  }catch(e){ return hex; }
}

// ===== 보안: 일정 제목/링크는 외부(저장소 JSON) 데이터이므로 항상 이스케이프해서 출력 =====
function escapeHtml(str){
  if(str==null) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}
function safeUrl(url){
  if(!url) return '';
  const trimmed = String(url).trim();
  return /^https?:\/\//i.test(trimmed) ? escapeHtml(trimmed) : '';
}

// 제목 키워드 -> 축약(뱃지).
function getAbbr(title) {
  if (!title) return '';
  const up = title.toUpperCase();
  if (up.includes('귀국') || up.includes('입국')) return '올귀';
  if (up.includes('출국') || up.includes('출장')) return '올출';
  if (up.includes('스타2') || up.includes('스타 II') || up.includes('스타II') || up.includes('SC2')) return '스II';
  if (up.includes('스타크래프트') || up.includes('스타1') || up.includes('스타')) return '스타';
  if (up.includes('마리오 카트') || up.includes('마카')) return '마카';
  if (up.includes('롤') || up.includes('리그 오브 레전드') || up.includes('리그오브레전드')) return '롤';
  if (up.includes('이터널') || up.includes('이리')) return '이리';
  if (up.includes('휴방')) return '휴방';
  if (up.includes('야구')) return '야구';
  if (up.includes('월드컵') || up.includes('축구')) return '축구';
  if (up.includes('모험가') || up.includes('앨리엇')) return '앨리';
  if (up.includes('유로트럭')) return '트럭';
  if (up.includes('토크') || up.includes('저챗')) return '저챗';
  if (up.includes('대회') || up.includes('컵') || up.includes('CUP')) return '대회';
  const clean = title.replace(/[\[\]\s]/g, '');
  return clean.substring(0, 2);
}

function parseTitle(en) {
  let titleStr = typeof en === 'string' ? en : (en.title || '');
  let explicitIcon = typeof en === 'object' && en.icon ? en.icon : null;
  if(explicitIcon === 'auto') explicitIcon = null;

  let displayTitle = titleStr || '';

  if (explicitIcon && explicitIcon !== 'none') {
    let customIcon = false;
    let iconHtml = '';

    if(explicitIcon === 'lol') { iconHtml = `<img src="assets/images/lol_icon.png" onerror="this.outerHTML='⚔️'" style="width:11px; height:11px; object-fit:contain; border-radius:2px; vertical-align:-1px; margin-right:3px;">`; customIcon=true;}
    else if(explicitIcon === 'sc2') { iconHtml = `<img src="assets/images/sc2_icon.png" onerror="this.outerHTML='👾'" style="width:11px; height:11px; object-fit:contain; border-radius:2px; vertical-align:-1px; margin-right:3px;">`; customIcon=true;}
    else if(explicitIcon === 'sc1') { iconHtml = `<img src="assets/images/sc_icon.png" onerror="this.outerHTML='👾'" style="width:11px; height:11px; object-fit:contain; border-radius:2px; vertical-align:-1px; margin-right:3px;">`; customIcon=true;}
    else if(explicitIcon === 'er') { iconHtml = `<img src="assets/images/er_icon.png" onerror="this.outerHTML='🏹'" style="width:11px; height:11px; object-fit:contain; border-radius:2px; vertical-align:-1px; margin-right:3px;">`; customIcon=true;}
    else if(explicitIcon === 'mk') { iconHtml = `<img src="assets/images/mk_icon.png" onerror="this.outerHTML='🎮'" style="width:11px; height:11px; object-fit:contain; border-radius:2px; vertical-align:-1px; margin-right:3px;">`; customIcon=true;}
    else if(explicitIcon === 'bb') { iconHtml = `⚾`; customIcon=true;}
    else if(explicitIcon === 'poke') { iconHtml = `<img src="assets/images/poke_icon.png" onerror="this.outerHTML='🔴'" style="width:11px; height:11px; object-fit:contain; border-radius:2px; vertical-align:-1px; margin-right:3px;">`; customIcon=true;}
    else if(explicitIcon === 'chat') { iconHtml = `💬`; customIcon=true;}
    else if(explicitIcon === 'watch') { iconHtml = `<img src="assets/images/watch_icon.png" onerror="this.outerHTML='📺'" style="width:11px; height:11px; object-fit:contain; border-radius:2px; vertical-align:-1px; margin-right:3px;">`; customIcon=true;}

    // 아이콘을 직접 골랐을 때도 자동 모드처럼 제목을 보정한다 (키워드 제거 + 비면 기본값 채우기)
    const EXPLICIT_TITLE = {
      lol:  {re:/(?:리그\s*오브\s*레전드|리그오브레전드|롤|LOL)/i, def:'솔랭'},
      sc2:  {re:/(?:스타크래프트\s*2|스타크래프트2|스타\s*2|스타2|스타\s*II|스타II|SC2)/i, def:'스타 II'},
      sc1:  {re:/(?:스타크래프트\s*1|스타크래프트1|스타\s*1|스타1|스타크래프트|스타)/i, def:'스타'},
      er:   {re:/(?:이터널\s*리턴|이리)/i, def:'솔랭'},
      mk:   {re:/(?:마리오\s*카트|마리오카트|마카)/i, def:'8 디럭스'},
      bb:   {re:/야구/g, def:'야구'},
      poke: {re:/(?:포켓몬스터|포켓몬)/i, def:'포켓몬'},
      chat: {re:/(?:저챗|토크|Just\s*Chatting)/i, def:'저챗'}
    };
    const et = EXPLICIT_TITLE[explicitIcon];
    if (et) {
      let rest = displayTitle.replace(et.re, '').trim().replace(/^[-:,\s]+/, '');
      if (explicitIcon === 'mk') rest = rest.replace(/8\s*디럭스/i, '').trim().replace(/^[-:,\s]+/, '');
      displayTitle = rest === '' ? et.def : rest;
    }

    return {
        displayTitle: displayTitle,
        customIcon: customIcon,
        iconHtml: iconHtml
    };
  } else if (explicitIcon === 'none') {
    return {
        displayTitle: displayTitle,
        customIcon: false,
        iconHtml: ''
    };
  }

  // Auto Mode
  let isLol = false;
  let isSc2 = false;
  let isSc1 = false;
  let isMk = false;
  let isBaseball = false;
  let isWatch = false;
  let isChat = false;
  let isPoke = false;
  let isEr = false;

  const lolRegex = /(?:리그\s*오브\s*레전드|리그오브레전드|롤|LOL)/i;
  const lolKeepRegex = /(?:LEC|LCK)/i;
  const sc2Regex = /(?:스타크래프트\s*2|스타크래프트2|스타\s*2|스타2|스타\s*II|스타II|SC2)/i;
  const sc1Regex = /(?:스타크래프트\s*1|스타크래프트1|스타\s*1|스타1|스타크래프트|스타)/i;
  const mkRegex = /(?:마리오\s*카트|마리오카트|마카)/i;
  const watchRegex = /(?:월드컵|올림픽)/i;
  const chatRegex = /(?:저챗|토크|Just\s*Chatting)/i;
  const pokeRegex = /(?:포켓몬스터|포켓몬)/i;
  const erRegex = /(?:이터널\s*리턴|이리)/i;

  if(lolRegex.test(displayTitle)) {
      isLol = true;
      let rest = displayTitle.replace(lolRegex, '').trim();
      rest = rest.replace(/^[-:,\s]+/, '');
      displayTitle = rest === '' ? '솔랭' : rest;
  } else if (lolKeepRegex.test(displayTitle)) {
      isLol = true;
  } else if(sc2Regex.test(displayTitle)) {
      isSc2 = true;
      let rest = displayTitle.replace(sc2Regex, '').trim();
      rest = rest.replace(/^[-:,\s]+/, '');
      displayTitle = rest === '' ? '스타 II' : rest;
  } else if(sc1Regex.test(displayTitle)) {
      isSc1 = true;
      let rest = displayTitle.replace(sc1Regex, '').trim();
      rest = rest.replace(/^[-:,\s]+/, '');
      displayTitle = rest === '' ? '스타' : rest;
  } else if(mkRegex.test(displayTitle)) {
      isMk = true;
      let rest = displayTitle.replace(mkRegex, '').trim();
      rest = rest.replace(/^[-:,\s]+/, '');
      rest = rest.replace(/8\s*디럭스/i, '').trim();
      rest = rest.replace(/^[-:,\s]+/, '');

      if (rest === '') {
          displayTitle = '8 디럭스';
      } else {
          if (/월[드즈]/.test(rest)) {
              rest = rest.replace(/월즈/g, '월드');
          }
          displayTitle = rest;
      }
  } else if(/야구|삼성/.test(displayTitle)) {
      isBaseball = true;
      let rest = displayTitle.replace(/야구/g, '').trim();
      rest = rest.replace(/^[-:,\s]+/, '');
      displayTitle = rest === '' ? '야구' : rest;
  } else if(watchRegex.test(displayTitle)) {
      isWatch = true;
  } else if(chatRegex.test(displayTitle)) {
      isChat = true;
      let rest = displayTitle.replace(chatRegex, '').trim();
      rest = rest.replace(/^[-:,\s]+/, '');
      displayTitle = rest === '' ? '저챗' : rest;
  } else if(pokeRegex.test(displayTitle)) {
      isPoke = true;
      let rest = displayTitle.replace(pokeRegex, '').trim();
      rest = rest.replace(/^[-:,\s]+/, '');
      displayTitle = rest === '' ? '포켓몬' : rest;
  } else if(erRegex.test(displayTitle)) {
      isEr = true;
      let rest = displayTitle.replace(erRegex, '').trim();
      rest = rest.replace(/^[-:,\s]+/, '');
      displayTitle = rest === '' ? '솔랭' : rest;
  }

  let iconHtml = getIcon(displayTitle);
  let customIcon = false;

  if(isLol) {
      iconHtml = `<img src="assets/images/lol_icon.png" onerror="this.outerHTML='⚔️'" style="width:11px; height:11px; object-fit:contain; border-radius:2px; vertical-align:-1px; margin-right:3px;">`;
      customIcon = true;
  } else if(isSc2) {
      iconHtml = `<img src="assets/images/sc2_icon.png" onerror="this.outerHTML='👾'" style="width:11px; height:11px; object-fit:contain; border-radius:2px; vertical-align:-1px; margin-right:3px;">`;
      customIcon = true;
  } else if(isSc1) {
      iconHtml = `<img src="assets/images/sc_icon.png" onerror="this.outerHTML='👾'" style="width:11px; height:11px; object-fit:contain; border-radius:2px; vertical-align:-1px; margin-right:3px;">`;
      customIcon = true;
  } else if(isMk) {
      iconHtml = `<img src="assets/images/mk_icon.png" onerror="this.outerHTML='🎮'" style="width:11px; height:11px; object-fit:contain; border-radius:2px; vertical-align:-1px; margin-right:3px;">`;
      customIcon = true;
  } else if(isBaseball) {
      iconHtml = `⚾`;
      customIcon = true;
  } else if(isWatch) {
      iconHtml = `<img src="assets/images/watch_icon.png" onerror="this.outerHTML='📺'" style="width:11px; height:11px; object-fit:contain; border-radius:2px; vertical-align:-1px; margin-right:3px;">`;
      customIcon = true;
  } else if(isChat) {
      iconHtml = `💬`;
      customIcon = true;
  } else if(isPoke) {
      iconHtml = `<img src="assets/images/poke_icon.png" onerror="this.outerHTML='🔴'" style="width:11px; height:11px; object-fit:contain; border-radius:2px; vertical-align:-1px; margin-right:3px;">`;
      customIcon = true;
  } else if(isEr) {
      iconHtml = `<img src="assets/images/er_icon.png" onerror="this.outerHTML='🏹'" style="width:11px; height:11px; object-fit:contain; border-radius:2px; vertical-align:-1px; margin-right:3px;">`;
      customIcon = true;
  }

  return {
      displayTitle: displayTitle,
      customIcon: customIcon,
      iconHtml: iconHtml
  };
}

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
  return '📌';
}
function withIcon(en){
  const parsed = parseTitle(en);
  const safe = escapeHtml(parsed.displayTitle);
  return (parsed.iconHtml ? parsed.iconHtml + ' ' : '') + safe;
}

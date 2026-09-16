// The existing merge result determines whether CRANK is covering this event.
function labelOnsydeBroadcast(element, entry) {
  if (!entry.__onsyde) return;
  const covered = !!entry.__onsydeMerged;
  element.classList.add('onsyde-labelled');
  element.classList.toggle('onsyde-personal-tag', covered);
  const label = document.createElement('span');
  label.className = 'onsyde-broadcast-label';
  label.setAttribute('aria-label', covered ? '크랭크 중계' : 'ONSYDE 팀 일정 · 크랭크 중계 없음');
  for (const text of covered ? ['▶ 중계'] : ['팀 일정']) {
    const part = document.createElement('span');
    part.textContent = text;
    label.appendChild(part);
  }
  element.prepend(label);
  element.title = (covered ? '크랭크 방송에서 중계하는 ONSYDE 일정' : '팀 경기 안내입니다. 크랭크 방송 중계 일정이 아닙니다.') + '\n' + (element.title || entry.title || '');
}

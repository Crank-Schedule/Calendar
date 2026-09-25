// Replay lookups must not rebuild schedule cells: doing so resets scroll, focus and edits.
window.SCHEDULE_REPLAY_UI = (() => {
  function updateCalendar(headerWrap, headerActions, video) {
    headerActions.querySelector('.cell-replay-link')?.remove();
    headerWrap.classList.toggle('has-replay', !!video);
    headerActions.classList.toggle('has-replay', !!video);
    if (!video) return;
    const link = document.createElement('a');
    link.className = 'cell-replay-link';
    link.dataset.source = video.isChzzk ? 'chzzk' : 'youtube';
    if (/^https?:\/\//i.test(String(video.url || ''))) link.href = video.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.title = `${video.isChzzk ? '치지직' : 'YouTube'} ${video.source === 'manual' ? '수동 지정 ' : ''}다시보기`;
    link.setAttribute('aria-label', link.title);
    const icon = video.isChzzk ? 'assets/images/chzzk_favicon.png' : 'assets/images/youtube_replay_icon.svg';
    link.innerHTML = `<span class="cell-replay-icon" aria-hidden="true"><img src="${icon}" alt=""></span><span class="cell-replay-label">${video.isChzzk ? 'Chzzk' : 'YouTube'}</span>`;
    link.addEventListener('click', event => event.stopPropagation());
    link.addEventListener('keydown', event => event.stopPropagation());
    headerActions.appendChild(link);
  }

  function updateList(item, video, entries, placeholderEntries, daysDiff) {
    item.querySelector('.timeline-yt, .timeline-yt-empty')?.remove();
    if (video) {
      const link = document.createElement('a');
      link.className = 'timeline-yt';
      link.dataset.source = video.isChzzk ? 'chzzk' : 'youtube';
      link.dataset.sourceLabel = video.isChzzk ? 'Chzzk' : 'YouTube';
      if (/^https?:\/\//i.test(String(video.url || ''))) link.href = video.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.title = video.source === 'live' ? '치지직 라이브 스트리밍' : `${video.isChzzk ? '치지직' : 'YouTube'} ${video.source === 'manual' ? '수동 지정 ' : ''}다시보기`;
      link.setAttribute('aria-label', link.title);
      link.onclick = event => event.stopPropagation();
      const play = '<span class="yt-play-icon"></span>';
      if (video.thumb) {
        link.innerHTML = `<img class="yt-thumb-img" src="${safeUrl(video.thumb)}" alt="replay">${play}`;
      } else {
        link.innerHTML = play;
        if (video.isChzzk && video.chzzkId) {
          const workerUrl = typeof WORKER_URL !== 'undefined' ? WORKER_URL : 'https://crank-admin.axcrank.workers.dev';
          fetch(`${workerUrl}/api/chzzk/video/${video.chzzkId}`)
            .then(response => response.json())
            .then(data => {
              if (item.contains(link) && data?.content?.thumbnailImageUrl) {
                link.innerHTML = `<img class="yt-thumb-img" src="${safeUrl(data.content.thumbnailImageUrl)}" alt="replay">${play}`;
              }
            }).catch(() => {});
        }
      }
      item.appendChild(link);
    } else if (placeholderEntries.length && !String(placeholderEntries[0].title || '').includes('휴방')) {
      const empty = document.createElement('div');
      empty.className = 'timeline-yt-empty';
      const hasEuroTruck = entries.some(entry => String(entry.title || '').includes('유로트럭') || String(entry.title || '').includes('유로 트럭'));
      if (hasEuroTruck) empty.innerHTML = '<span class="yt-icon">📺</span><span class="yt-label">유로트럭 다시보기는<br>유튜브에 제공되지 않습니다</span>';
      else if (daysDiff >= 3) empty.innerHTML = '<span class="yt-icon">📺</span><span class="yt-label">치지직 다시보기를<br>통해 봐주세요</span>';
      else if (daysDiff === 0) empty.innerHTML = '<span class="yt-icon">⏳</span><span class="yt-label">방송 이후<br>업데이트 예정</span>';
      else empty.innerHTML = '<span class="yt-icon">⏳</span><span class="yt-label">다시보기 대기중</span>';
      item.appendChild(empty);
    }
  }
  return { updateCalendar, updateList };
})();

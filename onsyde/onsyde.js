(function () {
  const baseSource = window.ONSYDE_SCHEDULE;
  const source = { ...baseSource, events: window.ONSYDE_STORE ? window.ONSYDE_STORE.loadEvents() : baseSource.events };
  const I18N = {
    en: {
      typeTeam: "TEAM LEAGUE", typeMatch: "MATCH", typeTournament: "TOURNAMENT",
      timeTBA: "Time TBA",
      detailTBA: "More details will be announced.",
      emptyMonth: "No scheduled events for this month.",
      sourceSheet: "Source sheet ↗",
      settingsLanguage: "Language", settingsTheme: "Theme",
      settingsAdmin: "Admin", adminLogin: "Log in",
      today: "Today"
    },
    ko: {
      typeTeam: "팀 리그", typeMatch: "매치", typeTournament: "토너먼트",
      timeTBA: "시간 미정",
      detailTBA: "상세 정보가 곧 공개됩니다.",
      emptyMonth: "이번 달 일정이 없습니다.",
      sourceSheet: "원본 시트 ↗",
      settingsLanguage: "언어", settingsTheme: "테마",
      settingsAdmin: "관리자", adminLogin: "로그인",
      today: "오늘"
    }
  };

  function detectLang() {
    const saved = localStorage.getItem("onsyde_lang");
    if (saved === "ko" || saved === "en") return saved;
    const nav = (navigator.language || navigator.userLanguage || "en").toLowerCase();
    return nav.startsWith("ko") ? "ko" : "en";
  }
  function detectTheme() {
    const saved = localStorage.getItem("onsyde_theme");
    return saved === "light" || saved === "dark" ? saved : "dark";
  }

  let lang = detectLang();
  let locale = lang === "ko" ? "ko-KR" : "en-US";
  const T = key => (I18N[lang] || I18N.en)[key] || "";

  const requestedMonth = new URLSearchParams(location.search).get("month");
  const requestedMatch = /^(\d{4})-(\d{2})$/.exec(requestedMonth || "");
  const todayDate = new Date();
  let year = requestedMatch ? Number(requestedMatch[1]) : todayDate.getFullYear();
  let month = requestedMatch ? Number(requestedMatch[2]) : todayDate.getMonth() + 1;
  let view = window.matchMedia("(max-width: 720px)").matches ? "agenda" : "calendar";
  let crankMonthData = {};
  let crankCoveredEventIndexes = new Set();
  let crankCoverageRequest = 0;

  const grid = document.getElementById("calendarGrid");
  const agenda = document.getElementById("agendaList");
  const calendarView = document.getElementById("calendarView");
  const agendaView = document.getElementById("agendaView");
  const eventDialog = document.getElementById("eventDialog");

  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);

  const dateKey = day => `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const eventsForDay = day => source.events.filter(event => event.date === dateKey(day));
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  function scheduleSeriesKey(value) {
    const sourceText = [value?.title, value?.short].filter(Boolean).join(" ").toUpperCase();
    const compact = sourceText.replace(/[^A-Z0-9]/g, "");
    if (compact.includes("PIGFEST8") || compact.includes("PIG8")) return "pig8";
    if (compact.includes("WARDITV") && compact.includes("SUMMER")) return "warditv-summer";
    if (compact.includes("WARDITV") && compact.includes("SPRING")) return "warditv-spring";
    if (compact.includes("WARDITV") && compact.includes("WINTER")) return "warditv-winter";
    if (compact.includes("GSLCK")) return "gsl-ck";
    if (compact.includes("GSTL")) return "gstl";
    if (compact.includes("RSL")) return "rsl";
    if (compact.includes("MOG2")) return "mog2";
    if (compact.includes("HOMESTORY") || compact.includes("HSC")) return "hsc";
    if (compact.includes("DOUYU")) return "douyu";
    if (compact.includes("TLMC")) return "tlmc";
    if (compact.includes("WARDI") && compact.includes("TEAMLEAGUE")) return "wardi-team-league";
    if (compact.includes("GSL")) return "gsl";
    return compact.length >= 5 ? compact : "";
  }

  function localCrankMonth(monthKey) {
    try {
      const saved = JSON.parse(localStorage.getItem("crank_storage") || "[]");
      const item = Array.isArray(saved) ? saved.find(entry => entry.key === `schedule:${monthKey}`) : null;
      if (!item) return null;
      return item.data || (item.value ? JSON.parse(item.value) : null);
    } catch (error) {
      return null;
    }
  }

  function rebuildCrankCoverage() {
    const matched = new Set();
    Object.entries(crankMonthData || {}).forEach(([day, personalEvents]) => {
      if (!Array.isArray(personalEvents)) return;
      const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      personalEvents.forEach(personalEvent => {
        const key = scheduleSeriesKey(personalEvent);
        if (!key) return;
        const matchIndex = source.events.findIndex((event, index) => (
          !matched.has(index) && event.date === date && scheduleSeriesKey(event) === key
        ));
        if (matchIndex >= 0) matched.add(matchIndex);
      });
    });
    crankCoveredEventIndexes = matched;
  }

  async function loadCrankCoverage() {
    const requestId = ++crankCoverageRequest;
    const monthKey = `${year}-${String(month).padStart(2, "0")}`;
    const urls = [
      `../data/schedule_${monthKey}.json`,
      `https://crank-schedule.github.io/Calendar/data/schedule_${monthKey}.json`
    ];
    let remoteData = null;
    for (const url of urls) {
      try {
        const response = await fetch(`${url}?t=${Date.now()}`, { cache: "no-store" });
        if (response.ok) {
          remoteData = await response.json();
          break;
        }
      } catch (error) {}
    }
    if (requestId !== crankCoverageRequest) return;
    crankMonthData = remoteData || localCrankMonth(monthKey) || {};
    rebuildCrankCoverage();
    renderCalendar();
    renderAgenda();
  }

  function seriesName(title) {
    if (/RSL/i.test(title)) return "RSL";
    if (/GSL/i.test(title)) return "GSL";
    if (/MOG2/i.test(title)) return "MOG2";
    if (/WardiTV/i.test(title)) return "WardiTV";
    if (/Wardi Team League/i.test(title)) return "Wardi TL";
    if (/TLMC/i.test(title)) return "TLMC";
    if (/PiG Sty/i.test(title)) return "PiG Sty";
    return title;
  }

  function compactLabel(event) {
    if (window.ONSYDE_STORE) return window.ONSYDE_STORE.compactLabel(event);
    if (event.short) return event.short;

    if (event.type === "team") {
      const opponents = [...(event.detail || "").matchAll(/ONSYDE vs ([^·]+)/gi)].map(match => match[1].trim());
      if (opponents.length) return `vs ${opponents[0]}${opponents.length > 1 ? ` +${opponents.length - 1}` : ""}`;
    }

    const players = ["Maru", "Zoun", "Krystianer", "Ryung", "Rex", "Neeb", "SHIN"].filter(player => (event.detail || "").includes(player));
    if (players.length) return `${players.join("/")} · ${seriesName(event.title)}`;

    return event.title
      .replace("WardiTV Winter Championship 2026", "WardiTV Winter")
      .replace("WardiTV Spring Championship", "WardiTV Spring")
      .replace(/Playoff Day (\d+)/i, "Playoff D$1")
      .replace("Preliminary Stage", "Preliminary");
  }

  function localTime(event) {
    if (window.ONSYDE_STORE) return window.ONSYDE_STORE.localTime(event, "en-US");
    if (!event.start) return "";
    const localDate = new Date(event.start);
    const hasMinutes = localDate.getMinutes() !== 0;
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      ...(hasMinutes ? { minute: "2-digit" } : {})
    }).format(localDate);
  }

  function eventCard(event) {
    const eventIndex = source.events.indexOf(event);
    const isCrankCovered = crankCoveredEventIndexes.has(eventIndex);
    return `<button type="button" class="event-card ${event.type}${isCrankCovered ? " is-crank-covered" : ""}" data-event-index="${eventIndex}" aria-label="Open ${escapeHtml(event.title)} details${isCrankCovered ? "; also on the CranK broadcast schedule" : ""}">
      ${event.start ? `<time datetime="${escapeHtml(event.start)}">${escapeHtml(localTime(event))}</time>` : ""}
      <span class="event-card__summary">${escapeHtml(compactLabel(event))}</span>
      ${isCrankCovered ? `<span class="crank-favicon" title="Also on the CranK broadcast schedule" aria-hidden="true"><img src="../favicon.jpg" alt=""></span>` : ""}
    </button>`;
  }

  function openEventDialog(event) {
    const eventDate = new Date(`${event.date}T00:00:00`);
    document.getElementById("eventDialogType").textContent = event.type === "team" ? T("typeTeam") : event.type === "match" ? T("typeMatch") : T("typeTournament");
    document.getElementById("eventDialogDate").textContent = eventDate.toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    document.getElementById("eventDialogTitle").textContent = event.title;
    const timeNode = document.getElementById("eventDialogTime");
    const detailNode = document.getElementById("eventDialogDetail");
    timeNode.textContent = localTime(event) || T("timeTBA");
    detailNode.textContent = event.detail || T("detailTBA");
    eventDialog.showModal();
  }

  function renderCalendar() {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const lastDate = new Date(year, month, 0).getDate();
    const previousLast = new Date(year, month - 1, 0).getDate();
    const totalCells = Math.ceil((firstDay + lastDate) / 7) * 7;
    let html = "";

    for (let index = 0; index < totalCells; index += 1) {
      const day = index - firstDay + 1;
      const inMonth = day > 0 && day <= lastDate;
      const displayDay = day < 1 ? previousLast + day : day > lastDate ? day - lastDate : day;
      const dayEvents = inMonth ? eventsForDay(day) : [];
      const weekendClass = index % 7 === 0 ? " is-sun" : index % 7 === 6 ? " is-sat" : "";
      html += `<section class="day-cell${inMonth ? "" : " is-outside"}${weekendClass}${dayEvents.length ? " has-events" : ""}${inMonth && dateKey(day) === todayKey ? " is-today" : ""}">
        <header><span>${displayDay}</span></header>
        <div class="day-events">${dayEvents.map(eventCard).join("")}</div>
      </section>`;
    }
    grid.innerHTML = html;
  }

  function renderAgenda() {
    const monthEvents = source.events.filter(event => {
      const date = new Date(`${event.date}T00:00:00`);
      return date.getFullYear() === year && date.getMonth() + 1 === month;
    });
    const grouped = monthEvents.reduce((result, event) => {
      (result[event.date] ||= []).push(event);
      return result;
    }, {});

    agenda.innerHTML = Object.entries(grouped).map(([date, events]) => {
      const value = new Date(`${date}T00:00:00`);
      return `<section class="agenda-day${date === todayKey ? " is-today" : ""}">
        <div class="agenda-date"><strong>${value.getDate()}</strong><span>${value.toLocaleDateString(locale, { weekday: "short" })}</span></div>
        <div class="agenda-events">${events.map(eventCard).join("")}</div>
      </section>`;
    }).join("") || `<p class="empty-state">${escapeHtml(T("emptyMonth"))}</p>`;
  }

  function updateHeader() {
    document.getElementById("monthLabel").textContent = new Date(year, month - 1, 1).toLocaleDateString(locale, { month: "long" });
    document.getElementById("yearLabel").textContent = year;
    const monthKey = `${year}-${String(month).padStart(2, "0")}`;
    const crankLink = document.getElementById("crankScheduleLink");
    if (crankLink) crankLink.href = `../crank_schedule.html?month=${monthKey}`;
    const adminLink = document.getElementById("onsydeAdminLink");
    if (adminLink) adminLink.href = `admin.html?month=${monthKey}`;
    const sheetId = source.sheets?.[monthKey];
    const sourceLink = document.getElementById("sourceSheet");
    if (sourceLink) {
      sourceLink.hidden = !sheetId;
      if (sheetId) {
        sourceLink.href = `https://docs.google.com/spreadsheets/d/1y_4NaLrJkdIvppko6TcSFajtFBF3O5BvImw6dywDPUQ/edit?gid=${sheetId}#gid=${sheetId}`;
      }
    }
  }

  function setView(nextView) {
    view = nextView;
    calendarView.hidden = view !== "calendar";
    agendaView.hidden = view !== "agenda";
    document.querySelectorAll("[data-view]").forEach(button => button.classList.toggle("is-active", button.dataset.view === view));
  }

  function render() {
    updateHeader();
    crankMonthData = {};
    crankCoveredEventIndexes = new Set();
    renderCalendar();
    renderAgenda();
    setView(view);
    loadCrankCoverage();
  }

  document.getElementById("prevMonth").addEventListener("click", () => {
    month -= 1;
    if (month === 0) { month = 12; year -= 1; }
    render();
  });

  document.getElementById("nextMonth").addEventListener("click", () => {
    month += 1;
    if (month === 13) { month = 1; year += 1; }
    render();
  });

  document.getElementById("todayBtn").addEventListener("click", () => {
    year = now.getFullYear();
    month = now.getMonth() + 1;
    render();
  });

  document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => setView(button.dataset.view)));

  document.addEventListener("click", event => {
    const card = event.target.closest(".event-card");
    if (card) openEventDialog(source.events[Number(card.dataset.eventIndex)]);
  });

  eventDialog.querySelector(".dialog-close").addEventListener("click", () => eventDialog.close());
  eventDialog.addEventListener("click", event => {
    if (event.target === eventDialog) eventDialog.close();
  });

  function updateWeekdayHeaders() {
    document.querySelectorAll(".weekdays span").forEach((cell, index) => {
      cell.textContent = new Date(2024, 0, 7 + index).toLocaleDateString(locale, { weekday: "short" });
    });
  }

  function applyStaticText() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(node => { node.textContent = T(node.dataset.i18n); });
    const sourceLink = document.getElementById("sourceSheet");
    if (sourceLink) sourceLink.textContent = T("sourceSheet");
    updateWeekdayHeaders();
  }

  function syncSettingsButtons() {
    const theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    document.querySelectorAll("[data-lang]").forEach(button => button.classList.toggle("is-active", button.dataset.lang === lang));
    document.querySelectorAll("[data-theme-choice]").forEach(button => button.classList.toggle("is-active", button.dataset.themeChoice === theme));
  }

  function applyLanguage(nextLang) {
    lang = nextLang;
    locale = lang === "ko" ? "ko-KR" : "en-US";
    localStorage.setItem("onsyde_lang", lang);
    applyStaticText();
    syncSettingsButtons();
    render();
  }

  function applyTheme(nextTheme) {
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("onsyde_theme", nextTheme);
    syncSettingsButtons();
  }

  const settingsToggle = document.getElementById("settingsToggle");
  const settingsPanel = document.getElementById("settingsPanel");
  function openSettings(open) {
    settingsPanel.hidden = !open;
    settingsToggle.setAttribute("aria-expanded", open ? "true" : "false");
  }
  settingsToggle.addEventListener("click", event => {
    event.stopPropagation();
    openSettings(settingsPanel.hidden);
  });
  settingsPanel.addEventListener("click", event => event.stopPropagation());
  document.addEventListener("click", () => openSettings(false));
  document.addEventListener("keydown", event => { if (event.key === "Escape") openSettings(false); });
  settingsPanel.querySelectorAll("[data-lang]").forEach(button => button.addEventListener("click", () => applyLanguage(button.dataset.lang)));
  settingsPanel.querySelectorAll("[data-theme-choice]").forEach(button => button.addEventListener("click", () => applyTheme(button.dataset.themeChoice)));

  window.addEventListener("onsyde-schedule-changed", event => {
    source.events = Array.isArray(event.detail) ? event.detail : window.ONSYDE_STORE.loadEvents();
    render();
  });
  window.addEventListener("storage", event => {
    if (event.key !== window.ONSYDE_STORE?.storageKey) return;
    source.events = window.ONSYDE_STORE.loadEvents();
    render();
  });

  async function loadRemoteSchedule() {
    if (!window.ONSYDE_STORE?.loadRemoteEvents) return;
    const remote = await window.ONSYDE_STORE.loadRemoteEvents();
    if (Array.isArray(remote) && remote.length) {
      source.events = remote;
      render();
    }
  }

  applyTheme(detectTheme());
  applyStaticText();
  syncSettingsButtons();
  render();
  loadRemoteSchedule();
})();

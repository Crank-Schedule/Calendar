(async function () {
  const WORKER_URL = "https://crank-admin.axcrank.workers.dev";
  const SESSION_KEY = "onsyde_admin_session";
  const AUTH_SCOPE = "onsyde";

  function getAdminSession() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      if (session?.token && session.scope === AUTH_SCOPE && Number(session.expiresAt) > Date.now()) return session;
    } catch (error) {}
    localStorage.removeItem(SESSION_KEY);
    return null;
  }

  function showAuthGate(message = "Authentication is required.") {
    document.body.classList.add("auth-pending");
    document.getElementById("adminAuthMessage").textContent = message;
  }

  function finishAuthentication() {
    document.body.classList.remove("auth-pending");
  }

  async function loginWithPassword(password) {
    try {
      const response = await fetch(`${WORKER_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, scope: AUTH_SCOPE })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return { ok: false, error: result.error || "Login failed." };
      if (!result.token || result.scope !== AUTH_SCOPE) {
        return { ok: false, error: "Deploy the updated Worker before using ONSYDE admin." };
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        token: result.token,
        scope: AUTH_SCOPE,
        expiresAt: Date.now() + Number(result.expiresIn || 0) * 1000
      }));
      return { ok: true };
    } catch (error) {
      return { ok: false, error: "Unable to reach the authentication server." };
    }
  }

  async function unlockAdmin() {
    if (getAdminSession()) {
      finishAuthentication();
      return true;
    }
    const password = prompt("Enter ONSYDE admin password:");
    if (password === null) {
      showAuthGate("Admin is locked.");
      return false;
    }
    const result = await loginWithPassword(password);
    if (!result.ok) {
      showAuthGate(result.error);
      return false;
    }
    finishAuthentication();
    toast("Signed in");
    return true;
  }

  const store = window.ONSYDE_STORE;
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const requested = /^(\d{4})-(\d{2})$/.exec(new URLSearchParams(location.search).get("month") || "");
  const todayDate = new Date();
  const todayKey = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, "0")}-${String(todayDate.getDate()).padStart(2, "0")}`;
  let year = requested ? Number(requested[1]) : todayDate.getFullYear();
  let month = requested ? Number(requested[2]) : todayDate.getMonth() + 1;
  let events = store.loadEvents();
  let crankCovered = new Set();
  let crankCoverageReq = 0;

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
    } catch (error) { return null; }
  }

  function rebuildCrankCoverage(crankMonthData) {
    const matched = new Set();
    Object.entries(crankMonthData || {}).forEach(([day, personalEvents]) => {
      if (!Array.isArray(personalEvents)) return;
      const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      personalEvents.forEach(personalEvent => {
        const key = scheduleSeriesKey(personalEvent);
        if (!key) return;
        const matchIndex = events.findIndex((event, index) => !matched.has(index) && event.date === date && scheduleSeriesKey(event) === key);
        if (matchIndex >= 0) matched.add(matchIndex);
      });
    });
    crankCovered = matched;
  }

  async function loadCrankCoverage() {
    const requestId = ++crankCoverageReq;
    const monthKey = `${year}-${String(month).padStart(2, "0")}`;
    const urls = [`../data/schedule_${monthKey}.json`, `https://crank-schedule.github.io/Calendar/data/schedule_${monthKey}.json`];
    let remoteData = null;
    for (const url of urls) {
      try {
        const response = await fetch(`${url}?t=${Date.now()}`, { cache: "no-store" });
        if (response.ok) { remoteData = await response.json(); break; }
      } catch (error) {}
    }
    if (requestId !== crankCoverageReq) return;
    rebuildCrankCoverage(remoteData || localCrankMonth(monthKey) || {});
    render();
  }

  const grid = document.getElementById("adminGrid");
  const editor = document.getElementById("eventEditor");
  const form = document.getElementById("eventForm");
  const fields = {
    index: document.getElementById("eventIndex"),
    date: document.getElementById("eventDate"),
    type: document.getElementById("eventType"),
    title: document.getElementById("eventTitle"),
    detail: document.getElementById("eventDetail"),
    short: document.getElementById("eventShort"),
    hour: document.getElementById("eventHour"),
    minute: document.getElementById("eventMinute")
  };

  const pad2 = number => String(number).padStart(2, "0");
  fields.hour.innerHTML = `<option value="">--</option>` + Array.from({ length: 24 }, (_, h) => `<option value="${pad2(h)}">${pad2(h)}</option>`).join("");
  fields.minute.innerHTML = `<option value="">--</option>` + Array.from({ length: 60 }, (_, m) => `<option value="${pad2(m)}">${pad2(m)}</option>`).join("");

  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);

  function localInputValue(start) {
    if (!start) return "";
    const value = new Date(start);
    if (Number.isNaN(value.getTime())) return "";
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(value);
    const hh = parts.find(part => part.type === "hour")?.value || "00";
    const mm = parts.find(part => part.type === "minute")?.value || "00";
    return `${hh === "24" ? "00" : hh}:${mm}`;
  }

  function kstTime(event) {
    if (!event.start) return "";
    const value = new Date(event.start);
    if (Number.isNaN(value.getTime())) return "";
    const mm = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Seoul", minute: "2-digit" }).format(value);
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Seoul",
      hour: "numeric",
      ...(mm !== "00" ? { minute: "2-digit" } : {}),
      hour12: true
    }).format(value);
  }

  function toast(message) {
    const node = document.getElementById("adminToast");
    node.textContent = message;
    node.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.classList.remove("show"), 1800);
  }

  function updateHeader() {
    document.getElementById("monthLabel").textContent = monthNames[month - 1];
    document.getElementById("yearLabel").textContent = year;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    document.getElementById("publicScheduleLink").href = `index.html?month=${key}`;
    history.replaceState(null, "", `?month=${key}`);
  }

  function render() {
    updateHeader();
    const firstDay = new Date(year, month - 1, 1).getDay();
    const lastDate = new Date(year, month, 0).getDate();
    const previousLast = new Date(year, month - 1, 0).getDate();
    const totalCells = Math.ceil((firstDay + lastDate) / 7) * 7;
    let html = "";
    for (let cell = 0; cell < totalCells; cell += 1) {
      const day = cell - firstDay + 1;
      const inMonth = day > 0 && day <= lastDate;
      const shownDay = day < 1 ? previousLast + day : day > lastDate ? day - lastDate : day;
      const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayEvents = inMonth ? events.map((event, index) => ({ event, index })).filter(item => item.event.date === date) : [];
      const weekendClass = cell % 7 === 0 ? " is-sun" : cell % 7 === 6 ? " is-sat" : "";
      html += `<section class="admin-day${inMonth ? "" : " is-outside"}${weekendClass}${inMonth && date === todayKey ? " is-today" : ""}">
        <header><span>${shownDay}</span>${inMonth ? `<button type="button" class="day-add" data-date="${date}" aria-label="Add event on ${date}">+</button>` : ""}</header>
        <div class="admin-events">${dayEvents.map(({ event, index }) => `<button type="button" class="admin-event ${escapeHtml(event.type)}${crankCovered.has(index) ? " is-crank-covered" : ""}" data-index="${index}">
          ${event.start ? `<time>${escapeHtml(kstTime(event))}</time>` : ""}<span>${escapeHtml(store.compactLabel(event))}</span>${crankCovered.has(index) ? `<span class="crank-favicon" aria-hidden="true"><img src="../favicon.jpg" alt=""></span>` : ""}
        </button>`).join("")}</div>
      </section>`;
    }
    grid.innerHTML = html;
  }

  function openEditor(index = -1, date = "") {
    const event = index >= 0 ? events[index] : null;
    document.getElementById("editorTitle").textContent = event ? "Edit event" : "Add event";
    fields.index.value = event ? String(index) : "";
    fields.date.value = event?.date || date || `${year}-${String(month).padStart(2, "0")}-01`;
    fields.type.value = event?.type || "match";
    fields.title.value = event?.title || "";
    fields.detail.value = event?.detail || "";
    fields.short.value = event?.short || "";
    const startTime = localInputValue(event?.start);
    fields.hour.value = startTime ? startTime.slice(0, 2) : "";
    fields.minute.value = startTime ? startTime.slice(3, 5) : "";
    document.getElementById("deleteEvent").hidden = !event;
    editor.showModal();
    setTimeout(() => fields.title.focus(), 0);
  }

  function closeEditor() { editor.close(); }

  async function saveRemote() {
    const session = getAdminSession();
    if (!session) { toast("Login required · saved locally only"); return; }
    try {
      const response = await fetch(`${WORKER_URL}/api/onsyde-schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` },
        body: JSON.stringify(events)
      });
      if (!response.ok) {
        toast(response.status === 401 ? "Session expired · log in again" : "GitHub save failed · saved locally only");
        return;
      }
      toast("Saved to GitHub");
    } catch (error) {
      toast("Server unreachable · saved locally only");
    }
  }

  function show() {
    crankCovered = new Set();
    render();
    loadCrankCoverage();
  }

  function persist(message) {
    events = store.saveEvents(events);
    show();
    toast(message);
    saveRemote();
  }

  async function loadAndRender() {
    const remote = store.loadRemoteEvents ? await store.loadRemoteEvents() : null;
    if (Array.isArray(remote) && remote.length) events = store.saveEvents(remote);
    show();
  }

  grid.addEventListener("click", event => {
    const add = event.target.closest(".day-add");
    if (add) return openEditor(-1, add.dataset.date);
    const card = event.target.closest(".admin-event");
    if (card) openEditor(Number(card.dataset.index));
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    const record = {
      date: fields.date.value,
      type: fields.type.value,
      title: fields.title.value.trim(),
      detail: fields.detail.value.trim(),
      short: fields.short.value.trim(),
      ...(fields.hour.value && fields.minute.value ? { start: `${fields.date.value}T${fields.hour.value}:${fields.minute.value}:00+09:00` } : {})
    };
    if (!record.date || !record.title) return;
    const index = fields.index.value === "" ? -1 : Number(fields.index.value);
    if (index >= 0) events[index] = record;
    else events.push(record);
    closeEditor();
    persist(index >= 0 ? "Event updated" : "Event added");
  });

  document.getElementById("deleteEvent").addEventListener("click", () => {
    const index = Number(fields.index.value);
    if (!Number.isInteger(index) || index < 0) return;
    events.splice(index, 1);
    closeEditor();
    persist("Event deleted");
  });
  document.getElementById("closeEditor").addEventListener("click", closeEditor);
  document.getElementById("cancelEditor").addEventListener("click", closeEditor);
  document.getElementById("prevMonth").addEventListener("click", () => { if (--month === 0) { month = 12; year -= 1; } show(); });
  document.getElementById("nextMonth").addEventListener("click", () => { if (++month === 13) { month = 1; year += 1; } show(); });
  document.getElementById("todayBtn").addEventListener("click", () => { year = todayDate.getFullYear(); month = todayDate.getMonth() + 1; show(); });

  function applyThemeButton() {
    document.getElementById("themeToggle").textContent = document.documentElement.dataset.theme === "light" ? "◐" : "☼";
  }
  (function initTheme() {
    const saved = localStorage.getItem("onsyde_theme");
    document.documentElement.dataset.theme = saved === "light" || saved === "dark" ? saved : "dark";
    applyThemeButton();
  })();
  document.getElementById("themeToggle").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("onsyde_theme", next);
    applyThemeButton();
  });

  document.getElementById("lockAdmin").addEventListener("click", () => {
    localStorage.removeItem(SESSION_KEY);
    location.reload();
  });

  document.getElementById("retryAdminLogin").addEventListener("click", async () => {
    if (await unlockAdmin()) await loadAndRender();
  });
  if (await unlockAdmin()) await loadAndRender();
})();

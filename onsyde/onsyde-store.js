(function () {
  const STORAGE_KEY = "onsyde_schedule_events_v1";
  const DATA_VERSION_KEY = "onsyde_schedule_data_version";
  const DATA_VERSION = 3;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isEvent(value) {
    return value && /^\d{4}-\d{2}-\d{2}$/.test(String(value.date || "")) && String(value.title || "").trim();
  }

  function baseEvents() {
    return Array.isArray(window.ONSYDE_SCHEDULE?.events) ? window.ONSYDE_SCHEDULE.events : [];
  }

  function loadEvents() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved) && saved.every(isEvent)) {
        const savedVersion = Number(localStorage.getItem(DATA_VERSION_KEY) || 1);
        if (savedVersion < DATA_VERSION) {
          const merged = clone(saved);
          const identities = new Set(merged.map(event => `${event.date}|${event.start || ""}|${event.type || "match"}`));
          baseEvents()
            .filter(event => event.date >= "2026-08-01")
            .forEach(event => {
              const identity = `${event.date}|${event.start || ""}|${event.type || "match"}`;
              if (!identities.has(identity)) {
                merged.push(clone(event));
                identities.add(identity);
              }
            });
          merged.sort((a, b) => a.date.localeCompare(b.date) || String(a.start || "").localeCompare(String(b.start || "")) || a.title.localeCompare(b.title));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          localStorage.setItem(DATA_VERSION_KEY, String(DATA_VERSION));
          return merged;
        }
        return clone(saved);
      }
    } catch (error) {}
    return clone(baseEvents());
  }

  function cleanEvents(events) {
    return (Array.isArray(events) ? events : [])
      .filter(isEvent)
      .map(event => ({
        date: String(event.date),
        ...(event.start ? { start: String(event.start) } : {}),
        type: ["team", "match", "tournament"].includes(event.type) ? event.type : "match",
        title: String(event.title).trim(),
        ...(String(event.detail || "").trim() ? { detail: String(event.detail).trim() } : {}),
        ...(String(event.short || "").trim() ? { short: String(event.short).trim() } : {})
      }))
      .sort((a, b) => a.date.localeCompare(b.date) || String(a.start || "").localeCompare(String(b.start || "")) || a.title.localeCompare(b.title));
  }

  const REMOTE_URLS = [
    "../data/onsyde-schedule.json",
    "https://crank-schedule.github.io/Calendar/data/onsyde-schedule.json"
  ];

  async function loadRemoteEvents() {
    for (const url of REMOTE_URLS) {
      try {
        const response = await fetch(`${url}?t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) continue;
        const data = await response.json();
        if (Array.isArray(data) && data.every(isEvent)) return cleanEvents(data);
      } catch (error) {}
    }
    return null;
  }

  function saveEvents(events) {
    const clean = cleanEvents(events);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    localStorage.setItem(DATA_VERSION_KEY, String(DATA_VERSION));
    window.dispatchEvent(new CustomEvent("onsyde-schedule-changed", { detail: clone(clean) }));
    return clone(clean);
  }

  function resetEvents() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(DATA_VERSION_KEY, String(DATA_VERSION));
    const events = clone(baseEvents());
    window.dispatchEvent(new CustomEvent("onsyde-schedule-changed", { detail: events }));
    return events;
  }

  function dateKey(date) {
    const value = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(value.getTime())) return "";
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }

  function eventsForDate(date, events = loadEvents()) {
    const key = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : dateKey(date);
    return events.filter(event => event.date === key);
  }

  function seriesName(title) {
    if (/RSL/i.test(title)) return "RSL";
    if (/GSL/i.test(title)) return "GSL";
    if (/MOG2/i.test(title)) return "MOG2";
    if (/WardiTV/i.test(title)) return "WardiTV";
    if (/Wardi Team League/i.test(title)) return "Wardi TL";
    if (/TLMC/i.test(title)) return "TLMC";
    if (/PiG Sty|PiGFest/i.test(title)) return "PiG Sty";
    if (/HomeStory/i.test(title)) return "HSC";
    if (/CranK Gathers/i.test(title)) return "CranK Gathers";
    return title;
  }

  function compactLabel(event) {
    if (event.short) return event.short;
    if (event.type === "team") {
      const opponents = [...String(event.detail || "").matchAll(/ONSYDE vs ([^·]+)/gi)].map(match => match[1].trim());
      if (opponents.length) return `vs ${opponents[0]}${opponents.length > 1 ? ` +${opponents.length - 1}` : ""}`;
    }
    const players = ["Maru", "Zoun", "Krystianer", "Ryung", "Rex", "Neeb", "SHIN"]
      .filter(player => String(event.detail || "").includes(player));
    if (players.length) return `${players.join("/")} · ${seriesName(event.title)}`;
    return String(event.title || "")
      .replace("WardiTV Winter Championship 2026", "WardiTV Winter")
      .replace("WardiTV Spring Championship", "WardiTV Spring")
      .replace(/Playoff Day (\d+)/i, "Playoff D$1")
      .replace("Preliminary Stage", "Preliminary");
  }

  function localTime(event, locale = "en-US") {
    if (!event?.start) return "";
    const value = new Date(event.start);
    if (Number.isNaN(value.getTime())) return "";
    return new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      ...(value.getMinutes() ? { minute: "2-digit" } : {})
    }).format(value);
  }

  function toCrankEntry(event) {
    const label = compactLabel(event);
    return {
      title: label,
      time: localTime(event),
      link: "",
      color: event.type === "team" ? "#B6F23D" : event.type === "match" ? "#46E6D1" : "#39F27F",
      icon: "onsyde",
      __onsyde: true,
      __onsydeEvent: clone(event)
    };
  }

  window.ONSYDE_STORE = {
    storageKey: STORAGE_KEY,
    loadEvents,
    loadRemoteEvents,
    cleanEvents,
    saveEvents,
    resetEvents,
    eventsForDate,
    compactLabel,
    localTime,
    toCrankEntry
  };
})();

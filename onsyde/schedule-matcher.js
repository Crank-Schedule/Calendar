(function () {
  // Match the competition itself, not the stage, player list, or language.
  // The same matcher is shared by the personal, ONSYDE, and admin calendars.
  const PLAYER_ALIASES = [
    /\bmaru\b|조성주/i,
    /\bzoun\b|박한솔/i,
    /\bkrystianer\b/i,
    /\bryung\b|김동원/i,
    /\brex\b/i,
    /\bneeb\b/i,
    /\bshin\b|신희범/i,
    /\bclem\b|\bcure\b|\bhero\b|\bheromarine\b|\bmaxpax\b|\bggmachine\b|\bnicoract\b|\bbyun\b|\blambo\b|\brogue\b/i
  ];

  const NOISE_TOKENS = new Set([
    "같이보기", "보기", "입중계", "응원방", "중계", "방송", "일정", "대회", "예정", "확정",
    "group", "stage", "day", "round", "qualifier", "qualification", "playoff", "playoffs",
    "final", "finals", "match", "matches", "live", "watch", "vs", "versus",
    "cup", "championship", "tournament", "league", "series", "season", "open", "classic",
    "summer", "winter", "spring", "autumn", "fall", "그룹", "스테이지", "라운드", "결승", "플레이오프"
  ]);

  const BROAD_FAMILY_TOKENS = new Set(["warditv"]);

  function replaceAliases(value) {
    return String(value || "")
      .normalize("NFKC")
      .toLowerCase()
      // Korean/English spellings of the same competition.
      .replace(/쿵푸\s*컵/g, "kungfu")
      .replace(/kung\s*fu\s*cup/g, "kungfu")
      .replace(/피그\s*페스트/g, "pigfest")
      .replace(/피그\s*8/g, "pig8");
  }

  function sourceText(value) {
    const onsydeEvent = value && value.__onsydeEvent;
    return [value?.title, value?.short, onsydeEvent?.title, onsydeEvent?.short]
      .filter(Boolean).join(" ");
  }

  function normalizeToken(token) {
    let value = token;
    if (/^\d+$/.test(value) || /^ro\d+$/i.test(value)) return "";
    value = value.replace(/\d+$/g, "");
    value = value.replace(/(festival|fest)$/i, "");
    value = value.replace(/(championship|tournament|league|series|season|cup)$/i, "");
    if (NOISE_TOKENS.has(value) || PLAYER_ALIASES.some(pattern => pattern.test(value))) return "";
    if (value.length < 2) return "";
    return value;
  }

  function tokens(value) {
    const text = replaceAliases(sourceText(value));
    const raw = text.match(/[a-z0-9]+|[가-힣]+/g) || [];
    return [...new Set(raw.map(normalizeToken).filter(Boolean))];
  }

  function key(value) {
    return tokens(value).sort().join("+");
  }

  function timeKey(value) {
    const explicit = String(value?.time || "").trim().toUpperCase();
    if (explicit) {
      const match = explicit.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);
      if (match) {
        let hour = Number(match[1]);
        const minute = Number(match[2] || 0);
        const meridiem = match[3];
        if (meridiem === "AM" && hour === 12) hour = 0;
        if (meridiem === "PM" && hour < 12) hour += 12;
        if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) return hour * 60 + minute;
      }
    }

    if (value?.start) {
      const date = new Date(value.start);
      if (!Number.isNaN(date.getTime())) return date.getHours() * 60 + date.getMinutes();
    }
    return null;
  }

  function matches(left, right) {
    const leftTokens = tokens(left);
    const rightTokens = tokens(right);
    if (!leftTokens.length || !rightTokens.length) return false;
    const leftKey = leftTokens.slice().sort().join("+");
    const rightKey = rightTokens.slice().sort().join("+");
    if (leftKey === rightKey) return true;
    const rightSet = new Set(rightTokens);
    if (leftTokens.some(token => BROAD_FAMILY_TOKENS.has(token) && rightSet.has(token))) return true;

    // The two calendars can describe the same match with different titles
    // (for example, a personal "GSTL final" watch entry vs. a team "GSTL
    // Final" entry). Both sides are already filtered to the same date by the
    // callers, so an explicit equal clock time is a safe final fallback.
    const leftTime = timeKey(left);
    const rightTime = timeKey(right);
    return leftTime !== null && rightTime !== null && leftTime === rightTime;
  }

  window.SCHEDULE_MATCHER = { key, matches, timeKey, tokens };
})();

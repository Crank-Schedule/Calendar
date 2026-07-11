const DEFAULT_ALLOWED_ORIGINS = [
  'https://crank-schedule.github.io',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
];

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

function allowedOrigins(env) {
  const configured = String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...configured]);
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin && allowedOrigins(env).has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

function jsonResponse(request, env, body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...JSON_HEADERS,
      ...corsHeaders(request, env),
      ...extraHeaders,
    },
  });
}

function isAllowedBrowserOrigin(request, env) {
  const origin = request.headers.get('Origin');
  return !origin || allowedOrigins(env).has(origin);
}

function bytesToBase64(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function toBase64Url(value) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

async function importSigningKey(secret, usages) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usages,
  );
}

async function signToken(payload, secret) {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const key = await importSigningKey(secret, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(encodedPayload));
  return `${encodedPayload}.${toBase64Url(new Uint8Array(signature))}`;
}

async function verifyToken(token, secret) {
  try {
    if (!token || !secret) return false;
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const key = await importSigningKey(secret, ['verify']);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(parts[1]),
      new TextEncoder().encode(parts[0]),
    );
    if (!valid) return false;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(parts[0])));
    return payload.auth === true && Number.isFinite(payload.exp) && Date.now() < payload.exp;
  } catch {
    return false;
  }
}

function safeEqual(left, right) {
  const a = new TextEncoder().encode(String(left || ''));
  const b = new TextEncoder().encode(String(right || ''));
  let mismatch = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) mismatch |= (a[i] || 0) ^ (b[i] || 0);
  return mismatch === 0;
}

function clientAddress(request) {
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}

function rateLimitRequest(request) {
  return new Request(`https://rate-limit.invalid/login/${encodeURIComponent(clientAddress(request))}`);
}

async function loginAttempts(request) {
  const cached = await caches.default.match(rateLimitRequest(request));
  if (!cached) return { count: 0, resetAt: Date.now() + 10 * 60 * 1000 };
  try {
    return await cached.json();
  } catch {
    return { count: 0, resetAt: Date.now() + 10 * 60 * 1000 };
  }
}

async function recordFailedLogin(request, current) {
  const state = {
    count: current.count + 1,
    resetAt: current.resetAt > Date.now() ? current.resetAt : Date.now() + 10 * 60 * 1000,
  };
  await caches.default.put(
    rateLimitRequest(request),
    new Response(JSON.stringify(state), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=600' },
    }),
  );
}

async function clearFailedLogins(request) {
  await caches.default.delete(rateLimitRequest(request));
}

function bearerToken(request) {
  const header = request.headers.get('Authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

async function requireAuth(request, env) {
  return verifyToken(bearerToken(request), env.SIGNING_SECRET);
}

function githubHeaders(env) {
  return {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    'User-Agent': 'crank-schedule-worker',
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function updateGithubFile(env, filePath, content, message) {
  if (!env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is not configured');
  const repoOwner = env.GITHUB_OWNER || 'crank-schedule';
  const repoName = env.GITHUB_REPO || 'Calendar';
  const githubUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;
  const headers = githubHeaders(env);
  const existing = await fetch(githubUrl, { headers });
  let sha;
  if (existing.ok) {
    sha = (await existing.json()).sha;
  } else if (existing.status !== 404) {
    throw new Error(`GitHub lookup failed (${existing.status})`);
  }
  const body = {
    message,
    content: bytesToBase64(new TextEncoder().encode(content)),
    ...(sha ? { sha } : {}),
  };
  const updated = await fetch(githubUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  if (!updated.ok) throw new Error(`GitHub update failed (${updated.status})`);
}

async function readJsonBody(request, maxBytes = 256 * 1024) {
  const declaredSize = Number(request.headers.get('Content-Length') || 0);
  if (declaredSize > maxBytes) throw new RangeError('Payload too large');
  const text = await request.text();
  if (new TextEncoder().encode(text).length > maxBytes) throw new RangeError('Payload too large');
  JSON.parse(text);
  return text;
}

async function proxyChzzk(request, env, upstreamUrl, cacheSeconds = 60) {
  try {
    const response = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
        Accept: 'application/json',
      },
      cf: { cacheEverything: true, cacheTtl: cacheSeconds },
    });
    const body = await response.text();
    return new Response(body, {
      status: response.status,
      headers: {
        ...JSON_HEADERS,
        ...corsHeaders(request, env),
        'Cache-Control': `public, max-age=${cacheSeconds}`,
      },
    });
  } catch (error) {
    console.error('CHZZK proxy failed', error);
    return jsonResponse(request, env, { error: '치지직 정보를 불러오지 못했습니다.' }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (!isAllowedBrowserOrigin(request, env)) {
      return jsonResponse(request, env, { error: '허용되지 않은 출처입니다.' }, 403);
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    if (request.method === 'GET' && url.pathname === '/api/health') {
      return jsonResponse(request, env, { ok: true });
    }

    if (request.method === 'POST' && url.pathname === '/api/login') {
      if (!env.ADMIN_PASSWORD || !env.SIGNING_SECRET) {
        return jsonResponse(request, env, { error: '관리자 인증이 설정되지 않았습니다.' }, 503);
      }
      const attempts = await loginAttempts(request);
      if (attempts.resetAt > Date.now() && attempts.count >= 10) {
        return jsonResponse(
          request,
          env,
          { error: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.' },
          429,
          { 'Retry-After': String(Math.max(1, Math.ceil((attempts.resetAt - Date.now()) / 1000))) },
        );
      }
      try {
        const body = await request.json();
        if (!safeEqual(body.password, env.ADMIN_PASSWORD)) {
          await recordFailedLogin(request, attempts);
          return jsonResponse(request, env, { error: '비밀번호가 올바르지 않습니다.' }, 401);
        }
        await clearFailedLogins(request);
        const expiresIn = 2 * 60 * 60;
        const now = Date.now();
        const token = await signToken({ auth: true, iat: now, exp: now + expiresIn * 1000 }, env.SIGNING_SECRET);
        return jsonResponse(request, env, { token, expiresIn });
      } catch {
        return jsonResponse(request, env, { error: '잘못된 요청입니다.' }, 400);
      }
    }

    const scheduleMatch = url.pathname.match(/^\/api\/schedule\/(\d{4})-(0[1-9]|1[0-2])$/);
    if (request.method === 'PUT' && scheduleMatch) {
      if (!(await requireAuth(request, env))) return jsonResponse(request, env, { error: '인증이 만료되었습니다.' }, 401);
      try {
        const content = await readJsonBody(request);
        const month = `${scheduleMatch[1]}-${scheduleMatch[2]}`;
        await updateGithubFile(env, `data/schedule_${month}.json`, content, `Update schedule for ${month} via Admin`);
        return jsonResponse(request, env, { success: true });
      } catch (error) {
        console.error('Schedule update failed', error);
        const status = error instanceof RangeError ? 413 : 500;
        return jsonResponse(request, env, { error: '일정 저장에 실패했습니다.' }, status);
      }
    }

    if (request.method === 'PUT' && url.pathname === '/api/tournaments') {
      if (!(await requireAuth(request, env))) return jsonResponse(request, env, { error: '인증이 만료되었습니다.' }, 401);
      try {
        const content = await readJsonBody(request, 64 * 1024);
        await updateGithubFile(env, 'data/tournaments.json', content, 'Update tournaments via Admin');
        return jsonResponse(request, env, { success: true });
      } catch (error) {
        console.error('Tournament update failed', error);
        const status = error instanceof RangeError ? 413 : 500;
        return jsonResponse(request, env, { error: '대회 정보 저장에 실패했습니다.' }, status);
      }
    }

    const liveMatch = url.pathname.match(/^\/api\/chzzk\/live\/([A-Za-z0-9_-]+)$/);
    if (request.method === 'GET' && liveMatch) {
      return proxyChzzk(request, env, `https://api.chzzk.naver.com/service/v2/channels/${liveMatch[1]}/live-detail`, 30);
    }

    const videoMatch = url.pathname.match(/^\/api\/chzzk\/video\/([A-Za-z0-9_-]+)$/);
    if (request.method === 'GET' && videoMatch) {
      return proxyChzzk(request, env, `https://api.chzzk.naver.com/service/v2/videos/${videoMatch[1]}`, 300);
    }

    const channelMatch = url.pathname.match(/^\/api\/chzzk\/channel\/([A-Za-z0-9_-]+)\/videos$/);
    if (request.method === 'GET' && channelMatch) {
      return proxyChzzk(
        request,
        env,
        `https://api.chzzk.naver.com/service/v1/channels/${channelMatch[1]}/videos?videoType=REPLAY&sortType=LATEST&size=50`,
        300,
      );
    }

    return jsonResponse(request, env, { error: 'Not Found' }, 404);
  },
};

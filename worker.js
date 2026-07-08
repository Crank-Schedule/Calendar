export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS Header
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // 배포 후에는 특정 도메인으로 제한 가능
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 간단한 HMAC-SHA256 서명 기반 토큰 생성 (JWT 대용)
    async function signToken(payload) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw', encoder.encode(env.SIGNING_SECRET),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
      const data = btoa(JSON.stringify(payload));
      const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
      const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
      return `${data}.${sigBase64}`;
    }

    async function verifyToken(token) {
      if (!token) return false;
      const parts = token.split('.');
      if (parts.length !== 2) return false;
      
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw', encoder.encode(env.SIGNING_SECRET),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
      );
      
      const sigBuffer = Uint8Array.from(atob(parts[1]), c => c.charCodeAt(0));
      const isValid = await crypto.subtle.verify('HMAC', key, sigBuffer, encoder.encode(parts[0]));
      
      if (!isValid) return false;
      
      const payload = JSON.parse(atob(parts[0]));
      if (Date.now() > payload.exp) return false; // 만료 체크
      return true;
    }

    // 라우팅: 로그인
    if (request.method === 'POST' && url.pathname === '/api/login') {
      try {
        const body = await request.json();
        if (body.password === env.ADMIN_PASSWORD) {
          const expiresIn = 12 * 60 * 60; // 12 hours in seconds
          const payload = {
            auth: true,
            exp: Date.now() + (expiresIn * 1000)
          };
          const token = await signToken(payload);
          return new Response(JSON.stringify({ token, expiresIn }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        } else {
          return new Response(JSON.stringify({ error: '비밀번호가 틀렸습니다.' }), { 
            status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }
      } catch (e) {
        return new Response(JSON.stringify({ error: '잘못된 요청' }), { 
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }

    // 라우팅: 일정 저장
    if (request.method === 'PUT' && url.pathname.startsWith('/api/schedule/')) {
      const monthStr = url.pathname.replace('/api/schedule/', ''); // e.g. 2026-06
      const authHeader = request.headers.get('Authorization') || '';
      const token = authHeader.replace('Bearer ', '');
      
      const isValid = await verifyToken(token);
      if (!isValid) {
        return new Response(JSON.stringify({ error: '인증 실패 또는 만료됨' }), { 
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      // GitHub API 호출
      const repoOwner = 'crank-schedule';
      const repoName = 'Calendar';
      const filePath = `data/schedule_${monthStr}.json`;
      const githubUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;
      
      const ghHeaders = {
        'Authorization': `token ${env.GITHUB_TOKEN}`,
        'User-Agent': 'Cloudflare-Worker',
        'Accept': 'application/vnd.github.v3+json'
      };

      try {
        const newContent = await request.text(); // JSON String
        const encodedContent = btoa(unescape(encodeURIComponent(newContent)));

        // 1. 기존 파일의 SHA 가져오기 (업데이트를 위해 필수)
        let sha = null;
        const getRes = await fetch(githubUrl, { headers: ghHeaders });
        if (getRes.ok) {
          const getData = await getRes.json();
          sha = getData.sha;
        }

        // 2. 새 내용으로 업데이트 (PUT)
        const putBody = {
          message: `Update schedule for ${monthStr} via Admin`,
          content: encodedContent,
        };
        if (sha) putBody.sha = sha;

        const putRes = await fetch(githubUrl, {
          method: 'PUT',
          headers: ghHeaders,
          body: JSON.stringify(putBody)
        });

        if (putRes.ok) {
          return new Response(JSON.stringify({ success: true }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        } else {
          const errorJson = await putRes.text();
          return new Response(JSON.stringify({ error: 'GitHub 업데이트 실패', details: errorJson }), { 
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }
      } catch (e) {
        return new Response(JSON.stringify({ error: '서버 오류', details: e.message }), { 
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }

    // 라우팅: 치지직 프록시
    if (request.method === 'GET' && url.pathname.startsWith('/api/chzzk/video/')) {
      const videoId = url.pathname.replace('/api/chzzk/video/', '');
      try {
        const chzzkUrl = `https://api.chzzk.naver.com/service/v2/videos/${videoId}`;
        const response = await fetch(chzzkUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        const data = await response.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: '치지직 API 호출 실패', details: e.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};

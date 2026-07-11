# Crank Schedule

크랭크 방송 일정, 다시보기, 대회 정보와 관리자 저장 기능을 제공하는 정적 웹사이트입니다.

## 로컬 실행

```powershell
python -m http.server 8080 --directory "C:\Crank\Recording files\Schedule-improved"
```

브라우저에서 `http://127.0.0.1:8080/crank_schedule.html`을 엽니다. `file://`로 직접 열면 브라우저 보안 정책 때문에 일부 API와 JSON 로딩이 제한될 수 있습니다.

## Cloudflare Worker 배포

기존 `crank-admin` Worker와 기존 Secret을 그대로 사용합니다. 평소 업데이트는 다음 두 명령이면 끝납니다.

```powershell
npx wrangler deploy
Invoke-RestMethod "https://crank-admin.axcrank.workers.dev/api/health"
```

기존 Worker에 이미 등록된 다음 Secret은 일반 배포로 삭제되지 않습니다.

- `GITHUB_TOKEN`: `crank-schedule/Calendar`의 Contents 쓰기 권한만 부여합니다.
- `ADMIN_PASSWORD`: 관리자 저장 비밀번호입니다.
- `SIGNING_SECRET`: 충분히 긴 무작위 문자열을 사용합니다.

YouTube API 키는 공개 HTML에서 사용합니다. Google Cloud Console에서 반드시 다음 제한을 설정합니다.

- 웹사이트 제한: `https://crank-schedule.github.io/*`
- API 제한: YouTube Data API v3

배포 전 `wrangler.toml`의 Worker 이름이 `crank-admin`인지 확인합니다.

## 배포 순서

1. 기존 Worker에 `npx wrangler deploy`를 실행합니다.
2. `/api/health`가 `{ "ok": true }`를 반환하는지 확인합니다.
3. 정적 파일을 GitHub Pages 저장소에 반영합니다.
4. 일정, 다시보기, 관리자 로그인과 저장을 확인합니다.

## 구조

- `crank_schedule.html`: 공개 일정 화면
- `replay.html`: 다시보기 화면
- `admin.html`: 관리자 편집 화면
- `worker.js`: 인증, GitHub 저장, 치지직 프록시
- `data/`: 월별 일정과 대회 데이터
- `assets/images/`: 사이트 아이콘과 파비콘
- `schedule_css.css`: 공통 보조 스타일

`auto_clicker.py`와 `assets/images/button.png`는 자동화에 필요한 파일이므로 삭제하지 않습니다.

관리자 로그인은 이 브라우저에 30일간 유지됩니다. 공용 PC에서는 자물쇠 버튼을 눌러 로그아웃하세요.

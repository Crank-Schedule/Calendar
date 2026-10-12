# Shared recent presets

Recent presets are capped at 10. Their title, time (including explicitly empty time), color and icon are stored in `data/admin-presets.json`. Browser storage remains a fallback. Basic game presets are separate and collapsed by default.

## Worker integration (deployed 2026-10-12)

Cloudflare authorization was renewed and the existing `crank-admin` Worker was deployed on 2026-10-12. Version: `000b1156-a3eb-4e85-9cfb-574b9a9c255c`. Live GET `/api/presets` returned 200 and 10 presets with `Cache-Control: no-store`. Anonymous PUT returned 401. Authenticated persistence and concurrent merge behavior are covered by automated tests; no test calendar entry or preset was written to production.

The repository's current `worker.js` already imports and mounts `preset-route.mjs`, using the existing CranK authentication scope. Deploy from this repository (not the older `NEW Schedule` copy). Confirm deployed source/configuration before deploying.

The integrated import is:

```js
import { handlePresetRequest } from './preset-route.mjs';
```

After origin validation and OPTIONS handling, before other routes, the integration is:

```js
const presetResponse = await handlePresetRequest(request, env, {
  requireAuth, jsonResponse, githubHeaders,
});
if (presetResponse) return presetResponse;
```

Run `npx wrangler login`, confirm existing Worker configuration and deployed source, then `npx wrangler deploy`. Reuse existing `GITHUB_TOKEN`, `SIGNING_SECRET`, and origin validation. Never put GitHub credentials in frontend JSON or JavaScript.

GET `/api/presets` reads the latest GitHub file without a Pages deployment delay. PUT requires the same admin JWT as calendar writes. Same-title presets use the latest `usedAt`; conflicts are re-read and merged (maximum 3 attempts). Calendar and preset writes share one client queue. Failed preset writes do not mark calendar saves as failed. Unsynced local presets can be retried after deployment.

`usedAt` is the client usage timestamp, not the calendar date. Existing seed presets use 0 because actual prior usage timestamps are unknown.

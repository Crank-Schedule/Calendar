# Shared recent presets

Recent presets are capped at 10. Their title, time (including explicitly empty time), color and icon are stored in `data/admin-presets.json`. Browser storage remains a fallback. Basic game presets are separate and collapsed by default.

## Worker integration (deployment pending)

The current Cloudflare credentials expired on 2026-10-12. Static GitHub presets can be read already, but automatic writes require the following route on the existing Worker. The UI explicitly indicates deployment pending when it falls back to static JSON.

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

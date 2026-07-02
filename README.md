# Reload — training log (Next.js / Vercel)

Same private training calendar as before, rebuilt so the thing you actually needed fixed is
fixed: **no GitHub token ever lives in a browser.** Every device only needs one password you
chose yourself — not a GitHub secret that's only shown once and can't be recovered.

## Why the old version needed this

The static HTML version stored a GitHub personal access token in each browser's `localStorage`.
GitHub only reveals a token at the moment you create it; if you didn't save it somewhere, a new
device had nothing to paste in, only "revoke and generate a new one." That's a property of how
GitHub tokens work, not something a redesign of the page can fix.

## What changed

- **`GITHUB_TOKEN` now lives only on the server**, as a Vercel environment variable. It's read
  inside `app/api/data/route.js`, which runs on Vercel's servers and proxies reads/writes to your
  private data repo. It is never included in any HTML, JS, or API response sent to the browser.
- **`APP_PASSWORD`** is the one thing each device needs. You choose it, you can view or change it
  any time in Vercel's dashboard, and changing it instantly invalidates every existing session on
  every device (there's no separate session store to manage — the session cookie is a hash of the
  password and a secret, so a new password produces a new expected hash).
- The training calendar, day detail view, tick-to-log, dark/light theme (defaulting to system
  preference), and favicon all carried over unchanged in behaviour, just rebuilt as React
  components instead of hand-written DOM manipulation.

## One-time setup

You should already have the **private data repo** from the previous version (e.g.
`training-log-data`) holding `plan-data.json`. If not: create a private repo and commit your
`plan-data.json` to it.

1. **Push this project to a GitHub repo** (can be public or private — it contains no secrets or
   personal data, only code; all the actual secrets go into Vercel's environment variables, never
   into the repo).
2. **Import it into Vercel** (vercel.com → Add New → Project → import the repo).
3. **Set four environment variables** in Vercel (Project → Settings → Environment Variables):

   | Variable | Value |
   |---|---|
   | `APP_PASSWORD` | A password you choose. This is what unlocks the app on each device. |
   | `SESSION_SECRET` | Any long random string, e.g. output of `openssl rand -hex 32`. |
   | `GITHUB_TOKEN` | A **fine-grained** GitHub token scoped to *only* your private data repo, with **Contents: Read and write**. Create at github.com/settings/personal-access-tokens/new. |
   | `DATA_REPO` | Your private data repo as `owner/name`, e.g. `byronwalkermills/training-log-data`. |

4. **Deploy.** Vercel builds and gives you a URL.
5. **Open the URL on any device**, enter `APP_PASSWORD`, and you're in. Do the same on your next
   device with the same password — no token, no gist ID, nothing else to copy.

## Updating the plan

Regenerate `plan-data.json` and commit it to the private data repo (directly, or however you
like — the app only reads it, it doesn't write the plan itself). Progress is keyed by workout id,
so tick-offs for unchanged sessions carry over. The app pulls fresh data whenever the tab regains
focus, and there's a manual "Refresh from other devices" button too.

## Local development

```
npm install
cp .env.example .env.local   # fill in the four variables
npm run dev
```

## Notes

- Changing `APP_PASSWORD` in Vercel signs everyone out everywhere immediately (by design).
- `SESSION_SECRET` should stay stable across deploys, or existing sessions will need to log in
  again. Changing it is a fine way to force a sign-out on all devices without changing the
  password.
- The only outbound network calls the server makes are to `api.github.com`. Nothing else, no
  analytics, no third parties.

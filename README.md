# Reload — training log

A return-to-run training calendar with strength sessions: 6-week plan, day detail view,
tick-to-log progress, dark/light theme (defaults to system preference).

## How it works

There is no server, no login, and no GitHub token. The plan is bundled straight from
`plan-data.json` at build time, and progress ticks are saved to this browser's
`localStorage` (key `rtr.progress`). The build is a fully static export (`next build`
writes plain HTML/JS to `out/`), so it can be hosted on any static host — Vercel,
GitHub Pages, Netlify, or just opened from a local server.

The one trade-off: progress is per-browser. Ticking a session on your phone doesn't
tick it on your laptop.

## Updating the plan

Regenerate `plan-data.json`, commit, and redeploy. Progress is keyed by workout id, so
tick-offs for unchanged sessions carry over.

Note: `plan-data.json` (and therefore the built site) contains your training history,
so keep the repo and the deployed URL private if that matters to you.

## Local development

```
npm install
npm run dev
```

## Deploying

`npm run build` produces a static site in `out/`. Point any static host at it, or let
Vercel build it from the repo — no environment variables needed.

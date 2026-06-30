# Reload — private training log

A single static page (`index.html`) that renders your training plan and tracks tick-offs.
It holds **no data itself**. Plan and progress live in a **private GitHub repo** that only
your token can read, so the same state follows you across devices and nobody else can open it.

## How the pieces fit

- **Public repo + GitHub Pages** → serves `index.html` only. No name, no injury, no plan data.
  Anyone can load the URL, but without your token it shows only a connect screen and can read nothing.
- **Private data repo** (separate, e.g. `training-log-data`) → holds `plan-data.json` and
  `progress.json`. Being a private repo, the API returns 404 to anyone without an authorised token.
  This is real access control, not a secret/unguessable link.
- **Fine-grained token**, stored only in each device's browser → scoped to that one repo,
  Contents: read and write. Revoke it and access stops on every device at once.

## One-time setup

1. **Private data repo.** Create a new **private** repo, e.g. `training-log-data`. Leave it empty.
2. **Token.** GitHub → Settings → Developer settings → Fine-grained tokens → Generate new token.
   - Resource owner: you. Repository access: **Only select repositories** → your data repo.
   - Permissions → Repository → **Contents: Read and write** (Metadata read is added automatically).
   - Set an expiry. Copy the token (`github_pat_…`).
3. **Deploy the viewer.** Put `index.html` in your public Pages repo (you've already done this;
   just replace the old file). Pages serves it as-is, no build step.
4. **First run.** Open your Pages URL → **First time** tab → paste the token, enter the data repo
   as `owner/name`, choose your `plan-data.json`, Connect. The app writes the plan into the
   private repo.
5. **Other devices.** Open the same URL → **I already set this up** → same token + same `owner/name`.

## Updating the plan

The plan is meant to change (weeks repeat or drop back depending on how things respond). To revise:
regenerate `plan-data.json`, then either commit it to the private data repo directly, or use the
**First time** tab again to overwrite it. Progress is keyed by workout id, so tick-offs for
unchanged sessions are preserved.

## Cleanup you still need to do

The earlier 700 KB rendered HTML you deployed embeds your **name and injury** in plain text.
Remove it from the public repo/Pages site; this new `index.html` replaces it and carries none of that.

## Notes and limits

- The token sits in `localStorage` on each device. It's a single-repo, Contents-only token, so a
  leak is limited to that repo and revocable instantly. Use **Forget this device** on shared/lost machines.
- Sync is last-write-wins across devices (fine for one person). Returning to the tab pulls the latest
  progress; a write that collides with another device retries once against the current version.
- No backend, no third-party services, no analytics. The only network calls are to `api.github.com`.

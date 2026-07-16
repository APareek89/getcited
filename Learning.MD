# Learning.MD — GetCited
> AGENT: add an entry whenever the basic flow changes, the user reports a bug or gives
> corrective feedback, or something took real time to figure out. CHECK THIS FILE FIRST
> before debugging — the answer may already be here. Plain language; first use of any
> technical term gets a one-line bracket explanation.

<!-- Newest first. -->

## 2026-07-16 — Supabase project is SHARED, not dedicated
**What happened:** After running migrations, `db-check` showed ~30 tables from other apps
(`lessons`, `gstpilot_*`, `kb_*`, `generations`…). The `DATABASE_URL` points at a Supabase
project the user reuses across projects, not an empty one.
**Root cause:** User supplied an existing multi-app Supabase project's pooler URL.
**Watch for later:**
- Do NOT assume the DB is empty. Our tables (configs, runs, answers, plans, citations,
  reports, sov_history, hallucinations, progress_snapshots, api_keys, profiles) coexist —
  `CREATE TABLE` (no IF NOT EXISTS) succeeded, proving none pre-existed.
- Global objects on the shared `auth.users` table MUST be namespaced. Migration 0001 first
  created generic `handle_new_user` / `on_auth_user_created`; 0002 renamed them to
  `getcited_handle_new_user` / `getcited_on_auth_user_created` so we never clobber another
  app's signup trigger. Any future global/auth-schema object → prefix with `getcited_`.
- The Drizzle service client bypasses RLS — always scope queries by `user_id`.

## 2026-07-16 — Phase 0 scaffold gotchas
**What happened:** Scaffolding GetCited hit three snags.
**Root cause:**
- Folder `GetCited` has capital letters → npm rejects it as a package name. Fix: ran
  `create-next-app` into a lowercase `getcited/` subdir, then moved contents up.
- pnpm 11 gates package build scripts (sharp, unrs-resolver, esbuild). Fix: approve them in
  `pnpm-workspace.yaml` under `allowBuilds: {x: true}` + `onlyBuiltDependencies: [x]`.
- shadcn `init -b` means base *library* (radix|base), NOT base color. This install uses
  **Base UI** primitives (`@base-ui/react`), so Tooltip provider takes `delay` (ms), not
  Radix's `delayDuration`.
**Watch for later:** any component prop error from `@/components/ui/*` → we're on Base UI,
check the Base UI API, not Radix docs.

## 2026-07-16 — Corp MITM proxy breaks TLS downloads
**What happened:** npm/pnpm/npx downloads can fail with cert errors on this machine.
**Root cause:** corp proxy re-signs TLS with a CA not in Node's bundled trust store.
**Watch for later:** before any install, export
`NODE_EXTRA_CA_CERTS`/`SSL_CERT_FILE=/Users/anandpareek/Documents/SEO content Skill/scripts/system-ca-bundle.pem`.

# Learning.MD — GetCited
> AGENT: add an entry whenever the basic flow changes, the user reports a bug or gives
> corrective feedback, or something took real time to figure out. CHECK THIS FILE FIRST
> before debugging — the answer may already be here. Plain language; first use of any
> technical term gets a one-line bracket explanation.

<!-- Newest first. -->

## 2026-07-16 — Dev server AuthRetryableFetchError: launcher env lost the corp CA bundle
**What happened:** After repointing the preview launch config from `pnpm` to a pinned Node 22
binary, every server-side Supabase fetch failed (`UNABLE_TO_GET_ISSUER_CERT_LOCALLY` →
`AuthRetryableFetchError` in the UI).
**Root cause (why-chain):** pinned-binary launch → no shell profile → no `NODE_EXTRA_CA_CERTS`
→ Node distrusts the corp MITM proxy's re-signed TLS. (The pin itself was needed because the
preview runner sometimes resolves Node 18, which pnpm 11/corepack can't run under.)
**Fix:** launch.json entry now carries an explicit `env` block with
`NODE_EXTRA_CA_CERTS`/`SSL_CERT_FILE` = corp CA bundle, plus the pinned Node 22 + direct
`node_modules/next/dist/bin/next` invocation. `run-dev.sh` exists for manual terminal runs
(the preview runner can't exec scripts in Documents — "Operation not permitted").
**Watch for later:** ANY new way of launching this app (Vercel build? cron? worker?) on this
machine needs the CA bundle env or all Supabase/Anthropic/crawl fetches fail the same way.
**What happened:** User's real benchmark returned thin insights (mentions=[] on most answers,
sonar answers with zero citations, citations table empty, plan target only ~5%).
**Root cause (4 stacked):** (1) Configure saved competitors as normalized URLs — the parser
can't match "https://runwayml.com" as a brand mention in prose; (2) Perplexity's REAL cited
sources come back on `res.sources`, which we discarded (only regexed the text); (3) crawled
evidence was never persisted to the `citations` table; (4) the user's config had budget=$0,
team=1 → only free tactics fit, so the projection was tiny.
**Fix:** competitors stored as NAMES + parallel `competitor_domains` (derived server-side);
panelist captures `res.sources` → merged into cited_domains; `persistCitations()` after every
diagnose crawl; plan tool returns a capacity_note when budget/team is tiny.
**Watch for later:** if SoV comes back near-zero for all brands, check what strings are in
`configs.competitors` FIRST. Old configs saved before this fix still hold URLs — user must
re-save Configure (or re-run Suggest) to get names.

## 2026-07-16 — Shared Supabase project hijacked the auth redirect
**What happened:** After sign-up, the user landed on `agentic-learning-studio-1.onrender.com/?code=...`
— a different app sharing the same Supabase project.
**Root cause:** Supabase only honors an app-supplied redirect (`emailRedirectTo`/OAuth `redirectTo`)
if that URL is in the project's Auth **redirect allow-list**; otherwise it silently falls back to the
project-wide **Site URL**, which was set to the other app's Render domain. Two apps can't both own
Site URL — auth config is project-global, so a shared project is fundamentally unsafe for auth.
**Watch for later:** any "wrong app after login" symptom → check Auth → URL Configuration first.
**Resolution (user decision):** the OTHER app was defunct staging, so instead of a new project we
repointed THIS project's auth to GetCited — Site URL `http://localhost:3210`, allow-list
`http://localhost:3210/auth/callback`. This Supabase project is now GetCited's primary. The old
staging app's login would redirect here if ever revived — give it a fresh project then. Other apps'
leftover tables (lessons, kb_*, gstpilot_*, …) still live in this DB: ignore them, never drop
without the user, and keep our RLS/user_id scoping discipline. Deleted the (now dangerous)
cleanup-shared-project.sql that would have dropped GetCited's live tables.
**What happened:** User said "if FMEA highlights non-critical bugs, ignore them."
**How to apply:** Act on **P0 only**. P1/P2 → one-line mention at most, do NOT fix during the
build unless asked. Don't burn build effort hardening non-critical issues. (Encoded in AGENTS.md.)

## 2026-07-16 — Build mandate: drive to a full first version
**What happened:** User: "continue till the time we have the first version of full app ready."
**How to apply:** Build Phases 2→5 autonomously without pausing to ask between phases; commit per
phase, keep green, update Handoff.MD. Confirm before any PAID live call in a build step; verify
with the mock path where possible.

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

## 2026-07-17 — A Next.js rewrite can NOT relocate the MCP endpoint to /mcp
**What happened:** For the Render URL takeover we wanted the MCP endpoint served at /mcp
(legacy connector URL) while keeping the route file under /api. A beforeFiles rewrite
`/mcp → /api/mcp` (even accept-header-conditioned) fails for two independent reasons,
verified empirically on next@16.2.10 in dev AND production mode:
**Root cause:**
- Middleware runs on the ORIGINAL URL before beforeFiles rewrites — with /mcp in
  PROTECTED_PREFIXES, Claude's unauthenticated POST gets a 307 to /login, never the 401
  challenge that starts OAuth.
- Next preserves the original path in the handler's `request.url` after a rewrite, and
  mcp-handler dispatches by STRICT pathname equality against its basePath-derived endpoint
  (dist/index.js:279) — every rewritten call 404s, and only AFTER a fully successful OAuth
  flow (withMcpAuth is path-agnostic), which makes it a nasty late failure.
**Fix:** genuinely serve the endpoint at top level: `src/app/mcp/route.ts` + `basePath: ""`
(deriveEndpointsFromBasePath("") → "/mcp"), page moved /mcp → /connector, middleware matcher
excludes machine surfaces (mcp$|api/|\.well-known/|healthz$).
**Watch for later:** anything that must answer at an exact public path (webhooks, OAuth
metadata, MCP) needs a real route at that path — never a rewrite — and must be excluded
from the session middleware.

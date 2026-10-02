# Learning.MD — GetCited
> AGENT: add an entry whenever the basic flow changes, the user reports a bug or gives
> corrective feedback, or something took real time to figure out. CHECK THIS FILE FIRST
> before debugging — the answer may already be here. Plain language; first use of any
> technical term gets a one-line bracket explanation.

<!-- Newest first. -->

## 2026-10-01 — Test the second streamed turn, not only one saved probe
**Confirmed defect:** The GEO chat response omitted the AI SDK's `generateMessageId`. Its server-side assistant message therefore used an empty ID. The first turn could save, but a later assistant reply collided with it and failed the unique-message validation. An actual production-compiled route, real isolated PostgreSQL and mocked provider transport reproduced this failure. The prior successful benchmark probe did not exercise streamed chat.
**Fix:** Generate server UUIDs; read legacy empty IDs through the existing owned message-row UUID; reject new empty IDs. Commit the incoming user message before dispatch, mark incomplete tools interrupted, and persist the final snapshot within the captured actor context while still rechecking revocation/deadline. Normal business conflicts no longer invalidate the account. Exact UTF-8 message/attachment bounds and fixed public errors are shown before or after sending; the free-example label describes only the example button.
**Evidence and limits:** Local compiled checks cover five sequential panel calls, cancellation during the fourth, retained known/uncertain usage without retry, subsequent SDK chat and reload, legacy-ID recovery without changing old content, and signout during an in-flight tool. Cancellation reproduced the original usage pattern, but the original browser cancellation cause is unproven. A failed panel batch still has no complete report; ledger evidence and the interrupted conversation remain. No provider or production calls were made for these fixtures. Live deployment/one actual chat check remain controlled by the release operator.


## 2026-10-01 — Record provider spend even when no answer survives
**What happened:** The first controlled probe used all 128 allowed output tokens and settled 76 input / 128 output tokens, estimated USD 0.0000882, before the application returned an error without persisting an answer. Truncation is the leading inference; the exact finish reason was not retained, so it is not a confirmed diagnosis.
**Correction:** A separately authorized request asked only for names with a 256-token ceiling. It returned 75 input / 7 output tokens and an owned saved report, estimated USD 0.00001545. Both ledger rows and the original failed run remain; total estimated spend is USD 0.00010365, with no automatic retry.
**Scope:** The prompt supplies the brands. It demonstrates provider/usage/report integration, not an unbiased visibility result. Bounded answer validation and accounting must remain separate: an application failure does not erase provider spend.

## 2026-10-01 — An undefined layout class can survive every functional test
**What happened:** The deployed signup page used `gc-auth`, but no stylesheet defined that class. The form stretched across the page with no intended padding and a tiny unstyled heading.
**Fix:** Signup now uses the existing sign-in page's centered flex layout, `max-w-sm`, padding and heading spacing. Auth and state logic were unchanged. Targeted lint/TypeScript and the coherent production build passed; root then verified the corrected live signup and account flow. Preserve the earlier browser failure as evidence; successful endpoint tests did not prove visual quality.


## 2026-10-01 — Render the entire saved prepared message, not just one DTO
**What happened:** Browser acceptance exposed two consecutive crashes. The prepared benchmark lacked sentiment/citation summaries; after that repair, the plan still lacked spent USD, spent hours and person-hour capacity. Passing endpoint checks did not prove that both cards could render.
**Fix:** The factory now returns the full typed benchmark and plan outputs. Existing canonical messages are repaired from saved reports, tactics and configuration while preserving message IDs/timestamps, plans, reports and tracker annotations. Client fallbacks keep older recorded evidence visible and mark absent summaries unavailable instead of inventing zeros.
**Evidence:** Repo-contained before/after fixtures came from the actual isolated synthetic PostgreSQL database; only opaque IDs were replaced. The combined regression renders both real cards, nested plan previews, approval and document controls. It checks the actual $400 allocation and 69 displayed hours out of 400. All 13 client/card tests and 23 database checks pass. Final local browser approval created six tracker rows and verified restored edits with no console errors.
**Related credential boundary:** Self Serve assistance must resolve stored owner keys, never fall back to hosted keys. The UI states that requirement; chat and the explicit probe accept owner-scoped tab credentials. Prepared controls cannot initiate paid assistance.
**Launch checkpoint:** The corrected image is deployed and healthy. Live free account checks, the corrected paid probe, saved-report browser restoration and final read-only usage audit have passed. Health alone was not treated as end-to-end acceptance.


## 2026-10-01 — Account fences must include bodies and partial stream frames
**What changed:** The hosted account owns all client actions, history, keys and exports. Capturing identity only after `fetch()` is too late: JSON, Blob or stream consumption can finish after another account signs in. The client now captures the owner generation before work, sends the rendered owner to the server, clears on cross-tab notification, and stops stale frames/downloads before display. Old global browser state is not imported.
**Regression found:** A stream transport chunk can end halfway through an SSE frame. Returning from `pull()` without producing output left the reader waiting indefinitely. The implementation now reads until a complete frame or end of stream and rejects current-session expiry before subsequent private frames in the same chunk.
**Evidence:** Nine offline client regressions pass, including split-frame delivery, current/old-session expiry, delayed JSON/Blob data, request owner headers and BYOK isolation. No provider request was needed.
**Product accuracy:** Prepared examples are permanently free and labeled. Ordinary one-response probes identify literal mentions and unverified domains, not current web-grounded market visibility. Historical provider/UI claims were updated to the configured OpenAI default and neutral shared theme.


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

## 2026-07-17 — Render proxy rewrites Host to localhost:$PORT → OAuth login redirect went to localhost:8080
**What happened:** First real connector install against the deployed app: Claude hit
/api/mcp/authorize, wasn't logged in, and got redirected to http://localhost:8080/login?next=…
(ERR_CONNECTION_REFUSED in the user's browser).
**Root cause:** Render's proxy rewrites the Host header to the app's internal bind address
(localhost:$PORT) and carries the public host ONLY in x-forwarded-host. Next.js builds
request.url / req.nextUrl from Host, so every absolute URL built from them
(nextUrl.clone(), new URL(request.url).origin, new URL("/", request.url)) leaks
localhost:8080. Everything that used the x-forwarded-aware publicOrigin() (401 challenge,
well-known docs, JWT issuer) was correct — only the redirect builders were wrong.
**Fix:** dependency-free src/lib/http/origin.ts publicOrigin() (x-forwarded-host/proto,
comma-list safe; middleware-importable). Rewired: authorize login redirect, auth/callback
(all 3 redirects), signout, middleware /login redirect. lib/mcp/auth.ts re-exports it.
**Watch for later:** NEVER build an absolute same-origin URL from request.url/req.nextUrl
in server code — always publicOrigin(). Relative paths in ?next= params are fine.

## 2 October 2026 — failure boundaries and saved approval

- Slow FileReader callbacks had no selection fence; add generation checks and invalidate on remove/send/thread change. Native race tests cover the transitions.
- Scoring accepted duplicate case/space brand entries; normalize the tracked set before calculating shares.
- A provider response with unknown finish status could be accepted. Require explicit successful completion after usage settlement, with no automatic retry. Record only bounded failure metadata.
- The plan card held approval only in React state, so reload offered approval again despite persisted Tracker rows. Hydrate the thread DTO from current owned rows; keep the historical messages immutable. PostgreSQL + server-render + compiled HTTP regressions cover it.
- Metered costs use configured prices and sometimes uncertainty; removed the landing-page exact-cost promise. Encrypted key opt-in remains supported.
- FMEA scenario count 111, grouped changes 6. Actual provider quality, the historical cancellation trigger and hosted load remain unverified. Full evidence: `docs/qa/2026-10-02/`.

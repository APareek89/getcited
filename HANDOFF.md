# GetCited — launch checkpoint, 1 October 2026

The current portfolio launch replaces the historical Supabase/Render account and Aurora UI assumptions below. Those entries are retained as history. Follow the current launch brief and README for the active architecture; do not reuse old credentials or run the old terminal-browser harness.

Implemented and locally accepted; deployed health verified: Auth.js Credentials with owner-bound PostgreSQL data; rendered-owner/CSRF request checks; explicit MCP consent tied to the revocable session; permanent prepared config/run/plan/thread example; ordinary one-response OpenAI probe; shared Lovable light/dark UI with self-hosted Inter/Roboto Mono; preserved Configure/Agent/Dashboard/Tracker forms and actions. The default hosted provider is OpenAI GPT-4o mini. Groq’s retired route and unpriced Perplexity route are disabled.

Original baseline passed 40 native tests, build/lint, 13 HTTP groups / 72 assertions and root browser Run mock audit. Final local verification passed 67 tests, including 13 client/card regressions; 23 actual PostgreSQL checks; two provider/metering fixtures; and 84 compiled Auth.js checks across 82 requests. Root browser verified the complete prepared benchmark/plan, six approved tracker rows, persisted status/remarks, PDF action, dark theme and a 390 px layout with no page overflow or console errors.

AWS health now passes at https://getcited.3-6-183-210.sslip.io. Deployed image: `sha256:fa0b96e08a9a98b527d3192066c71862cc31a7c59e7af16d0024a444d267e02c`; source archive: `53756cab0b22e0c38ae190cca7c66ba3bdee384f20566d9b33b36e353f920d50`. Existing eight apps and the original Demo remained healthy with their container/process/configuration and certificate-account identities unchanged. Live free acceptance passed 36 checks / 39 requests with two accounts and zero provider calls. Root browser verified corrected signup/sign-in, prepared cards, six tracker rows, persisted status/remarks, both themes and 390 px layout with no console errors. The corrected paid probe and final saved-report browser/read-only audits passed. The final audit retained exactly two usage rows and the original failed attempt unchanged, with no extra provider calls.

Prepared results are illustrative and free. A normal probe records one ungrounded model response; its literal domain matches are not verified citations. Share of voice uses total tracked-brand mentions as denominator. Plans retain assumptions/confidence and require explicit approval before Tracker writes. BYOK tab storage is owner-scoped, cleared on sign out/account changes, and may be restored by the browser; opt-in encrypted server storage is separate. Self Serve AI suggestions require stored credentials; chat and the explicit probe also accept the current owner’s tab credentials. The current schema is `migrations/001_portfolio.sql`; the historical Drizzle CLI/migrations are not the fresh deployment path.

Text appears after each bounded provider completion so usage can be recorded before semantic parsing. Tool updates remain available; Stop aborts the in-flight transport. This is not a live token-by-token output claim.

## Controlled paid result and retained failure

The first 128-output-token request settled usage for 76 input / 128 output tokens, estimated USD 0.0000882, then failed before answer persistence. Truncation is the leading inference because it used the full allowance; the exact finish reason was not retained. Its failed run, claim and settled charge remain intact.

The root-approved names-only correction used a 256-token ceiling and completed at 11:15:06.853–11:15:08.144 UTC on 1 October 2026: OpenAI GPT-4o mini, 75 input / 7 output / 0 cached / 0 reasoning tokens, estimated USD 0.00001545. Two billed requests total USD 0.00010365; there were no automatic retries. The successful response was stored as an owned report and restored after browser reload in dark and light themes with model, prompt and cost visible, no console errors and no extra provider calls. The earlier prepared plan remains separate; dashboard trends that include examples do not demonstrate market change. Supplied brand names make this a connectivity, metering and persistence check, not unbiased market visibility or a paid multi-provider/plan/crawl validation.

## Historical handoff (preserved)

# GetCited — Handoff

> Fresh-session resume doc. Read this first. GetCited is a **private** Next.js/Vercel
> web app that measures a brand's AI citation share-of-voice across an LLM panel, then
> turns it into a **costed, committed action plan** grounded in crawled competitor
> citation evidence. Full spec: `docs/GETCITED-BUILD-PROMPT.md` (copy it in if missing;
> canonical source lives in the sibling `geo-radar-mcp` repo under `docs/`).

## Golden rules (do not break)
- Repo stays **PRIVATE**: https://github.com/APareek89/getcited (private remote). Never make public.
- **Never log/expose API key values.** Only ever check presence. `.env.local` is gitignored.
- Projections are **modeled estimates**, never guarantees: list assumptions + a confidence band.
- Respect **robots.txt + rate limits** when crawling. Ask before any paid/live external call in a build step.
- At the **start of each phase**, tell the user exactly which `.env.local` keys it needs.
- Do **not** edit the reference project `geo-radar-mcp` — read-only port source.

## Design direction (LOCKED 2026-07-17 via /design-shotgun)
**Aurora Glass, app-wide**: bg #070B14 + violet #7C3AED → cyan #22D3EE aurora glows (blurred radials),
frosted glass cards (rgba(255,255,255,.05) + blur(20px) + 1px rgba(255,255,255,.12) border, radius 20px),
text #EDF0F7 / muted #93A0B4, gradient accent for buttons/active pills/chart strokes. Reference mockups:
`~/.gstack/projects/APareek89-getcited/designs/{landing,configure,assistant,dashboard}-20260717/variant-C.png`
(+ HTML sources /tmp/gcC-*.html, /tmp/gc-configure-C.html — copy into repo before /tmp is cleared).
**APPLIED to the app (2026-07-17)** — globals.css tokens + aurora glows on body + glass on all
shadcn Cards + `.bg-aurora`/`.text-aurora`/`.glass` utilities; gradient accents on hero/CTA/active
nav/SoV "you" bars/trend line. **Nav IA changed the same day:** left sidebar → TOP nav bar
(`app-shell.tsx`): Configure · GEO Agent (/assistant) · **GEO MCP (page moved /mcp → `/connector`
on 2026-07-17 — /mcp is now the MCP tool ENDPOINT, see Render migration below)** · Dashboard.
Assistant no longer has an Agent/MCP tab switcher. `/connector` is in PROTECTED_PREFIXES. Also fixed
missing `--color-danger` mapping (text-danger classes were silently no-oping).

## UI fix round 2 + Tracker (2026-07-17) — ALL SHIPPED, awaiting user live validation
✅ Shipped: nav tabs left of logo · opaque `.glass-header` (rgba(7,11,20,.85)+blur, z-50) · Configure
two-column compact (Business 3fr / Platform 2fr, 3 competitor rows + Add) · chat messages max-w-4xl
(composer/cards stay 2xl) · detailed plan (roadmap.ts now emits WHAT/WHY/HOW/WHO + execution
guidelines as `{weeks, guidelines}`; `lib/geo/schedule.ts` pure date/normalize/tracker-row helpers,
14 tests) · DOCX export (`docx` pkg, `lib/report/plan-docx.ts`, `?format=docx`; PDF/Excel/HTML gained
dates/why/how/guidelines) · PlanResult collapsed to summary + Word/PDF/Excel/HTML downloads ·
**Tracker**: migration 0006 `tracker_items` (RLS owner-only, APPLIED to live DB, db-check green),
`approve_plan` chat tool (agent asks after build_plan, only on explicit yes; idempotent),
/tracker editable page (status dropdown + inline remarks via server action), `track_progress`
reads tracker_items PRIMARY (re_benchmark:true optional+paid), MCP parity (`approve_plan` +
`get_tracker` in the MCP route). Nav: Configure · GEO Agent · GEO MCP · Tracker · Dashboard.

## Site redesign round (2026-07-17 evening, "free hand") — ✅ SHIPPED (commit ba5eaa5)
Multi-agent judged designs → implemented → claims-audited → fixed: SEO homepage (11 sections,
JSON-LD @graph incl. FAQPage w/ 12 byte-matched FAQs, keywords: ai visibility tool / ai search
optimization; NO fabricated proof — every product claim fact-checked vs code, ChatGPT/per-engine/
multi-run overclaims removed), Quotecast logo (src/components/logo.tsx, per-instance gradient ids
via useId; favicon src/app/icon.svg; /logo.png for OG+JSON-LD), Home nav tab, /configure rebuilt
(command bar w/ progress+dirty+Cmd+S, numbered zones, queries sole scroll region, plan strip w/
live person-hrs, keys dialog; FIXED: suggest domain cross-pairing, >5-competitor silent truncation).
BYO session keys: localStorage → sessionStorage (matches "session-only" promise). PixelBin scrubbed
from all user-facing surfaces (demo now Linear/Jira/Asana; prompt-library demo set re-themed).
**QA harness**: scripts/qa-browser.py — creates qa-harness@getcited.local (Supabase admin), password
grant, builds sb-…-auth-token cookie (base64url, 3180-char chunks), drives headless Chromium
(executable_path pinned to ms-playwright chromium_headless_shell-1228) → screenshots all pages authed.
**Loop evals: 7/7 free PASS** (1-4,6 = vitest; 5 = harness browser save→reload; 7 = key-handling audit)
**+ 3 paid confirmations PASS** (~$0.05 of the user-granted $2): real benchmark (SoV sums 1.0,
$0.0085), live AI suggest/generate in new UI, build_plan→roadmap WHAT/WHY/HOW/WHO→DOCX. Journal in Loop.MD.

## Round 3 (2026-07-17 night, user-directed) — ✅ SHIPPED
1. **Configure**: left rail sub-tabs Business Context (01 Brand & plan — brand + budget/team/weeks
   w/ person-hrs readout · 02 Competitors · 03 Queries) / Platform (3 equal cards: We Serve default
   w/ provider details · Self Serve w/ INLINE keys, dialog removed · Self Host info card + repo link).
   3-step progress. Behavior contract preserved (actions payloads, pairing fixes, dirty/Cmd+S).
2. **Plan card** (chat): rebuilt as deliverable card — visible top-3 tactics + first weeks, PRIMARY
   "Approve → add to Tracker" button (approvePlanAction in tracker/actions.ts → approvePlanToTracker,
   idempotent, flips to View-Tracker link), Word/PDF/Excel buttons, roadmap_error banner.
3. **MCP visibility**: audited — ZERO gaps (same user_id tables both directions); PROVEN live: QA
   user (100% MCP-origin data) dashboard shows benchmark+plan, tracker shows 20 MCP-approved items.
4. **Plan docs**: PDF now full parity (WHY/HOW steps, lead-time col, guidelines), pdfSafe() glyph
   sanitizer (→/≈ garbled in WinAnsi Helvetica), week pluralization everywhere; generateRoadmap
   retries ×1 and failure SURFACES (chat roadmap_error + MCP field + self-explaining doc notice) —
   the silent {weeks:[]} swallow that shipped the user's thin PDF is gone.
5. Master flow .mmd + architecture-flow.html viewer synced (Configure tabs, 3 approve paths, DASH node).

## Round 4 (2026-07-17 late, user-directed) — ✅ SHIPPED
1. **Configure layout**: tabs hug far-left (full-width page, `pl-4`, no max-w/centering), steps-
   completed panel removed, rail 212→168px, three Business Context columns widened.
2. **Plan PDF polish**: roadmap action-table column padding (Hrs/Owner no longer collide). Verified
   on a live Fynd run (10-page PDF, per-week WHAT/WHY/HOW/owner/hours/dates all clean).
3. **Custom LLM (OpenAI-compatible)** — Self Serve can add ONE custom model (base URL + model id +
   key) as an EXTRA panelist via `@ai-sdk/openai-compatible`. Stored as a JSON blob
   `{baseURL,model,apiKey}` under a new free-text `custom` provider slot (session=sessionStorage,
   stored=AES-GCM api_keys row) — NO migration. Parsing/scoring/roadmap stay on Anthropic. Panel
   appends `custom` when `keys.custom` present (chat panelFor + both MCP arrays); resolveKeys
   hasSession includes custom; realPanelistCount counts it. **Robustness (runner.ts):** a
   misconfigured custom endpoint degrades gracefully — dropped at BUILD (bad blob) or CALL time with
   a `panel_warning`, never crashing the run (built-in "haiku" always present so answers still land);
   built-in panelist failures stay fatal. Surfaced via `MeasureOutput.panel_warning` → MCP
   run_benchmark + chat run_benchmark tool. Regression test in runner.test.ts (39 tests). Custom
   modelId not in MODEL_PRICING → $0 cost-cap contribution (REAL_CALL_COST_ESTIMATE still gates).
   NOTE: a real custom-endpoint round-trip was NOT live-tested (no OpenAI-compatible key on hand) —
   degradation + happy-path (built-ins) are verified; the actual custom call is verified by
   construction (standard AI SDK provider).
   **Fynd example** saved to ~/Downloads/getcited-fynd-example/ (PDF + dashboard + tracker PNGs);
   QA data lives under qa-harness@getcited.local, not the user's own account.

## Next session — pending points (2026-07-17)
0. **User validates live** (all auth-gated): round-2 UI fixes (nav-left, header bleed on /dashboard,
   Configure 2-col no-scroll, chat width) + full Tracker flow: build plan → agent asks approval →
   /tracker table edits → "How am I progressing?" → DOCX download.
1. **Loop offer is OPEN** (Loop.MD status: offered) — ask once: turn the eval loop on?
2. User may add keys: `LANGFUSE_PUBLIC_KEY`/`LANGFUSE_SECRET_KEY` (tracing) + `FIRECRAWL_API_KEY` (richer crawls).
3. Candidate next features (PM backlog): content calendar view from roadmap, weekly digest email,
   competitor-watch alerts. Deploy = Render URL takeover (see "Render migration" section), replaces
   the old "Vercel deploy" idea.
4. FMEA smart-suggest fired this session (migration + auth/RLS + new tools + 200+ line diffs) —
   scan offered, user hasn't answered yet.

## Decisions
- 2026-07-17 — plans.roadmap is now `{weeks, guidelines}` (legacy rows = week array); every reader goes through `normalizeRoadmap`.
- 2026-07-17 — track_progress does NOT re-benchmark by default (paid); `re_benchmark: true` only with user consent. approve_plan is idempotent (existing items = user's source of truth).
- 2026-07-16 — Supabase project = the formerly-shared one, repointed to GetCited (other tenant was dead staging).
- 2026-07-16 — MCP auth = self-hosted OAuth ported from geo-radar (no external IdP); authorize gated by app session.
- 2026-07-16 — FMEA policy = act on P0 only (user preference). Competitors stored as names + parallel domains.
- 2026-07-16 — GitHub: private repo on the user's active gh account; repo must stay PRIVATE.

**Session efficiency (2026-07-17):** 🎯 ~85% feature (UI round 2, detailed plan/DOCX, Tracker end-to-end) · 🔧 ~10% support (preview auth gate, tsx/CA-bundle quirks) · 🔁 ~5% rework (docx numbering restart, drizzle jsonb typing)

## Session continuity (Power Coding)
- **Resume a fresh session:** type `Refer to Handoff.MD in /Users/anandpareek/Documents/Projects/GetCited and begin`.
- Update this file after every major change (snapshot, not a journal — one screen). At ~10% context left, update it early and tell the user the magic phrase.
- Log flow changes / reported bugs (with root cause) in `Learning.MD` — check it before debugging.
- `Loop.MD` holds the eval yardstick; offer to turn the loop on once the first draft runs end-to-end.
- FMEA is `smart_suggest` (`.power-coding/config.json`) — suggest a scan at a natural pause when signals fire.
- ⚠️ unconfirmed defaults: debug = **(A) diagrams only**; FMEA trigger = **smart_suggest**. Tell me to change either.

## Reference port map (geo-radar-mcp → GetCited/lib/geo)
`packages/core/src/{panelist,parser,providers,models,scoring,cost,prompt-library,analysis,compare,report,errors,runner}.ts`
→ `lib/geo/*`. **Adapt: provider keys become a per-call param, not `process.env`.** Drop MCP
server/worker/OAuth/Render bits. `packages/db/src/schema.ts` → `lib/db/schema.ts` on **Supabase Postgres**.
`packages/shared/src/schemas/*` → `lib/geo/schemas/*`.

## Tech stack (decided — don't re-litigate)
Next.js 16 App Router + TS (src dir) · Tailwind **v4** + shadcn/ui (**Base UI** primitives, not Radix)
+ Framer Motion + lucide-react · Recharts · Supabase (Postgres via Drizzle + Auth email/Google + Storage)
· Vercel AI SDK (`ai` v7) · Firecrawl crawler (fetch+readability fallback) · reports HTML/PDF(@react-pdf)/Excel(exceljs).

## Phases
0. **Setup + Supabase** ← DONE
1. **Port `lib/geo` + Auth + schema/RLS + landing + Configure** ← DONE
2. **GEO Assistant: Agent-Mode streaming chat + MCP page** ← DONE
3. **Crawl + plan engine (`plan.ts`+`projectImpact`) + cards 1–4 + reports** ← DONE
4. **Self Serve: Configure Platform (3 options) + BYOK (session vs encrypted)** ← DONE
5. **Dashboard (KPIs, trend, leaderboard, active plan/progress, downloads)** ← DONE

> **First full version COMPLETE** (all 6 phases) + v1.1 + MCP connector + Aurora Glass re-theme.
> Landing → auth → Configure (+Self Serve) → GEO Agent (5 cards, threads, memory, content-gen) →
> GEO MCP → Dashboard. All green.

## `.env.local` keys by phase
- **Phase 0/1 (must-have):** `ANTHROPIC_API_KEY` ✅(copied), `KEY_ENCRYPTION_SECRET` ✅(generated),
  `PANEL_COST_CAP_USD_PER_RUN` ✅(copied), + **user adds:** `DATABASE_URL` (Supabase pooler),
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Phase 3 (grounding):** `PERPLEXITY_API_KEY` ✅(copied), `FIRECRAWL_API_KEY` (user adds).
- **Optional (as features land):** `GEMINI_API_KEY`, `GROQ_API_KEY` ✅(copied), `YOUTUBE_API_KEY`,
  `GA4_*`, `GSC_*`, `AHREFS_API_TOKEN`.

## Current state (end of Phase 1)
- **Scaffold/theme** (Phase 0): Next 16 + Tailwind v4 + shadcn (Base UI), dark §8 tokens, Inter.
- **Supabase DB (SHARED project — see Learning.MD):** 11 RLS tables (§7); migrations `drizzle/0000` tables,
  `0001` RLS+profiles trigger, `0002` namespaced auth trigger (`getcited_*`). Applied. `scripts/db-check.ts`
  verifies tables/RLS/trigger. `src/lib/db/{schema,client,configs}.ts`, `drizzle.config.ts`.
- **Auth (Supabase SSR):** `src/lib/supabase/{server,client,middleware}.ts`, `src/proxy.ts` (Next 16 "proxy"
  convention guards `/configure /assistant /dashboard`), `src/lib/auth.ts` (getUser/requireUser). Login page
  = Google OAuth + email magic-link (NO passwords). `/auth/callback` + `/auth/signout` routes.
- **Ported pipeline** `src/lib/geo/*` (per-user keys, not env): types, models, providers, panelist, parser,
  scoring, cost, prompt-library, analysis, errors, store + MemoryGeoStore, runner, report, keys (server-only),
  assist (suggest_queries + discover_competitors, Google-Suggest grounded). Barrel `index.ts` (excludes
  server-only `keys`). Tests: scoring (4) + mock runner e2e (3) = 7 passing.
- **Landing** `/`: hero + We Serve/Self Serve split + live **free mock audit** (`/api/mock-audit` runs the
  real runner in forceMock; CSS bars, not Recharts — Recharts vertical-layout mis-scaled, see Learning).
- **App shell** `src/app/(app)/layout.tsx` (requireUser) + `AppShell` left nav (Configure/Assistant/Dashboard).
- **Configure** `/configure`: brand/name/description, competitors ×5 + ＋ + "Suggest competitors",
  queries + "Fetch queries", budget/team/timeline, `?` tooltips, versioned save. Server actions in
  `src/app/(app)/configure/actions.ts` (saveConfig, suggestQueries, discoverCompetitors). Assistant/Dashboard = stubs.
- **Verified in browser:** landing + mock audit (SoV bars), login page, protected-route redirect. Console clean.
- **Green:** `pnpm typecheck` ✅ · `pnpm lint` ✅ · `pnpm test` (7) ✅ · `pnpm build` ✅.

## Gotchas learned (see Learning.MD for full list)
- Base UI (not Radix): Button uses `render` prop not `asChild` → use `ButtonLink`; Tooltip uses `delay`.
- Recharts v3 horizontal/vertical bar layout mis-scales domain with a hidden axis → used CSS bars for the SoV list.
- pnpm 11 build-script gating; corp MITM proxy CA bundle; `GetCited` caps → lowercase scaffold subdir.
- **Supabase project is now GetCited's PRIMARY** (was shared; the other tenant was defunct staging —
  its auth redirect was repointed to GetCited). Other apps' leftover tables still live in the DB:
  ignore them, never drop them without the user. Keep namespacing global/auth objects `getcited_*`.

## FMEA (Phase 1 scan, 2026-07-16) — P1s fixed, P2s tracked
Fixed: #1 middleware fail-closed on Supabase auth error; #2 config save inserts-first
(no lost active config); #3 unique `(user_id,version)` index; #4 per-user rate limit on
suggest/discover (our-key Claude); #5 googleSuggest 3s timeout.
**Tracked (P2, do later):** #6 rate-limit public `/api/mock-audit`; #7 add server-side
observability/logger (dropped in port — currently errors only surface as client toasts);
#8 when `SupabaseGeoStore` uses the Drizzle service client (RLS bypass), always scope by user_id.

## Phase 2/3 state (DONE)
- **Agent Mode** (`/assistant`): AI SDK v7 `streamText` at `/api/chat` with 6 tools —
  get_active_config, run_benchmark (Card 1), diagnose_citations (Card 2), build_plan (Card 3),
  track_progress (Card 4). `useChat` streaming UI, model selector (Haiku/Sonnet/Opus), tool-call
  cards with specialized result renderers (BenchmarkResult/DiagnoseResult/PlanResult/TrackResult),
  4 multi-select starter cards, MCP tab.
- **Persistence:** `SupabaseGeoStore` (runs/answers/sov_history), `plans` (savePlan/getLatestPlan/getPlanById).
- **Engine (`lib/geo/plan.ts` + `tactics.ts`):** categorizeSource, buildCitationProfile, computeGap,
  **allocatePlan** (greedy knapsack, gap-first, budget+person-hours), **projectImpact** (modeled, confidence
  high only if GSC+crawl grounded, assumptions always listed, capped). Worked example 5%→~22% reproduced.
  **13 engine unit tests** + robots (4) + scoring/runner (7) = **24 passing**.
- **Crawl (`lib/geo/crawl.ts`):** Firecrawl → fetch/readability fallback, robots.txt honored
  (`robots.ts`, tested), per-host rate limit. `diagnose.ts` turns cited domains → profiles+gap.
- **Reports:** `/api/report/plan/[planId]?format=html|pdf|xlsx` — HTML (`plan-report.ts`), Excel (exceljs),
  PDF (`plan-pdf.tsx`, @react-pdf). Download chips in PlanResult.
- **AI SDK v7 notes:** `convertToModelMessages` is async (await it); `tool({inputSchema})`;
  `stopWhen: stepCountIs(n)`; client `useChat` from `@ai-sdk/react`, model passed per-send via
  `sendMessage({text},{body:{model}})`; message parts `type: "tool-<name>"` / `"dynamic-tool"`.

## Phase 4/5 state (DONE)
- **Self Serve (Phase 4):** `ConfigurePlatform` on /configure — mode toggle (We Serve/Self Serve) +
  3 options. BYOK: session keys (`lib/session-keys.ts`, localStorage, sent per-request via chat body,
  never persisted) OR opt-in encrypted storage (AES-GCM `lib/crypto.ts` → `api_keys` via
  `lib/db/api-keys.ts`, verified round-trip + tamper reject). `/api/chat` `resolveKeys`: session →
  stored → We Serve (Self Serve never falls back to our keys). Own-instance + Code-base = deploy docs.
  Server actions: saveMode/storeKey/deleteKey/listStoredKeys.
- **Dashboard (Phase 5):** `/dashboard` from `lib/db/dashboard.ts` — KPI cards (SoV + delta vs prev run,
  citation share, sentiment, hallucinations), SoV trend (`SovTrendChart` Recharts line), competitor
  leaderboard (CSS bars), active plan (current→target + download chips), recent reports, config summary
  chips, empty-state → "Run your first benchmark".

## MCP connector (DONE — ported from geo-radar-mcp self-hosted OAuth)
- **Endpoint:** `POST /mcp` — TOP-LEVEL, `src/app/mcp/route.ts` with `basePath: ""` (moved from
  /api/mcp on 2026-07-17 so the deployed URL equals the legacy connector URL
  `https://geo-radar-mcp.onrender.com/mcp` — existing claude.ai connectors re-auth in place).
  Streamable HTTP, stateless, `mcp-handler` + `withMcpAuth`. The UI page that lived at /mcp is now
  `/connector`. Middleware matcher EXCLUDES `/mcp`, `/api/`, `/.well-known/`, `/healthz` (a session
  307 on the endpoint would break the connector OAuth flow — verified empirically; a beforeFiles
  rewrite can NOT do this job: middleware sees the pre-rewrite URL and mcp-handler matches pathname
  strictly).
  Tools: ping, get_active_config, run_benchmark, get_report, build_plan — all scoped by JWT `sub` (user id)
  via `lib/mcp/data.ts` (Drizzle, every query user_id-scoped; MCP has no cookies → no RLS client).
- **Auth (self-hosted OAuth, no external IdP):** DCR `POST /api/mcp/register` → `GET /api/mcp/authorize`
  (gate = GetCited Supabase session, NOT geo-radar's shared password; resumes via /login?next=) →
  `POST /api/mcp/token` (PKCE S256, one-time DB-backed codes) → HS256 JWT signed with
  `OAUTH_SIGNING_SECRET`, iss/aud = deployment origin, 7d TTL, no refresh tokens. Static `MCP_API_KEY`
  bearer kept for scripts (no user context). Metadata: `/.well-known/oauth-authorization-server` +
  `/.well-known/oauth-protected-resource` (+ path-suffixed variant); both PR docs emit
  `resource: ${origin}/mcp` and all three GETs send `Access-Control-Allow-Origin: *` (claude.ai web
  fetches them from the browser; the live geo-radar server sends it — parity required). Tables
  `mcp_oauth_clients/codes` (migration 0004, RLS deny-all, service-client only).
- **Smoke-tested:** metadata docs, 401+WWW-Authenticate challenge, DCR, authorize→login redirect
  (flow preserved), open-redirect guard, initialize handshake, tools/list, ping, and a locally-signed
  JWT calling get_active_config as a synthetic user. Claude custom connectors need a public HTTPS URL —
  deploy (or tunnel) to install in claude.ai; the wiring derives issuer from the request origin.
- **Diagrams:** `docs/mermaid/01-mcp-auth-flow.mmd` (+ master updated); viewer `docs/architecture-flow.html`.

## Render migration — GetCited takes over https://geo-radar-mcp.onrender.com (2026-07-17, ✅ LIVE)
**DONE via Render API** (key at `~/.claude/secrets/render-api-key`, chmod 600): blueprint
`exs-d9c7vj7avr4c73aim76g` disconnected · env swapped on web service `srv-d9c81pfavr4c73air3j0`
(fresh OAUTH_SIGNING_SECRET generated server-side; Auth0/quota/redis vars deleted) · source →
`APareek89/getcited@main` (build `corepack enable && pnpm install --frozen-lockfile && pnpm build`,
start `pnpm start`, healthCheckPath /healthz, plan **starter** — already paid, no upgrade needed) ·
worker `srv-d9c81pfavr4c73air3ig` suspended (geo-radar-redis left running, geo-radar-db kept) ·
deploy `5d40b7f` live 2026-07-17. **Prod smoke ALL PASS:** /healthz 200 · PR docs resource=
`https://geo-radar-mcp.onrender.com/mcp` + CORS (root + path-suffixed) · AS metadata https ·
POST /mcp → 401 + WWW-Authenticate · DCR register wrote to Supabase from Render · static-key
initialize → serverInfo getcited. **Remaining (user):** Supabase redirect allow-list
`https://geo-radar-mcp.onrender.com/auth/callback` + re-auth connector in claude.ai (old Auth0
tokens hard-fail → clean 401 → automatic re-auth at the SAME connector URL).
Goal: the existing Render web service `geo-radar-mcp` (Blueprint-managed, Auth0-proxy OAuth, worker+
Redis+Postgres siblings) starts serving GetCited at the SAME URL; claude.ai connectors pointing at
`https://geo-radar-mcp.onrender.com/mcp` re-auth in place (Auth0 tokens die at cutover; users sign into
GetCited once). geo-radar-mcp repo stays untouched (read-only).
- **Code (Phase 1, this commit):** endpoint at top-level /mcp · page → /connector · middleware matcher
  exclusions · resource=${origin}/mcp + CORS on well-known GETs · /healthz route (old service's
  healthCheckPath) · `.node-version` 22.22.0 + `engines` + `packageManager pnpm@11.10.0` (Render
  precedence: NODE_VERSION env > .node-version > engines; corepack needs packageManager; corepack is
  gone in Node 25+).
- **Render cutover (user/dashboard or Render API), IN ORDER:**
  1. Disconnect the Blueprint FIRST (else a push to geo-radar re-asserts old config; disconnect never deletes services).
  2. Grant Render's GitHub App access to private `APareek89/getcited`.
  3. Env BEFORE Update Source — keep: ANTHROPIC_API_KEY, PERPLEXITY_API_KEY, GEMINI_API_KEY,
     GROQ_API_KEY, PANEL_COST_CAP_USD_PER_RUN, MCP_API_KEY, PORT. Change: DATABASE_URL → Supabase
     pooler (needed at BUILD time; old value points at geo-radar-db). Add: NEXT_PUBLIC_SUPABASE_URL,
     NEXT_PUBLIC_SUPABASE_ANON_KEY (build-time), OAUTH_SIGNING_SECRET (⚠️ BEFORE cutover, a FRESH
     random value — NEVER geo-radar's old one and NEVER equal to MCP_API_KEY. Two reasons: the
     fallback signing key is MCP_API_KEY → static key becomes a user-impersonation forgery key; and
     if old tokens still VERIFY (same origin issuer, aud never checked) stale connectors get tool
     errors instead of the 401 that makes claude.ai re-auth — fresh secret → hard 401 → clean re-auth),
     KEY_ENCRYPTION_SECRET (same value as local — shared DB, existing BYOK rows), NODE_VERSION=22.22.0.
     Delete: OAUTH_MODE, OAUTH_ISSUER, OAUTH_AUDIENCE, MCP_TRANSPORT, REDIS_URL (+ any QUOTA_*/
     PROVIDER_RATE_LIMIT_*/DASHBOARD_PUBLIC).
  4. Settings → Build & Deploy → Update Source → `APareek89/getcited`@main; Build:
     `corepack enable && pnpm install --frozen-lockfile && pnpm build`; Start: `pnpm start`.
     healthCheckPath stays /healthz. Service name must stay `geo-radar-mcp` (URL derives from it).
  5. Suspend/delete `geo-radar-worker` + `geo-radar-redis` (worker crash-loops on new repo). KEEP `geo-radar-db`.
  6. Supabase → Auth → URL Configuration: add `https://geo-radar-mcp.onrender.com/auth/callback` to redirect allow-list.
  7. Render free tier spins down after 15 min (~60s cold start → first MCP call after idle times out) — user upgrading to Starter.
- **Post-deploy smoke (from here):** well-known docs (resource host + CORS), POST /mcp 401 challenge,
  DCR register, /healthz, then user re-auths the connector in claude.ai and runs ping/get_active_config.
- **Rollback:** Update Source back to the old repo (or reconnect Blueprint) — old repo + DB unmodified.

## v1.1 (user-feedback round, 2026-07-16 evening) — DONE
- **Memory**: `memories` table (working/procedural/structural), injected into the agent system
  prompt each turn; `save_memory` tool; capped 10/kind. **Threads**: `threads`+`thread_messages`
  (full UIMessage parts jsonb), left sidebar in Agent Mode, lazy-created on first send, persisted
  via `toUIMessageStreamResponse({originalMessages,onFinish})`, last-open restored from
  localStorage (fixes "thread went away"). APIs: GET/POST `/api/threads`, GET/DELETE `/api/threads/[id]`.
- **Langfuse**: `src/instrumentation.ts` (@vercel/otel + LangfuseExporter, no-op without keys) +
  `experimental_telemetry` on every AI call (agent, panelists, parser, roadmap, content, assist).
  NOTE ai v7 TelemetryOptions has NO `metadata` field — only isEnabled/functionId/etc.
- **Insights fixes** (root causes in Learning.MD): competitors = names + `competitor_domains`
  (migration 0005), Perplexity `res.sources` captured → merged into cited_domains,
  `persistCitations()` caches crawl evidence, capacity_note when budget/team tiny.
- **Detailed plan**: `lib/geo/roadmap.ts` (Sonnet week-by-week: actions/owner/hours/deliverable/KPI)
  stored on `plans.roadmap`; in PDF (own page, manager-shareable), Excel (Roadmap sheet), HTML, and
  the PlanResult card. 5th starter card "How can I improve?" (Action plan).
- **Agent UI**: markdown rendering (react-markdown+gfm+@tailwindcss/typography `@plugin` in
  globals.css), model selector INSIDE the composer, upload button (txt/md/csv/json ≤120KB → inlined
  into the message), per-message "Download as markdown", no divider above cards.
- **Content generation** (`lib/geo/content.ts`): blog_post, comparison_page, reddit_answer,
  linkedin_post, guest_post_pitch, review_request_email, youtube_brief — chat tool + ContentResult
  card (copy/download) **and MCP parity** (`generate_content`, `get_latest_plan` added; build_plan
  now returns roadmap + persists citations too).
- **Dashboard**: "Plan documents" card lists every plan with date/time, target, confidence,
  PDF/XLS/HTML downloads.
- **User must re-save Configure** (old configs hold URL-competitors) and can add
  LANGFUSE_PUBLIC_KEY/SECRET_KEY (+optional LANGFUSE_BASEURL) and FIRECRAWL_API_KEY.

## Possible follow-ups (not blocking v1)
- GSC/GA4/YouTube/Ahrefs integrations to raise projection confidence.
- Persist `citation_share` in sov_history; store report artifacts in Supabase Storage (currently on-demand).
- Interactive end-to-end verification needs sign-in + spends on Claude (paid) — not run during build.
- FMEA P2s (mock-audit rate limit, server logger) — deferred per user "P0-only" preference.

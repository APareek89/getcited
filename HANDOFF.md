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
(`app-shell.tsx`): Configure · GEO Agent (/assistant) · **GEO MCP (/mcp — new page, MCP panel moved
out of the assistant tabs)** · Dashboard. Assistant no longer has an Agent/MCP tab switcher.
`/mcp` added to PROTECTED_PREFIXES. Also fixed missing `--color-danger` mapping (text-danger classes
were silently no-oping).

## UI fix round 2 + Tracker (user feedback 2026-07-17 from live screenshots) — items 1–4 DONE (awaiting user live check), 5–6 in progress
1. **Configure layout** (`src/app/(app)/configure/page.tsx` + `components/configure/*`): too much dead
   space. Split into TWO columns — left "Business" (brand/competitors/queries/budget), right "Platform"
   (We Serve/Self Serve + BYOK). Compact the cards; page must fit the viewport with NO scrolling unless
   the user adds extra competitors/queries (start with 3 visible rows + Add).
2. **Top nav alignment** (`components/app-shell.tsx`): tabs go LEFT, next to the GetCited logo (remove
   justify-center).
3. **Dashboard nav bug** (screenshot: KPI numbers bleed through the header): sticky `.glass` header is
   too transparent + stacking-context issue. Fix: header background rgba(7,11,20,~0.85) + blur, z-50,
   verify content scrolls UNDER it on /dashboard.
4. **GEO Agent chat width** (`components/assistant/assistant-view.tsx`): messages container max-w-2xl
   is too narrow — widen the CONTENT area (e.g. max-w-4xl/5xl) but KEEP the composer + starter-cards
   block at its current width.
5. **Detailed plan doc**: chat shows a SUMMARY only (collapse PlanResult); the full plan becomes a
   downloadable **DOCX** (new: `docx` npm pkg; extend `/api/report/plan/[planId]` with format=docx) +
   existing PDF/Excel. Plan content must be practical & detailed per tactic: WHAT (action), WHY
   (gap/evidence), HOW (step-by-step guidelines), WHO (owner role), TIMELINE (week-by-week with dates
   from plan creation), plus general execution guidelines. Extend roadmap.ts generation accordingly.
6. **New "Tracker" tab** (nav: Configure · GEO Agent · GEO MCP · Tracker · Dashboard):
   - Approval flow: after build_plan the agent ASKS "approve this plan into your Tracker?" →
     new `approve_plan` tool writes tracker rows (also MCP parity per standing rule).
   - New table `tracker_items` (migration 0006, RLS owner-only): id, user_id, plan_id, week,
     due_date (derived from plan creation + week), action, owner_role, hours, deliverable,
     status (not_started|in_progress|done|blocked — dropdown), remarks (user-editable), updated_at.
   - /tracker page: editable table (status dropdown + remarks inline edit, save via server action).
   - `track_progress` tool now reads tracker_items (status+remarks) as the PRIMARY source for
     "how am I progressing", plus optional re-benchmark for measured impact.

## Next session — pending points (2026-07-17)
0. **User validates the Aurora Glass re-theme + top nav live** (sign in; check Configure/GEO Agent/
   GEO MCP/Dashboard render well as glass; report any contrast/spacing misses — mockup refs in docs/design-refs/).
1. **User validates v1.1 live**: re-save Configure (old competitors are URLs → hit "Suggest competitors",
   set real budget/team), run "How can I improve?" card, check roadmap + PDF, try generate_content + upload.
2. **Loop offer is OPEN** (Loop.MD status: offered) — ask once: turn the eval loop on?
3. User may add keys: `LANGFUSE_PUBLIC_KEY`/`LANGFUSE_SECRET_KEY` (tracing) + `FIRECRAWL_API_KEY` (richer crawls).
4. Candidate next features (PM backlog): content calendar view from roadmap, weekly digest email,
   competitor-watch alerts, Vercel deploy (needed for installing the MCP connector in claude.ai).

## Decisions
- 2026-07-16 — Supabase project = the formerly-shared one, repointed to GetCited (other tenant was dead staging).
- 2026-07-16 — MCP auth = self-hosted OAuth ported from geo-radar (no external IdP); authorize gated by app session.
- 2026-07-16 — FMEA policy = act on P0 only (user preference). Competitors stored as names + parallel domains.
- 2026-07-16 — GitHub: private repo on the user's active gh account; repo must stay PRIVATE.

**Session efficiency:** 🎯 ~75% feature (6 phases + v1.1) · 🔧 ~15% support (shared-Supabase auth untangle, pnpm/corp-TLS) · 🔁 ~10% rework (competitors-as-URLs fix, Recharts bar swap)

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
- **Endpoint:** `POST /api/mcp` (streamable HTTP, stateless, `mcp-handler` + `withMcpAuth`).
  Tools: ping, get_active_config, run_benchmark, get_report, build_plan — all scoped by JWT `sub` (user id)
  via `lib/mcp/data.ts` (Drizzle, every query user_id-scoped; MCP has no cookies → no RLS client).
- **Auth (self-hosted OAuth, no external IdP):** DCR `POST /api/mcp/register` → `GET /api/mcp/authorize`
  (gate = GetCited Supabase session, NOT geo-radar's shared password; resumes via /login?next=) →
  `POST /api/mcp/token` (PKCE S256, one-time DB-backed codes) → HS256 JWT signed with
  `OAUTH_SIGNING_SECRET`, iss/aud = deployment origin, 7d TTL, no refresh tokens. Static `MCP_API_KEY`
  bearer kept for scripts (no user context). Metadata: `/.well-known/oauth-authorization-server` +
  `/.well-known/oauth-protected-resource` (+ path-suffixed variant). Tables `mcp_oauth_clients/codes`
  (migration 0004, RLS deny-all, service-client only).
- **Smoke-tested:** metadata docs, 401+WWW-Authenticate challenge, DCR, authorize→login redirect
  (flow preserved), open-redirect guard, initialize handshake, tools/list, ping, and a locally-signed
  JWT calling get_active_config as a synthetic user. Claude custom connectors need a public HTTPS URL —
  deploy (or tunnel) to install in claude.ai; the wiring derives issuer from the request origin.
- **Diagrams:** `docs/mermaid/01-mcp-auth-flow.mmd` (+ master updated); viewer `docs/architecture-flow.html`.

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

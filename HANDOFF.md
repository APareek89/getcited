# GetCited — Handoff

> Fresh-session resume doc. Read this first. GetCited is a **private** Next.js/Vercel
> web app that measures a brand's AI citation share-of-voice across an LLM panel, then
> turns it into a **costed, committed action plan** grounded in crawled competitor
> citation evidence. Full spec: `docs/GETCITED-BUILD-PROMPT.md` (copy it in if missing;
> canonical source lives in the sibling `geo-radar-mcp` repo under `docs/`).

## Golden rules (do not break)
- Repo stays **PRIVATE**. Local git only, **no remote**, never publish.
- **Never log/expose API key values.** Only ever check presence. `.env.local` is gitignored.
- Projections are **modeled estimates**, never guarantees: list assumptions + a confidence band.
- Respect **robots.txt + rate limits** when crawling. Ask before any paid/live external call in a build step.
- At the **start of each phase**, tell the user exactly which `.env.local` keys it needs.
- Do **not** edit the reference project `geo-radar-mcp` — read-only port source.

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

> **First full version COMPLETE** (all 6 phases). Landing → auth → Configure (+Self Serve) →
> Agent Mode (4 cards, streaming, reports) → Dashboard. All green.
3. Crawling + scoring engine (`plan.ts` allocator + `projectImpact`) + cards 1–4 + reports (PDF/Excel/HTML) — **unit tests required**
4. Self Serve: Configure Platform (3 options) + BYOK (session vs encrypted-stored)
5. Dashboard (KPIs, trend, leaderboard, active plan/progress, alerts, downloads)

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
- **Supabase project is SHARED** — namespace any global/auth-schema objects with `getcited_`.

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

## Possible follow-ups (not blocking v1)
- Real hosted MCP endpoint (`/api/mcp`); GSC/GA4/YouTube/Ahrefs integrations to raise projection confidence.
- Persist `citation_share` in sov_history; store report artifacts in Supabase Storage (currently on-demand).
- Interactive end-to-end verification needs sign-in + spends on Claude (paid) — not run during build.
- FMEA P2s (mock-audit rate limit, server logger) — deferred per user "P0-only" preference.

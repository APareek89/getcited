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
0. **Setup + Supabase** ← DONE (scaffold, deps, theme, env, green build)
1. Scaffold polish + port `lib/geo` (per-user keys) + Supabase Auth + schema/migrations + landing + Configure (+suggest_queries, +discover_competitors)
2. GEO Assistant: Agent-Mode streaming chat + MCP page (tool-call cards, model selector)
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

## Current state (end of Phase 0)
- `create-next-app` scaffolded (folder had capitals → scaffolded to lowercase subdir then moved up).
- Deps installed: framer-motion, recharts, lucide-react, drizzle-orm/kit, postgres, ai + @ai-sdk/{anthropic,google,groq,perplexity}, @supabase/{supabase-js,ssr}, zod, exceljs, @react-pdf/renderer; dev: vitest, tsx, dotenv.
- shadcn/ui initialized (Base UI). Base components added: button, card, input, label, textarea, badge, tooltip, tabs, select, separator, skeleton, sonner, dialog, scroll-area.
- **Theme:** dark-by-default (`<html class="dark">`), GetCited §8 tokens in `globals.css` (bg #0B0D10, card #14171C, accent #635BFF, pos #2FBF71, warn #E0A32E, danger #E5484D, text #E6E8EB, muted #8A9099), Inter font. Extra tokens: `--positive`, `--warning` (exposed via `@theme` as `positive`/`warning`).
- `layout.tsx`: Inter + TooltipProvider (`delay` prop — Base UI, not `delayDuration`) + Toaster (sonner).
- `page.tsx`: minimal dark hero placeholder ("Get cited by AI. Know exactly what to do.").
- Scripts: `dev build start lint typecheck test test:watch`. `vitest.config.ts` (passWithNoTests until Phase 3).
- **Green:** `pnpm typecheck` ✅ · `pnpm lint` ✅ · `pnpm test` ✅ · `pnpm build` ✅.

## Gotchas learned
- Folder `GetCited` has capitals → npm rejects as package name. Scaffolded into `getcited/` then moved contents up.
- pnpm 11 gates build scripts; approve in `pnpm-workspace.yaml` (`allowBuilds` + `onlyBuiltDependencies`): sharp, unrs-resolver, esbuild.
- shadcn `init -b` = base library (radix|base), NOT base color. This install uses **Base UI** primitives.
- Corp MITM proxy: export `NODE_EXTRA_CA_CERTS`/`SSL_CERT_FILE`=`/Users/anandpareek/Documents/SEO content Skill/scripts/system-ca-bundle.pem` before npm/pnpm/npx.

## Next: Phase 1
Create Supabase project (Auth email+Google), get the 4 Supabase env values, then: port `lib/geo`
(provider keys as per-call param), Drizzle schema on Supabase + RLS, Supabase Auth, landing page,
Configure page (brand/competitors×5+＋/queries/budget/team) + `suggest_queries` + `discover_competitors`.

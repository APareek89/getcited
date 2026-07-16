# GetCited

> **Get cited by AI. Know exactly what to do.**

Private product. GetCited measures whether AI assistants (Claude, Perplexity, Gemini,
Groq) recommend and cite your brand, then turns that into a **costed, committed action
plan** — grounded in how competitors are actually cited (we crawl and categorize their
citations), not vibes. Two modes: **We Serve** (our keys/infra) and **Self Serve** (BYO keys).

⚠️ **Private repository.** Do not publish or make public.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in the must-have keys (see below)
pnpm dev                     # http://localhost:3000
```

Checks:

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

## Environment

Copy `.env.example` → `.env.local` (gitignored, never committed). Keys are only ever
checked for **presence**; values are never logged or exposed. Must-haves to start:
`ANTHROPIC_API_KEY`, `DATABASE_URL` (Supabase pooler), `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `KEY_ENCRYPTION_SECRET`.

## Docs

- Build spec: [`docs/GETCITED-BUILD-PROMPT.md`](docs/GETCITED-BUILD-PROMPT.md)
- Current state / resume: [`HANDOFF.md`](HANDOFF.md)

The GEO measurement pipeline is ported from the reference project `geo-radar-mcp`
(read-only) into `lib/geo/*`, adapted for per-user keys and Supabase.

## Stack

Next.js 16 (App Router, TS) · Tailwind v4 + shadcn/ui (Base UI) + Framer Motion · Recharts
· Supabase (Postgres/Drizzle + Auth + Storage) · Vercel AI SDK · Firecrawl · Vercel.

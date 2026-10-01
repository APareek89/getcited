# GetCited

Compare model answers about your brand, turn observations into a modeled plan, and track the work. Prepared examples are clearly labeled; ordinary probes use a configured provider and are directional evidence.

AWS URL: **https://getcited.3-6-183-210.sslip.io**. Live signup, prepared workflows, account boundaries, the corrected paid probe and saved-report restoration have passed acceptance.

## Try the product in three steps

1. Create an email/password account and sign in. Google sign-in and password recovery are not configured.
2. Choose **Try with an example** for a saved, free prepared report and plan. Inspect the results, explicitly approve the plan into Tracker, edit status/remarks, and download its documents. Prepared figures are illustrative and remain provider-free.
3. To research your own brand, save a new configuration with brand, competitors and buyer questions. In GEO Agent, use **Run a single-response probe** for one explicit OpenAI request, or the existing assistant workflows for a broader benchmark and plan. Ordinary operations use provider allowance; they are separate from the prepared example.

## Local development

Use Node 22 and the pinned pnpm version in `package.json`. Install with `pnpm install --frozen-lockfile`, then configure a private local environment from `.env.example`. The hosted application requires its own PostgreSQL schema, Auth.js secret, matching origin and encryption secret; existing Supabase data and credentials are not imported.

For isolated preview work, use `GETCITED_DIST_DIR=.next-integrated`, a disposable database, provider mock mode and no real provider keys. Set the public/Auth.js origin to the exact loopback port you use. Keep the original default build directory separate when comparing a baseline. A provider-blocked test fixture is not evidence of a live provider request.

Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, then the coordinated production build. Database migration and production deployment are operator steps. The fresh launch schema is `migrations/001_portfolio.sql`; historical `drizzle/` migrations and their CLI configuration are not the deployment path. Do not run the legacy browser harness against an old account or environment.

## What the numbers mean

- Share of voice is each brand’s answer mentions divided by total mentions across the tracked brands. It is not mentions divided by the number of answers.
- The ordinary single-response probe does not search the web. Its deterministic parser identifies literal brand mentions and domain-shaped text. Those domains are unverified mentions, not confirmed cited sources. Provider-supplied sources and separately crawled evidence must be distinguished from that text.
- A single response is directional, not a measurement of the current AI-search market. Projections are modeled estimates with assumptions and confidence, never guaranteed lift. Prepared plans remain separate illustrative evidence; dashboard trends containing examples are not proof of market change.
- The hosted default is OpenAI GPT-4o mini. Supported BYOK routes require their own keys. The retired Groq route and unpriced legacy Perplexity route are unavailable; no silent replacement is used.

Text appears after each bounded provider completion so usage can be recorded before semantic parsing. Tool updates remain available; Stop aborts the in-flight transport. This is not a live token-by-token output claim.

## Accounts and workflow

Auth.js Credentials uses PostgreSQL-backed account/session checks. Each configuration, thread, run, plan and tracker record belongs to its signed-in owner. The client fences late responses, streams, uploads and downloads when the account changes. Legacy global browser state is never imported into a new account.

BYOK values use this tab’s owner-scoped session storage by default and are cleared on sign out/account change; browsers may restore tab storage. Explicit encrypted server storage is a separate option. Keys are hidden after saving and never printed in verification receipts. Self Serve AI suggestions require encrypted stored credentials; tab-only credentials are supported by chat and the single-response probe. Prepared configuration suggestions stay disabled until an edited ordinary configuration is saved.

The original Configure → GEO Agent → Dashboard → explicit plan approval → Tracker flow is retained, including paired competitor domains, queries, budget/capacity inputs, thread restoration, text attachments, Stop, tool cards and Word/PDF/Excel/HTML exports. MCP clients connect to this deployment’s `/mcp` URL and request explicit account consent. Tokens expire after 24 hours and are tied to the revocable sign-in session; signing out requires reconnecting.

## Design and verification scope

The app adopts the shared Lovable token reference with licensed, self-hosted Inter and Roboto Mono, Lucide icons, neutral surfaces and light/dark themes. It retains the original form and routing logic. There is no generated-media pipeline to configure.

Original baseline acceptance covered 40 tests, production build/lint, 13 HTTP groups with 72 assertions, and the native mock-audit browser flow. The final local build passes 67 tests, including 13 client/card regressions; 23 actual PostgreSQL checks and two provider/metering fixtures also pass. Compiled Auth.js HTTP checks pass 84 checks across 82 requests with no provider calls. Root browser checks verified both prepared tool cards, explicit approval of six tracker rows, persisted status/remarks, PDF action, dark theme and a 390 px layout without page overflow or console errors. Live two-owner HTTP checks passed 36 checks across 39 requests with zero provider calls. Root browser verified signup/sign-in, both prepared cards, six approved tracker rows, restored edits, themes and 390 px layout without console errors. No paid multi-provider/crawl/plan quality claim is made.


## Controlled live probe

On 1 October 2026, the first 128-token attempt returned provider usage for 76 input and 128 output tokens but failed before saving an answer (estimated USD 0.0000882). Truncation is the leading inference; the exact finish reason was not retained. The failed run and its charge remain recorded.

One explicitly approved correction requested only brand names with a 256-token ceiling. It completed at 11:15:06.853–11:15:08.144 UTC with OpenAI GPT-4o mini: 75 input, 7 output, zero cached/reasoning tokens, estimated USD 0.00001545. The response became an owned saved report. Browser reload restored “Linear, Asana, Jira.” with its model, prompt and estimated cost in both themes, without another provider request or console errors. Total: two billed requests, USD 0.00010365 estimated, with no automatic retries.

The prompt supplied the tracked brands. This proves provider connectivity, usage accounting, deterministic matching and report persistence; it is not an unbiased discoverability benchmark or current market research. Costs use published token rates, not an inspected invoice.

See [HANDOFF.md](HANDOFF.md), [Learning.MD](Learning.MD), and the historical [build specification](docs/GETCITED-BUILD-PROMPT.md). Earlier Supabase/Render and Aurora design notes describe the old implementation, not the launch candidate.

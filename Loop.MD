# Loop.MD — GetCited
status: on
<!-- 2026-07-17 later: user granted a $2 paid-eval budget for this session; 3 paid confirmations run (journal below), ~$0.05 spent. Standing constraint returns to free-only unless re-granted.
<!-- Turned ON 2026-07-17 (user: "free evals only, no API calls"). Constraint: the loop
     runs typecheck/lint/vitest + the evals below ONLY via mock mode / pure functions /
     code inspection — never a real LLM, crawl, or other paid/API call. Evals needing a
     signed-in browser session (e.g. #5) are marked manual and reported as ⏭ user-validates.
     Paid checks stay per-approval with a written hypothesis (run journal below). -->


> AGENT INSTRUCTION — read every session and obey:
> - While `status: waiting_for_first_draft`: the moment the first working draft exists
>   (core path runs end-to-end once — demo-able, not just compiling), ASK the user:
>   "First draft is working. Want me to turn on the Loop? I'll run every eval below
>   after each change, show per-eval pass/fail, and keep finetuning until they pass."
>   Set `status: offered` when asked; `on` or `off` per the answer. Re-ask an
>   unanswered `offered` once at next session start.
> - While `status: on`: after each meaningful change run cheapest checks first
>   (typecheck/tests), then execute EVERY eval below for real, report a per-eval ✅/❌
>   table including regressions, fix, repeat.
> - Paid/slow checks (real LLM/crawl calls): write a one-line hypothesis in the run
>   journal BEFORE running; reproduce failures as free checks; one paid confirmation per hypothesis.

## Goal
GetCited measures a brand's AI citation share-of-voice across an LLM panel and produces a
**costed, committed action plan** (budget + team → tactics → projected citation share /
traffic / conversions) grounded in crawled competitor-citation evidence. "Done" = the four
Agent-Mode cards (Benchmark, Diagnose, Plan, Track) run end-to-end, the plan allocator
respects budget + person-hours and fills the biggest citation gaps, and every projection is
presented as a modeled estimate with listed assumptions + a confidence band.

## Evals
<USER: replace/extend these examples with your real questions and expected answers.>

| # | Input (question / action / call) | Expected (answer / behavior / output) |
|---|----------------------------------|----------------------------------------|
| 1 | Run a panel (mock mode, no keys) for brand X vs 3 competitors on the demo prompts | Returns SoV entries summing to 1 (or all 0), a per-prompt breakdown, and cost_usd = 0 — no crash without API keys |
| 2 | `allocatePlan({budget: 400, teamSize: 2, timelineWeeks: 8, gaps})` where leader has 8 roundups / you have 0 | Chosen tactics stay within $400 AND within ~400 person-hours; the roundup/comparison-page gap tactics are prioritized; output lists per-tactic cost/effort + which gap each closes |
| 3 | `projectImpact()` with NO grounding data (no GSC/Perplexity/Ahrefs) | `confidence: "low"` or `"medium"` (never `"high"`), every assumption listed, framed as a modeled projection not a guarantee |
| 4 | `projectImpact()` when budget is $0 / no tactics selected | targetCitationShare ≈ current share (no uplift claimed), confidence not "high", assumptions still listed — no divide-by-zero or NaN |
| 5 | Configure page: brand URL + 5 competitors + budget + team, save | Persists a versioned config row keyed to the signed-in user; reload shows the saved values |
| 6 | Crawl a citation URL that disallows crawling in robots.txt | Skips it (respects robots), logs the skip, falls back gracefully — never fetches disallowed paths |
| 7 | Any surface that stores/handles a BYO API key | Key value never appears in logs, responses, or the DB unless the user opted into encrypted storage (AES-GCM) |

## Run journal (paid/slow checks only)
| Date | Hypothesis (changed X, expect eval N to flip because W) | Result |
|------|----------------------------------------------------------|--------|
| 2026-07-17 | H1: post-redesign, MCP run_benchmark (real Claude+Perplexity panel, override brand Linear vs Jira/Asana, 2 queries) returns SoV summing ~1 (or all-0), per-prompt rows, 0<cost_usd<cap — provider wiring survived the endpoint move + redesign | pending |
| 2026-07-17 | H2: Configure "Suggest with AI" + "Generate from brand" (live LLM) return ≥3 plausible competitors / ≥5 queries for a real brand via the NEW form UI — server-action wiring survived the rebuild | ✅ PASS — 5/5 competitors (Jira, Asana, Monday.com, Notion; merged w/ existing), 10/30 queries generated |
| 2026-07-17 | H3: MCP build_plan on H1's report_id yields tactics within budget, roadmap weeks with WHAT/WHY/HOW/WHO, projection confidence ≠ "high" (crawl-grounded medium ok), and the DOCX export downloads — plan pipeline intact end-to-end | ✅ PASS — 6 tactics $400≤$500, conf=medium, 6 assumptions, 10 entries across weeks 1-8 w/ action/why/how/owner/hours/deliverable, DOCX 200 (21KB valid) |

# GetCited — agent guide

Private Next.js/Vercel web app: measures a brand's AI citation share-of-voice across an
LLM panel, then turns it into a **costed, committed action plan** grounded in crawled
competitor-citation evidence. Build spec: [`docs/GETCITED-BUILD-PROMPT.md`](docs/GETCITED-BUILD-PROMPT.md).
Current state / resume: [`HANDOFF.md`](HANDOFF.md).

## Golden rules
- Repo is **PRIVATE** — local git only, no remote, never publish.
- **Never log/expose API key values** — only check presence. `.env.local` is gitignored.
- Projections are **modeled estimates**, never guarantees: list assumptions + confidence band.
- Respect **robots.txt + rate limits** when crawling; ask before any paid/live external call in a build step.
- At the **start of each phase**, tell the user which `.env.local` keys it needs.
- Do **not** edit the reference project `geo-radar-mcp` (read-only port source).

## Power Coding (auto — do not remove without asking the user)
At session start read Handoff.MD; open with its pending points. Update Handoff.MD
after major changes and when ~10% of context remains (then tell the user to start a
fresh session with: "Refer to Handoff.MD in /Users/anandpareek/Documents/Projects/GetCited and begin").
Log flow changes / user-reported bugs with root cause in Learning.MD.
Read Loop.MD every session and obey its `status:` machine — when the first working
draft is done, ASK the user whether to turn the loop on; while `status: on`, run the
Loop.MD evals after every meaningful change and report per-eval pass/fail.
Keep docs/mermaid/*.mmd current when the flow changes.
Obey .power-coding/config.json FMEA triggers: smart_suggest is ON — watch for signals
(new API integrations, async/queue, auth, error-handling, 200+ line diffs, migrations)
and suggest an FMEA scan at a natural pause (never twice for the same change-set). Run
`power-coding fmea` on request. The config's failure_categories list is the mandatory
checklist; prd_path is docs/GETCITED-BUILD-PROMPT.md.

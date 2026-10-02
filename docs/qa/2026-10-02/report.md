# GetCited — free FMEA and regression review, 2 October 2026

The matrix covers **111 distinct possible failure scenarios across all 12 Power Coding categories**. It does not claim that many bugs: 9 scenario rows are addressed by 6 grouped corrective changes. Existing controls, residual risks, product limits, historical limits and unverified cases are identified separately.

Baseline commit: `73d6fbe1a8a4c6c2b1a194e417d595c907e48724`. Root deployed the reviewed image; see `aws-release.json`. The worker made no real provider calls or live-data writes and did not operate the deployment.

## Corrective changes

- Attachment reads clear the previous payload immediately, block Send/Go while pending, and use selection generations, so an older read cannot restore a removed file, replace a newer selection or attach after sending.
- Brand names are canonicalized before share-of-voice counting; duplicate case/space variants and the own brand in competitors no longer duplicate score rows.
- Benchmark text requires an explicit completed provider status. Unknown/truncated completions cannot be saved as successful answers; known usage remains settled.
- Provider failures retain only bounded status, provider, model and operation reference. Keys, prompts and upstream error bodies are excluded.
- Plan cards reload approval from current owner-scoped Tracker rows. Historical chat messages stay unchanged, foreign-owner status is not exposed, and an approved plan shows the Tracker link.
- The landing page no longer promises exact invoice cost. It explains configured-rate usage and uncertain reservations. The separate encrypted key-storage opt-in is implemented and tested.

## Evidence and scoring

Statuses: `controlled` 93, `fixed` 9, `product_limit` 3, `historical_limit` 1, `residual_risk` 3, `unverified` 2.

Evidence kinds: `source_inspection` 41, `automated` 66, `not_run` 4.

[fmea.csv](fmea.csv) and [fmea.json](fmea.json) contain each scenario, source/test reference, effect/control, S/O/D, RPN and priority. Scores are product-aware ordinal judgments, not measured probabilities. For fixed rows the score describes the pre-fix risk; for other rows it describes current controls or the remaining evidence gap. RPN=S×O×D; P0≥200, P1≥100, P2<100. All pre-fix P0 rows have corrective code and executed regressions; source-inspected cases are not labelled tested.

Validation: 84 native vitest, 24 postgres repository checks, 2 sdk postgres fixture cases, 85 compiled http assertions, 83 compiled http requests. Counts represent different test scopes and must not be added to claim unique user scenarios. Production build passed; TypeScript passed.

Checks use real code with local PostgreSQL, normal account flows and intercepted/fixture provider transports. Non-loopback network access is denied in the server/SDK fixture runners. No configured provider credentials are loaded. A model-authored/session-authored response is marked as a simulation, never provider acceptance. Safe HTTP receipts and a validation inventory are saved alongside this report.

The parent owns browser evidence. The keyless normal-auth preview is `http://127.0.0.1:9002`; screenshots and any final browser receipt are maintained by the parent. Scoped browser acceptance is recorded in [browser-qa.json](browser-qa.json), including screenshot hashes. Only those named checks are verified; no broader UI acceptance is inferred.

## Remaining limits

- The earlier interrupted live GEO conversation has no retained evidence of its original cancellation trigger. This work does not invent a retrospective cause.
- Citation-domain mentions are not verified citations; supplied-brand probes are connectivity checks, not unbiased market research. Projected gains remain modeled.
- Citation-cache persistence remains best-effort and can fail without a user warning; the returned report is still usable.
- The owner allowance currently includes BYOK estimates. This conservative policy is not a provider invoice and its scope could be explained more clearly.
- Current provider answer quality, hosted concurrency/load, and this candidate’s deployment have not been tested by this worker.

## Release gates

The parent must review the exact diff, package/build the exact Linux image, preserve live environment/mounts, smoke it without network, and perform the approved release plus normal-account readback. No paid quality, current-law or load claim is implied by a green fixture.

## Root release verification

On2October2026 root activated image `df4bf73221d6` using an image-only update. Authentication remains enabled and mock mode disabled; environment, mounts, runtime bounds and other applications were preserved. The operator made zero provider calls. See `aws-release.json` for full image/source hashes. This deployment receipt does not establish new live GEO model quality.

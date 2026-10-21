# SourceSteps 0.1.0-rc1 — source/download candidate

This source/download release candidate is a reproducible bundle for local evaluation, with no hosted demo or submitted entry. It preserves teacher text as positional source pieces, with manual labels and separate review/completion counts. No answer generation or semantic completeness inference occurs.

## Evidence and correction

Review found an import consistency defect: validated JSON could divide a surrogate pair or CRLF even though manual splitting refused those boundaries. A reproduction accepted both cases before the fix. Imported ranges now use the same boundary check as manual splits. Focused tests reject both malformed cases and confirm that valid Unicode/CRLF remains lossless while unknown completion/display metadata is discarded.

The reviewed suite passes 27 tests covering exact round trips, malformed/oversized data, duplicate chunks, source edits, split/merge, limits, cancellation/reset/repeated flows and interrupted imports. The handler-flow tests execute actual app handlers with a minimal DOM and controlled confirmation results; they are not browser dialog tests. Run `npm test` to repeat the checks.

Browser evidence from supported Chrome: manual labeling, one-action focus/check/source return, keyboard split/merge, source-edit invalidation, invalid local import rejection, hostile text safety, empty state, sample reload and 500-piece coverage. Desktop and 390px/320px responsive checks found no horizontal overflow. Skip-link focus was fixed and verified. Two synthetic-only screenshots are bundled. No animation or timed progress is present. Sampled foreground/background contrast calculations exceeded 4.5:1; this is not a complete audit.

## Explicit limits

- Prior browser export/download outcome remains uncertain and was not retried. Download/reimport is not end-to-end verified.
- Native confirmation dismissal triggers a supported browser tool focus-emulation timeout. The dialog disappears, but native cancel/confirm state and focus return cannot be fully inspected. Model-level state-safety tests pass; do not claim native-dialog UX verified.
- Actual screen-reader speech, full keyboard traversal, 200% zoom and reduced-motion preference emulation remain incomplete. Keyboard zoom had no observed effect; available capabilities do not expose media emulation. No browser/OS security settings were changed.
- Browser textarea entry normalizes line endings. JSON preserves its exact source string until an edit; every actual edit invalidates mappings. Imported labels/checks are user declarations, not cryptographically authenticated teacher requirements.
- Manual labeling can overlook meaning, dependencies and constraints. No real learner study, clinical benefit, proven learning gain, global novelty or WCAG conformance is claimed.

## Local reproducibility

Use Node.js 22 for `npm test` and `npm start`, with no install/build step. Use existing Python 3.13 and Node.js 22 for `python scripts/release.py`. The packaging script uses an explicit file allowlist, fixed ZIP metadata, per-file SHA-256 manifest, safe fresh extraction, manifest/content checks, tests from the extracted copy, deterministic rebuild comparison and loopback HTTP smoke checks. It does not make internet requests. See README.md, DEMO.md, ATTRIBUTION.md and LICENSE.

The archive intentionally substitutes this concise report for the workspace's historical verification log to exclude personal workspace paths, browser tab IDs and operational clutter. It excludes all user downloads, secrets, repository metadata, caches, node_modules and generated test-output directories. Existing development artifacts are not deleted.

# SourceSteps 0.1.2-rc1 — rejected boundary edit recovery

This maintenance release fixes a reproduced focus-control defect. A rejected split previously cleared the active action internally while leaving its visible panel unchanged; checking it failed and returning to source could throw. Focus now resets only after a successful split or merge. Exact source, labels, checks and current action remain intact on rejection.

## Verification

- 44 Node tests, including 10 handler regressions. Eight new rejection regressions fail against the prior app and pass with this fix.
- Actual baseline Chromium run 41171803686 reproduced the wrong check error and broken return link.
- Final Chromium verification covers seven groups: invalid offsets; Unicode and CRLF; 500-piece limit; successful split/merge; source changes and native confirmation cancel/accept; 320px and 390px keyboard/reduced-motion layouts. The initial fixed-source run [41172038679](https://github.com/sharonbasovich/sourcesteps/actions/runs/41172038679) passed all seven groups; the release records the final exact-head rerun and independent visual review.
- The packaging tool verifies deterministic bytes, SHA-256 manifest, extracted-copy tests and loopback HTTP allowlist/CSP.

The unchanged screenshots in evidence/ are historical initial-workspace captures, not new evidence for this fix. Fresh desktop/mobile screenshots are in the corresponding GitHub Actions browser-evidence artifact.

## Preserved boundaries

Node 22 loopback HTTP distribution only; no hosted or standalone-file deployment. No autosave or learning-outcome claims. No retry of the historical uncertain application export; synthetic JSON imports in isolated CI are distinct. No physical-phone, native screen-reader or accessibility-certification claim. Original v0.1.0-rc1 and v0.1.1-rc1 releases remain unchanged. Existing AccessED submission is preserved.

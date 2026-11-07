# SourceSteps 0.1.6-rc1 - noneditable split-point preview

A native noneditable slider selects valid split boundaries without counting UTF-16 offsets. A precise before/after preview uses quoted text, visible CR/LF/tab escapes and bounded context. The numeric offset remains available. Surrogate pairs and CRLF stay together; combining marks may still be split, matching the existing model. Preview and slider movement do not change source, draft, labels or action checks. Successful splits and merges retain their existing affected-label reset behavior, and unresolved-source navigation remains available.

Native Undo/Redo retains normal browser behavior: explicit Undo can undo the latest source edit even when another control is focused, and Redo can restore it. The slider is not an editable text field; no history interception, global restoration workaround, app Undo stack or autosave was added.

November 7 local verification: 71 application/model tests and six dialog-helper tests passed. Five focused installed-Chrome selector groups and five existing review-navigation groups passed. They cover keyboard/mouse selection, native source Undo/Redo round trips, pending drafts, repeated split/merge, canceled Apply, rejected offsets/500-piece limit, exact CRLF/lone-CR/emoji/combining source, unresolved navigation and 320/390/1280px layouts. Desktop and narrow screenshots were visually inspected. Independent exact-tree runtime review approved the candidate.

CRLF/lone-CR browser coverage substitutes only the synthetic startup sample literal; it is not native imported-file acceptance. The full general/exit suites and native file operations were not rerun. Physical touch devices, screen readers, real learners and accessibility conformance remain unverified. No hosted CI success is claimed. The selector suite is wired into the combined browser command for future authorized runs; adding that wiring does not mean the combined command was run here.

The deterministic source ZIP uses an explicit allowlist, includes the new model test, and excludes browser dependencies, private reports and temporary probes. The local packaging workflow passed a byte-identical rebuild, extraction of all 25 files, per-file manifest verification, 71 packaged tests and loopback HTTP/CSP checks. See the matching verification.json and packaged-tests.tap for actual package results. Historical bundled images remain explicitly historical. Source-checkout-only QA commands require the separate QA harness and installed dependencies; they are not part of the no-install runtime ZIP.

No hosted demo, runtime dependency, network access, credentials or account setup was introduced. Prior releases, assets and the submitted entry remain unchanged. Historical verification follows.

---

# SourceSteps 0.1.5-rc1 - unresolved-source navigation

Version 0.1.5-rc1 adds direct entry to unreviewed or unclear source and a per-piece next-review route that wraps in source order. Relabeling keeps that route available. Navigation focuses the exact source label without changing source text, labels, action checks, selected action, exit-warning protection or pending drafts. All pieces remain visible. An all-labeled state explicitly does not mean assignment completion.

November 7 local verification: 68 application tests and six dialog-helper tests passed. Three focused Chrome navigation groups passed at 1280, 390 and 320 CSS pixels with reduced motion, covering keyboard continuation after relabeling, a single remaining piece, drafts/discard, all-labeled guidance, reopened uncertainty, exact source and action focus preservation, page errors and horizontal overflow. These are not physical-device or screen-reader tests. Two long-piece groups at 390 and 320 pixels with the default motion setting also passed, for five browser groups total. They verify the Read piece from start control focuses a visible heading and Tab returns to its label without changing source. The deterministic local package rebuild, extraction, all 24 file contents/manifests, 68 packaged tests and default-port loopback HTTP/CSP checks passed. Independent review approved the scoped runtime, keyboard/navigation experience and QA structure, including the long-piece remedy; it independently reran all 74 Node/helper tests and five Chrome groups.

The focused suite is included in the existing combined browser command and CI path. The full general/exit browser suites were not rerun for this version because they contain held file operations. No native picker, browser import or browser download was attempted in this pass. Historical regression evidence below is not a fresh run. No hosted CI pass, real-learner validation, learning gain, accessibility conformance, autosave or semantic completeness claim is made.

Prior releases and assets remain unchanged. The following sections preserve their historical verification records.

---

# SourceSteps 0.1.4-rc1 - best-effort page-exit warning

This release contains the independently reviewed page-exit warning candidate and prior downloaded-review recovery tests. It preserves exact source text and manual review semantics. Export does not clear exit protection, and no autosave is provided. Browser-controlled prompts may be skipped on mobile closure, crashes or process termination.

Local release validation on November 7, 2026: 62 Node tests, six dialog-helper tests, deterministic package rebuild, extraction, manifests and loopback HTTP/CSP checks. The runtime candidate previously passed 11 dedicated headed Chrome groups and ten existing browser groups on November 5. New hosted GitHub verification is billing-blocked and is not claimed passed. Native OS file chooser, physical devices, screen readers and direct-file operation remain unverified. Historical evidence images are not screenshots of this release.

The following sections preserve historical verification records.

---

# SourceSteps 0.1.3-rc1 — source draft candidate

Typing into the source no longer immediately destroys reviewed progress. An unapplied draft is separate from the exact applied source; existing labels, checks and selected action remain linked to that applied source. Apply validates the draft, then confirms before resetting existing review. Discard restores the original source and review, including imported CRLF text. Workspace replacement prompts disclose draft loss; editing or discarding invalidates pending file reads. Export is disabled while a draft is pending, avoiding silently exporting an older source.

Verification completed November 2, 2026:
- 54 Node tests passed (44 prior tests adapted to explicit Apply plus 10 draft regressions).
- Independent source review and five additional checks passed, including 100 repeated draft/cancel/discard cycles and browser-normalized CRLF preservation.
- Actual cloud browser reproduced old one-keystroke review loss, then verified that a new draft retains the checked action and labels. Native Apply confirmation and Escape cancellation retained both draft and existing review.
- Independent actual UI review passed desktop and a narrowed native window at 125% zoom (approximately 400 CSS pixels; exact DOM width not measured). Keyboard Escape canceled Apply, Tab reached the visible Discard button, and Enter restored textarea focus while preserving the checked action. Text and stacked buttons were readable without visible clipping. Zoom and window were restored.

Nine automated HTTP Chromium groups passed in CI run 41544069629 on source candidate a2a8418a1e55f232f8a61683b0ff81a40e35798c, covering prior boundary/navigation flows, draft cancel/apply/discard, imported CRLF, and 320/390px reduced-motion layouts. Extracted release tests, deterministic rebuild, manifest and loopback HTTP/CSP checks also passed. Later documentation-only commits should retain their own exact-head CI result. Screenshots under evidence/ are historical v0.1.2-rc1 baseline images, not this draft UI.

No full accessibility conformance, native screen-reader, physical-device, learner study, learning benefit, native export/file-chooser workflow or direct-file compatibility is claimed. There is no autosave: closing/reloading still loses the session. No hosted deployment is introduced. The existing submitted entry and prior release remain available.


## Downloaded-review recovery verification — November 3, 2026

The automated HTTP Chromium suite now downloads a real review JSON file, saves it to disk, reloads the app to discard the in-memory review, cancels a replacement, selects that same saved file again, and restores it. Assertions preserve exact Unicode and CRLF source, repeated pieces by position, reference/action/unclear labels, a checked action and return-to-source focus. A second real download must be byte-identical. Both JSON files and a restored-review screenshot are retained in the browser-evidence artifact. This closes the automated recovery coverage gap rather than adding an unrelated feature.

All 54 Node tests, ten HTTP Chromium groups, and extracted release manifest/deterministic rebuild/loopback checks passed in [CI run 41626321580](https://github.com/sharonbasovich/sourcesteps/actions/runs/41626321580) at c667d91525d10337ae20989fd3610b087d5de6e5. The first test revision raced asynchronous file reading against dialog registration; it was corrected to wait for dialog completion and restored DOM state before proceeding. No product defect or runtime change is claimed.

This is automated Chromium file input and download evidence, not native operating-system file-chooser, direct-file loading, assistive-technology or learner-study evidence. The app still has no autosave; a download-request announcement alone does not prove that a file was saved. Existing release and submitted entry remain unchanged.


## Unpublished page-exit warning candidate — November 5, 2026

This local candidate requests the browser's standard page-exit warning for unapplied drafts or reviews whose full exact state differs from the recreatable sample, empty workspace and most recently confirmed imported file. Labels, checks and source boundaries count; focus selection and expanded details alone do not. Immutable canonical strings prevent baseline aliasing when review operations mutate state. Draft comparison retains the textarea-normalized baseline while imported source remains exact.

Export initiation never clears protection. Import rejection, cancellation, supersession and stale reads do not advance recovery keys. Restart and draft discard recalculate protection against the same recovery keys. The visible notice explains export and best-effort limits; it does not promise a saved session. Browser-controlled prompts can require user interaction and can be skipped on mobile closure or process termination. No autosave, storage or runtime network operation was added.

Baseline Chrome 156.0.8078.79 silently discarded a label, check and Unicode draft on reload at main 0c9ceb23db69fb06fd0963aec054fc67e84520c4. The candidate has 62 passing Node regressions and 6 passing bounded-dialog helper tests. Eleven dedicated headed Chrome groups and ten existing browser groups passed. Deterministic packaging, extraction, manifest, 62 packaged tests and loopback HTTP/CSP checks passed using an isolated test port to preserve an unrelated server. Receipts live beside the candidate delivery; historical evidence images bundled by the existing packager remain historical. Native file chooser, physical devices, screen readers and direct-file operation are not claimed verified. This candidate is not published and does not change the existing submission, release or film.

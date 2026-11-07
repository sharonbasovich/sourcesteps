# Private SourceSteps page-exit warning verification — November 5, 2026

Base: 0c9ceb23db69fb06fd0963aec054fc67e84520c4 (remote main verified through git ls-remote before editing). Baseline app blob: 37c43f5fe94eeb88b8640d25419554483ae42965. All implementation happened in a new candidate checkout; four older native checkouts were read-only reconciled. Their original app hashes/statuses and untracked dist directory were preserved.

Baseline reproduction used installed Chrome 156.0.8078.79: after labeling, checking and typing an unapplied Unicode draft, reload silently restored the sample with no exit dialog. Existing 54 Node tests passed on that baseline.

The candidate compares immutable canonical exact-source/mapping strings with the built-in sample, empty state and latest confirmed import. Draft dirty state still compares against resetDraft's textarea-normalized value. It attaches one beforeunload listener only while protection is needed, removes it when clean, and never advances a baseline on export. Only source/label/check/boundary data are covered. Focus selection/details alone remain clean. Pending import reads are not retained. Core transformations, server restrictions, dependencies and exact-source serialization are unchanged.

Passed:
- 62 Node tests (all 54 existing plus 8 multi-case warning regressions), including cancel/reject/superseded/stale imports, immutable label/check baselines, same-count changed boundaries, repeated resets, draft discard/apply and custom source retained protection.
- 6 bounded-dialog helper tests.
- 11 dedicated groups in actual installed headed Chrome 156.0.8078.79. Cancel preserved exact source/review/draft and usable focus controls; Leave reloaded. Fresh-target close Cancel kept the tab/draft; Leave closed it. Synthetic imports preserved CRLF/Unicode, textarea normalization and exact exported state. Export request, canceled download and completed download did not clear dirty protection. Repeated dirty/clean cycles, canceled/invalid/oversized operations and 320/390px reduced-motion keyboard layouts passed. No external requests/page errors observed in this suite.
- All 10 existing browser regression groups, using installed Chrome and isolated loopback port 14174, including real downloaded-file recovery and byte-identical re-export.
- Syntax checks for app.js, core.js, server.js and both browser scripts; git diff --check.
- Existing deterministic release packager checks via the adjacent package-isolated.py wrapper: only test port 4173 was substituted with 14175 so an unrelated server was left alone. The original scripts/release.py and server.js bytes are packaged unchanged. Rebuild bytes, extraction, all manifests, 62 packaged tests, 200/404 static allowlist, CSP and exact HTTP bodies passed. The generated archive retains the existing candidate filename; it is local only and is not the published release.
- Independent internal read-only implementation review found no actionable runtime defect and independently reran the 62+6 tests. Independent harness review found an occupied-port identity risk in the prior polling harness. It was fixed with a bounded owned-child startup check and exact fetched app.js byte comparison in qa/server.mjs; both suites were rerun. The occupied-port rejection check is recorded in the delivery receipt.
- Desktop, 320px and 390px screenshots inspected locally: warning text wraps, controls remain usable, no horizontal overflow. Existing typography, colors, border and reduced-motion rules were preserved. No animation added.

Corrected verification attempts (not product failures): the first baseline launcher found unrelated port 4173 busy; a dedicated test port resolved it. Windows URL.pathname paths in the prior QA script were not native filesystem paths; fileURLToPath fixed them. A canceled reload can leave Playwright waiting for navigation; the helper permits its bounded timeout only after exactly one observed and dismissed beforeunload event. Repeating DevTools Page.close on the same canceled target failed to emit a second dialog; close Cancel and Leave are instead tested on separate fresh targets. The first temporary packaging wrapper substituted its port in the wrong order; corrected wrapper passed all checks. No production behavior was altered to accommodate these harness issues.

Limits / not run:
- Native OS file chooser deliberately not retried after the earlier uncertain cancellation; only synthetic Playwright setInputFiles was used.
- Physical devices, Safari/Firefox, screen readers, direct-file operation, mobile process killing and real-learner validation were not tested.
- Browsers choose prompt wording and may require prior interaction; mobile closures/crashes/process termination can skip prompts. No autosave or save-completion guarantee. Latest-import recoverability assumes the selected file remains available. Selecting Leave deliberately loses in-tab changes.
- Exact default-port packaging could not run while another process used 4173; isolated-port equivalent passed. No unrelated process was terminated.
- No hosted CI, push, PR, publication, merge, deployment, billing/access change, submission/release/film modification or screenshot/trace/media upload.

---

Historical verification follows.

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

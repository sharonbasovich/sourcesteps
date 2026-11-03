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

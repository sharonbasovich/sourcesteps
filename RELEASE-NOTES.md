# SourceSteps 0.1.3-rc1 — source draft candidate

Typing into the source no longer immediately destroys reviewed progress. An unapplied draft is separate from the exact applied source; existing labels, checks and selected action remain linked to that applied source. Apply validates the draft, then confirms before resetting existing review. Discard restores the original source and review, including imported CRLF text. Workspace replacement prompts disclose draft loss; editing or discarding invalidates pending file reads. Export is disabled while a draft is pending, avoiding silently exporting an older source.

Verification completed November 2, 2026:
- 54 Node tests passed (44 prior tests adapted to explicit Apply plus 10 draft regressions).
- Independent source review and five additional checks passed, including 100 repeated draft/cancel/discard cycles and browser-normalized CRLF preservation.
- Actual cloud browser reproduced old one-keystroke review loss, then verified that a new draft retains the checked action and labels. Native Apply confirmation and Escape cancellation retained both draft and existing review.
- Independent actual UI review passed desktop and a narrowed native window at 125% zoom (approximately 400 CSS pixels; exact DOM width not measured). Keyboard Escape canceled Apply, Tab reached the visible Discard button, and Enter restored textarea focus while preserving the checked action. Text and stacked buttons were readable without visible clipping. Zoom and window were restored.

Nine automated HTTP Chromium groups passed in CI run 41544069629 on source candidate a2a8418a1e55f232f8a61683b0ff81a40e35798c, covering prior boundary/navigation flows, draft cancel/apply/discard, imported CRLF, and 320/390px reduced-motion layouts. Extracted release tests, deterministic rebuild, manifest and loopback HTTP/CSP checks also passed. Later documentation-only commits should retain their own exact-head CI result. Screenshots under evidence/ are historical v0.1.2-rc1 baseline images, not this draft UI.

No full accessibility conformance, native screen-reader, physical-device, learner study, learning benefit, historical export/re-import retry or direct-file compatibility is claimed. There is no autosave: closing/reloading still loses the session. No hosted deployment is introduced. The existing submitted entry and prior release remain available.

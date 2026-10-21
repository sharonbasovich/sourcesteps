# Repeatable remaining browser checks

Run `npm start`, open `http://127.0.0.1:4173/` using supported browser control. Use only synthetic files. Reconcile previous pending download and approval state before creating another transfer.

1. Label sample title Reference; pieces 2 and 3 Action; final piece Unclear. Check one action; verify unreviewed/unclear counts remain separate and source order stays fixed. Next/Previous focus must follow source order; source return must focus the exact piece.
2. Use keyboard Tab/Shift+Tab, native select arrows, Enter and Space throughout. Check skip link, labeled file input, focus indicators, headings, live status and keyboard details expansion. No control should trap focus or require a pointer. Verify with an actual screen reader separately.
3. Split a synthetic piece at a valid offset; both new pieces must be unreviewed. Merge with next; affected labels/checks must clear. Invalid offset and a surrogate-pair/CRLF boundary must report an error without losing source. Compare reconstruction with original.
4. Restart: cancel retains exact state; accept keeps source and resets all review. Clear: cancel retains; accept yields empty explanation and disabled export. Repeated sample loads must not duplicate text. Reload must start the sample, consistent with no autosave notice.
5. Import valid fixture, cancel replacement then import again and accept. Import invalid fixture must retain existing source/checks with an error. Cancel file chooser without change. Change source while a file read is pending: stale import must be rejected.
6. Once prior download state is resolved, export the exact fixture, inspect the saved JSON, compare its source string and mappings to the original, and reimport. Preserve CRLF, punctuation, combining marks, supplementary Unicode and duplicate lines exactly. Do not equate download-request status with a saved file.
7. Test 390px and 320px viewport widths and desktop. Verify no horizontal page overflow, clipped controls or overlapping text; inspect expanded boundary controls, focus state and long hostile strings. Verify 200% zoom separately.
8. Check reduced-motion preference and computed animation/transition behavior. No timed progress is expected. Check actual rendered contrast and touch targets; do not infer accessibility conformance from source inspection.
9. Review developer logs and local network behavior. Learner content must never be transmitted. All source rendering must remain text, with no images/scripts created from hostile content.

Record actual results, screenshots and blockers in VERIFICATION.md. Do not publish or submit.

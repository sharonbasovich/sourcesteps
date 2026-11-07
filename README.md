# SourceSteps

SourceSteps is a local-only AccessED prototype, created October 20, 2026, distributed as source and a downloadable release candidate. It helps a learner keep dense assignment instructions in view using an exact-source, manually labeled checklist and one-action focus view. It does not rewrite teacher requirements or generate answers. No hosted demo is deployed.

## Run and test

Requires existing Node.js 22. No installation or build step is needed.

```powershell
npm start
# Open http://127.0.0.1:4173/
npm test
```

Stop the server using Ctrl+C. The server binds only to IPv4 loopback, uses an explicit static-file allowlist, and sets a Content Security Policy blocking external connections, images, frames and form submissions. No accounts, APIs, telemetry, paid packages or runtime dependencies are used. Closing/reloading loses changes unless explicitly exported locally as JSON.

## Demo

The synthetic garden assignment loads immediately. Label its title Reference, an instruction Action, and uncertainty Unclear. Focus the action, inspect surrounding source, check it yourself and return to its exact source piece. Unreviewed, unclear and checked-action counts remain separate. A reference can still contain essential constraints.

Advanced boundary controls split at a UTF-16 offset or merge adjacent pieces. Source order is fixed. Both operations clear affected labels and checks. Source edits stay in an unapplied draft. Apply starts a new review and confirms before clearing existing labels/checks; Discard keeps the applied source and review intact. Export is disabled while a draft is pending so it cannot silently omit edited text. Restart keeps exact source while resetting review; Clear removes the session. Destructive replacements ask first.

## Preservation contract

Authoritative state is a string plus contiguous half-open UTF-16 ranges `[start,end)`. Pieces cover every unit once, including whitespace, punctuation and blank lines. Duplicate text has distinct positional links. Labels are Unreviewed, Action, Reference and Unclear. Labeled means reviewed only, never understood or semantically complete. Checked actions are learner declarations; no overall assignment-complete claim is made.

JSON import validates complete nonoverlapping coverage, allowed labels and check eligibility before replacing state. It strips unknown fields, rejects files over 2 MB, sources over 100,000 units and imports over 500 pieces, and treats all source text as data through textContent. Initial line splitting keeps any lines beyond the first 499 together as the final unreviewed piece, preserving all text. At 500 pieces, merge before splitting again. Export/import serialization preserves source exactly, including CRLF and Unicode. Browser textarea entry normalizes line endings; merely viewing an imported source leaves its authoritative string intact. Applying an actual edit replaces that string and invalidates all mappings. Discarding a draft preserves the authoritative imported string, including CRLF. This boundary is disclosed in the interface.

## Disclosures and limitations

Maintenance candidate 0.1.3-rc1 preserves the currently focused action when a boundary edit is rejected. Invalid positions, Unicode/CRLF boundaries and the piece limit no longer disconnect the visible action from its check and return-to-source controls. Successful boundary edits still clear affected labels and checks. The 54-test suite includes ten focus-preservation regressions. Historical v0.1.2-rc1: seven actual HTTP Chromium groups covered rejected and successful edits, synthetic imports, navigation, destructive confirmation, keyboard and 320/390px reduced-motion layouts; no historical export retry or direct-file compatibility is claimed. The prior import protections remain: a newer selection event supersedes older pending reads, so old results cannot prompt, apply or overwrite newer status. The existing import tests cover both completion orders, failures, canceled replacement confirmation and empty selection events. Native picker cancellation that emits no change event is outside that handler. This candidate retains the Node.js/local-server workflow; no standalone HTML build is included or claimed verified.

OpenAI Codex assisted design, implementation and testing. No runtime AI, external imagery/fonts, runtime third-party packages or datasets are used. The separate browser QA harness uses Playwright; it is not needed to run the app. Node's built-in HTTP, file and test modules provide local development tooling. The assignment and fixtures are synthetic. No pre-existing project files were found in the initially empty workspace.

SourceSteps is submitted to AccessED Hacks. This maintenance release preserves that project and its exact-source learning limits. No real-user validation, clinical benefit, demonstrated learning gains or global novelty is claimed. Manual labels can miss meaning. Focus never removes the obligation to review references, uncertainty and other requirements. Numeric UTF-16 splitting is an advanced control. See VERIFICATION.md for actual checks and remaining limitations; implementation of semantic controls is not a WCAG conformance claim.

## Event check

The official overview and rules were inspected in supported Chrome before implementation on October 20, 2026:

- https://accessed-hacks.devpost.com/
- https://accessed-hacks.devpost.com/rules

They allow original October 17–November 20 work, solo entry, credited AI assistance, synthetic examples and an accessible evaluable demo; video is optional. No conflict with this local prototype was found. The overview's introductory “four days” differs from its explicit dates and the rules; this prototype follows the explicit event window. This maintenance source/download release does not create a new entry or deploy a hosted app.

## Project files

Release-candidate packaging uses `python scripts/release.py` with existing Python 3.13 and Node.js 22. It needs no packages or internet connection. Stop your own demo server first so port 4173 is free. Each run creates a fresh dist/verification-* folder containing the deterministic ZIP, SHA-256 sidecar, unpacked test copy, TAP results and verification.json. The ZIP has a per-file MANIFEST.sha256 and a concise verification report. Packaging checks run only against 127.0.0.1; the script does not upload or host anything. See DEMO.md, ATTRIBUTION.md, RELEASE-NOTES.md and LICENSE. Source/download distribution does not include a hosted deployment or modify the existing AccessED entry.

- index.html / style.css: semantic interface and responsive styling
- core.js: exact-source model and transformations
- app.js: local browser state, rendering and file controls
- server.js: loopback static server
- tests/core.test.js: repeatable automated tests
- tests/flows.test.js: actual app-handler tests in a minimal DOM with controlled confirmation results; does not emulate native dialog UI
- tests/make-fixtures.js / tests/fixtures/: synthetic browser import fixtures
- VERIFICATION.md: verification evidence and incomplete stages
- tests/import-boundaries.test.js: consistent imported/manual Unicode and CRLF boundaries
- scripts/release.py: deterministic, allowlisted packaging and extracted-copy verification

## Source draft maintenance (November 2)

A single accidental keystroke previously cleared all review progress. Draft edits now leave the applied source, positional mappings, labels, action checks and chosen focus intact. Apply validates before replacing and confirms when reviewed progress would be reset. Discard restores the applied text. A visible draft panel and review-source notice distinguish both versions. Starting or discarding a draft invalidates pending imports; imports and workspace replacements disclose draft loss before replacing it. There is still no autosave, and closing/reloading loses the session.

54 Node tests passed, plus independent repeated-cycle and normalized-CRLF checks. Browser verification for this maintenance is recorded in RELEASE-NOTES.md. Historical evidence images show the earlier baseline, not this draft panel.

### Downloaded review recovery

Automated HTTP Chromium now verifies a real downloaded JSON file can restore exact source, positional labels and checked actions after reload, including canceled replacement and same-file retry. Re-export is byte-identical. See VERIFICATION.md for the exact CI run, retained artifact and native-file-chooser limits. No autosave or runtime behavior has been added.

## Page-exit warning (v0.1.4-rc1)

The browser is asked to warn before reload, navigation or tab closure while an unapplied source draft or unretained review exists. Unchanged synthetic sample and empty workspaces are recreatable and do not warn. A confirmed successful JSON import establishes the latest recoverable review: exact source, piece boundaries, labels and checks. Changing any of these warns again; restoring the exact sample, empty state or latest import clears it. Focus selection and expanded details alone do not warn. Only the most recent import is remembered as a comparison key, in memory for this tab.

Applying source edits, restarting review and discarding a draft do not establish a saved copy. Requesting or even completing an export does not clear protection because this app cannot confirm that a usable download was retained. Check your downloaded JSON before leaving, then choose Leave in the browser prompt if ready. An unapplied draft still needs Apply or Discard before export; applying it resets review after the existing confirmation.

The warning does not save anything. Browsers control its wording and may require prior interaction; mobile app closures, crashes and process termination may skip it. No autosave, browser storage or network access was added. It does not retain the selected focus, expanded details or pending imports across reload. Successful import is assumed recoverable from the selected local file; the app cannot guarantee that file will remain available.

From the source checkout (QA files are not included in the downloadable app archive), run the Node and dialog-helper checks, then both browser suites:

```powershell
npm test
npm run test:dialog
npm ci --prefix qa --ignore-scripts
npx --prefix qa playwright install chromium chrome
npm run test:browser
# To run only the dedicated exit-warning suite:
npm run test:exit
```

The general browser suite defaults to Playwright's bundled Chromium; the dedicated
exit-warning suite retains its installed Google Chrome default. CI provisions both.
Set `$env:SOURCESTEPS_BROWSER='chrome'` to run both suites with an existing Chrome
installation instead. The dedicated suite uses isolated loopback port 14173;
`SOURCESTEPS_QA_PORT` optionally overrides the general suite's default port 4173.
`npm run test:browser` runs both suites and fails if either fails. CI also runs the
six dialog-helper tests through `npm run test:dialog`; `npm test` remains the
runtime-only Node suite so it works in the downloadable app archive without QA dependencies.

All file imports in these tests are synthetic Playwright file-input assignments;
native file-picker interaction is intentionally unverified. The dedicated suite
checks browser-controlled beforeunload events with Cancel and Leave, downloaded
JSON, and 320/390px reduced-motion layouts. The published release is v0.1.4-rc1;
see VERIFICATION.md for dated evidence and limits. This test-wiring maintenance
does not replace the published release assets, AccessED entry or film.

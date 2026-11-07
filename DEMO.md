# Synthetic-data demo (about three minutes)

1. Extract the ZIP. With existing Node.js 22, open a terminal in the extracted folder and run `npm test`, then `npm start`. Open http://127.0.0.1:4173/ . No install, login or internet connection is required after obtaining Node and the archive. Opening index.html directly is not supported: browsers restrict ES modules on file URLs.
2. The fictional garden assignment loads immediately. Before: the learner must hold every instruction in mind while reading a dense block. Intended change: the original remains visible while the learner labels exact pieces and focuses one action. This is a demonstrated workflow difference, not measured learning improvement.
3. Mark the title Reference, the garden-visit instruction Action, another instruction Action and the final alternative Unclear. Show that references may contain essential requirements. The counts distinguish labeled text, unreviewed pieces, uncertainty and checked actions.
4. Focus an action, expand its surrounding source context and return to its original piece. Check the action yourself. Other unreviewed/unclear pieces must remain outstanding; the app never announces the whole assignment complete.
5. Expand Adjust piece boundaries, move the split-point slider and inspect its quoted before/after preview, then split and merge with the next piece. Numeric UTF-16 offsets remain available. Show exact source retained and affected labels reset. Change one source word: the unapplied draft preserves review. Apply the draft and confirm to reset old labels, checks and links. Cancel preserves both draft and review.
6. Restart keeps the source but resets review; Clear removes the session. Both ask before discarding work. Cancel should preserve state, but end-to-end native confirmation behavior remains an automation limitation; see VERIFICATION.md. Nothing autosaves across reloads.

Only synthetic JSON fixtures are included under tests/fixtures. A valid import illustrates CRLF, Unicode, duplicate text and literal hostile HTML. Invalid JSON should be rejected without replacement. Local browser export implementation exists, but its prior download outcome is unresolved; do not present download/reimport as verified.

Screenshots: evidence/desktop.jpg and evidence/mobile-390.jpg. They capture the sample workflow surface, not an accessibility certification. They predate the import-boundary validation fix, which does not change the visible interface.

Limits: manual labels can miss meaning. No answer generation, semantic completion judgment or dependency inference occurs. Real screen-reader testing, native confirmation focus, 200% zoom and reduced-motion emulation remain incomplete. The app has no timer or active animation. Video is optional; none is bundled. Run this candidate locally; source/download distribution includes no hosted deployment or AccessED submission.

### Safe source edits (v0.1.3-rc1)
Label an action and check it. Type a space in the source: review remains unchanged and an unapplied-draft panel appears. Cancel Apply to retain both draft and review, or Discard to restore the applied source. Apply and confirm only when you intend to restart review. Export is unavailable until the draft is applied or discarded.

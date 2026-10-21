# Synthetic-data demo (about three minutes)

1. Extract the ZIP. With existing Node.js 22, open a terminal in the extracted folder and run `npm test`, then `npm start`. Open http://127.0.0.1:4173/ . No install, login or internet connection is required after obtaining Node and the archive. Opening index.html directly is not supported: browsers restrict ES modules on file URLs.
2. The fictional garden assignment loads immediately. Before: the learner must hold every instruction in mind while reading a dense block. Intended change: the original remains visible while the learner labels exact pieces and focuses one action. This is a demonstrated workflow difference, not measured learning improvement.
3. Mark the title Reference, the garden-visit instruction Action, another instruction Action and the final alternative Unclear. Show that references may contain essential requirements. The counts distinguish labeled text, unreviewed pieces, uncertainty and checked actions.
4. Focus an action, expand its surrounding source context and return to its original piece. Check the action yourself. Other unreviewed/unclear pieces must remain outstanding; the app never announces the whole assignment complete.
5. Expand Adjust piece boundaries, split at a valid UTF-16 offset, then merge with the next piece. Show exact source retained and affected labels reset. Change one source word: all old labels, checks and links must clear.
6. Restart keeps the source but resets review; Clear removes the session. Both ask before discarding work. Cancel should preserve state, but end-to-end native confirmation behavior remains an automation limitation; see VERIFICATION.md. Nothing autosaves across reloads.

Only synthetic JSON fixtures are included under tests/fixtures. A valid import illustrates CRLF, Unicode, duplicate text and literal hostile HTML. Invalid JSON should be rejected without replacement. Local browser export implementation exists, but its prior download outcome is unresolved; do not present download/reimport as verified.

Screenshots: evidence/desktop.jpg and evidence/mobile-390.jpg. They capture the sample workflow surface, not an accessibility certification. They predate the import-boundary validation fix, which does not change the visible interface.

Limits: manual labels can miss meaning. No answer generation, semantic completion judgment or dependency inference occurs. Real screen-reader testing, native confirmation focus, 200% zoom and reduced-motion emulation remain incomplete. The app has no timer or active animation. Video is optional; none is bundled. Run this candidate locally; source/download distribution includes no hosted deployment or AccessED submission.

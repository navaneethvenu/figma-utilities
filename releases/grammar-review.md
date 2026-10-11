# Grammar release candidate - owner review draft

Status: partial local candidate. Release number is not assigned. Nothing is published.

## Proposed release notes
- Numeric edits use one modifier grammar: +, -, *, / for a single adjustment; ++, --, **, // for cumulative changes across the selection.
- Cumulative changes accept ranges and mixed scalar/range expressions.
- Size uses wh for width and height, and sc:w / sc:h for axis-targeted scaling.
- Bare numbers remain the default. Explicit units are checked consistently; duplicate counts must be integers.
- Proposed, not yet staged: explicit fit/fill/hug axis commands and shorter stroke width/alignment names.

## Migration notes
The following maps describe the intended full grammar batch, not all code in the partial candidate today.

| Earlier spelling or behavior | New spelling or behavior | Staged? |
| --- | --- | --- |
| s120,80 for size | wh120,80 | Yes |
| scw200 / sch120 | sc:w200 / sc:h120 | Yes |
| direct sc value | Choose sc:w or sc:h for the target axis | Yes |
| +++ additive cumulative flow | ++ | Yes |
| ++, --, **, // progression | Each folds cumulatively using its own arithmetic operation | Yes |
| width/height value keywords for fit/fill/hug | fit, fitw, fith; fill, fillw, fillh; hug, hugw, hugh | No |
| ah / axis variants | hug / hugw / hugh | No |
| af / axis variants | fill / fillw / fillh | No |
| afi / axis variants | Removed; do not claim a one-to-one replacement without checking fixed-sizing behavior | No |
| st, stl, str, stt, stb, stx, sty | sw, swl, swr, swt, swb, swx, swy | No |
| sti / stc / sto | sai / sac / sao | No |

Examples from staged source: +w8 changes width by 8; wh120,80 sets both dimensions; sc:*w2 scales to twice the width target. ++h40/2 accumulates increments of 40, 20, 10, giving cumulative adjustments of 40, 60, 70. Division by zero and divide ranges touching/crossing zero are rejected.

Do not copy the old README's claim that ++h24/2 yields cumulative +24,+12,+6: those are the operands, not the cumulative totals.

## Candidate manifest
Recorded baseline: v21, 2510939e9887ef78c5dc475d0e03ef26b909907f. This marker has not been proved byte-identical to the live Community release.

Seven source commits are staged as separate local cherry-picks:
a98f668, 8dc5b2b, 3688655, 3c9b58b, b1956de, 424c2f0, b1b5c60.

Fit/fill/hug source 20013bd did not pass a patch-context check on this candidate. It changes suggestions code introduced by excluded autocomplete commits. No conflicted cherry-pick was started.

Stroke source 4d81fc4 combines renames with new stroke paint replace/append/insert/delete commands and depends on earlier expanded fill plumbing. Including the full commit would broaden this release. Adapt the renames alone, include dependency features explicitly, or split the release. Scope decision pending.

## Verification
Use the existing production build and narrow parser checks, then a short real-Figma smoke pass for numeric sizing, parent-relative sizing, auto-layout fill/hug, and stroke names. Test only what is actually in the final candidate. No heavy fixture suite is required by default.

Native checks remain paused for laptop use. No native pass is claimed. Build status is recorded separately after execution.

No main/dev/inv changes, resets, merge commits, pushes, release tags or publication are part of this preparation.

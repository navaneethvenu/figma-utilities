# Grammar release candidate - owner review draft

Status: complete local command-only candidate for owner review. Release number is not assigned. Nothing is published.

## Proposed release notes
- Numeric edits use one modifier grammar: +, -, *, / for a single adjustment; ++, --, **, // for cumulative changes across the selection.
- Cumulative changes accept ranges and mixed scalar/range expressions.
- Size uses wh for width and height, and sc:w / sc:h for axis-targeted scaling.
- Bare numbers remain the default. Explicit units are checked consistently; duplicate counts must be integers.
- Explicit fit/fill/hug commands accept optional w or h axes, and dimensions support parent-relative percentages.
- Stroke width uses sw and edge variants; alignment uses sai/sac/sao. No new stroke paint operations are included.

## Migration notes
The following maps describe the intended full grammar batch, all changes are now staged in the candidate.

| Earlier spelling or behavior | New spelling or behavior | Staged? |
| --- | --- | --- |
| s120,80 for size | wh120,80 | Yes |
| scw200 / sch120 | sc:w200 / sc:h120 | Yes |
| direct sc value | Choose sc:w or sc:h for the target axis | Yes |
| +++ additive cumulative flow | ++ | Yes |
| ++, --, **, // progression | Each folds cumulatively using its own arithmetic operation | Yes |
| width/height value keywords for fit/fill/hug | fit, fitw, fith; fill, fillw, fillh; hug, hugw, hugh | Yes |
| ah / axis variants | hug / hugw / hugh | Yes |
| af / axis variants | fill / fillw / fillh | Yes |
| afi / axis variants | Removed; do not claim a one-to-one replacement without checking fixed-sizing behavior | Yes |
| st, stl, str, stt, stb, stx, sty | sw, swl, swr, swt, swb, swx, swy | Yes |
| sti / stc / sto | sai / sac / sao | Yes |

Examples from staged source: +w8 changes width by 8; wh120,80 sets both dimensions; sc:*w2 scales to twice the width target. ++h40/2 accumulates increments of 40, 20, 10, giving cumulative adjustments of 40, 60, 70. Division by zero and divide ranges touching/crossing zero are rejected.

Do not copy the old README's claim that ++h24/2 yields cumulative +24,+12,+6: those are the operands, not the cumulative totals.

## Candidate manifest
Recorded baseline: v21, 2510939e9887ef78c5dc475d0e03ef26b909907f. This marker has not been proved byte-identical to the live Community release.

Seven source commits are staged as separate local cherry-picks:
a98f668, 8dc5b2b, 3688655, 3c9b58b, b1956de, 424c2f0, b1b5c60.

Adapted source 20013bd in commit 2312595: fit/fill/hug runtime and parsing, parent-relative sizes, minimal suggestion support for axis suffixes and percentages. Excluded intent ranking, templates and invalid-chain recovery.

Extracted source 4d81fc4 renames in commit df0e135: width/edge and alignment routes only. No replace-stroke module, s/sa/si/sd actions, expanded fill plumbing or new paint features.

The original main/dev/inv/docs branches remain unchanged. Existing source commit IDs and local adaptation IDs are separate provenance; this is not an identical cherry-pick of C/F.

## Verification
Use the existing production build and narrow parser checks, then a short real-Figma smoke pass for numeric sizing, parent-relative sizing, auto-layout fill/hug, and stroke names. Test only what is actually in the final candidate. No heavy fixture suite is required by default.

Native checks remain paused for laptop use. No native pass is claimed. Production webpack build passed. The reproducible scripts/grammar-smoke.cjs checks parsing, removed aliases, suggestion routes, parent percentages, stroke property routes and auto-layout axis isolation using plain mock nodes. These checks are not a native Figma pass.

No main/dev/inv changes, resets, merge commits, pushes, release tags or publication are part of this preparation.

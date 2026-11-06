# Feature record

Last reviewed: 2026-11-06

Scope: the committed `dev` snapshot at `1e608671a102f94e25b7210dcb208f0fe2a6ebd2`, which is the base of this documentation branch. Evidence dates below are the commit, generated-record, release-record, or review dates shown. A repository record is not proof of a current Figma publish, live-editor result, or device result.

## Status labels

`implemented` means committed product behavior is present in source. `tested` means committed verification coverage or an observed check is recorded. `live` means the repository records a release, not that the current Figma listing was checked. `partial` means the source or product documentation limits the claim. `planned` means the engineering guide lists future work. `held` means a committed record or a verified owner task record explicitly puts work on hold. `unknown` means the repository does not establish the current fact.

## [implemented] Command-driven plugin

- Hotkey accepts a required `Property` parameter, parses compact commands, and applies chained commands to the current selection. Evidence: `README.md:3-11,35-48` (source snapshot reviewed 2026-11-06), `manifest.json` (source snapshot reviewed 2026-11-06), `src/plugin/controller.ts`, `src/plugin/set-properties/parse-params.ts`, and `src/plugin/set-properties/set-properties.ts` (latest file commits 2026-10-23 or earlier).
- The committed command catalog covers 37 groups and 162 commands. Evidence: `docs/generated/commands.json:2-7` (generated 2026-08-22), generated from `src/plugin/set-properties/prop-list.ts`.
- Supported command areas include position, size, radius, padding, stroke, selection, color, constraints, auto layout, text spacing, transforms, node creation, and miscellaneous utilities. Evidence: `README.md:87-106` (source snapshot reviewed 2026-11-06).
- Recent committed work includes `each` loop parsing/execution and suggestion-ranking fixes. Evidence: `README.md:80-84` and `git` history commits `47b929e`, `1e60867`, `780e888`, and `b824093`, all dated 2026-10-23.

## [partial] Editor and UI support

- The manifest declares Figma and FigJam, but the engineering record says FigJam support is partial and command-specific. Evidence: `manifest.json` and `docs/agent-engineering-guide.md:25-33,168-176` (guide committed 2026-08-22; snapshot reviewed 2026-11-06).
- The production interaction is parameter-driven. The bundled React UI is documented as an unwired template, not the runtime product surface. Evidence: `README.md:108-120`, `src/app/components/App.tsx`, and `docs/website-brief.md:103-118` (snapshot reviewed 2026-11-06).

## [tested] Committed verification coverage

- `scripts/verify-command-smoke.cjs` contains assertions for loop expansion, text edits, stroke-width computation, auto-layout sizing, and parsing. It explicitly marks several Figma API semantics as untested by design. Evidence: `scripts/verify-command-smoke.cjs:1-119` (latest commit 2026-10-23).
- On 2026-11-06, this worktree could not execute the build, smoke script, or typecheck because dependencies are absent: `yarn build` reported `webpack: command not found`; the smoke script reported `Cannot find module 'typescript'`; `yarn tsc --noEmit` reported `Command "tsc" not found`. These are observed environment facts, not passing-test evidence.
- No live Figma or FigJam editor smoke test was performed on 2026-11-06. Runtime behavior remains unverified. Evidence: `docs/agent-engineering-guide.md:520-530` records the same verification boundary in the committed audit (2026-08-22).

## [live] Recorded release history

- The repository records version 21 as published on 2026-03-01. Evidence: `releases/figma-release.md:1-6` (file committed 2026-03-01).
- The current `dev` snapshot contains later v22 candidate work, but no committed record establishes that it was published. Evidence: `git` history at `1e608671a102f94e25b7210dcb208f0fe2a6ebd2` (2026-10-23) and `releases/figma-release.md`.

## [unknown] Figma publish, runtime, and device status

- Current Figma listing/version, publish state after v21, live-editor behavior, and device behavior were not checked on 2026-11-06. Do not describe them as verified or live from this record.
- The manifest records `networkAccess.allowedDomains: ["none"]`, but that is a committed configuration claim, not a runtime or device verification. Evidence: `manifest.json` and `README.md:116-120` (snapshot reviewed 2026-11-06).

## [planned] Engineering quality work

- The committed engineering guide calls for parser/suggestion parity tests, mocked-Figma action tests, a broader quality gate, and editor smoke tests across supported contexts. Evidence: `docs/agent-engineering-guide.md:182-205,420-468` (committed 2026-08-22).
- The guide also identifies partial mutation on runtime failure and limited regression coverage as release risks. Evidence: `docs/agent-engineering-guide.md:207-228,245-275` (committed 2026-08-22).

## [held] Release holds

- Publishing the v22 candidate work currently on `dev` (grammar rewrite, smoke coverage, `each` fixes) is held pending the owner's explicit GTG under the agreed release model of 2026-10-11: `main` is published-state only and moves only when a release actually publishes; every release is a deliberate, verified batch with a version name, release notes, and a ledger entry. Provenance: owner-directed release model agreed 2026-10-11, recorded in project task records outside this repository.
- The engineering guide's phase 0-3 hardening roadmap is parked under the owner's "harden later" ruling of 2026-09-19, and the big architectural pieces (custom palette, primitives, node editor, non-destructive engine) are explicitly parked, not started. Evidence: `docs/agent-engineering-guide.md`; ruling provenance in project task records outside this repository.

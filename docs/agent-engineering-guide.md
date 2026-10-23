# Hotkey Engineering Guide

> Agent-facing architecture, risk register, and improvement plan.
>
> Audited: 2026-07-13. Baseline: `main` at `dbf0b80`. The working tree also
> contained uncommitted loop and node-creation work; see
> [Snapshot caveat](#14-snapshot-caveat-and-agent-discipline).

## 1. Purpose

This is the durable starting point for humans and LLM agents changing Hotkey.
It records the product contract, runtime model, invariants, known failure modes,
verification gaps, and prioritized roadmap. Read it before changing command
syntax, execution, suggestions, selection behavior, node support, or releases.

This document is intentionally not a complete command reference:

- `README.md` is the user/developer overview.
- `src/plugin/set-properties/prop-list.ts` is the runtime command source of truth.
- `docs/generated/commands.json` is the generated consumer-facing catalog.
- `docs/website-brief.md`, if committed and refreshed, is product/marketing context.

## 2. Product contract

Hotkey is a keyboard-first Figma/FigJam Quick Actions plugin. A user selects
nodes, types compact commands, and Hotkey applies those commands from left to
right. Its value is compressing repetitive property edits and selection
operations into a reusable command language.

Primary users are Figma power users, product designers, and design-system teams.
Primary jobs are batch resizing, positioning, styling, selection traversal,
auto-layout manipulation, text changes, and repetitive cleanup. Figma design
work is the primary environment; FigJam support is partial and command-specific.

Core experience:

1. Select nodes when a command requires a selection.
2. Launch Hotkey through Quick Actions.
3. Enter a chain such as `x100 y120 w320 h64 r8 fFF6600`.
4. Use contextual suggestions and recent command history.
5. Execute immediately; there is no production custom panel.

Non-goals unless explicitly reconsidered:

- A visual property inspector or dashboard.
- An AI design generator or code generator.
- A network-backed service. The manifest deliberately allows no domains.
- A beginner-first replacement for Figma's native controls.

Unresolved product context: the creator has not yet recorded Hotkey's three-word
brand personality, visual references/anti-references, or formal accessibility
target. Do not infer those from code. Capture them in `.impeccable.md` before
designing a real UI; WCAG 2.2 AA is the recommended default.

## 3. Repository map

| Area | Responsibility | Notes |
|---|---|---|
| `manifest.json` | Figma entry points, editors, parameter, permissions | Parameter-only runtime; currently still declares an unused UI |
| `src/plugin/controller.ts` | Parameter suggestions and run lifecycle | Always closes after `setProperties` resolves |
| `src/plugin/set-properties/parse-params.ts` | Tokenization, classification, value validation | Classification order is behavior |
| `src/plugin/set-properties/set-properties.ts` | Sequential execution, loop handling, history, notifications | Mutable selection is intentional |
| `src/plugin/set-properties/prop-list.ts` | Command metadata and actions | De facto command schema/source of truth |
| `src/plugin/set-properties/param-routing.ts` | Maps parsed shortcuts to actions | Currently performs repeated flatten/scan work |
| `src/plugin/set-properties/suggestions.ts` | Autocomplete, recovery, intent ranking | Large and duplicates parts of parser grammar |
| `src/plugin/set-properties/modifiers/` | Scalar, range, sequence, and scale parsing/execution | Pure math should be extracted and tested |
| `src/plugin/set-properties/utils/` | Figma node mutations by command family | Main Figma API boundary |
| `src/plugin/set-properties/history.ts` | Eight most recent unique command sets | Stored locally in `clientStorage` |
| `scripts/generate-commands.cjs` | Static command-catalog generation | Scrapes source literals rather than runtime metadata |
| `src/app/` | Unwired React rectangle-creator template | Dead production surface; remove or deliberately rebuild |
| `releases/figma-release.md` | Last published Figma version | Main is ahead of the recorded v21 release |
| `.github/workflows/ci.yml` | Pull-request build | Does not yet provide a meaningful quality gate |

Scale at audit time: about 10,000 TypeScript/TSX lines, 87 tracked files, and no
test files. The largest hotspots are `prop-list.ts` (~2,200 lines),
`suggestions.ts` (~1,000), paint utilities (~470 each), and the text command
implementation (~386).

## 4. Runtime and data flow

```text
Figma parameter input
  -> controller.getSuggestions(query)
  -> suggestion strings shown by Figma

Figma run(parameters)
  -> parseParameters(parameters)
     -> tokenize while preserving quotes and parentheses
     -> split compact origin prefixes
     -> classify tokens in precedence order
  -> executeParsedParams(parsed AST-like records)
     -> read current selection for each token
     -> dispatch origin / loop / modifier / text / registry action
     -> selection-changing actions feed later tokens
  -> addHistory(parsed params)
  -> notify success or outer error
  -> close plugin
```

Normal commands route through the flattened `propList` and execute action
callbacks. Modifier commands use command metadata to obtain current values and
apply scalar/range/sequence math. Text commands have a separate grammar and must
load fonts before mutation. Loop commands recursively parse and execute their
bodies while changing the current selection per iteration.

## 5. Invariants: preserve these

### 5.1 Command registry

`propList` is the effective schema shared by parsing, routing, modifiers,
suggestions, and generated docs. A command change is incomplete unless these
stay aligned:

- Globally unique executable shortcut.
- Correct `hasValue` behavior and value grammar.
- `supportsModifiers`, `supportsOrigin`, and current-value accessor behavior.
- `requiresSelection`; creation commands are the current exception.
- Action semantics, supported node types, unit, examples, and help copy.
- Generated catalog representation.

Groups may share visible labels/shortcuts with executable commands because the
current flattener skips groups, but this is fragile. New work should use stable
path-based group IDs and validate executable shortcut uniqueness.

### 5.2 Parser precedence

Token classification order is:

1. origin modifier;
2. text command;
3. `each` command;
4. scoped scale or general modifier;
5. ordinary registry command.

Changing the order or adding a prefix can shadow existing syntax. Longest
ordinary shortcuts are matched first. Parser, suggestion splitting, error
recovery, and documentation examples must accept the same language.

### 5.3 Left-to-right mutable selection

Commands execute sequentially against `figma.currentPage.selection` as it exists
at that token. Selection traversal, filtering, creation, duplication, wrapping,
splitting, and loops intentionally affect later commands. Do not capture one
global selection snapshot for an entire run.

Where a command does need stability, snapshot locally and state how the final
selection is constructed. Deduplicate by active node ID and exclude removed
nodes.

### 5.4 Geometry and hierarchy

- Reparenting must preserve absolute/world position unless the command promises
  a new layout-relative position.
- Auto-layout children cannot be treated like freely positioned nodes.
- Origin-aware resize/scale must preserve the requested anchor; simple `x`/`y`
  correction is not reliable for rotated nodes or auto-layout children.
- Parent-relative percentages need a measurable parent and a defined failure
  for top-level nodes.
- Modifier ordering is derived from sibling layer order grouped by parent, not
  necessarily the raw user selection order.

### 5.5 Text

Load every font used by a text node/range before changing characters or text
format. Mixed fonts, missing fonts, selected text ranges, and unsupported
non-text nodes require explicit behavior and tests.

### 5.6 Editor and node capability

Manifest availability does not imply universal command support. Figma, FigJam,
and Slides expose different creation APIs and node types. Every action needs an
explicit capability decision: supported, skipped with feedback, or rejected
before mutation. Avoid broad `(figma as any)` dispatch without a validated
editor/method/parent matrix.

### 5.7 Privacy

The plugin has no network access and stores only a capped local command history.
Preserve this strong default. Any future network or telemetry proposal requires
an explicit product/privacy decision, manifest change, disclosure, and review.

## 6. How to change or add a command

Use this sequence; do not patch only the most visible file.

1. Define user intent, shortcut, examples, units, node/editor support, selection
   behavior, and partial-failure behavior.
2. Check all existing executable and group prefixes for ambiguity.
3. Add/update the `PropItem` definition and action in `prop-list.ts` or a focused
   utility. Keep complex Figma mutation outside the registry.
4. If the value is not covered by the shared grammar, extend one shared parser
   abstraction. Until that refactor exists, update both `parse-params.ts` and
   `suggestions.ts` deliberately.
5. If modifiers or origin are supported, provide a safe current-value reader and
   test scalar, range, progression, zero, negative, mixed-selection, rotated,
   and auto-layout cases as applicable.
6. Decide whether the command can start with an empty selection and set
   `requiresSelection` explicitly.
7. Verify chained execution before and after selection-changing commands.
8. Add parser/suggestion parity tests and mocked-Figma action tests.
9. Regenerate `docs/generated/commands.json`; inspect count, syntax, flags,
   examples, and unrelated drift.
10. Update README only for grammar or major-family changes. Do not maintain a
    second hand-written exhaustive catalog.
11. Run the quality gate in [Verification target](#verification-target).

## 7. Error and mutation contract

Current behavior is not atomic. Parsing occurs before execution, but a command
chain mutates the document token by token. If a later runtime action fails,
earlier mutations remain, the outer catch shows only the error, and the run is
not added to history. Some utilities skip unsupported nodes while others throw
on the first unsupported node.

Until redesigned, agents must:

- Never describe a run as transactional or rolled back.
- Prefer validating the entire command and selection capability before mutation.
- Avoid catch-and-ignore behavior that hides which nodes changed.
- Report applied, skipped, and failed work consistently.
- Preserve the final selection intentionally on both success and partial failure.

Target contract: parser -> planner/preflight -> executor returning a structured
`ExecutionResult` (`applied`, `skipped`, `errors`, `selection`, `historySafe`) ->
one presentation/history layer. True rollback may be impossible with the Figma
API; a clear preflighted partial-success model is acceptable if documented.

## 8. Audit score and risk register

The UI audit is constrained because the production product has no custom UI.
Scores below include the dead bundled template where relevant.

| Dimension | Score | Key finding |
|---|---:|---|
| Accessibility | 2/4 | Production uses native parameter UI, but bundled template lacks alt text/label and removes outlines |
| Performance | 1/4 | Unbounded loops/duplication can freeze Figma; registry/parser work is repeatedly rebuilt |
| Responsive design | 2/4 | Native parameter UI avoids custom layout risk; dead template is fixed/minimal and unverified |
| Theming | 1/4 | Dead template hard-codes colors and does not use Figma theme tokens |
| Anti-patterns | 3/4 | No AI-styled production UI; template is generic and misleading rather than visually excessive |
| **Total** | **9/20 (Poor)** | **Reliability and dead UI debt dominate** |

Severity totals in this audit: **P0: 2, P1: 7, P2: 10, P3: 4**. Counts group
closely related instances into systemic findings.

### P0 — block expansion work

1. **No regression suite for a complex command language.** There are no tests
   for parsing, ranges, modifiers, selection sequencing, geometry, editor
   capability, suggestions, or generated examples. History contains repeated
   fixes in exactly these areas.
2. **Unbounded document work.** `each` eagerly materializes any integer range and
   recursively executes without a depth/work budget. `dup` accepts an unbounded
   count. A single command can freeze the plugin or create an enormous document.

### P1 — fix before a confident release

1. **Partial mutation on runtime failure.** See [Error and mutation contract](#error-and-mutation-contract).
2. **Typecheck is broken and strictness is weak.** `yarn tsc --noEmit` currently
   fails on `@figma/plugin-typings`/DOM declarations (`console`, `fetch`) before
   providing a clean project gate. `noImplicitAny` is disabled.
3. **CI only proves webpack can bundle.** It runs on pull requests only, uses old
   actions, does not pin Node, does not enforce the lockfile, and omits tests,
   typecheck, lint, formatting, catalog drift, security, and artifact checks.
4. **Origin math is unsafe in complex layouts.** Anchor preservation by local
   `x`/`y` correction needs world-transform handling or narrower supported cases.
5. **Creation capabilities are dynamically guessed.** Current WIP dispatches
   methods through `any`, changes pages for page creation, and lacks an explicit
   editor/node/parent matrix.
6. **Parser and suggestions duplicate grammar.** Unit, numeric, axis, range, and
   special-command validation can drift and have done so historically.
7. **Generated docs can drift silently.** Generation includes a volatile
   timestamp, statically scrapes literals, is not CI-checked, and does not prove
   that generated examples parse or execute.

### P2 — next engineering pass

1. Remove the unused React UI, `ui` manifest entry, React dependencies, and UI
   webpack pipeline, or intentionally build a real accessible product surface.
   The current build emits redundant ~142 KiB UI artifacts.
2. Replace repeated flatten/sort/regex scans with one immutable validated command
   index and direct `flatCommands[param]` dispatch.
3. Parse `each` once into the shared AST; do not duplicate its parser in the
   executor. Stream bounded ranges instead of allocating arrays.
4. Normalize caught `unknown` values into stable error codes/messages rather
   than assuming `.message`.
5. Introduce a typed command value schema (`valueKind`, allowed units, validator,
   formatter) shared by parser, suggestions, docs, and modifiers.
6. Cache recent history/suggestion indexes and guard asynchronous suggestion
   results from stale requests. Replace `findIndex` deduplication with `Set`/`Map`.
7. Validate command/group IDs and executable shortcut uniqueness at build time.
8. Replace the obscure `flattenCommands` use of `arguments[1]` with an explicit
   index builder.
9. Convert README's machine-specific absolute links to repository-relative links
   and remove hand-maintained exhaustive details that duplicate generated docs.
10. Refresh or snapshot-label `docs/website-brief.md`; it says 136 commands while
    HEAD has 144 and current WIP has 162.

### P3 — cleanup and product operations

1. Replace template `package.json` name, description, license, and version policy
   with Hotkey metadata while preserving required upstream attribution.
2. Upgrade the staged 2022-era TypeScript/build/format tooling after tests exist.
3. Remove or gate runtime debug logs; version and validate stored history so
   corrupt/old entries degrade predictably.
4. Normalize `manifest.json` formatting and improve parameter copy after product
   tone is recorded.

### Positive findings to retain

- Network access is disabled and there is no secret/network code.
- Production interaction uses Figma's native Quick Actions parameter UI, which
  keeps the main workflow fast and keyboard-oriented.
- Command metadata is centralized enough to support a true schema with modest
  refactoring.
- Utilities are already separated by command family, and recent commits use
  substantially better Conventional Commit messages.
- Unsupported-node checks, font loading, origin concepts, intent-ranked
  suggestions, and generated command documentation show strong product depth.
- Production webpack build passes at the audited snapshot.

## 9. Target architecture

Move incrementally; do not rewrite the command language in one change.

```text
typed CommandDefinition registry
  -> build-time schema/shortcut/example validator
  -> shared tokenizer + parser producing Command AST
  -> planner/preflight with editor/node/work-budget checks
  -> executor over a narrow Figma adapter
  -> structured ExecutionResult
  -> notification + history presentation

same registry/grammar
  -> suggestion index
  -> generated command catalog
```

Recommended boundaries:

- **Pure language core:** tokenization, AST, units, range/progression math, loop
  expansion, validation, formatting. No global `figma` access.
- **Command schema:** exact syntax/capabilities/examples and direct handler IDs.
- **Planner:** resolves selection and capability without mutating.
- **Figma adapter/actions:** node reads/writes, fonts, hierarchy, viewport, storage.
- **Presentation:** one consistent success/skip/failure notification policy.

## 10. Prioritized roadmap

### Phase 0 — protect users and WIP

1. Add maximum loop depth, iteration count, total operations, duplicate/create
   count, and selection fanout. Reject unsafe input before mutation.
2. Add focused regression tests for the uncommitted `each` and creation work
   before merging it; preserve the current dirty files as user-owned WIP.
3. Document/implement preflight and structured partial-success reporting.

Exit condition: no command can perform unbounded work; critical WIP behavior is
covered; failure semantics are honest.

### Phase 1 — establish a quality gate

1. Fix TypeScript lib configuration and add `typecheck`.
2. Add a modern test runner and pure parser/modifier/range/loop tests.
3. Add mocked-Figma integration tests for representative command families and
   mutable-selection chains.
4. Add ESLint and non-mutating Prettier checks.
5. Make catalog generation deterministic and add catalog drift/example tests.
6. Expand CI to pushes and PRs with pinned Node, frozen lockfile, typecheck,
   lint/format, tests, docs check, production build, and bundle ceiling.

Exit condition: a grammar or behavior regression cannot merge silently.

### Phase 2 — unify the language engine

1. Create one immutable validated command registry/index.
2. Extract shared tokenizer/parser/AST and typed value schemas.
3. Make suggestions and docs consume the same grammar.
4. Replace regex scanning with direct dispatch.
5. Add malformed-input property/fuzz tests and golden parser/suggestion parity
   tests.

Exit condition: syntax is defined once and consumed everywhere.

### Phase 3 — harden Figma behavior

1. Add an explicit editor/node/parent capability matrix.
2. Correct or constrain origin behavior for rotation and auto-layout.
3. Test hierarchy/world-position invariants for dock, shift, wrap, swap,
   duplicate, split, create, and selection traversal.
4. Test mixed fonts, missing fonts, selected ranges, paint stacks, mixed
   properties, removed nodes, and large selections.

Exit condition: supported contexts are documented and representative editor
smoke tests pass.

### Phase 4 — remove product and release ambiguity

1. Decide whether Hotkey remains parameter-only. Prefer removing the dead React
   UI unless a deliberate, researched UI is planned.
2. Correct package metadata/license attribution and upgrade tooling in tested
   increments.
3. Create a compact support matrix, troubleshooting section, changelog/release
   checklist, and privacy statement (these may remain sections in this guide).
4. Clarify versioning: `releases/figma-release.md` records v21 on 2026-03-01,
   while main contains later features and current WIP. Publish only from a clean,
   verified commit and record the exact commit/version/date.

Exit condition: repository, Figma listing, docs, and release record describe the
same product.

### Phase 5 — expand capability deliberately

Only after Phases 0–3, use product evidence to prioritize new commands. Favor
workflows that compound the keyboard-first model: reusable macros/presets,
discoverable command recipes, dry-run/preview for destructive chains, better
capability-aware suggestions, and import/export of local presets. Do not add
syntax that cannot be expressed by the shared schema and regression suite.

## 11. Verification target

Today:

```bash
yarn build
yarn tsc --noEmit  # known to fail on Figma typings / DOM conflicts
git diff --check
```

Do not run `yarn prettier:format` as a check: it rewrites broad globs. Do not
regenerate the command catalog casually: it changes `generatedAt` even when
semantic content is unchanged.

Target quality gate after Phase 1:

```bash
yarn install --frozen-lockfile
yarn format:check
yarn lint
yarn typecheck
yarn test
yarn docs:check
yarn build
```

Also perform manual/editor smoke tests for any affected family. Minimum matrix:

- single and mixed selections;
- selection-changing command followed by a property command;
- top-level, nested, auto-layout, rotated, and removed-node cases;
- supported and unsupported Figma/FigJam node types;
- malformed/partial suggestions and invalid input;
- text with mixed/missing fonts;
- range/progression zero and boundary cases;
- failure after an earlier command has mutated state.

## 12. Release protocol

Until automated, use this checklist:

1. Start from a clean tree and identify the exact target commit.
2. Reconcile generated catalog and user docs with runtime behavior.
3. Run all available automated checks and record known omissions.
4. Smoke-test affected commands in every claimed editor/context.
5. Review manifest permissions, bundle output, and package metadata.
6. Publish to Figma.
7. Update `releases/figma-release.md` with version, date, and preferably commit.
8. Add release notes/changelog entries describing user-visible behavior and
   compatibility constraints.

Do not treat Git tags v1–v21 as a perfectly linear development chronology; some
early release markers were reconstructed later. Do not rewrite shared history.

## 13. History lessons

The repository began as a Figma React template in 2019; Hotkey product work came
later. Preserve upstream license/attribution while removing template identity
from active product metadata.

Recurring historical bug clusters are stronger evidence than isolated TODOs:

- suggestion crashes and invalid-chain recovery;
- parser/suggestion token mismatch;
- selection ordering and chained selection state;
- modifier validation, ranges, and division by zero;
- positioning in auto-layout and across parents;
- swap/hierarchy edge cases;
- partial support across node types.

These clusters should become named regression suites. An abandoned
`swap-colours` branch exists; do not assume it is roadmap-approved or safe to
merge. Mine it only after an owner decision.

## 14. Snapshot caveat and agent discipline

At audit time, `main` matched `origin/main` at `dbf0b80`, but the working tree
contained substantial uncommitted user work:

- loop parsing/execution (`each`, ranges, variables, nesting);
- selection-free node creation across editor-specific APIs;
- updated suggestions, README, and generated command catalog;
- an untracked website brief.

Future agents must inspect `git status`, unstaged/staged diffs, and recent history
before editing. Never overwrite, reformat, stage, or fold unrelated user WIP into
another change. Generated catalog changes belong with the feature that changes
the command registry, not with this guide.

Commit discipline:

- One behavior or documentation intent per commit.
- Separate refactors from behavior, tests from unrelated features, CI from docs,
  and generated files with the source change that requires them.
- Use Conventional Commits in imperative mood.
- After every committable change, provide the user an exact subject and body.

## 15. Current verification record

Audit performed read-only except for adding this guide.

- `yarn build`: passed; webpack emitted approximately 142 KiB each for
  `code.js`, `ui.js`, and inlined `ui.html`.
- `yarn tsc --noEmit`: failed on declaration conflicts between current Figma
  typings and DOM libs (`console` augmentation and duplicate `fetch`).
- Test discovery: no test/spec files found.
- `git diff --check`: passed before this document was added.
- Security scan by inspection: no network calls or secrets found; manifest
  denies network access.

The audit did not claim runtime correctness inside Figma/FigJam because no
automated harness or live editor smoke test was available.

# Hotkey (Figma/FigJam Plugin)

Hotkey is a command-driven Figma plugin for fast property edits on selected nodes.
It runs through plugin parameters (Quick Actions), parses compact shortcuts, and applies them in sequence.

## What It Does

- Applies one or more commands to the current selection in a single run.
- Supports Figma and FigJam (`editorType: ["figma", "figjam"]`).
- Provides command suggestions while typing parameters.
- Stores recent command sets in `clientStorage` and surfaces them as default suggestions.

## Setup

1. Install dependencies:

```bash
yarn
```

2. Build once:

```bash
yarn build
```

Or build in watch mode during development:

```bash
yarn build:watch
```

3. In Figma: `Plugins` -> `Development` -> `Import plugin from manifest...` and choose `manifest.json`.

## How To Use

1. Select one or more nodes in the canvas.
2. Run the plugin (`Hotkey`) from Quick Actions or Development Plugins.
3. Enter commands in the `Property` parameter field.
4. You can chain commands with spaces.

Example:

```text
x100 y120 w320 h64 r8 fFF6600
```

This sets X/Y, width/height, corner radius, and fill color in one execution.

## Command Format

- Pattern: `<shortcut><value>`
- Multiple commands: space-separated
- Value is optional for action-only shortcuts (for example `clip`, `swapx`)
- Numeric adjustments use modifier operators only.
- Global numeric operators (supported for `h`, `w`, `wh`, `x`, `y`, `p`, `pl`, `pr`, `pt`, `pb`, `px`, `py`, `r`, `rt`, `rtl`, `rtr`, `rb`, `rbl`, `rbr`, `rl`, `rr`, `sw`, `swl`, `swr`, `swt`, `swb`, `swx`, `swy`, `gap`, `gapx`, `gapy`, `rot`, `op`, `sc:w`, `sc:h`, `ls`, `lh`): `+`, `-`, `*`, `/`
- Flow/sequential operator variants (supported on the same numeric shortcuts): `++`, `--`, `**`, `//`
- Sequential operators support progression modifiers:
  - `+n` or `-n` for arithmetic progression (for example `++h24+2` gives cumulative `+24, +50, +78, ...`)
  - `*n` or `/n` for geometric progression (for example `++h24/2` gives `+24, +12, +6, ...`)
- `++` is cumulative for additive flow (for example `++h40/2` gives `+40, +60, +70, ...`).
- Double operators use cumulative flow with their own operator semantics: `++` cumulative add, `--` cumulative subtract, `**` cumulative multiply, `//` cumulative divide.
- Range operands are supported with `start..end` (for example `h1..20`, `+h1..24`, `++h20..40`, `w10..100`)
- Double operators also support mixed range expressions (for example `++h20-20..40`, `++h10..20-5..15`, `**w1..2*1.2..1.8`).
- Origin tokens are standalone modifiers (`tl:`, `t:`, `tr:`, `l:`, `c:`, `r:`, `bl:`, `b:`, `br:`) that apply to following size/scale commands in the same input.
- Fill color supports `1/2/3/4/6/8` hex lengths with or without `#` (for example `f#F`, `f#FA`, `f#FFAA00`, `fFFAA0080`)
- Fill targets are optional: `f<color>` (all fills), `f2<color>` (2nd), `f1-3<color>` (range), `f3+<color>` (3rd onward), `f-2<color>` (up to 2nd)
- Optional alpha can be appended as percent or decimal: `@10`, `@10%`, `@0.1` (for example `f#1A73E8@10`)
- Fill options can be appended using `:option` tokens: blend (`:m`, `:screen`, `:overlay`, etc.) and visibility (`:on`, `:off`)
- Add/insert/delete fills: `fa<color>`, `fi<index><color>`, `fd<target>` (for example `fa#000@10:m`, `fi2#1A73E8:off`, `fd2+`)
- Stroke color supports the same `1/2/3/4/6/8` hex, target selectors, `@alpha`, and `:option` tokens
- Add/insert/delete strokes: `sa<color>`, `si<index><color>`, `sd<target>` (for example `sa#000@10:m`, `si2#1A73E8:off`, `sd2+`)
- Some text spacing commands support units (`px`, `%`) such as `ls2px`, `lh140%`
- Size commands support `%` values (`w50%`, `h200%`) and dedicated fit/fill/hug commands (`fit`, `fitw`, `fith`, `fill`, `fillw`, `fillh`, `hug`, `hugw`, `hugh`)

Notes:

- `sc` commands are axis-targeted (`sc:w200`, `sc:h120`), including modifier forms (`sc:*w2`, `sc:+h24`).
- Division operators cannot use `0` (including ranges that touch/cross `0`, for example `/h10..0`).
- Invalid commands fail with `Invalid Command: ...`.

## Command Families

Commands are defined in [`src/plugin/set-properties/prop-list.ts`](/Users/navaneethvenu/Documents/Projects/figma-utils/src/plugin/set-properties/prop-list.ts).

Main families:

- Position: `x`, `y`, dock in/out (`dl`, `dtr`, `DBL`, ...)
- Size: `w`, `h`, `wh`, `sc:w`, `sc:h`, `fit`, `fitw`, `fith`, `fill`, `fillw`, `fillh`, `hug`, `hugw`, `hugh`
- Radius: `r`, `rt`, `rb`, `rtl`, `rbr`, ...
- Padding: `p`, `px`, `py`, `pt`, `pr`, ...
- Stroke: width (`sw`, `swl`, `swy`, ...), align (`sai`, `sac`, `sao`)
- Selection tools: quick select (`selr`/`sell`/`selt`/`selb`), traversal (`root`/`leaf`/`selp`/`selc`/`selns`/`selps`/`seli`), filter (`fs*`), exclude (`es*`)
- Color: fill/stroke replace/add/insert/delete (`f`, `fa`, `fi`, `fd`, `s`, `sa`, `si`, `sd`)
- Constraints: `c`, `cc`, `cs`, `cx*`, `cy*`
- Auto layout behavior: toggles (`ax`, `ay`), smart sizing (`aa`), apply auto layout (`al`, `alx`, `aly`)
- Auto layout spacing: `gap`, `gapx`, `gapy`
- Text spacing: `ls`, `lh` (set), `lsp`/`lspx` and `lhp`/`lhpx` (unit conversion)
- Transform/appearance: `rot`, `op`
- Misc: `clip`, `count`, `countn`, `swap`, `swapx`, `swapy`, `wf`, `dup`

## Project Structure

- Plugin entry: [`src/plugin/controller.ts`](/Users/navaneethvenu/Documents/Projects/figma-utils/src/plugin/controller.ts)
- Command parsing: [`src/plugin/set-properties/parse-params.ts`](/Users/navaneethvenu/Documents/Projects/figma-utils/src/plugin/set-properties/parse-params.ts)
- Command routing: [`src/plugin/set-properties/param-routing.ts`](/Users/navaneethvenu/Documents/Projects/figma-utils/src/plugin/set-properties/param-routing.ts)
- Command catalog: [`src/plugin/set-properties/prop-list.ts`](/Users/navaneethvenu/Documents/Projects/figma-utils/src/plugin/set-properties/prop-list.ts)
- Suggestions/history: [`src/plugin/set-properties/suggestions.ts`](/Users/navaneethvenu/Documents/Projects/figma-utils/src/plugin/set-properties/suggestions.ts), [`src/plugin/set-properties/history.ts`](/Users/navaneethvenu/Documents/Projects/figma-utils/src/plugin/set-properties/history.ts)

## Development Notes

- Runtime logic is in the plugin code (`src/plugin/**`), not in the React UI template.
- Manifest uses `networkAccess.allowedDomains: ["none"]`.
- Formatting script: `yarn prettier:format`

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
- Value is optional for action-only shortcuts (for example `clip`, `fit`, `swapx`)
- Numeric commands may allow `+`/`-` variants depending on shortcut
- Fill color uses hex-like values with or without `#` (for example `f#FFAA00`, `fF80`)
- Some text spacing commands support units (`px`, `%`) such as `ls2px`, `lh140%`

Notes:

- `sc` uses scale factors, not percentages (`sc2` = 2x, `sc0.5` = 0.5x).
- Invalid commands fail with `Invalid Command: ...`.

## Command Families

Commands are defined in [`src/plugin/set-properties/prop-list.ts`](/Users/navaneethvenu/Documents/Projects/figma-utils/src/plugin/set-properties/prop-list.ts).

Main families:

- Position: `x`, `y`, `+x`, `-y`, dock in/out (`dl`, `dtr`, `DBL`, ...)
- Size: `w`, `h`, `+w`, `-h`, `s`, `sc`, `scw`, `sch`, `fit`, `fitw`, `fith`
- Radius: `r`, `rt`, `rb`, `rtl`, `rbr`, ...
- Padding: `p`, `px`, `py`, `pt`, `pr`, ...
- Stroke: width (`st`, `stl`, `sty`, ...), align (`sti`, `stc`, `sto`)
- Selection tools: quick select (`selr`/`sell`/`selt`/`selb`), traversal (`root`/`leaf`/`selp`/`selc`/`selns`/`selps`/`seli`), filter (`fs*`), exclude (`es*`)
- Color: fill replace (`f<hex>`)
- Constraints: `c`, `cc`, `cs`, `cx*`, `cy*`
- Auto layout behavior: `ah`, `af`, `afi`, toggles (`ax`, `ay`), smart (`aa`)
- Auto layout spacing: `gap`, `gapx`, `gapy`
- Text spacing: `ls`, `lh` (set), `lsp`/`lspx` and `lhp`/`lhpx` (unit conversion)
- Transform/appearance: `rot`, `op`
- Misc: `clip`, `count`, `countn`, `swap`, `swapx`, `swapy`, `wf`

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

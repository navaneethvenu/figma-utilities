# Hotkey Plugin Website Brief

## Purpose of this document

This brief explains the plugin in plain English for people who need to write copy, design a marketing website, prepare product messaging, or scope a launch without needing further clarification from the plugin author.

It is based on the current codebase of the plugin in this repository, not on hypothetical roadmap ideas.

## Product name

**Hotkey**

## One-line definition

Hotkey is a command-driven Figma and FigJam plugin that lets users edit selected layers by typing short property commands instead of clicking through panels one setting at a time.

## Short product summary

Hotkey is a speed tool for people working inside Figma. It turns compact text commands like `x100 y120 w320 h64 r8 fFF6600` into actual edits on the selected objects. Instead of opening multiple side panels and setting each property manually, the user runs the plugin, types commands, and Hotkey applies them in sequence to the current selection.

This is not a visual design plugin, not a website builder, and not a code generator. It is a keyboard-first productivity plugin for fast layer manipulation.

## What the plugin fundamentally is

At its core, Hotkey is:

- A parser for short commands
- A router that maps those commands to Figma node operations
- A batch editor that applies many commands in one run
- A productivity tool for repetitive property changes
- A Quick Actions plugin, not a custom in-canvas interface

The plugin is built around one idea: the user should be able to select objects and type a compact instruction string to update them immediately.

## What the plugin is not

Hotkey is not:

- A general beginner tutorial tool
- A visual property inspector
- A drag-and-drop layout builder
- A plugin that creates websites or code from designs
- A plugin that analyzes files using AI
- A plugin that fetches internet data or external assets
- A collaboration, commenting, prototyping, or handoff platform
- A replacement for Figma itself

It does not invent designs. It edits what is already selected.

## Primary audience

The plugin is primarily for:

- Figma power users
- Designers who work quickly from the keyboard
- Design system teams making repeated property changes
- People doing cleanup, normalization, spacing, resizing, and batch layer edits
- Users comfortable learning short commands

It is less naturally suited to:

- First-time Figma users
- People who expect a button-heavy visual UI
- People who want a plugin to explain design concepts to them
- Users who do not want to memorize or reuse shorthand commands

## Core value proposition

The plugin saves time by compressing many manual edits into a single typed action.

Instead of:

1. Selecting layers
2. Opening property controls
3. Changing width
4. Changing height
5. Changing radius
6. Changing fill
7. Repeating this across several objects

The user can run Hotkey once and type a single command string.

## Where the plugin works

### Supported host applications

The manifest explicitly allows:

- Figma
- FigJam

### Actual support reality

The plugin is technically available in both editors, but support is much stronger in standard Figma design workflows than in FigJam workflows.

That distinction is important:

- **Figma support is the core use case**
- **FigJam support exists, but it is partial**

### How the plugin is launched

Hotkey runs through Figma plugin parameters in Quick Actions. The manifest defines one required parameter:

- `Property`

The main user flow is:

1. Select one or more nodes
2. Run the plugin from Quick Actions or Development Plugins
3. Type commands into the `Property` field
4. Press enter to execute

### UI model

Although the plugin bundle includes a React UI scaffold, that UI is not wired into the actual runtime flow. In practical terms, Hotkey behaves as a parameter-driven command plugin, not as a custom floating interface.

This matters for website messaging:

- The website should not present the product like a visual dashboard plugin
- It should be presented as a command-input productivity tool

## How the plugin works in practice

Hotkey reads the selected nodes on the current page and applies commands from left to right.

Example:

```text
x100 y120 w320 h64 r8 fFF6600
```

This means:

- Set X to 100
- Set Y to 120
- Set width to 320
- Set height to 64
- Set corner radius to 8
- Replace fill color with `#FF6600`

The plugin can also apply multiple operations across multiple selected nodes, not just one node.

## Main interaction model

The plugin is built around these ideas:

- Selection first
- Command input second
- Execution immediately after parsing
- No persistent custom panel
- No multi-step wizard

This makes it fast, but it also means the plugin is optimized for users who already know what they want to do.

## Command system overview

The plugin currently exposes **136 commands** organized into command families.

Main families:

- Position
- Size
- Corner radius
- Padding
- Stroke width and stroke alignment
- Selection tools
- Fill and stroke color operations
- Constraints
- Auto-layout behavior
- Text spacing
- Miscellaneous actions such as clip, count, swap, wrap, duplicate, rotation, and opacity

## Major feature coverage

### 1. Position and docking

Hotkey can:

- Set X and Y positions
- Set both coordinates together
- Dock nodes inside a parent container
- Dock nodes outside a parent container

Supported shortcuts include:

- `x`, `y`, `xy`
- `dl`, `dr`, `dt`, `dtl`, `dtr`, `db`, `dbl`, `dbr`
- `DL`, `DR`, `DT`, `DTL`, `DTR`, `DB`, `DBL`, `DBR`

What this is good for:

- Snapping objects to edges using commands
- Repositioning objects numerically
- Moving many selected items quickly

Important limitations:

- Docking is not universally supported across all node types
- Docking explicitly excludes many FigJam-style nodes
- Docking relies on parent/constraint context, so it is not equally meaningful on all selections

### 2. Size and scaling

Hotkey can:

- Set width
- Set height
- Set both width and height
- Scale to a target width or height
- Fit to parent
- Set auto-layout sizing behavior to fill or hug

Supported shortcuts include:

- `w`, `h`, `wh`
- `sc:w`, `sc:h`
- `fit`
- `fill`
- `hug`

Important details:

- Width and height accept numeric values
- Width and height also support `%` values
- Percent sizing resolves against the parent dimension
- Fit/fill/hug can target width, height, or both

Important limitations:

- Fit to parent does not work on top-level nodes with no measurable parent frame
- Size operations exclude some newer or specialized node types
- FigJam nodes are broadly excluded from size-setting utilities
- `fill` and `hug` depend on layout sizing support in the selected node

### 3. Transform origin support

One of the more advanced features is transform origin control for resizing and scaling.

Origin tokens include:

- `tl:`
- `t:`
- `tr:`
- `l:`
- `c:`
- `r:`
- `bl:`
- `b:`
- `br:`

This lets the user resize relative to top-left, center, right edge, bottom edge, and so on.

Example idea:

```text
c:w200
```

This means width changes while keeping the object centered around its midpoint instead of simply growing from the default edge.

This is a strong differentiator because it makes typed resizing more layout-aware and more controllable.

### 4. Corner radius

Hotkey supports:

- Full corner radius
- Top radius
- Bottom radius
- Left-side radius
- Right-side radius
- Individual corner control on certain node types

Supported shortcuts include:

- `r`
- `rt`, `rtl`, `rtr`
- `rb`, `rbl`, `rbr`
- `rl`, `rr`

Important limitation:

- Individual corner radii are only supported on node types that expose those properties cleanly, especially frames and rectangles
- Other shapes may support only general radius, not per-corner radius

### 5. Padding

Hotkey supports auto-layout padding changes:

- All sides
- Left
- Right
- Top
- Bottom
- Horizontal axis
- Vertical axis

Supported shortcuts:

- `p`, `pl`, `pr`, `pt`, `pb`, `px`, `py`

Important limitation:

- Padding only works on nodes that support auto-layout padding
- If a node is not an auto-layout container, padding commands are not applicable
- Many basic shape types and FigJam-native nodes are excluded

This is an important marketing point: padding support is not “for every layer,” it is specifically useful for auto-layout containers.

### 6. Stroke controls

Hotkey supports two kinds of stroke operations:

- Stroke width changes
- Stroke alignment changes

Stroke width shortcuts:

- `sw`, `swl`, `swr`, `swt`, `swb`, `swx`, `swy`

Stroke alignment shortcuts:

- `sai`, `sac`, `sao`

Important behaviors:

- If a node has no stroke and stroke width is set, the plugin creates a default black solid stroke
- Edge-specific stroke weights are more limited than full stroke weight

Important limitations:

- Individual stroke-edge controls are mainly supported on frames and rectangles
- Stroke commands do not apply to all node types

### 7. Selection tools

This plugin does more than property editing. It also includes selection manipulation commands.

These commands let the user:

- Select spatially related items
- Traverse up or down the layer hierarchy
- Move to parents or children
- Move to next or previous siblings
- Invert a selection within a parent
- Filter selection by node type
- Exclude certain node types from selection

Supported selection shortcuts include:

- `selr`, `sell`, `selt`, `selb`
- `root`, `leaf`, `selp`, `selc`, `selns`, `selps`, `seli`
- `fs*` commands
- `es*` commands

Filter and exclude coverage includes classic layer types such as:

- Frame
- Group
- Text
- Component
- Component set
- Instance
- Line
- Vector
- Ellipse
- Polygon
- Rectangle
- Boolean operation

Important limitation:

- These filters are not a universal type system for all modern Figma node categories
- They mainly target traditional design-layer types

### 8. Fill and stroke paint operations

This is one of the plugin’s more powerful areas.

Hotkey supports:

- Replacing fills
- Adding fills
- Inserting fills at a position
- Deleting fills by target
- Replacing strokes
- Adding strokes
- Inserting strokes
- Deleting strokes by target

Supported shortcuts:

- `f`, `fa`, `fi`, `fd`
- `s`, `sa`, `si`, `sd`

Supported paint syntax includes:

- 1, 2, 3, 4, 6, or 8-length hex values
- Optional `#`
- Optional alpha using percent or decimal notation
- Optional target selectors
- Optional blend mode and visibility tokens

Examples of what the syntax can express:

- Replace all fills
- Replace only the second fill
- Delete a range of fills
- Apply color plus transparency
- Append a new hidden fill
- Insert a stroke at a specific index

Important limitation:

- Color commands explicitly exclude many node types, including several FigJam-native node categories
- If fills or strokes are in unsupported or mixed states, the command can fail

### 9. Constraints

Hotkey supports Figma constraint-related commands, including:

- Constraint presets
- Centering
- Scaling
- Horizontal constraint variants
- Vertical constraint variants

Supported shortcuts include:

- `c`, `cc`, `cs`
- `cx`, `cxc`, `cxs`, `cxl`, `cxr`
- `cy`, `cyc`, `cys`, `cyt`, `cyb`

Important limitation:

- Constraints are a Figma design concept, not a broad FigJam concept
- Many non-standard node types and FigJam nodes are excluded

### 10. Auto-layout behavior

Hotkey supports two related auto-layout areas:

#### A. Sizing behavior

Commands:

- `ax`
- `ay`
- `aa`
- `fill`
- `hug`

What these do:

- Toggle width or height auto-layout sizing behavior
- Set hug or fill behavior
- Apply a smart auto mode based on the parent layout direction

Important behavior:

- If “hug” is requested on a node that cannot support it in context, the code may fall back to `FIXED`
- This is not a fully abstract layout engine; it is adapting Figma’s actual layout rules

#### B. Apply auto-layout to existing groups/frames

Commands:

- `al`
- `alx`
- `aly`

What this does:

- Attempts to infer direction, spacing, and padding from the selected container’s children
- Converts the selected node into an auto-layout container using that inferred structure

This is a strong feature, but it is heuristic, not magic.

Important limitations:

- It only works on nodes that have the necessary container and child properties
- It ignores locked or invisible children when inferring layout
- Uneven spacing may be normalized
- If the node cannot be converted meaningfully, the plugin skips it or fails

### 11. Gap spacing

Hotkey also supports auto-layout spacing controls:

- `gap`
- `gapx`
- `gapy`

This is specifically for auto-layout containers and is not a universal “distance between any two objects” tool.

### 12. Text spacing

Hotkey supports:

- Letter spacing changes
- Line height changes
- Conversion between pixel and percent units for those values

Supported shortcuts:

- `ls`
- `lh`
- `lsp`
- `lspx`
- `lhp`
- `lhpx`

Important technical realities:

- These commands only work on real Figma `TEXT` nodes
- The plugin loads the fonts used in the text before editing
- If required fonts are unavailable, the command fails
- If the text has mixed font-size, mixed letter-spacing, or mixed line-height situations, some operations fail
- AUTO line height must be converted to an explicit value before some unit conversions

This is a nuanced area and should be described carefully on the website. The plugin is powerful here, but only inside the limits of Figma’s text model.

### 13. Miscellaneous utilities

Misc commands include:

- `clip`
- `count`
- `countn`
- `swap`
- `swapx`
- `swapy`
- `wf`
- `dup`
- `rot`
- `op`

What these do:

- Toggle clipping
- Count selected elements
- Count nested elements
- Swap positions or order of selected nodes
- Wrap each selected node in its own frame
- Duplicate selected nodes
- Set rotation
- Set opacity

Important details:

- `swap` requires exactly two selected elements
- Swap behavior differs depending on whether the nodes are in auto-layout parents, separate auto-layout parents, mixed layout contexts, or free-positioned contexts
- `wf` creates a new wrapper frame around each selected object
- `dup` clones selected nodes and selects the duplicates afterward
- `op` expects a value from 0 to 100 percent

## Advanced command language

One of the plugin’s strongest differentiators is that it is not limited to simple “set this value” commands.

It also supports:

- Add
- Subtract
- Multiply
- Divide
- Sequential progression
- Cumulative progression
- Range interpolation across a selection

Examples of supported operator patterns:

- `+`
- `-`
- `*`
- `/`
- `++`
- `--`
- `**`
- `//`

This allows inputs such as:

- Increase width by a fixed amount
- Progressively change height across a multi-selection
- Interpolate values from start to end across selected objects
- Use arithmetic or geometric progression

This is a major website point. Hotkey is not just “property shortcuts.” It is also a **batch transformation language for selections**.

## Suggestions and command history

The plugin includes a suggestion system that:

- Offers suggestions while the user types
- Shows defaults when the query is empty
- Reads recent command sets from local plugin storage

History behavior:

- It stores recent parsed command sets in `clientStorage`
- It removes duplicates
- It keeps only the latest 8 unique entries

This means the plugin is optimized for repeat usage patterns, not only one-off commands.

## Privacy, security, and data handling

This is an important section for a website.

### Network usage

The manifest explicitly sets:

- `networkAccess.allowedDomains = ["none"]`

That means the plugin does **not** call external web services.

### Stored data

The plugin stores only local command history in Figma client storage.

It does not, based on the current code:

- Send commands to a server
- Sync usage to a cloud backend
- Call an AI endpoint
- Upload designs
- Fetch external assets

This is a strong trust and privacy point.

## Where the plugin works well

Hotkey works best when:

- The user is already inside Figma
- The user knows what property changes they want
- The user is editing standard Figma design layers
- The user needs repeated, batch, or numeric adjustments
- The user is using auto-layout heavily
- The user wants to move quickly without opening many panels

Best-fit scenarios:

- Design system cleanup
- Batch resizing
- Batch spacing adjustments
- Bulk color edits
- Auto-layout tuning
- Selection filtering and traversal
- Repetitive layout normalization

## Where the plugin works less well

Hotkey is less ideal when:

- The user is a total beginner
- The user expects a graphical UI instead of shorthand input
- The user wants guided, step-by-step workflows
- The user works mostly in FigJam-native object types
- The selection contains unsupported node types
- The task depends on mixed text styles, missing fonts, or unsupported constraint/layout contexts

## Where the plugin does not work or is intentionally out of scope

The plugin does not cover:

- AI generation
- Code export
- HTML/CSS/React generation
- Website publishing
- Asset downloading from the internet
- Project management or commenting workflows
- General FigJam whiteboarding enhancement across all FigJam node types
- Prototype logic or interactive flow authoring
- Version control or change review

It also does not provide:

- A polished, custom visual interface
- A command palette with full natural-language understanding
- A complete beginner learning layer

## Figma vs FigJam support summary

This needs to be stated clearly on any website.

### Figma

Figma is the natural home of this plugin.

Most of the meaningful functionality is aimed at Figma design nodes and Figma layout/property systems, including:

- Coordinates
- Width and height
- Constraints
- Auto-layout
- Padding
- Text spacing
- Stroke geometry
- Corner radius

### FigJam

The plugin is installable and runnable in FigJam, but support is uneven.

Reasons:

- Many utilities explicitly exclude FigJam-native node categories
- Several commands depend on Figma design-only properties such as constraints, layout sizing, padding, radius, or text-node-specific APIs
- The filter system mainly targets classic design layer types

The honest positioning is:

- **Available in FigJam**
- **Best experienced in Figma**
- **Partial support in FigJam**

## Support boundaries by feature type

### Broad support

These areas have relatively broad applicability:

- Selection-based execution
- Command parsing
- History and suggestions
- Basic position changes
- Rotation and opacity on nodes that expose those properties
- Counting and some selection traversal behaviors

### Conditional support

These areas depend heavily on node type or context:

- Width and height
- Scaling
- Fit to parent
- Radius
- Stroke geometry
- Color operations
- Constraints
- Auto-layout behavior
- Gap and padding
- Text spacing
- Swap behavior
- Wrap in frame

### Weak or limited support

These areas are notably limited:

- FigJam-native objects as a broad category
- Advanced commands on mixed-type selections
- Text operations on mixed font/mixed style text
- Parent-dependent operations when a suitable parent does not exist

## Important product truths for marketing and copywriting

To avoid misleading messaging, the website should communicate these truths:

1. Hotkey is a command-input productivity plugin.
2. It is mainly for speed and batch edits.
3. It is strongest in Figma design workflows.
4. FigJam support exists, but not every command is meaningful there.
5. It is for users who want to move faster than the standard panel workflow.
6. It is not a website builder, AI assistant, or code generator.
7. It supports advanced math and progression patterns across selections.

## Positioning language the website should lean toward

Good positioning themes:

- Keyboard-first
- Power-user workflow
- Batch editing
- Fast property control
- Multi-command execution
- Precision editing
- Selection-based transformations
- Auto-layout workflow acceleration
- Design ops productivity

Positioning themes the website should avoid:

- “Design with AI”
- “Build websites from Figma”
- “No-code web builder”
- “Beginner-friendly visual editor”
- “Works on every Figma/FigJam object in every context”

## UX and behavior details worth knowing

### Execution order matters

Commands are applied in sequence from left to right. This means one command can change the context for the next one.

### Selection can change mid-run

Some commands operate on the selection itself, such as filter, exclude, traversal, and swap-like flows. That means later commands in the same string may run on a changed selection.

### Some commands skip unsupported nodes

Modifier-based operations can partially succeed. If some selected nodes do not support a property, the plugin may apply changes to supported nodes and notify that others were skipped.

### Errors are direct and operational

The plugin reports errors like:

- Invalid Command
- Invalid Value
- Unsupported Property
- No Selection
- Invalid Selection

This is a utilitarian product. The behavior is clear and functional, not heavily hand-held.

## Known implementation realities

These points are useful for any sophisticated buyer, reviewer, or technical writer.

### 1. The plugin runtime is command-first, not UI-first

The actual behavior is driven by plugin parameters and command parsing. The bundled React UI is leftover scaffold code and is not part of the primary user experience.

### 2. It stores local usage history

Recent command strings are saved locally and reused as suggestions. This helps recurring workflows.

### 3. It does not depend on external services

This reduces privacy concerns and avoids SaaS dependencies.

### 4. It is tightly coupled to Figma’s node-property model

That is why support varies by node type. The plugin is only as universal as the underlying Figma APIs allow.

### 5. It includes newer command-system work

The codebase includes substantial work around:

- Richer command metadata
- Better suggestion logic
- More explicit value validation

This indicates the product is being actively refined at the command-language layer.

## Limits the website should disclose honestly

The site does not need to be negative, but it should be accurate.

Suggested truthfully framed limitations:

- Best for users who are comfortable with shorthand commands
- Best in Figma design files, with partial FigJam support
- Some commands only apply to certain node types
- Some commands depend on auto-layout, parent context, or text/font state
- Not every selection can accept every command

## Questions a website visitor should not have after reading the site

The website should answer all of these clearly:

- What is this plugin?
- Who is it for?
- What does it do faster than normal Figma workflows?
- Is it a command plugin or a visual UI plugin?
- Does it work in Figma, FigJam, or both?
- Is FigJam support full or partial?
- What kinds of edits can it make?
- Can it batch-edit multiple layers?
- Does it support auto-layout workflows?
- Does it support colors, spacing, size, and constraints?
- Does it use the internet or send data out?
- Is it a code generator or website builder? No.

## Suggested website structure

If someone were building the marketing site, the content structure should probably be:

1. Hero
2. What Hotkey is
3. Why it is faster than panel-based editing
4. What kinds of commands it supports
5. Real workflow examples
6. Figma vs FigJam support clarification
7. Privacy and offline/no-network trust section
8. FAQ

## Recommended hero message direction

The strongest honest message is something close to:

**Type commands. Edit layers fast. Stay in flow.**

Supporting idea:

Hotkey turns short commands into real Figma edits for size, position, color, spacing, auto-layout, constraints, and more.

## Recommended FAQ points

Suggested FAQs:

- What is Hotkey?
- Is Hotkey for Figma or FigJam?
- Does it work with multiple selected layers?
- Does it have a visual interface?
- Can I use one command string to update many properties?
- Does it support auto-layout?
- Does it support text spacing and color changes?
- Does it send any data to external servers?
- Is it a website builder or code export tool?

## Appendix: exact command inventory by family

### Position

`xy`, `x`, `y`, `dl`, `dr`, `dt`, `dtl`, `dtr`, `db`, `dbl`, `dbr`, `DL`, `DR`, `DT`, `DTL`, `DTR`, `DB`, `DBL`, `DBR`

### Size

`w`, `h`, `sc:w`, `sc:h`, `wh`, `fit`, `fill`, `hug`

### Corner radius

`r`, `rt`, `rtl`, `rtr`, `rb`, `rbl`, `rbr`, `rl`, `rr`

### Padding

`p`, `pl`, `pr`, `pt`, `pb`, `px`, `py`

### Strokes

`sw`, `swl`, `swr`, `swt`, `swb`, `swx`, `swy`, `sai`, `sac`, `sao`

### Selection

`selr`, `sell`, `selt`, `selb`, `root`, `leaf`, `selp`, `selc`, `selns`, `selps`, `seli`, `fsf`, `fsg`, `fst`, `fsc`, `fscs`, `fsi`, `fsl`, `fsv`, `fse`, `fsp`, `fss`, `fsr`, `fsb`, `esf`, `esg`, `est`, `esc`, `escs`, `esi`, `esl`, `esv`, `ese`, `esp`, `ess`, `esr`, `esb`

### Colour

`f`, `fa`, `fi`, `fd`, `s`, `sa`, `si`, `sd`

### Constraints

`c`, `cc`, `cs`, `cx`, `cxc`, `cxs`, `cxl`, `cxr`, `cy`, `cyc`, `cys`, `cyt`, `cyb`

### Auto-layout behavior

`ax`, `ay`, `aa`, `al`, `alx`, `aly`, `gap`, `gapx`, `gapy`

### Text

`ls`, `lh`, `lsp`, `lspx`, `lhp`, `lhpx`

### Misc

`clip`, `count`, `countn`, `swap`, `swapx`, `swapy`, `wf`, `dup`, `rot`, `op`

## Final product summary

Hotkey is a keyboard-first Figma productivity plugin for fast, command-based editing of selected layers. Its strength is not visual polish or AI automation. Its strength is speed, precision, and batch control for people who work deeply inside Figma.

It is best positioned as a power-user workflow tool for Figma design editing, with secondary but partial availability in FigJam. It covers a broad set of practical editing operations, especially around position, size, colors, layout, selection handling, and numeric batch transformations. It does not try to be a website builder, an AI designer, or a general-purpose beginner tool.

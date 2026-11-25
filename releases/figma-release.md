# Figma Release Tracker

- Latest version: 23
- Published on: 2026-11-25
- Published source: `8e7706a984fb86043f3103044713dac772b63dce`
- Figma plugin ID: `1504713278524433842`
- Publisher: werb.co, with Navaneeth Venu retained as contributor
- Publication: user clicked Publish at about 11:04 IST. Figma success screen observed; user version-history photo confirmed Version 23 and notes at 11:21 IST.
- Rollback source: Version 22, `e99d5bd336ac68ce9837e983253aae2a697714aa` (grammar source `00175343bf1ce613d4b2847f7d76835fe5bff637`). Rollback requires publishing another Figma version.

## Version 23: Better command suggestions

- Exact commands and valid values rank ahead of looser matches.
- Find commands by typing their names as well as their shortcuts.
- Get suggestions for the next command when building a chain.
- More consistent handling of ranges, cumulative changes and units in command values.

Scope: published V22 plus engine and suggestion fixes only. Same 126 executable actions; no new actions or richer dev features. Source scope check passed. Representative live scratch smoke covered plain ranges, cumulative increments and negative rotation. Automated source checks and mocked Figma checks are not full native-Figma coverage.

## Version 22

- Published on: 2026-11-24
- Published grammar source: `00175343bf1ce613d4b2847f7d76835fe5bff637`
- Main reconciliation: `e99d5bd336ac68ce9837e983253aae2a697714aa`
- Scope: grammar-only release. Later feature work remained on dev.

This ledger is release metadata. The published-source commit above identifies the exact plugin source; subsequent ledger-only commits do not change the plugin build.

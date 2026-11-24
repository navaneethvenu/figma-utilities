# V23 candidate scope, unreleased

Based on published V22 e99d5bd336ac68ce9837e983253aae2a697714aa, with engine/suggestion fixes only. No new command actions, smart auto-layout, richer paint operations, text editing/style commands, each loops or node creation.

The existing actionless sel catalog container is excluded from executable discovery. V22 and this candidate have the same 126 executable actions. All action bodies and action implementation files remain unchanged from V22.

Shared tokenization/validation, exact case-sensitive ranking, name discovery separate from values, next-command completion, checked examples and plain-range parsing are the intended changes. New suggestion metadata contains no new actions.

Verification is source and mocked-engine/action coverage unless explicitly recorded otherwise. No live Figma check or publication is claimed.

Verification on 2026-11-24: all 52 original grammar checks passed; 30,511 generated engine cases / 77,979 labels passed; all 504 examples parse. Mocked range/progression/rotation actions pass. Application typecheck with skipLibCheck and production build pass. scripts/verify-v23-scope.cjs proves the exact 126-action V22 set, identical catalog action bodies, unchanged utils/controller/executor. Strict typecheck has the known baseline dependency declaration conflicts. Live Figma check deferred because the Mac was actively in use.

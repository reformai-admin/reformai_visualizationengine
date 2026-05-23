# Pipeline: balanced_v7 (Active)

**Status:** Canonical production candidate  
**Mode key:** `balanced_v7`  
**Template version:** 7.0.0

## What this pipeline does

V7 is a two-call pipeline:

1. **AGT extraction** (`agt/extract.ts`) — fast Gemini text-only pass that extracts structural facts from the room image (window count, door count, ceiling fixture, built-in niches, camera perspective), each with a confidence level.
2. **Generation** — standard Gemini image generation call using all active prompt blocks, augmented by confidence-gated AGT constraints.

High-confidence AGT fields become hard constraints with a visibility contract. Medium-confidence fields become advisory observations. Low-confidence fields are suppressed. If the extraction call fails entirely, the pipeline falls back to V5 behavior via `FALLBACK_AGT`.

V7 also introduces per-style conflict resolution clauses (`buildConflictClausesBlock`), sourced from `conflict_resolution` entries in `data/styles.ts`.

## What distinguishes V7 from V5

- Pre-generation AGT extraction call (adds ~300ms)
- AGT constraint block injected before the constraint hierarchy
- AGT echo block injected near the end (final compliance check)
- Per-style conflict resolution clauses injected after the style block
- V7-specific constraint hierarchy extension (AGT tier line when hard facts exist)

## Acceptance criteria (last validated)

- Zero hard rejections per 12-case regression
- Average score >= 4.11

Last regression: `runs/run_20260505_164955` — 0 hard rejections, 5 style regressions pending fixes  
Pending fixes documented in: `runs/run_20260505_164955/optimization_advice.md`

## What should NOT be modified here

Prompt block text belongs in `prompts/blocks/`. Style definitions belong in `data/styles.ts`.  
This file contains only orchestration logic: what blocks to build and in what order to pass them to the composer.

# Pipeline: balanced_v5 (Benchmark)

**Status:** Frozen benchmark — moodboard integration reference  
**Mode key:** `balanced_v5` (also aliased from `balanced_v6`)  
**Template version:** 6.0.0

## What this pipeline does

V5 is the foundational production architecture. It introduced:
- Moodboard support with explicit extraction scope control
- The 6-tier constraint hierarchy
- Staging density blocks (SPARSE / BALANCED / LAYERED)
- The structural sandwich pattern (base room anchor + terminal re-anchor)
- The canonical Gemini parts composition order

V6.0 added contractor catalogue integration (Tier 2B renovation material anchors) on top of this base.  
`balanced_v6` is an alias: the mode key is preserved for logging, but the handler is this V5 pipeline.

## What distinguishes V5 from V7

V5 has no AGT extraction call, no AGT constraint block, and no per-style conflict resolution clauses.  
It represents the prompt system without confidence-gated structural enforcement.

## Regression performance (last validated)

`runs/run_20260505_121132` — V6.0 vs Baseline  
- V6.0 avg score: 4.21, 8 wins, 1 hard rejection  
- Baseline avg score: 3.73, 1 win, 5 hard rejections

## Freeze status

V5 prompt files (`prompts/balanced_v5/`) are frozen. Do not edit them.  
This pipeline exists as a regression anchor and as the base for V7 comparisons.  
New product development targets `pipelines/v7/`.

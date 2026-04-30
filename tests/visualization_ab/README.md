# ReformAI Visualization A/B Testing Workspace
**Last Updated:** 2026-04-30

This workspace contains fixtures, prompts, and variant definitions for structured A/B testing of the ReformAI visualization engine.

## Overview
- **Status**: ⚠️ Superseded — A/B test infrastructure replaced by dedicated regression suites
- **Original purpose**: Compare Baseline (V0 production) vs Improved (V1 Phase Anchoring) pipelines
- **Current regression infrastructure**: See `tests/regression/`, `tests/bedroom_regression/`, `tests/moodboard_regression/`

> This workspace targets early-stage pipelines (`baseline_original`, `improved_current`).  
> Active development is on `balanced_v5` (template 5.2.1). For current pipeline testing, use the regression runners.

## Fixtures
The following source images are available in `fixtures/`:
- `Bedroom_test.jpeg`: Primary test room for all experiments
- `Bed_test.png`: Furniture reference for `style_furniture` scenario
- `Moodboardt_test.png`: Style reference inspiration image

## Variants
- `baseline.yaml`: Runs the original production prompt system (no structural conditioning)
- `window_fix.yaml`: Tests void integrity constraint in isolation

## Scenarios
- `style_only`: Room + style preset, no furniture or mood board
- `style_furniture`: Room + style preset + furniture reference image

## How to Run
The developer sandbox at `http://localhost:3333` has a built-in **Comparison Mode (A/B)** toggle.
This sends two parallel requests to the backend and renders the outputs side by side with full debug metadata.

**API endpoints:**
- `POST /generate-visualization?mode=baseline_original` → Production logic
- `POST /generate-visualization?mode=improved_current` → Phase Anchoring V2

## Current Blocker
The backend has a TypeScript compile error in `src/services/baseline/geminiService.ts`.
See `CURRENT_STATE.md` at the project root for the exact diagnosis and fix.

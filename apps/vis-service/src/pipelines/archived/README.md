# Archived Pipelines

Pipelines V1 through V4.1, baseline_original, and improved_current are frozen regression anchors.

## Physical location

These pipelines are **not physically moved** to this directory. Their implementations remain in `services/<version>/geminiService.ts` with their original relative import paths intact. Moving them would require updating their internal imports, which would introduce change risk for code that exists solely for regression comparison.

Their presence in `services/` is intentional. After Phase 4 of the refactor, `services/` contains only archived pipeline implementations.

## Mode keys and handlers

| Mode key | Handler location | Status |
|---|---|---|
| `baseline_original` | `services/baseline/geminiService.ts` | Frozen — original comparison anchor |
| `balanced_v1` | `services/balanced/geminiService.ts` | Frozen benchmark |
| `balanced_v2` | `services/balanced_v2/geminiService.ts` | Frozen benchmark |
| `balanced_v2_1` | `services/balanced_v2_1/geminiService.ts` | Frozen benchmark |
| `balanced_v2_2` | `services/balanced_v2_2/geminiService.ts` | Frozen benchmark |
| `balanced_v3_0` | `services/balanced_v3_0/geminiService.ts` | Frozen benchmark |
| `balanced_v4_0` | `services/balanced_v4_0/geminiService.ts` | Frozen benchmark |
| `balanced_v4_1` | `services/balanced_v4_1/geminiService.ts` | Frozen benchmark |
| `improved_current` | `services/improved/geminiService.ts` | Frozen experimental |

## Rules

- Do not modify any file in `services/<version>/` for any of the above modes.
- Do not add new features to these pipelines.
- Do not update their imports or refactor their internals.
- They remain callable via the dispatcher for regression comparison only.

## Running regressions against archived pipelines

Use `tests/regression/run_regression.py` with `config.yaml` to include any of these modes in a regression run.

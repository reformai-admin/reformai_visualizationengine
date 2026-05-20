# Moodboard Regression Suite

**Status:** Specialized suite — maintained separately from the main regression runner  
**Target pipeline:** `balanced_v5` (V5.1 moodboard behavior)  
**Runner:** `run_moodboard.py`  
**Config:** `configs/moodboard_suite.yaml`

## Purpose

This suite validates moodboard-as-bounded-modifier behavior: that moodboard images
extract abstract tone (palette, texture quality, lighting) without bleeding into
material identity, style category, or architectural structure.

It covers three moodboard relationship types:
- **Aligned** — moodboard consistent with the selected style (e.g., Japandi + soft neutral moodboard)
- **Mixed** — moodboard partially aligned, partially contrasting
- **Stress** — deliberately conflicting signals; tests filter and conflict resolution

The main regression runner (`tests/regression/`) does not test moodboards. This suite
is the only harness that validates this behavior.

## Fixture requirements

This suite requires fixture images not included in the standard regression fixtures.
Required files under `tests/moodboard_regression/fixtures/`:

```
fixtures/rooms/living_room.jpg
fixtures/moodboards/moodboard_a.png
fixtures/moodboards/moodboard_b.png
fixtures/moodboards/moodboard_c.png
```

These are not committed to the repo. Obtain them from the product team before running.

## Running

```bash
cd tests/moodboard_regression
python run_moodboard.py                         # full run + AI eval + report
python run_moodboard.py --skip-ai               # generation only
python run_moodboard.py --report-only <run_dir> # regenerate report
```

Requires the vis-service running at `http://localhost:8080` with `ANTHROPIC_API_KEY` in `.env`.

## Relationship to main regression

| | `tests/regression/` | `tests/moodboard_regression/` |
|---|---|---|
| Pipelines | Any (default: baseline vs V7) | `balanced_v5` only |
| Moodboard images | No | Yes |
| Rooms | Multi-room | Single room |
| Comparison | Head-to-head scoring | Single-pipeline behavioral validation |
| Use when | Validating a pipeline change | Validating moodboard scope behavior |

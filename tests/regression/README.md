# Regression Profiles

## Fast Canonical Regression
- Config: `tests/regression/config.yaml`
- Purpose: fast baseline-vs-canonical validation.
- Expected modes: `baseline_original`, `balanced_v7`.
- Preflight command:
  - `npm run regression:preflight`
- Behavior:
  - Non-strict preflight.
  - Warns if full benchmark matrix modes are not present.
  - Validates semantic roles for configured modes when `role` is present.

## Full Product-Evolution Benchmark Regression
- Config: `tests/regression/config.full_matrix.yaml`
- Purpose: validate product-evolution comparison coverage across major milestones.
- Expected modes:
  - `baseline_original` (historical anchor)
  - `balanced_v4_0`, `balanced_v4_1` (furniture/control benchmarks)
  - `balanced_v5` (moodboard benchmark)
  - `balanced_v6` (compatibility/alias behavior)
  - `balanced_v7` (canonical active candidate)
- Preflight command:
  - `npm run regression:preflight:full`
- Behavior:
  - Strict preflight.
  - Fails if required benchmark matrix modes are incomplete.
  - Fails if configured mode semantic roles do not match `runtime_assumptions.json`.

## Parser Note
- `tests/regression/preflight.mjs` intentionally uses a lightweight line parser for the `pipelines` list.
- Supported shape: each pipeline entry must include `- mode:` and may include `role:` on following lines.
- If config structure becomes more complex, switch to a YAML parser dependency.

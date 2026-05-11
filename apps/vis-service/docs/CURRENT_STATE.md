# vis-service Current State (Derived)

This file is a service-local summary.
Authoritative lifecycle/governance source:
- `docs/PLATFORM_STATUS.md`

## Runtime Defaults
- Default request mode: `balanced_v7`
- Canonical orchestration: AGT extraction/classification + generation

## Routing and Alias Semantics
- `balanced_v7`: canonical active candidate path.
- `balanced_v6`: compatibility alias behavior.
  - Log mode remains `balanced_v6`.
  - Handler mode resolves to `balanced_v5`.
  - Alias parity is contract-tested.

## Benchmark/Comparison Availability
- `baseline_original` remains the historical anchor.
- V4 and V5 remain frozen benchmarks.
- Historical benchmark modes remain callable for sandbox/regression comparison workflows.

## Validation Workflow
- Spawn-free contracts: `npm run test:contracts`
- Regression preflight profiles:
  - fast/non-strict: `npm run regression:preflight`
  - full/strict: `npm run regression:preflight:full`

Any lifecycle/alias/semantic change must be made in `docs/PLATFORM_STATUS.md` first, then reflected here.

# ReformAI Visualization Engine - Development Guide
**Last Updated:** 2026-05-11

This guide tracks the implemented architecture and day-to-day developer workflows.

## Source of Truth Hierarchy
1. `docs/PLATFORM_STATUS.md` - lifecycle/governance and canonical semantics.
2. `ARCHITECTURE.md` - current system architecture and consolidation state.
3. `apps/vis-service/README.md` - backend runtime/testing contracts.
4. `tests/regression/README.md` - regression profile workflows.

## Current Architecture Snapshot
- Canonical active candidate: `balanced_v7`
- Compatibility alias behavior: `balanced_v6 -> balanced_v5`
- Historical/frozen benchmarks preserved for comparison (including `baseline_original` anchor).
- Shared orchestration primitives: `apps/vis-service/src/services/shared/*`
- Shared prompt contracts/primitives: `apps/vis-service/src/prompts/shared/*`

## Developer Workflows
### Local development
```bash
npm run dev
```

### Backend build + contract tests
```bash
cd apps/vis-service
npm run build
npm run test:contracts
```

### Regression preflight profiles
```bash
npm run regression:preflight
npm run regression:preflight:full
```

- Fast preflight is non-strict and supports canonical baseline-vs-v7 workflow.
- Full preflight is strict and enforces full benchmark-matrix semantics.

## Regression Profiles
- Fast canonical profile: `tests/regression/config.yaml`
- Full product-evolution profile: `tests/regression/config.full_matrix.yaml`
- Shared assumptions source: `tests/regression/runtime_assumptions.json`

## Compare-Mode Philosophy
- Benchmark modes are preserved intentionally for product-evolution analysis.
- "Frozen" means no active feature development unless compatibility requires it.
- "Historical" does not mean removed or unusable; it means comparison-oriented.

## Notes on Historical Reference Docs
Files in `docs/reference-documents/` are historical or point-in-time planning artifacts.
Use them for context, then reconcile against `docs/PLATFORM_STATUS.md` for current truth.

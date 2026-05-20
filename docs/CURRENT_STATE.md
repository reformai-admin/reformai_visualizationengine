# ReformAI Visualization Engine -- Current State
**Last Updated:** 2026-05-20

Authoritative lifecycle/governance source: `docs/PLATFORM_STATUS.md`

---

## Runtime Summary

- Canonical active pipeline: `balanced_v7`
- Compatibility alias: `balanced_v6` logs as V6, executes via V5 handler
- All historical benchmark modes remain callable for regression comparison

## Repository Status

**Structural refactor in progress.** Phases 1-5 of 6 are complete (as of 2026-05-20).
See `docs/ARCHITECTURE_REFACTOR_PLAN.md` for full plan and phase status.
See `docs/AGENT_HANDOFF.md` for detailed context for the next engineer.

Phase 6 (unit tests for prompt blocks) is the only remaining refactor work.
After Phase 6 the refactor is complete and the repo is ready for product feature work.

## Active Source-of-Truth File Paths (post-refactor)

| Concern | File |
|---|---|
| Pipeline routing and alias semantics | `apps/vis-service/src/pipelines/routing.ts` |
| Pipeline dispatcher | `apps/vis-service/src/pipelines/dispatcher.ts` |
| Canonical V7 orchestration | `apps/vis-service/src/pipelines/v7/index.ts` |
| Gemini execution layer | `apps/vis-service/src/runner/gemini.ts` |
| Prompt block implementations | `apps/vis-service/src/prompts/blocks/` |
| Part sequence assembly | `apps/vis-service/src/pipelines/composer.ts` |
| AGT extraction | `apps/vis-service/src/agt/extract.ts` |
| AGT classification | `apps/vis-service/src/agt/classify.ts` |
| Contract tests | `apps/vis-service/src/contracts/runContracts.ts` |

## Validation Workflows

- Unit + contract tests: `npm run test:contracts && npm test` in `apps/vis-service`
- Regression runner: `python tests/regression/run_regression.py`
- Regression fixtures: `fixtures/` (root-level)
- Regression output: `runs/` (root-level, gitignored)

## Pipeline Lifecycle Snapshot

| Mode | Status | Location |
|---|---|---|
| `balanced_v7` | Canonical active candidate | `pipelines/v7/index.ts` |
| `balanced_v6` | Compatibility alias to V5 | (routes to V5 handler) |
| `balanced_v5` | Frozen benchmark (moodboard) | `pipelines/v5/index.ts` |
| `balanced_v4_0`, `balanced_v4_1` | Frozen benchmark (furniture) | `services/balanced_v4_*/` |
| `baseline_original` | Historical baseline anchor | `services/baseline/` |
| `balanced_v1` through `balanced_v3_0` | Historical benchmarks | `services/balanced_*/` |
| `improved_current` | Historical comparison path | `services/improved/` |

## Deployment Path

`Browser -> Netlify CDN -> netlify/functions/api.mjs -> Cloud Run (Fastify) -> Gemini`

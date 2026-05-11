# ReformAI Visualization Engine - Platform Status (Authoritative)
**Last Verified:** 2026-05-11  
**Verification Basis:** runtime routing, contract-test surface, and regression preflight infrastructure.

## 1. Canonical Runtime
- **Canonical pipeline:** `balanced_v7`
- **Canonical architecture:** two-call AGT + generation flow
  - Call 1: AGT extraction + confidence classification
  - Call 2: Gemini image generation with AGT hard/advisory injection
- **Canonical entrypoint:** `POST /generate-visualization?mode=balanced_v7`
- **Default mode behavior:** if mode is omitted, runtime resolves to `balanced_v7`

## 2. Pipeline Lifecycle and Semantics
| Mode | Lifecycle | Product Semantics |
|---|---|---|
| `baseline_original` | Historical Baseline Anchor | Original comparison anchor |
| `balanced_v4_0`, `balanced_v4_1` | Frozen Benchmark | Furniture/control evolution benchmark |
| `balanced_v5` | Frozen Benchmark | Moodboard evolution benchmark |
| `balanced_v6` | Compatibility Path / Alias Behavior | Alias to `balanced_v5` runtime path |
| `balanced_v7` | **Canonical Active Candidate** | Active production candidate |
| `balanced_v1`, `balanced_v2`, `balanced_v2_1`, `balanced_v2_2`, `balanced_v3_0` | Historical Benchmarks | Early product-evolution benchmarks |
| `improved_current` | Historical Comparison Path (Frozen Benchmark) | Historical comparison path unless reactivated |

## 3. Alias Semantics (Explicit)
- `balanced_v6` keeps its own **log mode**.
- `balanced_v6` executes via **handler mode `balanced_v5`**.
- This parity is contract-tested in spawn-free contract tests.

## 4. Architectural Constraints
- No new copy-forward pipelines for feature growth.
- New architecture work must land in shared primitives + `balanced_v7`.
- Frozen/historical benchmark modes remain available for sandbox and regression comparisons.

## 5. Shared Primitives and Consolidation State
- Shared runtime assembly primitives: `apps/vis-service/src/services/shared/*`
- Shared prompt contracts/adapters: `apps/vis-service/src/prompts/shared/*`
- V7 now depends on shared prompt primitives/contracts instead of direct V5 internals for key composition boundaries.

## 6. Validation and Governance Infrastructure
### Contract tests (spawn-free)
- Command: `npm run test:contracts` (in `apps/vis-service`)
- Covers: routing/default mode, alias behavior, AGT classification, canonical prompt ordering, V7 AGT hierarchy insertion.

### Regression preflight profiles
- Fast profile: `npm run regression:preflight` (non-strict)
  - Config: `tests/regression/config.yaml`
- Full matrix profile: `npm run regression:preflight:full` (strict)
  - Config: `tests/regression/config.full_matrix.yaml`

Shared assumptions source for both Python and Node workflows:
- `tests/regression/runtime_assumptions.json`

## 7. Deployment Topology
```
Browser -> Netlify CDN -> netlify/functions/api.mjs -> Cloud Run (Fastify) -> Gemini APIs
```

## 8. Source-of-Truth Files
- Lifecycle/governance: `docs/PLATFORM_STATUS.md`
- Routing and alias semantics: `apps/vis-service/src/services/geminiService.ts`, `apps/vis-service/src/services/pipelineRouting.ts`
- Canonical orchestration: `apps/vis-service/src/services/balanced_v7/geminiService.ts`
- Shared assembly: `apps/vis-service/src/services/shared/*`
- Shared prompt contracts/primitives: `apps/vis-service/src/prompts/shared/*`
- Contract runner: `apps/vis-service/src/contracts/runContracts.ts`
- Regression assumptions and profiles: `tests/regression/runtime_assumptions.json`, `tests/regression/config*.yaml`, `tests/regression/preflight.mjs`

## 9. Drift Prevention Rules
- Any lifecycle, alias, or benchmark semantic change must update this file in the same change set.
- `docs/CURRENT_STATE.md` and `apps/vis-service/docs/CURRENT_STATE.md` are derivative summaries and must reference this file.

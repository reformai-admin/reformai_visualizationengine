# ReformAI Visualization Engine -- Platform Status (Authoritative)
**Last Verified:** 2026-05-20
**Verification Basis:** runtime routing, contract tests, unit tests, and post-refactor structural validation.

## 1. Canonical Runtime

- **Canonical pipeline:** `balanced_v7`
- **Canonical architecture:** two-call AGT + generation flow
  - Call 1: AGT extraction + confidence classification (`agt/extract.ts`, `agt/classify.ts`)
  - Call 2: Gemini image generation with AGT hard/advisory injection (`pipelines/v7/index.ts`)
- **Canonical entrypoint:** `POST /generate-visualization?mode=balanced_v7`
- **Default mode behavior:** if mode is omitted, runtime resolves to `balanced_v7`

## 2. Pipeline Lifecycle and Semantics

| Mode | Lifecycle | Handler Location |
|---|---|---|
| `baseline_original` | Historical Baseline Anchor | `services/baseline/geminiService.ts` |
| `balanced_v1` through `balanced_v3_0` | Historical Benchmarks | `services/balanced*/geminiService.ts` |
| `balanced_v4_0`, `balanced_v4_1` | Frozen Benchmark (furniture/control) | `services/balanced_v4_*/geminiService.ts` |
| `balanced_v5` | Frozen Benchmark (moodboard) | `pipelines/v5/index.ts` |
| `balanced_v6` | Compatibility Alias | Routes to `balanced_v5` handler |
| `balanced_v7` | **Canonical Active Candidate** | `pipelines/v7/index.ts` |
| `improved_current` | Historical Comparison Path | `services/improved/geminiService.ts` |

All paths above are relative to `apps/vis-service/src/`.

## 3. Alias Semantics (Explicit)

- `balanced_v6` keeps its own log mode.
- `balanced_v6` executes via handler mode `balanced_v5`.
- This parity is contract-tested in spawn-free contract tests.

## 4. Architectural Constraints

- No new copy-forward pipelines for feature growth.
- New pipeline work lands in `pipelines/` as a new versioned directory.
- New prompt block work lands in `prompts/blocks/` as a new block file.
- Frozen/historical benchmark modes remain callable for regression comparison.
- Do not modify any file under `services/` (frozen archived implementations).

## 5. Current Architecture Layout

```
apps/vis-service/src/
├── agt/                    AGT extraction and classification
├── catalogue/              Contractor catalogue feature (V6+)
├── contracts/              Spawn-free contract validation tests
├── controllers/            HTTP handler
├── data/                   Static product registries (styles, density, rooms, catalogue)
├── pipelines/
│   ├── dispatcher.ts       Pipeline map + routing entry point
│   ├── routing.ts          Mode resolution and alias handling
│   ├── composer.ts         Canonical Gemini parts assembly
│   ├── v7/                 ACTIVE: Canonical production pipeline
│   ├── v5/                 BENCHMARK: Frozen moodboard reference
│   └── archived/           README explaining frozen pipeline locations
├── prompts/
│   ├── blocks/             11 atomic prompt block files
│   ├── balanced_v5/        Re-export shim + frozen prompt builder
│   ├── balanced_v7/        Re-export shim + V7-specific hierarchy extension
│   └── shared/             Composition contracts and sequence declaration
├── request/                Multipart parser and params assembler
├── runner/                 Shared Gemini execution layer
├── schemas/                Zod input validation
├── services/               FROZEN archived pipelines only (V1-V4.1, baseline, improved)
├── types/                  Feature-split domain types (core, agt, catalogue)
├── types.ts                Backward-compat re-export shim (38 importers in archived pipelines)
└── utils/                  validation.utils.ts (remaining utility)
```

## 6. Validation and Governance Infrastructure

### Contract tests (spawn-free)
- Command: `npm run test:contracts` (in `apps/vis-service`)
- Covers: routing/default mode, alias behavior, AGT classification, canonical part ordering, V7 AGT hierarchy insertion.
- Current status: 13/13 PASS

### Unit tests
- Command: `npm test` (in `apps/vis-service`)
- Current status: 7/7 PASS

### TypeScript compilation
- Command: `node_modules/.bin/tsc --noEmit` (in `apps/vis-service`)
- Current status: CLEAN

### Regression runner
- Command: `python tests/regression/run_regression.py`
- Config: `tests/regression/config.yaml`
- Fixtures: `fixtures/` (root-level)
- Output: `runs/` (root-level, gitignored)

## 7. Deployment Topology

```
Browser -> Netlify CDN -> netlify/functions/api.mjs -> Cloud Run (Fastify) -> Gemini
```

## 8. Source-of-Truth Files

| Concern | File |
|---|---|
| Lifecycle / governance | `docs/PLATFORM_STATUS.md` (this file) |
| Routing and alias semantics | `apps/vis-service/src/pipelines/routing.ts` |
| Pipeline dispatcher | `apps/vis-service/src/pipelines/dispatcher.ts` |
| Canonical V7 orchestration | `apps/vis-service/src/pipelines/v7/index.ts` |
| Prompt block implementations | `apps/vis-service/src/prompts/blocks/` |
| AGT extraction | `apps/vis-service/src/agt/extract.ts` |
| AGT classification | `apps/vis-service/src/agt/classify.ts` |
| Contract runner | `apps/vis-service/src/contracts/runContracts.ts` |
| Regression config | `tests/regression/config.yaml` |

## 9. Drift Prevention Rules

- Any lifecycle, alias, or benchmark semantic change must update this file in the same change set.
- `docs/CURRENT_STATE.md` is a derivative summary and must reference this file.
- Source-of-truth paths in Section 8 must be updated whenever a file moves.

# Project Architecture - ReformAI Visualization Engine

## Overview
The system is now a consolidated platform with one canonical active candidate pipeline (`balanced_v7`) plus preserved benchmark/compatibility modes for product-evolution comparison.

Canonical runtime architecture is a two-call flow:
1. AGT extraction + confidence classification.
2. Image generation with confidence-gated AGT constraints and optional benchmark features (moodboard, renovation anchors, refinement).

Authoritative lifecycle/governance source: `docs/PLATFORM_STATUS.md`.

## Governance Model
- Canonical active candidate: `balanced_v7`.
- Compatibility alias path: `balanced_v6 -> balanced_v5`.
- Frozen/historical benchmarks remain callable for comparison workflows.
- Comparison capability is first-class and intentionally preserved in sandbox and regression tooling.

## Repository Structure
```text
/
|-- apps/
|   |-- web-sandbox/   # Comparison-oriented developer UI
|   `-- vis-service/   # Fastify backend, dispatcher, prompt assembly, AGT
|-- docs/              # Status, architecture, historical/reference documentation
|-- tests/             # Regression harnesses and benchmark workflows
`-- Visualization_Engine_Baseline/  # Immutable historical baseline snapshot
```

## Core Runtime Components
### Dispatcher and routing (`apps/vis-service/src/services/geminiService.ts`)
- Map-driven dispatcher with explicit mode resolution.
- Default mode is `balanced_v7` when omitted.
- `balanced_v6` alias behavior is explicit and contract-tested (`log mode = v6`, `handler mode = v5`).

### Canonical orchestration (`apps/vis-service/src/services/balanced_v7`)
- AGT extraction in `services/agt/*`.
- Confidence classification gates hard/advisory/suppressed fields.
- V7-specific AGT/conflict blocks layered on canonical prompt composition primitives.

### Shared orchestration primitives (`apps/vis-service/src/services/shared`)
- `pipelineAssembly.ts`: item normalization, part helpers, request-structure tracing.
- `canonicalRequestComposer.ts`: canonical part sequencing and block insertion contract.

### Prompt architecture (`apps/vis-service/src/prompts/shared`)
- Shared prompt contracts/builders/sequence declarations.
- Canonical prompt primitives abstract V5-derived core blocks so V7 does not import V5 internals directly.
- Benchmark prompt versions remain isolated and callable.

## End-to-End Flow
1. UI submits room image and options (style, moodboards, optional benchmark inputs).
2. Form-data parser validates payload and resolves pipeline mode (default `balanced_v7`).
3. Dispatcher resolves log mode and handler mode.
4. Selected pipeline assembles prompt/image parts via shared composition primitives.
5. Gemini image model returns output image.
6. API returns base64 image and debug metadata.

## Testing and Validation Architecture
### Contract tests (spawn-free)
- Runner: `apps/vis-service/src/contracts/runContracts.ts`
- Command: `npm run test:contracts` in `apps/vis-service`
- Coverage: routing/defaults, V6 alias semantics, AGT classification, canonical block ordering, V7 AGT hierarchy insertion.

### Regression preflight (Node, no Python dependency)
- `npm run regression:preflight` (fast profile, non-strict)
- `npm run regression:preflight:full` (full matrix profile, strict)
- Shared assumptions source: `tests/regression/runtime_assumptions.json`

### Regression profiles
- Fast canonical profile: `tests/regression/config.yaml` (`baseline_original` vs `balanced_v7`)
- Full product-evolution profile: `tests/regression/config.full_matrix.yaml` (baseline + V4 + V5 + V6 + V7)

## Architectural Direction
Near-term consolidation priorities:
- Continue extracting shared prompt contracts/adapters while preserving benchmark pipeline isolation.
- Keep comparison routes stable and explicit.
- Expand contract and regression validation without introducing new version fragmentation.

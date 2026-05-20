# Agent Handoff Document
**Created:** 2026-05-20  
**Context:** Structural refactor of the Visualization Engine, Phases 1-5 complete  
**Next task:** Phase 6 -- unit tests for all 11 prompt block builders

---

## Who you are and what you are doing

You are the lead AI engineer for the ReformAI Visualization Engine. The product manager (Charles) owns the product direction and prompt architecture. You own the code structure and engineering quality.

You are picking up a codebase structural refactor that is 5/6 phases complete. Your only remaining task is **Phase 6: write unit tests for the 11 prompt block builders** that were extracted in Phase 1. This is additive-only work. You do not touch any production code.

---

## Context: what was done before you

The repo went through a systematic 5-phase refactor that transformed a rapidly-iterated experimental codebase into a structured, navigable engineering system. Here is what was done in each phase:

**Phase 1 (complete):** Extracted 11 prompt block builders from a 564-line monolithic constants file into individual files under `apps/vis-service/src/prompts/blocks/`. Each file has a single responsibility, a version constant, and JSDoc documenting when it fires.

**Phase 2 (complete):** Created `apps/vis-service/src/runner/gemini.ts` -- the shared Gemini execution layer. Every pipeline now calls `callGemini(parts)` instead of duplicating API init, model calls, and response parsing. Created `runner/parts.ts` (image encoding, injected item normalization).

**Phase 3 (complete):** Split `types.ts` (155 lines, mixed concerns) into `types/core.ts`, `types/agt.ts`, `types/catalogue.ts`. Split `utils/formdata.utils.ts` into `request/parser.ts` (multipart parsing) and `request/assembler.ts` (validation + assembly). Moved `utils/catalogue.utils.ts` to `catalogue/resolver.ts`. `types.ts` remains as a backward-compat shim for 38 archived pipeline importers.

**Phase 4 (complete):** Moved the active V5 and V7 pipeline services to `pipelines/v5/index.ts` and `pipelines/v7/index.ts`. Moved the dispatcher, routing, and composer to `pipelines/`. Moved the AGT module from `services/agt/` to `agt/`. The frozen archived pipelines (V1-V4.1, baseline, improved) remain in `services/` unchanged with their original relative import paths intact (rule: never modify archived pipeline internals). Added README files to `pipelines/v7/`, `pipelines/v5/`, and `pipelines/archived/`.

**Phase 5 (complete):** Moved `reform-ai-vis-sandbox/` and `Visualization_Engine_Baseline/` to `archive/`. Deleted `tests/visualization_ab/` (superseded), `tests/bedroom_regression/` (superseded), `tests/regression/fixtures/` (unused duplicate of root `fixtures/`), `tests/regression/optimize_prompts.py` (obsolete). Deleted stale root-level doc files (`ARCHITECTURE.md`, `CURRENT_STATE.md`, `DEVELOPMENT_GUIDE.md`, `LESSONS_LEARNED.md`). Fixed `tests/regression/runtime_config.py` (removed dead sandbox path). Fixed `tests/moodboard_regression/run_moodboard.py` (updated service dir). Added `tests/moodboard_regression/README.md`.

---

## Current validation state

Run these from `apps/vis-service/` before you start:

```bash
node_modules/.bin/tsc --noEmit    # must be clean
npm run test:contracts             # must show: Contract checks passed: 13/13
npm test                           # must show: pass 7, fail 0
```

All three pass clean as of this handoff.

---

## Current directory structure (post-refactor)

```
apps/vis-service/src/
├── agt/
│   ├── classify.ts              AGT confidence classification
│   ├── classify.test.ts         2 unit tests
│   └── extract.ts               AGT Gemini extraction call
├── catalogue/
│   └── resolver.ts              Contractor catalogue resolver + CatalogueValidationError
├── contracts/
│   └── runContracts.ts          Spawn-free contract validation (13 checks)
├── controllers/
│   └── main.ts                  Fastify HTTP handler
├── data/
│   ├── catalogues.ts            In-memory contractor catalogue (POC)
│   ├── densityBlocks.ts         SPARSE/BALANCED/LAYERED block text
│   ├── roomTypes.ts             Room type registry
│   └── styles.ts                18 style definitions with model_inputs + pipeline_config
├── pipelines/
│   ├── archived/
│   │   └── README.md            Explains frozen pipelines live in services/
│   ├── v5/
│   │   ├── index.ts             V5 pipeline orchestration
│   │   └── README.md
│   ├── v7/
│   │   ├── index.ts             V7 pipeline orchestration (canonical active)
│   │   └── README.md
│   ├── composer.ts              Canonical Gemini parts array assembly
│   ├── composer.test.ts         1 unit test (part ordering)
│   ├── dispatcher.ts            Pipeline map + routing entry point
│   ├── routing.ts               Mode resolution and alias handling
│   └── routing.test.ts          3 unit tests (routing behavior)
├── prompts/
│   ├── balanced_v5/
│   │   ├── visualization.constants.ts   28-line re-export shim (imports from blocks/)
│   │   └── visualization.prompt.ts      Template injection layer (unchanged)
│   ├── balanced_v7/
│   │   ├── visualization.constants.ts   Re-exports V5 blocks + AGT blocks + V7 hierarchy extension
│   │   └── visualization.prompt.ts      Re-exports from V5 prompt (thin shim)
│   ├── blocks/                   *** YOUR WORK GOES HERE ***
│   │   ├── agt-constraint.ts
│   │   ├── agt-echo.ts
│   │   ├── conflict-clauses.ts
│   │   ├── constraint-hierarchy.ts
│   │   ├── density.ts
│   │   ├── influence.ts
│   │   ├── injected-items.ts
│   │   ├── moodboard-scope.ts
│   │   ├── renovation-anchors.ts
│   │   ├── structural.ts
│   │   └── style.ts
│   ├── shared/
│   │   ├── builders.ts           Canonical builder shims (delegates to V5)
│   │   ├── canonicalPromptPrimitives.ts  Re-export surface for V5 primitives
│   │   ├── contracts.ts          Type interfaces for prompt builders
│   │   └── sequence.ts           CANONICAL_BLOCK_SEQUENCE declaration
│   └── imageRoles.ts             Image part label constants
├── request/
│   ├── assembler.ts             Validation, schema, style lookup, params assembly
│   └── parser.ts                Multipart field iteration and image buffering
├── runner/
│   ├── gemini.ts                Shared Gemini execution (API client, model, call, response)
│   └── parts.ts                 Image encoding, injected item normalization, part tracing
├── schemas/
│   └── visualization.schema.ts  Zod input validation
├── services/                    FROZEN ARCHIVED PIPELINES ONLY -- do not modify
│   ├── balanced/                V1
│   ├── balanced_v2/
│   ├── balanced_v2_1/
│   ├── balanced_v2_2/
│   ├── balanced_v3_0/
│   ├── balanced_v4_0/
│   ├── balanced_v4_1/
│   ├── baseline/
│   └── improved/
├── types/
│   ├── agt.ts                   AGT type hierarchy
│   ├── catalogue.ts             Catalogue/renovation types
│   └── core.ts                  StylePreset, GenerateVisualizationParams, InjectedItem
├── types.ts                     Backward-compat shim (38 archived pipeline importers)
└── utils/
    └── validation.utils.ts      Input validation helpers
```

---

## Phase 6: What you need to build

### Location

Create a `__tests__/` directory inside `apps/vis-service/src/prompts/blocks/`:

```
apps/vis-service/src/prompts/blocks/__tests__/
├── structural.test.ts
├── style.test.ts
├── constraint-hierarchy.test.ts
├── moodboard-scope.test.ts
├── influence.test.ts
├── renovation-anchors.test.ts
├── injected-items.test.ts
├── agt-constraint.test.ts
├── agt-echo.test.ts
├── conflict-clauses.test.ts
└── density.test.ts
```

### Test runner

The project uses Node's built-in test runner via `tsx`. The existing tests use this pattern:

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
```

Run tests with: `npm test` in `apps/vis-service/`. The glob is `src/**/*.test.ts` so your new files will be picked up automatically.

### Import paths from `__tests__/`

From `apps/vis-service/src/prompts/blocks/__tests__/`, the import to a block file is:
```typescript
import { buildAGTConstraintBlock } from '../agt-constraint.js';
```

For types needed in test fixtures:
```typescript
import type { ClassifiedAGT } from '../../../types/agt.js';
import type { ResolvedRenovationSelections } from '../../../types/catalogue.js';
```

### What each test must verify

Every block test file must cover these three things:

1. **Active behavior** -- the block called with valid inputs returns a non-empty string containing expected key phrases
2. **Inactive/conditional behavior** -- for conditional blocks, calling with inputs that should suppress the block returns `''` (empty string)
3. **Version constant** -- the block exports a version constant with the expected format

The contract for conditional blocks is: **return `''` when inactive**. The composer checks for empty string and skips adding a parts entry. Tests must confirm this contract for every conditional block.

---

## Block-by-block test specifications

### `structural.ts`

Exports: `STRUCTURAL_BLOCK_VERSION`, `STRUCTURAL_BLOCK`

Tests:
- `STRUCTURAL_BLOCK` is a non-empty string
- It contains `'PHASE 1: ARCHITECTURAL ANCHORING'`
- It contains `'WINDOW PRESERVATION'`
- It contains `'EXTERIOR VIEW PRESERVATION'`
- `STRUCTURAL_BLOCK_VERSION` matches format `'structural@...'`

No conditional behavior (always fires). No builder function -- it's a static string constant.

---

### `style.ts`

Exports: `STYLE_BLOCK_VERSION`, `STYLE_TEMPLATE`

Tests:
- `STYLE_TEMPLATE` contains `'{{STYLE_NAME}}'` (placeholder not yet resolved)
- `STYLE_TEMPLATE` contains `'{{STAGING_DENSITY_BLOCK}}'`
- `STYLE_TEMPLATE` contains `'PHASE 2: STYLE TRANSFORMATION'`
- `STYLE_BLOCK_VERSION` matches format `'style@...'`

No conditional behavior -- it's a raw template string. The builder that fills placeholders is in `balanced_v5/visualization.prompt.ts` (not tested here).

---

### `constraint-hierarchy.ts`

Exports: `CONSTRAINT_HIERARCHY_BLOCK_VERSION`, `buildConstraintHierarchyBlock(injectedItemCount, hasRenovationAnchors)`

Tests:
- No injected item, no renovation: contains `'TIER 2 — INJECTED ITEM CONSTRAINTS [INACTIVE'`
- With injected item: contains `'TIER 2 — INJECTED ITEM CONSTRAINTS [ACTIVE'`
- With renovation anchors: contains `'TIER 2B — RENOVATION MATERIAL ANCHORS [ACTIVE'`
- No renovation anchors: contains `'TIER 2B — RENOVATION MATERIAL ANCHORS [INACTIVE'`
- Always contains `'TIER 1 — ARCHITECTURAL CONSTRAINTS'`
- Always contains `'TIER 4 — STYLE TRANSFORMATION'`
- Version constant format: `'constraint-hierarchy@...'`

Note: this is the BASE constraint hierarchy (no AGT line). The V7 AGT extension is in `balanced_v7/visualization.constants.ts` and already has a test in `pipelines/routing.test.ts`.

---

### `moodboard-scope.ts`

Exports: `MOODBOARD_SCOPE_BLOCK_VERSION`, `buildMoodboardScopeBlock(styleName, stagingDensity)`

Tests:
- Returns non-empty string for all three density tiers
- LOW tier: contains `'restraint'` (density protection suffix)
- HIGH tier: contains `'richness'` (density protection suffix)
- MEDIUM tier: does NOT contain either protection suffix
- All outputs contain `'MOODBOARD SCOPE'`
- All outputs contain `'Extract only abstract tone'`
- Version constant format: `'moodboard-scope@...'`

No empty-string path -- `buildMoodboardScopeBlock` always returns content. The caller (`pipelines/v5/index.ts`) gates on `hasMoodboards` before calling `buildMoodboardBlock`, which calls this function. The block itself does not gate.

---

### `influence.ts`

Exports: `INFLUENCE_BLOCK_VERSION`, `INFLUENCE_PRESET_STYLE_ONLY`, `DEFAULT_USER_REQUEST`, `V5_MOODBOARD_INFLUENCE_STATEMENT`

Tests:
- `INFLUENCE_PRESET_STYLE_ONLY` is a non-empty string
- `DEFAULT_USER_REQUEST` is `'No specific requests.'`
- `V5_MOODBOARD_INFLUENCE_STATEMENT` contains `'STYLE ANCHOR REMINDER'`
- `V5_MOODBOARD_INFLUENCE_STATEMENT` contains `'moodboard'`
- Version constant format: `'influence@...'`

No conditional behavior -- all are static string constants.

---

### `renovation-anchors.ts`

Exports: `RENOVATION_ANCHORS_BLOCK_VERSION`, `buildRenovationAnchorsBlock(selections)`

Tests:
- Empty selections `{}` returns `''` (empty string -- inactive contract)
- Single flooring selection: contains `'FLOORING'`, `'TIER 2B'`, the description string
- Multiple selections: contains correct count in header (e.g. `'2 anchors'`)
- Output contains `'COMPLIANCE: ALL active anchors below must be applied'`
- Output contains `'VISIBILITY GATE'`
- Output contains `'ANCHOR SELF-CHECK'`
- Output contains `'Non-negotiable'`
- Version constant format: `'renovation-anchors@...'`

The `ResolvedRenovationSelections` type is `{ flooring?: string; walls?: string; countertops?: string; cabinets?: string }`. Use simple string values as descriptions in test fixtures.

---

### `injected-items.ts`

Exports: `INJECTED_ITEMS_BLOCK_VERSION`, `INJECTED_ITEM_BLOCK_HEADER`, `INJECTED_ITEM_AUDIT_TEXT`

Tests:
- `INJECTED_ITEM_BLOCK_HEADER` contains `'INJECTED ITEM'`
- `INJECTED_ITEM_BLOCK_HEADER` contains `'IDENTITY PRESERVATION'`
- `INJECTED_ITEM_BLOCK_HEADER` contains `'PRESERVE'`
- `INJECTED_ITEM_BLOCK_HEADER` contains `'NEVER'`
- `INJECTED_ITEM_AUDIT_TEXT` contains `'Injected Item Identity'`
- `INJECTED_ITEM_AUDIT_TEXT` contains `'Tier 2'`
- Version constant format: `'injected-items@...'`

No conditional behavior -- both are static string constants.

---

### `agt-constraint.ts`

Exports: `AGT_CONSTRAINT_BLOCK_VERSION`, `buildAGTConstraintBlock(classifiedAGT)`

This is the most complex block. You need a `ClassifiedAGT` fixture. Import type from `../../../types/agt.js`.

A minimal `ClassifiedAGT` fixture with all fields suppressed:
```typescript
const suppressedAGT: ClassifiedAGT = {
    window_count: { enforcement: 'suppressed', displayValue: '0' },
    door_count: { enforcement: 'suppressed', displayValue: '0' },
    has_ceiling_fixture: { enforcement: 'suppressed', displayValue: 'ABSENT' },
    has_built_in_niches: { enforcement: 'suppressed', displayValue: 'ABSENT' },
    camera_perspective: { enforcement: 'suppressed', displayValue: 'unknown' },
    hard_fact_fields: [],
    advisory_fields: [],
    suppressed_fields: ['window_count', 'door_count', 'has_ceiling_fixture', 'has_built_in_niches', 'camera_perspective'],
    confidence_distribution: { high: 0, medium: 0, low: 5 },
};
```

A fixture with hard window fact:
```typescript
const hardWindowAGT: ClassifiedAGT = {
    window_count: { enforcement: 'hard', displayValue: '2', spatialAnchors: ['left wall (external_glazed)', 'rear wall (external_glazed)'] },
    door_count: { enforcement: 'suppressed', displayValue: '0' },
    has_ceiling_fixture: { enforcement: 'suppressed', displayValue: 'ABSENT' },
    has_built_in_niches: { enforcement: 'suppressed', displayValue: 'ABSENT' },
    camera_perspective: { enforcement: 'suppressed', displayValue: 'unknown' },
    hard_fact_fields: ['window_count'],
    advisory_fields: [],
    suppressed_fields: ['door_count', 'has_ceiling_fixture', 'has_built_in_niches', 'camera_perspective'],
    confidence_distribution: { high: 1, medium: 0, low: 4 },
};
```

Tests:
- Suppressed AGT: output contains `'ARCHITECTURAL GROUND TRUTH'`
- Suppressed AGT: output does NOT contain `'HARD FACTS'`
- Suppressed AGT: output contains `'Architectural constraints are enforced through Phase 1 rules below'`
- Hard window AGT: output contains `'HARD FACTS'`
- Hard window AGT: output contains `'EXACTLY 2 windows'`
- Hard window AGT: output contains `'VISIBILITY CONTRACT'`
- Hard window AGT: output contains `'left wall'` (spatial anchor)
- Advisory fixture (set `enforcement: 'advisory'` on a field): output contains `'ADVISORY OBSERVATIONS'`
- Advisory camera: output contains `'Camera perspective'`
- Version constant format: `'agt-constraint@...'`

---

### `agt-echo.ts`

Exports: `AGT_ECHO_BLOCK_VERSION`, `buildAGTEchoBlock(classifiedAGT)`

Use the same `ClassifiedAGT` fixtures as `agt-constraint.ts`.

Tests:
- Suppressed AGT (no hard facts): returns `''` (empty string -- inactive contract)
- Hard window AGT: returns non-empty string
- Hard window AGT: contains `'FINAL ARCHITECTURAL VERIFICATION'`
- Hard window AGT: contains `'EXACTLY 2'`
- Hard window AGT: contains `'architectural compliance failure'`
- Version constant format: `'agt-echo@...'`

---

### `conflict-clauses.ts`

Exports: `CONFLICT_CLAUSES_BLOCK_VERSION`, `buildConflictClausesBlock(clauses)`

Tests:
- `undefined` input returns `''` (inactive contract)
- Empty array `[]` returns `''` (inactive contract)
- Single clause: output contains `'STYLE-ARCHITECTURE CONFLICT RESOLUTION'`
- Single clause: output contains the clause text
- Single clause: output contains `'1.'` (numbered list)
- Multiple clauses: output contains `'2.'`
- Version constant format: `'conflict-clauses@...'`

---

### `density.ts`

Exports: `DENSITY_BLOCK_VERSION`, `getDensityBlockEntry`, `DENSITY_BLOCK_REGISTRY`

Tests:
- `getDensityBlockEntry('low')` returns non-null with `label: 'SPARSE'`
- `getDensityBlockEntry('medium')` returns non-null with `label: 'BALANCED'`
- `getDensityBlockEntry('high')` returns non-null with `label: 'LAYERED'`
- `getDensityBlockEntry('unknown')` returns null
- LOW block text contains `'negative space'`
- HIGH block text contains `'Rich'`
- Version constant format: `'density@...'`

---

## Engineering standards to follow

1. **Do not modify any existing source file.** Phase 6 is additive only.

2. **Do not modify any file under `services/`** (frozen archived pipelines).

3. **Import from the specific type files**, not the shim. Use `../../../types/agt.js` not `../../../types.js` when importing AGT types in test fixtures.

4. **File naming:** test files go in `prompts/blocks/__tests__/<block-name>.test.ts`. Use kebab-case matching the block filename.

5. **Test runner:** use `import test from 'node:test'` and `import assert from 'node:assert/strict'`. No external test framework.

6. **No Gemini API calls** in these tests. The blocks are pure string builders -- they do not call any external service.

7. **Keep tests small.** Each test file should be 30-80 lines. One test per behavioral contract. No over-engineering.

---

## Validation before you commit

Run all three checks from `apps/vis-service/`:

```bash
node_modules/.bin/tsc --noEmit     # must stay clean
npm run test:contracts              # must stay: 13/13
npm test                            # must increase from 7 to 7 + new tests
```

The test count will increase from 7 to approximately 7 + (7 to 10 tests per block file x 11 files) = roughly 80-110 total. As long as `fail 0`, you are good.

---

## Commit message format

```
refactor(phase-6): add unit tests for all 11 prompt block builders

Tests cover active behavior, inactive/empty-string contracts, and version
constant format for each block. All blocks under prompts/blocks/ now have
independent test coverage.

X/X tests pass. TSC clean. 13/13 contracts.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## What comes after Phase 6

Phase 6 completes the structural refactor. After it is done, the repo is ready for product feature work.

The next product priorities (from the strategic analysis in `docs/EXECUTIVE_SUMMARY.md`) are:

1. Run V6.0 vs V7.0 head-to-head regression to determine if AGT is net-additive over V6.
2. Apply the 4 pending V7 prompt fixes from `runs/run_20260505_164955/optimization_advice.md`.
3. Run a consumer preference test (blind A/B, naive users, no architectural framing).

These are product decisions owned by the product manager. Do not start them without explicit instruction.

---

## Key people and context

- **Product manager:** Charles (charles@reform-ai.com). Owns product direction, prompt philosophy, and the V7 strategic analysis. Built the original system through rapid experimentation. Not an engineer by background but deeply understands the system.
- **This repo:** `C:\Users\cjlea\AI-Projects\Visualization_Engine` on Charles's machine.
- **Memory files:** `C:\Users\cjlea\.claude\projects\C--Users-cjlea-AI-Projects-Visualization-Engine\memory\` for persistent context across sessions.

---

## Important rules you must never violate

1. Do NOT change pipeline mode key strings (`balanced_v7`, `balanced_v5`, etc.) -- they are the stable external API.
2. Do NOT modify any file in `apps/vis-service/src/services/` -- all frozen archived pipelines.
3. Do NOT rewrite or rephrase any prompt text in `prompts/blocks/` -- these are product assets that require regression testing to change.
4. Do NOT change behavior during structural work -- refactor phases are about structure only.
5. Every phase must pass TSC + contracts + unit tests before committing.

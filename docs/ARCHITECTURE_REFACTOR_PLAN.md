# Architecture Refactor Plan
**Date:** 2026-05-20
**Author:** AI Systems Architect
**Status:** Approved for Phase 1 execution

This document is the authoritative refactor plan for the Visualization Engine. It covers the full structural audit, proposed target architecture, prompt system strategy, pipeline design, engineering standards, and phased execution roadmap. It is written for an engineer taking over active development and should be read before any structural changes are made.

---

## Table of Contents

1. Repository Audit
2. Proposed Folder Structure
3. Prompt System Architecture
4. Pipeline Architecture Review
5. Engineering Standards
6. Refactor Roadmap
7. AI Product Architecture Perspective

---

## Part 1: Repository Audit

### 1.1 Current Structure Overview

```
Visualization_Engine/
├── apps/
│   ├── vis-service/            # Node/TypeScript backend (Fastify + Gemini)
│   │   └── src/
│   │       ├── contracts/      # Spawn-free contract validation tests
│   │       ├── controllers/    # HTTP handler (1 file)
│   │       ├── data/           # Static registries
│   │       ├── prompts/        # Prompt templates, 14 subdirectories
│   │       ├── schemas/        # Zod validation
│   │       ├── services/       # Pipeline implementations, 13 subdirectories
│   │       ├── types.ts        # Central domain types
│   │       └── utils/          # Utility functions
│   └── web-sandbox/            # React comparison UI (minimal)
├── docs/                       # Architecture and status documents
├── fixtures/                   # Regression test images
├── netlify/                    # Netlify proxy function
├── reform-ai-vis-sandbox/      # Archived implementation (pre-monorepo)
├── runs/                       # Regression run outputs
├── tests/                      # Regression test harness
└── Visualization_Engine_Baseline/ # Immutable historical snapshot
```

### 1.2 Request Lifecycle (Current)

```
HTTP POST /generate-visualization
  -> index.ts (Fastify server)
  -> controllers/main.ts (validateRequest, extractContractorId, catch errors)
  -> utils/formdata.utils.ts (parse multipart, validate, lookup styles, assemble params)
  -> services/geminiService.ts (dispatcher: resolve mode, log, route to handler)
  -> services/pipelineRouting.ts (resolvePipelineMode, resolveHandlerMode)
  -> services/<version>/geminiService.ts (pipeline-specific orchestration)
      [V7 only: services/agt/extractGroundTruth.ts (Gemini text pass)]
      [V7 only: services/agt/classifyAGTConfidence.ts]
      -> prompts/<version>/visualization.constants.ts (build blocks)
      -> prompts/<version>/visualization.prompt.ts (assemble prompt parts)
      -> services/shared/canonicalRequestComposer.ts (compose Gemini parts array)
      -> Gemini API (generateContent)
  -> HTTP response (base64 image + debug object)
```

### 1.3 What Is Well-Designed

**The dispatcher pattern** (`services/geminiService.ts`). A map of `PipelineMode -> handler function`, with a single routing call. Clean, testable, and easy to extend with a new pipeline.

**The AGT module** (`services/agt/`). Two files with single responsibilities: extraction and confidence classification. The separation between "what did Gemini observe" and "how do we enforce it" is correct. Good fallback design.

**The canonical request composer** (`services/shared/canonicalRequestComposer.ts`). Sequences the Gemini parts array in one place. V5 and V7 share this composition layer, which means the block ordering contract lives in one file and both pipelines benefit from the same structure.

**The pipeline routing module** (`services/pipelineRouting.ts`). Mode normalization and alias resolution in one file, contract-tested. The separation of `logMode` from `handlerMode` is correct for the V6 alias behavior.

**The data registries** (`data/styles.ts`, `data/roomTypes.ts`, `data/densityBlocks.ts`). Single sources of truth for product configuration. Typed, with normalized lookup functions. Correct architecture.

**The style object schema**. Separating `model_inputs` (what Gemini sees) from `pipeline_config` (what the system does) is the right abstraction. It makes styles both product-facing and machine-facing without mixing the two.

**Image role labels** (`prompts/imageRoles.ts`). Small, isolated, well-named. Prevents positional role inference in multi-image requests.

### 1.4 What Is Fragile

**Version explosion in services/**. There are 11 parallel pipeline service files. Each is 100-200 lines. Each duplicates the same boilerplate: `loadEnvFile`, `API_KEY` check, `new GoogleGenAI()`, `ai.models.generateContent(...)`, response parsing, and throw on no image. That pattern appears 11 times. A change to the Gemini model name, response parsing logic, or error handling requires touching 11 files. This is the highest maintenance risk in the codebase.

**The V5 constants file** (`prompts/balanced_v5/visualization.constants.ts`, 564 lines). This file is the effective foundation of the entire prompt system. It exports 8 distinct block builders: the structural part, the style template, the constraint hierarchy, the moodboard scope block, the renovation anchors block, the injected item blocks, the influence statement, and pass-through re-exports from older versions. Every V5+ pipeline depends on it. It has no modularity within itself. Adding or changing any prompt block requires editing a 564-line file that also contains every other block.

**Version explosion in prompts/**. There are 14 prompt subdirectories. V1 through V4.1 each have their own `visualization.constants.ts` and `visualization.prompt.ts`. These are frozen, but they still occupy the same namespace as the active canonical blocks and add cognitive overhead when navigating the prompt system.

**`utils/formdata.utils.ts` (129 lines)**. This file does four unrelated things in sequence: iterates multipart fields, buffers binary image data, runs Zod schema validation, and performs registry lookups (STYLE_REGISTRY, room type normalization). Parsing logic, validation logic, and business lookup logic are entangled. A change to the style lookup has to be made inside the same function as the multipart parser.

**`types.ts` (155 lines)**. Central type file with 14+ exports mixing V4 concerns (injected items), V6 concerns (catalogue, renovation selections), V7 concerns (AGT types), and core concerns (params, style preset). There is no feature grouping. A new engineer reading this file cannot tell which types are fundamental and which are feature-specific.

### 1.5 What Is Overly Complex

**The `balanced_v5/visualization.prompt.ts` and `buildVisualizationPrompt` function**. This function builds the structural part and style part by template substitution from a 70-line template string. The template has 15 placeholder variables. The function resolves density blocks, room type entries, style definitions, aperture look sanitization, and injected item audit blocks. It returns 6 values. This is too much logic for a "prompt builder."

**The V5/V7 service files are nearly identical**. The diff between `services/balanced_v5/geminiService.ts` (173 lines) and `services/balanced_v7/geminiService.ts` (199 lines) is approximately 30 lines: the AGT extraction call, the confidence classification call, and the three AGT-specific block builders. Everything else, including the Gemini API call and the entire debug object assembly, is a near-duplicate. The 170 lines of shared logic should not be duplicated.

**The re-export chain for shared primitives**. V7 imports from `prompts/balanced_v7/visualization.constants.ts`, which re-exports from `prompts/shared/canonicalPromptPrimitives.ts`, which re-exports from `prompts/balanced_v5/visualization.constants.ts`. That is three levels of re-export to reach the actual string constants. The shim files add indirection without adding isolation.

### 1.6 What Is Under-Abstracted

**The Gemini runner**. There is no shared Gemini execution layer. Every pipeline service initializes the API client at module load (`const ai = new GoogleGenAI({ apiKey: API_KEY })`) and calls `ai.models.generateContent(...)` directly. The model name (`gemini-2.5-flash-image`), response parsing logic, and error handling are all inlined per-service. Model routing, retries, and observability hooks would each require 11 changes.

**Prompt blocks**. Each block (structural, style, moodboard scope, constraint hierarchy, renovation anchors, AGT constraint, AGT echo, conflict clauses) is a distinct product artifact with its own behavior contract. They currently live as functions or constants within version-specific constants files. There is no canonical directory where all prompt blocks live together, no standard interface they conform to, and no documentation of what each block does, when it fires, and what inputs it requires.

**The catalogue feature**. `utils/catalogue.utils.ts` handles resolver logic. `data/catalogues.ts` is the in-memory store. `types.ts` holds the catalogue types. The catalogue is a coherent product feature (contractor-side renovation integration) but its implementation is spread across three unrelated directories. When the catalogue moves to a database, the change surface is unclear.

### 1.7 What Should Be Deleted or Isolated

**`reform-ai-vis-sandbox/`**. A pre-monorepo archived implementation. Not imported anywhere. Should be moved to an explicit `archive/` directory at the root or deleted if the historical reference is available in git.

**`Visualization_Engine_Baseline/`**. An immutable historical snapshot used as a comparison reference. Not imported anywhere. Same disposition as above.

**`tests/bedroom_regression/`, `tests/moodboard_regression/`, `tests/visualization_ab/`**. These appear to be older test harnesses predating the current `tests/regression/` runner. They should be audited: if the current regression runner covers their scenarios, delete them. If not, consolidate them into the current runner.

**Archived pipeline prompt files (V1 through V4.1)**. These 12 directories (6 under `prompts/`, 6 under `services/`) are frozen benchmarks. They should remain callable for regression comparison, but they should be clearly marked as archived and physically separated from the active prompt and service directories. Currently they sit at the same level as the active canonical files.

### 1.8 Technical Debt Summary

| Area | Severity | Description |
|---|---|---|
| Shared Gemini runner missing | High | 11 services duplicate API init, call, and response parsing |
| V5 constants file monolithic | High | 564-line file with 8 unrelated block builders |
| Version explosion in prompts/ and services/ | High | 26 dirs for 12 pipeline versions, active and archived mixed |
| formdata.utils.ts mixed concerns | Medium | Parsing, validation, and registry lookup entangled |
| types.ts mixed feature domains | Medium | V4/V6/V7 types not grouped or separated |
| Re-export chain for primitives | Medium | 3-level chain to reach V5 constants |
| Catalogue feature spread across 3 dirs | Medium | types.ts, data/catalogues.ts, utils/catalogue.utils.ts |
| tests/ directory fragmented | Medium | Multiple harnesses of unclear status |
| Root archive directories | Low | reform-ai-vis-sandbox, Baseline snapshot not explicitly labeled |
| Sparse test coverage | Low | 4 test files, ~125 lines total, no integration tests |

---

## Part 2: Proposed Folder Structure

The target structure has six principles: active code and archived code are physically separated; every feature owns its types; prompt blocks are first-class files; the Gemini execution layer is shared; all registries live in one place; and the request processing pipeline is decomposed.

```
apps/vis-service/src/
│
├── index.ts                        # Fastify server entry point
│
├── types/                          # Domain types, split by feature
│   ├── core.ts                     # GenerateVisualizationParams, StylePreset, InjectedItem
│   ├── agt.ts                      # ArchitecturalGroundTruth, ClassifiedAGT, ConfidenceLevel
│   └── catalogue.ts               # CatalogueItem, RenovationSelectionIds, ResolvedRenovationSelections
│
├── schemas/
│   └── visualization.schema.ts    # Zod input validation (unchanged)
│
├── api/
│   ├── routes.ts                   # Route declarations (extracted from index.ts)
│   └── handlers/
│       └── visualization.ts        # HTTP handler (from controllers/main.ts)
│
├── data/                           # Static product registries (unchanged structure)
│   ├── styles.ts                   # 18 style definitions
│   ├── density.ts                  # Staging density tier blocks (renamed from densityBlocks.ts)
│   ├── rooms.ts                    # Room type definitions (renamed from roomTypes.ts)
│   └── catalogue.ts                # Contractor catalogue -- in-memory POC (renamed)
│
├── prompts/                        # Prompt system
│   │
│   ├── blocks/                     # Atomic prompt block builders, one file per block
│   │   ├── structural.ts           # PHASE 1: Architectural anchoring + window preservation
│   │   ├── style.ts                # PHASE 2: Style transformation template builder
│   │   ├── constraint-hierarchy.ts # 6-tier constraint hierarchy block builder
│   │   ├── density.ts              # Staging density block selector (from densityBlocks registry)
│   │   ├── moodboard-scope.ts      # Moodboard extraction scope + density protection
│   │   ├── influence.ts            # Style/moodboard influence framing
│   │   ├── renovation-anchors.ts   # Tier 2B renovation material anchor block
│   │   ├── injected-items.ts       # Tier 2 injected item header and audit text
│   │   ├── agt-constraint.ts       # AGT hard fact block + visibility contract
│   │   ├── agt-echo.ts             # AGT final verification echo block
│   │   └── conflict-clauses.ts     # Per-style conflict resolution clauses
│   │
│   ├── image-roles.ts              # Image part label constants (unchanged)
│   └── primitives.ts               # Low-level text constants (influence presets, defaults)
│
├── agt/                            # Architectural Ground Truth module
│   ├── extract.ts                  # Gemini extraction call (from services/agt/extractGroundTruth.ts)
│   ├── classify.ts                 # Confidence classification (from services/agt/classifyAGTConfidence.ts)
│   └── types.ts                    # AGT-specific types (moved from types.ts)
│
├── catalogue/                      # Contractor catalogue feature (V6+)
│   ├── resolver.ts                 # ID resolution and validation (from utils/catalogue.utils.ts)
│   └── types.ts                    # Catalogue types (moved from types.ts)
│
├── request/                        # Request parsing and assembly
│   ├── parser.ts                   # Multipart field iteration and image buffering only
│   └── assembler.ts                # Param assembly: schema validation, style lookup, field normalization
│
├── runner/
│   ├── gemini.ts                   # Shared Gemini client init, generateContent call, response parsing
│   └── parts.ts                    # Image encoding, part sequence tracing (from services/shared/pipelineAssembly.ts)
│
├── pipelines/
│   ├── dispatcher.ts               # Pipeline map + routing entry point (from services/geminiService.ts)
│   ├── routing.ts                  # Mode resolution and alias handling (from services/pipelineRouting.ts)
│   ├── composer.ts                 # Canonical part sequence assembly (from services/shared/canonicalRequestComposer.ts)
│   │
│   ├── v7/                         # ACTIVE: Canonical production pipeline
│   │   ├── index.ts                # Orchestration: AGT extraction + block building + runner call
│   │   └── README.md               # What V7 does, what changed from V5, when to modify
│   │
│   ├── v5/                         # BENCHMARK: Frozen moodboard reference (V6 alias points here)
│   │   ├── index.ts                # Orchestration: block building + runner call (no AGT)
│   │   └── README.md               # Freeze notice and benchmark purpose
│   │
│   └── archived/                   # FROZEN: Historical regression anchors -- do not modify
│       ├── README.md               # Explains archived status and regression-only purpose
│       ├── baseline/
│       ├── v4_1/
│       ├── v4_0/
│       ├── v3_0/
│       ├── v2_2/
│       ├── v2_1/
│       ├── v2/
│       ├── v1/
│       └── improved/
│
└── contracts/
    └── runContracts.ts             # Spawn-free contract validation (unchanged)
```

### 2.1 Directory Definitions

**`types/`** -- Domain type definitions grouped by feature. `core.ts` holds types used by the entire system (`GenerateVisualizationParams`, `StylePreset`). Feature types live with their feature (`agt/types.ts`, `catalogue/types.ts`). Nothing in `types/` should import from services or pipelines.

**`data/`** -- Static product configuration. Style definitions, density blocks, room types, and the catalogue registry. These are the product's behavioral configuration. Engineers who do not understand the prompt system can still read and edit these files to change product behavior. Nothing here should contain request-handling logic.

**`prompts/blocks/`** -- One file per prompt block. This is the most important structural change in the entire refactor. Each block file exports: the block builder function, the input type it requires, a short JSDoc comment explaining what the block does and when it fires, and the template version it was introduced in. Blocks are composable, independently testable, and separately modifiable. Adding a new block means adding one file. Changing a block means editing one file without touching everything else.

**`agt/`** -- The AGT module stands alone. It has a clear boundary: it takes an image and returns structured facts about it. It does not know about pipelines, prompt composition, or Gemini generation. The module is defined by its types in `agt/types.ts`, its extraction logic in `extract.ts`, and its classification logic in `classify.ts`.

**`catalogue/`** -- The contractor catalogue feature owns its own directory. When the in-memory registry moves to a database, only `resolver.ts` changes. The feature boundary is explicit.

**`request/`** -- HTTP request processing separated from business logic. `parser.ts` is concerned only with multipart mechanics (field iteration, image buffering, binary handling). `assembler.ts` takes the parsed fields and resolves them against registries to produce `GenerateVisualizationParams`. These two concerns must not be in the same function.

**`runner/`** -- The shared Gemini execution layer. `gemini.ts` owns the API client, model selection, `generateContent` call, response parsing, and error handling. Every pipeline calls this shared runner rather than calling the Gemini SDK directly. When the model name changes, error handling changes, or a retry policy is added, it changes in one file.

**`pipelines/`** -- Pipeline orchestration only. Pipeline files call blocks, call the runner, and assemble debug objects. They do not contain prompt text, registry lookups, or request parsing. The active pipelines (`v7/`, `v5/`) are at the top level; archived pipelines are under `archived/`. The distinction is visible from the directory tree.

**What does NOT belong in each directory:**

| Directory | Does Not Belong There |
|---|---|
| `data/` | Request handling, prompt assembly, business logic |
| `prompts/blocks/` | Registry lookups, API calls, pipeline orchestration |
| `agt/` | Prompt composition, pipeline routing, catalogue logic |
| `catalogue/` | AGT logic, prompt assembly, request parsing |
| `request/` | Business logic, registry lookups beyond style/room resolution |
| `runner/` | Prompt assembly, AGT, pipeline-specific debug fields |
| `pipelines/v7/` | Prompt text (lives in blocks), registry data (lives in data/) |
| `pipelines/archived/` | Any modification at all |

---

## Part 3: Prompt System Architecture

### 3.1 The Core Problem

The prompt system is a product layer, not a code layer. It encodes behavioral contracts, constraint hierarchies, and design philosophy. It needs to be treated with the same discipline as product specifications: versioned, documented, independently testable, and organized for modification by someone who understands the product, not just the code.

Currently the prompt system is fragmented across 14 version-specific directories with no unified block vocabulary. The active canonical blocks (the ones that actually govern V7's behavior) are embedded in a 564-line file alongside deprecated blocks and re-exports from older versions.

### 3.2 Block Architecture

Each prompt block is an atomic unit with a single behavioral responsibility. The proposed `prompts/blocks/` directory contains 11 block files covering the full canonical block vocabulary:

```
structural.ts          -- Phase 1 architectural anchoring. Fixed elements list, window
                          preservation, exterior view preservation, artifact removal.
                          Fires on every request. Input: none (static text).

style.ts               -- Phase 2 style transformation. Template with 15 placeholder
                          variables. Fires on every request. Input: StylePreset, roomType,
                          textPrompt, density, injectedItemCount.

constraint-hierarchy.ts -- 6-tier constraint ordering declaration. Fires on every
                           request. Input: injectedItemCount, hasRenovationAnchors,
                           hasHardAGTFacts.

density.ts             -- Staging density block selector. Returns SPARSE/BALANCED/LAYERED
                          text from registry. Fires within style.ts builder.
                          Input: staging_density tier.

moodboard-scope.ts     -- Moodboard extraction scope + density protection suffix.
                          Fires only when moodboards are present.
                          Input: styleName, stagingDensity, hasMoodboards.

influence.ts           -- Style/moodboard influence framing. Fires on every request.
                          Input: moodBoardCount, styleInfluence, styleName.

renovation-anchors.ts  -- Tier 2B renovation material anchors. Fires only when
                          contractor catalogue selections are active.
                          Input: ResolvedRenovationSelections.

injected-items.ts      -- Tier 2 injected item header and audit block. Fires only
                          when an injected item is present.
                          Input: hasInjectedItem.

agt-constraint.ts      -- AGT hard facts block + visibility contract. Fires when any
                          AGT field has high or medium confidence. Input: ClassifiedAGT.

agt-echo.ts            -- Final verification echo. Fires only when at least one hard
                          fact exists. Input: ClassifiedAGT.

conflict-clauses.ts    -- Per-style conflict resolution clauses. Fires when the active
                          style defines conflict_resolution entries.
                          Input: string[] | undefined from StylePreset.
```

### 3.3 Block Conventions

Every block file follows the same structure:

```typescript
// Block: <block-name>
// Introduced: V<X>
// Fires when: <condition>
// Position in part sequence: <position from CANONICAL_BLOCK_SEQUENCE>
// Input contract: <what fields are required>

export interface <BlockName>Input { ... }

export const build<BlockName> = (input: <BlockName>Input): string => { ... }

// Returns empty string when the block should not fire.
// The pipeline composer checks for empty string and omits the part.
```

The empty-string contract is important. Blocks that are conditionally active return `''` when their condition is not met. The composer (`pipelines/composer.ts`) checks the returned value and skips empty parts. This keeps the block's firing condition inside the block file, not scattered across pipeline files.

### 3.4 Prompt Versioning

Prompt blocks have independent version numbers (format: `BLOCK_VERSION = 'structural@1.2'`). This allows tracking which block was active during a regression run, debugging unexpected behavioral changes, and correlating prompt changes with regression outcomes without needing to infer from git history.

Each block exports its version constant. The debug object assembled by the pipeline includes the active version of every block that fired in the request. When a regression regression shows unexpected behavior, the debug object identifies which block changed since the last known-good run.

### 3.5 Prompt Observability

The debug object currently captures `structuralPart` and `stylePart` as raw strings plus insertion flags for conditional blocks. The target state is to capture the version identifier for every block that fired, the input that was passed to each block builder, and whether each block was inserted or skipped. This makes the full prompt composition reproducible from the debug object alone without needing to re-run the pipeline.

### 3.6 Prompt Testing

Each block can be unit-tested in isolation by calling its builder with known inputs and asserting on the output string. This does not require a Gemini API call and can be part of the standard test suite. The current test coverage for prompt blocks is near zero; the block architecture makes it straightforward to add.

Regression-level testing (does the prompt produce good images?) remains human-scored and uses the existing regression runner. Unit tests validate that blocks produce the correct text; regression tests validate that the text produces correct visual behavior.

### 3.7 Experimentation Strategy

The block architecture enables safe experimentation. An experiment changes one block file. A feature flag (`ENABLE_SOFT_AGT_FALLBACK=true`) controls whether the experiment block or the production block is used. The pipeline composer selects the active block based on the flag. Experiments do not touch the pipeline orchestration file or any other block.

This is the structural prerequisite for running A/B experiments on individual prompt components without touching production pipeline code.

---

## Part 4: Pipeline Architecture Review

### 4.1 The Canonical Pipeline (V7) Simplified

After the refactor, `pipelines/v7/index.ts` should be the full orchestration logic for the active pipeline. Currently this is 199 lines. The target is approximately 60-70 lines containing only orchestration decisions:

```typescript
// pipelines/v7/index.ts

export const generateVisualization = async (
    params: GenerateVisualizationParams,
): Promise<PipelineResult> => {

    // Pre-generation: AGT extraction
    const rawAGT = await extractAGT(params.roomImage).catch(() => FALLBACK_AGT);
    const classifiedAGT = classifyAGTConfidence(rawAGT);

    // Pre-generation: Catalogue resolution
    const renovationSelections = await resolveRenovationSelections(params);

    // Block assembly
    const blocks = {
        structural:          buildStructural(),
        style:               buildStyle({ ... }),
        constraintHierarchy: buildConstraintHierarchy({ ... }),
        renovationAnchors:   buildRenovationAnchors(renovationSelections),
        moodboardScope:      buildMoodboardScope({ ... }),
        influence:           buildInfluence({ ... }),
        agtConstraint:       buildAGTConstraint(classifiedAGT),
        agtEcho:             buildAGTEcho(classifiedAGT),
        conflictClauses:     buildConflictClauses(params.stylePreset.conflict_resolution),
        injectedItems:       buildInjectedItems({ ... }),
    };

    // Part sequence assembly
    const parts = composeParts({ request: params, blocks });

    // Execution
    const { image, finishReason } = await callGemini(parts);

    // Result
    return { image, debug: buildDebug({ params, blocks, classifiedAGT, renovationSelections }) };
};
```

The pipeline file answers one question: what does this pipeline do that is unique? For V7 the answer is: AGT extraction before generation. Everything else is shared infrastructure.

### 4.2 Separation of Concerns per Layer

| Concern | Lives In |
|---|---|
| HTTP parsing and validation | `request/parser.ts`, `request/assembler.ts`, `api/handlers/` |
| Pipeline routing and dispatch | `pipelines/dispatcher.ts`, `pipelines/routing.ts` |
| Pre-generation processing (AGT, catalogue) | `agt/`, `catalogue/` |
| Prompt block construction | `prompts/blocks/` |
| Part sequence assembly | `pipelines/composer.ts` |
| Gemini API execution | `runner/gemini.ts` |
| Debug object assembly | Each pipeline's `index.ts` |
| Product configuration | `data/` |

No file should cross more than two layers. A pipeline file may call block builders and the runner. A block builder may call data registries. A data registry has no dependencies. This is the dependency rule.

### 4.3 Active vs Archived Pipelines

The codebase maintains 12 pipeline implementations for regression comparison purposes. This will continue. The change is organizational: active and archived pipelines are physically separated.

**Active pipelines** (`pipelines/v7/`, `pipelines/v5/`): These use the new block architecture and shared runner. They are updated when the prompt system evolves. They have README files explaining their purpose and what distinguishes them.

**Archived pipelines** (`pipelines/archived/`): These are frozen regression anchors. They are not migrated to the new block architecture. They keep their current implementation unchanged. They have a root-level `README.md` explaining their status and the rule against modification.

The dispatcher continues to route to archived pipelines by name. The only change is their directory location and an explicit naming convention.

### 4.4 Adding a New Pipeline

The new architecture makes adding a pipeline a defined procedure:

1. Create `pipelines/v8/index.ts` with the pipeline's unique orchestration logic
2. Import blocks from `prompts/blocks/` (or create new blocks for new behavior)
3. Add `balanced_v8` to the `PipelineMode` union in `pipelines/routing.ts`
4. Add the handler to `PIPELINE_HANDLERS` in `pipelines/dispatcher.ts`
5. Add a `README.md` explaining what V8 introduces and the acceptance criteria

There is no other change required. No 300-line file needs to be modified. No re-export chain needs updating.

### 4.5 Deprecating a Pipeline

Deprecating a pipeline means moving it from `pipelines/active/` to `pipelines/archived/` and adding a freeze note. The dispatcher continues to work. Regression tests continue to run. The mode key does not change. The change is a physical move and a documentation update.

---

## Part 5: Engineering Standards

### 5.1 Naming Conventions

**Files**: `kebab-case.ts`. No underscores in filenames. Current exceptions: `balanced_v2_1` (pipeline version directories) are acceptable because they encode version semantics, not general style.

**Exports**: `camelCase` for functions and constants, `PascalCase` for types and interfaces, `SCREAMING_SNAKE_CASE` for static configuration strings (prompt text constants).

**Block builders**: `build<BlockName>(input: <BlockName>Input): string`. Always `build` prefix, always typed input, always returns string. Conditional blocks return `''` when not active.

**Pipeline files**: `index.ts` in each pipeline directory. The pipeline directory name encodes the version (`v7`, `v5`, `archived/baseline`). The file inside is always `index.ts`.

**Registry lookups**: `get<Entity>Entry(key: string): Entry | null`. Returns null on miss, never throws.

**Version constants**: `PIPELINE_VERSION = 'balanced_v7'` and `TEMPLATE_VERSION = '7.0.0'` in each pipeline file. Block versions use `BLOCK_VERSION = '<block-name>@<semver>'`.

### 5.2 Pipeline Mode Keys

Pipeline mode keys are the stable external identifiers used by clients (the sandbox UI, regression runner, and API consumers). They must not change when the internal directory structure changes. Aliases (`balanced_v6 -> balanced_v5`) are defined in `pipelines/routing.ts` and are the only permitted way to provide backward-compatible mode changes.

### 5.3 Configuration Management

Environment variables: `API_KEY` (Gemini), `NODE_ENV`, `K_SERVICE` (Cloud Run signal). No other environment-dependent configuration. Secrets never in source.

Feature flags: defined as environment variables with boolean semantics (`ENABLE_SOFT_AGT=true`). The `request/assembler.ts` or the pipeline file reads the flag and selects the appropriate block or code path. Feature flags are documented in the pipeline's `README.md` alongside the experiment they gate.

Registry updates (new styles, new catalogue items, new room types): edit the relevant file in `data/`. No code changes required. The template and builder system reads dynamically.

### 5.4 Testing Standards

**Unit tests**: Every block builder gets a test file at `prompts/blocks/__tests__/<block-name>.test.ts`. Tests assert on the output string for known inputs. Tests verify that empty-string behavior fires correctly for conditional blocks. These tests do not call the Gemini API.

**Contract tests**: The current `contracts/runContracts.ts` is correct in principle and should continue to cover routing defaults, alias semantics, AGT classification, and constraint hierarchy insertion. Expand coverage to include new pipeline modes as they are added.

**Regression tests**: Human-scored visual regression using the existing runner (`tests/regression/run_regression.py`). Run after every pipeline change. Results stored in `runs/` with a manifest and report. The regression process is documented in `docs/EXECUTIVE_SUMMARY.md`.

**Integration tests**: Currently absent. The target is one integration test per active pipeline that calls the full stack with a fixture image, validates the debug object shape, and confirms an image is returned. This does not require scoring and can be automated.

### 5.5 Observability

Every response includes a `debug` object. The target debug object captures:

- `pipelineMode` and `templateVersion`
- For each block that fired: the block name, block version, and whether it was inserted or skipped
- For AGT: raw extraction result, confidence distribution, hard/advisory/suppressed field lists
- For catalogue: active anchor count, resolved selections
- For the Gemini call: model name, elapsed time, finish reason
- `requestStructure`: ordered list of part types (text/image) for tracing the parts array

The debug object should be structurally stable across requests for the same pipeline version. Adding a new field is fine. Removing or renaming a field is a breaking change that requires a version bump.

### 5.6 Documentation Standards

**`README.md` in each pipeline directory**: What this pipeline does, what problem it was designed to solve, what distinguishes it from the prior version, and what the acceptance criteria were. For archived pipelines: when it was frozen and why.

**`prompts/blocks/<block>.ts` JSDoc**: What behavioral contract this block enforces, when it fires, what input it requires, and what version introduced it.

**`data/styles.ts` entries**: The style object is self-documenting through its typed fields. Changes to style objects must be accompanied by a regression run note in the commit message identifying which styles changed and what the expected behavioral effect is.

**`docs/`**: High-level documents only. Architecture, status, executive summary, lessons learned, refactor plan. Not implementation documentation (that belongs in code comments and README files close to the code).

---

## Part 6: Refactor Roadmap

### Principles

The refactor must not break production. V7 is the active production pipeline and must remain functional after every phase. The regression runner must remain executable throughout. Phases are sequenced from lowest to highest risk.

The approach is build-alongside-then-cut-over, not big-bang rewrite. New structure is created alongside old structure. The active pipeline is migrated. Old structure is deleted only after tests pass.

### Phase 1: Create Block Architecture (No Behavior Change) -- COMPLETE 2026-05-20

**Commit:** `refactor(phase-1): extract prompt blocks into prompts/blocks/`

**Scope**: Extract the 11 prompt blocks from `balanced_v5/visualization.constants.ts` into individual files in `prompts/blocks/`. Update V5 and V7 constants files to import from the new block files. Net behavior: identical.

**Files changed**:
- Create `prompts/blocks/structural.ts` (extract `BALANCED_V5_STRUCTURAL_PART`)
- Create `prompts/blocks/style.ts` (extract style template + builder logic from `visualization.prompt.ts`)
- Create `prompts/blocks/constraint-hierarchy.ts` (extract `buildConstraintHierarchyBlock`)
- Create `prompts/blocks/moodboard-scope.ts` (extract `buildMoodboardScopeBlock`)
- Create `prompts/blocks/influence.ts` (extract influence constants)
- Create `prompts/blocks/renovation-anchors.ts` (extract `buildRenovationAnchorsBlock`)
- Create `prompts/blocks/injected-items.ts` (extract injected item constants)
- Create `prompts/blocks/agt-constraint.ts` (from `balanced_v7/visualization.constants.ts`)
- Create `prompts/blocks/agt-echo.ts` (from `balanced_v7/visualization.constants.ts`)
- Create `prompts/blocks/conflict-clauses.ts` (from `balanced_v7/visualization.constants.ts`)
- Update `prompts/shared/canonicalPromptPrimitives.ts` to import from `prompts/blocks/`
- Update `prompts/balanced_v5/visualization.constants.ts` to import from `prompts/blocks/`
- Update `prompts/balanced_v7/visualization.constants.ts` to import from `prompts/blocks/`

**Validation**: Run contract tests. Run regression preflight. Run the V7 regression against the baseline. Output should be byte-for-byte identical (identical prompt text, same block versions).

**Risk**: Low. This is a mechanical extraction with no logic change.

### Phase 2: Create Shared Gemini Runner -- COMPLETE 2026-05-20

**Commit:** `refactor(phase-2): extract shared Gemini runner into runner/`

**Scope**: Extract the `API_KEY`, `new GoogleGenAI()`, `ai.models.generateContent()`, response parsing, and throw-on-no-image pattern into `runner/gemini.ts`. Update V5 and V7 services to call the shared runner.

**Files changed**:
- Create `runner/gemini.ts` with `callGemini(parts: GeminiPart[]): Promise<{ image: string }>`
- Create `runner/parts.ts` (from `services/shared/pipelineAssembly.ts`)
- Update `services/balanced_v5/geminiService.ts` to use shared runner
- Update `services/balanced_v7/geminiService.ts` to use shared runner

**Validation**: Run the same tests as Phase 1. Add an integration test that calls the full stack with a fixture.

**Risk**: Low-medium. The runner wraps a Gemini SDK call, so the integration test is essential to confirm identical behavior.

### Phase 3: Split types.ts and formdata.utils.ts -- COMPLETE 2026-05-20

**Commit:** `refactor(phase-3): split types, request parsing, and catalogue feature`

**Scope**: Decompose the mixed-concern files. No behavior changes.

**Files changed**:
- Create `types/core.ts`, `types/agt.ts`, `types/catalogue.ts` (split from `types.ts`)
- Create `request/parser.ts` and `request/assembler.ts` (split from `utils/formdata.utils.ts`)
- Create `catalogue/resolver.ts` and `catalogue/types.ts` (from `utils/catalogue.utils.ts` and types)
- Update all import paths

**Validation**: TypeScript compilation. Contract tests. Regression preflight.

**Risk**: Low. TypeScript compiler will catch all import breakage immediately.

### Phase 4: Migrate Active Pipelines to New Directory Structure -- COMPLETE 2026-05-20

**Commit:** `refactor(phase-4): migrate active pipelines to pipelines/; move agt module`

**Scope**: Move the two active pipeline directories to the target structure. Move archived pipelines.

**Files changed**:
- Create `pipelines/v7/index.ts` (simplified from `services/balanced_v7/geminiService.ts`, using shared runner and block imports)
- Create `pipelines/v5/index.ts` (simplified from `services/balanced_v5/geminiService.ts`)
- Create `pipelines/dispatcher.ts` (from `services/geminiService.ts`)
- Create `pipelines/routing.ts` (from `services/pipelineRouting.ts`)
- Create `pipelines/composer.ts` (from `services/shared/canonicalRequestComposer.ts`)
- Move `services/baseline/`, `services/balanced/`, ... `services/balanced_v4_1/`, `services/improved/` to `pipelines/archived/` (unchanged internally)
- Add `pipelines/archived/README.md`
- Add `pipelines/v7/README.md` and `pipelines/v5/README.md`
- Update `services/geminiService.ts` dispatcher to import from new paths (or replace with new dispatcher)

**Validation**: Full regression run against baseline. All pipeline modes must remain callable by their existing mode keys. The sandbox UI must continue working.

**Risk**: Medium. The dispatcher imports all 12 services, so import paths must be updated carefully. TypeScript compiler catches all path errors, but the Gemini API calls must be validated with actual fixture runs.

### Phase 5: Clean Up Root Archive Directories and Test Harnesses -- COMPLETE 2026-05-20

**Commit:** `refactor(phase-5): clean up archives, test harnesses, and stale root docs`

**Scope**: Audit and dispose of pre-monorepo artifacts and duplicate test harnesses.

**Actions**:
- Audit `tests/bedroom_regression/`, `tests/moodboard_regression/`, `tests/visualization_ab/`: if all scenarios are covered by `tests/regression/`, delete them. If not, consolidate.
- Move `reform-ai-vis-sandbox/` and `Visualization_Engine_Baseline/` to an `archive/` directory at the root with a `README.md` explaining their status.
- Confirm `runs/` is in `.gitignore` (regression output should not be committed). If it is being committed intentionally, document why.

**Validation**: Confirm `tests/regression/run_regression.py` still runs. Confirm `.gitignore` is correct.

**Risk**: Low. No production code changes.

### Phase 6: Add Block-Level Unit Tests -- PENDING

**Scope**: Write unit tests for all 11 block builders. Add an integration test for V7 and V5 pipelines.

**Files to add**:
- `apps/vis-service/src/prompts/blocks/__tests__/structural.test.ts`
- `apps/vis-service/src/prompts/blocks/__tests__/style.test.ts`
- `apps/vis-service/src/prompts/blocks/__tests__/constraint-hierarchy.test.ts`
- `apps/vis-service/src/prompts/blocks/__tests__/moodboard-scope.test.ts`
- `apps/vis-service/src/prompts/blocks/__tests__/influence.test.ts`
- `apps/vis-service/src/prompts/blocks/__tests__/renovation-anchors.test.ts`
- `apps/vis-service/src/prompts/blocks/__tests__/injected-items.test.ts`
- `apps/vis-service/src/prompts/blocks/__tests__/agt-constraint.test.ts`
- `apps/vis-service/src/prompts/blocks/__tests__/agt-echo.test.ts`
- `apps/vis-service/src/prompts/blocks/__tests__/conflict-clauses.test.ts`
- `apps/vis-service/src/prompts/blocks/__tests__/density.test.ts`

See `docs/AGENT_HANDOFF.md` for detailed instructions, test patterns, and exact inputs/assertions required.

**Risk**: None. Additive only.

### Migration Checkpoints

| After Phase | Must Pass |
|---|---|
| Phase 1 | Contract tests, regression preflight, V7 regression vs baseline (scores unchanged) |
| Phase 2 | Integration test confirms Gemini call returns image |
| Phase 3 | TypeScript compilation clean, contract tests pass |
| Phase 4 | All 12 pipeline modes callable, sandbox UI functional, full V7 regression |
| Phase 5 | Regression runner functional, no broken test harness |
| Phase 6 | All new unit tests pass |

### Do Not Do

Do not migrate the internal structure of archived pipelines (V1 through V4.1). They are frozen. Their imports are fixed at the versions that were current when they were frozen. Changing their import paths introduces risk for no benefit -- these pipelines exist only for regression comparison.

Do not change pipeline mode key strings during the refactor. Mode keys are the stable external API. Internal directory restructuring must not change them.

Do not attempt Phases 3, 4, and 5 in the same commit. Each phase must be independently validated before the next begins.

---

## Part 7: AI Product Architecture Perspective

### 7.1 What Makes This System Different

This is not a standard CRUD API. The "business logic" is a probabilistic text-to-image system where the output cannot be deterministically verified, the inputs are multimodal (text + images), behavioral correctness requires human evaluation, and the system's primary product value is aesthetic quality, not functional correctness.

Standard software architecture principles (separation of concerns, testability, maintainability) apply, but they need to be grounded in the specific constraints of probabilistic generative systems.

### 7.2 Prompts as Infrastructure

In this system, prompt blocks are infrastructure, not configuration. They are the behavioral specification of the system. When a block changes, the system's behavior changes in ways that require human evaluation to assess. This is closer to changing a trained model's weights than changing a configuration value.

Consequences:
- Prompt changes must be tracked with the same rigor as code changes (version constants, regression runs, documented rationale)
- Prompt blocks should be as small and single-purpose as possible to limit the blast radius of any change
- The system should make it easy to compare outputs with and without a specific block change (the regression infrastructure already does this)
- Prompt changes that "look equivalent" are not necessarily equivalent -- the block architecture and version constants make this auditable

### 7.3 The Experimentation-Safety Tradeoff

The core product tension is: the system needs to support rapid prompt experimentation (the product is defined by iterating on prompts) while maintaining production stability (a bad prompt change can silently degrade output quality across all users).

The block architecture directly addresses this tension. Experiments are scoped to single blocks. Feature flags gate the experimental block independently from production. Regression tests validate that experimental changes do not regress known-good cases. Rollback is a one-file revert.

The current architecture has no mechanism for this -- experiments are made to shared prompt files and validated only through manual regression runs. The block architecture is not just cleaner code, it is the structural prerequisite for safe experimentation velocity.

### 7.4 Evaluation as a First-Class System

The regression framework (`tests/regression/`) is currently a test harness. At product scale, it needs to become a first-class evaluation system. The distinction:

A test harness validates that code is correct. An evaluation system validates that an AI system is behaving well. They have different inputs (fixtures vs. representative production samples), different outputs (pass/fail vs. scored distributions), and different update cadences (with every code change vs. periodically as the model evolves).

The architecture should reflect this. The current regression runner is well-designed for its scope. When the product scales, the evaluation system will need: production-representative sampling, blind evaluator workflows, multi-objective scoring (aesthetic delight plus architectural compliance), and a feedback loop from evaluation results back to prompt changes.

The block architecture enables this: each regression run can record which block versions were active, making it possible to correlate specific block changes with score changes across evaluation cycles.

### 7.5 Model Evolution

The current system is hard-coupled to Gemini 2.x via direct SDK calls in each service file. When the model changes (Gemini 3, alternative providers, fine-tuned variants), every pipeline service file requires an update.

The shared runner (`runner/gemini.ts`) is the correct isolation boundary. Model selection, API client configuration, and generation parameters live there. Pipelines call `callGemini(parts)` without knowing which model or SDK version is in use. Switching models is a one-file change.

Longer term, the runner can evolve to support model routing (route specific pipeline modes to specific models), A/B model testing (send 10% of V7 requests to a candidate model), and multi-provider fallback (fall back to a secondary model if the primary is unavailable). None of these require changes to pipeline files.

### 7.6 The Architecture Should Teach the System

The final and most important measure of success for this refactor is not test coverage or file count. It is this: can a new engineer open the repository, navigate to any part of the system, and understand what it does and why, without needing prior context?

The current system requires tribal knowledge to navigate. You need to know that `balanced_v5/visualization.constants.ts` is the canonical prompt foundation even though it is inside a version-specific directory. You need to know that V6 is an alias to V5. You need to know that `formdata.utils.ts` is actually doing more than parsing. You need to know that `services/shared/` is the active shared infrastructure while the 9 other service directories are frozen archives.

The target structure encodes all of this context. Active vs. archived is visible in the directory tree. Prompt blocks are named for what they do. Pipeline README files explain context that cannot be inferred from code. Types live with their features. The runner is a named concept, not an inlined pattern.

When the architecture is correct, the repository explains itself. That is the measure.

---

*This document should be updated after each phase of the refactor to reflect completed work. Completed phases should be marked with the date they were closed and the engineer who executed them.*

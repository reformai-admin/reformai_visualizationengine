# ReformAI Visualization — Phase 1 Execution Playbook

> **Status: ✅ COMPLETE**  
> Phase 1 goals were delivered through V4.0 and extended through V5.2.1.  
> This document is preserved as a historical execution plan. For current system state, see:  
> - `CURRENT_STATE.md` (root) — pipeline versions and test infrastructure  
> - `docs/reference-documents/V4_0_SYSTEM_AND_PRODUCT_SPEC.md` — canonical architecture spec  
> - `reform-ai-vis-sandbox/reform-ai-image-visualization-service/docs/CURRENT_STATE.md` — active pipeline tracker

---

## 1. Purpose

This document defines the execution plan for **Phase 1 of the visualization system**.

Time horizon: **2–3 weeks**  
Primary executor: **Claude Code**  
Primary constraint: **Do not change the current model (Gemini)**

### Objective

Improve the **reliability, controllability, and consistency** of the current Gemini-based visualization engine while introducing **foundational infrastructure** for a future multi-model system.

---

## 2. Phase 1 Goals

### Core Outcomes

- Improve spatial preservation (camera, geometry)
- Improve window/background consistency
- Improve furniture/reference preservation
- Reduce broken or low-quality outputs
- Eliminate silent failures
- Introduce retry and recovery behavior
- Introduce candidate generation and selection
- Establish session/state scaffolding
- Prepare codebase for multi-model expansion (without implementing it yet)

---

## 3. Non-Goals (Critical)

The following are explicitly **out of scope for Phase 1**:

- Replacing or migrating off Gemini
- Implementing full segmentation pipeline (SAM, etc.)
- Introducing ControlNet or SD pipelines in production
- Building full product/SKU injection system
- Full region-based editing system
- Large-scale frontend redesign

---

## 4. Current System Diagnosis

### Confirmed Issues

- Prompt-only control (no structural enforcement)
- Spatial drift (camera, geometry inconsistencies)
- Window/background corruption
- Furniture deformation and identity loss
- Style instability across selections
- No validation layer
- No retry or timeout handling
- No candidate reranking
- Style reference images not used in generation
- Weak multimodal input ordering
- Style influence overly coarse (bucketed)
- Stateless generation (no iteration path)

### Root Cause

The system relies entirely on **text prompts to enforce constraints**, which is insufficient.

---

## 5. Phase 1 Workstreams

### 5.1 Gemini Request Quality Improvements

#### A. Use Style Reference Image
Ensure stylePreset.imageUrl is included in generation requests.

#### B. Reorder Multimodal Inputs
Room Image → Style Image → Moodboard → Furniture → Prompt

#### C. Prompt Structure Upgrade
Use hierarchy:
STRUCTURE → WINDOWS → FURNITURE → FEATURES → MATERIALS → STYLE → RENDER

#### D. Constraint Clarity
Add explicit exclusions and reduce ambiguity.

---

### 5.2 Reliability Layer

- Timeout handling
- Retry logic
- Structured error handling
- No silent failures

---

### 5.3 Candidate Generation

- Generate 4–8 outputs
- Select best output
- Reject bad outputs

---

### 5.4 Output Validation

- Image validity
- Resolution check
- Basic corruption detection

---

### 5.5 Session Foundations

Store:
- original image
- working image
- history
- prompts

---

### 5.6 Style Safety

Define tiers:
safe / moderate / aggressive / experimental

Control influence and restrict risky styles.

---

## 6. Implementation Order

1. Map pipeline
2. Style image usage
3. Input ordering
4. Prompt upgrade
5. Timeout
6. Retry
7. Errors
8. Candidates
9. Validation
10. Style tiers
11. Session state

---

## 7. Target Files

- geminiService.ts
- visualization.prompt.ts
- constants.ts
- main.ts
- formdata.utils.ts

New:
- styles.config.ts
- retry.service.ts
- validation.service.ts
- session.service.ts

---

## 8. Guardrails

- Do NOT replace Gemini
- Avoid over-engineering
- Improve reliability first
- Keep system extensible

---

## 9. Success Criteria

- Better spatial consistency
- Better window preservation
- Fewer broken outputs
- Retry works
- Session works

---

## 10. Exit Criteria

- Stable outputs
- Style image used
- Retry + validation implemented
- Multi-candidate system live
- Session scaffolding live

---

## 11. Strategic Note

Phase 1 stabilizes the system. The long-term advantage comes from the control layer, not the model.

# ReformAI Visualization Engine — Current State
**Last Updated:** 2026-04-30

---

## 🚦 System Status: 🟢 FULLY OPERATIONAL

---

## 1. Pipeline Status

| Pipeline | Template | Status | Role |
| :--- | :--- | :--- | :--- |
| `balanced_v5` | **5.2.1** | ✅ **Active — production candidate** | Moodboard-aware; overlay relationship mode; structural anchoring |
| `balanced_v4_1` | 4.1 | 🔒 Frozen | ~21% compression vs V4.0; signature elements |
| `balanced_v4_0` | 4.0 | 🔒 Frozen | Constraint hierarchy + image role labeling introduced |
| `balanced_v3_0` | 3.1 | 🔒 Frozen | Template-driven injection; density registry |
| `baseline_original` | — | 🔒 Frozen | Untouched production baseline (regression anchor) |

Full version history: `reform-ai-vis-sandbox/reform-ai-image-visualization-service/docs/CURRENT_STATE.md`

---

## 2. What Has Been Built (V4.0 → V5.2.1)

### V4.0 — Constraint Hierarchy + Item Injection
- Explicit 6-tier constraint system declared before all other instructions
- Image role labeling (every image preceded by a role label text part)
- `InjectedItem[]` data model; max 1 item enforced at service layer
- Identity preservation block with PRESERVE / APPLY / NEVER structure
- Fidelity modes: `preserve` (user uploads) / `exact` (catalogue items)

### V4.1 — Compression + Signature Elements
- ~21% prompt compression vs V4.0
- Signature elements added to style definition and self-audit

### V5.0 → V5.1 — Lean Moodboard + Compression
- Moodboard introduced as a "bounded modifier" (TIER 5)
- Moodboard scope block inserted before moodboard images
- MOODBOARD_V5 role label (distinct from V4.x label)
- V5.1: ~36–40% prompt compression vs V5.0 / V4.1 — no behavioral changes

### V5.2 → V5.2.1 — Structural Hardening + Moodboard Refinement
- TIER 1 hardened: window/door count added as immutable; no-additions rule
- Structural violations: 0 (fixed from V5.1 regression — Industrial window additions)
- V5.2.1 Hybrid C patch: material leakage closed; floor-vs-ceiling paradox resolved
  via overlay relationship mode ("tints; does not compete")

---

## 3. Test Infrastructure

| Suite | Location | Coverage |
| :--- | :--- | :--- |
| Main regression (15 styles) | `tests/regression/` | Style quality, structural integrity, density |
| Bedroom regression | `tests/bedroom_regression/` | Bedroom-specific style + density |
| Moodboard regression | `tests/moodboard_regression/` | Bounded modifier behavior; V5.x moodboard validation |

All suites: AI evaluation (validity classifier + scoring) + HTML report + optimization advice.

Latest moodboard run: `tests/moodboard_regression/outputs/run_20260430_141837/` (V5.2 baseline)

**Next required run:** V5.2.1 moodboard regression to confirm Hybrid C fixes.

---

## 4. Project Map

### Active Service (`/reform-ai-vis-sandbox`)
- **Backend:** Fastify server (Port 8080) — `reform-ai-vis-sandbox/reform-ai-image-visualization-service`
- **Frontend:** Vite sandbox (Port 3333) — `reform-ai-vis-sandbox`

### Reference Baseline (`/Visualization_Engine_Baseline`)
Ground-truth production code. Used for regression comparison only. **Do not modify.**

### Documentation
- `docs/reference-documents/V4_0_SYSTEM_AND_PRODUCT_SPEC.md` — canonical architecture spec (V4.0 + V5.x appendix)
- `reform-ai-vis-sandbox/reform-ai-image-visualization-service/docs/CURRENT_STATE.md` — live pipeline version tracker
- `reform-ai-vis-sandbox/reform-ai-image-visualization-service/docs/V5_COMPRESSION_CHANGELOG.md` — full V5.x engineering changelog

---

## 5. Immutable Anchors (Do Not Modify)

- `/Visualization_Engine_Baseline` — Benchmarking source
- All frozen pipeline files (`balanced_v3_0`, `balanced_v4_0`, `balanced_v4_1`)
- `BALANCED_V5_STRUCTURAL_PART` — Structural protocol; requires full re-validation if changed

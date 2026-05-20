# Prompt System — Current State

> Last updated: 2026-05-04

## Active Pipeline Versions

| Pipeline Mode | Template Version | Status | Notes |
|---|---|---|---|
| `balanced_v5` | **5.2.1** | ✅ Active — V5.1 production candidate | Hybrid C micro-patch; overlay mode replaces presence floor |
| `balanced_v6` | **6.0.0** | 🧪 POC — Tier 2B Renovation Anchors | Alias for balanced_v5 + contractor catalogue integration |
| `balanced_v4_1` | 4.1 | 🔒 Frozen | ~21% compression vs V4.0; signature elements added |
| `balanced_v4_0` | 4.0 | 🔒 Frozen | Constraint hierarchy + image role labels introduced |
| `balanced_v3_0` | 3.1 | 🔒 Frozen | Template-driven injection layer; registry lookups |
| `balanced_v2_2` | — | 🔒 Frozen | Window immutability + aperture sanitizer |
| `balanced_v2_1` | — | 🔒 Frozen | Object placement + semantic furnishing rules |
| `balanced_v2` | — | 🔒 Frozen | Renovation framing + lighting preservation |
| `balanced_v1` | — | 🔒 Frozen | Structured anchoring + shell framing |
| `baseline_original` | — | 🔒 Frozen | Untouched production baseline |
| `improved_current` | — | 🔒 Frozen | Full structural sandwich (default fallback) |

---

## V6.0 Release — Tier 2B Renovation Material Anchors (2026-05-04)

**Objective:** Contractor catalogue POC — structured UI selections → validated catalogue items → model-ready Tier 2B prompt constraints. Extends V5.2.1 cleanly; no template text was modified.

**Architecture:**

- Tier 2B sits between Tier 2 (injected item identity) and Tier 3 (room function) in the constraint hierarchy
- When active: emits `[ACTIVE]` in the hierarchy block + a full per-anchor block (COMPLIANCE / VISIBILITY GATE / SCOPE / per-surface APPLY + BOUNDARY + NON-NEGOTIABLE + ANCHOR SELF-CHECK)
- When inactive: emits `[INACTIVE]`, no anchor block inserted — V5.2.1 behavior preserved exactly
- `balanced_v6` query mode is a sandbox alias that maps to `balanced_v5` internally; catalogue activates via `X-Contractor-Id` header + `renovationSelectionIds` FormData field

**Files added/changed:**

| File | Change |
|---|---|
| `src/types.ts` | Added `RenovationCategory`, `CatalogueItem`, `RenovationSelectionIds`, `ResolvedRenovationSelections`; extended `GenerateVisualizationParams` |
| `src/schemas/visualization.schema.ts` | Added `renovationSelectionIdsSchema` + field |
| `src/data/catalogues.ts` | NEW — in-memory POC registry; `contractor_demo`: 4 flooring, 4 walls, 3 countertops, 4 cabinets |
| `src/utils/catalogue.utils.ts` | NEW — translation layer: `resolveRenovationSelections()`, `hasActiveSelections()`, `CatalogueValidationError`; 6 validation rules per item |
| `src/prompts/balanced_v5/visualization.constants.ts` | `buildConstraintHierarchyBlock()` updated (optional `hasRenovationAnchors` param); `buildRenovationAnchorsBlock()` added; TEMPLATE_VERSION → 6.0.0 |
| `src/services/balanced_v5/geminiService.ts` | Integrates resolution + block building; anchor block at position 4.5; debug extended with 5 new fields |
| `src/utils/formdata.utils.ts` | Parses `renovationSelectionIds` JSON field; accepts `contractorId` param |
| `src/controllers/main.ts` | Reads `X-Contractor-Id` header; catches `CatalogueValidationError` as 400 |
| `src/index.ts` | CORS `allowedHeaders` + `/api/catalogue` GET route |

**Backward compatibility:** All prior callers of `buildConstraintHierarchyBlock(n)` work unchanged (`hasRenovationAnchors` defaults to `false`). When `renovationSelectionIds` is absent or `contractorId` is missing, all V6 code paths are skipped.

**Token cost:** ~645 tokens for a 4-anchor block (~25% total input increase). Retry rate — not token size — is the dominant cost driver.

---

## V5.x Release History (balanced_v5 pipeline)

### V5.2.1 — Hybrid C Micro-Patch (2026-04-30)

**Objective:** Close material leakage and moodboard suppression without expanding prompt complexity.

**Changes:**

- **TIER 5 rewritten** — presence floor removed entirely; replaced with relationship-mode overlay statement:
  `"Apply moodboard influence as a tonal overlay on top of the style — palette, light quality, and surface finish. It tints; it does not compete."`
  Eliminates floor-vs-ceiling paradox that caused Japandi SD regression and Contemporary overshoot in V5.2 regression.

- **Moodboard scope block: texture clarification added** —
  `'"Surface texture" refers to tactile quality only (rough/smooth, matte/gloss). It does NOT include material identity or architectural finishes.'`
  Closes material leakage failure mode triggered by "surface texture" semantic ambiguity.

**Net token change:** −2 lines (TIER 5) + 1 line (scope) = slight net reduction.

---

### V5.2 — Minimal Constraint Refinement (2026-04-30)

**Results of V5.2 regression (run_20260430_141837):**
- ✅ Structural violations: 0 (down from 2 in V5.1)
- Remaining issues: Japandi SD regression (presence floor), Contemporary × B scope overshoot

**Changes:**
- TIER 1 hardened — window/door count added to immutable list
- Fixed elements list — added "count"
- TIER 5 — presence floor added *(replaced in V5.2.1)*
- Moodboard scope block — 9-line block → single compressed statement

---

### V5.1 — Compression Passes (2026-04-29)

Compression-only. No behavioral changes. ~36–40% reduction vs V5.0/V4.1.
See `V5_COMPRESSION_CHANGELOG.md`.

---

### V5.0 — Lean Moodboard Release (initial)

- TIER 5 rewritten (no slider reference; named dimensions: palette, texture, lighting)
- Moodboard scope block introduced
- MOODBOARD_V5 label introduced

---

## Open Items

| Item | Status | Notes |
|---|---|---|
| V6.0 T1–T10 test plan | **Pending** | Run anchor compliance test suite; targets: flooring ≥85%, walls ≥85%, countertops ≥75%, cabinets ≥75% |
| V5.2.1 moodboard regression | Pending | Full suite to confirm material leakage closed and Japandi SD regression resolved |
| V5 Influence Statement removal | Pending regression | Flagged in `visualization.constants.ts`; remove after scope block confirmed sufficient |
| `stylePreset.imageUrl` activation | Deferred | Dead code confirmed; requires style reference image content before activation |
| Multi-item injected support | Deferred | V5 enforces max 1; multi-item planned for future version |
| LOW-density presence carve-out | Under observation | If V5.2.1 overlay framing still dilutes Japandi identity, consider density-conditional floor |
| Catalogue DB backing | Deferred | Current `catalogues.ts` is in-memory POC; swap for DB when `contractor_demo` compliance targets met |
| `CatalogueItem.imageUrl` activation | Deferred | Scaling trigger: activate image-based material references if countertop/cabinet compliance < 75% |

---

## V6.0 Validation Plan (T1–T10)

| Test | Description | Pass Criteria |
|---|---|---|
| T1 | Single flooring anchor only | Flooring surface matches promptDescription; no bleed |
| T2 | Single walls anchor only | All visible wall surfaces match; ceiling unchanged |
| T3 | Single countertops anchor only | Work surface matches; backsplash / cabinets unchanged |
| T4 | Single cabinets anchor only | Door/drawer faces match; no application to freestanding furniture |
| T5 | All 4 anchors simultaneously | Each surface independently compliant |
| T6 | Anchor + injected furniture item | Injected item identity preserved; anchors don't bleed onto injected item |
| T7 | Invisible component (no countertops visible) | VISIBILITY GATE fires; no hallucinated surface |
| T8 | Baseline regression (no renovationSelectionIds) | Output identical to V5.2.1; Tier 2B shows [INACTIVE] in debug |
| T9 | Invalid contractor ID | 404 response from /api/catalogue |
| T10 | Invalid item ID (cross-category) | 400 CatalogueValidationError |

Primary metric: first-pass compliance rate per category.
Check `debug.renovationAnchorsBlock` in API response to verify rendered prompt text.

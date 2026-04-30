# Prompt System — Current State

> Last updated: 2026-04-30

## Active Pipeline Versions

| Pipeline Mode | Template Version | Status | Notes |
|---|---|---|---|
| `balanced_v5` | **5.2.1** | ✅ Active — current production candidate | Hybrid C micro-patch; overlay mode replaces presence floor |
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

## V5.x Release History (balanced_v5 pipeline)

### V5.2.1 — Hybrid C Micro-Patch (2026-04-30)

**Objective:** Close material leakage and moodboard suppression without expanding prompt complexity.

**Changes:**

- **TIER 5 rewritten** — presence floor removed entirely; replaced with relationship-mode overlay statement:
  `"Apply moodboard influence as a tonal overlay on top of the style — palette, light quality, and surface finish. It tints; it does not compete."`
  Eliminates floor-vs-ceiling paradox that caused Japandi SD regression and Contemporary overshoot in V5.2 regression.

- **Moodboard scope block: texture clarification added** —
  `'"Surface texture" refers to tactile quality only (rough/smooth, matte/gloss). It does NOT include material identity or architectural finishes.'`
  Closes material leakage failure mode (travertine surround, wood slat panel) triggered by "surface texture" semantic ambiguity.

**Net token change:** −2 lines (TIER 5) + 1 line (scope) = slight net reduction. No new rules. No exclusion lists.

**V5.2 regression baseline:** 0 structural violations (held from V5.2). All V5.2 structural fixes remain in place.

---

### V5.2 — Minimal Constraint Refinement (2026-04-30)

**Objective:** Resolve moodboard validation failures from V5.1 regression suite.

**Results of V5.2 regression (run_20260430_141837):**
- ✅ Structural violations: 0 (down from 2 in V5.1)
- Industrial window additions fully resolved
- Remaining issues: Japandi SD regression (presence floor over-applying on LOW-density style), Contemporary × B scope overshoot

**Changes:**

- **TIER 1 hardened** — window/door count added to immutable list; new enforcement line: `"No additions regardless of style; no new structural elements may be introduced."`
- **Fixed elements list** — `"geometry, positions, and sizes"` → `"count, geometry, positions, and sizes"`
- **TIER 5 — style dominance** — `"Bounded modifier: palette direction, surface texture, lighting mood only."` → `"Style defines form and elements; moodboard modifies tone only."`
- **TIER 5 — presence floor added** — `"Moodboard influence must be applied to at least two primary surfaces."` + `"Conflict with style does not permit suppression below this minimum."` *(replaced in V5.2.1)*
- **Moodboard scope block** — 9-line block replaced with single compressed statement

---

### V5.1 — Compression Passes (2026-04-29)

Compression-only. No behavioral changes. All constraint coverage preserved.

- Phase 1: ~345 words removed (~23%) — redundancy elimination
- Phase 2: ~327 words removed (~14% of remaining) — phrase-level compression
- Combined: ~36–40% reduction vs V5.0 / V4.1
- MOODBOARD_V5 label compressed; full extraction detail moved to scope block

See `V5_COMPRESSION_CHANGELOG.md` for full accounting.

---

### V5.0 — Lean Moodboard Release (initial)

- TIER 5 rewritten (no slider reference; named dimensions: palette, texture, lighting)
- Moodboard scope block introduced (fires before moodboard images)
- MOODBOARD_V5 label introduced (distinct from V4.x MOODBOARD label)
- V5 influence statement added (flagged for removal post-regression)

---

## Open Items

| Item | Status | Notes |
|---|---|---|
| V5 Influence Statement removal | Pending regression | Flagged in `visualization.constants.ts`; remove after Test 2 + Test 3 confirm scope block is sufficient without it |
| `stylePreset.imageUrl` activation | Deferred | Dead code confirmed; requires style reference image content before activation |
| Multi-item injected support | Deferred | V5 enforces max 1; multi-item planned for future version |
| V5.2.1 moodboard regression | Pending | Run full moodboard suite against V5.2.1 to confirm material leakage closed and Japandi SD regression resolved |
| LOW-density presence carve-out | Under observation | If V5.2.1 overlay framing still dilutes Japandi identity, consider density-conditional influence floor |

---

## Regression Required Before V5.2.1 Production Deployment

1. Full moodboard suite (`run_moodboard.py`) against V5.2.1
2. Key cases: Japandi × A (SD should recover to 4+), Contemporary × B (scope overshoot should close), Industrial × A/C (structural integrity must hold)
3. Spot-check: no new material leakage on Moodboard B cases

# V5.x Prompt Engineering Changelog

> Pipeline mode: `balanced_v5` (unchanged — no new pipeline)
> Latest: 5.2.1 (2026-04-30)

---

## V5.2.1 — Hybrid C Micro-Patch

> Template version: 5.2 → 5.2.1
> Date: 2026-04-30
> Approach: Hybrid C (relationship-mode refinement)

### Objective

Close two residual failure modes from V5.2 without increasing prompt length or complexity:
1. **Material leakage** — travertine/wood-slat extraction via "surface texture" semantic ambiguity
2. **Floor-vs-ceiling paradox** — presence floor causing Japandi SD regression and Contemporary overshoot

### Design Decision: Hybrid C over Approach A (explicit) or Approach B (compressed)

Approach A (hard exclusion lists + style-specific guards) was rejected: enumerated exclusions are brittle — they close named paths while leaving adjacent unlisted paths open. At 80–120+ tokens they also work against the V5.1 compression philosophy.

Approach B's lines 2 + 3 were internally contradictory: "style wins" + "moodboard cannot be suppressed by style" is the same floor-vs-ceiling paradox reproduced in text. Spending ~45 tokens to create ambiguity is worse than the status quo.

Hybrid C targets the root cause in both cases with ~25 tokens total:

- **Root cause of leakage:** "surface texture" activates surface-treatment/finish mappings in the model. A direct lexical clarification severs that specific pathway without touching anything else.
- **Root cause of paradox:** The V5.2 presence floor specifies a *count* (two surfaces). What was missing was a *mode* specification — how moodboard influence is applied relative to style. "Overlay/tint" framing specifies the relationship mode, implicitly enforces presence, and prevents suppression without a count rule.

### Changes

**TIER 5 — `buildConstraintHierarchyBlock`:**

Before (3 lines):
```
TIER 5 — MOODBOARD INFLUENCE
  Style defines form and elements; moodboard modifies tone only. Does not override Tiers 1–4.
  Moodboard influence must be applied to at least two primary surfaces.
  Conflict with style does not permit suppression below this minimum.
```

After (1 line):
```
TIER 5 — MOODBOARD INFLUENCE
  Apply moodboard influence as a tonal overlay on top of the style — palette, light quality,
  and surface finish. It tints; it does not compete. Does not override Tiers 1–4.
```

**Moodboard scope block — `buildMoodboardScopeBlock`:**

Added line after existing extract statement:
```
"Surface texture" refers to tactile quality only (rough/smooth, matte/gloss).
It does NOT include material identity or architectural finishes.
```

**Net token change:** −2 lines (TIER 5) + 1 line (scope) = slight net reduction.

### Files Changed

| File | Change |
|---|---|
| `src/prompts/balanced_v5/visualization.constants.ts` | TEMPLATE_VERSION `5.2` → `5.2.1`; TIER 5 rewritten; scope block texture line added; changelog header updated |
| `src/services/balanced_v5/geminiService.ts` | `templateVersion: '5.2'` → `'5.2.1'` |

---

## V5.2 — Minimal Constraint Refinement

> Template version: 5.1 → 5.2
> Date: 2026-04-30
> Basis: Moodboard regression suite (run_20260429_171148)

### Objective

Fix structural violations and moodboard scope failures identified in V5.1 moodboard regression run.

**V5.1 regression failures addressed:**
- Industrial × A: added window (structural violation) — TIER 1 did not name window count
- Industrial × C: added window (structural violation) — same root cause; style prior loophole
- MCM × B: scope leakage (partial) — pre-existing; addressed in V5.2.1

### Changes

**Structural part — fixed elements list:**
- `"geometry, positions, and sizes"` → `"count, geometry, positions, and sizes"`

**TIER 1 — immutable summary:**
- `"window/door geometry"` → `"window/door count, geometry, and positions"`
- New enforcement line added: `"No additions regardless of style; no new structural elements may be introduced."`

**TIER 5 — style dominance:**
- `"Bounded modifier: palette direction, surface texture, lighting mood only."` → `"Style defines form and elements; moodboard modifies tone only."`

**TIER 5 — presence floor (added, later replaced in V5.2.1):**
- `"Moodboard influence must be applied to at least two primary surfaces."`
- `"Conflict with style does not permit suppression below this minimum."`

**Moodboard scope block (replaced 9-line block):**
- Old: "Apply to three dimensions only: palette direction, surface texture, lighting mood / Do NOT apply to: style category, core material family..." + conflict rule
- New: `"Extract only abstract tone (palette, texture quality, lighting). Discard all discrete elements, materials, and forms."`

**MOODBOARD_V5 label (imageRoles.ts):**
- Aligned with compressed scope language

**V5.2 regression results (run_20260430_141837):**
- ✅ 0 structural violations (resolved from 2)
- ⚠ Japandi × A and × C SD dropped 4-5 → 3 (presence floor over-applying on LOW density)
- ⚠ Contemporary × B new scope failure (presence floor + warm moodboard overshoot)
- Both trade-offs resolved in V5.2.1

### Files Changed

| File | Change |
|---|---|
| `src/prompts/balanced_v5/visualization.constants.ts` | TEMPLATE_VERSION `5.1` → `5.2`; TIER 1 hardened; scope block compressed; TIER 5 rewritten with presence floor |
| `src/prompts/imageRoles.ts` | MOODBOARD_V5 label updated |
| `src/services/balanced_v5/geminiService.ts` | `templateVersion: '5.1'` → `'5.2'` |

---

## V5.1 — Prompt Compression

> Template version: 5.0 → 5.1
> Pipeline mode: `balanced_v5` (unchanged — no new pipeline)
> Date: 2026-04-29

---

## 1. What Was Compressed and Why

V5.1 applies two compression passes to the V5.0 prompt. Neither pass removes behavioral rules — all constraint coverage, system hierarchy, and failure conditions are preserved.

### Phase 1 — Redundancy Removal

These are sections where the same constraint was enforced by two independent blocks. The weaker or more derivative block was removed.

| Block Removed | Words Saved | Reason |
|---|---|---|
| WINDOW IMMUTABILITY RULE + WINDOW SYSTEM INTEGRITY → merged to WINDOW PRESERVATION | ~110 | Two rules covering the same immutability target (individual window vs. continuous span). Merged into one section that covers both failure modes. |
| MIRROR PLACEMENT RULE | ~60 | A mirror without anchor furniture fails the Object Justification Rule's Functional Anchor test. The mirror rule was a specific instantiation of a gate already in place. |
| RENOVATION FEASIBILITY | ~30 | "Adapt materials to existing geometry" is already enforced by Phase 1 immutability. "Match material weight to surface type" had no documented regression history in V4.1. |
| Self-audit check 4 (full → back-reference) | ~40 | Four bullets listing windows, camera angle, walls, and fixtures repeated TIER 1 and Phase 1 verbatim. Replaced with: "Confirm no Phase 1 constraints were violated." |
| MOODBOARD_V5 label compression | ~30/image | Per-image extraction detail (sub-descriptors for each dimension) duplicated the scope block's permitted dimension list. Label retains role declaration and forbidden ceiling. |

**Phase 1 total: ~345 words (~23% of pre-compression prompt)**

---

### Phase 2 — Phrase-Level Compression

These changes tighten how existing rules are expressed. No rule logic is changed.

| Block | Change | Words Saved |
|---|---|---|
| Phase 1 Fixed Elements | Parallel list form; fixture type examples removed; two-sentence fixture note → one | ~22 |
| Artifact Removal | Bullet → inline sentence; "or staged alternatives" removed | ~15 |
| Exterior View Preservation | Third sentence (restatement of sentence 1) removed | ~15 |
| Constraint Hierarchy preamble | 3-sentence "higher tier wins" repetition → single line | ~23 |
| TIER 2 body | Bullet list → compact prose | ~23 |
| TIER 3–5 | Multi-bullet blocks → single inline rule per tier | ~12 |
| Style Conflict Resolution | 4-bullet list → inline sentence; movable lighting examples removed | ~30 |
| Phase 2 task block | "Task" + "Output" bullets merged to one | ~10 |
| Style Priority | "applied to" → "on"; "Avoid generic interpretations" removed (implied) | ~17 |
| Material Hierarchy | Sentences 2 + 3 (same claim expressed twice) → one merged sentence | ~25 |
| Lighting | Bullets 4 + 5 merged — "no new fixtures" and "use reflectivity" are two halves of the same instruction | ~12 |
| Self-audit preamble | "Run each check. Correct any failure before generating." removed — implied by block header | ~10 |
| Self-audit check 1 | "Would a viewer identify…" meta-question removed (not independently actionable) | ~8 |
| Self-audit check 2 | Negative restatement of the positive check removed | ~15 |
| Self-audit check 3 | LAYERED/BALANCED/SPARSE descriptions removed — already defined above; action tightened | ~24 |
| Moodboard scope block | Opener compressed; "Materials remain…" sentence removed; conflict rule tightened | ~22 |
| Density suffixes (both variants) | Final "Density is a protected style dimension." sentence removed; merged with semicolon | ~24 |

**Phase 2 total: ~327 words (~14% of remaining post-Phase-1 prompt)**

---

## 2. Expected Reduction Range

| Measurement | Value |
|---|---|
| Pre-compression baseline (V5.0, typical request, 3 moodboards) | ~1,505 words |
| Phase 1 savings | ~345 words |
| Phase 2 savings | ~327 words |
| **Combined reduction** | **~672 words / ~36–40%** |
| Post-regression (influence statement removal) | Additional ~60 words / ~4% |

Reduction scales with moodboard count: each additional moodboard saves ~30 more words from the compressed label.

---

## 3. Current V5 Prompt Philosophy

V5 was designed around a specific tension: the model needs enough constraints to be reliable, but too many constraints suppress creative quality. V5.1 optimizes for signal density — every line in the prompt should carry a constraint the model cannot infer from context.

**Core principles in V5.1:**

**Fewer repeated constraints.** A rule stated in Phase 1 does not need to be restated in the constraint hierarchy, the self-audit, and the conflict resolution block. Each rule has one authoritative location. Reinforcement is acceptable at the end-of-prompt self-audit level only — and only as a compact check, not as a re-enumeration.

**Higher signal density.** Each line should carry the maximum constraint information with minimum scaffolding. "Apply in strict priority order. TIER 1 overrides all; each tier overrides those below it." carries the same constraint as three sentences and 45 words. Scaffolding language ("the following", "this means that", "it should be noted") is pruned throughout.

**Bounded moodboard influence.** The moodboard scope block is the single authoritative source for what the model is and is not allowed to extract from moodboard images. It is reinforced in three places: TIER 5 (hierarchy ceiling), the scope block (operational instructions before images), and the MOODBOARD_V5 label (per-image role declaration). The V5 influence statement at the end is a fourth reinforcement, flagged for removal after regression confirms the three-point system is sufficient.

**Strict structural preservation.** The window preservation system, Phase 1 fixed elements, and TIER 1 are not compressed to the point of ambiguity. Windows are the highest-regression architectural element in the system — the merged WINDOW PRESERVATION section retains full coverage of both individual-window and continuous-span failure modes.

**Better balance between control and expressiveness.** The removal of the MIRROR PLACEMENT RULE and RENOVATION FEASIBILITY rules is deliberate. Both rules were either redundant with existing gates or too generic to add behavioral value. Their removal restores compositional decision-making space the model previously had closed off. This is especially meaningful for styles where mirrors are a signature element (Neoclassical, Glamour, Art Deco) and for high-density styles where material decisions need latitude.

---

## 4. Files Changed

| File | Change Type | Description |
|---|---|---|
| `src/prompts/balanced_v5/visualization.constants.ts` | Major rewrite | Structural part, style template, constraint hierarchy, moodboard scope block, density suffixes all updated. Template version bumped to 5.1. Re-exports for structural part and style template removed — both now defined inline. |
| `src/prompts/imageRoles.ts` | Targeted edit | `MOODBOARD_V5` label compressed. Original `MOODBOARD` label untouched. |
| `src/services/balanced_v5/geminiService.ts` | Targeted edit | `templateVersion` in debug output updated from `'5.0'` to `'5.1'`. |
| `docs/CURRENT_STATE.md` | Created | Active pipeline version tracker. |
| `docs/V5_COMPRESSION_CHANGELOG.md` | Created | This file. |
| `README.md` | Updated | V5.1 entry added to pipeline version table. |

**Files NOT changed (frozen):**
- `src/prompts/balanced_v4_1/visualization.constants.ts`
- `src/prompts/balanced_v4_0/visualization.constants.ts`
- `src/prompts/balanced_v3_0/visualization.constants.ts`
- All prior pipeline service files
- `src/prompts/balanced_v5/visualization.prompt.ts` — injection layer unchanged; placeholder names identical to V4.1
- `src/types.ts`, `src/schemas/`, `src/utils/` — no interface changes

---

## 5. Regression Notes

V5.1 is a compression-only change. All prior V5.0 regression scenarios apply. The following areas carry elevated regression risk due to specific compression choices:

### HIGH PRIORITY — Test Before Deploying

**Density behavior (high and low)**
- Risk: Self-audit check 3 no longer re-lists LAYERED/BALANCED/SPARSE tier descriptions. The model's final reference to density semantics is now the staging density block earlier in the prompt. If the model loses density calibration at generation time, this is the candidate cause.
- Test: Run Bohemian (high density) and Japandi/Minimalist (low density) scenarios. Compare V5.0 vs V5.1 object count and grouping behavior.

**Style recognition edge cases**
- Risk: Self-audit check 1 no longer asks "Would a viewer identify this as [style]?" The integrative meta-check may have contributed to holistic style evaluation.
- Test: Run Transitional, Coastal, or any style with an ambiguous material/palette overlap against a neighboring style. Compare V5.0 vs V5.1 recognizability.

### MEDIUM PRIORITY

**Moodboard conflict handling**
- Risk: MOODBOARD_V5 label is now shorter. The forbidden-dimension list in the label is compressed ("objects, furniture arrangements, spatial layouts, style category, or material family" instead of the full parenthetical descriptions). If the model over-extracts from moodboards, start here.
- Test: Run Test 3 (conflicting moodboard — warm earthy moodboard vs. cool modern style). Compare before/after.

**Structural integrity after window merge**
- Risk: WINDOW IMMUTABILITY RULE and WINDOW SYSTEM INTEGRITY were two named sections with distinct headings. The merged WINDOW PRESERVATION section covers both failure modes but is shorter. Verify the model does not regress on continuous-span fragmentation.
- Test: Use a source image with a wide continuous window band (e.g., floor-to-ceiling sliding doors or a panoramic window). Verify the span is not split.

### LOW PRIORITY (monitor)

**Mirror omission in high-signature styles**
- The MIRROR PLACEMENT RULE removal restores mirror placement latitude. Monitor whether outputs for Neoclassical, Glamour, or Art Deco styles now include appropriate mirrors. This is expected behavior improvement, not regression — but flag if mirrors appear without furniture anchors.

**Material weight decisions**
- RENOVATION FEASIBILITY removal ("match material weight to surface type") removes generic guidance. Monitor whether heavy materials appear on thin or ornamental features. Low probability — this guidance was non-specific and likely had minimal behavioral impact.

---

## 6. Future Engineer Warning

**Do not add back redundant safety language without regression evidence.**

The redundancies removed in V5.1 were identified through systematic audit against documented failure modes. If you observe a regression and your instinct is to re-add a rule that was removed, first confirm that:

1. The regression is reproducible and specific
2. The removed rule is the actual cause (not another block)
3. A targeted fix (adding one precise rule) is better than restoring the removed block

Adding broad safety language to compensate for a specific failure mode is how this prompt grew to 1,500 words in the first place.

**Do not expand the prompt unless a specific failure mode requires it.**

New rules should be additive only when you can name the failure they prevent. Rules added speculatively add prompt weight without behavioral value and reduce the model's creative decision space.

**Prefer compression and targeted fixes over broad new rules.**

If a rule is needed, make it as tight as possible. "Do not add divided panes, grids, or arches." is better than "Please ensure that all windows remain in their original geometric configuration and do not undergo any structural modification including but not limited to the addition of divided panes, decorative grids, arched treatments, or any other modification that would alter the original window's appearance."

The target signal density for this prompt is: every line enforces exactly one constraint the model cannot infer from context. Aim for that standard when writing new rules.

**Post-regression removal item:**

`V5_MOODBOARD_INFLUENCE_STATEMENT` in `visualization.constants.ts` is flagged for removal. After running Test 2 (aligned moodboard) and Test 3 (conflicting moodboard) with and without the statement, if outputs are indistinguishable, remove it. It currently adds ~60 words that duplicate the moodboard scope block.

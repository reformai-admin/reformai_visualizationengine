
> **Documentation Status Note (2026-05-11):** This reference document is historical design context. For implemented architecture, governance, and active workflows, see docs/PLATFORM_STATUS.md, ARCHITECTURE.md, and 	ests/regression/README.md.

# V7 Implementation Specification — Revision 1
## AGT as Confidence-Gated Architectural Evidence

**Version:** 7.0 Rev 1  
**Status:** Supersedes V7_IMPLEMENTATION_SPEC.md (7.0 Draft)  
**Revision Trigger:** Anti Gravity design critique — AGT hallucination cascade risk, confidence gating gap, relationship-capture gap, style conflict under-specification  
**Prepared:** 2026-05-05

---

## What Changed from the 7.0 Draft

The 7.0 Draft treated AGT extraction output as ground truth: a confident numeric count was injected as `EXACTLY N` and the generation model was expected to comply. Anti Gravity correctly identified that this design has a new failure mode the draft did not address: **if AGT extracts a wrong fact at high confidence, that wrong fact is system-authorized**. The generation model complies with the wrong count, the output is considered structurally correct by the system, and the failure is invisible.

The shift in this revision: **AGT is evidence, not truth.** Field-level confidence gates the enforcement strength. High-confidence facts become hard constraints. Medium-confidence facts become soft preservation guidance. Low-confidence facts are suppressed entirely. The generation model is never given a wrong number stated as absolute fact when confidence is below threshold.

All other V7 decisions are preserved. Two-call budget. No post-validation. Deferred items unchanged.

---

## 1. Updated V7 Objective

### Core Shift

**7.0 Draft framing:** AGT as ground truth — extract facts, inject as `EXACTLY N`, enforce.

**Rev 1 framing:** AGT as confidence-gated architectural evidence — extract facts with confidence, inject in proportion to confidence, enforce only where extraction is reliable.

The problem the 7.0 Draft did not account for: extraction accuracy and constraint compliance are different problems. A wrong confident fact is not just a missed correction — it is an active constraint enforcement of the wrong value. This is strictly worse than the V6.0 baseline for that field because V6.0 does not assert a wrong count.

Rev 1 solves this by making confidence a first-class schema property. The enforcement strength of each AGT field is a function of its confidence tier, not a binary inject/suppress decision.

### What V7 Rev 1 Solves

- Invented windows, doors, or structural openings (via high-confidence AGT count enforcement)
- Removed windows or doors (same)
- Hallucinated ceiling fixtures (via has_ceiling_fixture enforcement)
- Niche/alcove replacement (via has_built_in_niches enforcement)
- Catalogue renovation anchor material bleed (via anchor isolation clauses)
- **AGT hallucination cascade** — wrong extraction propagating as system-authorized constraint (via confidence gating: medium and low confidence never become hard facts)
- **Explicit AGT/style conflict resolution** — style directives that push against AGT-identified features now have deterministic resolution rules

### What V7 Rev 1 Explicitly Does Not Solve

Unchanged from 7.0 Draft, plus one addition:

- Window aspect ratio / proportion drift — deferred V7.1
- Mullion pattern drift — deferred V7.1
- Bathroom and tile-room style under-expression — deferred V7.1
- Camera FOV / perspective recalibration — deferred V8
- Refinement-pass accumulation drift — separate fix track
- **Architectural relationship capture** (window spacing, symmetry, relative positions, ceiling geometry) — Anti Gravity correctly identifies this as out of AGT scope; deferred V7.1 with explicit note in Section 10
- Post-generation structural validation — **decision documented in Section 9; deferred to V7.1**

---

## 2. Updated System Architecture

### Revised V7 Flow

```
Client Request
    │
    ▼
[1] processVisualizationFormData()
    │
    ▼
[2] extractArchitecturalGroundTruth()     — fast vision/text call
    │                                       returns: AGT with per-field confidence tiers
    │                                       on error: returns FALLBACK_AGT (all low confidence)
    ▼
[3] classifyAGTConfidence()               — NEW: pure function, no model call
    │                                       maps per-field confidence to enforcement tier:
    │                                       high → hard fact
    │                                       medium → soft advisory
    │                                       low → suppress
    ▼
[4] resolveRenovationSelections()         — unchanged (V6.0 catalogue)
    │
    ▼
[5] buildVisualizationPrompt()            — updated: receives classified AGT
    │                                       injects hard facts, advisories, and suppressions
    │                                       separately in prompt
    ▼
[6] Gemini generateContent()              — unchanged: single image generation call
    │
    ▼
[7] Return image + debug
       AGT document, confidence tiers, enforcement tier per field,
       fallback_fields[], hard_fact_fields[] all included in debug
```

Step [3] `classifyAGTConfidence()` is a pure function — no model call, negligible cost, runs synchronously between [2] and [5].

### Post-Validation Status

**Post-validation is not added in V7 Rev 1.**

Confidence gating at the injection layer is the primary safety mechanism. The reason is architectural, not just cost: a validation call finds failures after the generation cost has already been paid. Without a retry path (which requires a third call), validation becomes an expensive observation with no corrective action. With a retry path, total cost for the ~8% failure rate equals ~1.08 generation calls plus two additional model calls — economically worse than the current baseline.

The correct fix is preventing the failure, not detecting it. Confidence gating prevents AGT from authorizing wrong constraints. The residual failure rate (high-confidence wrong extractions) is tracked via debug output and measured against the acceptance criterion in Section 11. If production data shows the false-hard-fact rate exceeding 5%, lightweight validation is promoted to V7.1. **That threshold is the decision gate, not an arbitrary timeline.**

See Section 9 for the full validation decision rationale.

### Call Budget

| Call | Model | Purpose | Latency | Cost |
|---|---|---|---|---|
| 1 | Fast vision/text | AGT extraction | 250–400ms | ~1/80th of gen cost |
| 2 | gemini-2.5-flash-image | Image generation | 2,000–2,800ms | Unchanged |

Total: 2 calls. Budget ceiling maintained.

---

## 3. Updated AGT Schema

### Design Decision: Enum Confidence Over Float

Per-field confidence is represented as `'high' | 'medium' | 'low'`, not a float. Rationale: a float implies precision that the extraction model cannot deliver. An enum is honest about what the model can assess, maps cleanly to three distinct enforcement tiers, and is less likely to be calibrated inconsistently across fields.

```typescript
type ConfidenceTier = 'high' | 'medium' | 'low';

interface AGTField<T> {
  value:      T;
  confidence: ConfidenceTier;
}

interface ArchitecturalGroundTruth {
  window_count:                 AGTField<number>;   // integer ≥ 0
  door_count:                   AGTField<number>;   // integer ≥ 0
  has_ceiling_fixture:          AGTField<boolean>;
  has_built_in_niches:          AGTField<boolean>;
  camera_perspective:           AGTField<'straight_on' | 'corner' | 'angled'>;
  extraction_confidence_overall: ConfidenceTier;    // aggregate signal for debug/monitoring
  uncertain_fields:             string[];           // computed: fields with confidence 'low'
}
```

`uncertain_fields` is computed at classification time (Step [3]) as the list of field keys where `confidence === 'low'`. It exists for backward compatibility with suppression logic and debug output.

### Field Definitions

| Field | Type | Enforcement | Anti Gravity risk addressed |
|---|---|---|---|
| `window_count` | AGTField\<number\> | high → hard fact; medium → advisory; low → suppress | Hallucination cascade: wrong count only becomes hard fact at high confidence |
| `door_count` | AGTField\<number\> | high → hard fact; medium → advisory; low → suppress | Same |
| `has_ceiling_fixture` | AGTField\<boolean\> | high → hard fact; medium → advisory; low → suppress | Fixture hallucination in complex ceilings |
| `has_built_in_niches` | AGTField\<boolean\> | high → hard fact; medium → advisory; low → suppress | Niche replacement in cluttered/dark rooms |
| `camera_perspective` | AGTField\<enum\> | Never hard fact — soft advisory only regardless of confidence | Camera drift is low severity; wrong enforcement is medium severity |
| `extraction_confidence_overall` | ConfidenceTier | Debug/monitoring only; not injected | Aggregate signal for production failure tracking |
| `uncertain_fields` | string[] | Computed; drives suppression logic | — |

### FALLBACK_AGT (extraction failure)

```typescript
const FALLBACK_AGT: ArchitecturalGroundTruth = {
  window_count:                 { value: 0, confidence: 'low' },
  door_count:                   { value: 0, confidence: 'low' },
  has_ceiling_fixture:          { value: false, confidence: 'low' },
  has_built_in_niches:          { value: false, confidence: 'low' },
  camera_perspective:           { value: 'straight_on', confidence: 'low' },
  extraction_confidence_overall: 'low',
  uncertain_fields:             ['window_count', 'door_count', 'has_ceiling_fixture',
                                 'has_built_in_niches', 'camera_perspective'],
};
```

All fields are `low` — complete fallback to V6.0 behavior. No wrong values are injected.

---

## 4. Confidence Gating Rules

### Enforcement Tier Map

| Confidence | Enforcement Action | Prompt Language |
|---|---|---|
| `high` | Hard fact — inject as named value | `"Windows: EXACTLY N"` |
| `medium` | Soft advisory — inject as preservation guidance | `"Source appears to have approximately N window(s) — preserve this count"` |
| `low` | Suppress — field is not mentioned in AGT block | V6.0 prose constraint governs |

### High Confidence Requirements

A field should only be reported `high` by the extraction model if ALL of the following are true:
- The element is fully visible (not partially occluded by furniture or other objects)
- The count is unambiguous (no partial views through doorways that might hide additional instances)
- The image resolution and lighting are sufficient to confirm the count
- The model has no reasonable doubt about the classification

The extraction prompt explicitly instructs the model: **"When uncertain, report lower confidence. A wrong high-confidence count is actively harmful. An uncertain medium-confidence count degrades gracefully."**

### Calibration Bias

The extraction prompt is calibrated toward caution, not precision. The cost of a false `high` is higher than the cost of a false `medium` — a false `high` authorizes a wrong constraint; a false `medium` produces weaker guidance that the model may or may not follow. Therefore the bias is: prefer `medium` over `high` when uncertain between the two.

### Degradation Behavior

```
Confidence → 'high':   inject as hard fact (EXACTLY N / PRESENT / ABSENT)
Confidence → 'medium': inject as soft advisory ("appears to have approximately N")
Confidence → 'low':    omit from AGT block; V6.0 structural prose governs
Extraction call fails: all fields → 'low'; full V6.0 fallback, never blocks generation
```

### Image Complexity → Expected Confidence Degradation

Anti Gravity correctly identified that AGT accuracy degrades in complex inputs. Expected confidence profile by image type:

| Image Type | Expected Confidence | Expected Fallback Rate |
|---|---|---|
| Clean residential, well-lit | high on most fields | <10% fields fallback |
| Wide-angle rooms | medium on count fields | 30–50% count fields at medium/low |
| Low-light or high-contrast | low on most boolean fields | High fallback rate |
| Cluttered / busy spaces | medium/low | High fallback rate |
| Complex ceiling geometry | low on has_ceiling_fixture | Most fixture fields fallback |
| Open-plan / kitchen+living | medium on count fields | 40–60% fallback |
| Non-standard architecture | low across board | Full fallback likely |

This table is observational guidance for debugging. In production, the per-field confidence in the AGT debug output will reveal actual distribution. Monitor `hard_fact_fields` count per request.

---

## 5. Updated AGT Constraint Block

The block now emits three distinct sections based on confidence tier. All sections are clearly labeled so the generation model knows exactly which facts are measurements and which are advisories.

```typescript
function buildAGTConstraintBlock(agt: ArchitecturalGroundTruth): string {
  const hardFacts:   string[] = [];
  const advisories:  string[] = [];
  const resolutions: string[] = [];

  // ── Hard facts (high confidence) ──────────────────────────────────────────
  if (agt.window_count.confidence === 'high') {
    hardFacts.push(`Windows: EXACTLY ${agt.window_count.value}`);
    if (agt.window_count.value > 0) {
      resolutions.push(
        `→ Style requires more natural light: use reflective surfaces and lighter palette — never add openings`,
        `→ Style requires fewer openings: no mechanism exists — render exactly ${agt.window_count.value} window(s)`,
      );
    } else {
      resolutions.push(
        `→ This room has no windows. Do not add any. Achieve lighting through surface reflectivity.`,
      );
    }
  }
  if (agt.door_count.confidence === 'high') {
    hardFacts.push(`Doors: EXACTLY ${agt.door_count.value}`);
  }
  if (agt.has_ceiling_fixture.confidence === 'high') {
    hardFacts.push(`Ceiling fixture: ${agt.has_ceiling_fixture.value ? 'PRESENT' : 'ABSENT'}`);
    if (!agt.has_ceiling_fixture.value) {
      resolutions.push(
        `→ No ceiling fixture in source. Do not add one. Achieve style lighting through surface materials and any existing floor or wall fixtures.`,
      );
    }
  }
  if (agt.has_built_in_niches.confidence === 'high') {
    hardFacts.push(`Built-in niches/alcoves: ${agt.has_built_in_niches.value ? 'PRESENT' : 'ABSENT'}`);
    if (agt.has_built_in_niches.value) {
      resolutions.push(
        `→ Built-in niches must remain as niches. They cannot be replaced with windows, artwork, or blank wall.`,
      );
    }
  }

  // ── Medium confidence advisories ───────────────────────────────────────────
  if (agt.window_count.confidence === 'medium') {
    advisories.push(
      `Windows: source appears to have approximately ${agt.window_count.value} window(s) — preserve this count`,
    );
  }
  if (agt.door_count.confidence === 'medium') {
    advisories.push(
      `Doors: source appears to have approximately ${agt.door_count.value} door(s) — preserve this count`,
    );
  }
  if (agt.has_ceiling_fixture.confidence === 'medium') {
    advisories.push(
      `Ceiling fixture: source may ${agt.has_ceiling_fixture.value ? 'have' : 'not have'} a ceiling-mounted light — do not change fixture presence`,
    );
  }
  if (agt.has_built_in_niches.confidence === 'medium') {
    advisories.push(
      `Built-in niches: source may ${agt.has_built_in_niches.value ? 'contain' : 'not contain'} built-in recessed features — preserve them if present`,
    );
  }

  // ── Camera perspective (never a hard fact, always advisory) ────────────────
  if (agt.camera_perspective.confidence !== 'low') {
    advisories.push(
      `Camera perspective: ${agt.camera_perspective.value} — maintain consistent viewpoint`,
    );
  }

  // ── Assemble ───────────────────────────────────────────────────────────────
  const sections: string[] = [];

  sections.push('[ARCHITECTURAL EVIDENCE — EXTRACTED FROM SOURCE IMAGE]');
  sections.push('');

  if (hardFacts.length > 0) {
    sections.push('CONFIRMED FACTS (high confidence — treat as source measurements):');
    hardFacts.forEach(f => sections.push(`  ${f}`));
    sections.push('  These are measured. They cannot change under any instruction.');
    if (resolutions.length > 0) {
      sections.push('');
      resolutions.forEach(r => sections.push(`  ${r}`));
    }
    sections.push('');
  }

  if (advisories.length > 0) {
    sections.push('STRUCTURAL OBSERVATIONS (moderate confidence — preserve unless clearly wrong):');
    advisories.forEach(a => sections.push(`  ${a}`));
    sections.push('  These are observations, not measurements. If the source image contradicts an observation, source image takes precedence.');
    sections.push('');
  }

  if (hardFacts.length === 0 && advisories.length === 0) {
    sections.push('Extraction confidence was insufficient for all fields.');
    sections.push('Architectural constraints governed by the structural part below.');
    sections.push('');
  }

  return sections.join('\n');
}
```

### Example Output — Clean Room, High Confidence (2 windows, 1 door, no fixture, no niches)

```
[ARCHITECTURAL EVIDENCE — EXTRACTED FROM SOURCE IMAGE]

CONFIRMED FACTS (high confidence — treat as source measurements):
  Windows: EXACTLY 2
  Doors: EXACTLY 1
  Ceiling fixture: ABSENT
  Built-in niches/alcoves: ABSENT
  These are measured. They cannot change under any instruction.

  → Style requires more natural light: use reflective surfaces and lighter palette — never add openings
  → Style requires fewer openings: no mechanism exists — render exactly 2 window(s)
  → No ceiling fixture in source. Do not add one. Achieve style lighting through surface materials and any existing floor or wall fixtures.
```

### Example Output — Mixed Confidence (window count medium, fixture high)

```
[ARCHITECTURAL EVIDENCE — EXTRACTED FROM SOURCE IMAGE]

CONFIRMED FACTS (high confidence — treat as source measurements):
  Ceiling fixture: PRESENT
  These are measured. They cannot change under any instruction.

STRUCTURAL OBSERVATIONS (moderate confidence — preserve unless clearly wrong):
  Windows: source appears to have approximately 2 window(s) — preserve this count
  Camera perspective: straight_on — maintain consistent viewpoint
  These are observations, not measurements. If the source image contradicts an observation, source image takes precedence.
```

### Example Output — Full Fallback

```
[ARCHITECTURAL EVIDENCE — EXTRACTED FROM SOURCE IMAGE]

Extraction confidence was insufficient for all fields.
Architectural constraints governed by the structural part below.
```

---

## 6. Updated AGT Echo Block

The echo block at position N-1 states only **high-confidence hard facts**. Medium-confidence advisories are not re-echoed — they were stated once at position 3, which is sufficient. Repeating uncertain observations at the pre-generation position risks the model treating them as harder constraints than intended.

```typescript
function buildAGTEchoBlock(agt: ArchitecturalGroundTruth): string {
  const facts: string[] = [];

  if (agt.window_count.confidence === 'high') {
    facts.push(`${agt.window_count.value} window(s)`);
  }
  if (agt.door_count.confidence === 'high') {
    facts.push(`${agt.door_count.value} door(s)`);
  }
  if (agt.has_ceiling_fixture.confidence === 'high') {
    facts.push(`ceiling fixture ${agt.has_ceiling_fixture.value ? 'present' : 'absent'}`);
  }
  if (agt.has_built_in_niches.confidence === 'high' && agt.has_built_in_niches.value) {
    facts.push(`built-in niches present`);
  }

  if (facts.length === 0) return '';

  return [
    '[PRE-GENERATION REMINDER — CONFIRMED ARCHITECTURAL FACTS ONLY]',
    `Generate with: ${facts.join(', ')}.`,
    'These confirmed facts override all style instructions above.',
  ].join('\n');
}
```

If no fields have `high` confidence, the echo block is omitted entirely. No advisory facts appear in the echo block under any circumstances.

---

## 7. AGT vs Style Conflict Rules

Anti Gravity identified that AGT/style conflicts were under-specified. When a style directive pushes against an AGT-identified architectural feature, the resolution must be deterministic and not left to model judgment.

### Priority Order (deterministic, no model judgment)

```
1. AGT hard facts (high confidence)
2. TIER 1 — architectural constraints (always active)
3. TIER 2 — injected item constraints (if active)
4. TIER 2B — renovation anchors (if active)
5. TIER 3 — room function / spatial logic
6. TIER 4 — style transformation
7. TIER 5 — moodboard influence
8. TIER 6 — user text request
```

AGT hard facts sit above TIER 1 because they are source measurements that make TIER 1 explicit. They are not a separate tier — they quantify what TIER 1 is protecting.

### Conflict Resolution Rules

**Rule 1: AGT hard fact vs style directive**
If a style's aspirational quality (more light, more openness, more rawness) would require changing an AGT hard-fact value, the style aspiration must be satisfied through the permitted alternative defined in the style's `conflict_resolution` clauses. If no clause exists for the specific conflict, the AGT hard fact wins unconditionally. The output may score lower on style fidelity. This is acceptable — a structural failure is worse than a style miss.

**Rule 2: AGT advisory vs style directive**
Medium-confidence observations do not override style. If style pushes against an advisory, the advisory is treated as a preference, not a constraint. The generation model may resolve the conflict in favor of style. This is intentional — medium confidence means the observation may be wrong.

**Rule 3: AGT hard fact vs catalogue anchor (TIER 2B)**
Catalogue anchors specify materials for named surfaces. They cannot specify structural changes. If a catalogue selection conflicts with an AGT hard fact (e.g., an anchor description implies opening expansion), the anchor's material specification applies but its implied geometry change does not. The anchor is applied within the existing geometry.

**Rule 4: AGT hard fact vs injected item (TIER 2)**
Injected items can be placed in the room but cannot displace windows, doors, or niches identified by AGT. Placement must respect AGT-identified architectural features. An injected item that would require blocking or removing a high-confidence AGT feature must be placed elsewhere.

**Rule 5: Unidentified architectural features**
AGT captures only the 5 schema fields. Features outside the schema (wainscoting, ceiling beams, fireplace, built-in shelving that reads as furniture) are governed by TIER 1 prose constraints, not AGT. If the style pushes against these features, the TIER 1 "no structural elements may be introduced or removed" rule governs, but enforcement strength is the same as V6.0 (prompt-only, no named values).

### Style Conflict Resolution Examples

These examples belong in the style definitions' `conflict_resolution` field. They are presented here as specification for the implementer adding conflict clauses to `src/data/styles.ts`.

**Japandi**
```
- Natural light aspiration conflicts with window_count fact:
  Resolution: increase perceived light through pale palette (off-white, cream, warm grey),
  polished or satin-finish surfaces on floor and walls, and minimal window treatments (sheers only).
  Never add windows, skylights, or transparent walls. Never reduce furniture mass near windows
  to "open up" space if it would expose a windowless wall.

- Minimalism conflicts with has_built_in_niches fact (niches create visual complexity):
  Resolution: style the niche contents minimally (single object, maximum two).
  Never fill or remove the niche.
```

**Coastal**
```
- Brightness aspiration conflicts with window_count fact:
  Resolution: white or light-blue walls, high-sheen floor tile or light hardwood,
  sheer white curtains to suggest light permeability. Never enlarge openings.
  
- Indoor/outdoor connection conflicts with window_count or has_ceiling_fixture:
  Resolution: express through material palette (natural fiber, weathered wood, sea glass decor)
  and furniture placement near existing windows. Not through structural changes.
```

**Industrial**
```
- Raw/exposed structure aspiration conflicts with AGT-identified built-in features:
  Resolution: apply raw surface treatments (polished concrete paint, oxidized finish)
  to existing wall and floor surfaces. Never add exposed beams, columns, or ductwork
  not present in the source. Never remove built-in features.

- Open-plan feel aspiration conflicts with door_count or wall geometry:
  Resolution: use visual space strategies (low-profile furniture, open shelving, dark floors
  creating depth). Never remove doors or walls.
```

**Minimalist / Modern**
```
- Clean surface aspiration conflicts with has_built_in_niches (niches add visual noise):
  Resolution: style niche contents to minimum (empty or single sculptural object, no groupings).
  Never remove, fill, or conceal niches behind panels.

- Flush ceiling aspiration conflicts with has_ceiling_fixture:
  Resolution: if ceiling fixture is present (AGT confirmed), it may be styled as recessed
  or minimalist flush-mount within the fixture's existing location. Cannot be removed.
```

---

## 8. Failure Handling

### When AGT is Wrong (High-Confidence False Extraction)

This is the hallucination cascade case. The wrong value is injected as a hard fact. The generation model complies. The output is structurally wrong in a way the system cannot detect without a separate validation call (which V7 does not include).

**Mitigation in V7:** The extraction prompt is calibrated to bias toward `medium` confidence when uncertain. High confidence requires explicit unambiguous visual confirmation. The false-high rate is expected to be low on clean residential inputs.

**Detection in V7:** The debug output includes `hard_fact_fields[]` listing every field that was injected as a hard fact. Post-generation, a human scorer or the regression AI evaluation can observe that a hard constraint was set but violated. Over the regression test suite, the correlation between hard constraints and hard rejections tells us whether the constraint is helping or creating false authorizations.

**Correction path if rate is too high:** Lower the high-confidence threshold in the extraction prompt (reclassify more fields as `medium`). This degrades some hard facts to advisories but eliminates the hallucination cascade risk for those fields.

### When AGT is Low Confidence

All low-confidence fields are suppressed from the AGT block. V6.0 prose constraints govern. Generation quality for those fields is V6.0-equivalent, not below. The system never authorizes a wrong constraint from a low-confidence field.

### When AGT Conflicts with Visible Source Image Evidence

This case occurs when the generation model can see in the re-anchor image that the AGT fact is wrong (e.g., AGT says `window_count: 1` but the re-anchor image clearly shows 2 windows). The model's visual grounding from the re-anchor image should override the AGT text — this is correct behavior. The model is allowed to trust what it sees if it contradicts what it was told. **We do not suppress this behavior.** A model that refuses to believe its own visual input because of a text assertion is more brittle, not safer.

This is why `camera_perspective` is never a hard fact even at high confidence — it's an enum description, and the model's visual reading of the re-anchor image is more reliable for perspective judgment than the extraction text.

### When AGT Conflicts with Style

Handled by conflict resolution rules in Section 7. Priority order is deterministic. Style never overrides AGT hard facts. Style may influence medium-confidence observations.

### When AGT Extraction Call Fails Completely

`extractArchitecturalGroundTruth()` catches all errors (timeout, invalid JSON, model refusal, network failure) and returns `FALLBACK_AGT`. The generation call proceeds immediately. The failure is logged to the debug output under `agt_extraction_error`. **Generation is never blocked by an AGT failure.** Worst-case result: V6.0 behavior.

---

## 9. Lightweight Validation Decision

**Decision: No post-validation call in V7.**

**Rationale:**

Post-validation finds failures after the generation cost is paid. In V7 with confidence gating, the failure prevention mechanism is upstream (extraction confidence → injection tier). If AGT hard facts are accurate, architectural failures are prevented, not detected. If AGT confidence is low, the system already falls back to V6.0 — detection after the fact does not improve that outcome.

The specific scenario where validation would help: a high-confidence AGT hard fact is enforced but the generation model violates it anyway. This is model non-compliance with a stated constraint — a real possibility. However, without a retry path, validation only confirms the failure; it doesn't correct it. Adding validation without retry is an expensive observation.

**The decision gate for V7.1:** Track two metrics in production:
1. `hard_fact_compliance_rate` — how often the generation model violates a high-confidence hard fact (observable from regression runs + human scoring)
2. `false_hard_fact_rate` — how often a high-confidence field produces a wrong constraint (observable from regression runs by correlating hard facts with hard rejections)

If `hard_fact_compliance_rate < 85%` (model frequently ignores hard facts): the problem is constraint enforcement, not extraction accuracy. Validation won't help. Prompt architecture changes are needed.

If `false_hard_fact_rate > 5%` (AGT frequently makes wrong high-confidence claims): the problem is extraction calibration. Lower the high threshold in the extraction prompt before considering validation.

If both rates are acceptable and the residual hard-rejection rate is still >3%: **then** a lightweight validation call (count-only sanity check, not full structural comparison) is justified in V7.1.

**Why confidence gating is sufficient for V7:** It eliminates the hallucination cascade risk (wrong facts authorized as hard constraints) and preserves the benefit of correct hard facts. The residual risk — a correct hard fact that the model ignores — is measurable without a validation call. V7 ships with measurement tooling (debug flags), not validation tooling. The data from V7 production determines whether validation is needed.

---

## 10. Updated Failure Economics

Revised to incorporate Anti Gravity's identified failure classes. Ranked by (severity × likelihood).

### Fixed in V7

| Failure | Mechanism | Expected Rate After V7 |
|---|---|---|
| Invented windows (high-confidence extraction) | AGT window_count hard fact prevents count increase | Near zero on clean inputs |
| Removed windows | Same | Near zero on clean inputs |
| Ceiling fixture hallucination | AGT has_ceiling_fixture hard fact | Significantly reduced |
| Niche/alcove replacement | AGT has_built_in_niches hard fact | Significantly reduced |
| Catalogue material bleed | Anchor isolation clauses in Tier 2B block | Significantly reduced |

### Mitigated in V7 (not eliminated)

| Failure | Mitigation | Residual Risk |
|---|---|---|
| **AGT hallucination cascade** (NEW — Anti Gravity) | Confidence gating: wrong facts only become hard constraints at high confidence; biased toward conservative calibration | Residual: a genuinely confident wrong extraction. Expected rate <2% on clean inputs; higher on complex images |
| AGT/style conflict causing feature removal | Style conflict resolution clauses close specific paths | Residual: styles without conflict resolution clauses for the specific conflict. Mitigated by V6.0 TIER 1 prose |
| Invented windows (medium-confidence AGT) | Advisory language, not hard enforcement | Model may still ignore an advisory; V6.0-equivalent risk level |

### Deferred to V7.1

| Failure | Reason for Deferral |
|---|---|
| **Architectural relationship/spacing drift** (NEW — Anti Gravity) | AGT captures inventory, not geometry relationships. Window spacing, symmetry, and positional relationships require spatial extraction beyond count/boolean. V7.1 scope. |
| Window aspect ratio / proportion drift | Extraction error rate ~20–30% on single-image projections; wrong measurement is actively harmful |
| Mullion pattern drift | Low frequency, high extraction complexity |
| Bathroom / tile-room style under-expression | Requires room-type surface inventory and per-style surface map |
| Camera FOV drift | Sub-perceptual; not a hard-rejection trigger |
| Post-generation structural validation | Decision gate in Section 9; reconsider if V7 production data warrants |

### Accepted (do not address in V7 or V7.1)

| Failure | Reason for Acceptance |
|---|---|
| Intra-window geometric drift (non-count) | Blocked by aspect ratio extraction limitations; sub-perceptual to end users |
| Camera perspective recalibration | Low severity; not a hard-rejection trigger; camera_perspective is advisory only |
| Refinement accumulation drift | Separate fix track; independent of AGT architecture |

---

## 11. Updated Acceptance Criteria

### Primary: Hard Architectural Failure Rate

- **Target:** ≤2 hard rejections per 12-case regression
- **Measurement:** standard regression run with V7 pipeline
- **Specific validation:** Living Room + Japandi must not produce invented windows

### New: AGT Extraction Accuracy

- **Target (high-confidence precision):** ≥90% of fields reported as `high` confidence must match ground truth (verified manually from regression fixtures)
- **Target (false-hard-fact rate):** ≤5% of requests contain a high-confidence field that is factually wrong
- **Measurement:** run AGT extraction against all 12 regression fixture images, compare to manually labeled ground truth (window count, door count, fixture presence, niche presence)
- **Action if missed:** lower high-confidence threshold in extraction prompt; rerun benchmark

### New: Confidence Distribution

- **Target:** on clean residential inputs, at least 60% of window_count and door_count fields should return `high` confidence
- **Purpose:** ensures the mechanism is actually providing value; a system where everything is `medium` or `low` is equivalent to V6.0
- **Measurement:** aggregate across 12 regression fixtures

### New: Fallback Rate

- **Target:** no more than 30% of requests should have all count fields fall back to V6.0 behavior (all low/medium confidence)
- **Measurement:** debug output `hard_fact_fields[]` length per request, averaged over regression run
- **Action if missed:** AGT extraction prompt calibration adjustment

### Quality Preservation (unchanged from 7.0 Draft)

- **Target:** V7 average weighted score ≥ 4.11 (V6.0 average 4.21 − 0.10 tolerance)
- **Measurement:** AI evaluation in standard regression run; human scoring confirmation

### Latency (unchanged from 7.0 Draft)

- **Target:** ≤3.5s total (upload-trigger AGT) or ≤3.8s (generate-click AGT)
- **AGT timeout ceiling:** if extraction call exceeds 800ms, abort and use FALLBACK_AGT; do not wait

---

## 12. Implementation Checklist

### Changes to Existing V7 Files

These items delta from the 7.0 Draft spec. Complete the 7.0 Draft checklist first, then apply these changes.

**`src/services/agt/extractGroundTruth.ts`**
- [ ] Update `ArchitecturalGroundTruth` interface to use `AGTField<T>` wrapper with `confidence: ConfidenceTier`
- [ ] Update extraction prompt to include confidence tier instructions (see Section 4 rev)
- [ ] Add calibration bias language to prompt: prefer `medium` over `high` when uncertain
- [ ] Update `FALLBACK_AGT` to set all fields to `{ value: ..., confidence: 'low' }`
- [ ] Add `extraction_confidence_overall` field to return type and FALLBACK_AGT
- [ ] Add timeout: if extraction call exceeds 800ms, return FALLBACK_AGT

**`src/services/agt/classifyAGTConfidence.ts`** (new file, pure function)
- [ ] Create `classifyAGTConfidence(agt: ArchitecturalGroundTruth): ClassifiedAGT` function
- [ ] Compute `uncertain_fields[]` from fields with `confidence === 'low'`
- [ ] Compute `hard_fact_fields[]` from fields with `confidence === 'high'` (for debug output)
- [ ] No model call; pure transformation

**`src/prompts/balanced_v7/visualization.constants.ts`**
- [ ] Replace `buildAGTConstraintBlock()` with Rev 1 version (3-section output: hard facts, advisories, fallback header)
- [ ] Replace `buildAGTEchoBlock()` with Rev 1 version (high-confidence only)
- [ ] Inject only `hard_fact_fields` into echo block (medium advisories not echoed)

**`src/data/styles.ts`**
- [ ] Add `conflict_resolution: string[]` field to StylePreset interface (if not already added)
- [ ] Add conflict resolution clauses for: Japandi, Coastal, Industrial, Minimalist, Modern, Vintage, Bohemian
- [ ] Prioritize styles with documented style-pressure architectural failures first

**`src/prompts/balanced_v7/visualization.prompt.ts`**
- [ ] Add `{{STYLE_CONFLICT_CLAUSES}}` placeholder to STYLE CONFLICT RESOLUTION section
- [ ] Ensure placeholder resolves to empty string when `conflict_resolution` is absent

**`src/services/balanced_v7/geminiService.ts`**
- [ ] Add `classifyAGTConfidence()` call between AGT extraction and prompt assembly
- [ ] Pass classified AGT (not raw AGT) to `buildAGTConstraintBlock()` and `buildAGTEchoBlock()`
- [ ] Add to debug output: `agt_hard_fact_fields`, `agt_advisory_fields`, `agt_suppressed_fields`, `agt_extraction_confidence_overall`, `agt_extraction_error` (if applicable)

### New Tests Required

**AGT Confidence Gating**
- [ ] Unit: `buildAGTConstraintBlock` with all-high confidence emits CONFIRMED FACTS section
- [ ] Unit: `buildAGTConstraintBlock` with mixed confidence emits both CONFIRMED FACTS and OBSERVATIONS sections
- [ ] Unit: `buildAGTConstraintBlock` with all-low confidence emits fallback header only
- [ ] Unit: `buildAGTEchoBlock` omits medium-confidence fields
- [ ] Unit: `buildAGTEchoBlock` returns empty string when no high-confidence fields

**Extraction Accuracy Benchmark** (new test suite, not unit test)
- [ ] Run AGT extraction against all 12 regression fixture images
- [ ] Compare to manually labeled ground truth for each fixture
- [ ] Record precision per field at high/medium/low confidence
- [ ] Flag any fixture where high-confidence extraction is wrong (false hard fact)
- [ ] Target: ≥90% precision on high-confidence fields

**Conflict Resolution**
- [ ] Integration: Japandi style with 0-window room does not add windows
- [ ] Integration: Coastal style preserves existing niche (AGT high confidence) instead of replacing with window
- [ ] Integration: Industrial style does not add structural beams to source with no beams

### Regression Run Requirements

- [ ] Full 12-case regression: Baseline vs V7 (`config.yaml`: `mode: balanced_v7`, `slug: v7_0`)
- [ ] Include AGT extraction accuracy benchmark before regression run
- [ ] Verify `hard_fact_fields` in debug output for each case
- [ ] Verify Living Room + Japandi has no invented windows
- [ ] Verify at least 7/12 cases have at least one high-confidence hard fact (not all falling back)

---

## 13. Reference Summary for Future AI Agents

**Read this section to pick up V7 implementation work cold.**

### What This Document Is

This is Revision 1 of the V7 implementation spec for the interior visualization pipeline. It supersedes `V7_IMPLEMENTATION_SPEC.md` (7.0 Draft). The revision was triggered by Anti Gravity's critique of the 7.0 Draft.

### The Single Most Important Change from 7.0 Draft

The 7.0 Draft treated AGT extraction as producing ground truth: a confident count was injected as `EXACTLY N`. Rev 1 changes this to confidence-gated evidence. Each AGT field has a `confidence: 'high' | 'medium' | 'low'` property. Only `high` confidence fields become hard facts. `medium` becomes advisory language. `low` is suppressed entirely. The reason: a wrong high-confidence fact is strictly worse than no fact (it authorizes the wrong constraint). The extraction prompt is calibrated to bias toward `medium` when uncertain.

### The V7 Architecture (2 calls)

1. **AGT extraction call** (~300ms, fast text/vision model): extracts window_count, door_count, has_ceiling_fixture, has_built_in_niches, camera_perspective — each with a confidence tier. Returns `FALLBACK_AGT` on any failure.
2. **Image generation call** (unchanged): receives prompt with AGT block injected at position 3 (hard facts + advisories) and AGT echo at position N-1 (hard facts only). If FALLBACK_AGT, generation is identical to V6.0.

### What Is Hard vs Soft vs Suppressed

- High confidence → `EXACTLY N` (hard fact, stated as measurement)
- Medium confidence → `appears to have approximately N` (advisory, can be overridden by model's visual judgment)
- Low confidence → not mentioned in AGT block; V6.0 prose governs

### No Post-Validation

Deliberately excluded. Decision gate: if production data shows `false_hard_fact_rate > 5%` or `hard_fact_compliance_rate < 85%`, reconsider validation in V7.1. V7 ships with debug observability instead.

### What Is Deferred

Architectural relationship capture (window spacing, symmetry, ceiling geometry) — Anti Gravity critique; deferred V7.1. Window aspect ratios — extraction unreliable; deferred V7.1. Bathroom surface mapping — own work stream; deferred V7.1. Post-validation — decision gate above.

### Where the Code Lives

- AGT extractor: `src/services/agt/extractGroundTruth.ts` (new)
- AGT classifier: `src/services/agt/classifyAGTConfidence.ts` (new)
- V7 service: `src/services/balanced_v7/geminiService.ts` (new — do not modify balanced_v5 or balanced_v6)
- V7 constants: `src/prompts/balanced_v7/visualization.constants.ts` (new)
- Style conflict clauses: `src/data/styles.ts` — add `conflict_resolution` field to each style

### Last Regression Run

`runs/run_20260505_121132` — Baseline vs V6.0. V6.0: avg 4.21, 8/12 wins, 1 hard rejection. Baseline: avg 3.73, 1/12 win, 5 hard rejections. V7 targets: ≤2 hard rejections, avg score ≥ 4.11, ≥90% precision on high-confidence AGT fields.

### Frozen Files

All files in `balanced_v5/` and `balanced_v6/` are frozen. V7 work goes in new `balanced_v7/` files only. `pipelineMode: 'balanced_v7'` routes to the new V7 service via `src/services/geminiService.ts`.


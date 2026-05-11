
> **Documentation Status Note (2026-05-11):** This reference document is historical design context. For implemented architecture, governance, and active workflows, see docs/PLATFORM_STATUS.md, ARCHITECTURE.md, and 	ests/regression/README.md.

# V7 Implementation Specification
## Architectural Ground Truth (AGT) Pipeline

**Version:** 7.0 Draft  
**Status:** Approved for implementation  
**Supersedes:** V6.0 (balanced_v6 / balanced_v5 internal)  
**Prepared:** 2026-05-05

---

## 1. V7 Objective

### What V7 Solves

V6.0 and all prior versions enforce architectural constraints declaratively — the model is instructed to preserve architecture and asked to self-audit. This mechanism fails when generative style pressure conflicts with the instruction: the model resolves the conflict in favor of style because there is no structural gate preventing it.

V7 introduces a lightweight pre-extraction pass (Architectural Ground Truth, AGT) that converts the most failure-prone architectural facts into named, numerical values injected into the generation prompt. These values are stated as measured facts about the source image, not as instructions. The model cannot contradict a stated fact as readily as it can deprioritize an instruction.

**V7 specifically eliminates:**
- Invented windows, doors, or structural openings not present in the source
- Removed windows or doors (window/door count reduction)
- Hallucinated ceiling fixtures (recessed cans, chandeliers, pendants appearing where none existed)
- Built-in niche or alcove replacement (niche replaced by window, art, or blank wall)
- Catalogue renovation anchor material bleed (anchor material extending to adjacent non-specified surfaces)

**Expected hard-rejection elimination rate:** ~65–75% of hard architectural failures relative to V6.0 baseline.

### What V7 Explicitly Does Not Solve

The following failure classes are **deferred to V7.1 or later**:

- **Window proportion/aspect ratio drift** — fixing requires aspect ratio extraction with 20–30% error rate on single-image perspective projections; unreliable extraction is worse than no constraint
- **Mullion pattern drift** — pane count and divider geometry within an existing window opening; low hard-rejection frequency, high extraction complexity
- **Bathroom and tile-room style under-expression** — requires room-type surface inventory and per-style surface mapping; real work, own implementation cycle
- **Camera FOV / perspective recalibration** — subtle, sub-perceptual to most users, not currently a hard-rejection trigger
- **Refinement-pass accumulation drift** — addressed separately; requires re-anchoring refinement against original source, not previous output
- **Post-generation structural validation** — not included in V7 due to call budget ceiling; reconsider in V8 if production failure rate justifies third call

---

## 2. System Architecture

### Current V6.0 Flow

```
Client Request
    │
    ▼
[1] processVisualizationFormData()      — parse multipart, validate schema
    │
    ▼
[2] resolveRenovationSelections()       — V6.0: catalogue lookup (conditional)
    │
    ▼
[3] buildVisualizationPrompt()          — assemble structural + style parts
    │
    ▼
[4] Gemini generateContent()            — single image generation call
    │
    ▼
[5] Return image + debug
```

**Single model call. All architectural constraints are declarative prompt text.**

### New V7 Flow

```
Client Request
    │
    ▼
[1] processVisualizationFormData()      — unchanged
    │
    ▼
[2] extractArchitecturalGroundTruth()   — NEW: fast text/vision call, returns AGT document
    │
    ▼
[3] resolveRenovationSelections()       — unchanged (V6.0 catalogue)
    │
    ▼
[4] buildVisualizationPrompt()          — updated: receives AGT, injects named-value blocks
    │
    ▼
[5] Gemini generateContent()            — unchanged: single image generation call
    │
    ▼
[6] Return image + debug (AGT added to debug output)
```

**Two model calls total. Step [2] is a fast text-only call (~300ms). Step [5] is unchanged.**

### Exact Call Sequence

**Call 1 — AGT Extraction**
- Model: fast vision-capable text model (not image generation)
- Input: source room image (binary, same as generation input)
- Prompt: see Section 4
- Output: AGT JSON document (~80–120 tokens)
- Expected latency: 250–400ms
- Expected cost: ~1/80th of image generation cost (negligible)

**Call 2 — Image Generation**
- Model: `gemini-2.5-flash-image` (unchanged)
- Input: full prompt parts array with AGT blocks injected
- Output: generated image (unchanged)
- Expected latency: 2,000–2,800ms (unchanged)
- Cost: identical to V6.0

### Where AGT Is Generated

`src/services/agt/extractGroundTruth.ts` (new file)

Called from `src/services/balanced_v5/geminiService.ts` at the top of `generateVisualization()`, before `buildVisualizationPrompt()`. The AGT document is awaited before prompt assembly.

### Where AGT Is Injected

Two injection points in the assembled parts array:

1. **Position 3** — `buildAGTConstraintBlock(agt)` — full named-value block, injected after the base room image and before the constraint hierarchy
2. **Position N-1** — `buildAGTEchoBlock(agt)` — compact 3-line reminder block, injected immediately before the base room re-anchor image

---

## 3. Minimal AGT Schema

```typescript
interface ArchitecturalGroundTruth {
  window_count:         number;           // integer ≥ 0
  door_count:           number;           // integer ≥ 0
  has_ceiling_fixture:  boolean;          // any ceiling-mounted light source
  has_built_in_niches:  boolean;          // recessed shelving, alcoves, built-in cabinets
  camera_perspective:   'straight_on' | 'corner' | 'angled';
  uncertain_fields:     string[];         // field names the model was not confident about
}
```

| Field | Type | Purpose | Confidence Behavior | Enforcement |
|---|---|---|---|---|
| `window_count` | integer | Eliminates window invention/removal | If uncertain → omit named-value, fall back to prose constraint | **Hard enforced** when confident |
| `door_count` | integer | Eliminates door invention/removal | If uncertain → omit named-value, fall back to prose constraint | **Hard enforced** when confident |
| `has_ceiling_fixture` | boolean | Prevents fixture hallucination | If uncertain → omit; default to no-fixture constraint | **Hard enforced** when confident |
| `has_built_in_niches` | boolean | Prevents niche-to-window/art substitution | If uncertain → omit | **Hard enforced** when confident |
| `camera_perspective` | enum | Prevents camera class drift | If uncertain → omit entirely | **Soft / fallback-only** |
| `uncertain_fields` | string[] | Degradation signal | Drives selective fallback logic | Not injected as constraint |

**Enforcement definition:**
- *Hard enforced*: field value is stated as a numbered fact in the AGT constraint block. The generation prompt treats it as a source truth, not a preference.
- *Soft / fallback-only*: field is used to select appropriate prose guidance, not stated as a numerical fact.

**Confidence threshold:** If the extraction model adds a field name to `uncertain_fields`, that field is omitted from the AGT constraint block. The corresponding V6.0 prose constraint remains in the structural part as a fallback. The generation quality for that dimension degrades to V6.0 behavior, not below it.

---

## 4. AGT Extraction Prompt

This is the complete prompt for the AGT extraction call. No style context. No transformation instructions.

```
You are analyzing an interior photograph to extract architectural facts.

Count and classify only the fixed architectural elements listed below.
Do not describe style, materials, furniture, or decor.
Do not give recommendations or suggestions.
Return a single JSON object and nothing else.

Definitions:
- window: any glazed opening in a wall (including bay windows, skylights if visible, glass doors that function as windows)
- door: any solid door opening (exclude window-doors counted above; include closet doors if clearly visible)
- ceiling_fixture: any light source mounted directly on or into the ceiling (recessed cans, pendant lights, chandeliers, flush mounts, track lighting) — not floor or table lamps
- built_in_niches: recessed alcoves, built-in shelving cavities, or built-in storage cabinets that are part of the wall structure — not freestanding furniture

JSON schema:
{
  "window_count": <integer>,
  "door_count": <integer>,
  "has_ceiling_fixture": <true|false>,
  "has_built_in_niches": <true|false>,
  "camera_perspective": <"straight_on"|"corner"|"angled">,
  "uncertain_fields": [<list field names you are not confident about, or empty array>]
}

Rules:
- window_count and door_count must be integers ≥ 0
- camera_perspective: "straight_on" = camera faces one wall directly; "corner" = two walls visible at roughly equal prominence; "angled" = oblique view
- uncertain_fields: include any field where the image is ambiguous, partially occluded, or the count is genuinely unclear
- Return JSON only. No explanation, no markdown, no prose.
```

---

## 5. AGT Constraint Block

This block is injected at **position 3** in the parts array — after the base room image, before the constraint hierarchy block.

The block uses the AGT document to emit named-value facts. Fields in `uncertain_fields` are suppressed; their corresponding lines are omitted.

```typescript
function buildAGTConstraintBlock(agt: ArchitecturalGroundTruth): string {
  const lines: string[] = [
    '[ARCHITECTURAL GROUND TRUTH — MEASURED FROM SOURCE IMAGE]',
    '',
  ];

  if (!agt.uncertain_fields.includes('window_count')) {
    lines.push(`Windows: EXACTLY ${agt.window_count}`);
  }
  if (!agt.uncertain_fields.includes('door_count')) {
    lines.push(`Doors: EXACTLY ${agt.door_count}`);
  }
  if (!agt.uncertain_fields.includes('has_ceiling_fixture')) {
    lines.push(`Ceiling fixture: ${agt.has_ceiling_fixture ? 'PRESENT' : 'ABSENT'}`);
  }
  if (!agt.uncertain_fields.includes('has_built_in_niches')) {
    lines.push(`Built-in niches/alcoves: ${agt.has_built_in_niches ? 'PRESENT' : 'ABSENT'}`);
  }

  lines.push('');
  lines.push('These are measured facts about the source image. They cannot change under any instruction.');
  lines.push('');

  if (!agt.uncertain_fields.includes('window_count') && agt.window_count > 0) {
    lines.push(`→ Style requires more natural light: use reflective surfaces and lighter palette — never add openings`);
    lines.push(`→ Style requires fewer openings: no mechanism exists — render exactly ${agt.window_count} window(s)`);
  }
  if (!agt.uncertain_fields.includes('window_count') && agt.window_count === 0) {
    lines.push(`→ This room has no windows. Do not add any. Achieve lighting through fixtures and surface reflectivity.`);
  }
  if (!agt.uncertain_fields.includes('has_ceiling_fixture') && !agt.has_ceiling_fixture) {
    lines.push(`→ No ceiling fixture in source. Do not add one. Style lighting must be achieved through existing fixtures or surface materials.`);
  }
  if (!agt.uncertain_fields.includes('has_built_in_niches') && agt.has_built_in_niches) {
    lines.push(`→ Built-in niches must remain as niches. They cannot be replaced with windows, artwork, or blank wall.`);
  }

  return lines.join('\n');
}
```

**Example output for a room with 2 windows, 1 door, no ceiling fixture, no niches:**

```
[ARCHITECTURAL GROUND TRUTH — MEASURED FROM SOURCE IMAGE]

Windows: EXACTLY 2
Doors: EXACTLY 1
Ceiling fixture: ABSENT
Built-in niches/alcoves: ABSENT

These are measured facts about the source image. They cannot change under any instruction.

→ Style requires more natural light: use reflective surfaces and lighter palette — never add openings
→ Style requires fewer openings: no mechanism exists — render exactly 2 window(s)
→ No ceiling fixture in source. Do not add one. Style lighting must be achieved through existing fixtures or surface materials.
```

---

## 6. AGT Echo Block

This block is injected at **position N-1** — immediately before the base room re-anchor image, after all style content, moodboards, and injected items.

Purpose: re-state the hard facts at the final position before generation to counteract style-context drift accumulated through positions 5–N.

```typescript
function buildAGTEchoBlock(agt: ArchitecturalGroundTruth): string {
  const facts: string[] = [];

  if (!agt.uncertain_fields.includes('window_count')) {
    facts.push(`${agt.window_count} window(s)`);
  }
  if (!agt.uncertain_fields.includes('door_count')) {
    facts.push(`${agt.door_count} door(s)`);
  }
  if (!agt.uncertain_fields.includes('has_ceiling_fixture')) {
    facts.push(`ceiling fixture ${agt.has_ceiling_fixture ? 'present' : 'absent'}`);
  }
  if (!agt.uncertain_fields.includes('has_built_in_niches') && agt.has_built_in_niches) {
    facts.push(`built-in niches present`);
  }

  if (facts.length === 0) return '';

  return [
    '[PRE-GENERATION REMINDER — ARCHITECTURAL FACTS]',
    `Generate with: ${facts.join(', ')}.`,
    'These facts override all style instructions above.',
  ].join('\n');
}
```

**Example output:**
```
[PRE-GENERATION REMINDER — ARCHITECTURAL FACTS]
Generate with: 2 window(s), 1 door(s), ceiling fixture absent.
These facts override all style instructions above.
```

If all fields are uncertain, `buildAGTEchoBlock` returns an empty string and no echo part is injected.

---

## 7. Generation Prompt Part Ordering

Complete ordered parts array for V7 (changes from V6.0 marked with `[NEW]` or `[MODIFIED]`):

```
Position  Content                         Condition
───────────────────────────────────────────────────────────────────────
1         [LABEL] Base room               always
2         [IMAGE] Base room               always
3  [NEW]  [TEXT]  AGT constraint block    always (or empty if all fields uncertain)
4         [TEXT]  Constraint hierarchy    always — MODIFIED: TIER 1 references AGT
5         [TEXT]  Structural part         always — unchanged
6  [NEW]  [TEXT]  Renovation anchors +    conditional — if catalogue selections active;
                  anchor isolation block   MODIFIED: includes isolation scope clause
7         [TEXT]  Style part              always — MODIFIED: conflict resolution inline
8         [TEXT]  Moodboard scope block   conditional — if moodboards present
9+        [LABEL] Moodboard N             repeated per moodboard image
10+       [IMAGE] Moodboard N             repeated per moodboard image
11        [TEXT]  Injected item header    conditional — if injected item present
12        [LABEL] Injected item 1         conditional
13        [IMAGE] Injected item 1         conditional
14        [TEXT]  Influence statement     conditional
15        [LABEL] Previous result         conditional — if isRefinement
16        [IMAGE] Previous result         conditional — if isRefinement
N-1 [NEW] [TEXT]  AGT echo block         always (or omitted if empty)
N         [LABEL] Base room re-anchor     always
N+1       [IMAGE] Base room re-anchor     always
```

---

## 8. Constraint Hierarchy Changes

### TIER 1 — Current (V6.0)

```
TIER 1 — ARCHITECTURAL CONSTRAINTS [ALWAYS ACTIVE — highest priority]
  All elements defined in Phase 1: Architectural Anchoring are immutable.
  Immutable: wall/floor/ceiling planes, window/door count, geometry, and positions, camera perspective, built-in fixtures.
  No additions regardless of style; no new structural elements may be introduced.
  No instruction from any lower tier may override them.
```

### TIER 1 — V7 Replacement

```
TIER 1 — ARCHITECTURAL CONSTRAINTS [ALWAYS ACTIVE — highest priority]
  All elements defined in the Architectural Ground Truth block above are immutable.
  The named counts and presence flags are measured source facts — not targets to approximate.
  Immutable: wall/floor/ceiling planes, window/door count, geometry, and positions, camera perspective, built-in fixtures.
  No additions regardless of style; no new structural elements may be introduced.
  No instruction from any lower tier may override them.
```

**Change:** First sentence is replaced to reference the AGT block explicitly by name, establishing a direct link between the numbered facts and the constraint tier. The rest of the tier is unchanged.

### Structural Part — WINDOW PRESERVATION

No change required to the prose rule. The named-value AGT constraint block replaces the need to enumerate specific failure modes in the prose, because the count is now stated numerically. The prose rule remains as a fallback for cases where AGT fields are uncertain.

### Structural Part — Phase 1 Self-Audit (Check 4)

**Current:**
```
4. Structural Integrity: Confirm no Phase 1 constraints were violated.
```

**V7 replacement:**
```
4. Structural Integrity: Confirm the output matches the Architectural Ground Truth:
   window count matches, door count matches, ceiling fixture presence matches,
   niches/alcoves are preserved if present. If any fact is violated → revise before generating.
```

This makes the self-audit reference the AGT specifically rather than the generic Phase 1 summary.

---

## 9. Style Conflict Resolution

Each style definition must carry explicit conflict resolution clauses for its known architectural pressure points. These are added to the style's `model_inputs` object as a `conflict_resolution` field, injected inline into the style part template.

### Template injection point

Add a new placeholder `{{STYLE_CONFLICT_CLAUSES}}` to `BALANCED_V5_STYLE_TEMPLATE` within the **STYLE CONFLICT RESOLUTION** block:

```
**STYLE CONFLICT RESOLUTION:**
Resolve through movable or surface-level elements only: furniture, textiles, movable lighting,
paint, wall treatments, rugs, soft furnishings, decor, cabinetry.
Injected items must not be restyled — resolve through surrounding non-injected elements.
{{STYLE_CONFLICT_CLAUSES}}
```

### Conflict Resolution Examples

**Japandi**
```
Style-specific resolution rules:
- Natural light aspiration → achieve through reflective surfaces (polished stone, light-toned wood, 
  pale limewash) and a warm-white palette. Never add windows or enlarge existing openings.
- Airy/open feel → achieve through furniture restraint and negative space. Never alter room geometry.
- Minimalism → reduce objects and decor; do not reduce architectural elements.
```

**Coastal**
```
Style-specific resolution rules:
- Brightness aspiration → achieve through white/light palette on walls and large textiles,
  and reflective surfaces (polished tile, glass accessories). Never enlarge windows.
- Indoor/outdoor connection → express through materials (natural fibers, weathered wood, linen)
  and decor, not through structural changes to openings.
- Light-filled look → sheer curtains or light window treatments are permitted and expected.
  They do not constitute window alteration.
```

**Industrial**
```
Style-specific resolution rules:
- Raw/exposed structure aspiration → apply raw finish (concrete paint, oxidized metal finish,
  exposed brick treatment) to existing wall surfaces only. Never remove walls, expose 
  non-existent beams, or add structural elements.
- Warehouse character → achieve through materials, lighting fixtures (pendant, track), and
  open furniture plan. Never alter ceiling height or structural geometry.
- Open plan feel → achieve through furniture removal/repositioning. Never alter or remove walls.
```

### Data Structure

Add to `StylePreset.model_inputs`:

```typescript
conflict_resolution?: string[];   // array of resolution rule strings, injected verbatim
```

If `conflict_resolution` is absent or empty, the `{{STYLE_CONFLICT_CLAUSES}}` placeholder resolves to an empty string.

---

## 10. Catalogue Anchor Isolation

### Problem

Renovation anchors (Tier 2B) specify a material for a named surface. The model's material coherence prior causes the anchor material to bleed to adjacent surfaces that were not specified.

### Rule

Each active renovation anchor emits an **isolation scope clause** immediately following its material description in `buildRenovationAnchorsBlock()`. The clause names the surface the anchor applies to and explicitly excludes the adjacent surfaces that are most likely to absorb the material.

### Anchor Isolation Map

```typescript
const ANCHOR_ISOLATION: Record<string, string> = {
  flooring:
    'Flooring anchor applies to the floor surface only. ' +
    'Base cabinets, toe kicks, baseboards, and lower wall surfaces are NOT covered by this anchor ' +
    'and remain governed by Tier 4 style transformation.',

  walls:
    'Wall tile/finish anchor applies to wall surfaces only. ' +
    'The ceiling, floor, vanity front, tub surround, and cabinetry are NOT covered by this anchor ' +
    'and remain governed by Tier 4 style transformation.',

  countertops:
    'Countertop anchor applies to the countertop surface only. ' +
    'The backsplash, cabinet fronts, and undermount sink surround are NOT covered by this anchor ' +
    'and remain governed by Tier 4 style transformation.',

  cabinets:
    'Cabinet anchor applies to cabinet door and drawer fronts only. ' +
    'The countertop, hardware, interior shelving, and toe kick are NOT covered by this anchor ' +
    'and remain governed by Tier 4 style transformation.',
};
```

### Injection Pattern

In `buildRenovationAnchorsBlock()`, after each anchor's material description line, append the corresponding isolation clause:

```
FLOORING ANCHOR [ACTIVE]:
  Material: [resolved material description]
  Flooring anchor applies to the floor surface only. Base cabinets, toe kicks, baseboards,
  and lower wall surfaces are NOT covered by this anchor and remain governed by Tier 4.
```

If an anchor surface type is not in `ANCHOR_ISOLATION`, no isolation clause is emitted for that anchor (safe default: no false constraints).

---

## 11. Failure Economics

### Failures V7 Prioritizes (Compute Allocated)

| Failure Class | V6.0 Rate (12-case regression) | Mechanism | Expected V7 Rate |
|---|---|---|---|
| Invented windows | 1–2 / 12 V6.0; 4–5 / 12 baseline | AGT window_count hard constraint | ~0–1 / 12 |
| Removed/altered doors | Low but untracked | AGT door_count hard constraint | Near zero |
| Ceiling fixture hallucination | Untracked in regression | AGT has_ceiling_fixture | Significantly reduced |
| Niche/alcove replacement | Untracked in regression | AGT has_built_in_niches | Significantly reduced |
| Catalogue material bleed | Expected high (V6.0 new feature) | Anchor isolation clause | Significantly reduced |

### Failures V7 Explicitly Defers

| Failure Class | Reason for Deferral | Target Version |
|---|---|---|
| Window aspect ratio / proportion drift | Extraction error rate ~20–30%; wrong measurement is actively harmful | V7.1 (if depth estimation improves) |
| Mullion pattern drift | Low hard-rejection frequency; high extraction complexity | V7.1 or later |
| Bathroom style under-expression | Requires room-type surface inventory and per-style surface mapping; separate work stream | V7.1 |
| Camera FOV / perspective recalibration | Sub-perceptual to end users; not a hard-rejection trigger | V8 (if production data justifies) |
| Refinement accumulation drift | Requires architectural re-anchoring against original source across refinement passes | Separate fix, can ship in V7 minor |
| Intra-window geometric drift (non-count) | Blocked by above extraction limitations | V7.1 |

---

## 12. Latency and Cost Model

### AGT Extraction Call

| Metric | Value |
|---|---|
| Model | Fast vision-capable text model (e.g., gemini-2.5-flash or equivalent) |
| Input tokens | ~200 (prompt) + image |
| Output tokens | ~80–120 (JSON) |
| Expected latency | 250–400ms |
| Expected cost | ~1/80th of image generation cost |
| Cost impact on pipeline | <2% increase in total call cost |

### Image Generation Call

No change. Same model, same token count with the following additions:

| Addition | Token estimate |
|---|---|
| AGT constraint block | ~60–80 tokens |
| AGT echo block | ~20–25 tokens |
| Anchor isolation clauses (per active anchor) | ~35–45 tokens each |
| Style conflict resolution clauses | ~30–50 tokens per style |

**Total token addition to generation call:** ~120–200 tokens typical (no moodboards, no injected items, 2 active anchors). Within 1% of current prompt size.

### Perceived Latency

If the AGT extraction call fires immediately on image upload completion (before the user selects style, staging, or other options):

- User-perceived added latency: **0ms** (AGT runs during UI interaction time)
- Pipeline latency if AGT is fired at generate-click: **+300–400ms**

**Recommendation:** Fire AGT on image upload. The extraction requires only the image — no style parameters. This makes V7 pipeline perceived latency identical to V6.0.

### Summary

| Metric | V6.0 | V7 | Delta |
|---|---|---|---|
| Model calls | 1 | 2 | +1 (cheap text call) |
| Total cost per request | baseline | ~+1.5% | Negligible |
| Pipeline latency (generate-click trigger) | ~2.5s | ~2.8–2.9s | +300–400ms |
| Pipeline latency (upload-trigger AGT) | ~2.5s | ~2.5s | 0ms perceived |
| Hard architectural failure rate | ~8% | ~2–3% (estimated) | −65–75% |

---

## 13. Graceful Degradation

### Scenario: Low Confidence on Specific Fields

Behavior: fields listed in `uncertain_fields` are suppressed from the AGT constraint block and echo block. The corresponding V6.0 prose constraint in the structural part remains active as fallback.

Example: `uncertain_fields: ["window_count"]`
- AGT block omits the `Windows: EXACTLY N` line
- AGT echo block omits the window count fact
- `BALANCED_V5_STRUCTURAL_PART` WINDOW PRESERVATION prose is still present and governs window behavior
- Generation quality for window count degrades to V6.0 behavior, not below

### Scenario: All Fields Uncertain

Behavior: `buildAGTConstraintBlock()` returns only the header line with a fallback note. `buildAGTEchoBlock()` returns empty string (no echo part injected). Generation is identical to V6.0.

```
[ARCHITECTURAL GROUND TRUTH — LOW CONFIDENCE]
Source image analysis was inconclusive. Architectural constraints governed by structural part below.
```

### Scenario: AGT Extraction Call Fails (Timeout, Error, Invalid JSON)

Behavior: `extractArchitecturalGroundTruth()` catches the error and returns a default AGT with all fields uncertain:

```typescript
const FALLBACK_AGT: ArchitecturalGroundTruth = {
  window_count: 0,
  door_count: 0,
  has_ceiling_fixture: false,
  has_built_in_niches: false,
  camera_perspective: 'straight_on',
  uncertain_fields: ['window_count', 'door_count', 'has_ceiling_fixture', 
                     'has_built_in_niches', 'camera_perspective'],
};
```

This fallback triggers full degradation: no AGT values are injected. Generation proceeds as V6.0. The failure is logged to the debug output. **The image generation call is never blocked by an AGT failure.**

### Scenario: Generation Receives Partial AGT

Behavior: partial injection is safe. Each field is independently gated by `uncertain_fields`. A partial AGT (e.g., confident window count but uncertain door count) produces partial hard enforcement — better than V6.0 on the confident fields, equal to V6.0 on the uncertain fields.

### Degradation Summary

```
AGT all confident       → Full V7 enforcement
AGT partially confident → Partial V7 enforcement on confident fields, V6.0 on others
AGT all uncertain       → V6.0 behavior (no regression)
AGT call fails          → V6.0 behavior (no regression)
```

---

## 14. Acceptance Criteria

### Primary: Hard Architectural Failure Rate

- **Target:** ≤2 hard rejections per 12-case regression (current V6.0: 1; current baseline: 5)
- **Measurement:** standard regression run (`python tests/regression/run_regression.py`) with V7 pipeline
- **Specific failure classes to verify eliminated:** invented windows, door count changes, ceiling fixture additions on fixture-absent rooms

### Secondary: Catalogue Material Bleed

- **Target:** 0 bleed cases in catalogue-active test runs
- **Measurement:** regression run with `X-Contractor-Id: contractor_demo` header and at least 2 active renovation selections per case
- **Definition of bleed:** anchor material appears on any surface not named in the anchor specification

### Quality Preservation

- **Target:** V7 average weighted score ≥ V6.0 average weighted score (4.21 in run_20260505_121132)
- **Tolerance:** ≤0.10 regression in average score is acceptable given architectural improvement
- **Measurement:** AI evaluation in standard regression run; human scoring confirmation

### Latency

- **Target:** total pipeline latency ≤3.5s (upload-trigger AGT) or ≤3.8s (generate-click AGT)
- **Ceiling:** if AGT extraction call exceeds 600ms, log warning; if exceeds 1,000ms, fall back to FALLBACK_AGT and proceed

### Regression Coverage

- **Minimum:** 4 rooms × 3 styles = 12 cases, both Baseline and V7 pipelines
- **Required before promotion:** regression run must complete with 0 generation errors and human scoring pass

---

## 15. Implementation Checklist

### New Files

- [ ] `src/services/agt/extractGroundTruth.ts` — AGT extraction function, FALLBACK_AGT constant, AGT TypeScript interface
- [ ] `src/services/agt/extractGroundTruth.test.ts` — unit tests for extraction and fallback behavior

### Modified Files

- [ ] `src/types.ts` — add `ArchitecturalGroundTruth` interface; extend `GenerateVisualizationParams` with optional `agt?: ArchitecturalGroundTruth`
- [ ] `src/schemas/visualization.schema.ts` — add `'balanced_v7'` to pipelineMode enum
- [ ] `src/services/geminiService.ts` — add `balanced_v7` dispatch case
- [ ] `src/services/balanced_v7/geminiService.ts` — new V7 service file (copy from balanced_v5, add AGT call and injection)
- [ ] `src/prompts/balanced_v7/visualization.constants.ts` — new V7 constants file; add `buildAGTConstraintBlock()`, `buildAGTEchoBlock()`; update `buildConstraintHierarchyBlock()` TIER 1 text; update self-audit check 4; add `ANCHOR_ISOLATION` map; update `buildRenovationAnchorsBlock()` to inject isolation clauses
- [ ] `src/prompts/balanced_v7/visualization.prompt.ts` — updated template with `{{STYLE_CONFLICT_CLAUSES}}` placeholder
- [ ] `src/data/styles.ts` — add `conflict_resolution` field to Japandi, Coastal, Industrial, Vintage, Bohemian style definitions
- [ ] `src/controllers/main.ts` — add `'balanced_v7'` to `queryMode` type cast
- [ ] `src/utils/formdata.utils.ts` — add `'balanced_v7'` to `pipelineMode` union type
- [ ] `src/App.jsx` (sandbox) — add `balanced_v7` as pipeline option in dropdown

### Functions to Add

- [ ] `extractArchitecturalGroundTruth(image: MultipartFile): Promise<ArchitecturalGroundTruth>` — in `src/services/agt/extractGroundTruth.ts`
- [ ] `buildAGTConstraintBlock(agt: ArchitecturalGroundTruth): string` — in `src/prompts/balanced_v7/visualization.constants.ts`
- [ ] `buildAGTEchoBlock(agt: ArchitecturalGroundTruth): string` — in `src/prompts/balanced_v7/visualization.constants.ts`

### Functions to Modify

- [ ] `buildConstraintHierarchyBlock()` in `visualization.constants.ts` — update TIER 1 to reference AGT block
- [ ] `buildRenovationAnchorsBlock()` — inject anchor isolation clause after each active anchor

### Tests to Add

- [ ] Unit: `extractGroundTruth` returns valid AGT schema for a real image
- [ ] Unit: `extractGroundTruth` returns FALLBACK_AGT when API call throws
- [ ] Unit: `buildAGTConstraintBlock` suppresses lines for fields in `uncertain_fields`
- [ ] Unit: `buildAGTConstraintBlock` returns fallback header when all fields uncertain
- [ ] Unit: `buildAGTEchoBlock` returns empty string when all fields uncertain
- [ ] Unit: `buildRenovationAnchorsBlock` includes isolation clause for each active anchor type
- [ ] Integration: V7 pipeline with window_count = 2 does not produce invented windows on Japandi living room fixture
- [ ] Integration: V7 pipeline with has_ceiling_fixture = false does not add ceiling light on any style

### Regression Cases to Rerun

- [ ] Full 12-case regression: Baseline vs Balanced V7 (update `config.yaml`: `mode: balanced_v7`, `slug: v7_0`)
- [ ] Targeted: Living Room + Japandi (primary invented-window regression case)
- [ ] Targeted: Bedroom 2 + Coastal (window narrowing case)
- [ ] Catalogue-active run: at least 3 rooms with `contractor_demo` contractor, 2+ active selections each

---

## 16. Open Questions for Future AI Agents

These questions are unresolved as of V7 spec. Future agents continuing this work should address them before V7.1 planning.

**Q1: AGT model selection**
Which specific model should be used for the AGT extraction call? Requirements: (a) supports vision input, (b) reliable at counting discrete elements in images, (c) low latency (<400ms), (d) low cost. Candidates: Gemini 2.0 Flash (text), Gemini 2.5 Flash (text-only mode), GPT-4o-mini with vision. Needs benchmark evaluation on a sample of regression fixtures.

**Q2: Upload-trigger vs generate-trigger for AGT**
The spec recommends firing AGT on image upload to hide latency. This requires a separate `/api/agt` endpoint and client-side state management to hold the AGT document between upload and generate-click. The backend must handle the case where AGT was not pre-fetched (fall through to generate-click trigger). Needs frontend design decision and API endpoint spec.

**Q3: Refinement pass AGT handling**
On refinement passes (`isRefinement = true`), does the AGT run against the original source image or the previous result image? The correct answer is original source — architectural facts must be measured from the source, not from a potentially drifted prior output. The current service receives `previousResultImage` but `roomImage` is always the original source. Confirm this is still true in V7 and that AGT always receives `roomImage`.

**Q4: Style conflict resolution coverage**
The spec defines conflict resolution clauses for Japandi, Coastal, and Industrial. The full style library includes approximately 15+ styles. Which styles have structural conflict pressure worth documenting? Prioritize: Bohemian (clutter pressure vs structural cleanliness), Rustic (exposed material pressure), Scandinavian (light pressure similar to Japandi), Farmhouse (open-plan pressure). Needs style-by-style audit.

**Q5: V7.1 surface mapping design**
The V7 spec defers bathroom and tile-room style under-expression to V7.1. V7.1 will need: (a) a `room_surface_inventory` registry per room type, (b) per-style `surface_material_map` entries at surface-type granularity, (c) a STYLE PRIORITY update requiring at least one style-signal surface per room type to carry the style's material identity. This is a non-trivial data modelling task. Needs design before implementation estimate.

**Q6: AGT accuracy benchmarking**
Before shipping V7 to production, the AGT extraction prompt should be benchmarked against a labeled set of regression fixtures (ground truth window counts, fixture presence, etc.) to verify the >85% accuracy assumption. If accuracy is below threshold on any field, that field should be demoted to soft/fallback before shipping. Needs a benchmark run using the existing regression fixtures with manually labeled ground truth.

**Q7: Catalogue bleed test coverage**
The current regression suite does not include catalogue-active cases. A new regression configuration needs to be designed: which rooms, which styles, which catalogue selections best stress-test the anchor isolation rules? Specifically: countertop + flooring together (bleed risk to cabinets); wall tile + flooring together (bleed risk across surfaces). Needs test matrix design.

---

## Reference Summary for Future AI Agents

**Read this section if you are picking up V7 implementation work without reading the full conversation.**

### What V7 Is

V7 is the next version of the interior visualization pipeline, evolving from V6.0 (`balanced_v6`/`balanced_v5` internal). The core change is adding a two-call architecture: a fast architectural extraction call (AGT) before the image generation call.

### Why It Was Designed This Way

V6.0 and prior versions enforced architectural constraints (don't add windows, preserve structure) through declarative prompt instructions. This failed because style pressure (Japandi needs light → model adds windows) overrode the instructions through the model's self-adjudication. Invented windows were the primary hard rejection failure. Post-generation validation was rejected due to the retry trap (fail = 3 calls). Single-pass prompt improvements hit diminishing returns at V6.0. Pre-extraction (AGT) was selected as the highest ROI change within a 2-call budget.

### The AGT Mechanism

The AGT extraction call receives only the source image and a counting prompt. It returns a small JSON document with 5 fields: `window_count`, `door_count`, `has_ceiling_fixture`, `has_built_in_niches`, `camera_perspective`, and `uncertain_fields`. Fields that are uncertain are suppressed from the constraint block — degrading gracefully to V6.0 behavior on those dimensions. The AGT document is injected at position 3 (before constraint hierarchy) and re-stated at position N-1 (immediately before the base room re-anchor) in the generation prompt. Injected values are framed as measured source facts, not instructions.

### What Is Hard vs Soft

**Hard constraints** (from AGT, stated as facts): window count, door count, ceiling fixture presence, niche presence.  
**Soft constraints** (prose instructions, unchanged from V6.0): window geometry/proportions, material identity, style expression strength, staging density.

The dividing line: a field is hard-constrained only if it can be expressed as a count or boolean that a fast vision model extracts with >85% reliability. Aspect ratios and geometric details are explicitly excluded because extraction error rates make them unsafe as hard constraints.

### What Was Deferred

Window proportion/aspect ratio drift, mullion patterns, bathroom style under-expression, and camera FOV drift are explicitly deferred to V7.1. Do not re-open these in V7 unless the implementation is trivial. The decision is documented in Section 11.

### Where the Code Lives

- Current V6.0 service: `src/services/balanced_v5/geminiService.ts` (both balanced_v5 and balanced_v6 route here)
- Current V6.0 constants: `src/prompts/balanced_v5/visualization.constants.ts`
- Catalogue logic: `src/utils/catalogue.utils.ts`, `src/data/catalogues.ts`
- New V7 service: `src/services/balanced_v7/geminiService.ts` (to be created)
- New V7 constants: `src/prompts/balanced_v7/visualization.constants.ts` (to be created)
- New AGT extractor: `src/services/agt/extractGroundTruth.ts` (to be created)

### Key Invariants

1. The image generation call count must not exceed 1. V7 has 1 extraction + 1 generation = 2 total.
2. If the AGT extraction fails for any reason, the pipeline must fall back to V6.0 behavior, never block.
3. V5/V6 pipeline files are frozen. V7 changes go in new files only.
4. `pipelineMode: 'balanced_v7'` routes to the new V7 service. `balanced_v5` and `balanced_v6` are unchanged.

### Last Regression Run

**Run:** `runs/run_20260505_121132`  
**Baseline vs V6.0 results:** V6.0 won 8/12, tied 3/12, baseline won 1/12. Average weighted scores: Baseline 3.73, V6.0 4.21. Hard rejections: Baseline 5, V6.0 1.  
**V7 acceptance target:** ≤2 hard rejections per 12 cases; average score ≥ 4.11 (V6.0 − 0.10 tolerance).


# ReformAI Visualization Engine — V4.0 System & Product Specification

**Document version:** 1.0  
**Status:** Pre-implementation — approved for build  
**Date:** 2026-04-28  
**Supersedes:** VISUALIZATION_PHASE_1_PLAYBOOK.md (operational guidance), ad-hoc session notes  
**Audience:** Engineers implementing or extending the visualization service

---

## Table of Contents

1. [Executive Overview](#1-executive-overview)
2. [Current State (v3.0)](#2-current-state-v30)
3. [Core Problem Definition](#3-core-problem-definition)
4. [V4.0 Architecture Overview](#4-v40-architecture-overview)
5. [Constraint Hierarchy System](#5-constraint-hierarchy-system)
6. [Injected Items System](#6-injected-items-system)
7. [Image Role Labeling System](#7-image-role-labeling-system)
8. [Prompt Architecture (V4.0)](#8-prompt-architecture-v40)
9. [Catalogue / Service Provider Direction](#9-catalogue--service-provider-direction)
10. [Cost Analysis](#10-cost-analysis)
11. [V4.0 Scope — Locked Decisions](#11-v40-scope--locked-decisions)
12. [Implementation Plan](#12-implementation-plan)
13. [File & Code Structure](#13-file--code-structure)
14. [Validation & Regression Strategy](#14-validation--regression-strategy)
15. [Future Roadmap (V4.1 → V5.0)](#15-future-roadmap-v41--v50)
16. [Open Questions & Known Limitations](#16-open-questions--known-limitations)

---

## 1. Executive Overview

### What the system does

The ReformAI Visualization Engine takes a photograph of a room and transforms it into a photorealistic redesign matching a selected interior design style. The system is built on Google Gemini's multimodal image generation model (`gemini-2.5-flash-image`). Inputs include:

- A base room photograph
- A style preset (structured object defining materials, palette, lighting, density)
- Optional mood board reference images
- Optional user-uploaded furniture or decor items to inject into the scene
- A free-text user request
- A style influence slider (controlling mood board weight vs. preset weight)

The service is a Fastify HTTP API that accepts multipart form data, assembles a multimodal prompt, calls Gemini, and returns a base64-encoded generated image plus a debug object.

### What changed from v3.0 → v4.0

v3.0 was the most capable prior iteration. It introduced a two-part prompt structure (structural part + style part), a structural sandwich (room image at both start and end of the request), a template-driven injection layer with placeholder validation, and density controls. It produced substantially better output than earlier versions.

v4.0 is not a replacement for v3.0 — v3.0 remains a stable reference baseline. v4.0 is a new pipeline that addresses the one class of failure v3.0 cannot solve through prompt tuning alone: **furniture injection**.

The specific failures v4.0 targets:

1. The model receives multiple images with no explicit labeling of what each image represents. It must infer roles from position alone.
2. The style transformation prompt instructs the model to "replace furniture to match the target style" — directly conflicting with any instruction to preserve an uploaded item.
3. There is no declared constraint resolution rule. When the furniture instruction conflicts with the style instruction, the model resolves the conflict non-deterministically.
4. The furniture preservation instruction does not specify what "preserve" means — no explicit mention of material, color, finish, silhouette, or design features.
5. There is no failure condition scored against item identity, only against style fidelity.

### Core architectural shift: from prompt tuning to constraint-driven generation

Every prior version of the pipeline, from baseline through v3.0, operated by tuning a monolithic or two-part prompt. Rules were accumulated, refined, and restructured within the prompt body. When rules conflicted, the model's behavior was undefined.

v4.0 introduces a fundamentally different approach: **explicit constraint hierarchy**. Instead of relying on the model to infer priority from text position or phrasing, v4.0 declares a numbered tier system at the top of every request. Tier 1 has the highest priority. Every subsequent tier yields to it. When an injected item is present, Tier 2 activates and overrides Tier 4 (style transformation) explicitly and by name.

This shift means the system's behavior in conflict cases is deterministic by design, not emergent from prompt phrasing. It also means the system is easier to extend: adding a new constraint type means adding a new tier, not rewriting the prompt.

---

## 2. Current State (v3.0)

### Pipeline overview

The v3.0 pipeline is implemented in:
- `src/services/balanced_v3_0/geminiService.ts` — request assembly and API call
- `src/prompts/balanced_v3_0/visualization.constants.ts` — template definitions (template version 3.1)
- `src/prompts/balanced_v3_0/visualization.prompt.ts` — injection layer with placeholder validation

**Request structure (v3.0, with furniture image, no moodboard):**

```
[roomImage IMAGE]
[structuralPart TEXT]
[stylePart TEXT]
[furnitureImage IMAGE]     ← if present; unlabeled
[furniturePrompt TEXT]     ← if present; generic instruction
[influencePrompt TEXT]
[previousResultImage IMAGE]  ← if refinement
[roomImage IMAGE]          ← structural re-anchor
```

**Structural part:** Static block defining fixed architectural elements, window immutability, artifact removal, and exterior view preservation. Never modified per style, room type, or density. Changes require a new template version and behavioral re-validation.

**Style part:** Template with 14 `{{PLACEHOLDER}}` fields injected at runtime from the style preset, room type registry, and density block registry. Includes Phase 2 self-audit. Post-injection validation checks for unresolved placeholders (hard-fail).

**Furniture prompt:** Shared across all non-baseline pipelines. Generated from `INSTRUCTION_INTEGRATE_FURNITURE` constant if a furniture image is present, empty string if not.

**Re-anchor:** The room image is sent twice — once at the start as the architectural reference, and once at the end as a structural re-anchor for the generation pass.

### Known limitations

**1. No image role labeling**

The model receives multiple images in sequence — the room, mood boards (if any), the furniture item, and the room again — with no explicit text identifying the role of each image. It must infer roles from position and context. With multiple mood board images present, the furniture image can be misinterpreted as another style reference.

**2. Style-override conflict**

The style part instructs the model: *"Reuse, adapt, or replace furniture to match the target style."* This instruction applies globally. When a furniture image is also present, the model simultaneously receives an instruction to replace furniture to match the style **and** to preserve the uploaded item. There is no declared resolution rule. The model resolves this conflict non-deterministically, and style fidelity is the only outcome scored in the self-audit.

**3. Weak furniture preservation instruction**

`INSTRUCTION_INTEGRATE_FURNITURE` says "incorporate this exact piece of furniture" but does not define what "exact" means. It does not instruct the model to preserve color, material identity, finish, silhouette, or specific design features. Without this, the model can produce an item that is categorically correct but visually incorrect — a sofa in approximately the right position, but rendered in the style's palette rather than the uploaded item's actual finish.

**4. No negative constraints**

The furniture instruction contains no prohibitions. Nothing prevents the model from substituting a generic version of the item type, restyling the finish to match the active style, or omitting the item if placement is ambiguous.

**5. Self-audit asymmetry**

The PHASE 2 SELF-AUDIT block scores the output against style fidelity, material hierarchy, staging density, and structural integrity. Item identity has no corresponding failure condition. The model is trained by the prompt to verify style compliance but not item preservation compliance.

**6. Single item, no metadata**

The data model supports one furniture image (`furnitureImage?: SingleFile`). No fields exist for item type, placement intent, material, finish, or fidelity mode. The model receives only the image buffer.

### Smoke test findings (summary)

Testing across v3.0 revealed:

- Items were frequently restyled to match the active preset. A mid-century walnut sofa rendered in a Japandi scene appeared as a white lacquered sofa.
- Items were occasionally omitted when placement was ambiguous or when the style heavily prescribed furniture replacement.
- Placement was inconsistent run-to-run for the same input.
- With mood boards present, the furniture image was sometimes treated as additional style reference rather than an item to inject.
- Style-only requests (no furniture) performed reliably and showed no regressions from v2.x behavior.

---

## 3. Core Problem Definition

### Problem 1: Multimodal ambiguity

Gemini receives a sequence of image and text parts. In a request with a room image, two mood board images, and a furniture image, the model sees four images. Nothing in the request tells it which image is the base room, which are style references, and which is the item to inject. The model infers this from position and surrounding text.

Position-based inference is fragile. The model can associate text instructions with the nearest preceding or following image, but this is probabilistic, not guaranteed. When the furniture instruction appears as a text block before the mood board images and the furniture image appears after them, the model may not reliably associate the instruction with the correct image.

**This is a structural defect in how the request is assembled, not a prompt wording deficiency.**

### Problem 2: Conflicting instructions with no resolution rule

The style template contains:
> *"Reuse, adapt, or replace furniture to match the target style."*

The furniture instruction contains:
> *"You MUST incorporate this exact piece of furniture into the final design."*

Both are present in the same request. One tells the model to replace furniture. The other tells the model to preserve it. There is no declared hierarchy.

In practice, the model resolves this in favor of style fidelity because: (a) the style instruction appears earlier and is longer, (b) the self-audit block only scores style fidelity, and (c) "style fidelity failure conditions" are explicitly defined while "item identity failure conditions" are not.

**This is a constraint hierarchy defect, not a prompt wording deficiency.**

### Problem 3: Vague preservation semantics

"Incorporate this exact piece of furniture" is not a precise instruction. "Exact" is undefined. The model's interpretation of "exact" may mean: same category (sofa), same approximate shape, same approximate color, or same specific product identity. These produce very different outputs.

Without explicit preservation targets — color, material, finish, silhouette, design features — the model defaults to the most contextually plausible interpretation, which is often "similar item in the active style."

### Problem 4: Furniture as a secondary feature

In all v3.0 pipelines, furniture injection is an afterthought appended to the end of the request. It is conditional, optional, and has no structural relationship to the rest of the prompt. The constraint hierarchy (which does not exist in v3.0) has no place for it.

For the product direction (where service providers inject catalogue items), furniture injection is not a secondary feature — it is a primary product capability. The architecture must treat it as a first-class constraint.

---

## 4. V4.0 Architecture Overview

### Design principles

**1. Every image has an explicit role.**
No image is presented to the model without a preceding text label identifying its role and what to do with it. This eliminates position-based inference for all images in the request.

**2. Image = identity, itemType = placement.**
When a user uploads a furniture item, the image is the authoritative source for how the item looks. An optional `itemType` label (e.g., "sofa", "countertop") exists only to guide placement reasoning. If the label conflicts with the image, the image wins. The model cannot generate a generic version of the labeled category — it must generate the item shown in the image.

**3. Constraint hierarchy is explicit and declared once.**
A dedicated text block at the top of every request declares a numbered tier system. Tier 1 = architectural constraints (highest). Tier 6 = user text request (lowest). When Tier 2 (injected item) is active, its rule overrides Tier 4 (style transformation) explicitly by name. No tier can override a higher tier regardless of what other prompt blocks say.

**4. Injected items are first-class entities.**
Injected items have their own data model (`InjectedItem`), their own prompt block (identity preservation block), their own image role label, and their own self-audit check. They are not an optional add-on to the style transformation pass.

**5. Prompt contradictions are resolved architecturally, not by wording.**
Rather than rewording conflicting instructions, v4.0 prevents the conflict by structure: the constraint hierarchy block appears before the style block, and the style block's furnishing rule is scoped to exclude injected items by reference to the tier system.

### System diagram (request assembly order)

```
[LABEL: BASE ROOM IMAGE]
[roomImage]
[CONSTRAINT HIERARCHY BLOCK]      ← always present; Tier 2 activates when item present
[STRUCTURAL PART]                 ← architectural fixed elements (carried from v3.0)
[STYLE PART]                      ← style transformation template (modified from v3.0)
  for each moodboard:
    [LABEL: MOODBOARD REFERENCE N]
    [moodBoardImage]
  if injectedItem:
    [INJECTED ITEM BLOCK HEADER]
    [LABEL: INJECTED ITEM 1]
    [item image]
    [item detail line]             ← type | placement | material | color | finish | fidelity flag
[INFLUENCE PROMPT]
  if refinement:
    [LABEL: PREVIOUS RESULT]
    [previousResultImage]
[LABEL: BASE ROOM IMAGE — RE-ANCHOR]
[roomImage]
```

### What each block contributes

| Block | Purpose | Always present? |
|---|---|---|
| Base room label + image | Grounds the model in the room's architecture | Yes |
| Constraint hierarchy | Declares resolution rules before any conflicting instructions appear | Yes |
| Structural part | Prevents architectural drift (walls, windows, camera) | Yes |
| Style part | Drives aesthetic transformation | Yes |
| Moodboard labels + images | Style inspiration, explicitly scoped as reference-only | When moodboards present |
| Injected item block | Preserves uploaded item identity, scoped outside style transformation | When item present |
| Influence prompt | Calibrates moodboard vs. preset weight | Yes |
| Previous result | Refinement context | When isRefinement |
| Re-anchor label + image | Structural sandwich — final ground truth for generation | Yes |

---

## 5. Constraint Hierarchy System

### Why it exists

v3.0's prompt is a sequence of instructions with no declared priority system. When instructions conflict — and furniture injection creates a direct conflict with style transformation — the model resolves ambiguity using text position, instruction length, and the framing of failure conditions in the self-audit. This produces non-deterministic behavior.

The constraint hierarchy block solves this by declaring a priority system once, before any other instruction, using a numbered tier structure. The model reads this before reading any other block and has an unambiguous resolution rule for every conflict it encounters.

### Tier definitions

**TIER 1 — ARCHITECTURAL CONSTRAINTS [always active, highest priority]**

Fixed elements that cannot change under any instruction:
- Wall planes, floor, ceiling, room geometry
- Window and door geometry, position, size
- Camera angle, perspective vanishing points, room proportions
- Built-in light fixtures present in the source image

No style instruction, injected item, or user request may alter these.

**TIER 2 — INJECTED ITEM CONSTRAINTS [active only when item is present]**

When an injected item is present, the uploaded item's identity overrides style transformation.
- Silhouette, color, material, and finish are non-negotiable
- The item must not be restyled, recolored, or substituted to match the active style
- If the item conflicts with the active style, keep the item as-is; resolve the conflict through surrounding furniture, surfaces, and decor
- This behavior is intentional — it is not a style fidelity failure

When no item is present, this tier states itself as inactive. The block is always present in the request — its activation state is explicit.

**TIER 3 — ROOM FUNCTION AND SPATIAL LOGIC**

Furniture layout must support the room's functional purpose. Spatial relationships must remain plausible and navigable.

**TIER 4 — STYLE TRANSFORMATION**

Apply the selected style through non-injected furniture, surfaces, and decor. Style expression must not override tiers 1, 2, or 3.

**TIER 5 — MOODBOARD INFLUENCE**

Applied as directed by the influence setting. Does not override tiers 1–4.

**TIER 6 — USER TEXT REQUEST**

Honored within the constraints of all tiers above.

### How conflicts resolve

| Conflict scenario | Resolution |
|---|---|
| Style wants to restyle the injected sofa | Tier 2 > Tier 4. Sofa preserved. Style applied elsewhere. |
| User requests a different item than what was uploaded | Tier 2 > Tier 6. Uploaded item preserved. |
| Moodboard shows a different item style | Tier 2 > Tier 5. Uploaded item preserved. |
| Style requires an architectural change (e.g., new window) | Tier 1 > Tier 4. Style expressed through movable elements. |
| User requests room geometry change | Tier 1 > Tier 6. Request honored only for non-structural elements. |
| No item present — style transformation | Tiers 3, 4, 5, 6 all active. Same behavior as v3.0. |

### Block implementation

```typescript
// src/prompts/balanced_v4_0/visualization.constants.ts

export const buildConstraintHierarchyBlock = (injectedItemCount: number): string => {
    const tier2Active = injectedItemCount > 0;

    const tier2Header = tier2Active
        ? 'TIER 2 — INJECTED ITEM CONSTRAINTS [ACTIVE — 1 injected item present]'
        : 'TIER 2 — INJECTED ITEM CONSTRAINTS [INACTIVE — no injected items in this request]';

    const tier2Body = tier2Active
        ? [
            '  The uploaded item must be preserved exactly as shown in its reference image.',
            '  - Silhouette, color, material, and finish are non-negotiable — they override style transformation',
            '  - Do not restyle, recolor, or substitute the item to match the active style',
            '  - If the item\'s aesthetic conflicts with the active style, keep the item as-is;',
            '    resolve the conflict through surrounding furniture, surfaces, and decor',
            '  - This behavior is intentional — it is not a style fidelity failure',
          ].join('\n') + '\n'
        : '\n';

    return [
        '**CONSTRAINT HIERARCHY — READ THIS BEFORE ALL OTHER INSTRUCTIONS:**',
        '',
        'Apply the following tiers in strict priority order.',
        'TIER 1 has the highest priority and overrides all other tiers without exception.',
        'When a conflict exists between tiers, the higher-priority tier always wins.',
        '',
        'TIER 1 — ARCHITECTURAL CONSTRAINTS [ALWAYS ACTIVE — highest priority]',
        '  Fixed elements that cannot change under any instruction from any tier below:',
        '  - Wall planes, floor, ceiling, and room geometry',
        '  - Window and door geometry, position, and size',
        '  - Camera angle, perspective vanishing points, and room proportions',
        '  - Built-in light fixtures present in the source image',
        '  No style instruction, injected item, or user request may alter these.',
        '',
        tier2Header,
        tier2Body,
        'TIER 3 — ROOM FUNCTION AND SPATIAL LOGIC',
        '  - Furniture layout must support the room\'s functional purpose',
        '  - Spatial relationships must remain plausible and navigable',
        '',
        'TIER 4 — STYLE TRANSFORMATION',
        '  - Apply the selected style through non-injected furniture, surfaces, and decor',
        '  - Style expression must not override tiers 1, 2, or 3',
        '',
        'TIER 5 — MOODBOARD INFLUENCE',
        '  - Applied as directed by the influence setting',
        '  - Does not override tiers 1–4',
        '',
        'TIER 6 — USER TEXT REQUEST',
        '  - Honored within the constraints of all tiers above',
    ].join('\n');
};
```

---

## 6. Injected Items System

### InjectedItem abstraction

v4.0 replaces the single `furnitureImage` field with an `InjectedItem[]` array. The array model is the correct long-term abstraction even though v4.0 enforces a maximum of one item. This means multi-item support in v4.1 is an extension of the existing model, not a redesign.

```typescript
export type ItemFidelityMode = 'preserve' | 'exact';

export interface InjectedItem {
    image: MultipartFile & { buffer: Buffer };
    itemType?: string | null;       // soft hint — free text
    placementHint?: string | null;  // free text
    fidelityMode?: ItemFidelityMode; // defaults to 'preserve'
    // Catalogue-provided (null for user uploads):
    material?: string | null;
    color?: string | null;
    finish?: string | null;
    groupId?: string | null;        // reserved — v5.0
}
```

### V4.0 single-item constraint

v4.0 enforces `injectedItems.length <= 1` at the service layer with a hard HTTP 400 rejection if violated. This is a service-layer constraint, not a prompt-layer constraint. The prompt architecture is designed to support multiple items (the items block header uses generic language, the image role label includes an index), but multi-item placement conflict rules are not implemented in v4.0.

### Identity preservation rules

**What must be preserved (non-negotiable):**

- Overall silhouette, proportions, and profile
- Color and material identity — if the item is walnut with brass hardware, render walnut with brass hardware, not the nearest style-compatible alternative
- Surface finish — matte stays matte, gloss stays gloss, textured stays textured
- Recognizable design features: leg style, arm shape, back profile, hardware details, upholstery pattern or texture if visible

**What must be applied (required for scene integration):**

- Placement: functionally correct location for the room type (placement hint if provided; otherwise model-inferred from room layout and item type)
- Scale: realistic proportions relative to the room's vanishing points
- Lighting direction: match existing room light sources — direction and shadow geometry only
- Shadows: natural, accurate shadows to ground the item in the scene

**What is explicitly prohibited:**

- Substituting with a generic version of the same item type
- Restyling, recoloring, or refinishing to match the active style preset
- Omitting or replacing the item because it conflicts with the room's aesthetic
- Generating a "similar" item instead of the exact item shown
- Shifting the item's color temperature to match room warmth
- Applying the active style's materials or finishes to this item

### Placement logic

Placement is determined in this priority order:

1. `placementHint` if provided (free text, e.g., "against east wall", "center of room facing fireplace")
2. Model-inferred from `itemType` label (e.g., "sofa" triggers placement logic for seating areas)
3. Model-inferred from image content alone (fallback when no `itemType` present)

**The deterministic rule:** `itemType` governs placement reasoning only. The image governs identity. These two signals are independent and non-competing.

**Scenario handling:**

| Scenario | Behavior |
|---|---|
| Label matches image clearly | Label used for placement; image for identity |
| Label conflicts with image (settee uploaded, "sofa" label) | Image used for identity; "sofa" label used for placement logic only. Settee silhouette rendered, sofa placement zone used. |
| Label is absent | Model infers item type from image for placement; image governs identity |
| Label is ambiguous ("furniture", "item", empty string) | Normalized to null at service layer; falls back to image-only inference |

**Ambiguous label normalization (service layer):**

```typescript
const AMBIGUOUS_ITEM_TYPE_TOKENS = ['furniture', 'item', 'thing', 'object', 'piece', ''];

const normalizeItemType = (raw?: string | null): string | null => {
    if (!raw) return null;
    const normalized = raw.trim().toLowerCase();
    if (AMBIGUOUS_ITEM_TYPE_TOKENS.includes(normalized)) return null;
    return raw.trim();
};
```

### Fidelity modes

**`preserve` (default — user uploads)**

Preserve silhouette, color, material, and finish. Minor lighting adaptation is acceptable. A white fabric item may appear slightly warm in a sunset-lit room — this is acceptable under `preserve`. The item's inherent identity must remain recognizable.

**`exact` (catalogue / SKU rendering)**

Perceptual product identity. No material, color, or finish adaptation of any kind. The output must be identifiable as the same product as the reference image by someone comparing them side by side.

What `exact` enforces:
- No warm-shifting or cool-shifting of color
- No finish adaptation (gloss/matte must remain exactly as shown)
- No material substitution or adaptation

What `exact` still allows (required for scene integration):
- Perspective adjustment to match room vanishing points
- Scale adjustment to match room proportions
- Lighting direction matching (shadow geometry)
- Shadow casting

`exact` is the correct mode for catalogue items where the provider's product photography defines the canonical appearance. It is not appropriate for user uploads where the reference photo may have variable lighting and color accuracy.

**Fidelity flag in request (appended to detail line):**

```typescript
export const EXACT_FIDELITY_FLAG =
    'FIDELITY: EXACT PRODUCT IDENTITY — ' +
    'render material, color, and finish exactly as shown; ' +
    'no adaptation to room lighting color temperature or active style; ' +
    'perspective adjustment, scale adjustment, and shadow integration are required and correct';
```

### Injected items block — full text

```
**INJECTED ITEM — IDENTITY PRESERVATION REQUIRED:**

One item has been provided and MUST appear in the final output.

PRESERVE (these are non-negotiable):
  - Overall silhouette, proportions, and profile
  - Color and material identity — if the item is walnut with brass hardware, render it as
    walnut with brass hardware, not the nearest style-compatible alternative
  - Surface finish — matte stays matte, gloss stays gloss, textured stays textured
  - Recognizable design features: leg style, arm shape, back profile, hardware details,
    upholstery pattern or texture if visible

APPLY (required for scene integration):
  - Placement: position in a functionally correct location for the room type shown
    (see placement hint if provided; if absent, infer from room layout and item type)
  - Scale: realistic proportions relative to the room and its vanishing points
  - Lighting direction: match existing room light sources — direction and shadow geometry only
  - Shadows: cast natural, accurate shadows to ground the item in the scene

NEVER:
  - Substitute with a generic version of the same item type
  - Restyle, recolor, or refinish the item to match the active style preset
  - Omit or replace the item because it conflicts with the room's aesthetic
  - Generate a "similar" item — generate the EXACT item shown in the reference image
  - Shift the item's color temperature to match the room's ambient warmth
  - Apply the active style's materials or finishes to this item
```

### Style part modifications required by v4.0

**Modification 1 — Furnishing strategy rule:**

Old (v3.0):
```
- Reuse, adapt, or replace furniture to match the target style.
```

New (v4.0):
```
- Reuse, adapt, or replace non-injected furniture to match the target style.
  Injected items (if any) are governed by Tier 2 constraints — do not apply
  style transformation to them.
```

**Modification 2 — PHASE 2 SELF-AUDIT item 5 (standard mode only):**

Append after existing item 4 (Structural Integrity):

```
5. Injected Item Identity [skip this check if Tier 2 is inactive]:
   - Is the injected item present in the output?
   - Does the item's color, material, and silhouette match its reference image?
   - Has the item been restyled, substituted, or omitted?
   - If any failure → correct before generating.
   Important: an injected item whose style conflicts with the active style preset
   is not a style fidelity failure. It is intentional. Tier 2 takes precedence over Tier 4.
```

---

## 7. Image Role Labeling System

### Why labeling is critical

Every image in the v4.0 request is preceded by a text label as a discrete `{ text: }` part. This is the highest-impact fix in v4.0 and is always enabled — it is not removed in lite mode.

Without labels, the model infers image roles from position. This fails in two ways:

1. **Furniture misidentified as moodboard.** With multiple images in sequence, the furniture image can be treated as another style reference rather than an item to preserve.
2. **Re-anchor ambiguity.** The room image appears twice (start and end). Without a label, the second appearance may confuse the model about whether it is being asked to generate relative to the first or second occurrence.

Labels eliminate both failure modes by making roles explicit.

### All roles

```typescript
// src/prompts/imageRoles.ts

export const IMAGE_ROLES = {

    BASE_ROOM: (): string =>
        '[BASE ROOM IMAGE] — architectural reference. ' +
        'Preserve all structural elements exactly. Do not alter walls, windows, camera angle, or room geometry.',

    BASE_ROOM_REANCHOR: (): string =>
        '[BASE ROOM IMAGE — RE-ANCHOR] — structural re-anchor for final generation. ' +
        'All transformations must be grounded in this room\'s geometry and spatial logic.',

    MOODBOARD: (index: number): string =>
        `[MOODBOARD REFERENCE ${index}] — style inspiration only. ` +
        'Do not preserve, place, or identify specific items from this image.',

    INJECTED_ITEM: (index: number, itemType?: string | null): string => {
        const typeFragment = itemType ? ` — ${itemType}` : '';
        return `[INJECTED ITEM ${index}${typeFragment}] — preserve identity exactly as shown in this image.`;
    },

    PREVIOUS_RESULT: (): string =>
        '[PREVIOUS RESULT] — prior generation provided for refinement context. ' +
        'Carry forward preserved elements. Apply requested changes only.',

} as const;
```

### Token cost of labels

Each label is approximately 12–20 tokens. For a standard request with 1 item, 2 room image appearances, and 1 moodboard, the total label overhead is approximately 55 tokens. This is negligible relative to the structural improvements they produce.

### Lite mode behavior

Image role labels are **always-on**. They are not removed in lite mode. This decision is deliberate: role labeling is the single highest-impact fix in the architecture. The cost is minimal (~55 tokens). Removing it in lite mode would eliminate the most important improvement to save an inconsequential amount of tokens.

---

## 8. Prompt Architecture (V4.0)

### Full request assembly

```typescript
// src/services/balanced_v4_0/geminiService.ts

const parts: Part[] = [];

// ── BASE ROOM ──────────────────────────────────────────────────────────────
parts.push({ text: IMAGE_ROLES.BASE_ROOM() });
parts.push(bufferToGenerativePart(roomImage));

// ── CONSTRAINT HIERARCHY ─────────────────────────────────────────────────
parts.push({ text: buildConstraintHierarchyBlock(normalizedItems.length) });

// ── STRUCTURAL PART ──────────────────────────────────────────────────────
parts.push({ text: structuralPart });

// ── STYLE PART ───────────────────────────────────────────────────────────
parts.push({ text: stylePart });

// ── MOODBOARD IMAGES ─────────────────────────────────────────────────────
moodBoardImages.forEach((img, i) => {
    parts.push({ text: IMAGE_ROLES.MOODBOARD(i + 1) });
    parts.push(bufferToGenerativePart(img));
});

// ── INJECTED ITEM (v4.0: max 1) ──────────────────────────────────────────
if (item) {
    parts.push({ text: INJECTED_ITEM_BLOCK_HEADER });
    parts.push({ text: IMAGE_ROLES.INJECTED_ITEM(1, item.itemType) });
    parts.push(bufferToGenerativePart(item.image));
    const detail = buildItemDetailLine(item);
    if (detail) parts.push({ text: detail });
}

// ── INFLUENCE PROMPT ─────────────────────────────────────────────────────
if (influencePrompt) {
    parts.push({ text: influencePrompt });
}

// ── REFINEMENT CONTEXT ────────────────────────────────────────────────────
if (isRefinement && previousResultImage) {
    parts.push({ text: IMAGE_ROLES.PREVIOUS_RESULT() });
    parts.push(bufferToGenerativePart(previousResultImage));
}

// ── BASE ROOM RE-ANCHOR ───────────────────────────────────────────────────
parts.push({ text: IMAGE_ROLES.BASE_ROOM_REANCHOR() });
parts.push(bufferToGenerativePart(roomImage));
```

### Item detail line assembly

```typescript
export const buildItemDetailLine = (item: InjectedItem): string | null => {
    const parts: string[] = [];

    if (item.itemType)      parts.push(`Type: ${item.itemType}`);
    if (item.placementHint) parts.push(`Placement: ${item.placementHint}`);
    if (item.material)      parts.push(`Material: ${item.material}`);
    if (item.color)         parts.push(`Color: ${item.color}`);
    if (item.finish)        parts.push(`Finish: ${item.finish}`);

    if (item.fidelityMode === 'exact') {
        parts.push(EXACT_FIDELITY_FLAG);
    }

    return parts.length > 0 ? parts.join(' | ') : null;
};
```

In lite mode, catalogue metadata fields (material, color, finish) are omitted from the detail line. `itemType`, `placementHint`, and the `EXACT_FIDELITY_FLAG` are always included when present.

### What each block contributes (detailed)

**Base room label + image (position 1–2):**
Establishes the architectural reference before any other instruction. The label tells the model this is the room to transform, not a style reference. Appearing first, it grounds all subsequent instructions in the physical reality of this specific room.

**Constraint hierarchy block (position 3):**
The most important structural innovation in v4.0. Appears before any conflicting instruction. By the time the model reads the style part (which tells it to replace furniture) or the injected item block (which tells it to preserve the item), it already has a declared resolution rule. This is the mechanism that makes furniture preservation deterministic.

**Structural part (position 4):**
Unchanged from v3.0. Defines fixed architectural elements, window immutability, artifact removal, and exterior view preservation. Static block — no placeholders.

**Style part (position 5):**
Derived from v3.0 template with two targeted modifications (furnishing rule scoping, self-audit item 5). Contains all aesthetic transformation instructions, staging density rules, self-audit block (standard mode only), and material/color/lighting specifications injected from the style preset.

**Moodboard images (positions 6+):**
Each preceded by a role label scoping them as style inspiration only. This prevents the model from treating moodboard items as things to preserve or place in the scene.

**Injected item block (after moodboards):**
The block header establishes the preservation contract. The image role label immediately preceding the image tells the model what the image is before it processes it. The detail line injects structured metadata for catalogue items. Position is intentional: after style instructions, so the constraint hierarchy has already established that Tier 2 overrides Tier 4.

**Influence prompt:**
Calibrates the weight between moodboard style and preset style. Short text (~25 tokens). Unchanged from v3.0.

**Refinement context:**
When `isRefinement` is true and a previous result image is provided, it appears here with a role label scoping it as prior-generation context. This tells the model to carry forward preserved elements and apply only the requested changes.

**Re-anchor (final position):**
The room image appears a second time at the end of the request. This "structural sandwich" pattern was introduced in v3.0 and is preserved in v4.0. The re-anchor label distinguishes this from the first appearance and explicitly states its purpose: grounding the final generation pass in the room's geometry. This reduces architectural drift in the generated output.

### Lite mode definition

Lite mode is an internal operational mode controlled by `generationMode: 'lite'`. It is not exposed in the public API in v4.0.

| Component | Standard | Lite |
|---|---|---|
| Image role labels | Included | **Included (always-on)** |
| Constraint hierarchy block | Included | **Included (always-on)** |
| Identity preservation block header | Included | **Included (always-on)** |
| Exact fidelity flag | Included when exact | **Included when exact (always-on)** |
| itemType in label | Included | Included |
| placementHint in detail | Included | Included |
| Catalogue metadata (material/color/finish) | Included | **Omitted** |
| Self-audit block (all items 1–5) | Included | **Omitted** |

Lite mode saves approximately 280 tokens (self-audit) + up to 60 tokens (catalogue metadata) = approximately 340 tokens. As a fraction of total input cost for a single-item request, this is a 5.4% reduction. It is meaningful at high volume but not a compelling trade at low volume given the self-audit's compliance contribution.

---

## 9. Catalogue / Service Provider Direction

### Product vision

Service providers — furniture brands, material suppliers, interior product vendors — will have curated catalogues of items accessible within the ReformAI platform. Users will browse a provider's catalogue and select specific products to inject into their visualization. This replaces the current user-upload flow for catalogue-origin items.

This introduces a fundamentally different usage pattern:

- Items are not user-uploaded images; they are database records with curated images and structured metadata
- Each item has a canonical image (product photography or CGI render), an item type, and structured attributes (material, finish, color, dimensions, brand)
- Providers require accurate product representation — deviation from the catalogue appearance is a product defect, not a creative interpretation

### User-uploaded vs. catalogue items — differences

| Dimension | User upload | Catalogue item |
|---|---|---|
| Image quality | Variable — photos, screenshots, partial crops | Curated — product photography or renders |
| Background | Often cluttered or partial | Clean, isolated, or staged |
| Identity confidence | Lower | Higher |
| Metadata | None (unless user provides `itemType`) | Structured: material, finish, color |
| Fidelity expectation | High but with latitude | SKU-level — zero deviation |
| Default fidelity mode | `preserve` | `exact` |
| Image source | Multipart upload | URL from catalogue database |

### Why they use the same prompt structure

At the point the Gemini request is assembled, both paths reduce to the same thing: an image buffer + optional metadata. The model does not know or care about the provenance. The difference is in how rich the metadata is and what fidelity mode is active.

The architecture treats them identically at the request layer. The injection logic (`buildItemDetailLine`) simply has more fields to populate for catalogue items. This means the same prompt block, the same image role label, and the same constraint tier handle both use cases.

### Exact mode and SKU rendering

For catalogue items, `fidelityMode: 'exact'` is the correct default. The `EXACT_FIDELITY_FLAG` appended to the detail line enforces:

- No material adaptation
- No color adaptation (including no color temperature shift to match room warmth)
- No finish adaptation (matte/gloss must match reference exactly)
- No generic substitution

The flag still permits:
- Perspective adjustment to match the room's vanishing points
- Scale adjustment to realistic room proportions
- Shadow casting and lighting direction matching (geometry only)

This is the correct behavior for placed product rendering: the product's visual identity is preserved; its spatial relationship to the room is computed.

**What "exact" cannot guarantee:** Gemini is a generative model. It cannot pixel-accurately reproduce a product photograph in an arbitrary room without interpreting perspective, occlusion, and partial visibility. "Exact" means perceptual product identity — the output is identifiable as the same product by a viewer comparing it to the reference. It does not mean the pixel values match. This is documented behavior, not a limitation to be solved.

### Catalogue item path (v4.1+)

In v4.0, catalogue items are handled by the same upload path as user items — the frontend fetches the catalogue image and sends it as a multipart upload with additional metadata fields. This is acceptable for v4.0.

In v4.1, a dedicated catalogue item path should accept structured JSON containing an image URL rather than requiring upload:

```typescript
interface CatalogueItemReference {
    imageUrl: string;        // fetched by the service, not uploaded
    itemType: string;
    material?: string;
    color?: string;
    finish?: string;
    fidelityMode: 'exact';   // always exact for catalogue
    groupId?: string;
}
```

This removes the frontend burden of fetching and re-uploading catalogue images and allows the service to cache catalogue images by URL.

### Multi-item provider sets (v5.0)

When a provider wants to show multiple catalogue items together (e.g., their sofa paired with their coffee table), `groupId` allows items to be marked as a designed set. In v5.0, the prompt assembly layer reads `groupId` and:

- Places items in the set in spatial relationship to each other
- References them as a group in the items block: "Items 1 and 2 are a designed set — place them in a coherent arrangement"

`groupId` is parsed in v4.0 but not acted on. The field exists in the interface to reserve it without committing to behavior before multi-item is implemented.

---

## 10. Cost Analysis

### Cost structure

Cost has two components:
- **Input tokens:** Text tokens + image tokens. This is where all v4.0 changes have impact.
- **Output tokens:** One generated image per request. Fixed cost regardless of prompt complexity. No change from v3.0.

Image tokens dominate input cost. For a medium-resolution uploaded photo (approximately 1024×768), Gemini estimates approximately 1,000–1,500 tokens per image. This is 5–8× the token cost of a full text block. The practical implication: **adding one image to a request costs more than every text addition in v4.0 combined.**

### V3.0 baseline

| Component | Approximate tokens |
|---|---|
| structuralPart | ~700 |
| stylePart (rendered, standard) | ~900 |
| furniturePrompt (old) | ~160 |
| influencePrompt | ~25 |
| **Total text** | **~1,785** |
| roomImage × 2 | ~2,400 |
| furnitureImage × 1 | ~1,200 |
| **Total images (with furniture)** | **~3,600** |
| **V3.0 total (with furniture, no moodboard)** | **~5,385** |

### V4.0 text additions

| Addition | Tokens | Lite mode? |
|---|---|---|
| Image role labels (3–5 parts × ~15 tokens) | +55 | Yes (always) |
| Constraint hierarchy block (active) | +380 | Yes (always) |
| Identity preservation block header | +220 | Yes (always) |
| Style furnishing rule modification (net) | +20 | Yes (always) |
| Exact fidelity flag (when exact mode) | +25 | Yes (always) |
| Self-audit item 5 addition | +85 | **No — omitted** |
| Self-audit items 1–4 (existing) | +195 | **No — omitted** |
| Catalogue metadata per item (max) | +60 | **No — omitted** |

### Cost comparison

| Scenario | Input tokens | vs. v3.0 equivalent |
|---|---|---|
| v3.0, no furniture | ~4,185 | baseline |
| v3.0, with 1 furniture | ~5,385 | +28.7% over no-furniture |
| v4.0 standard, no item | ~4,621 | +10.4% over v3.0 no-furniture |
| v4.0 standard, 1 item | ~6,303 | **+17.1% over v3.0 with furniture** |
| v4.0 lite, 1 item | ~6,023 | +11.9% over v3.0 with furniture |
| v4.0 standard, 1 item, no self-audit* | ~5,943 | +10.4% over v3.0 with furniture |

*Showing self-audit removal in isolation for reference.

**Key conclusion:** The entire cost increase from v3.0 to v4.0 for comparable requests (both with 1 furniture image) is **+17.1% in standard mode**, driven entirely by text additions. No additional images are introduced for single-item requests. The image count is identical to v3.0 with furniture.

### Multi-item cost projection (v4.1 planning reference)

Each additional injected item adds approximately:
- 1 image: ~1,200 tokens
- Item label + detail line: ~120 tokens
- Per-item total: ~+1,320 tokens

| Items | Additional tokens vs. v4.0 1-item | % increase |
|---|---|---|
| 2 items | +1,320 | +21.0% |
| 3 items | +2,640 | +41.9% |

This is the reason for the v4.0 single-item cap. At 3 items, cost increases ~42% over 1-item requests. Combined with diminishing output quality at 3+ hard constraints, the cost/quality tradeoff degrades sharply above 3 items.

### Diminishing returns

At approximately 2,500–3,000 text tokens, adding additional constraint text produces less than 5% compliance improvement per 100 additional tokens. v3.0 is at ~1,785 text tokens. v4.0 Phase 1 will be at ~2,460 text tokens. This puts v4.0 near the inflection point.

**Implication:** Phase 3 catalogue metadata must be compressed. A structured one-line format (`Material: natural oak | Color: off-white | Finish: matte`) is equally or more effective than a paragraph description at this token density, because compressed forms reduce the model's opportunity to weight narrative fluency over constraint following. Verbose metadata injection past the inflection point adds cost without proportional quality improvement.

### Design implications for scaling

1. **Image count is the primary cost lever.** Moodboard images, additional injected items, and refinement passes each add ~1,200 tokens. Prompt text additions are secondary.

2. **Lite mode is meaningful at volume.** ~340 tokens saved per request. At 10,000 requests/day, this is 3.4M tokens/day. At current Gemini pricing tiers, the savings are non-trivial.

3. **Exact mode adds negligible cost.** The `EXACT_FIDELITY_FLAG` is 25 tokens. Catalogue metadata is ~60 tokens. Total exact-mode overhead is ~85 tokens — less than 2% of a single image's cost.

4. **The structural improvements pay for themselves.** A generation that returns the wrong item identity requires a re-generation. A re-generation costs the full request price. Preventing 1 in 7 re-generations due to identity failure covers the cost of all v4.0 text additions.

---

## 11. V4.0 Scope — Locked Decisions

The following decisions are locked for v4.0 and should not be revisited without a documented rationale.

| Decision | Resolution | Rationale |
|---|---|---|
| Max injected items | **1** | Reduces constraint load, cost, placement ambiguity; easier regression testing; faster shipping |
| Multi-item support | **Deferred to v4.1** | v4.1 adds placement conflict rules and escalating hint requirements |
| Data model | **`InjectedItem[]`** | Array model now; single-item cap enforced by service; no migration needed for v4.1 |
| Catalogue support in v4.0 | **Single catalogue item only** | Same constraint as user upload |
| `furnitureImage` field | **Temporary alias to `injectedItems[0]`** | Backwards compatibility during migration; planned removal in v4.1 |
| `generationMode` | **Internal only** | Not exposed in public API schema in v4.0 |
| Lite mode: role labels | **Always-on** | Highest-impact fix; negligible token cost |
| Lite mode: identity preservation | **Always-on** | Core architectural fix |
| Lite mode: constraint hierarchy | **Always-on** | Core architectural fix |
| Lite mode removes | Self-audit, catalogue metadata | Saves ~340 tokens; acceptable compliance trade for internal use |
| `exact` fidelity | **Perceptual identity** | No material/color/finish adaptation; perspective/scale/shadow always apply |
| Item type as | **Soft placement hint** | Image governs identity; label governs placement reasoning |
| v3.0 pipeline | **Frozen as stable baseline** | No changes; used as regression comparison |
| `groupId` field | **Parsed but not acted on** | Reserved for v5.0 provider coherence |

---

## 12. Implementation Plan

### Phase 1 — Core fixes, highest impact, lowest risk

**Scope:** Prompt architecture changes. No new API fields. No formdata changes. Same inputs, better outputs.

**Changes:**

1. Create `src/prompts/imageRoles.ts` with `IMAGE_ROLES` object
2. Create `src/prompts/balanced_v4_0/visualization.constants.ts`:
   - Re-export `BALANCED_V4_0_STRUCTURAL_PART` from v3.0 (identical — no duplication needed)
   - Copy `BALANCED_V4_0_STYLE_TEMPLATE` from v3.0 with two targeted modifications
   - Add `INJECTED_ITEM_BLOCK_HEADER` constant
   - Add `EXACT_FIDELITY_FLAG` constant
   - Add `buildConstraintHierarchyBlock(injectedItemCount: number)` function
   - Add `buildItemDetailLine(item: InjectedItem)` function (stub in Phase 1 — handles only fidelity flag)
   - Re-export influence constants from `improved/visualization.constants.ts`
3. Create `src/prompts/balanced_v4_0/visualization.prompt.ts`:
   - `buildVisualizationPrompt` — injection layer (carries v3.0 logic + `hasInjectedItem` and `isLite` params)
   - `buildInfluencePrompt` — pass-through from improved
   - `normalizeItemType` — ambiguous label normalization
4. Create `src/services/balanced_v4_0/geminiService.ts`:
   - Full request assembly per Section 8
   - Service-layer validation: max 1 item
   - Migration shim: `furnitureImage` → `injectedItems[0]` (inline, no formdata change)
   - `generationMode` defaults to `'standard'`
5. Add `'balanced_v4_0'` to `pipelineMode` union in `src/types.ts`
6. Add `InjectedItem`, `ItemFidelityMode`, `GenerationMode` interfaces to `src/types.ts`
7. Add routing for `'balanced_v4_0'` in `src/controllers/main.ts`

**What this fixes:** Image role ambiguity, style-override conflict, missing preservation semantics, no negative constraints, self-audit asymmetry.

**Expected impact:** Large. The style-override conflict is the primary failure mode observed in smoke testing. The combination of role labeling + constraint hierarchy + identity block directly targets all three root causes simultaneously.

**Risk level: Low.** v3.0 is untouched. Rollback is `pipelineMode: 'balanced_v3_0'`. All changes are in a new pipeline directory.

---

### Phase 2 — Metadata fields and structural improvements

**Scope:** New optional fields on `InjectedItem`, formdata extraction, normalized item type, lite mode activation.

**Changes:**

1. Update `src/utils/formdata.utils.ts`:
   - Extract `itemType`, `placementHint`, `fidelityMode`, `itemMaterial`, `itemColor`, `itemFinish` from multipart form fields
   - Build migration shim cleanly: `furnitureImage` form field → `injectedItems[0]`; `injectedItemImage` field takes precedence if both present
   - Remove `furnitureImage` from `ProcessedFormData` type (it now lives in `injectedItems[0]`)
2. Update `buildItemDetailLine` to populate all fields from `InjectedItem` (Phase 1 stub → full implementation)
3. Activate `normalizeItemType` in the request assembly path
4. Add `generationMode: 'lite'` path to `buildVisualizationPrompt` (conditionally exclude self-audit and catalogue metadata)
5. Add service-layer validation with actionable error message: `HTTP 400` for `injectedItems.length > 1`

**What this adds:** Item type as placement hint, catalogue metadata injection, deterministic item type fallback behavior, lite mode, clean formdata extraction.

**Expected impact:** Medium incremental over Phase 1. Item type labeling improves placement reliability for ambiguous objects (flat items like rugs, surface treatments like countertops, partially cropped catalogue images). Catalogue metadata directly improves material/color fidelity for `exact` mode requests.

**Risk level: Low-to-medium.** Formdata changes require integration testing. All new fields are optional — existing callers continue to work without them.

---

### Phase 3 — Multi-item and catalogue expansion (v4.1 / v5.0)

**Scope:** Lift single-item cap, add placement conflict resolution, catalogue URL path, provider set support.

**Changes:**

1. Lift `injectedItems.length <= 1` cap to `<= 3`
2. Add escalating placement hint requirement:
   - 1 item: optional
   - 2–3 items: required for all items (HTTP 400 if any item missing `placementHint`)
3. Add multi-item placement conflict rule to items block:
   ```
   PLACEMENT CONFLICT RULE:
   Each injected item must occupy a distinct spatial zone.
   If placement hints conflict, honor Item 1 first, then resolve remaining items relative to Item 1.
   Do not omit any item due to spatial conflict — find a placement for each.
   ```
4. Add catalogue URL path (accepts `imageUrl` instead of multipart upload)
5. Activate `groupId` semantics — items sharing a `groupId` are a designed set, placed in coherent spatial relationship
6. Expose `generationMode` in public API schema
7. Remove `furnitureImage` field (migration window complete)

**What this adds:** Multi-item scene composition, provider set coherence, removes upload requirement for catalogue items.

**Expected impact:** Large for catalogue use cases with multiple items. Medium for multi-item user upload.

**Risk level: Medium.** Multi-item placement at 2–3 items is a harder generation problem. Requires dedicated regression suite including item conflict cases before shipping.

---

## 13. File & Code Structure

### New files to create

| File path | Contents |
|---|---|
| `src/prompts/imageRoles.ts` | `IMAGE_ROLES` object with all role label functions |
| `src/prompts/balanced_v4_0/visualization.constants.ts` | Template version, structural part (re-export), style template (v3.0 + 2 mods), items block header, exact fidelity flag, constraint hierarchy builder, item detail line builder, influence constants (re-export) |
| `src/prompts/balanced_v4_0/visualization.prompt.ts` | `buildVisualizationPrompt` injection layer, `buildInfluencePrompt`, `buildFurniturePrompt` (deprecated shim), `normalizeItemType` |
| `src/services/balanced_v4_0/geminiService.ts` | `generateVisualization` — full v4.0 request assembly |

### Files to modify

| File path | Changes |
|---|---|
| `src/types.ts` | Add `InjectedItem`, `ItemFidelityMode`, `GenerationMode`; modify `GenerateVisualizationParams` to add `injectedItems: InjectedItem[]`, `generationMode?: GenerationMode`; add `'balanced_v4_0'` to `pipelineMode` union |
| `src/utils/formdata.utils.ts` | Extract new optional fields; build migration shim; update `ProcessedFormData` type |
| `src/controllers/main.ts` | Add `'balanced_v4_0'` routing to new service |

### Files that must not change

| File path | Reason |
|---|---|
| `src/services/balanced_v3_0/geminiService.ts` | v3.0 is the frozen reference baseline |
| `src/prompts/balanced_v3_0/visualization.constants.ts` | v3.0 template is frozen |
| `src/prompts/balanced_v3_0/visualization.prompt.ts` | v3.0 injection layer is frozen |
| All other pipeline services | v4.0 is strictly additive |

### Module responsibilities

| Module | Responsibility |
|---|---|
| `imageRoles.ts` | Single source of truth for all image role label strings |
| `balanced_v4_0/visualization.constants.ts` | All static and semi-static prompt content; constraint block builder; item detail assembler |
| `balanced_v4_0/visualization.prompt.ts` | Dynamic injection layer; placeholder resolution; validation; `normalizeItemType` |
| `balanced_v4_0/geminiService.ts` | Request assembly; API call; service-layer validation; debug output |
| `types.ts` | All shared interfaces; no business logic |
| `formdata.utils.ts` | Multipart parsing; field extraction; migration shim; no prompt logic |
| `controllers/main.ts` | Routing only; no business logic |

---

## 14. Validation & Regression Strategy

### Approach

All regression tests run against both `balanced_v3_0` and `balanced_v4_0` with identical inputs. Failures on v4.0 that pass on v3.0 are regressions. Improvements on v4.0 over v3.0 for furniture-related cases are the expected outcome.

### Group A — No injected item (v4.0 must not regress on style quality)

| ID | Input | Pass condition |
|---|---|---|
| A1 | Room only, no item, `balanced_v4_0` | Style output visually equivalent to v3.0 baseline |
| A2 | Room + moodboard, no item | Style and moodboard influence equivalent to v3.0 |
| A3 | Room only, refinement pass | Refinement behavior unchanged from v3.0 |
| A4 | Request structure inspection | Debug `requestStructure` shows Tier 2 as `INACTIVE`; no items block appears |

### Group B — Single item, identity preservation

| ID | Input | Pass condition |
|---|---|---|
| B1 | Upload distinctive sofa, neutral style | Sofa silhouette and color match reference image |
| B2 | Upload distinctive sofa, high-contrast style (e.g., dark industrial) | Sofa preserved as-is; style expressed through other surfaces and furniture |
| B3 | Upload walnut-finish chair, style that typically uses painted wood | Chair remains walnut; no paint applied |
| B4 | Upload off-white bouclé sofa, style with dark palette | Sofa color unchanged; room palette applied elsewhere |
| B5 | Upload item with strong design identity (distinctive silhouette) | Item silhouette preserved; not genericized into style-typical form |
| B6 | Upload item, no `itemType` | Generation succeeds; item placed reasonably; no error |
| B7 | Upload item with `itemType` set | Item placed using type placement logic; identity from image preserved |

### Group C — Item type behavior

| ID | Input | Pass condition |
|---|---|---|
| C1 | Upload settee, `itemType: "sofa"` | Item rendered from image (settee silhouette); placed using sofa zone logic |
| C2 | Upload rug (flat, ambiguous from image), no `itemType` | Item placed as floor covering |
| C3 | Upload countertop slab, `itemType: "countertop"` | Slab placed as surface treatment, not freestanding furniture |
| C4 | Upload item, `itemType: "furniture"` (ambiguous) | Normalized to null; generation proceeds using image-only inference; no error |
| C5 | Upload item, `itemType: ""` (empty) | Normalized to null; no empty label in request |

### Group D — Fidelity modes

| ID | Input | Pass condition |
|---|---|---|
| D1 | Catalogue item (off-white, matte), `fidelityMode: 'exact'`, warm-lit room | Item color remains off-white; not warm-shifted |
| D2 | Catalogue item (matte black), `fidelityMode: 'exact'`, high-gloss style | Finish remains matte; no gloss adaptation |
| D3 | Same item as D2, `fidelityMode: 'preserve'` | Item preserved but minor lighting adaptation acceptable |
| D4 | Debug inspection | `requestStructure` shows `EXACT FIDELITY FLAG` in detail TEXT block for exact mode requests |

### Group E — Migration and API contract

| ID | Input | Pass condition |
|---|---|---|
| E1 | Request with `furnitureImage` field (old path), `pipelineMode: 'balanced_v4_0'` | Shim maps to `injectedItems[0]`; generation succeeds |
| E2 | Request with both `furnitureImage` and `injectedItemImage` | `injectedItemImage` takes precedence |
| E3 | Request with 2 injected items | HTTP 400 with message referencing v4.1 |
| E4 | Request with `generationMode: 'lite'` | Self-audit absent from `stylePart`; role labels present in `requestStructure` |

### Group F — Constraint hierarchy and structural integrity

| ID | Input | Pass condition |
|---|---|---|
| F1 | Upload item + style that aggressively replaces all furniture | Structural elements unchanged; item preserved; non-injected furniture restyled |
| F2 | Upload item + user text request to replace the injected item | Item preserved; user text honored only for non-injected elements |
| F3 | Upload item + moodboard showing different item of same type | Item identity from upload used; moodboard does not override item |
| F4 | Debug structure inspection | `requestStructure` matches expected sequence: `LABEL:BASE ROOM IMAGE`, `IMAGE`, `TEXT` (hierarchy), `TEXT` (structural), `TEXT` (style), `LABEL:MOODBOARD REFERENCE 1` (if moodboard), `IMAGE`, `TEXT` (items block), `LABEL:INJECTED ITEM 1`, `IMAGE`, `TEXT` (detail), `TEXT` (influence), `LABEL:BASE ROOM IMAGE — RE-ANCHOR`, `IMAGE` |

### Qualitative smoke tests (before marking any phase complete)

1. Run 5 different style presets with the same uploaded item image. All 5 results must show the item preserved with visible style difference expressed in surrounding room elements.
2. Run 1 catalogue item (exact mode) in 3 different room types. Material and color must remain consistent across all 3.
3. Run the same item with and without `itemType`. Confirm item identity is unchanged between the two runs — only placement reasoning differs.
4. Run a refinement pass with an injected item. The item must persist through the refinement with no degradation to identity.

### What failures indicate

| Failure type | Likely cause |
|---|---|
| Item restyled to match preset | Constraint hierarchy not reaching model; style part modification not applied; or Tier 2 activation condition not firing |
| Item replaced with generic version | NEVER clause in identity block not present; or items block not inserted |
| Item absent from output | Items block not inserted; or image role label not applied; or model treating item as moodboard |
| Item present but wrong color | EXACT_FIDELITY_FLAG not appended for exact mode requests |
| Style regression (no item) | Constraint hierarchy block interfering with style instructions; Tier 2 incorrectly activating when item count = 0 |
| Request structure mismatch | Assembly logic in `geminiService.ts` not following spec; inspect `debug.requestStructure` |

---

## 15. Future Roadmap (V4.1 → V5.0)

### V4.1 — Multi-item support

**Target:** Support 2–3 injected items per visualization.

Changes required:
- Lift single-item cap: `injectedItems.length <= 3`
- Add multi-item placement conflict rule to items block header
- Add escalating placement hint requirement: 1 item = optional; 2–3 items = required for all
- Implement HTTP 400 for 2–3 items missing placement hints
- Add regression test groups G (multi-item placement) and H (item conflict scenarios)

**Known complexity:** Multi-item placement is a harder generation problem. At 2 items that could occupy the same spatial zone, the conflict rule needs to be explicit. At 3 items, all placement hints are required. The model's ability to honor 3 simultaneous strong identity constraints while also applying style transformation is near the ceiling of reliable constraint following.

**Recommended max for v4.1:** 3 items with a strong recommendation to provide placement hints for all. Document that item identity fidelity may degrade with 3 items compared to 1 item.

### V4.1 — Catalogue URL path

Add a structured JSON body path for catalogue items that accepts `imageUrl` instead of multipart upload. The service fetches the image, converts it to a buffer, and processes it identically to an upload. Benefits: removes frontend burden of fetching and re-uploading catalogue images; enables service-side caching by URL.

### V4.1 — Expose `generationMode` in public API

Once lite mode behavior is validated in internal use, expose `generationMode` as a documented request parameter. Document the trade-offs (lite mode skips self-audit, which may reduce compliance on complex multi-constraint requests).

### V5.0 — Provider set coherence

Activate `groupId` semantics. Items sharing a `groupId` are a designed set and should be placed in spatial relationship to each other. This requires:
- Grouping logic in the items block assembly (grouped items get a shared preamble)
- Placement language for sets: "Items 1 and 2 form a designed set — place them in a coherent arrangement within the [seating area / dining zone]"
- A new regression group for provider set placement

### V5.0 — Remove `furnitureImage`

After catalogue and multi-item paths are established and callers have migrated to `injectedItems[]`, remove the `furnitureImage` field from the public schema. Announce deprecation at v4.1 with a migration period.

### V5.0 — Pricing tier alignment

The cost analysis shows a meaningful difference between:
- No item: ~4,621 tokens
- 1 item (standard): ~6,303 tokens
- 1 item (lite): ~6,023 tokens
- 3 items (standard, future): ~8,943 tokens

If the platform introduces usage-based pricing, these tiers map naturally to "standard visualization", "item injection", and "multi-item injection" billing tiers. The internal `generationMode` infrastructure already supports this differentiation.

---

## 16. Open Questions & Known Limitations

### Known generative model limitations

**1. Geometric reinterpretation is unavoidable.**
Gemini cannot pixel-accurately drop a product photograph into a room scene without computing new perspective, occlusion, and scale. `exact` fidelity mode preserves material/color/finish identity but cannot prevent the model from making geometric adjustments. This is correctly documented as expected behavior.

**2. Constraint capacity ceiling.**
Generative instruction-following models have a practical limit on the number of simultaneous hard constraints they can honor reliably. Empirically, this is approximately 5–7 hard constraints in a single generation task. v3.0's structural part already contains 10+ rules. v4.0 adds a constraint hierarchy block and an identity preservation block. At 3 injected items (v4.1+), total constraint count may exceed reliable compliance range. This is a documented tradeoff, not a bug.

**3. Color temperature adaptation is difficult to control precisely.**
The `exact` fidelity flag prohibits color temperature adaptation. In practice, Gemini has a tendency to warm-shift items placed in warm-lit rooms. The flag reduces this but may not eliminate it entirely. This is an inherent behavior of the generation model, not a prompt deficiency. High-variance cases should be surfaced in regression testing.

### Open questions

**1. Placement hint requirement threshold.**
The v4.0 spec makes placement hints optional for single-item requests. A case could be made for requiring placement hints as soon as `fidelityMode: 'exact'` is used, since exact-mode items have stricter requirements and the model has less latitude to find a suitable location. This was not decided in v4.0 and remains open.

**2. Item type normalization scope.**
The current normalization list (`['furniture', 'item', 'thing', 'object', 'piece', '']`) is conservative. There may be super-category labels like `"seating"` or `"storage"` that are too broad for precise placement but not noise. Whether to normalize these or pass them through is not decided. The current implementation passes them through (they provide some placement context even if broad).

**3. Multi-item cap above 3.**
The 3-item maximum for v4.1 is a quality-and-cost recommendation, not a fundamental architectural limit. Some use cases (showroom visualizations with 5+ items) may require a higher cap. The appropriate limit for those use cases and whether a different generation approach (e.g., iterative injection) would produce better results at higher item counts is an open question.

**4. `furnitureImage` removal timeline.**
The decision to keep `furnitureImage` as an alias is documented. The removal timeline is not. This should be decided before v4.1 ships so callers have clear migration guidance.

**5. Catalogue image caching.**
Once the catalogue URL path is implemented in v4.1, the service will fetch catalogue images on each request. Whether to cache these by URL (and for how long) depends on catalogue update frequency and infrastructure considerations not evaluated in this spec.

---

*End of V4.0 specification.*

---

## Appendix A — V5.x Build History (Actual vs. Spec Roadmap)

**Date added:** 2026-04-30  
**Purpose:** The Section 15 roadmap projected a V5.0 focused on provider set coherence and multi-item support. The actual V5.x development track diverged to address a higher-priority problem: moodboard behavioral control. This appendix documents what was actually built.

---

### Note on TIER 5

The TIER 5 definition in Section 5 of this document reflects V4.0 ("Applied as directed by the influence setting. Does not override tiers 1–4."). As of V5.2.1, TIER 5 reads:

> Apply moodboard influence as a tonal overlay on top of the style — palette, light quality, and surface finish. It tints; it does not compete. Does not override Tiers 1–4.

The tier hierarchy, tier count, and all other tiers are unchanged from V4.0.

---

### V5.0 — Lean Moodboard System

**What triggered it:** Style influence slider was removed from product direction. The prior influence prompt system (calibrating moodboard weight vs. preset weight by percentage) was replaced with a fixed-role system where moodboards are always bounded modifiers.

**What was built:**
- TIER 5 rewritten to name the permitted extraction dimensions (palette direction, surface texture, lighting mood)
- Moodboard scope block inserted as a text part immediately before moodboard images — operational instructions for what the model is and is not allowed to extract
- MOODBOARD_V5 image role label introduced (distinct from the V4.x MOODBOARD label, which is preserved and frozen)
- V5 influence statement added as trailing reinforcement — flagged for removal after regression validation

**What was deferred:** V5.0's role in the Section 15 roadmap (provider set coherence via `groupId`, multi-item above 3, `furnitureImage` removal) remains deferred. These items were not prioritized over the moodboard system.

---

### V5.1 — Prompt Compression

**What triggered it:** V5.0 added ~200 tokens of new moodboard machinery on top of V4.1's already-large prompt. V5.1 conducted a systematic redundancy audit and two compression passes to bring the prompt back within the V4.1 token envelope while retaining full constraint coverage.

**What was built:**
- Phase 1: ~345 words removed (~23%) — redundant sections, redundant rule restatements
- Phase 2: ~327 words removed (~14% of remaining) — phrase-level compression across all blocks
- Combined: ~36–40% reduction vs V5.0 / V4.1
- MOODBOARD_V5 label compressed; per-dimension sub-descriptions moved to scope block

**No behavioral changes.** All constraint coverage, tier hierarchy, placeholder inventory, and injection logic are unchanged.

---

### V5.2 — Structural Hardening + Moodboard Scope Fixes

**What triggered it:** V5.1 moodboard regression suite (run_20260429_171148) revealed:
- 2 structural violations: Industrial × Moodboard A and Industrial × Moodboard C added windows
- Root cause: TIER 1 did not explicitly name window *count* as immutable — a style-prior loophole allowed window additions justified by style
- Additional: moodboard scope block allowed "surface texture" to be interpreted as surface treatments/finishes

**What was built (four compressed rules):**
1. Fixed elements list: `"geometry, positions, and sizes"` → `"count, geometry, positions, and sizes"`
2. TIER 1 new enforcement: `"No additions regardless of style; no new structural elements may be introduced."`
3. TIER 5 style dominance: `"Bounded modifier..."` → `"Style defines form and elements; moodboard modifies tone only."`
4. TIER 5 presence floor: `"Moodboard influence must be applied to at least two primary surfaces."` + `"Conflict with style does not permit suppression below this minimum."`

**Result:** 0 structural violations (resolved). New trade-offs: Japandi SD regression (presence floor over-applying on LOW-density style); Contemporary × B scope overshoot. Both resolved in V5.2.1.

---

### V5.2.1 — Hybrid C Micro-Patch (Relationship-Mode Refinement)

**What triggered it:** V5.2 moodboard regression (run_20260430_141837) and AI optimizer analysis identified:
- Material leakage: "surface texture" language activating architectural finish extraction (travertine, wood slats)
- Floor-vs-ceiling paradox in TIER 5: "style wins" + "moodboard cannot be suppressed by style" creating non-deterministic arbitration

**What was built (two micro-changes, ~25 tokens total):**

1. Scope clarification in `buildMoodboardScopeBlock`:
   > "Surface texture" refers to tactile quality only (rough/smooth, matte/gloss). It does NOT include material identity or architectural finishes.

2. TIER 5 overlay statement (replaces presence floor + style dominance):
   > Apply moodboard influence as a tonal overlay on top of the style — palette, light quality, and surface finish. It tints; it does not compete.

**Net token change:** Slight reduction. No new rules. No exclusion lists. No conditional logic.

---

### Section 15 Roadmap Items — Current Status

| Item | Status |
|---|---|
| Multi-item support (v4.1) | Deferred — still max 1 item |
| Catalogue URL path (v4.1) | Deferred |
| Expose `generationMode` in public API | Deferred |
| Provider set coherence / `groupId` (v5.0) | Deferred |
| Remove `furnitureImage` field (v5.0) | Deferred |
| Pricing tier alignment | Deferred |

All deferred items from the V4.0 roadmap remain valid future work. They were deprioritized in favor of the moodboard reliability track (V5.0 → V5.2.1).

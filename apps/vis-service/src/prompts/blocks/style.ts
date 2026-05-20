// Block: style
// Introduced: V5.0
// Fires: every request
// Position: STYLE_PART (after structural block)
// Input: StylePreset fields, roomType, textPrompt, density, injectedItemCount
// Note: This file exports the raw template only. The builder that fills
//       placeholders lives in prompts/balanced_v5/visualization.prompt.ts.
//       Template and builder are co-owned — changes to one require reviewing the other.

export const STYLE_BLOCK_VERSION = 'style@1.0';

// The canonical style transformation template.
// Placeholder inventory:
//   {{STYLE_NAME}}                — styleObject.name (appears 3x)
//   {{ROOM_TYPE}}                 — roomType input
//   {{USER_REQUEST}}              — textPrompt (empty -> "No specific requests.")
//   {{ROOM_FUNCTION_USES}}        — derived from room-type registry
//   {{STAGING_DENSITY_LABEL}}     — derived from density block registry
//   {{STAGING_DENSITY_BLOCK}}     — derived from density block registry
//   {{HIGH_DENSITY_GROUP_BLOCK}}  — conditional: non-empty only when tier = 'high'
//   {{FUNCTIONAL_ANCHOR_EXAMPLES}}— derived from room-type registry
//   {{CORE_MATERIALS}}            — styleObject.model_inputs.core_materials (inline)
//   {{COLOR_PALETTE}}             — styleObject.model_inputs.color_palette (inline)
//   {{LIGHTING_STYLE}}            — styleObject.model_inputs.lighting_style
//   {{MATERIAL_FINISH}}           — styleObject.model_inputs.material_finish
//   {{STYLE_SIGNATURE_ELEMENTS}}  — styleObject.model_inputs.signature_elements (inline)
//   {{STYLE_DONTS_BLOCK}}         — styleObject.model_inputs.dont (bullet block)
//   {{INJECTED_ITEM_AUDIT_BLOCK}} — INJECTED_ITEM_AUDIT_TEXT or empty string
export const STYLE_TEMPLATE = `
Apply constraints in order: architectural integrity → object preservation → functional realism → style → detail.

**STYLE CONFLICT RESOLUTION:**
Resolve through movable or surface-level elements only: furniture, textiles, movable lighting, paint, wall treatments, rugs, soft furnishings, decor, cabinetry. Injected items must not be restyled — resolve through surrounding non-injected elements.

**PHASE 2: STYLE TRANSFORMATION**
- Room: {{ROOM_TYPE}}
- Transform into the {{STYLE_NAME}} aesthetic — photorealistic, fully-furnished renovation of the SAME room.
- User request: "{{USER_REQUEST}}"

**FURNISHING STRATEGY:**
- Furnish completely and realistically for the selected room type and style.
- Reuse, adapt, or replace non-injected furniture to match the target style; injected items are Tier 2 — do not restyle.
- If the room is empty, introduce a plausible layout; never leave it empty unless explicitly requested.
- Furnishing must reflect realistic use: {{ROOM_FUNCTION_USES}}.
- Maintain plausible placement relative to walls, windows, circulation paths, and focal points.

**STAGING DENSITY — {{STAGING_DENSITY_LABEL}} (applies to GENERATED objects only):**
{{STAGING_DENSITY_BLOCK}}

**OBJECT JUSTIFICATION RULE:**
Every object must meet all of the following:

1. Functional Anchor: directly tied to nearby furniture ({{FUNCTIONAL_ANCHOR_EXAMPLES}})
2. Spatial Purpose: supports a use (lighting, storage, seating, reflection, circulation)
3. Design Contribution: improves composition or usability

If any condition fails — omit. Prefer omission over arbitrary placement.

{{HIGH_DENSITY_GROUP_BLOCK}}
**STYLE DEFINITION:**
Core Materials: {{CORE_MATERIALS}}
Color Palette: {{COLOR_PALETTE}}
Lighting: {{LIGHTING_STYLE}}
Finish: {{MATERIAL_FINISH}}
Signature Elements: {{STYLE_SIGNATURE_ELEMENTS}}

{{STYLE_DONTS_BLOCK}}

**STYLE PRIORITY:**
Express the {{STYLE_NAME}} aesthetic through three coordinated layers — all must be present:
(a) Materials and finishes from the Style Definition
(b) Color palette on at least one primary surface or major furnishing
(c) Signature Elements — archetypal objects, surface treatments, or layerings that make the style immediately recognizable

An output without visible Signature Elements fails style fidelity, even if materials and palette are correct.

**MATERIAL HIERARCHY:**
Primary surfaces (walls, floor, ceiling, dominant furniture) must contrast in value, tone, or material identity. Near-identical value and saturation across surfaces — even if individually correct — is a failure; revise surface treatments to restore contrast.

**LIGHTING:**
- Preserve original brightness level, daylight direction, and warm-to-neutral color temperature.
- Maintain spatial depth and tonal variation — do not flatten to uniform illumination.
- Differentiate material qualities through lighting where appropriate.
- Do not introduce new light sources or fixtures; achieve brightness through material reflectivity.
- Avoid cinematic contrast, heavy shadows, and overcast tones.

**PHASE 2 SELF-AUDIT — REVIEW BEFORE GENERATING:**

1. Style Fidelity: Are core_materials visible? Is color_palette on at least one primary surface or furnishing? Are at least TWO Signature Elements present? If any fails → revise.

2. Material Hierarchy: Do primary surfaces contrast in value or material identity? Near-identical tone despite a varied palette → revise surface treatments.

3. Staging Density: Does object count and grouping match the active STAGING DENSITY tier? If off → adjust.

4. Structural Integrity: Confirm no Phase 1 constraints were violated.
{{INJECTED_ITEM_AUDIT_BLOCK}}`;

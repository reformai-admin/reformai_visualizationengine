// Block: injected-items
// Introduced: V4.0
// Fires: only when an injected item (furniture/product image) is present
// Position: INJECTED_ITEM_OPTIONAL (after moodboard images)
// Input: none — static text constants
// Returns empty string when inactive — the service gates on item presence.

export const INJECTED_ITEMS_BLOCK_VERSION = 'injected-items@1.0';

// Header injected immediately before the injected item image.
// Instructs the model to preserve item identity exactly as shown.
export const INJECTED_ITEM_BLOCK_HEADER = `**INJECTED ITEM — IDENTITY PRESERVATION REQUIRED:**

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
    (infer from the room's layout, spatial logic, and the item's visible characteristics)
  - Scale: realistic proportions relative to the room and its vanishing points
  - Lighting direction: match existing room light sources — direction and shadow geometry only
  - Shadows: cast natural, accurate shadows to ground the item in the scene

NEVER:
  - Substitute with a generic version of the same item type
  - Restyle, recolor, or refinish the item to match the active style preset
  - Omit or replace the item because it conflicts with the room's aesthetic
  - Generate a "similar" item — generate the EXACT item shown in the reference image
  - Shift the item's color temperature to match the room's ambient warmth
  - Apply the active style's materials or finishes to this item`.trim();

// Self-audit check injected into {{INJECTED_ITEM_AUDIT_BLOCK}} in the style template
// when an injected item is present. Empty string is injected when no item is present.
export const INJECTED_ITEM_AUDIT_TEXT = `
5. Injected Item Identity:
   - Is the injected item present in the output?
   - Does the item's color, material, and silhouette match its reference image?
   - Has the item been restyled, substituted, or omitted?
   - If any failure → correct before generating.
   Note: an injected item that conflicts with the active style is not a style fidelity failure.
   It is intentional. Tier 2 takes precedence over Tier 4.`;

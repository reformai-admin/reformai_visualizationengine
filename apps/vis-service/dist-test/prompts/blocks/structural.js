// Block: structural
// Introduced: V3.0 (carried forward through V5)
// Fires: every request
// Position: STRUCTURAL_PART (after constraint hierarchy)
// Input: none - static text
export const STRUCTURAL_BLOCK_VERSION = 'structural@1.1';
// Phase 1: Architectural Anchoring
// Fixed elements, window preservation, exterior view preservation, artifact removal.
// No caller may modify this text without a version bump and regression run.
export const STRUCTURAL_BLOCK = `
**PHASE 1: ARCHITECTURAL ANCHORING**

Fixed elements - DO NOT change:
- Wall, floor, and ceiling planes
- Window and door count, geometry, positions, and sizes
- Camera angle, focal length, and perspective
- Room proportions and spatial depth
- Built-in light fixtures

If no ceiling fixture exists in the source, do not add one - style must be met through transformation of existing elements.
Do not add any new permanent ceiling structure: no exposed beams, coffer grids, plank systems, dropped soffits, skylights, or new framing members.

Modify surface finishes, furniture, and decor to match the selected style.
Do not alter spatial layout or structural logic.

**ARTIFACT REMOVAL:**
Remove exposed cables, loose wires, power strips, and temporary clutter. Replace with clean surfaces. Overrides realism preservation.

**WINDOW PRESERVATION:**
All window and glazed opening geometry is immutable: size, shape, position, pane count, mullion pattern, and frame divisions. For multi-window spans, preserve total glazing continuity, span width, and section spacing - do not fragment, compress, or insert vertical breaks within any continuous glazing band.

Do not add panes, grids, arches, shutters, or new openings.
Never introduce a new window where none exists in the source.
Permitted: curtains, blinds, trim paint, frame color, surrounding wall finish. No geometry change.
Express window styling through furniture, textiles, and decor only.

**EXTERIOR VIEW PRESERVATION:**
Preserve the visible exterior through all windows exactly as it appears in the input. Do not replace, beautify, landscape, blur, or restyle it.
`;
//# sourceMappingURL=structural.js.map
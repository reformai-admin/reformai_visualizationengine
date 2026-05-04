// ============================================================
// BALANCED V5 / V6.0 — PROMPT CONSTANTS
// TEMPLATE VERSION: 6.0
// COMPATIBLE WITH: pipelineMode "balanced_v5"
//
// V5.0 (initial Lean Moodboard release):
//   1. TIER 5 rewrite — no slider reference; names permitted dimensions
//   2. Moodboard scope block — operational instructions before moodboard images
//   3. V5 influence statement — replaces 3-state slider strings (flagged for removal)
//
// V5.0 → V5.1 (Phase 1 + Phase 2 compression):
//
//   Phase 1 — redundancy removal:
//     - Structural part: WINDOW IMMUTABILITY RULE + WINDOW SYSTEM INTEGRITY merged
//       into single WINDOW PRESERVATION section (saves ~110 words)
//     - Style template: MIRROR PLACEMENT RULE removed — fully covered by Object
//       Justification Rule (Functional Anchor test), saves ~60 words
//     - Style template: RENOVATION FEASIBILITY removed — generic guidance with no
//       documented regression history, saves ~30 words
//     - Style template: Self-audit check 4 compressed to Phase 1 back-reference
//     - imageRoles.ts: MOODBOARD_V5 label compressed to role declaration +
//       extraction ceiling only, saves ~30 words per image
//
//   Phase 2 — phrase-level compression:
//     - Structural: Fixed Elements list (parallel form); fixture parenthetical
//       removed; two-sentence fixture note → one sentence
//     - Structural: Artifact Removal inline sentence; Exterior View third
//       sentence (restatement) removed
//     - Constraint hierarchy: 3-sentence preamble → single line; TIER 2
//       bullet list → compact prose; TIER 3–5 bullets → inline rules
//     - Style template: Style Conflict Resolution 4-bullet list → inline;
//       Phase 2 Task + Output bullets merged; Style Priority tightened;
//       Material Hierarchy two-restatement sentences → one merged sentence;
//       Lighting bullets 4+5 merged (fixture immutability + reflectivity)
//     - Self-audit: scaffolding preamble removed; check 1 "viewer identify"
//       meta-question removed; checks 1–3 compressed; density tier descriptions
//       removed from check 3 (defined in staging density block above)
//     - Moodboard scope: filler opener compressed; redundant "Materials remain"
//       sentence removed; conflict rule tightened
//     - Density suffixes: final "Density is a protected style dimension" sentence
//       removed; merged to single sentence with semicolon
//
// V5.2 → V5.2.1 (Hybrid C micro-patch — relationship-mode refinement):
//
//   TIER 5 (buildConstraintHierarchyBlock):
//     - Removed: "Style defines form and elements; moodboard modifies tone only."
//     - Removed: "Moodboard influence must be applied to at least two primary surfaces."
//       (presence floor — caused Japandi SD regression; floor-vs-ceiling paradox)
//     - Removed: "Conflict with style does not permit suppression below this minimum."
//     - Replaced all three with single overlay statement:
//       "Apply moodboard influence as a tonal overlay on top of the style —
//        palette, light quality, and surface finish. It tints; it does not compete."
//       (specifies relationship mode, implicitly enforces presence, prevents both
//        suppression and style displacement without a count-based paradox)
//
//   MOODBOARD SCOPE (buildMoodboardScopeBlock):
//     - Added: '"Surface texture" refers to tactile quality only (rough/smooth, matte/gloss).
//               It does NOT include material identity or architectural finishes.'
//       (closes material leakage — travertine/wood-slat extraction via "surface texture"
//        ambiguity in prior scope language)
//
//   Net token change: −2 lines (TIER 5) + 1 line (scope) = slight reduction.
//   No new rules. No exclusion lists. No conditional logic.
//
// V5.1 → V5.2 (minimal constraint refinement — moodboard validation fixes):
//
//   Four compressed rules replace verbose prior language. Replacements only — no additions.
//
//   STRUCTURAL (TIER 1):
//     - Immutable summary: "window/door geometry" → "window/door count, geometry, and positions"
//       (opening count was not previously named; absence was the Industrial window violation root cause)
//     - New enforcement line: "No additions regardless of style; no new structural elements
//       may be introduced." — closes style-prior loophole (Industrial window additions)
//     - BALANCED_V5_STRUCTURAL_PART fixed elements list: "geometry, positions, and sizes"
//       → "count, geometry, positions, and sizes"
//
//   MOODBOARD SCOPE (buildMoodboardScopeBlock):
//     - Replaced: 9-line "apply to three dimensions / do NOT apply to" block + conflict rule
//     - With: "Extract only abstract tone (palette, texture quality, lighting).
//              Discard all discrete elements, materials, and forms."
//     - Style conflict rule removed from scope block — now carried by TIER 5 (no duplication)
//
//   STYLE DOMINANCE (TIER 5):
//     - Replaced: "Bounded modifier: palette direction, surface texture, lighting mood only."
//     - With: "Style defines form and elements; moodboard modifies tone only."
//
//   MOODBOARD PRESENCE (TIER 5):
//     - Added: "Moodboard influence must be applied to at least two primary surfaces."
//     - Added: "Conflict with style does not permit suppression below this minimum."
//       (prevents Fix 3 / style-dominance language from being used to suppress all moodboard influence)
//
//   IMAGE ROLES:
//     - MOODBOARD_V5 label: aligned with V5.2 scope language ("abstract tone only /
//       discard all discrete elements, materials, and forms")
//
// What is NOT changed from V4.1:
//   - Constraint coverage (all rules preserved)
//   - System hierarchy (6 tiers; TIER 5 wording unchanged from V5.0)
//   - Behavioral logic (all checks preserved)
//   - Placeholder inventory (identical to V4.1)
//   - Injected item blocks (re-exported from V4.0 unchanged)
//
// INVARIANT: V4.1 and all prior pipeline files are frozen.
//            This file does not modify any shared mutable state.
// ============================================================

// V6.0 additions (catalogue integration — no changes to V5.2.1 template text):
//   - buildConstraintHierarchyBlock: adds optional hasRenovationAnchors parameter;
//     emits TIER 2B [ACTIVE/INACTIVE] between TIER 2 and TIER 3
//   - buildRenovationAnchorsBlock: NEW — builds the full TIER 2B prompt block
//     from ResolvedRenovationSelections; returns empty string when no anchors active
//   - TEMPLATE_VERSION bumped to 6.0.0
//
// V5 template strings (BALANCED_V5_STRUCTURAL_PART, BALANCED_V5_STYLE_TEMPLATE,
// INJECTED_ITEM_AUDIT_TEXT, buildMoodboardScopeBlock, V5_MOODBOARD_INFLUENCE_STATEMENT)
// are UNCHANGED and frozen.

export const TEMPLATE_VERSION = '6.0.0';
export const PIPELINE_MODE = 'balanced_v5';


// ── STRUCTURAL PART ───────────────────────────────────────────────────────────
// V5.1: Defined inline — no longer re-exported from V4.1.
// V4.1/V3.0 structural part is frozen and unmodified.
//
// Phase 1 change: WINDOW IMMUTABILITY RULE + WINDOW SYSTEM INTEGRITY merged
//   into single WINDOW PRESERVATION section. Both rules' behavioral coverage
//   is preserved: individual window geometry immutability (size, shape, position,
//   pane count, mullion pattern, frame divisions) AND continuous-span integrity
//   (no fragmentation, no vertical breaks within a glazing band).
//
// Phase 2 changes (phrase-level only, no coverage lost):
//   - Fixed Elements: parallel list form; fixture type parenthetical removed
//   - Fixture note: two restating sentences → one
//   - Artifact Removal: bullet list → inline sentence; "or staged alternatives" removed
//   - Exterior View: third sentence ("must remain unchanged regardless of style")
//     removed — restatement of sentence 1
// ─────────────────────────────────────────────────────────────────────────────
export const BALANCED_V5_STRUCTURAL_PART = `
**PHASE 1: ARCHITECTURAL ANCHORING**

Fixed elements — DO NOT change:
- Wall, floor, and ceiling planes
- Window and door count, geometry, positions, and sizes
- Camera angle, focal length, and perspective
- Room proportions and spatial depth
- Built-in light fixtures

If no ceiling fixture exists in the source, do not add one — style must be met through transformation of existing elements.

Modify surface finishes, furniture, and decor to match the selected style.
Do not alter spatial layout or structural logic.

**ARTIFACT REMOVAL:**
Remove exposed cables, loose wires, power strips, and temporary clutter. Replace with clean surfaces. Overrides realism preservation.

**WINDOW PRESERVATION:**
All window and glazed opening geometry is immutable: size, shape, position, pane count, mullion pattern, and frame divisions. For multi-window spans, preserve total glazing continuity, span width, and section spacing — do not fragment, compress, or insert vertical breaks within any continuous glazing band.

Do not add panes, grids, arches, shutters, or new openings.
Permitted: curtains, blinds, trim paint, frame color, surrounding wall finish. No geometry change.
Express window styling through furniture, textiles, and decor only.

**EXTERIOR VIEW PRESERVATION:**
Preserve the visible exterior through all windows exactly as it appears in the input. Do not replace, beautify, landscape, blur, or restyle it.
`;


// ── STYLE PART TEMPLATE ───────────────────────────────────────────────────────
// V5.1: Defined inline — no longer re-exported from V4.1.
// V4.1 template is frozen and unmodified.
//
// Phase 1 changes (removed sections):
//   - MIRROR PLACEMENT RULE: removed. A mirror without anchor furniture fails
//     the Object Justification Rule's Functional Anchor test. The mirror rule
//     was a specific instantiation of a gate that already exists.
//   - RENOVATION FEASIBILITY: removed. "Adapt materials to geometry" is covered
//     by Phase 1 immutability. "Match material weight to surface type" is generic
//     guidance with no documented regression history in V4.1.
//   - Self-audit check 4: compressed from 4 bullets to back-reference.
//
// Phase 2 changes (phrase-level only, no coverage lost):
//   - Style Conflict Resolution: 4-bullet list → single inline sentence;
//     movable lighting type examples removed (model-known concept)
//   - Phase 2 task block: "Task" + "Output" bullets merged to one
//   - Furnishing Strategy: injected item note merged inline to bullet 2
//   - Object Justification Rule: "ALL" → "all"; conclusion tightened
//   - Style Priority: "applied to" → "on"; "Avoid generic interpretations" removed
//     (implied by recognizability requirement); "material layerings" → "layerings"
//   - Material Hierarchy: sentences 2+3 (same claim expressed twice) → one merged
//   - Lighting: bullets 4+5 merged — "no new fixtures" + "use reflectivity" are
//     two halves of the same instruction
//   - Self-audit preamble "Run each check. Correct any failure before generating."
//     removed — implied by "REVIEW BEFORE GENERATING" in block header
//   - Self-audit check 1: "Would a viewer identify..." meta-question removed
//     (not independently actionable); "clearly present in the output" → "present"
//   - Self-audit check 2: "Are surfaces the same or near-identical..." removed —
//     negative restatement of "Do primary surfaces contrast?"
//   - Self-audit check 3: LAYERED/BALANCED/SPARSE tier descriptions removed —
//     already defined in the staging density block above; action tightened
//
// Placeholder inventory (identical to V4.1):
//   {{STYLE_NAME}}                — styleObject.name (appears 3×)
//   {{ROOM_TYPE}}                 — roomType input
//   {{USER_REQUEST}}              — textPrompt (empty → "No specific requests.")
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
//
// Whitespace contracts (injection layer — unchanged from V4.1):
//   {{HIGH_DENSITY_GROUP_BLOCK}}  — followed by \n; absent → \n consumed
//   {{STYLE_DONTS_BLOCK}}         — followed by \n\n; absent → \n\n consumed
//   {{INJECTED_ITEM_AUDIT_BLOCK}} — preceded by \n; absent → \n consumed
// ─────────────────────────────────────────────────────────────────────────────
export const BALANCED_V5_STYLE_TEMPLATE = `
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


// ── INJECTED ITEM BLOCKS ──────────────────────────────────────────────────────
// Unchanged from V4.0 / V4.1. Re-exported.
// ─────────────────────────────────────────────────────────────────────────────
export { INJECTED_ITEM_BLOCK_HEADER } from '../balanced_v4_0/visualization.constants.js';
export { INJECTED_ITEM_AUDIT_TEXT } from '../balanced_v4_0/visualization.constants.js';


// ── CONSTRAINT HIERARCHY BLOCK ────────────────────────────────────────────────
// V5.0 change: TIER 5 rewritten (no slider reference; names permitted dimensions).
// V5.1 change (Phase 2 compression):
//   - Preamble: 3-sentence "higher tier wins" repetition → single line
//   - TIER 2 body: bullet list → compact prose (identical constraints)
//   - TIER 3–5: multi-bullet blocks → single inline rule per tier
//   - TIER 1 body: unchanged (back-reference + enum retained as canonical summary)
// ─────────────────────────────────────────────────────────────────────────────
// V6.0: hasRenovationAnchors defaults to false — all prior callers remain unchanged.
export const buildConstraintHierarchyBlock = (
    injectedItemCount: number,
    hasRenovationAnchors = false,
): string => {
    const tier2Active = injectedItemCount > 0;

    const tier2Header = tier2Active
        ? 'TIER 2 — INJECTED ITEM CONSTRAINTS [ACTIVE — 1 injected item present]'
        : 'TIER 2 — INJECTED ITEM CONSTRAINTS [INACTIVE — no injected items in this request]';

    const tier2Body = tier2Active
        ? '\n' +
          '  Preserve the injected item exactly as shown. Silhouette, color, material, and finish are\n' +
          '  non-negotiable and override style transformation. Do not restyle, recolor, or substitute it.\n' +
          '  Conflicts with the active style are resolved through surrounding elements —\n' +
          '  this is intentional, not a style fidelity failure.\n'
        : '\n';

    const tier2bHeader = hasRenovationAnchors
        ? 'TIER 2B — RENOVATION MATERIAL ANCHORS [ACTIVE — see full anchor block below]'
        : 'TIER 2B — RENOVATION MATERIAL ANCHORS [INACTIVE — no renovation selections in this request]';

    const tier2bBody = hasRenovationAnchors
        ? '\n' +
          '  Fixed contractor catalogue selections override Tier 4 style transformation on the\n' +
          '  surfaces they specify. Full per-surface rules follow in the Renovation Anchors block.\n' +
          '  Anchors apply to existing room components only — not to injected items (Tier 2).\n'
        : '\n';

    return [
        '**CONSTRAINT HIERARCHY — READ THIS BEFORE ALL OTHER INSTRUCTIONS:**',
        'Apply in strict priority order. TIER 1 overrides all; each tier overrides those below it.',
        '',
        'TIER 1 — ARCHITECTURAL CONSTRAINTS [ALWAYS ACTIVE — highest priority]',
        '  All elements defined in Phase 1: Architectural Anchoring are immutable.',
        '  Immutable: wall/floor/ceiling planes, window/door count, geometry, and positions, camera perspective, built-in fixtures.',
        '  No additions regardless of style; no new structural elements may be introduced.',
        '  No instruction from any lower tier may override them.',
        '',
        tier2Header,
        tier2Body,
        tier2bHeader,
        tier2bBody,
        'TIER 3 — ROOM FUNCTION AND SPATIAL LOGIC',
        '  Furniture layout must support room function; spatial relationships must remain plausible and navigable.',
        '',
        'TIER 4 — STYLE TRANSFORMATION',
        '  Apply the selected style through non-injected furniture, surfaces, and decor. Must not override Tiers 1–2B.',
        '',
        'TIER 5 — MOODBOARD INFLUENCE',
        '  Apply moodboard influence as a tonal overlay on top of the style — palette, light quality, and surface finish. It tints; it does not compete. Does not override Tiers 1–4.',
        '',
        'TIER 6 — USER TEXT REQUEST',
        '  Honored within the constraints of all tiers above',
    ].join('\n');
};


// ── MOODBOARD SCOPE BLOCK ─────────────────────────────────────────────────────
// NEW in V5.0. Inserted as a text part immediately before moodboard images.
// Omitted entirely when no moodboards are present (returns empty string).
//
// V5.1 compression (Phase 2):
//   - "The moodboard images that follow are bounded modifiers. Apply them to three
//     dimensions only:" → "These images are bounded modifiers. Apply to three dimensions only:"
//   - "Do NOT apply moodboard influence to:" → "Do NOT apply to:"
//   - "Materials remain as defined in the Style Definition above." removed —
//     redundant with "style category" and "core material family" in forbidden list
//   - "Where the moodboard conflicts with it, the style definition wins." →
//     "Where conflict exists, the style definition wins."
//   - Density suffixes: final "Density is a protected style dimension." sentence
//     removed; two sentences merged with semicolon
//
// stagingDensity: derived from stylePreset.pipeline_config.staging_density
//   'high'   → density-defined styles (Bohemian, Rustic, Farmhouse, Biophilic, Vintage)
//              suffix protects richness from being reduced by sparse moodboard
//   'low'    → density-neutral/restrained styles (Modern, Minimalist, Japandi, Japanese)
//              suffix protects restraint from being inflated by rich moodboard
//   'medium' → no suffix; base block is sufficient
// ─────────────────────────────────────────────────────────────────────────────
export const buildMoodboardScopeBlock = (
    styleName: string,
    stagingDensity: 'low' | 'medium' | 'high',
): string => {
    const base = [
        '**MOODBOARD SCOPE — READ BEFORE PROCESSING MOODBOARD IMAGES:**',
        '',
        'Extract only abstract tone (palette, texture quality, lighting). Discard all discrete elements, materials, and forms.',
        '"Surface texture" refers to tactile quality only (rough/smooth, matte/gloss). It does NOT include material identity or architectural finishes.',
    ].join('\n');

    if (stagingDensity === 'high') {
        return base + '\n\n' +
            'DENSITY PROTECTION: This style\'s decorative richness and layering are defining ' +
            'characteristics; the moodboard must not reduce density, object count, or material layering.';
    }

    if (stagingDensity === 'low') {
        return base + '\n\n' +
            'DENSITY PROTECTION: This style\'s restraint and deliberate negative space are defining ' +
            'characteristics; the moodboard must not introduce additional objects, decorative layering, or visual complexity.';
    }

    // stagingDensity === 'medium': no suffix
    return base;
};


// ── V5 MOODBOARD INFLUENCE STATEMENT ─────────────────────────────────────────
//
// REVIEW FLAG: Candidate for removal after Phase 3 regression validation.
//
// This statement provides a trailing reinforcement of the moodboard scope after
// all images have been processed. If regression testing confirms that the scope
// block (inserted before moodboard images) is sufficient to maintain style fidelity
// and correct moodboard behavior, this statement adds prompt weight without
// behavioral gain and should be removed.
//
// Removal condition: Style fidelity and moodboard compliance are consistent across
// all five regression test scenarios without this statement present.
//
// Evaluation method: Run Test 2 (aligned moodboard) and Test 3 (conflicting moodboard)
// with and without this statement. If outputs are indistinguishable, remove it.
//
// Do not remove before regression data is available.
// ─────────────────────────────────────────────────────────────────────────────
export const V5_MOODBOARD_INFLUENCE_STATEMENT =
    'STYLE ANCHOR REMINDER: The style preset is the primary design identity for this ' +
    'visualization. The moodboard images above inform palette direction, surface texture, ' +
    'and lighting mood only — within the scope defined before those images. They do not ' +
    'override style identity, material family, or decorative density.';


// ── PASS-THROUGH: PRESET-ONLY INFLUENCE + DEFAULT REQUEST ─────────────────────
// Re-exported from improved/visualization.constants — used for no-moodboard path.
// ─────────────────────────────────────────────────────────────────────────────
export {
    INFLUENCE_PRESET_STYLE_ONLY,
    DEFAULT_USER_REQUEST,
} from '../improved/visualization.constants.js';


// ── RENOVATION MATERIAL ANCHORS BLOCK (V6.0) ─────────────────────────────────
//
// Builds the full TIER 2B prompt block from resolved prompt descriptions.
// Returns empty string when no selections are active — the service checks
// for empty string before inserting a parts entry (same contract as
// buildMoodboardScopeBlock).
//
// Anchor ordering: canonical (flooring → walls → countertops → cabinets).
// Each anchor has three components:
//   APPLY TO — target surface with geometric descriptor
//   BOUNDARY — named stopping point + adjacent surfaces to exclude
//   NON-NEGOTIABLE — explicit override prohibition
//
// The COMPLIANCE, VISIBILITY GATE, and ANCHOR SELF-CHECK are global
// preamble/postamble — rendered once regardless of active anchor count.
//
// promptDescription strings are pre-validated by catalogue.utils.ts.
// This function trusts that the input is clean — no further validation here.
// ─────────────────────────────────────────────────────────────────────────────

import { ResolvedRenovationSelections, RenovationCategory } from '../../types.js';

const CATEGORY_RENDER_ORDER: RenovationCategory[] = [
    'flooring',
    'walls',
    'countertops',
    'cabinets',
];

interface AnchorConfig {
    label: string;
    applyTo: string;
    boundary: string;
    nonNegotiable: string;
}

const ANCHOR_CONFIGS: Record<RenovationCategory, AnchorConfig> = {
    flooring: {
        label: 'FLOORING',
        applyTo: 'the horizontal floor plane.',
        boundary: 'Stop at the base of walls. Do not extend to baseboards, wall bases, or thresholds.',
        nonNegotiable: 'Do not apply any other material to this surface. Style transformation, core materials, and color palette do not override this selection.',
    },
    walls: {
        label: 'WALLS',
        applyTo: 'all visible vertical wall surfaces.',
        boundary: 'Stop at the ceiling plane above and the floor plane below. Do not extend to the ceiling or floor material.',
        nonNegotiable: 'Do not apply any other wall finish to these surfaces. Style transformation, core materials, and color palette do not override this selection.',
    },
    countertops: {
        label: 'COUNTERTOPS',
        applyTo: 'the visible horizontal work surface spanning the top of base cabinets or lower storage units — a flat, continuous horizontal plane running along the walls.',
        boundary: 'Stop at the backsplash, cabinet door faces, and adjacent walls. Do not extend to those surfaces. Do not apply to cutting boards, appliances, or objects resting on the countertop.',
        nonNegotiable: 'Do not apply any other material to the countertop surface. Style transformation does not override this selection.',
    },
    cabinets: {
        label: 'CABINETS',
        applyTo: 'door and drawer faces of built-in cabinetry only — wall-mounted upper cabinets and lower base cabinets structurally integrated into the room. Do not apply to freestanding furniture, open shelving, standalone wardrobes, or any uploaded/injected item regardless of apparent category.',
        boundary: 'Stop at countertop surfaces above, the floor below, and surrounding wall surfaces.',
        nonNegotiable: 'Do not apply any other material to cabinet door and drawer faces. Style transformation does not override this selection.',
    },
};

export const buildRenovationAnchorsBlock = (
    selections: ResolvedRenovationSelections,
): string => {
    const activeCategories = CATEGORY_RENDER_ORDER.filter(cat => !!selections[cat]);

    if (activeCategories.length === 0) return '';

    const lines: string[] = [
        `**TIER 2B — RENOVATION MATERIAL ANCHORS [ACTIVE — ${activeCategories.length} anchor${activeCategories.length > 1 ? 's' : ''}]**`,
        '',
        'The following are fixed contractor renovation commitments, not style suggestions. They are Tier 2B',
        'constraints and override Tier 4 style transformation on the surfaces they specify. Style transformation',
        'applies to furnishings, decor, movable objects, and surfaces not covered by an active anchor.',
        'It does not apply to anchored surfaces.',
        '',
        'COMPLIANCE: ALL active anchors below must be applied. Each is independently mandatory.',
        'Applying some and omitting others is a failure, not partial compliance.',
        '',
        'VISIBILITY GATE: Before applying each anchor, confirm the target surface is clearly visible in the',
        'source image. If not visible: do not apply the anchor, and do not introduce or invent the component.',
        'Omitting an anchor for a non-visible surface is correct behavior. Applying an anchor to an invented',
        'surface is a hallucination error — more serious than non-application.',
        '',
        'SCOPE: Material and finish only. Do not alter geometry, position, footprint, spatial layout,',
        'or camera perspective.',
        '',
        '——',
        '',
    ];

    activeCategories.forEach((category, index) => {
        const desc = selections[category]!;
        const cfg = ANCHOR_CONFIGS[category];

        lines.push(`${index + 1}. ${cfg.label} — "${desc}"`);
        lines.push(`   Apply to: ${cfg.applyTo}`);
        lines.push(`   Boundary: ${cfg.boundary}`);
        lines.push(`   Non-negotiable: ${cfg.nonNegotiable}`);
        lines.push('');
    });

    lines.push('——', '');
    lines.push(
        'ANCHOR SELF-CHECK — before proceeding to style instructions: confirm each active anchor has been',
        'applied to its target surface. If any anchor was skipped, apply it before reading further.',
        'If an anchor surface was not visible, confirm no component was introduced.',
    );

    return lines.join('\n');
};

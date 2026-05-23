// Block: constraint-hierarchy
// Introduced: V5.0 (this base version); V7 extends it with an AGT tier line
// Fires: every request
// Position: CONSTRAINT_HIERARCHY (before structural block)
// Input: injectedItemCount, hasRenovationAnchors
// Note: V7's pipeline adds an AGT tier line on top of this base.
//       That extension lives in prompts/balanced_v7/visualization.constants.ts.
export const CONSTRAINT_HIERARCHY_BLOCK_VERSION = 'constraint-hierarchy@1.0';
// Returns empty string when inactive — caller checks before pushing a parts entry.
export const buildConstraintHierarchyBlock = (injectedItemCount, hasRenovationAnchors = false) => {
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
//# sourceMappingURL=constraint-hierarchy.js.map
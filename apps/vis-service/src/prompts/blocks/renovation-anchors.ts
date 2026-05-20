// Block: renovation-anchors
// Introduced: V6.0
// Fires: only when contractor catalogue selections are active (Tier 2B)
// Position: RENOVATION_ANCHORS_OPTIONAL (after structural block)
// Input: ResolvedRenovationSelections
// Returns empty string when no selections are active — caller checks before pushing a parts entry.

import { ResolvedRenovationSelections, RenovationCategory } from '../../types.js';

export const RENOVATION_ANCHORS_BLOCK_VERSION = 'renovation-anchors@1.0';

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

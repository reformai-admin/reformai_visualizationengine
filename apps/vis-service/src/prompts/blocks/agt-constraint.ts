// Block: agt-constraint
// Introduced: V7.0
// Fires: every V7 request (content varies by confidence level)
// Position: AGT_CONSTRAINTS_OPTIONAL (before constraint hierarchy, after base room image)
// Input: ClassifiedAGT (confidence-gated structural facts)
// High-confidence fields -> HARD FACTS with visibility contract
// Medium-confidence fields -> ADVISORY OBSERVATIONS
// All fields suppressed -> fallback message (no hard facts block)

import type { ClassifiedAGT } from '../../shared/types/agt.js';

export const AGT_CONSTRAINT_BLOCK_VERSION = 'agt-constraint@1.1';

export const buildAGTConstraintBlock = (agt: ClassifiedAGT): string => {
    const hardLines: string[] = [];
    const advisoryLines: string[] = [];

    // window_count
    if (agt.window_count.enforcement === 'hard') {
        const count = Number(agt.window_count.displayValue);
        const anchors = agt.window_count.spatialAnchors?.length
            ? ` Spatial anchors: ${agt.window_count.spatialAnchors.join('; ')}.`
            : '';
        hardLines.push(
            `EXACTLY ${count} window${count !== 1 ? 's' : ''} exist in this room.${anchors}`,
        );
        if (count === 0) {
            hardLines.push(
                'No window openings are present. Do not introduce any new window, skylight, glazed opening, or faux exterior aperture.',
            );
        }
    } else if (agt.window_count.enforcement === 'advisory') {
        advisoryLines.push(
            `Window count: approximately ${agt.window_count.displayValue} observed - verify against source image.`,
        );
    }

    // door_count
    if (agt.door_count.enforcement === 'hard') {
        const count = Number(agt.door_count.displayValue);
        const anchors = agt.door_count.spatialAnchors?.length
            ? ` Spatial anchors: ${agt.door_count.spatialAnchors.join('; ')}.`
            : '';
        hardLines.push(
            `EXACTLY ${count} door${count !== 1 ? 's' : ''} exist in this room.${anchors}`,
        );
    } else if (agt.door_count.enforcement === 'advisory') {
        advisoryLines.push(
            `Door count: approximately ${agt.door_count.displayValue} observed - verify against source image.`,
        );
    }

    // has_ceiling_fixture
    if (agt.has_ceiling_fixture.enforcement === 'hard') {
        const present = agt.has_ceiling_fixture.displayValue === 'PRESENT';
        hardLines.push(
            present
                ? 'Ceiling fixture: PRESENT. It must remain visible in the output.'
                : 'Ceiling fixture: ABSENT. Do not add one regardless of style requirements.',
        );
        hardLines.push(
            'Do not introduce new permanent ceiling structure such as beams, coffers, plank systems, dropped soffits, or skylight framing.',
        );
    } else if (agt.has_ceiling_fixture.enforcement === 'advisory') {
        advisoryLines.push(
            `Ceiling fixture: ${agt.has_ceiling_fixture.displayValue} (advisory - model judgment governs if ambiguous in source).`,
        );
    }

    // has_built_in_niches
    if (agt.has_built_in_niches.enforcement === 'hard') {
        const present = agt.has_built_in_niches.displayValue === 'PRESENT';
        hardLines.push(
            present
                ? 'Built-in niches: PRESENT. They must remain structurally visible - never conceal, fill, or flush them.'
                : 'Built-in niches: ABSENT. Do not introduce recessed alcoves or built-in shelving.',
        );
    } else if (agt.has_built_in_niches.enforcement === 'advisory') {
        advisoryLines.push(
            `Built-in niches: ${agt.has_built_in_niches.displayValue} (advisory).`,
        );
    }

    const lines: string[] = [
        '**ARCHITECTURAL GROUND TRUTH - PRE-SESSION STRUCTURAL ASSESSMENT:**',
        '',
    ];

    if (hardLines.length > 0) {
        lines.push('HARD FACTS - non-negotiable, extraction-verified before this session:');
        hardLines.forEach(l => lines.push(`- ${l}`));
        lines.push('');
        lines.push(
            'VISIBILITY CONTRACT: All confirmed hard-fact architectural elements above must remain ' +
            'visually distinguishable from surrounding surfaces in the output. They may not be ' +
            'obscured, blended into walls, hidden behind objects, or rendered as if absent.',
        );
    } else {
        lines.push(
            'Structural extraction confidence was insufficient to produce hard facts for this image. ' +
            'Architectural constraints are enforced through Phase 1 rules below.',
        );
    }

    if (advisoryLines.length > 0) {
        lines.push('');
        lines.push('ADVISORY OBSERVATIONS - model judgment may override if source evidence conflicts:');
        advisoryLines.forEach(l => lines.push(`- ${l}`));
    }

    if (agt.camera_perspective.enforcement === 'advisory') {
        lines.push('');
        lines.push(
            `Camera perspective: ${agt.camera_perspective.displayValue} (advisory - composition governs).`,
        );
    }

    return lines.join('\n').trimEnd();
};





// Block: agt-echo
// Introduced: V7.0
// Fires: only when at least one AGT field has hard enforcement
// Position: AGT_ECHO_OPTIONAL (near end of parts array, before base room reanchor)
// Input: ClassifiedAGT
// Returns empty string when no hard facts exist — caller checks before pushing a parts entry.
// Purpose: re-states hard fact counts as a final compliance check before generation.

import type { ClassifiedAGT } from '../../types.js';

export const AGT_ECHO_BLOCK_VERSION = 'agt-echo@1.0';

export const buildAGTEchoBlock = (agt: ClassifiedAGT): string => {
    if (agt.hard_fact_fields.length === 0) return '';

    const lines: string[] = [
        '**FINAL ARCHITECTURAL VERIFICATION — BEFORE GENERATING:**',
        'Confirm all hard-fact counts from the structural assessment are reflected in your output:',
    ];

    if (agt.window_count.enforcement === 'hard') {
        lines.push(`- Windows: EXACTLY ${agt.window_count.displayValue}.`);
    }
    if (agt.door_count.enforcement === 'hard') {
        lines.push(`- Doors: EXACTLY ${agt.door_count.displayValue}.`);
    }
    if (agt.has_ceiling_fixture.enforcement === 'hard') {
        lines.push(`- Ceiling fixture: ${agt.has_ceiling_fixture.displayValue}.`);
    }
    if (agt.has_built_in_niches.enforcement === 'hard') {
        lines.push(`- Built-in niches: ${agt.has_built_in_niches.displayValue}.`);
    }

    lines.push(
        'An output that contradicts any hard fact above is an architectural compliance failure.',
    );

    return lines.join('\n');
};

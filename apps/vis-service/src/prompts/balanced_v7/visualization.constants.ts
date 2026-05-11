// ============================================================
// BALANCED V7 — PROMPT CONSTANTS
// TEMPLATE VERSION: 7.0.0
// COMPATIBLE WITH: pipelineMode "balanced_v7"
//
// V7 adds three AGT-driven blocks on top of V5/V6.0:
//   - buildAGTConstraintBlock: early injection of confidence-gated facts
//   - buildAGTEchoBlock: final enforcement re-statement (omitted when no hard facts)
//   - buildConflictClausesBlock: per-style legal resolution paths for arch. conflicts
//   - buildConstraintHierarchyBlock: V7 version — TIER 1 references AGT hard facts
//
// V5/V6.0 constants (BALANCED_V5_STRUCTURAL_PART, BALANCED_V5_STYLE_TEMPLATE,
// buildMoodboardScopeBlock, buildRenovationAnchorsBlock, etc.) are re-exported
// unchanged. V5 pipeline is frozen.
// ============================================================

import type { ClassifiedAGT } from '../../types.js';
import { buildCanonicalConstraintHierarchy } from '../shared/primitives/canonicalPromptPrimitives.js';
import type {
    AGTConstraintBlockBuilder,
    AGTEchoBlockBuilder,
    ConflictClausesBlockBuilder,
} from '../shared/contracts/contracts.js';

export const TEMPLATE_VERSION = '7.0.0';
export const PIPELINE_MODE    = 'balanced_v7';


// ── RE-EXPORTS FROM V5 (unchanged) ───────────────────────────────────────────

export {
    BALANCED_V5_STRUCTURAL_PART,
    BALANCED_V5_STYLE_TEMPLATE,
    INJECTED_ITEM_BLOCK_HEADER,
    INJECTED_ITEM_AUDIT_TEXT,
    buildMoodboardScopeBlock,
    buildRenovationAnchorsBlock,
    V5_MOODBOARD_INFLUENCE_STATEMENT,
    INFLUENCE_PRESET_STYLE_ONLY,
    DEFAULT_USER_REQUEST,
} from '../shared/primitives/canonicalPromptPrimitives.js';


// ── AGT CONSTRAINT BLOCK ──────────────────────────────────────────────────────
// Injected early in the parts array (position 3, before constraint hierarchy).
// Hard facts are named, counted, and spatially anchored.
// Advisory facts are listed separately with softer language.
// Suppressed fields are omitted entirely.
// Visibility contract is appended when any hard fact exists.
// ─────────────────────────────────────────────────────────────────────────────

export const buildAGTConstraintBlock: AGTConstraintBlockBuilder = (agt: ClassifiedAGT): string => {
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
    } else if (agt.window_count.enforcement === 'advisory') {
        advisoryLines.push(
            `Window count: approximately ${agt.window_count.displayValue} observed — verify against source image.`,
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
            `Door count: approximately ${agt.door_count.displayValue} observed — verify against source image.`,
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
    } else if (agt.has_ceiling_fixture.enforcement === 'advisory') {
        advisoryLines.push(
            `Ceiling fixture: ${agt.has_ceiling_fixture.displayValue} (advisory — model judgment governs if ambiguous in source).`,
        );
    }

    // has_built_in_niches
    if (agt.has_built_in_niches.enforcement === 'hard') {
        const present = agt.has_built_in_niches.displayValue === 'PRESENT';
        hardLines.push(
            present
                ? 'Built-in niches: PRESENT. They must remain structurally visible — never conceal, fill, or flush them.'
                : 'Built-in niches: ABSENT. Do not introduce recessed alcoves or built-in shelving.',
        );
    } else if (agt.has_built_in_niches.enforcement === 'advisory') {
        advisoryLines.push(
            `Built-in niches: ${agt.has_built_in_niches.displayValue} (advisory).`,
        );
    }

    const lines: string[] = [
        '**ARCHITECTURAL GROUND TRUTH — PRE-SESSION STRUCTURAL ASSESSMENT:**',
        '',
    ];

    if (hardLines.length > 0) {
        lines.push('HARD FACTS — non-negotiable, extraction-verified before this session:');
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
        lines.push('ADVISORY OBSERVATIONS — model judgment may override if source evidence conflicts:');
        advisoryLines.forEach(l => lines.push(`- ${l}`));
    }

    if (agt.camera_perspective.enforcement === 'advisory') {
        lines.push('');
        lines.push(
            `Camera perspective: ${agt.camera_perspective.displayValue} (advisory — composition governs).`,
        );
    }

    return lines.join('\n').trimEnd();
};


// ── AGT ECHO BLOCK ────────────────────────────────────────────────────────────
// Injected near the end of the parts array, before the base room re-anchor.
// Returns empty string when no hard facts exist — service omits the part entry.
// Kept short: re-states counts only, no spatial anchor repetition.
// ─────────────────────────────────────────────────────────────────────────────

export const buildAGTEchoBlock: AGTEchoBlockBuilder = (agt: ClassifiedAGT): string => {
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


// ── CONFLICT CLAUSES BLOCK ────────────────────────────────────────────────────
// Injected after the style part when the style defines conflict_resolution clauses.
// Returns empty string when no clauses exist — service omits the part entry.
// Clauses are sourced from StyleObject.conflict_resolution in styles.ts.
// ─────────────────────────────────────────────────────────────────────────────

export const buildConflictClausesBlock: ConflictClausesBlockBuilder = (clauses: string[] | undefined): string => {
    if (!clauses || clauses.length === 0) return '';

    const lines: string[] = [
        '**STYLE-ARCHITECTURE CONFLICT RESOLUTION — PERMITTED PATHS ONLY:**',
        'The following rules define the ONLY permitted resolution for conflicts between this ' +
        "style's aspirations and architectural constraints. Each names what the aspiration means " +
        'in practice and what it explicitly does NOT permit:',
        '',
    ];

    clauses.forEach((clause, i) => lines.push(`${i + 1}. ${clause}`));

    return lines.join('\n');
};


// ── CONSTRAINT HIERARCHY BLOCK (V7) ──────────────────────────────────────────
// Extends V5 constraint hierarchy with:
//   - TIER 1 now explicitly includes AGT-derived hard facts.
//   - hasHardAGTFacts parameter controls the TIER 1 AGT reference line.
//   - All other tiers unchanged from V6.0.
// ─────────────────────────────────────────────────────────────────────────────

export const buildConstraintHierarchyBlock = (
    injectedItemCount: number,
    hasRenovationAnchors = false,
    hasHardAGTFacts = false,
): string => {
    const base = buildCanonicalConstraintHierarchy(
        {
            injectedItemCount,
            hasRenovationAnchors,
        },
    );

    if (!hasHardAGTFacts) {
        return base;
    }

    const agtTierLine =
        '  Verified hard facts from the structural assessment above are TIER 1 constraints - they supersede model visual judgment.';

    const lines = base.split('\n');
    const insertionIndex = lines.findIndex((line: string) =>
        line.includes('All elements defined in Phase 1: Architectural Anchoring are immutable.'),
    );

    if (insertionIndex === -1) {
        return base;
    }

    lines.splice(insertionIndex + 1, 0, agtTierLine);
    return lines.join('\n');
};

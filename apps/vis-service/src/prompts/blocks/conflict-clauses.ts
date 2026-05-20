// Block: conflict-clauses
// Introduced: V7.0
// Fires: only when the active style defines conflict_resolution entries in styles.ts
// Position: CONFLICT_CLAUSES_OPTIONAL (after style block)
// Input: string[] | undefined from StylePreset.conflict_resolution
// Returns empty string when no clauses defined — caller checks before pushing a parts entry.
// Purpose: defines the ONLY permitted resolution paths for style-vs-architecture conflicts.

export const CONFLICT_CLAUSES_BLOCK_VERSION = 'conflict-clauses@1.0';

export const buildConflictClausesBlock = (clauses: string[] | undefined): string => {
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

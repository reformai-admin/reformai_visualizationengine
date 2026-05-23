// Block: moodboard-scope
// Introduced: V5.0
// Fires: only when moodboard images are present
// Position: MOODBOARD_SCOPE_OPTIONAL (before moodboard images)
// Input: styleName, stagingDensity
// Returns empty string when inactive — caller checks before pushing a parts entry.

export const MOODBOARD_SCOPE_BLOCK_VERSION = 'moodboard-scope@1.0';

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

    // stagingDensity === 'medium': no density suffix
    return base;
};




// Block: influence
// Introduced: V1 (INFLUENCE_PRESET_STYLE_ONLY, DEFAULT_USER_REQUEST);
//             V5.0 (V5_MOODBOARD_INFLUENCE_STATEMENT)
// Fires: every request (influence prompt); moodboard path only (statement)
// Position: INFLUENCE_OPTIONAL (after moodboard images / injected items)
// Input: none — static text constants

export const INFLUENCE_BLOCK_VERSION = 'influence@1.0';

// Used when no moodboard is present. Tells the model to use the style preset only.
export const INFLUENCE_PRESET_STYLE_ONLY = `Use the preset style as the primary design guide.`;

// Used when the user submits no specific text request.
export const DEFAULT_USER_REQUEST = `No specific requests.`;

// Trailing reinforcement injected after moodboard images are processed.
// Prevents moodboard influence from displacing the style preset identity.
// Review flag: candidate for removal if regression confirms scope block alone is sufficient.
// Do not remove before running Test 2 (aligned moodboard) and Test 3 (conflicting moodboard)
// with and without this statement present.
export const V5_MOODBOARD_INFLUENCE_STATEMENT =
    'STYLE ANCHOR REMINDER: The style preset is the primary design identity for this ' +
    'visualization. The moodboard images above inform palette direction, surface texture, ' +
    'and lighting mood only — within the scope defined before those images. They do not ' +
    'override style identity, material family, or decorative density.';




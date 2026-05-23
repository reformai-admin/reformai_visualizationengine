// ============================================================
// BALANCED V7 — INJECTION LAYER
// Re-exports V5 prompt builder unchanged.
// V7 AGT blocks and conflict clauses are assembled directly
// in the service layer — no template modification required.
// ============================================================

export {
    buildVisualizationPrompt,
    buildInfluencePrompt,
    buildMoodboardBlock,
    PromptInjectionError,
    sanitizeApertureLook,
} from '../shared/canonicalPromptPrimitives.js';

export type {
    CanonicalPromptParams as BalancedV5PromptParams,
    BuiltCanonicalPrompt as BuiltBalancedV5Prompt,
} from '../shared/canonicalPromptPrimitives.js';




// ============================================================
// IMAGE ROLE LABEL SYSTEM — V4.0
//
// Every image in a v4.0 request is preceded by a role label text part.
// Labels are always-on — they are never removed in any operational mode.
//
// Purpose: eliminate position-based image role inference by the model.
// Each label explicitly declares what the image is and what to do with it
// before the model processes it.
// ============================================================

export const IMAGE_ROLES = {

    BASE_ROOM: (): string =>
        '[BASE ROOM IMAGE] — architectural reference. ' +
        'Preserve all structural elements exactly. Do not alter walls, windows, camera angle, or room geometry.',

    BASE_ROOM_REANCHOR: (): string =>
        '[BASE ROOM IMAGE — RE-ANCHOR] — structural re-anchor for final generation. ' +
        'All transformations must be grounded in this room\'s geometry and spatial logic.',

    MOODBOARD: (index: number): string =>
        `[MOODBOARD REFERENCE ${index}] — style inspiration only. ` +
        'Do not preserve, place, or identify specific items from this image.',

    INJECTED_ITEM: (index: number): string =>
        `[INJECTED ITEM ${index}] — preserve identity exactly as shown in this image.`,

    PREVIOUS_RESULT: (): string =>
        '[PREVIOUS RESULT] — prior generation provided for refinement context. ' +
        'Carry forward preserved elements. Apply requested changes only.',

    // ── V5: Updated moodboard label with extraction ceiling ───────────────────
    // Used by balanced_v5 service only. Original MOODBOARD label is unchanged
    // and continues to be used by all prior pipeline versions.
    //
    // V5.1 compression (Phase 1): label compressed from ~65 words to ~35 words.
    // Full extraction detail is declared in the moodboard scope block that
    // precedes the first moodboard image. The label retains the role declaration
    // and forbidden-extraction ceiling; the per-dimension sub-descriptions
    // (warm/cool tendency, rough/smooth, etc.) are dropped as scope-block-redundant.
    MOODBOARD_V5: (index: number): string =>
        `[MOODBOARD REFERENCE ${index}] — bounded modifier only. ` +
        'Extract abstract tone only (palette, texture quality, lighting). ' +
        'Discard all discrete elements, materials, and forms.',

} as const;

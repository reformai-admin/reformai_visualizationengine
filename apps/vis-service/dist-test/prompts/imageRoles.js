// ============================================================
// IMAGE ROLE LABEL SYSTEM — V4.0
// ============================================================
export const IMAGE_ROLES = {
    BASE_ROOM: () => '[BASE ROOM IMAGE] — architectural reference. ' +
        'Preserve all structural elements exactly. Do not alter walls, windows, camera angle, or room geometry.',
    BASE_ROOM_REANCHOR: () => '[BASE ROOM IMAGE — RE-ANCHOR] — structural re-anchor for final generation. ' +
        'All transformations must be grounded in this room\'s geometry and spatial logic.',
    MOODBOARD: (index) => `[MOODBOARD REFERENCE ${index}] — style inspiration only. ` +
        'Do not preserve, place, or identify specific items from this image.',
    INJECTED_ITEM: (index) => `[INJECTED ITEM ${index}] — preserve identity exactly as shown in this image.`,
    PREVIOUS_RESULT: () => '[PREVIOUS RESULT] — prior generation provided for refinement context. ' +
        'Carry forward preserved elements. Apply requested changes only.',
    MOODBOARD_V5: (index) => `[MOODBOARD REFERENCE ${index}] — bounded modifier only. ` +
        'Extract abstract tone only (palette, texture quality, lighting). ' +
        'Discard all discrete elements, materials, and forms.',
};
//# sourceMappingURL=imageRoles.js.map
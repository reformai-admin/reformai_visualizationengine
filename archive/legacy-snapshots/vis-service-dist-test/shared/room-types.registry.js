// ============================================================
// ROOM TYPE REGISTRY
// Single source of truth for room-specific prompt fields.
// All values injected via the balanced_v3_0 injection layer.
// ============================================================
// Keys are canonical lowercase_snake_case.
// Lookup normalizes input via normalizeRoomType() before accessing this map.
export const ROOM_TYPE_REGISTRY = {
    bedroom: {
        roomType: 'bedroom',
        roomFunctionUses: 'sleeping, storage, circulation',
        functionalAnchorExamples: 'bed, dresser, seating',
    },
    living_room: {
        roomType: 'living_room',
        roomFunctionUses: 'seating, lounging, display',
        functionalAnchorExamples: 'sofa, coffee table, shelving',
    },
    kitchen: {
        roomType: 'kitchen',
        roomFunctionUses: 'cooking, prep, storage',
        functionalAnchorExamples: 'island, counters, cabinetry',
    },
    dining_room: {
        roomType: 'dining_room',
        roomFunctionUses: 'dining, serving, storage',
        functionalAnchorExamples: 'dining table, sideboard, buffet',
    },
    home_office: {
        roomType: 'home_office',
        roomFunctionUses: 'working, storage, reference',
        functionalAnchorExamples: 'desk, shelving, seating',
    },
    bathroom: {
        roomType: 'bathroom',
        roomFunctionUses: 'bathing, grooming, storage',
        functionalAnchorExamples: 'vanity, bathtub, storage unit',
    },
};
/**
 * Normalizes a roomType string to the canonical registry key.
 * Accepts: "bedroom", "Bedroom", "living room", "Living Room", "living_room", etc.
 * Returns the normalized key, or the original lowercased value if no match found
 * (so the injection layer can produce a meaningful error message).
 */
export const normalizeRoomType = (roomType) => {
    return roomType.trim().toLowerCase().replace(/\s+/g, '_');
};
/**
 * Looks up a room type entry, normalizing the input key first.
 * Returns null if the room type is not registered.
 */
export const getRoomTypeEntry = (roomType) => {
    const key = normalizeRoomType(roomType);
    return ROOM_TYPE_REGISTRY[key] ?? null;
};
//# sourceMappingURL=room-types.registry.js.map
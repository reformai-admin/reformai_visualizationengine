export interface RoomTypeEntry {
    /** Canonical key — lowercase_snake_case */
    roomType: string;
    /** Comma-separated string injected into FURNISHING STRATEGY */
    roomFunctionUses: string;
    /** Comma-separated string injected into OBJECT JUSTIFICATION RULE */
    functionalAnchorExamples: string;
    /** Reserved for future room-specific constraint blocks. Empty = not used. */
    roomSpecificConstraints?: string;
}
export declare const ROOM_TYPE_REGISTRY: Record<string, RoomTypeEntry>;
/**
 * Normalizes a roomType string to the canonical registry key.
 * Accepts: "bedroom", "Bedroom", "living room", "Living Room", "living_room", etc.
 * Returns the normalized key, or the original lowercased value if no match found
 * (so the injection layer can produce a meaningful error message).
 */
export declare const normalizeRoomType: (roomType: string) => string;
/**
 * Looks up a room type entry, normalizing the input key first.
 * Returns null if the room type is not registered.
 */
export declare const getRoomTypeEntry: (roomType: string) => RoomTypeEntry | null;
//# sourceMappingURL=room-types.registry.d.ts.map
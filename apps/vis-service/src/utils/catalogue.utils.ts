// ============================================================
// CATALOGUE UTILS — V6.0
//
// Translation layer between contractor catalogue items and
// model-ready prompt descriptions.
//
// RESPONSIBILITIES:
//   1. Validate contractorId ownership
//   2. Validate each selection ID exists in that contractor's catalogue
//   3. Validate item.category matches the anchor slot
//   4. Validate item is active and contractor-visible
//   5. Validate promptDescription is present
//   6. Return resolved prompt strings — never raw user input
//
// INVARIANTS:
//   - This is the ONLY module where catalogue data meets prompt logic
//   - Raw user-provided strings NEVER reach the prompt builder
//   - Only item.promptDescription is returned — name is never used
//   - All validation failures throw CatalogueValidationError before
//     any prompt string is produced
//
// PRODUCTION NOTE:
//   getCatalogueRegistry() is synchronous (in-memory POC).
//   resolveRenovationSelections() is async to allow drop-in DB
//   replacement without changing the service call site.
// ============================================================

import {
    CatalogueItem,
    RenovationCategory,
    RenovationSelectionIds,
    ResolvedRenovationSelections,
} from '../types.js';
import { getCatalogueRegistry } from '../data/catalogues.js';

// ── Error class ───────────────────────────────────────────────────────────────

export class CatalogueValidationError extends Error {
    constructor(message: string) {
        super(`[CatalogueValidationError] ${message}`);
        this.name = 'CatalogueValidationError';
    }
}

// ── Canonical slot rendering order ────────────────────────────────────────────
// Always resolved in this order regardless of input object key order.
// Ensures consistent prompt block structure across all requests.

export const CATEGORY_RENDER_ORDER: RenovationCategory[] = [
    'flooring',
    'walls',
    'countertops',
    'cabinets',
];

// ── Internal lookup ───────────────────────────────────────────────────────────

const getCatalogueForContractor = (contractorId: string): CatalogueItem[] => {
    const registry = getCatalogueRegistry();
    const items = registry[contractorId];
    if (!items) {
        throw new CatalogueValidationError(
            `Contractor '${contractorId}' not found in catalogue registry.`,
        );
    }
    return items;
};

// ── Core validation + fetch ───────────────────────────────────────────────────

const validateAndFetchCatalogueItem = (
    contractorId: string,
    itemId: string,
    expectedCategory: RenovationCategory,
    items: CatalogueItem[],
): CatalogueItem => {
    // 1. Item must exist in this contractor's catalogue
    const item = items.find(i => i.id === itemId);
    if (!item) {
        throw new CatalogueValidationError(
            `Catalogue item '${itemId}' not found for contractor '${contractorId}'.`,
        );
    }

    // 2. contractorId on the item must match the authenticated contractor
    if (item.contractorId !== contractorId) {
        throw new CatalogueValidationError(
            `Catalogue item '${itemId}' does not belong to contractor '${contractorId}'.`,
        );
    }

    // 3. Category must match the anchor slot it is being used in
    if (item.category !== expectedCategory) {
        throw new CatalogueValidationError(
            `Category mismatch: item '${itemId}' has category '${item.category}' ` +
            `but was submitted for anchor slot '${expectedCategory}'.`,
        );
    }

    // 4. Item must be active
    if (!item.active) {
        throw new CatalogueValidationError(
            `Catalogue item '${itemId}' is inactive and cannot be used.`,
        );
    }

    // 5. Item must be contractor-visible
    if (!item.contractorVisible) {
        throw new CatalogueValidationError(
            `Catalogue item '${itemId}' is hidden by the contractor and cannot be used.`,
        );
    }

    // 6. promptDescription is required — belt-and-suspenders runtime check
    //    (TypeScript enforces it statically, but data integrity check catches bad DB records)
    if (!item.promptDescription || item.promptDescription.trim() === '') {
        throw new CatalogueValidationError(
            `Catalogue item '${itemId}' is missing a required promptDescription. ` +
            `The item cannot be used for prompt generation until a promptDescription is added.`,
        );
    }

    return item;
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Resolves a RenovationSelectionIds map (catalogue item IDs) into a
 * ResolvedRenovationSelections map (model-ready prompt description strings).
 *
 * Throws CatalogueValidationError if any selection fails validation.
 * Returns only the categories that have active selections.
 *
 * Async signature: in-memory for POC; swap body for DB queries in production.
 */
export const resolveRenovationSelections = async (
    contractorId: string,
    selectionIds: RenovationSelectionIds,
): Promise<ResolvedRenovationSelections> => {
    const items = getCatalogueForContractor(contractorId);
    const resolved: ResolvedRenovationSelections = {};

    // Resolve in canonical order to produce consistent debug output
    for (const category of CATEGORY_RENDER_ORDER) {
        const itemId = selectionIds[category];
        if (!itemId) continue;

        const item = validateAndFetchCatalogueItem(contractorId, itemId, category, items);
        resolved[category] = item.promptDescription;
    }

    return resolved;
};

/**
 * Returns true if the selectionIds object contains at least one non-empty value.
 * Used by the service to gate the catalogue resolution call.
 */
export const hasActiveSelections = (
    selectionIds: RenovationSelectionIds | undefined,
): boolean => {
    if (!selectionIds) return false;
    return CATEGORY_RENDER_ORDER.some(cat => !!selectionIds[cat]);
};

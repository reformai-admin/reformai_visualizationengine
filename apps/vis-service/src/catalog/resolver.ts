// Contractor catalogue resolver.
// Resolves client-supplied catalogue item IDs to prompt descriptions,
// validating ownership, category, and availability at each step.
// This is the only code path that converts client-supplied IDs into
// strings that reach the model prompt — it is the trust boundary.

import type {
    CatalogueItem,
    RenovationCategory,
    RenovationSelectionIds,
    ResolvedRenovationSelections,
} from '../shared/types/catalogue.js';
import { getCatalogueRegistry } from './catalogues.registry.js';

export class CatalogueValidationError extends Error {
    constructor(message: string) {
        super(`[CatalogueValidationError] ${message}`);
        this.name = 'CatalogueValidationError';
    }
}

export const CATEGORY_RENDER_ORDER: RenovationCategory[] = ['flooring', 'walls', 'countertops', 'cabinets'];

const getCatalogueForContractor = (contractorId: string): CatalogueItem[] => {
    const registry = getCatalogueRegistry();
    const items = registry[contractorId];
    if (!items) throw new CatalogueValidationError(`Contractor '${contractorId}' not found in catalogue registry.`);
    return items;
};

const validateAndFetchCatalogueItem = (
    contractorId: string,
    itemId: string,
    expectedCategory: RenovationCategory,
    items: CatalogueItem[],
): CatalogueItem => {
    const item = items.find(i => i.id === itemId);
    if (!item) throw new CatalogueValidationError(`Catalogue item '${itemId}' not found for contractor '${contractorId}'.`);
    if (item.contractorId !== contractorId) throw new CatalogueValidationError(`Catalogue item '${itemId}' does not belong to contractor '${contractorId}'.`);
    if (item.category !== expectedCategory) throw new CatalogueValidationError(`Category mismatch: item '${itemId}' has category '${item.category}' but was submitted for anchor slot '${expectedCategory}'.`);
    if (!item.active) throw new CatalogueValidationError(`Catalogue item '${itemId}' is inactive and cannot be used.`);
    if (!item.contractorVisible) throw new CatalogueValidationError(`Catalogue item '${itemId}' is hidden by the contractor and cannot be used.`);
    if (!item.promptDescription || item.promptDescription.trim() === '') throw new CatalogueValidationError(`Catalogue item '${itemId}' is missing a required promptDescription.`);
    return item;
};

export const resolveRenovationSelections = async (
    contractorId: string,
    selectionIds: RenovationSelectionIds,
): Promise<ResolvedRenovationSelections> => {
    const items = getCatalogueForContractor(contractorId);
    const resolved: ResolvedRenovationSelections = {};
    for (const category of CATEGORY_RENDER_ORDER) {
        const itemId = selectionIds[category];
        if (!itemId) continue;
        const item = validateAndFetchCatalogueItem(contractorId, itemId, category, items);
        resolved[category] = item.promptDescription;
    }
    return resolved;
};

export const hasActiveSelections = (selectionIds: RenovationSelectionIds | undefined): boolean => {
    if (!selectionIds) return false;
    return CATEGORY_RENDER_ORDER.some(cat => !!selectionIds[cat]);
};




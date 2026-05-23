import type { RenovationCategory, RenovationSelectionIds, ResolvedRenovationSelections } from '../shared/types/catalogue.js';
export declare class CatalogueValidationError extends Error {
    constructor(message: string);
}
export declare const CATEGORY_RENDER_ORDER: RenovationCategory[];
export declare const resolveRenovationSelections: (contractorId: string, selectionIds: RenovationSelectionIds) => Promise<ResolvedRenovationSelections>;
export declare const hasActiveSelections: (selectionIds: RenovationSelectionIds | undefined) => boolean;
//# sourceMappingURL=resolver.d.ts.map
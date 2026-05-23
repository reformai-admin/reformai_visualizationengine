export type RenovationCategory = 'flooring' | 'walls' | 'countertops' | 'cabinets';
export interface CatalogueItem {
    id: string;
    contractorId: string;
    category: RenovationCategory;
    name: string;
    promptDescription: string;
    attributes: {
        material: string;
        tone?: 'light' | 'medium' | 'dark' | 'neutral';
        warmth?: 'warm' | 'cool' | 'neutral';
        finish?: string;
        pattern?: string;
        color?: string;
    };
    active: boolean;
    contractorVisible: boolean;
    imageUrl?: string;
}
export interface RenovationSelectionIds {
    flooring?: string;
    walls?: string;
    countertops?: string;
    cabinets?: string;
}
export interface ResolvedRenovationSelections {
    flooring?: string;
    walls?: string;
    countertops?: string;
    cabinets?: string;
}
//# sourceMappingURL=catalogue.d.ts.map
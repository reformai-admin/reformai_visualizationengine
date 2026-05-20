// Contractor catalogue types — V6.0+.
// RenovationCategory is the shared key type used across the catalogue feature,
// prompt blocks, and the pipeline params.

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

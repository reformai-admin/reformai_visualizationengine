import type { MultipartFile } from '@fastify/multipart';

// ── Catalogue types (V6.0) ────────────────────────────────────────────────────

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

// ── Injected item (V4.0) ──────────────────────────────────────────────────────

export type ItemFidelityMode = 'preserve' | 'exact';

export interface InjectedItem {
    image: MultipartFile & { buffer: Buffer };
    fidelityMode?: ItemFidelityMode;
}

// ── Style preset ──────────────────────────────────────────────────────────────

export interface StylePreset {
    id?: string;
    name: string;
    model_inputs: {
        core_materials: string[];
        color_palette: string[];
        lighting_style: string;
        material_finish: string;
        aperture_look: string;
        dont: string[];
        signature_elements?: string[];
    };
    pipeline_config: {
        structural_protocol: string;
        staging_density?: 'low' | 'medium' | 'high';
    };
    conflict_resolution?: string[];
    imageUrl?: string;
}

// ── Pipeline params ───────────────────────────────────────────────────────────

export interface GenerateVisualizationParams {
    roomImage: MultipartFile & { buffer: Buffer };
    roomType: string;
    stylePreset: StylePreset;
    moodBoardImages: (MultipartFile & { buffer: Buffer })[];
    furnitureImage?: (MultipartFile & { buffer: Buffer }) | null;
    injectedItems?: InjectedItem[];
    textPrompt: string;
    styleInfluence: number;
    isRefinement?: boolean;
    geometryPreservation?: boolean;
    phaseAnchoring?: boolean;
    phaseAnchoringV2?: boolean;
    pipelineMode?: 'baseline_original' | 'balanced_v1' | 'balanced_v2' | 'balanced_v2_1' | 'balanced_v2_2' | 'balanced_v3_0' | 'balanced_v4_0' | 'balanced_v4_1' | 'balanced_v5' | 'balanced_v6' | 'balanced_v7' | 'improved_current';
    previousResultImage?: (MultipartFile & { buffer: Buffer }) | null;
    contractorId?: string;
    renovationSelectionIds?: RenovationSelectionIds;
}

// ── AGT types (V7) ────────────────────────────────────────────────────────────

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface CountFieldInstance {
    location: string;
    type: string;
}

export interface AGTCountField {
    value: number;
    confidence: ConfidenceLevel;
    instances: CountFieldInstance[];
}

export interface AGTBooleanField {
    value: boolean;
    confidence: ConfidenceLevel;
}

export interface AGTPerspectiveField {
    value: string;
    confidence: ConfidenceLevel;
}

export interface ArchitecturalGroundTruth {
    window_count: AGTCountField;
    door_count: AGTCountField;
    has_ceiling_fixture: AGTBooleanField;
    has_built_in_niches: AGTBooleanField;
    camera_perspective: AGTPerspectiveField;
    extraction_confidence_overall: ConfidenceLevel;
    uncertain_fields: string[];
}

export type FieldEnforcement = 'hard' | 'advisory' | 'suppressed';

export interface ClassifiedCountField {
    enforcement: FieldEnforcement;
    displayValue: string;
    spatialAnchors?: string[];
}

export interface ClassifiedBooleanField {
    enforcement: FieldEnforcement;
    displayValue: string;
}

export interface ClassifiedPerspectiveField {
    enforcement: FieldEnforcement;
    displayValue: string;
}

export interface ClassifiedAGT {
    window_count: ClassifiedCountField;
    door_count: ClassifiedCountField;
    has_ceiling_fixture: ClassifiedBooleanField;
    has_built_in_niches: ClassifiedBooleanField;
    camera_perspective: ClassifiedPerspectiveField;
    hard_fact_fields: string[];
    advisory_fields: string[];
    suppressed_fields: string[];
    confidence_distribution: Record<ConfidenceLevel, number>;
}

import type { MultipartFile } from '@fastify/multipart';

// ── V7: Architectural Ground Truth types ──────────────────────────────────────

export type ConfidenceTier = 'high' | 'medium' | 'low';

export type WindowInstanceType = 'external_glazed' | 'skylight';
export type DoorInstanceType   = 'solid_door' | 'open_archway';

export interface WindowInstance { location: string; type: WindowInstanceType; }
export interface DoorInstance   { location: string; type: DoorInstanceType; }

export interface AGTCountField<I> {
    value:      number;
    confidence: ConfidenceTier;
    instances?: I[];
}

export interface AGTBoolField {
    value:      boolean;
    confidence: ConfidenceTier;
}

export interface AGTPerspectiveField {
    value:      'straight_on' | 'corner' | 'angled';
    confidence: ConfidenceTier;
}

export interface ArchitecturalGroundTruth {
    window_count:                  AGTCountField<WindowInstance>;
    door_count:                    AGTCountField<DoorInstance>;
    has_ceiling_fixture:           AGTBoolField;
    has_built_in_niches:           AGTBoolField;
    camera_perspective:            AGTPerspectiveField;
    extraction_confidence_overall: ConfidenceTier;
    uncertain_fields:              string[];   // field keys with confidence === 'low'
}

export type EnforcementTier = 'hard' | 'advisory' | 'suppressed';

export interface ClassifiedField {
    enforcement:  EnforcementTier;
    displayValue: string;           // pre-formatted for prompt injection
    spatialAnchors?: string[];      // instance location strings for hard facts
}

export interface ClassifiedAGT {
    window_count:       ClassifiedField;
    door_count:         ClassifiedField;
    has_ceiling_fixture: ClassifiedField;
    has_built_in_niches: ClassifiedField;
    camera_perspective:  ClassifiedField;
    hard_fact_fields:   string[];
    advisory_fields:    string[];
    suppressed_fields:  string[];
    confidence_distribution: Record<string, ConfidenceTier>;
}

// ── V6.0: Renovation catalogue types ─────────────────────────────────────────

export type RenovationCategory = 'flooring' | 'walls' | 'countertops' | 'cabinets';

export interface CatalogueItem {
    // Identity
    id: string;
    contractorId: string;
    category: RenovationCategory;

    // UI-facing — NOT used for prompt generation
    name: string;

    // Model-facing — REQUIRED, primary anchor description (15-20 words optimal)
    promptDescription: string;

    // Structured metadata — secondary; fallback enrichment only
    attributes: {
        material: string;
        tone?: 'light' | 'medium' | 'dark' | 'neutral';
        warmth?: 'warm' | 'cool' | 'neutral';
        finish?: string;
        pattern?: string;
        color?: string;
    };

    // Lifecycle
    active: boolean;
    contractorVisible: boolean;

    // Future: image-based anchoring (Phase 2 — not used in V6.0)
    imageUrl?: string;
}

// IDs as received from the request body (before catalogue resolution)
export interface RenovationSelectionIds {
    flooring?: string;
    walls?: string;
    countertops?: string;
    cabinets?: string;
}

// Resolved prompt strings (after catalogue validation and translation)
export interface ResolvedRenovationSelections {
    flooring?: string;
    walls?: string;
    countertops?: string;
    cabinets?: string;
}

// ── V4.0: Injected item abstraction ───────────────────────────────────────────
// Phase 1: image only. itemType, placementHint, and catalogue metadata
// fields are added in Phase 2.

export type ItemFidelityMode = 'preserve' | 'exact';

export interface InjectedItem {
    image: MultipartFile & { buffer: Buffer };
    fidelityMode?: ItemFidelityMode; // defaults to 'preserve'; 'exact' added in Phase 2
}

export interface StylePreset {
  id?: string;
  name: string;
  conflict_resolution?: string[];
  model_inputs: {
    core_materials: string[];
    color_palette: string[];
    lighting_style: string;
    material_finish: string;
    aperture_look: string;
    dont: string[];
    signature_elements?: string[]; // required for balanced_v4_1+; optional for older pipelines
  };
  pipeline_config: {
    structural_protocol: string;
    staging_density?: 'low' | 'medium' | 'high';
  };
  imageUrl?: string;
}

export interface GenerateVisualizationParams {
  roomImage: MultipartFile & { buffer: Buffer };
  roomType: string;
  stylePreset: StylePreset;
  moodBoardImages: (MultipartFile & { buffer: Buffer })[];
  furnitureImage?: (MultipartFile & { buffer: Buffer }) | null; // DEPRECATED — shim to injectedItems[0]
  injectedItems?: InjectedItem[]; // v4.0 — replaces furnitureImage; max 1 in v4.0, enforced by service
  textPrompt: string;
  styleInfluence: number;
  isRefinement?: boolean;
  geometryPreservation?: boolean;
  phaseAnchoring?: boolean;
  phaseAnchoringV2?: boolean;
  pipelineMode?: 'baseline_original' | 'balanced_v1' | 'balanced_v2' | 'balanced_v2_1' | 'balanced_v2_2' | 'balanced_v3_0' | 'balanced_v4_0' | 'balanced_v4_1' | 'balanced_v5' | 'balanced_v6' | 'balanced_v7' | 'improved_current';
  // Previous generated image for refinement context
  previousResultImage?: (MultipartFile & { buffer: Buffer }) | null;
  // V6.0: contractor catalogue integration
  contractorId?: string;
  renovationSelectionIds?: RenovationSelectionIds;
}
import type { MultipartFile } from '@fastify/multipart';

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
  pipelineMode?: 'baseline_original' | 'balanced_v1' | 'balanced_v2' | 'balanced_v2_1' | 'balanced_v2_2' | 'balanced_v3_0' | 'balanced_v4_0' | 'balanced_v4_1' | 'balanced_v5' | 'improved_current';
  // Previous generated image for refinement context
  previousResultImage?: (MultipartFile & { buffer: Buffer }) | null;
}
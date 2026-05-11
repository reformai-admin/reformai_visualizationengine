import type { MultipartFile } from '@fastify/multipart';

export interface StylePreset {
  id: string;
  name: string;
  model_inputs: {
    core_materials: string[];
    color_palette: string[];
    lighting_style: string;
    material_finish: string;
    aperture_look: string;
    dont: string[];
  };
  pipeline_config: {
    structural_protocol: string;
  };
  imageUrl?: string;
}

export interface GenerateVisualizationParams {
  roomImage: MultipartFile & { buffer: Buffer };
  roomType: string;
  stylePreset: StylePresetInput;
  moodBoardImages: (MultipartFile & { buffer: Buffer })[];
  furnitureImage?: (MultipartFile & { buffer: Buffer }) | null;
  textPrompt: string;
  styleInfluence: number;
  isRefinement?: boolean;
  geometryPreservation?: boolean;
  phaseAnchoring?: boolean;
  phaseAnchoringV2?: boolean;
  pipelineMode?: 'baseline_original' | 'improved_current';
  // Previous generated image for refinement context
  previousResultImage?: (MultipartFile & { buffer: Buffer }) | null;
}
import { z } from 'zod';

// Esquema para StylePreset
export const stylePresetSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'El nombre del preset es requerido'),
    model_inputs: z.object({
        core_materials: z.array(z.string()).optional().default([]),
        color_palette: z.array(z.string()).optional().default([]),
        lighting_style: z.string().optional().default(''),
        material_finish: z.string().optional().default(''),
        aperture_look: z.string().optional().default(''),
        dont: z.array(z.string()).optional().default([]),
    }).optional(),
    pipeline_config: z.object({
        structural_protocol: z.string().optional().default('rigid_base'),
    }).optional(),
    imageUrl: z.string().url('La URL de la imagen debe ser válida').optional(),
});

// Esquema para validar los datos del FormData
export const generateVisualizationSchema = z.object({
    roomType: z.string().min(1, 'El tipo de habitación es requerido'),
    textPrompt: z.string().optional(),
    styleInfluence: z.number()
        .min(0, 'La influencia del estilo debe ser minimo 0'),
    isRefinement: z.boolean().optional().default(false),
    geometryPreservation: z.boolean().optional().default(false),
    phaseAnchoring: z.boolean().optional().default(false),
    phaseAnchoringV2: z.boolean().optional().default(false),
    pipelineMode: z.enum(['baseline_original', 'improved_current']).optional().default('improved_current'),
    stylePreset: stylePresetSchema,
});

// Tipos inferidos de los schemas
export type StylePresetInput = z.infer<typeof stylePresetSchema>;
export type GenerateVisualizationInput = z.infer<typeof generateVisualizationSchema>;

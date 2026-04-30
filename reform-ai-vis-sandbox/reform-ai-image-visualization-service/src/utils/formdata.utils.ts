import type { MultipartFile, Multipart } from '@fastify/multipart';
import {
    ValidationError,
    validateImageFile,
    validateImageFiles,
    parseNumber,
    parseBoolean,
    parseJSON,
} from '../utils/validation.utils.js';
import { generateVisualizationSchema } from '../schemas/visualization.schema.js';
import { StylePreset, InjectedItem } from '../types.js';
import { STYLE_REGISTRY } from '../data/styles.js';

/**
 * Interfaz para los datos procesados del FormData
 */
export interface ProcessedVisualizationData {
    roomImage: MultipartFile & { buffer: Buffer };
    roomType: string;
    stylePreset: StylePreset;
    moodBoardImages: (MultipartFile & { buffer: Buffer })[];
    furnitureImage?: MultipartFile & { buffer: Buffer }; // kept for non-v4.0 pipelines
    injectedItems: InjectedItem[]; // v4.0: built from furnitureImage shim
    textPrompt: string;
    styleInfluence: number;
    isRefinement: boolean;
    geometryPreservation: boolean;
    phaseAnchoring: boolean;
    phaseAnchoringV2: boolean;
    pipelineMode: 'baseline_original' | 'balanced_v1' | 'balanced_v2' | 'balanced_v2_1' | 'balanced_v2_2' | 'balanced_v3_0' | 'balanced_v4_0' | 'balanced_v4_1' | 'balanced_v5' | 'improved_current';
    // Previous generated image for refinement context
    previousResultImage?: MultipartFile & { buffer: Buffer };
}

/**
 * Procesa y valida los datos del FormData para la generación de visualización
 */
export const processVisualizationFormData = async (
    parts: AsyncIterableIterator<Multipart>,
    queryMode?: 'baseline_original' | 'balanced_v1' | 'balanced_v2' | 'balanced_v2_1' | 'balanced_v2_2' | 'balanced_v3_0' | 'balanced_v4_0' | 'balanced_v4_1' | 'balanced_v5' | 'improved_current'
): Promise<ProcessedVisualizationData> => {
    const fields: Record<string, string | boolean> = {};
    const files: Record<string, MultipartFile | MultipartFile[]> = {};

    for await (const part of parts) {
        const fieldName = part.fieldname;

        if (part.type === 'file') {
            const buffer = await part.toBuffer();

            const fileWithBuffer = {
                ...part,
                buffer,
            };

            if (fieldName === 'moodBoardImages') {
                if (!files[fieldName]) {
                    files[fieldName] = [];
                }
                (files[fieldName] as MultipartFile[]).push(fileWithBuffer as any);
            } else {
                files[fieldName] = fileWithBuffer as any;
            }
        } else {
            if (part.value === 'true' || part.value === 'false') {
                fields[fieldName] = part.value === 'true';
            } else {
                fields[fieldName] = part.value as string;
            }
        }
    }

    // Validar que todos los campos requeridos estén presentes
    const roomImage = files['roomImage'] as (MultipartFile & { buffer: Buffer });
    if (!roomImage) {
        throw new ValidationError('El campo "roomImage" es requerido');
    }

    const moodBoardImages = (files['moodBoardImages'] as (MultipartFile & { buffer: Buffer })[]) || [];

    // Validar archivos de imagen
    validateImageFile(roomImage, 'roomImage');
    if (moodBoardImages.length) {
        validateImageFiles(moodBoardImages, 'moodBoardImages', { min: 1, max: 10 });
    }

    const furnitureImage = files['furnitureImage'] as (MultipartFile & { buffer: Buffer }) | undefined;
    if (furnitureImage) {
        validateImageFile(furnitureImage, 'furnitureImage');
    }

    const previousResultImage = files['previousResultImage'] as (MultipartFile & { buffer: Buffer }) | undefined;
    if (previousResultImage) {
        validateImageFile(previousResultImage, 'previousResultImage');
    }

    const styleInfluence = parseNumber(fields['styleInfluence'].toString(), 'styleInfluence');
    const isRefinement = parseBoolean(fields['isRefinement'].toString());
    const geometryPreservation = fields['geometryPreservation'] !== undefined ? parseBoolean(fields['geometryPreservation'].toString()) : false;
    const phaseAnchoring = fields['phaseAnchoring'] !== undefined ? parseBoolean(fields['phaseAnchoring'].toString()) : (queryMode === 'improved_current');
    const phaseAnchoringV2 = fields['phaseAnchoringV2'] !== undefined ? parseBoolean(fields['phaseAnchoringV2'].toString()) : (queryMode === 'improved_current');
    const pipelineMode = queryMode || (fields['pipelineMode'] !== undefined ? fields['pipelineMode'].toString() as 'baseline_original' | 'balanced_v1' | 'balanced_v2' | 'balanced_v2_1' | 'balanced_v2_2' | 'balanced_v3_0' | 'balanced_v4_0' | 'balanced_v4_1' | 'balanced_v5' | 'improved_current' : 'improved_current');
    let stylePreset = parseJSON<StylePreset>(fields['stylePreset'].toString(), 'stylePreset');

    // Enrich stylePreset from registry if it's just a name/id
    const registeredStyle = STYLE_REGISTRY.find(s => s.id === stylePreset.id || s.name === stylePreset.name);
    if (registeredStyle) {
        stylePreset = {
            ...registeredStyle,
            imageUrl: stylePreset.imageUrl,
        };
    }

    const dataToValidate = {
        roomType: fields['roomType'],
        textPrompt: fields['textPrompt'],
        styleInfluence,
        isRefinement,
        geometryPreservation,
        phaseAnchoring,
        phaseAnchoringV2,
        pipelineMode,
        stylePreset,
    };

    // Validar con Zod
    const validationResult = generateVisualizationSchema.safeParse(dataToValidate);

    if (!validationResult.success) {
        const errors = validationResult.error.issues
            .map((err) => `${err.path.join('.')}: ${err.message}`)
            .join(', ');
        throw new ValidationError(`Errores de validación: ${errors}`);
    }

    const validatedData = validationResult.data;

    // v4.0 shim: build injectedItems from furnitureImage for backward compatibility.
    // The v4.0 service reads injectedItems[]; all prior pipelines use furnitureImage directly.
    const injectedItems: InjectedItem[] = furnitureImage ? [{ image: furnitureImage }] : [];

    return {
        roomImage,
        roomType: validatedData.roomType,
        stylePreset: validatedData.stylePreset,
        moodBoardImages,
        furnitureImage,
        injectedItems,
        textPrompt: validatedData.textPrompt || '',
        styleInfluence: validatedData.styleInfluence,
        isRefinement: validatedData.isRefinement,
        geometryPreservation: validatedData.geometryPreservation,
        phaseAnchoring: validatedData.phaseAnchoring,
        phaseAnchoringV2: validatedData.phaseAnchoringV2,
        pipelineMode: validatedData.pipelineMode ?? pipelineMode,
        previousResultImage,
    };
}

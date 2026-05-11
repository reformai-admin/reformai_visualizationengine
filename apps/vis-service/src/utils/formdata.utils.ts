import type { MultipartFile, Multipart } from '@fastify/multipart';
import {
    ValidationError,
    validateImageFile,
    validateImageFiles,
    parseNumber,
    parseBoolean,
    parseJSON,
} from './validation.utils.js';
import { generateVisualizationSchema } from '../schemas/visualization.schema.js';
import type { StylePreset, InjectedItem, RenovationSelectionIds } from '../types.js';
import { STYLE_REGISTRY } from '../data/styles.js';

export interface ProcessedVisualizationData {
    roomImage: MultipartFile & { buffer: Buffer };
    roomType: string;
    stylePreset: StylePreset;
    moodBoardImages: (MultipartFile & { buffer: Buffer })[];
    furnitureImage?: MultipartFile & { buffer: Buffer };
    injectedItems: InjectedItem[];
    textPrompt: string;
    styleInfluence: number;
    isRefinement: boolean;
    geometryPreservation: boolean;
    phaseAnchoring: boolean;
    phaseAnchoringV2: boolean;
    pipelineMode: NonNullable<StylePreset extends never ? never : import('../types.js').GenerateVisualizationParams['pipelineMode']>;
    previousResultImage?: MultipartFile & { buffer: Buffer };
    contractorId?: string;
    renovationSelectionIds?: RenovationSelectionIds;
}

export const processVisualizationFormData = async (
    parts: AsyncIterableIterator<Multipart>,
    queryMode?: import('../types.js').GenerateVisualizationParams['pipelineMode'],
    contractorId?: string,
): Promise<ProcessedVisualizationData> => {
    const fields: Record<string, string | boolean> = {};
    const files: Record<string, MultipartFile | MultipartFile[]> = {};

    for await (const part of parts) {
        const fieldName = part.fieldname;
        if (part.type === 'file') {
            const buffer = await part.toBuffer();
            const fileWithBuffer = { ...part, buffer };
            if (fieldName === 'moodBoardImages') {
                if (!files[fieldName]) files[fieldName] = [];
                (files[fieldName] as MultipartFile[]).push(fileWithBuffer as any);
            } else {
                files[fieldName] = fileWithBuffer as any;
            }
        } else {
            fields[fieldName] = (part.value === 'true' || part.value === 'false')
                ? part.value === 'true'
                : part.value as string;
        }
    }

    const roomImage = files['roomImage'] as (MultipartFile & { buffer: Buffer });
    if (!roomImage) throw new ValidationError('El campo "roomImage" es requerido');

    const moodBoardImages = (files['moodBoardImages'] as (MultipartFile & { buffer: Buffer })[]) || [];
    validateImageFile(roomImage, 'roomImage');
    if (moodBoardImages.length) validateImageFiles(moodBoardImages, 'moodBoardImages', { min: 1, max: 10 });

    const furnitureImage = files['furnitureImage'] as (MultipartFile & { buffer: Buffer }) | undefined;
    if (furnitureImage) validateImageFile(furnitureImage, 'furnitureImage');

    const previousResultImage = files['previousResultImage'] as (MultipartFile & { buffer: Buffer }) | undefined;
    if (previousResultImage) validateImageFile(previousResultImage, 'previousResultImage');

    const styleInfluence = parseNumber(fields['styleInfluence']?.toString(), 'styleInfluence');
    const isRefinement = parseBoolean(fields['isRefinement']?.toString());
    const geometryPreservation = fields['geometryPreservation'] !== undefined ? parseBoolean(fields['geometryPreservation'].toString()) : false;
    const phaseAnchoring = fields['phaseAnchoring'] !== undefined ? parseBoolean(fields['phaseAnchoring'].toString()) : false;
    const phaseAnchoringV2 = fields['phaseAnchoringV2'] !== undefined ? parseBoolean(fields['phaseAnchoringV2'].toString()) : false;
    const pipelineMode = queryMode ?? (fields['pipelineMode']?.toString() as any) ?? 'balanced_v7';

    let stylePreset = parseJSON<StylePreset>(fields['stylePreset']?.toString(), 'stylePreset');
    const registeredStyle = STYLE_REGISTRY.find((s: { id?: string; name: string }) => s.id === stylePreset.id || s.name === stylePreset.name);
    if (registeredStyle) {
        stylePreset = { ...registeredStyle, imageUrl: stylePreset.imageUrl };
    }

    const renovationSelectionIds: RenovationSelectionIds | undefined = fields['renovationSelectionIds']
        ? parseJSON<RenovationSelectionIds>(fields['renovationSelectionIds'].toString(), 'renovationSelectionIds')
        : undefined;

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
        renovationSelectionIds,
    };

    const validationResult = generateVisualizationSchema.safeParse(dataToValidate);
    if (!validationResult.success) {
        const errors = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        throw new ValidationError(`Errores de validación: ${errors}`);
    }

    const validatedData = validationResult.data;
    const injectedItems: InjectedItem[] = furnitureImage ? [{ image: furnitureImage }] : [];

    return {
        roomImage,
        roomType: validatedData.roomType,
        stylePreset: validatedData.stylePreset as StylePreset,
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
        contractorId,
        renovationSelectionIds: validatedData.renovationSelectionIds,
    };
};

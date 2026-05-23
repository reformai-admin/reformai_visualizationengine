import { StylePreset } from '../../shared/types/index.js';
export interface VisualizationPromptParams {
    isRefinement: boolean;
    roomType: string;
    stylePresetName: string;
    influencePrompt: string;
    textPrompt: string;
    furniturePrompt: string;
    geometryPreservation: boolean;
    phaseAnchoring: boolean;
    phaseAnchoringV2: boolean;
    stylePreset: StylePreset;
    pipelineMode?: string;
}
export interface BuiltVisualizationPrompt {
    fullPrompt: string;
    structuralPart?: string;
    stylePart?: string;
}
export declare const buildVisualizationPrompt: (params: VisualizationPromptParams) => BuiltVisualizationPrompt;
export declare const buildInfluencePrompt: (moodBoardImagesCount: number, styleInfluence: number, stylePresetName: string) => string;
export declare const buildFurniturePrompt: (hasFurnitureImage: boolean, roomType: string) => string;
//# sourceMappingURL=visualization.prompt.d.ts.map
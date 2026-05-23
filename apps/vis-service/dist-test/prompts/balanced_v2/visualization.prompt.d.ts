import { StylePreset } from '../../shared/types/index.js';
export interface BalancedV2PromptParams {
    roomType: string;
    stylePresetName: string;
    stylePreset: StylePreset;
    influencePrompt: string;
    textPrompt: string;
    furniturePrompt: string;
    isRefinement?: boolean;
}
export interface BuiltBalancedV2Prompt {
    structuralPart: string;
    stylePart: string;
    fullPrompt: string;
}
export declare const buildVisualizationPrompt: (params: BalancedV2PromptParams) => BuiltBalancedV2Prompt;
export declare const buildInfluencePrompt: (moodBoardImagesCount: number, styleInfluence: number, stylePresetName: string) => string;
export declare const buildFurniturePrompt: (hasFurnitureImage: boolean, roomType: string) => string;
//# sourceMappingURL=visualization.prompt.d.ts.map
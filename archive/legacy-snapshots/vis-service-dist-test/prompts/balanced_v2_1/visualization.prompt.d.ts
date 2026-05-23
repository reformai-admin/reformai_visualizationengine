import { StylePreset } from '../../shared/types/index.js';
export interface BalancedV2_1PromptParams {
    roomType: string;
    stylePresetName: string;
    stylePreset: StylePreset;
    influencePrompt: string;
    textPrompt: string;
    furniturePrompt: string;
    isRefinement?: boolean;
}
export interface BuiltBalancedV2_1Prompt {
    structuralPart: string;
    stylePart: string;
    fullPrompt: string;
}
export declare const buildVisualizationPrompt: (params: BalancedV2_1PromptParams) => BuiltBalancedV2_1Prompt;
export declare const buildInfluencePrompt: (moodBoardImagesCount: number, styleInfluence: number, stylePresetName: string) => string;
export declare const buildFurniturePrompt: (hasFurnitureImage: boolean, roomType: string) => string;
//# sourceMappingURL=visualization.prompt.d.ts.map
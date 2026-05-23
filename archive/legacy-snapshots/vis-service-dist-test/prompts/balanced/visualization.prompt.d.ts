import { StylePreset } from '../../shared/types/index.js';
export interface BalancedPromptParams {
    roomType: string;
    stylePresetName: string;
    stylePreset: StylePreset;
    influencePrompt: string;
    textPrompt: string;
    furniturePrompt: string;
    isRefinement?: boolean;
}
export interface BuiltBalancedPrompt {
    structuralPart: string;
    stylePart: string;
    fullPrompt: string;
}
export declare const buildVisualizationPrompt: (params: BalancedPromptParams) => BuiltBalancedPrompt;
export declare const buildInfluencePrompt: (moodBoardImagesCount: number, styleInfluence: number, stylePresetName: string) => string;
export declare const buildFurniturePrompt: (hasFurnitureImage: boolean, roomType: string) => string;
//# sourceMappingURL=visualization.prompt.d.ts.map
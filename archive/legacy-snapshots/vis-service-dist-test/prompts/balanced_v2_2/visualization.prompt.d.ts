import { StylePreset } from '../../shared/types/index.js';
export interface BalancedV2_2PromptParams {
    roomType: string;
    stylePresetName: string;
    stylePreset: StylePreset;
    influencePrompt: string;
    textPrompt: string;
    furniturePrompt: string;
    isRefinement?: boolean;
}
export interface BuiltBalancedV2_2Prompt {
    structuralPart: string;
    stylePart: string;
    fullPrompt: string;
    rawApertureLook: string;
    safeApertureLook: string;
    apertureSanitized: boolean;
    stagingDensityTier: string;
}
export declare const sanitizeApertureLook: (raw: string) => {
    safeApertureLook: string;
    apertureSanitized: boolean;
};
export declare const buildVisualizationPrompt: (params: BalancedV2_2PromptParams) => BuiltBalancedV2_2Prompt;
export declare const buildInfluencePrompt: (moodBoardImagesCount: number, styleInfluence: number, stylePresetName: string) => string;
export declare const buildFurniturePrompt: (hasFurnitureImage: boolean, roomType: string) => string;
//# sourceMappingURL=visualization.prompt.d.ts.map
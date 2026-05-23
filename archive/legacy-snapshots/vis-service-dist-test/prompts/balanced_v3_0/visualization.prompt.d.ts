import { StylePreset } from '../../shared/types/index.js';
export declare class PromptInjectionError extends Error {
    constructor(message: string);
}
export declare const sanitizeApertureLook: (raw: string) => {
    safeApertureLook: string;
    apertureSanitized: boolean;
};
export interface BalancedV3_0PromptParams {
    roomType: string;
    stylePreset: StylePreset;
    textPrompt: string;
}
export interface BuiltBalancedV3_0Prompt {
    structuralPart: string;
    stylePart: string;
    rawApertureLook: string;
    safeApertureLook: string;
    apertureSanitized: boolean;
    stagingDensityTier: string;
}
export declare const buildVisualizationPrompt: (params: BalancedV3_0PromptParams) => BuiltBalancedV3_0Prompt;
export declare const buildInfluencePrompt: (moodBoardImagesCount: number, styleInfluence: number, stylePresetName: string) => string;
export declare const buildFurniturePrompt: (hasFurnitureImage: boolean, roomType: string) => string;
//# sourceMappingURL=visualization.prompt.d.ts.map
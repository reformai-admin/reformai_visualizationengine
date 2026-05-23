import { StylePreset } from '../../shared/types/index.js';
export declare class PromptInjectionError extends Error {
    constructor(message: string);
}
export declare const sanitizeApertureLook: (raw: string) => {
    safeApertureLook: string;
    apertureSanitized: boolean;
};
export interface BalancedV4_1PromptParams {
    roomType: string;
    stylePreset: StylePreset;
    textPrompt: string;
    hasInjectedItem: boolean;
}
export interface BuiltBalancedV4_1Prompt {
    structuralPart: string;
    stylePart: string;
    rawApertureLook: string;
    safeApertureLook: string;
    apertureSanitized: boolean;
    stagingDensityTier: string;
}
export declare const buildVisualizationPrompt: (params: BalancedV4_1PromptParams) => BuiltBalancedV4_1Prompt;
export declare const buildInfluencePrompt: (moodBoardImagesCount: number, styleInfluence: number, stylePresetName: string) => string;
//# sourceMappingURL=visualization.prompt.d.ts.map
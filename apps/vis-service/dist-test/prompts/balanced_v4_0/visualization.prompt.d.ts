import { StylePreset } from '../../shared/types/index.js';
export declare class PromptInjectionError extends Error {
    constructor(message: string);
}
export declare const sanitizeApertureLook: (raw: string) => {
    safeApertureLook: string;
    apertureSanitized: boolean;
};
export interface BalancedV4_0PromptParams {
    roomType: string;
    stylePreset: StylePreset;
    textPrompt: string;
    hasInjectedItem: boolean;
}
export interface BuiltBalancedV4_0Prompt {
    structuralPart: string;
    stylePart: string;
    rawApertureLook: string;
    safeApertureLook: string;
    apertureSanitized: boolean;
    stagingDensityTier: string;
}
export declare const buildVisualizationPrompt: (params: BalancedV4_0PromptParams) => BuiltBalancedV4_0Prompt;
export declare const buildInfluencePrompt: (moodBoardImagesCount: number, styleInfluence: number, stylePresetName: string) => string;
//# sourceMappingURL=visualization.prompt.d.ts.map
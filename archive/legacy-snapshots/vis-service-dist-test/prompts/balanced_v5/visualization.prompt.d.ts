import { StylePreset } from '../../shared/types/index.js';
export declare class PromptInjectionError extends Error {
    constructor(message: string);
}
export declare const sanitizeApertureLook: (raw: string) => {
    safeApertureLook: string;
    apertureSanitized: boolean;
};
export interface BalancedV5PromptParams {
    roomType: string;
    stylePreset: StylePreset;
    textPrompt: string;
    hasInjectedItem: boolean;
}
export interface BuiltBalancedV5Prompt {
    structuralPart: string;
    stylePart: string;
    rawApertureLook: string;
    safeApertureLook: string;
    apertureSanitized: boolean;
    stagingDensityTier: string;
}
export declare const buildVisualizationPrompt: (params: BalancedV5PromptParams) => BuiltBalancedV5Prompt;
export declare const buildInfluencePrompt: (moodBoardImagesCount: number, _styleInfluence: number, // ignored in V5 — no slider; kept for signature compatibility
_stylePresetName: string) => string;
export declare const buildMoodboardBlock: (styleName: string, stagingDensity: "low" | "medium" | "high", hasMoodboards: boolean) => string;
//# sourceMappingURL=visualization.prompt.d.ts.map
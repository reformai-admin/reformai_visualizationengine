export interface VisualizationPromptParams {
    isRefinement: boolean;
    roomType: string;
    stylePresetName: string;
    influencePrompt: string;
    textPrompt: string;
    furniturePrompt: string;
}
export declare const buildVisualizationPrompt: (params: VisualizationPromptParams) => string;
export declare const buildInfluencePrompt: (moodBoardImagesCount: number, styleInfluence: number, stylePresetName: string) => string;
export declare const buildFurniturePrompt: (hasFurnitureImage: boolean, roomType: string) => string;
//# sourceMappingURL=visualization.prompt.d.ts.map
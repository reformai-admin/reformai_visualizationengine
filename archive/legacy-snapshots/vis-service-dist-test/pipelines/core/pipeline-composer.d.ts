import type { GenerateVisualizationParams } from '../../shared/types/index.js';
import type { GeminiPart } from '../../shared/generation-parts.js';
import type { AGTInsertionContract } from '../../prompts/shared/contracts.js';
interface CommonBlocks {
    structuralPart: string;
    stylePart: string;
    moodboardScopeBlock: string;
    influencePrompt: string;
}
interface OptionalBlocks extends AGTInsertionContract {
    conflictClausesBlock?: string;
    constraintHierarchyBlock: string;
    renovationAnchorsBlock: string;
    injectedItemBlockHeader: string;
}
interface ComposeParams {
    request: GenerateVisualizationParams;
    common: CommonBlocks;
    optional: OptionalBlocks;
    itemImage?: GenerateVisualizationParams['roomImage'] | null;
}
export declare const composeCanonicalGenerationParts: ({ request, common, optional, itemImage, }: ComposeParams) => GeminiPart[];
export {};
//# sourceMappingURL=pipeline-composer.d.ts.map
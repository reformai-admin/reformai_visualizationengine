import { IMAGE_ROLES } from '../../prompts/imageRoles.js';
import type { GenerateVisualizationParams } from '../../types.js';
import type { GeminiPart } from './pipelineAssembly.js';
import { bufferToGenerativePart } from './pipelineAssembly.js';
import { CANONICAL_BLOCK_SEQUENCE } from '../../prompts/shared/sequence.js';
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

export const composeCanonicalGenerationParts = ({
    request,
    common,
    optional,
    itemImage,
}: ComposeParams): GeminiPart[] => {
    // Ordering contract lives in prompts/shared/sequence.ts
    // to keep V5/V7 composition aligned and reviewable.
    void CANONICAL_BLOCK_SEQUENCE;
    const parts: GeminiPart[] = [];
    const {
        roomImage,
        moodBoardImages,
        isRefinement,
        previousResultImage,
    } = request;

    parts.push({ text: IMAGE_ROLES.BASE_ROOM() });
    parts.push(bufferToGenerativePart(roomImage));

    if (optional.agtConstraintBlock) {
        parts.push({ text: optional.agtConstraintBlock });
    }

    parts.push({ text: optional.constraintHierarchyBlock });
    parts.push({ text: common.structuralPart });

    if (optional.renovationAnchorsBlock) {
        parts.push({ text: optional.renovationAnchorsBlock });
    }

    parts.push({ text: common.stylePart });

    if (optional.conflictClausesBlock) {
        parts.push({ text: optional.conflictClausesBlock });
    }

    if (common.moodboardScopeBlock) {
        parts.push({ text: common.moodboardScopeBlock });
    }

    moodBoardImages.forEach((img, i) => {
        parts.push({ text: IMAGE_ROLES.MOODBOARD_V5(i + 1) });
        parts.push(bufferToGenerativePart(img));
    });

    if (itemImage) {
        parts.push({ text: optional.injectedItemBlockHeader });
        parts.push({ text: IMAGE_ROLES.INJECTED_ITEM(1) });
        parts.push(bufferToGenerativePart(itemImage));
    }

    if (common.influencePrompt) {
        parts.push({ text: common.influencePrompt });
    }

    if (isRefinement && previousResultImage) {
        parts.push({ text: IMAGE_ROLES.PREVIOUS_RESULT() });
        parts.push(bufferToGenerativePart(previousResultImage));
    }

    if (optional.agtEchoBlock) {
        parts.push({ text: optional.agtEchoBlock });
    }

    parts.push({ text: IMAGE_ROLES.BASE_ROOM_REANCHOR() });
    parts.push(bufferToGenerativePart(roomImage));

    return parts;
};

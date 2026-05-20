import { GenerateVisualizationParams, ResolvedRenovationSelections } from '../../types.js';
import {
    buildAGTConstraintBlock,
    buildAGTEchoBlock,
    buildConflictClausesBlock,
    buildConstraintHierarchyBlock,
    buildRenovationAnchorsBlock,
    INJECTED_ITEM_BLOCK_HEADER,
} from '../../prompts/balanced_v7/visualization.constants.js';
import {
    buildVisualizationPrompt,
    buildInfluencePrompt,
    buildMoodboardBlock,
} from '../../prompts/balanced_v7/visualization.prompt.js';
import {
    extractArchitecturalGroundTruth,
    FALLBACK_AGT,
} from '../../agt/extract.js';
import { classifyAGTConfidence } from '../../agt/classify.js';
import {
    resolveRenovationSelections,
    hasActiveSelections,
} from '../../catalogue/resolver.js';
import {
    GeminiPart,
    buildRequestStructure,
    normalizeInjectedItems,
} from '../../runner/parts.js';
import { composeCanonicalGenerationParts } from '../composer.js';
import { callGemini } from '../../runner/gemini.js';

export const generateVisualization = async (
    params: GenerateVisualizationParams,
): Promise<{ image: string; debug: any }> => {
    const {
        roomImage,
        roomType,
        stylePreset,
        moodBoardImages,
        textPrompt,
        styleInfluence,
        contractorId,
        renovationSelectionIds,
    } = params;

    const {
        injectedItems,
        item,
        hasInjectedItem,
        shimmedFromFurnitureImage,
    } = normalizeInjectedItems(params, 'balanced_v7');

    const hasMoodboards = moodBoardImages.length > 0;

    const rawAGT = await extractArchitecturalGroundTruth(roomImage).catch(() => FALLBACK_AGT);
    const classifiedAGT = classifyAGTConfidence(rawAGT);
    const hasHardAGTFacts = classifiedAGT.hard_fact_fields.length > 0;

    let resolvedRenovationSelections: ResolvedRenovationSelections | null = null;
    if (contractorId && hasActiveSelections(renovationSelectionIds)) {
        resolvedRenovationSelections = await resolveRenovationSelections(
            contractorId,
            renovationSelectionIds!,
        );
    }
    const hasRenovationAnchors =
        resolvedRenovationSelections !== null &&
        Object.values(resolvedRenovationSelections).some(Boolean);

    const stagingDensity = (stylePreset.pipeline_config?.staging_density ?? 'medium') as 'low' | 'medium' | 'high';

    const {
        structuralPart,
        stylePart,
        rawApertureLook,
        safeApertureLook,
        apertureSanitized,
        stagingDensityTier,
    } = buildVisualizationPrompt({
        roomType,
        stylePreset,
        textPrompt,
        hasInjectedItem,
    });

    const agtConstraintBlock = buildAGTConstraintBlock(classifiedAGT);
    const agtEchoBlock = buildAGTEchoBlock(classifiedAGT);
    const conflictClausesBlock = buildConflictClausesBlock(stylePreset.conflict_resolution);
    const constraintHierarchy = buildConstraintHierarchyBlock(
        injectedItems.length,
        hasRenovationAnchors,
        hasHardAGTFacts,
    );
    const renovationAnchorsBlock = buildRenovationAnchorsBlock(
        resolvedRenovationSelections ?? {},
    );
    const moodboardScopeBlock = buildMoodboardBlock(
        stylePreset.name,
        stagingDensity,
        hasMoodboards,
    );
    const influencePrompt = buildInfluencePrompt(
        moodBoardImages.length,
        styleInfluence,
        stylePreset.name,
    );

    const parts: GeminiPart[] = composeCanonicalGenerationParts({
        request: params,
        common: {
            structuralPart,
            stylePart,
            moodboardScopeBlock,
            influencePrompt,
        },
        optional: {
            agtConstraintBlock,
            conflictClausesBlock,
            constraintHierarchyBlock: constraintHierarchy,
            renovationAnchorsBlock,
            agtEchoBlock,
            injectedItemBlockHeader: INJECTED_ITEM_BLOCK_HEADER,
        },
        itemImage: item?.image ?? null,
    });

    const { image } = await callGemini(parts);

    return {
        image,
        debug: {
            pipelineMode: 'balanced_v7',
            templateVersion: '7.0.0',
            agtExtractionOverall: rawAGT.extraction_confidence_overall,
            agtUncertainFields: rawAGT.uncertain_fields,
            agtConfidenceDistribution: classifiedAGT.confidence_distribution,
            agtHardFactFields: classifiedAGT.hard_fact_fields,
            agtAdvisoryFields: classifiedAGT.advisory_fields,
            agtSuppressedFields: classifiedAGT.suppressed_fields,
            agtConstraintBlock,
            agtEchoBlockInserted: !!agtEchoBlock,
            agtEchoBlock: agtEchoBlock || null,
            conflictClausesInserted: !!conflictClausesBlock,
            conflictClausesBlock: conflictClausesBlock || null,
            hasInjectedItem,
            injectedItem: item ? { shimmedFromFurnitureImage } : null,
            moodboardScopeBlockInserted: hasMoodboards,
            moodboardCount: moodBoardImages.length,
            stagingDensity,
            contractorId: contractorId ?? null,
            renovationSelectionIds: renovationSelectionIds ?? null,
            resolvedRenovationSelections: resolvedRenovationSelections ?? null,
            renovationAnchorsInserted: hasRenovationAnchors,
            renovationAnchorCount: hasRenovationAnchors
                ? Object.values(resolvedRenovationSelections!).filter(Boolean).length
                : 0,
            requestStructure: buildRequestStructure(parts),
            structuralPart,
            stylePart,
            styleObject: stylePreset,
            structuralProtocol: stylePreset.pipeline_config?.structural_protocol ?? 'rigid_base',
            stagingDensityTier,
            rawApertureLook,
            safeApertureLook,
            apertureSanitized,
        },
    };
};

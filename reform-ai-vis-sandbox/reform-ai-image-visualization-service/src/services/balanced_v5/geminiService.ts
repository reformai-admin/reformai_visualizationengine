// ============================================================
// BALANCED V5 — GEMINI SERVICE
//
// Request assembly for pipelineMode 'balanced_v5'.
//
// Lean V5 changes vs V4.1:
//   - TIER 5 in constraint hierarchy block is rewritten (no slider reference)
//   - Moodboard scope block inserted before moodboard images (conditional)
//   - MOODBOARD_V5 role label used in place of MOODBOARD
//   - buildInfluencePrompt ignores styleInfluence; branches on moodboard count only
//
// Part ordering:
//   1.  [LABEL] Base room
//   2.  [IMAGE] Base room
//   3.  [TEXT]  Constraint hierarchy block (V5 — updated TIER 5)
//   4.  [TEXT]  Structural part
//   5.  [TEXT]  Style part
//   6.  [TEXT]  Moodboard scope block       (conditional — only if moodboards present)
//   7.  [LABEL] Moodboard N                 (repeated per image — uses MOODBOARD_V5 label)
//   8.  [IMAGE] Moodboard N                 (repeated per image)
//   9.  [TEXT]  Injected item block header  (conditional — only if item present)
//  10.  [LABEL] Injected item 1             (conditional — only if item present)
//  11.  [IMAGE] Injected item 1             (conditional — only if item present)
//  12.  [TEXT]  Influence statement         (V5 fixed statement or preset-only string)
//  13.  [LABEL] Previous result             (conditional — only if isRefinement)
//  14.  [IMAGE] Previous result             (conditional — only if isRefinement)
//  15.  [LABEL] Base room re-anchor
//  16.  [IMAGE] Base room re-anchor
//
// No-moodboard path: positions 6–8 are omitted; parts order is identical to V4.1.
// ============================================================

import { loadEnvFile } from 'node:process';
import { GoogleGenAI, Modality } from '@google/genai';
import type { MultipartFile } from '@fastify/multipart';
import { GenerateVisualizationParams, InjectedItem } from '../../types.js';
import { IMAGE_ROLES } from '../../prompts/imageRoles.js';
import {
    buildConstraintHierarchyBlock,
    INJECTED_ITEM_BLOCK_HEADER,
} from '../../prompts/balanced_v5/visualization.constants.js';
import {
    buildVisualizationPrompt,
    buildInfluencePrompt,
    buildMoodboardBlock,
} from '../../prompts/balanced_v5/visualization.prompt.js';

if (!process.env.K_SERVICE) {
    try {
        loadEnvFile();
    } catch {
        // .env file not found — rely on environment variables already set
    }
}

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error('API_KEY environment variable is not set.');
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const bufferToGenerativePart = (file: MultipartFile & { buffer: Buffer }) => ({
    inlineData: { data: file.buffer.toString('base64'), mimeType: file.mimetype },
});

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
        isRefinement,
        previousResultImage,
    } = params;

    // ── Resolve injected items ────────────────────────────────────────────────
    let injectedItems: InjectedItem[] = params.injectedItems ?? [];

    if (injectedItems.length === 0 && params.furnitureImage) {
        injectedItems = [{ image: params.furnitureImage }];
    }

    // ── Validate: max 1 item (same constraint as V4.1) ────────────────────────
    if (injectedItems.length > 1) {
        throw new Error(
            `balanced_v5 supports a maximum of 1 injected item. ` +
            `Received ${injectedItems.length}. Multi-item support is planned for a future version.`,
        );
    }

    const item = injectedItems[0] ?? null;
    const hasInjectedItem = item !== null;
    const hasMoodboards = moodBoardImages.length > 0;

    // ── Resolve staging density for scope block ───────────────────────────────
    const stagingDensity = (stylePreset.pipeline_config?.staging_density ?? 'medium') as 'low' | 'medium' | 'high';

    // ── Build prompt parts ────────────────────────────────────────────────────
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

    const constraintHierarchyBlock = buildConstraintHierarchyBlock(injectedItems.length);

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

    // ── Assemble request parts ────────────────────────────────────────────────
    type Part = { inlineData: { data: string; mimeType: string } } | { text: string };
    const parts: Part[] = [];

    // 1–2. Base room
    parts.push({ text: IMAGE_ROLES.BASE_ROOM() });
    parts.push(bufferToGenerativePart(roomImage));

    // 3. Constraint hierarchy (V5 — updated TIER 5)
    parts.push({ text: constraintHierarchyBlock });

    // 4. Structural part
    parts.push({ text: structuralPart });

    // 5. Style part
    parts.push({ text: stylePart });

    // 6. Moodboard scope block (conditional — only when moodboards present)
    if (moodboardScopeBlock) {
        parts.push({ text: moodboardScopeBlock });
    }

    // 7–8. Moodboard images (uses MOODBOARD_V5 label)
    moodBoardImages.forEach((img, i) => {
        parts.push({ text: IMAGE_ROLES.MOODBOARD_V5(i + 1) });
        parts.push(bufferToGenerativePart(img));
    });

    // 9–11. Injected item (conditional)
    if (item) {
        parts.push({ text: INJECTED_ITEM_BLOCK_HEADER });
        parts.push({ text: IMAGE_ROLES.INJECTED_ITEM(1) });
        parts.push(bufferToGenerativePart(item.image));
    }

    // 12. Influence statement (V5 fixed statement or preset-only string)
    if (influencePrompt) {
        parts.push({ text: influencePrompt });
    }

    // 13–14. Refinement context (conditional)
    if (isRefinement && previousResultImage) {
        parts.push({ text: IMAGE_ROLES.PREVIOUS_RESULT() });
        parts.push(bufferToGenerativePart(previousResultImage));
    }

    // 15–16. Base room re-anchor
    parts.push({ text: IMAGE_ROLES.BASE_ROOM_REANCHOR() });
    parts.push(bufferToGenerativePart(roomImage));

    // ── API call ──────────────────────────────────────────────────────────────
    const model = 'gemini-2.5-flash-image';

    const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: { responseModalities: [Modality.IMAGE] },
    });

    const firstPart = response.candidates?.[0]?.content?.parts?.[0];

    if (firstPart?.inlineData?.data) {
        return {
            image: firstPart.inlineData.data,
            debug: {
                pipelineMode: 'balanced_v5',
                templateVersion: '5.2.1',
                hasInjectedItem,
                injectedItem: item ? { shimmedFromFurnitureImage: !params.injectedItems?.length } : null,
                moodboardScopeBlockInserted: hasMoodboards,
                moodboardCount: moodBoardImages.length,
                stagingDensity,
                requestStructure: parts.map(p =>
                    'text' in p
                        ? (p.text.startsWith('[') ? `LABEL:${p.text.slice(1, p.text.indexOf(']'))}` : 'TEXT')
                        : 'IMAGE'
                ),
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
    }

    const finishReason = response.candidates?.[0]?.finishReason;
    throw new Error(
        `No image returned by Gemini.${finishReason ? ` Finish reason: ${finishReason}` : ' Response may have been blocked.'}`,
    );
};

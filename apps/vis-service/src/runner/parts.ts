// Shared request assembly utilities.
// Image encoding, injected item normalization, and parts-array introspection.
// Moved from services/shared/pipelineAssembly.ts.

import type { MultipartFile } from '@fastify/multipart';
import type { GenerateVisualizationParams, InjectedItem } from '../types/core.js';

export type GeminiPart =
    | { inlineData: { data: string; mimeType: string } }
    | { text: string };

export const bufferToGenerativePart = (file: MultipartFile & { buffer: Buffer }): GeminiPart => ({
    inlineData: { data: file.buffer.toString('base64'), mimeType: file.mimetype },
});

export const normalizeInjectedItems = (
    params: GenerateVisualizationParams,
    pipelineMode: 'balanced_v5' | 'balanced_v7',
): {
    injectedItems: InjectedItem[];
    item: InjectedItem | null;
    hasInjectedItem: boolean;
    shimmedFromFurnitureImage: boolean;
} => {
    let injectedItems: InjectedItem[] = params.injectedItems ?? [];
    const shimmedFromFurnitureImage = injectedItems.length === 0 && !!params.furnitureImage;
    if (shimmedFromFurnitureImage) {
        injectedItems = [{ image: params.furnitureImage! }];
    }
    if (injectedItems.length > 1) {
        throw new Error(
            `${pipelineMode} supports a maximum of 1 injected item. ` +
            `Received ${injectedItems.length}.`,
        );
    }
    const item = injectedItems[0] ?? null;
    return {
        injectedItems,
        item,
        hasInjectedItem: item !== null,
        shimmedFromFurnitureImage,
    };
};

export const buildRequestStructure = (parts: GeminiPart[]): string[] =>
    parts.map((part) => {
        if ('text' in part) {
            return part.text.startsWith('[')
                ? `LABEL:${part.text.slice(1, part.text.indexOf(']'))}`
                : 'TEXT';
        }
        return 'IMAGE';
    });

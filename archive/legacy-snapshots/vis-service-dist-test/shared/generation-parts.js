// Shared request assembly utilities.
// Image encoding, injected item normalization, and parts-array introspection.
// Moved from services/shared/pipelineAssembly.ts.
export const bufferToGenerativePart = (file) => ({
    inlineData: { data: file.buffer.toString('base64'), mimeType: file.mimetype },
});
export const normalizeInjectedItems = (params, pipelineMode) => {
    let injectedItems = params.injectedItems ?? [];
    const shimmedFromFurnitureImage = injectedItems.length === 0 && !!params.furnitureImage;
    if (shimmedFromFurnitureImage) {
        injectedItems = [{ image: params.furnitureImage }];
    }
    if (injectedItems.length > 1) {
        throw new Error(`${pipelineMode} supports a maximum of 1 injected item. ` +
            `Received ${injectedItems.length}.`);
    }
    const item = injectedItems[0] ?? null;
    return {
        injectedItems,
        item,
        hasInjectedItem: item !== null,
        shimmedFromFurnitureImage,
    };
};
export const buildRequestStructure = (parts) => parts.map((part) => {
    if ('text' in part) {
        return part.text.startsWith('[')
            ? `LABEL:${part.text.slice(1, part.text.indexOf(']'))}`
            : 'TEXT';
    }
    return 'IMAGE';
});
//# sourceMappingURL=generation-parts.js.map
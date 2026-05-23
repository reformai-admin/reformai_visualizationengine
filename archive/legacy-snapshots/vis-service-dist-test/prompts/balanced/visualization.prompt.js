import { BALANCED_PHASE_1, BALANCED_PHASE_2_HEADER, FURNISHING_MANDATE, STYLE_PRIORITY, REALISM_CONSTRAINT, DESIGN_RULES, RENOVATION_FEASIBILITY_RULES, LIGHTING_NORMALIZATION, BALANCED_PROTOCOL_RIGID_BASE, BALANCED_PROTOCOL_RIGID_APERTURE_LOCK, BALANCED_PROTOCOL_SURFACE_ONLY_TRANSFORM, INFLUENCE_PRIORITIZE_PRESET_STYLE, INFLUENCE_PRIORITIZE_MOOD_BOARD, INFLUENCE_BALANCE_STYLE_AND_MOOD_BOARD, INFLUENCE_PRESET_STYLE_ONLY, INSTRUCTION_INTEGRATE_FURNITURE, DEFAULT_USER_REQUEST, } from './visualization.constants.js';
// ── helpers ───────────────────────────────────────────────────────────────────
const buildStyleBlock = (modelInputs) => {
    const lines = [
        '**STYLE DEFINITION:**',
        'Style Materials:',
        ...(modelInputs?.core_materials ?? []).map((m) => `- ${m}`),
        '',
        'Color Palette:',
        ...(modelInputs?.color_palette ?? []).map((c) => `- ${c}`),
        '',
        `Lighting: ${modelInputs?.lighting_style ?? ''}`,
        `Material Finish: ${modelInputs?.material_finish ?? ''}`,
    ];
    if (modelInputs?.aperture_look) {
        lines.push(`Aperture Look: ${modelInputs.aperture_look}`);
    }
    if (modelInputs?.dont?.length) {
        lines.push('', 'Do Not:');
        lines.push(...(modelInputs.dont ?? []).map((d) => `- ${d}`));
    }
    return lines.join('\n');
};
const getProtocol = (protocol) => {
    switch (protocol) {
        case 'rigid_aperture_lock': return BALANCED_PROTOCOL_RIGID_APERTURE_LOCK;
        case 'surface_only_transform': return BALANCED_PROTOCOL_SURFACE_ONLY_TRANSFORM;
        default: return BALANCED_PROTOCOL_RIGID_BASE;
    }
};
// ── builder ───────────────────────────────────────────────────────────────────
export const buildVisualizationPrompt = (params) => {
    const { roomType, stylePreset, textPrompt, } = params;
    const styleBlock = buildStyleBlock(stylePreset.model_inputs);
    const protocol = getProtocol(stylePreset.pipeline_config?.structural_protocol);
    const userRequest = textPrompt?.trim() || DEFAULT_USER_REQUEST;
    const structuralPart = BALANCED_PHASE_1;
    const stylePart = [
        BALANCED_PHASE_2_HEADER
            .replace(/\{\{ROOM_TYPE\}\}/g, roomType)
            .replace(/\{\{STYLE_NAME\}\}/g, stylePreset.name)
            .replace(/\{\{USER_REQUEST\}\}/g, userRequest),
        FURNISHING_MANDATE
            .replace(/\{\{ROOM_TYPE\}\}/g, roomType)
            .replace(/\{\{STYLE_NAME\}\}/g, stylePreset.name),
        styleBlock,
        STYLE_PRIORITY,
        REALISM_CONSTRAINT,
        DESIGN_RULES.replace(/\{\{ROOM_TYPE\}\}/g, roomType),
        RENOVATION_FEASIBILITY_RULES,
        LIGHTING_NORMALIZATION,
        protocol,
    ].join('\n');
    return {
        structuralPart,
        stylePart,
        fullPrompt: '', // not used — parts are sent separately
    };
};
// ── influence / furniture (pass-through from improved) ────────────────────────
export const buildInfluencePrompt = (moodBoardImagesCount, styleInfluence, stylePresetName) => {
    if (moodBoardImagesCount > 0) {
        if (styleInfluence < 33)
            return INFLUENCE_PRIORITIZE_PRESET_STYLE.replace(/\{\{STYLE_NAME\}\}/g, stylePresetName);
        if (styleInfluence > 66)
            return INFLUENCE_PRIORITIZE_MOOD_BOARD;
        return INFLUENCE_BALANCE_STYLE_AND_MOOD_BOARD.replace(/\{\{STYLE_NAME\}\}/g, stylePresetName);
    }
    return INFLUENCE_PRESET_STYLE_ONLY;
};
export const buildFurniturePrompt = (hasFurnitureImage, roomType) => {
    if (!hasFurnitureImage)
        return '';
    return INSTRUCTION_INTEGRATE_FURNITURE.replace(/\{\{ROOM_TYPE\}\}/g, roomType);
};
//# sourceMappingURL=visualization.prompt.js.map
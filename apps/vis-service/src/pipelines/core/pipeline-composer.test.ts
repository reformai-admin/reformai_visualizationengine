import test from 'node:test';
import assert from 'node:assert/strict';
import { composeCanonicalGenerationParts } from './pipeline-composer.js';
import type { GenerateVisualizationParams } from '../../shared/types/index.js';

const fakeImage = (name: string) => ({
    fieldname: name,
    filename: `${name}.png`,
    encoding: '7bit',
    mimetype: 'image/png',
    file: {} as any,
    fields: {} as any,
    toBuffer: async () => Buffer.from('x'),
    buffer: Buffer.from('x'),
});

const baseRequest: GenerateVisualizationParams = {
    roomImage: fakeImage('room') as any,
    roomType: 'living_room',
    stylePreset: {
        name: 'Modern',
        model_inputs: {
            core_materials: ['white plaster'],
            color_palette: ['white'],
            lighting_style: 'soft',
            material_finish: 'matte',
            aperture_look: '',
            dont: [],
            signature_elements: ['clean lines'],
        },
        pipeline_config: { structural_protocol: 'rigid_base' },
    },
    moodBoardImages: [],
    textPrompt: '',
    styleInfluence: 50,
};

test('keeps canonical core ordering with AGT and re-anchor blocks', () => {
    const parts = composeCanonicalGenerationParts({
        request: baseRequest,
        common: {
            structuralPart: 'STRUCTURAL',
            stylePart: 'STYLE',
            moodboardScopeBlock: '',
            influencePrompt: 'INFLUENCE',
        },
        optional: {
            agtConstraintBlock: 'AGT_CONSTRAINT',
            agtEchoBlock: 'AGT_ECHO',
            constraintHierarchyBlock: 'HIERARCHY',
            renovationAnchorsBlock: '',
            injectedItemBlockHeader: '',
        },
        itemImage: null,
    });

    const textParts = parts
        .filter((p): p is { text: string } => 'text' in p)
        .map(p => p.text);

    const agtIdx = textParts.indexOf('AGT_CONSTRAINT');
    const hierarchyIdx = textParts.indexOf('HIERARCHY');
    const structuralIdx = textParts.indexOf('STRUCTURAL');
    const styleIdx = textParts.indexOf('STYLE');
    const influenceIdx = textParts.indexOf('INFLUENCE');
    const echoIdx = textParts.indexOf('AGT_ECHO');

    assert.ok(agtIdx < hierarchyIdx, 'AGT constraint before hierarchy');
    assert.ok(hierarchyIdx < structuralIdx, 'hierarchy before structural');
    assert.ok(structuralIdx < styleIdx, 'structural before style');
    assert.ok(styleIdx < influenceIdx, 'style before influence');
    assert.ok(influenceIdx < echoIdx, 'influence before AGT echo');
});



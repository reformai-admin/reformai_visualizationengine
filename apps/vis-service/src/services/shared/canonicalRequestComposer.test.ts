import test from 'node:test';
import assert from 'node:assert/strict';
import { composeCanonicalGenerationParts } from './canonicalRequestComposer.js';
import type { GenerateVisualizationParams } from '../../types.js';

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
            core_materials: [],
            color_palette: [],
            lighting_style: '',
            material_finish: '',
            aperture_look: '',
            dont: [],
        },
        pipeline_config: { structural_protocol: 'rigid_base' },
    },
    moodBoardImages: [],
    textPrompt: '',
    styleInfluence: 0,
    pipelineMode: 'balanced_v7',
};

test('keeps canonical core ordering with AGT and re-anchor blocks', () => {
    const parts = composeCanonicalGenerationParts({
        request: baseRequest,
        common: {
            structuralPart: 'STRUCT',
            stylePart: 'STYLE',
            moodboardScopeBlock: '',
            influencePrompt: 'INFLUENCE',
        },
        optional: {
            agtConstraintBlock: 'AGT',
            conflictClausesBlock: 'CONFLICT',
            constraintHierarchyBlock: 'HIERARCHY',
            renovationAnchorsBlock: '',
            agtEchoBlock: 'AGT_ECHO',
            injectedItemBlockHeader: 'INJECT',
        },
    });

    const textParts = parts.filter((p): p is { text: string } => 'text' in p).map((p) => p.text);
    assert.equal(textParts[1], 'AGT');
    assert.equal(textParts[2], 'HIERARCHY');
    assert.equal(textParts[3], 'STRUCT');
    assert.equal(textParts[4], 'STYLE');
    assert.equal(textParts[5], 'CONFLICT');
    assert.equal(textParts[6], 'INFLUENCE');
    assert.equal(textParts[7], 'AGT_ECHO');
    assert.match(textParts[0], /^\[BASE ROOM IMAGE\]/);
    assert.match(textParts[8], /^\[BASE ROOM IMAGE .*RE-ANCHOR\]/);
});

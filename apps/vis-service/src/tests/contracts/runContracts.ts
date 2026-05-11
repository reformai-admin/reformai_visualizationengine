import assert from 'node:assert/strict';
import {
    normalizePipelineModeInput,
    resolveDispatchModes,
    resolveHandlerMode,
    resolvePipelineMode,
    type PipelineMode,
} from '../../services/pipelineRouting.js';
import { classifyAGTConfidence } from '../../services/agt/classifyAGTConfidence.js';
import type { ArchitecturalGroundTruth, GenerateVisualizationParams } from '../../types.js';
import { composeCanonicalGenerationParts } from '../../services/shared/canonicalRequestComposer.js';
import { buildConstraintHierarchyBlock } from '../../prompts/balanced_v7/visualization.constants.js';
import { dispatchWithHandlers } from '../../services/geminiService.js';

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

const baseAGT: ArchitecturalGroundTruth = {
    window_count: { value: 2, confidence: 'high', instances: [] },
    door_count: { value: 1, confidence: 'high', instances: [] },
    has_ceiling_fixture: { value: true, confidence: 'high' },
    has_built_in_niches: { value: false, confidence: 'medium' },
    camera_perspective: { value: 'corner', confidence: 'medium' },
    extraction_confidence_overall: 'high',
    uncertain_fields: [],
};

const checks: Array<{ name: string; run: () => void }> = [
    {
        name: 'default mode resolves to balanced_v7',
        run: () => assert.equal(resolvePipelineMode(undefined), 'balanced_v7'),
    },
    {
        name: 'balanced_v6 alias resolves handler mode balanced_v5',
        run: () => assert.equal(resolveHandlerMode('balanced_v6'), 'balanced_v5'),
    },
    {
        name: 'balanced_v6 keeps explicit log mode while executing v5 handler mode',
        run: () => {
            const resolved = resolveDispatchModes('balanced_v6');
            assert.equal(resolved.logMode, 'balanced_v6');
            assert.equal(resolved.handlerMode, 'balanced_v5');
        },
    },
    {
        name: 'balanced_v7 handler mode remains balanced_v7',
        run: () => assert.equal(resolveHandlerMode('balanced_v7'), 'balanced_v7'),
    },
    {
        name: 'AGT high-confidence counts downgrade when instances missing',
        run: () => {
            const result = classifyAGTConfidence(baseAGT);
            assert.equal(result.window_count.enforcement, 'advisory');
            assert.equal(result.door_count.enforcement, 'advisory');
        },
    },
    {
        name: 'AGT high-confidence counts remain hard when instances match',
        run: () => {
            const result = classifyAGTConfidence({
                ...baseAGT,
                window_count: {
                    value: 2,
                    confidence: 'high',
                    instances: [
                        { location: 'left wall', type: 'external_glazed' },
                        { location: 'rear wall', type: 'external_glazed' },
                    ],
                },
                door_count: {
                    value: 1,
                    confidence: 'high',
                    instances: [{ location: 'rear wall', type: 'solid_door' }],
                },
            });
            assert.equal(result.window_count.enforcement, 'hard');
            assert.equal(result.door_count.enforcement, 'hard');
        },
    },
    {
        name: 'invalid mode input fails predictably',
        run: () => {
            assert.throws(
                () => normalizePipelineModeInput('balanced_v999'),
                /Unsupported pipeline mode: balanced_v999/,
            );
        },
    },
    {
        name: 'dispatcher routes explicit mode to expected handler',
        run: async () => {
            const calls: string[] = [];
            const mkHandler = (name: PipelineMode) => async () => {
                calls.push(name);
                return { image: 'x', debug: { name } };
            };
            const handlers = {
                baseline_original: mkHandler('baseline_original'),
                balanced_v1: mkHandler('balanced_v1'),
                balanced_v2: mkHandler('balanced_v2'),
                balanced_v2_1: mkHandler('balanced_v2_1'),
                balanced_v2_2: mkHandler('balanced_v2_2'),
                balanced_v3_0: mkHandler('balanced_v3_0'),
                balanced_v4_0: mkHandler('balanced_v4_0'),
                balanced_v4_1: mkHandler('balanced_v4_1'),
                balanced_v5: mkHandler('balanced_v5'),
                balanced_v6: mkHandler('balanced_v6'),
                balanced_v7: mkHandler('balanced_v7'),
                improved_current: mkHandler('improved_current'),
            };
            await dispatchWithHandlers({ ...baseRequest, pipelineMode: 'balanced_v4_1' }, handlers);
            assert.deepEqual(calls, ['balanced_v4_1']);
        },
    },
    {
        name: 'dispatcher uses balanced_v7 when mode omitted',
        run: async () => {
            const calls: string[] = [];
            const mkHandler = (name: PipelineMode) => async () => {
                calls.push(name);
                return { image: 'x', debug: { name } };
            };
            const handlers = {
                baseline_original: mkHandler('baseline_original'),
                balanced_v1: mkHandler('balanced_v1'),
                balanced_v2: mkHandler('balanced_v2'),
                balanced_v2_1: mkHandler('balanced_v2_1'),
                balanced_v2_2: mkHandler('balanced_v2_2'),
                balanced_v3_0: mkHandler('balanced_v3_0'),
                balanced_v4_0: mkHandler('balanced_v4_0'),
                balanced_v4_1: mkHandler('balanced_v4_1'),
                balanced_v5: mkHandler('balanced_v5'),
                balanced_v6: mkHandler('balanced_v6'),
                balanced_v7: mkHandler('balanced_v7'),
                improved_current: mkHandler('improved_current'),
            };
            const noMode = { ...baseRequest };
            delete (noMode as Partial<GenerateVisualizationParams>).pipelineMode;
            await dispatchWithHandlers(noMode, handlers);
            assert.deepEqual(calls, ['balanced_v7']);
        },
    },
    {
        name: 'dispatcher aliases balanced_v6 to balanced_v5 handler',
        run: async () => {
            const calls: string[] = [];
            const mkHandler = (name: PipelineMode) => async () => {
                calls.push(name);
                return { image: 'x', debug: { name } };
            };
            const handlers = {
                baseline_original: mkHandler('baseline_original'),
                balanced_v1: mkHandler('balanced_v1'),
                balanced_v2: mkHandler('balanced_v2'),
                balanced_v2_1: mkHandler('balanced_v2_1'),
                balanced_v2_2: mkHandler('balanced_v2_2'),
                balanced_v3_0: mkHandler('balanced_v3_0'),
                balanced_v4_0: mkHandler('balanced_v4_0'),
                balanced_v4_1: mkHandler('balanced_v4_1'),
                balanced_v5: mkHandler('balanced_v5'),
                balanced_v6: mkHandler('balanced_v6'),
                balanced_v7: mkHandler('balanced_v7'),
                improved_current: mkHandler('improved_current'),
            };
            await dispatchWithHandlers({ ...baseRequest, pipelineMode: 'balanced_v6' }, handlers);
            assert.deepEqual(calls, ['balanced_v5']);
        },
    },
    {
        name: 'historical benchmark modes remain callable in dispatcher',
        run: async () => {
            const called: string[] = [];
            const mkHandler = (name: PipelineMode) => async () => {
                called.push(name);
                return { image: 'x', debug: { name } };
            };
            const handlers = {
                baseline_original: mkHandler('baseline_original'),
                balanced_v1: mkHandler('balanced_v1'),
                balanced_v2: mkHandler('balanced_v2'),
                balanced_v2_1: mkHandler('balanced_v2_1'),
                balanced_v2_2: mkHandler('balanced_v2_2'),
                balanced_v3_0: mkHandler('balanced_v3_0'),
                balanced_v4_0: mkHandler('balanced_v4_0'),
                balanced_v4_1: mkHandler('balanced_v4_1'),
                balanced_v5: mkHandler('balanced_v5'),
                balanced_v6: mkHandler('balanced_v6'),
                balanced_v7: mkHandler('balanced_v7'),
                improved_current: mkHandler('improved_current'),
            };
            await dispatchWithHandlers({ ...baseRequest, pipelineMode: 'baseline_original' }, handlers);
            await dispatchWithHandlers({ ...baseRequest, pipelineMode: 'balanced_v4_0' }, handlers);
            await dispatchWithHandlers({ ...baseRequest, pipelineMode: 'balanced_v5' }, handlers);
            await dispatchWithHandlers({ ...baseRequest, pipelineMode: 'improved_current' }, handlers);
            assert.deepEqual(called, ['baseline_original', 'balanced_v4_0', 'balanced_v5', 'improved_current']);
        },
    },
    {
        name: 'canonical parts preserve expected ordering',
        run: () => {
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
            assert.match(textParts[0], /^\[BASE ROOM IMAGE\]/);
            assert.equal(textParts[1], 'AGT');
            assert.equal(textParts[2], 'HIERARCHY');
            assert.equal(textParts[3], 'STRUCT');
            assert.equal(textParts[4], 'STYLE');
            assert.equal(textParts[5], 'CONFLICT');
            assert.equal(textParts[6], 'INFLUENCE');
            assert.equal(textParts[7], 'AGT_ECHO');
            assert.match(textParts[8], /^\[BASE ROOM IMAGE .*RE-ANCHOR\]/);
        },
    },
    {
        name: 'V7 hierarchy inserts AGT line only with hard facts',
        run: () => {
            const withoutHardFacts = buildConstraintHierarchyBlock(0, false, false);
            const withHardFacts = buildConstraintHierarchyBlock(0, false, true);
            assert.equal(withoutHardFacts.includes('Verified hard facts from the structural assessment above'), false);
            assert.equal(withHardFacts.includes('Verified hard facts from the structural assessment above'), true);
        },
    },
];

let passed = 0;
for (const check of checks) {
    await check.run();
    passed += 1;
    console.log(`PASS ${check.name}`);
}

console.log(`\nContract checks passed: ${passed}/${checks.length}`);

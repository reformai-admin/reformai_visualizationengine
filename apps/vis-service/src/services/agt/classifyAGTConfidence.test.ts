import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyAGTConfidence } from './classifyAGTConfidence.js';
import type { ArchitecturalGroundTruth } from '../../types.js';

const baseAGT: ArchitecturalGroundTruth = {
    window_count: { value: 2, confidence: 'high', instances: [] },
    door_count: { value: 1, confidence: 'high', instances: [] },
    has_ceiling_fixture: { value: true, confidence: 'high' },
    has_built_in_niches: { value: false, confidence: 'medium' },
    camera_perspective: { value: 'corner', confidence: 'medium' },
    extraction_confidence_overall: 'high',
    uncertain_fields: [],
};

test('downgrades high-confidence counts to advisory when instances are missing', () => {
    const result = classifyAGTConfidence(baseAGT);
    assert.equal(result.window_count.enforcement, 'advisory');
    assert.equal(result.door_count.enforcement, 'advisory');
});

test('keeps high-confidence window count as hard when instances match count', () => {
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
});

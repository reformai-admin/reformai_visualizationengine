import test from 'node:test';
import assert from 'node:assert/strict';
import type { ClassifiedAGT } from '../../../shared/types/agt.js';
import { AGT_ECHO_BLOCK_VERSION, buildAGTEchoBlock } from '../agt-echo.js';

const suppressedAGT: ClassifiedAGT = {
    window_count: { enforcement: 'suppressed', displayValue: '0' },
    door_count: { enforcement: 'suppressed', displayValue: '0' },
    has_ceiling_fixture: { enforcement: 'suppressed', displayValue: 'ABSENT' },
    has_built_in_niches: { enforcement: 'suppressed', displayValue: 'ABSENT' },
    camera_perspective: { enforcement: 'suppressed', displayValue: 'unknown' },
    hard_fact_fields: [],
    advisory_fields: [],
    suppressed_fields: ['window_count', 'door_count', 'has_ceiling_fixture', 'has_built_in_niches', 'camera_perspective'],
    confidence_distribution: { high: 0, medium: 0, low: 5 },
};

const hardWindowAGT: ClassifiedAGT = {
    window_count: { enforcement: 'hard', displayValue: '2', spatialAnchors: ['left wall (external_glazed)', 'rear wall (external_glazed)'] },
    door_count: { enforcement: 'suppressed', displayValue: '0' },
    has_ceiling_fixture: { enforcement: 'suppressed', displayValue: 'ABSENT' },
    has_built_in_niches: { enforcement: 'suppressed', displayValue: 'ABSENT' },
    camera_perspective: { enforcement: 'suppressed', displayValue: 'unknown' },
    hard_fact_fields: ['window_count'],
    advisory_fields: [],
    suppressed_fields: ['door_count', 'has_ceiling_fixture', 'has_built_in_niches', 'camera_perspective'],
    confidence_distribution: { high: 1, medium: 0, low: 4 },
};

test('agt echo inactive/active behavior and version', () => {
    assert.equal(buildAGTEchoBlock(suppressedAGT), '');

    const hard = buildAGTEchoBlock(hardWindowAGT);
    assert.ok(hard.length > 0);
    assert.match(hard, /FINAL ARCHITECTURAL VERIFICATION/);
    assert.match(hard, /EXACTLY 2/);
    assert.match(hard, /architectural compliance failure/);
    assert.match(AGT_ECHO_BLOCK_VERSION, /^agt-echo@.+/);
});





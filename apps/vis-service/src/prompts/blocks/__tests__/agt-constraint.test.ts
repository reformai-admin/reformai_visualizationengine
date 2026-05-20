import test from 'node:test';
import assert from 'node:assert/strict';
import type { ClassifiedAGT } from '../../../types/agt.js';
import {
    AGT_CONSTRAINT_BLOCK_VERSION,
    buildAGTConstraintBlock,
} from '../agt-constraint.js';

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

test('agt constraint fallback, hard facts, advisory, and version', () => {
    const suppressed = buildAGTConstraintBlock(suppressedAGT);
    assert.match(suppressed, /ARCHITECTURAL GROUND TRUTH/);
    assert.doesNotMatch(suppressed, /HARD FACTS/);
    assert.match(suppressed, /Architectural constraints are enforced through Phase 1 rules below/);

    const hard = buildAGTConstraintBlock(hardWindowAGT);
    assert.match(hard, /HARD FACTS/);
    assert.match(hard, /EXACTLY 2 windows/);
    assert.match(hard, /VISIBILITY CONTRACT/);
    assert.match(hard, /left wall/);

    const advisoryAGT: ClassifiedAGT = {
        ...suppressedAGT,
        window_count: { enforcement: 'advisory', displayValue: '2' },
        camera_perspective: { enforcement: 'advisory', displayValue: 'wide-angle' },
        advisory_fields: ['window_count', 'camera_perspective'],
        suppressed_fields: ['door_count', 'has_ceiling_fixture', 'has_built_in_niches'],
        confidence_distribution: { high: 0, medium: 2, low: 3 },
    };
    const advisory = buildAGTConstraintBlock(advisoryAGT);
    assert.match(advisory, /ADVISORY OBSERVATIONS/);
    assert.match(advisory, /Camera perspective/);

    assert.match(AGT_CONSTRAINT_BLOCK_VERSION, /^agt-constraint@.+/);
});

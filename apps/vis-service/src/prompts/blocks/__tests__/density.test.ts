import test from 'node:test';
import assert from 'node:assert/strict';
import {
    DENSITY_BLOCK_VERSION,
    getDensityBlockEntry,
    DENSITY_BLOCK_REGISTRY,
} from '../density.js';

test('density registry lookup behavior and version', () => {
    const low = getDensityBlockEntry('low');
    const medium = getDensityBlockEntry('medium');
    const high = getDensityBlockEntry('high');
    const unknown = getDensityBlockEntry('unknown');

    assert.equal(low?.label, 'SPARSE');
    assert.equal(medium?.label, 'BALANCED');
    assert.equal(high?.label, 'LAYERED');
    assert.equal(unknown, null);

    assert.match(DENSITY_BLOCK_REGISTRY.low.block, /negative space/);
    assert.match(DENSITY_BLOCK_REGISTRY.high.block, /Rich/);
    assert.match(DENSITY_BLOCK_VERSION, /^density@.+/);
});

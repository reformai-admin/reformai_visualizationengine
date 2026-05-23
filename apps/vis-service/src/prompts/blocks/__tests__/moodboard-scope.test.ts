import test from 'node:test';
import assert from 'node:assert/strict';
import {
    MOODBOARD_SCOPE_BLOCK_VERSION,
    buildMoodboardScopeBlock,
} from '../moodboard-scope.js';

test('moodboard scope handles density tiers and version', () => {
    const low = buildMoodboardScopeBlock('Coastal', 'low');
    const medium = buildMoodboardScopeBlock('Coastal', 'medium');
    const high = buildMoodboardScopeBlock('Coastal', 'high');

    assert.ok(low.length > 0);
    assert.ok(medium.length > 0);
    assert.ok(high.length > 0);

    assert.match(low, /restraint/);
    assert.match(high, /richness/);
    assert.doesNotMatch(medium, /restraint|richness/);

    [low, medium, high].forEach(output => {
        assert.match(output, /MOODBOARD SCOPE/);
        assert.match(output, /Extract only abstract tone/);
    });

    assert.match(MOODBOARD_SCOPE_BLOCK_VERSION, /^moodboard-scope@.+/);
});





import test from 'node:test';
import assert from 'node:assert/strict';
import type { ResolvedRenovationSelections } from '../../../types/catalogue.js';
import {
    RENOVATION_ANCHORS_BLOCK_VERSION,
    buildRenovationAnchorsBlock,
} from '../renovation-anchors.js';

test('renovation anchors inactive and active behavior with version', () => {
    assert.equal(buildRenovationAnchorsBlock({}), '');

    const single: ResolvedRenovationSelections = { flooring: 'Warm white oak plank' };
    const one = buildRenovationAnchorsBlock(single);
    assert.match(one, /FLOORING/);
    assert.match(one, /TIER 2B/);
    assert.match(one, /Warm white oak plank/);

    const multi: ResolvedRenovationSelections = {
        flooring: 'Warm white oak plank',
        walls: 'Matte limewash plaster',
    };
    const two = buildRenovationAnchorsBlock(multi);
    assert.match(two, /2 anchors/);
    assert.match(two, /COMPLIANCE: ALL active anchors below must be applied/);
    assert.match(two, /VISIBILITY GATE/);
    assert.match(two, /ANCHOR SELF-CHECK/);
    assert.match(two, /Non-negotiable/);
    assert.match(RENOVATION_ANCHORS_BLOCK_VERSION, /^renovation-anchors@.+/);
});

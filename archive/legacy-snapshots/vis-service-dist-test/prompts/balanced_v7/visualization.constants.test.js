import test from 'node:test';
import assert from 'node:assert/strict';
import { buildConstraintHierarchyBlock } from './visualization.constants.js';
test('V7 hierarchy includes AGT hard-fact line only when hard facts exist', () => {
    const withoutHardFacts = buildConstraintHierarchyBlock(0, false, false);
    const withHardFacts = buildConstraintHierarchyBlock(0, false, true);
    assert.equal(withoutHardFacts.includes('Verified hard facts from the structural assessment above'), false);
    assert.equal(withHardFacts.includes('Verified hard facts from the structural assessment above'), true);
});
//# sourceMappingURL=visualization.constants.test.js.map
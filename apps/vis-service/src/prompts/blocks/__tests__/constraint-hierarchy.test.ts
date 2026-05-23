import test from 'node:test';
import assert from 'node:assert/strict';
import {
    CONSTRAINT_HIERARCHY_BLOCK_VERSION,
    buildConstraintHierarchyBlock,
} from '../constraint-hierarchy.js';

test('constraint hierarchy toggles active/inactive tiers and keeps core tiers', () => {
    const none = buildConstraintHierarchyBlock(0, false);
    assert.match(none, /TIER 2 .*INJECTED ITEM CONSTRAINTS \[INACTIVE/);
    assert.match(none, /TIER 2B .*RENOVATION MATERIAL ANCHORS \[INACTIVE/);

    const withInjected = buildConstraintHierarchyBlock(1, false);
    assert.match(withInjected, /TIER 2 .*INJECTED ITEM CONSTRAINTS \[ACTIVE/);

    const withRenovation = buildConstraintHierarchyBlock(0, true);
    assert.match(withRenovation, /TIER 2B .*RENOVATION MATERIAL ANCHORS \[ACTIVE/);

    assert.match(none, /TIER 1 .*ARCHITECTURAL CONSTRAINTS/);
    assert.match(none, /TIER 4 .*STYLE TRANSFORMATION/);
    assert.match(CONSTRAINT_HIERARCHY_BLOCK_VERSION, /^constraint-hierarchy@.+/);
});





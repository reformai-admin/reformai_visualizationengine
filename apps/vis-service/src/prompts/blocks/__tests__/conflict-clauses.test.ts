import test from 'node:test';
import assert from 'node:assert/strict';
import {
    CONFLICT_CLAUSES_BLOCK_VERSION,
    buildConflictClausesBlock,
} from '../conflict-clauses.js';

test('conflict clauses inactive/active behavior and version', () => {
    assert.equal(buildConflictClausesBlock(undefined), '');
    assert.equal(buildConflictClausesBlock([]), '');

    const single = buildConflictClausesBlock(['Preserve glazing geometry; express coastal feel through textiles only.']);
    assert.match(single, /STYLE-ARCHITECTURE CONFLICT RESOLUTION/);
    assert.match(single, /Preserve glazing geometry/);
    assert.match(single, /1\./);

    const multi = buildConflictClausesBlock([
        'Clause one.',
        'Clause two.',
    ]);
    assert.match(multi, /2\./);
    assert.match(CONFLICT_CLAUSES_BLOCK_VERSION, /^conflict-clauses@.+/);
});

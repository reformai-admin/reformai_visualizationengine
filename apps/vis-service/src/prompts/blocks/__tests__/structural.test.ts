import test from 'node:test';
import assert from 'node:assert/strict';
import { STRUCTURAL_BLOCK_VERSION, STRUCTURAL_BLOCK } from '../structural.js';

test('structural block content and version', () => {
    assert.ok(STRUCTURAL_BLOCK.trim().length > 0);
    assert.match(STRUCTURAL_BLOCK, /PHASE 1: ARCHITECTURAL ANCHORING/);
    assert.match(STRUCTURAL_BLOCK, /WINDOW PRESERVATION/);
    assert.match(STRUCTURAL_BLOCK, /EXTERIOR VIEW PRESERVATION/);
    assert.match(STRUCTURAL_BLOCK_VERSION, /^structural@.+/);
});





import test from 'node:test';
import assert from 'node:assert/strict';
import {
    INFLUENCE_BLOCK_VERSION,
    INFLUENCE_PRESET_STYLE_ONLY,
    DEFAULT_USER_REQUEST,
    V5_MOODBOARD_INFLUENCE_STATEMENT,
} from '../influence.js';

test('influence constants and version', () => {
    assert.ok(INFLUENCE_PRESET_STYLE_ONLY.length > 0);
    assert.equal(DEFAULT_USER_REQUEST, 'No specific requests.');
    assert.match(V5_MOODBOARD_INFLUENCE_STATEMENT, /STYLE ANCHOR REMINDER/);
    assert.match(V5_MOODBOARD_INFLUENCE_STATEMENT, /moodboard/i);
    assert.match(INFLUENCE_BLOCK_VERSION, /^influence@.+/);
});

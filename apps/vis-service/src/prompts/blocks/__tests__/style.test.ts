import test from 'node:test';
import assert from 'node:assert/strict';
import { STYLE_BLOCK_VERSION, STYLE_TEMPLATE } from '../style.js';

test('style template placeholders and version', () => {
    assert.match(STYLE_TEMPLATE, /{{STYLE_NAME}}/);
    assert.match(STYLE_TEMPLATE, /{{STAGING_DENSITY_BLOCK}}/);
    assert.match(STYLE_TEMPLATE, /PHASE 2: STYLE TRANSFORMATION/);
    assert.match(STYLE_BLOCK_VERSION, /^style@.+/);
});





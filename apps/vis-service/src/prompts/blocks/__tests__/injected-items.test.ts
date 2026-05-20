import test from 'node:test';
import assert from 'node:assert/strict';
import {
    INJECTED_ITEMS_BLOCK_VERSION,
    INJECTED_ITEM_BLOCK_HEADER,
    INJECTED_ITEM_AUDIT_TEXT,
} from '../injected-items.js';

test('injected item constants and version', () => {
    assert.match(INJECTED_ITEM_BLOCK_HEADER, /INJECTED ITEM/);
    assert.match(INJECTED_ITEM_BLOCK_HEADER, /IDENTITY PRESERVATION/);
    assert.match(INJECTED_ITEM_BLOCK_HEADER, /PRESERVE/);
    assert.match(INJECTED_ITEM_BLOCK_HEADER, /NEVER/);
    assert.match(INJECTED_ITEM_AUDIT_TEXT, /Injected Item Identity/);
    assert.match(INJECTED_ITEM_AUDIT_TEXT, /Tier 2/);
    assert.match(INJECTED_ITEMS_BLOCK_VERSION, /^injected-items@.+/);
});

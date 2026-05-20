import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveHandlerMode, resolvePipelineMode } from './routing.js';

test('defaults to balanced_v7 when pipeline mode is omitted', () => {
    assert.equal(resolvePipelineMode(undefined), 'balanced_v7');
});

test('balanced_v6 alias routes to balanced_v5 handler', () => {
    assert.equal(resolveHandlerMode('balanced_v6'), 'balanced_v5');
});

test('balanced_v7 resolves to balanced_v7 handler', () => {
    assert.equal(resolveHandlerMode('balanced_v7'), 'balanced_v7');
});

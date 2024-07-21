import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { statOrNull } from './statOrNull.ts';

test('Directory', async () => {
  const input = new URL('.', import.meta.url);
  const stats = await statOrNull(input);
  assert.equal(stats?.isDirectory(), true);
});

test('File', async () => {
  const input = new URL(import.meta.url);
  const stats = await statOrNull(input);
  assert.equal(stats?.isFile(), true);
});

test('Non-existent', async () => {
  const input = new URL('non-existent', import.meta.url);
  const stats = await statOrNull(input);
  assert.equal(stats, null);
});

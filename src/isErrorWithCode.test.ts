import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { isErrorWithCode } from './isErrorWithCode.ts';

test('Pure Error', () => {
  const input = new Error('foo');
  assert.equal(isErrorWithCode(input), false);
});

test('Error with code', () => {
  const input = Object.assign(new Error('foo'), { code: 'ErrorCode' });
  assert.equal(isErrorWithCode(input), true);
});

test('Object with code', () => {
  const input = { code: 'ENOENT' };
  assert.equal(isErrorWithCode(input), false);
});

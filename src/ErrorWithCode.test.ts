import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { ErrorWithCode } from './ErrorWithCode.ts';

test('get code', () => {
  const error = new ErrorWithCode('CODE', 'message');
  assert.equal(error.code, 'CODE');
  assert.equal(error.message, 'CODE: message');
});

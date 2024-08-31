import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { listItems } from './listItems.ts';

test('number', () => {
  const input = 1;
  const actual = [...listItems(input)];
  assert.deepEqual(actual, [1]);
});

test('Array<number>', () => {
  const input = [1];
  const actual = [...listItems(input)];
  assert.deepEqual(actual, [1]);
});

test('Array<Array<number>>', () => {
  const input = [[1]];
  const actual = [...listItems(input)];
  assert.deepEqual(actual, [[1]]);
});

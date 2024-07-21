import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { pathLikeToFileUrl } from './pathLikeToFileUrl.ts';

test('absolute path', () => {
  const input = '/a';
  const baseDir = '/base';
  const actual = pathLikeToFileUrl(input, baseDir);
  const expected = new URL('file:///a');
  assert.equal(actual.href, expected.href);
});

test('relative path', () => {
  const input = 'a/b';
  const baseDir = '/base';
  const actual = pathLikeToFileUrl(input, baseDir);
  const expected = new URL('file:///base/a/b');
  assert.equal(actual.href, expected.href);
});

test('absolute path (buffer)', () => {
  const input = Buffer.from('/a');
  const baseDir = '/base';
  const actual = pathLikeToFileUrl(input, baseDir);
  const expected = new URL('file:///a');
  assert.equal(actual.href, expected.href);
});

test('relative path (buffer)', () => {
  const input = Buffer.from('a/b');
  const baseDir = '/base';
  const actual = pathLikeToFileUrl(input, baseDir);
  const expected = new URL('file:///base/a/b');
  assert.equal(actual.href, expected.href);
});

test('url', () => {
  const input = new URL('file:///a');
  const baseDir = '/base';
  const actual = pathLikeToFileUrl(input, baseDir);
  const expected = input;
  assert.equal(actual, expected);
});

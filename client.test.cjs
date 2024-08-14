/* eslint-disable import/unambiguous */
/* eslint-disable import/no-commonjs */
//@ts-check
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { middleware } = require('./lib/middleware.js');

test('middleware', () => {
  assert.equal(typeof middleware, 'function');
});

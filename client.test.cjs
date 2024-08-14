/* eslint-disable import/unambiguous */
/* eslint-disable import/no-commonjs */
//@ts-check
const assert = require('assert');
const { middleware } = require('./lib/middleware.js');

assert.equal(typeof middleware, 'function');

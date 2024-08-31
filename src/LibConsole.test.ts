import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { LibConsole, LogLevel } from './LibConsole.ts';
import { Logger } from './Logger.test.ts';

test('debug', () => {
  const stdout = new Logger();
  const stderr = new Logger();
  const console = new LibConsole({ logLevel: LogLevel.debug, stdout, stderr });
  console.debug('a1', 'a2');
  console.info('b1', 'b2');
  console.error('c1', 'c2');
  assert.equal(stdout.getOutput(), 'a1 a2\nb1 b2\n');
  assert.equal(stderr.getOutput(), 'c1 c2\n');
});

test('info', () => {
  const stdout = new Logger();
  const stderr = new Logger();
  const console = new LibConsole({ logLevel: LogLevel.info, stdout, stderr });
  console.debug('a1', 'a2');
  console.info('b1', 'b2');
  console.error('c1', 'c2');
  assert.equal(stdout.getOutput(), 'b1 b2\n');
  assert.equal(stderr.getOutput(), 'c1 c2\n');
});

test('error', () => {
  const stdout = new Logger();
  const stderr = new Logger();
  const console = new LibConsole({ logLevel: LogLevel.error, stdout, stderr });
  console.debug('a1', 'a2');
  console.info('b1', 'b2');
  console.error('c1', 'c2');
  assert.equal(stdout.getOutput(), '');
  assert.equal(stderr.getOutput(), 'c1 c2\n');
});

test('silent', () => {
  const stdout = new Logger();
  const stderr = new Logger();
  const console = new LibConsole({ logLevel: LogLevel.silent, stdout, stderr });
  console.debug('a1', 'a2');
  console.info('b1', 'b2');
  console.error('c1', 'c2');
  assert.equal(stdout.getOutput(), '');
  assert.equal(stderr.getOutput(), '');
});

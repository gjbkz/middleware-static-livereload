import * as assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import { test } from 'node:test';
import { Logger } from './Logger.test.ts';
import { SnippetInjector } from './SnippetInjector.ts';

test('insert before <title>', async () => {
  const source = '123<title>Test</title>456';
  const snippet = '<script id="snippet"></script>';
  const expected = '123<script id="snippet"></script><title>Test</title>456';
  const injector = new SnippetInjector(
    { insertBefore: '<title', insertAfter: [], encoding: 'utf8' },
    Buffer.from(snippet),
  );
  const r = new PassThrough();
  const actual = await r
    .pipe(injector)
    .pipe(new Logger())
    .waitUntilFinish(() => r.end(Buffer.from(source)));
  assert.equal(actual, expected);
});

test('insert after </title>', async () => {
  const source = '123<title>Test</title>456';
  const snippet = '<script id="snippet"></script>';
  const expected = '123<title>Test</title><script id="snippet"></script>456';
  const injector = new SnippetInjector(
    { insertBefore: [], insertAfter: /<\/title[^>]*>/, encoding: 'utf8' },
    Buffer.from(snippet),
  );
  const r = new PassThrough();
  const actual = await r
    .pipe(injector)
    .pipe(new Logger())
    .waitUntilFinish(() => r.end(Buffer.from(source)));
  assert.equal(actual, expected);
});

test('insertBefore takes precedence over insertAfter', async () => {
  const source = '123<title>Test</title>456';
  const snippet = '<script id="snippet"></script>';
  const expected = '123<script id="snippet"></script><title>Test</title>456';
  const injector = new SnippetInjector(
    { insertBefore: '<title', insertAfter: /<\/title[^>]*>/, encoding: 'utf8' },
    Buffer.from(snippet),
  );
  const r = new PassThrough();
  const actual = await r
    .pipe(injector)
    .pipe(new Logger())
    .waitUntilFinish(() => r.end(Buffer.from(source)));
  assert.equal(actual, expected);
});

test('insert only once', async () => {
  const source = '1<title>2</title>3<title>4</title>5';
  const snippet = '<script id="snippet"></script>';
  const expected =
    '1<script id="snippet"></script><title>2</title>3<title>4</title>5';
  const injector = new SnippetInjector(
    { insertBefore: '<title', insertAfter: /<\/title[^>]*>/, encoding: 'utf8' },
    Buffer.from(snippet),
  );
  const r = new PassThrough();
  const actual = await r
    .pipe(injector)
    .pipe(new Logger())
    .waitUntilFinish(() => r.end(Buffer.from(source)));
  assert.equal(actual, expected);
});

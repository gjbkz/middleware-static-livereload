import * as assert from 'node:assert/strict';
import { mkdir, mkdtemp, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { isErrorWithCode } from './isErrorWithCode.ts';
import { createServer, listenServerSentEvents } from './server.test.ts';

const listLinks = (html: string) => {
  const links: Array<[string | undefined, string | undefined]> = [];
  for (const match of html.matchAll(/<a[^>]*?href="([^"]+)"[^>]*?>([^<]+)</g)) {
    links.push([match[1], match[2]]);
  }
  return links;
};

test('/ 200', async (ctx) => {
  const rootDir = await mkdtemp(tmpdir());
  const url = await createServer(ctx, { documentRoot: [rootDir], watch: null });
  const res = await fetch(url);
  assert.equal(res.status, 200);
});

test('/ content-type', async (ctx) => {
  const rootDir = await mkdtemp(tmpdir());
  const url = await createServer(ctx, { documentRoot: [rootDir], watch: null });
  const res = await fetch(url);
  assert.equal(res.status, 200);
});

test('/ index', async (ctx) => {
  const rootDir = await mkdtemp(tmpdir());
  const url = await createServer(ctx, { documentRoot: [rootDir], watch: null });
  const res1 = await fetch(url);
  assert.deepEqual(listLinks(await res1.text()), []);
  await writeFile(join(rootDir, 'foo'), '');
  const res2 = await fetch(url);
  assert.deepEqual(listLinks(await res2.text()), [['./foo', 'foo']]);
});

test('/ index (encoded)', async (ctx) => {
  const rootDir = await mkdtemp(tmpdir());
  const url = await createServer(ctx, { documentRoot: [rootDir], watch: null });
  await writeFile(join(rootDir, 'あ'), '');
  const res = await fetch(url);
  assert.deepEqual(listLinks(await res.text()), [
    [`./${encodeURIComponent('あ')}`, 'あ'],
  ]);
});

test('/ index (sanitized)', async (ctx) => {
  const rootDir = await mkdtemp(tmpdir());
  const url = await createServer(ctx, { documentRoot: [rootDir], watch: null });
  try {
    await writeFile(join(rootDir, 'あ>あ'), '');
  } catch (error) {
    if (isErrorWithCode(error) && error.code === 'ENOENT') {
      // Windows does not allow creating a file with '>' in the name.
      ctx.skip();
      return;
    }
    throw error;
  }
  const res = await fetch(url);
  assert.deepEqual(listLinks(await res.text()), [
    [`./${encodeURIComponent('あ>あ')}`, 'あ&gt;あ'],
  ]);
});

test('/dir index', async (ctx) => {
  const rootDir = await mkdtemp(tmpdir());
  const url = await createServer(ctx, { documentRoot: [rootDir], watch: null });
  const dir = join(rootDir, 'dir');
  await mkdir(dir, { recursive: true });
  const body = `${Date.now()}`;
  await writeFile(join(dir, 'あ-あ'), body);
  const res = await fetch(new URL('./dir', url));
  assert.deepEqual(listLinks(await res.text()), [
    ['..', '..'],
    [`./${encodeURIComponent('あ-あ')}`, 'あ-あ'],
  ]);
});

test('/dir file', async (ctx) => {
  const rootDir = await mkdtemp(tmpdir());
  const url = await createServer(ctx, { documentRoot: [rootDir], watch: null });
  const dir = join(rootDir, 'dir');
  await mkdir(dir, { recursive: true });
  const body = `${Date.now()}`;
  const filePath = join(dir, 'あ-あ');
  await writeFile(filePath, body);
  const res = await fetch(new URL('./dir/あ-あ', url));
  assert.equal(await res.text(), body);
});

test('respond the client script', async (ctx) => {
  const rootDir = await mkdtemp(tmpdir());
  const scriptPath = 'client.js';
  const url = await createServer(ctx, { documentRoot: [rootDir], scriptPath });
  const res = await fetch(new URL(`/${scriptPath}`, url));
  const contentType = res.headers.get('content-type');
  assert.equal(typeof contentType, 'string');
  assert.ok(contentType?.startsWith('text/javascript'));
});

test('server sent event: connect', async (ctx) => {
  const rootDir = await mkdtemp(tmpdir());
  const filePath = join(rootDir, 'file.txt');
  await writeFile(filePath, `${Date.now()}`);
  const scriptPath = 'client.js';
  const url = await createServer(ctx, { documentRoot: [rootDir], scriptPath });
  const sseEndpoint = new URL(`/${scriptPath}/connect`, url);
  const sse = await listenServerSentEvents(sseEndpoint);
  const sseData = await sse.next();
  assert.deepEqual(sseData, {
    done: false,
    value: ['', '#0'],
  });
  sse.abort();
});

test('server sent event: watch only requested files', async (ctx) => {
  const rootDir = await mkdtemp(tmpdir());
  const dir = join(rootDir, 'dir');
  await mkdir(dir, { recursive: true });
  const file1 = join(dir, 'file1.txt');
  await writeFile(file1, `${Date.now()}`);
  const file2 = join(dir, 'file2.txt');
  await writeFile(file2, `${Date.now()}`);
  const scriptPath = 'client.js';
  const url = await createServer(ctx, { documentRoot: [rootDir], scriptPath });
  await fetch(new URL('/dir/file2.txt', url));
  const sseEndpoint = new URL(`/${scriptPath}/connect`, url);
  const sse = await listenServerSentEvents(sseEndpoint);
  const sseData1 = await sse.next();
  assert.deepEqual(sseData1, {
    done: false,
    value: ['', '#1'],
  });
  await writeFile(file1, `${Date.now()}`);
  await writeFile(file2, `${Date.now()}`);
  const sseData2 = await sse.next();
  assert.deepEqual(sseData2, {
    done: false,
    value: ['change', 'dir/file2.txt'],
  });
  await unlink(file1);
  await unlink(file2);
  const sseData3 = await sse.next();
  assert.deepEqual(sseData3, {
    done: false,
    value: ['unlink', 'dir/file2.txt'],
  });
  sse.abort();
});

import * as assert from 'node:assert/strict';
import * as console from 'node:console';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import type { Server } from 'node:http';
import { createServer as httpCreateServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { SuiteContext } from 'node:test';
import { test } from 'node:test';
import connect from 'connect';
import type { MiddlewareOptions } from './middleware.ts';
import { middleware } from './middleware.ts';

const closeFunctions = new Set<() => Promise<unknown>>();

const closeServer = async (server: Server) =>
  await new Promise((resolve, reject) => {
    const onClose = (error?: Error) => {
      server.removeAllListeners();
      if (error) {
        reject(error);
      } else {
        resolve(null);
      }
    };
    if (server.listening) {
      server.closeAllConnections();
      server.close(onClose);
    } else {
      onClose();
    }
  });

const createServer = async (
  ctx: SuiteContext,
  options: Partial<MiddlewareOptions>,
): Promise<URL> => {
  const handler = middleware(options);
  closeFunctions.add(async () => await handler.close());
  const app = connect();
  app.use(handler);
  const server = httpCreateServer(app);
  closeFunctions.add(async () => await closeServer(server));
  const port = 3000;
  const hostname = 'localhost';
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.once('listening', resolve);
    server.listen(port, hostname);
  });
  console.info(`server is listening: ${ctx.name}`, server.address());
  const baseUrl = new URL(`http://${hostname}:${port}`);
  return baseUrl;
};

const listLinks = (html: string) => {
  const links: Array<[string | undefined, string | undefined]> = [];
  for (const match of html.matchAll(/<a[^>]*?href="([^"]+)"[^>]*?>([^<]+)</g)) {
    links.push([match[1], match[2]]);
  }
  return links;
};

const listenServerSentEvents = async (url: URL) => {
  const abc = new AbortController();
  const res = await fetch(url, {
    headers: { accept: 'text/event-stream' },
    signal: abc.signal,
  });
  const read = async () => {
    if (!res.body) {
      throw new Error('NoBody');
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    // Read the stream
    while (true) {
      const { done, value } = await reader.read().catch((error) => {
        if (
          abc.signal.aborted &&
          error instanceof DOMException &&
          error.name === 'AbortError'
        ) {
          return { done: true, value: undefined };
        }
        throw error;
      });
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
    }
    return buffer.trim();
  };
  const abort = () => abc.abort();
  return { abort, read };
};

test.afterEach(async () => {
  for (const close of closeFunctions) {
    await close();
  }
  closeFunctions.clear();
});

test('/ 200', async (ctx) => {
  const rootDir = await mkdtemp(join(tmpdir(), ctx.name));
  const url = await createServer(ctx, { documentRoot: [rootDir], watch: null });
  const res = await fetch(url);
  assert.equal(res.status, 200);
});

test('/ content-type', async (ctx) => {
  const rootDir = await mkdtemp(join(tmpdir(), ctx.name));
  const url = await createServer(ctx, { documentRoot: [rootDir], watch: null });
  const res = await fetch(url);
  assert.equal(res.status, 200);
});

test('/ index', async (ctx) => {
  const rootDir = await mkdtemp(join(tmpdir(), ctx.name));
  const url = await createServer(ctx, { documentRoot: [rootDir], watch: null });
  const res1 = await fetch(url);
  assert.deepEqual(listLinks(await res1.text()), []);
  await writeFile(join(rootDir, 'foo'), '');
  const res2 = await fetch(url);
  assert.deepEqual(listLinks(await res2.text()), [['./foo', 'foo']]);
});

test('/ index (encoded)', async (ctx) => {
  const rootDir = await mkdtemp(join(tmpdir(), ctx.name));
  const url = await createServer(ctx, { documentRoot: [rootDir], watch: null });
  await writeFile(join(rootDir, 'あ'), '');
  const res = await fetch(url);
  assert.deepEqual(listLinks(await res.text()), [
    [`./${encodeURIComponent('あ')}`, 'あ'],
  ]);
});

test('/ index (sanitized)', async (ctx) => {
  const rootDir = await mkdtemp(join(tmpdir(), ctx.name));
  const url = await createServer(ctx, { documentRoot: [rootDir], watch: null });
  await writeFile(join(rootDir, 'あ>あ'), '');
  const res = await fetch(url);
  assert.deepEqual(listLinks(await res.text()), [
    [`./${encodeURIComponent('あ>あ')}`, 'あ&gt;あ'],
  ]);
});

test('/dir index', async (ctx) => {
  const rootDir = await mkdtemp(join(tmpdir(), ctx.name));
  const url = await createServer(ctx, { documentRoot: [rootDir], watch: null });
  const dir = join(rootDir, 'dir');
  await mkdir(dir);
  const body = `${Date.now()}`;
  await writeFile(join(dir, 'あ>あ'), body);
  const res = await fetch(new URL('./dir', url));
  assert.deepEqual(listLinks(await res.text()), [
    ['..', '..'],
    [`./${encodeURIComponent('あ>あ')}`, 'あ&gt;あ'],
  ]);
});

test('/dir file', async (ctx) => {
  const rootDir = await mkdtemp(join(tmpdir(), ctx.name));
  const url = await createServer(ctx, { documentRoot: [rootDir], watch: null });
  const dir = join(rootDir, 'dir');
  await mkdir(dir);
  const body = `${Date.now()}`;
  const filePath = join(dir, 'あ>あ');
  await writeFile(filePath, body);
  const res = await fetch(new URL('./dir/あ>あ', url));
  assert.equal(await res.text(), body);
});

test('sse:connect', async (ctx) => {
  const rootDir = await mkdtemp(join(tmpdir(), ctx.name));
  const filePath = join(rootDir, 'あ>あ');
  await writeFile(filePath, `${Date.now()}`);
  const scriptPath = 'client.js';
  const url = await createServer(ctx, { documentRoot: [rootDir], scriptPath });
  const sseEndpoint = new URL(`/${scriptPath}/connect`, url);
  const sse = await listenServerSentEvents(sseEndpoint);
  setTimeout(() => sse.abort());
  const sseData = await sse.read();
  assert.equal(sseData, ['retry: 3000', 'data: #0'].join('\n'));
});

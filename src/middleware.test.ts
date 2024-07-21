import * as assert from 'node:assert/strict';
import * as console from 'node:console';
import { mkdtemp, writeFile } from 'node:fs/promises';
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

test.afterEach(async () => {
  for (const close of closeFunctions) {
    await close();
  }
  closeFunctions.clear();
});

test('root 200', async (ctx) => {
  const dir = await mkdtemp(join(tmpdir(), ctx.name));
  const url = await createServer(ctx, { documentRoot: [dir], watch: null });
  const res = await fetch(url);
  assert.equal(res.status, 200);
});

test('root content-type', async (ctx) => {
  const dir = await mkdtemp(join(tmpdir(), ctx.name));
  const url = await createServer(ctx, { documentRoot: [dir], watch: null });
  const res = await fetch(url);
  assert.equal(res.status, 200);
});

test('root html', async (ctx) => {
  const dir = await mkdtemp(join(tmpdir(), ctx.name));
  const url = await createServer(ctx, { documentRoot: [dir], watch: null });
  const res1 = await fetch(url);
  assert.deepEqual(listLinks(await res1.text()), []);
  await writeFile(join(dir, 'foo'), '');
  const res2 = await fetch(url);
  assert.deepEqual(listLinks(await res2.text()), [['./foo', 'foo']]);
});

test('root html (encoded)', async (ctx) => {
  const dir = await mkdtemp(join(tmpdir(), ctx.name));
  const url = await createServer(ctx, { documentRoot: [dir], watch: null });
  await writeFile(join(dir, 'あ'), '');
  const res = await fetch(url);
  assert.deepEqual(listLinks(await res.text()), [
    [`./${encodeURIComponent('あ')}`, 'あ'],
  ]);
});

test('root html (sanitized)', async (ctx) => {
  const dir = await mkdtemp(join(tmpdir(), ctx.name));
  const url = await createServer(ctx, { documentRoot: [dir], watch: null });
  await writeFile(join(dir, 'あ>あ'), '');
  const res = await fetch(url);
  assert.deepEqual(listLinks(await res.text()), [
    [`./${encodeURIComponent('あ>あ')}`, 'あ&gt;あ'],
  ]);
});

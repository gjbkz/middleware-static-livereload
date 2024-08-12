import * as assert from 'node:assert/strict';
import EventEmitter from 'node:events';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import type { DOMWindow } from 'jsdom';
import { JSDOM } from 'jsdom';
import { createServer, listenServerSentEvents } from './server.test.ts';

const getEventSourceShim = (baseUrl: URL) => {
  const activeListeners = new Set<{ abort: () => void }>();
  return class EventSourceShim extends EventEmitter {
    public static abort() {
      for (const listener of activeListeners) {
        listener.abort();
      }
      activeListeners.clear();
    }

    public constructor(url: string) {
      super();
      listenServerSentEvents(new URL(url, baseUrl))
        .then(async (sse) => {
          activeListeners.add(sse);
          await this.start(sse);
        })
        .catch((error) => this.onError(error));
    }

    public addEventListener(
      type: string,
      listener: (event: MessageEvent) => void,
    ) {
      this.on(type, listener);
    }

    private async start(sse: AsyncGenerator<[string, string]>) {
      for await (const [event, data] of sse) {
        if (event) {
          this.emit(event, { data });
        }
      }
    }

    private onError(error: unknown) {
      this.emit('error', error);
    }
  };
};

const testBackgroundColor = async (
  window: DOMWindow,
  expectedColor: string,
  timeoutMs = 3000,
) => {
  await new Promise<void>((resolve, reject) => {
    const startedAt = Date.now();
    const check = () => {
      let color = window.getComputedStyle(window.document.body).backgroundColor;
      color = color.replace(/\s/g, '');
      if (color === expectedColor) {
        resolve();
      } else if (Date.now() - startedAt < timeoutMs) {
        setTimeout(check, 100);
      } else {
        reject(new Error('timeout'));
      }
    };
    check();
  });
};

test('update stylesheet', async (ctx) => {
  const rootDir = await mkdtemp(tmpdir());
  const pageFilePath = join(rootDir, 'page.html');
  await writeFile(
    pageFilePath,
    [
      '<!doctype html>',
      '<title>test:clientScript</title>',
      '<link rel="stylesheet" href="./style.css">',
    ].join('\n'),
  );
  const cssFilePath = join(rootDir, 'style.css');
  await writeFile(cssFilePath, 'body { background-color: rgb(128,0,0);}');
  const url = await createServer(ctx, { documentRoot: [rootDir] });
  const pageRes = await fetch(new URL('/page.html', url));
  const pageHtml = await pageRes.text();
  const page = new JSDOM(pageHtml, {
    url: url.href,
    resources: 'usable',
    runScripts: 'dangerously',
  });
  const EventSourceShim = getEventSourceShim(url);
  page.window['EventSource'] = EventSourceShim;
  const { window } = page;
  const { document } = window;
  assert.equal(document.title, 'test:clientScript');
  await new Promise((resolve) => {
    document.addEventListener('load', resolve);
  });
  await testBackgroundColor(window, 'rgb(128,0,0)');
  await writeFile(cssFilePath, 'body { background-color: rgb(0,128,0);}');
  await testBackgroundColor(window, 'rgb(0,128,0)');
  EventSourceShim.abort();
  await url.close();
});

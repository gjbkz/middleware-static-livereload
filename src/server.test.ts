import * as console from 'node:console';
import type { Server } from 'node:http';
import { createServer as httpCreateServer } from 'node:http';
import type { SuiteContext } from 'node:test';
import { test } from 'node:test';
import connect from 'connect';
import { isErrorWithCode } from './isErrorWithCode.ts';
import { LogLevel } from './LibConsole.ts';
import type { MiddlewareOptions } from './middleware.ts';
import { middleware } from './middleware.ts';

const closeFunctions = new Set<() => Promise<unknown>>();

test.afterEach(async () => {
  for (const close of closeFunctions) {
    await close();
  }
  closeFunctions.clear();
});

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

export const createServer = async (
  ctx: SuiteContext,
  options: Partial<MiddlewareOptions>,
): Promise<URL & { close: () => Promise<unknown> }> => {
  const handler = middleware({ ...options, logLevel: LogLevel.debug });
  closeFunctions.add(async () => await handler.close());
  const app = connect();
  app.use(handler);
  const server = httpCreateServer(app);
  const close = async () => await closeServer(server);
  closeFunctions.add(close);
  let port = 3000;
  const hostname = 'localhost';
  await new Promise((resolve, reject) => {
    server.once('error', (error) => {
      if (isErrorWithCode(error) && error.code === 'EADDRINUSE') {
        server.listen(++port, hostname);
      } else {
        reject(error);
      }
    });
    server.once('listening', resolve);
    server.listen(port, hostname);
  });
  console.info(`server is listening: ${ctx.name}`, server.address());
  const baseUrl = new URL(`http://${hostname}:${port}`);
  return Object.assign(baseUrl, { close });
};

const readResponseBody = async function* (res: Response) {
  if (!res.body) {
    throw new Error('NoBody');
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  while (true) {
    const { done, value } = await reader.read().catch((error) => {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { done: true, value: undefined };
      }
      throw error;
    });
    if (done) {
      break;
    }
    yield decoder.decode(value, { stream: true });
  }
  yield decoder.decode();
};

const readServerSentEvents = async function* (
  src: AsyncGenerator<string>,
): AsyncGenerator<[string, string]> {
  let buffer = '';
  for await (const chunk of src) {
    const events = `${buffer}${chunk}`.split('\r\n\r\n');
    buffer = events.pop() ?? '';
    for await (const block of events) {
      const data: Array<string> = [];
      let name = '';
      for (const [, head, body] of block.matchAll(/^(\w+): ?(.*)/gm)) {
        if (head === 'event') {
          name = body ?? '';
        } else if (head === 'data') {
          data.push(body ?? '');
        }
      }
      yield [name, data.join('\n')];
    }
  }
};

export const listenServerSentEvents = async (url: URL) => {
  const abc = new AbortController();
  const abort = () => abc.abort();
  const res = await fetch(url, {
    headers: { accept: 'text/event-stream' },
    signal: abc.signal,
  });
  const events = readServerSentEvents(readResponseBody(res));
  const next = async () => await events.next();
  const notImplemented = (name: string) => () => {
    throw new Error(`NotImplemented: ${name}`);
  };
  const returnFn = async (): Promise<IteratorReturnResult<void>> => {
    return await Promise.resolve({ done: true, value: undefined });
  };
  const sse: AsyncGenerator<[string, string]> = {
    next,
    return: returnFn,
    throw: notImplemented('throw'),
    [Symbol.asyncIterator]: () => ({
      next,
      return: returnFn,
      throw: notImplemented('throw'),
      [Symbol.asyncIterator]: notImplemented('Symbol.asyncIterator'),
    }),
  };
  return Object.assign(sse, { abort });
};

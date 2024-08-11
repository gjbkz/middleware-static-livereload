import type { IncomingMessage, ServerResponse } from 'http';
import { ErrorWithCode } from './ErrorWithCode.ts';
import type { ConsoleLike } from './LibConsole.ts';
import { splitString } from './splitString.ts';

export class ConnectionHandler {
  private eventId = 0;

  private readonly connections = new Set<ServerResponse>();

  private readonly keepaliveTimer?: ReturnType<typeof setInterval>;

  private readonly console: ConsoleLike;

  public constructor(
    console: ConsoleLike = globalThis.console,
    keepaliveIntervalMs = 8000,
  ) {
    this.console = console;
    if (0 < keepaliveIntervalMs) {
      this.keepaliveTimer = setInterval(() => {
        for (const connection of this.connections) {
          connection.write(': keepalive\n');
        }
      }, keepaliveIntervalMs);
    }
  }

  public close() {
    clearInterval(this.keepaliveTimer);
    for (const connection of this.connections) {
      connection.end();
    }
  }

  public handle(req: IncomingMessage, res: ServerResponse) {
    if (req.headers.accept === 'text/event-stream') {
      const id = this.eventId++;
      this.connections.add(res);
      res.statusCode = 200;
      res.setHeader('content-type', 'text/event-stream');
      res.once('close', () => {
        this.connections.delete(res);
        this.console.info(`disconnected: #${id}`);
      });
      res.write(`retry: 3000\ndata: #${id}\n\n`);
      this.console.info(`connected: #${id} ${req.headers['user-agent']}`);
    } else {
      const message = `Invaild event-stream request: ${req.headers.accept}`;
      res.statusCode = 400;
      this.console.error(message);
      res.end(message);
      throw new ErrorWithCode('BadRequest', message);
    }
  }

  public broadcast(data: string, eventName?: string) {
    for (const chunk of this.serializeEvent(data, eventName)) {
      this.console.debug(chunk);
      for (const connection of this.connections) {
        connection.write(chunk);
      }
    }
  }

  private *serializeEvent(data: string, eventName?: string): Generator<string> {
    yield `id: ${this.eventId++}\n`;
    if (eventName) {
      yield `event: ${eventName}\n`;
    }
    for (const line of splitString(data.trim(), /\r\n|\r|\n/g)) {
      yield `data: ${line}\n`;
    }
    yield '\n';
  }
}

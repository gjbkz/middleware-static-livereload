import * as console from 'node:console';
import type { Writable } from 'node:stream';
import * as util from 'node:util';

export const LogLevel = {
  debug: 0,
  info: 1,
  error: 2,
  silent: 3,
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

type WriterFn = (...args: Array<unknown>) => void;

export interface ConsoleLike {
  debug: WriterFn;
  info: WriterFn;
  error: WriterFn;
}

const createWriter =
  (stream: Writable, inspectOptions?: util.InspectOptions): WriterFn =>
  (...args) => {
    const message = args
      .map((v) =>
        (typeof v === 'string' ? v : util.inspect(v, inspectOptions)).trim(),
      )
      .join(' ');
    if (stream.writable) {
      stream.write(`${message}\n`);
    } else {
      console.warn(`console is not writable: ${message}`);
    }
  };

export class LibConsole implements ConsoleLike {
  private logLevel: LogLevel;

  private readonly out: WriterFn;

  private readonly err: WriterFn;

  public readonly stdout: Writable;

  public readonly stderr: Writable;

  public constructor({
    logLevel,
    stdout,
    stderr,
    inspectOptions,
  }: {
    logLevel: LogLevel;
    stdout: Writable;
    stderr: Writable;
    inspectOptions?: util.InspectOptions;
  }) {
    this.logLevel = logLevel;
    this.stdout = stdout;
    this.stderr = stderr;
    this.out = createWriter(stdout, inspectOptions);
    this.err = createWriter(stderr, inspectOptions);
  }

  public getLogLevel(): LogLevel {
    return this.logLevel;
  }

  public setLogLevel(logLevel: LogLevel): void {
    this.logLevel = logLevel;
  }

  public debug(...args: Array<unknown>): void {
    if (this.logLevel <= LogLevel.debug) {
      this.out(...args);
    }
  }

  public info(...args: Array<unknown>): void {
    if (this.logLevel <= LogLevel.info) {
      this.out(...args);
    }
  }

  public error(...args: Array<unknown>): void {
    if (this.logLevel <= LogLevel.error) {
      this.err(...args);
    }
  }
}

import type { TransformCallback } from 'stream';
import { Transform } from 'stream';
import { StringDecoder } from 'string_decoder';
import { listItems } from './listItems.ts';

export type BufferEncoding = Exclude<
  Parameters<typeof Buffer.from>[1],
  undefined
>;

type MatchPattern = RegExp | string;

interface SnippetInjectorConstructorProps {
  insertBefore: Array<MatchPattern> | MatchPattern;
  insertAfter: Array<MatchPattern> | MatchPattern;
  encoding: BufferEncoding;
}

const findInsertPos = (
  input: string,
  patterns: Array<MatchPattern>,
  insertAfter: boolean,
): number => {
  let pos = -1;
  for (const pattern of patterns) {
    if (typeof pattern === 'string') {
      pos = input.indexOf(pattern);
      if (0 <= pos) {
        if (insertAfter) {
          pos += pattern.length;
        }
        break;
      }
    } else {
      const matched = pattern.exec(input);
      if (matched) {
        pos = matched.index;
        if (insertAfter) {
          pos += matched[0].length;
        }
        break;
      }
    }
  }
  return pos;
};

export class SnippetInjector extends Transform {
  private readonly insertBefore: Array<RegExp | string>;
  private readonly insertAfter: Array<RegExp | string>;
  private readonly snippet: Buffer;
  private done = false;
  public readonly decoder: StringDecoder;

  public constructor(
    { insertBefore, insertAfter, encoding }: SnippetInjectorConstructorProps,
    snippet: Buffer | string,
  ) {
    super();
    this.snippet = Buffer.isBuffer(snippet) ? snippet : Buffer.from(snippet);
    this.insertBefore = [...listItems(insertBefore)];
    this.insertAfter = [...listItems(insertAfter)];
    this.decoder = new StringDecoder(encoding);
  }

  public get snippetByteLength() {
    return this.snippet.byteLength;
  }

  public override _transform(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: TransformCallback,
  ) {
    this.push(this.insert(this.decoder.write(chunk)));
    callback();
  }

  public override _flush(callback: TransformCallback) {
    this.push(this.insert(this.decoder.end()));
    callback();
  }

  private insert(input: string): string {
    if (!this.done && input) {
      const pos = this.findInsertPos(input);
      if (0 <= pos) {
        this.done = true;
        return `${input.slice(0, pos)}${this.snippet}${input.slice(pos)}`;
      }
    }
    return input;
  }

  private findInsertPos(input: string): number {
    let pos = findInsertPos(input, this.insertBefore, false);
    if (pos < 0) {
      pos = findInsertPos(input, this.insertAfter, true);
    }
    return pos;
  }
}

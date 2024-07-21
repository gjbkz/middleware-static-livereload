import * as stream from 'stream';
import { StringDecoder } from 'string_decoder';
import { listItems } from './listItems.ts';

export type BufferEncoding = Exclude<
  Parameters<typeof Buffer.from>[1],
  undefined
>;

interface SnippetInjectorConstructorProps {
  insertBefore: Array<RegExp | string> | RegExp | string;
  insertAfter: Array<RegExp | string> | RegExp | string;
  encoding: BufferEncoding;
}

export class SnippetInjector extends stream.Transform {
  private readonly insertBefore: Array<RegExp | string>;
  private readonly insertAfter: Array<RegExp | string>;
  private readonly injectee: Buffer;
  private done = false;
  public readonly decoder: StringDecoder;

  public constructor(
    { insertBefore, insertAfter, encoding }: SnippetInjectorConstructorProps,
    injectee: Buffer | string,
  ) {
    super();
    this.injectee = Buffer.isBuffer(injectee)
      ? injectee
      : Buffer.from(injectee);
    this.insertBefore = [...listItems(insertBefore)];
    this.insertAfter = [...listItems(insertAfter)];
    this.decoder = new StringDecoder(encoding);
  }

  public get snippetByteLength() {
    return this.injectee.byteLength;
  }

  public override _transform(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: stream.TransformCallback,
  ) {
    this.push(this.insert(this.decoder.write(chunk)));
    callback();
  }

  public override _flush(callback: stream.TransformCallback) {
    this.push(this.insert(this.decoder.end()));
    callback();
  }

  private insert(input: string): string {
    if (input && !this.done) {
      for (const pattern of this.insertBefore) {
        const result = input.replace(pattern, `${this.injectee}$&`);
        if (result !== input) {
          this.done = true;
          return result;
        }
      }
      for (const pattern of this.insertAfter) {
        const result = input.replace(pattern, `$&${this.injectee}`);
        if (result !== input) {
          this.done = true;
          return result;
        }
      }
    }
    return input;
  }
}

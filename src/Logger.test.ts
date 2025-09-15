import { Writable } from "node:stream";

export class Logger extends Writable {
	public chunks: Array<Buffer> = [];

	public override _write(chunk: Buffer, _: string, callback: () => void) {
		this.chunks.push(chunk);
		callback();
	}

	public getOutput(): string {
		return Buffer.concat(this.chunks).toString();
	}

	public async waitUntilFinish(fn?: () => void) {
		return await new Promise((resolve, reject) => {
			this.once("error", reject);
			this.once("finish", () => resolve(this.getOutput()));
			if (fn) {
				fn();
			}
		});
	}
}

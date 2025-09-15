import type { PathLike } from "node:fs";
import { createReadStream } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { extname, sep as pathSep, relative } from "node:path";
import type { Readable, Writable } from "node:stream";
import { fileURLToPath, pathToFileURL, URL } from "node:url";
import type { InspectOptions } from "node:util";
import type { ChokidarOptions, FSWatcher } from "chokidar";
import { ConnectionHandler } from "./ConnectionHandler.ts";
import { clientScript } from "./clientScript.ts";
import { createFileWatcher } from "./createFileWatcher.ts";
import { FileFinder } from "./FileFinder.ts";
import { isErrorWithCode } from "./isErrorWithCode.ts";
import { LibConsole, LogLevel } from "./LibConsole.ts";
import { SnippetInjector } from "./SnippetInjector.ts";

export { LogLevel };

export interface MiddlewareOptions {
	/**
	 * Directories which contains the files to be served.
	 * If it is an array, it is processed as following pseudo code:
	 *   FOREACH documentRoot in the array
	 *     IF documentRoot has a file at requestedPath
	 *       RETURN the file
	 *   RETURN 404
	 */
	documentRoot: Array<PathLike> | PathLike;
	/**
	 * The base directory where the middleware resolves the documentRoot.
	 */
	baseDir: string;
	/**
	 * If it is `false` or `null`, the middleware doesn't watch files.
	 * Otherwise, the middleware watches the served files and send events
	 * to connected clients when they are updated.
	 * If you need to do something with the watcher outside this middleware,
	 * you can pass the watcher object itself.
	 */
	watch: FSWatcher | ChokidarOptions | boolean | null;
	/**
	 * If this value is `foo.txt`, the middleware respond `/foo.txt` to `GET /`,
	 * `/foo/foo.txt` to `GET /foo/`.
	 */
	index: string;
	/**
	 * A map from Content-Type to an array of file extensions.
	 * If you given a map, it extends the default map.
	 */
	contentTypes: Record<string, Array<string>>;
	/**
	 * 0: debug, 1: info, 2: error, 3: silent
	 */
	logLevel: LogLevel;
	/**
	 * Streams where the middleware writes message to.
	 */
	stdout: Writable;
	/**
	 * Streams where the middleware writes message to.
	 */
	stderr: Writable;
	/**
	 * A pattern or patterns to detect the position before which a <script> tag
	 * is inserted.
	 * If this value is `x` and the document is `abc x def`, then the actual
	 * response will be `abc <script src="..."></script>x def`.
	 */
	insertBefore: Array<RegExp | string> | RegExp | string;
	/**
	 * A pattern or patterns to detect the position after which a <script> tag
	 * is inserted.
	 * If this value is `x` and the document is `abc x def`, then the actual
	 * response will be `abc x<script src="..."></script> def`.
	 */
	insertAfter: Array<RegExp | string> | RegExp | string;
	/**
	 * A pathname for the script enables live reloading.
	 * If the default value conflicts with other middlewares, change this value.
	 */
	scriptPath: string;
	encoding: BufferEncoding;
	inspectOptions: InspectOptions;
}

const defaultOptions: MiddlewareOptions = {
	documentRoot: process.cwd(),
	baseDir: process.cwd(),
	watch: { ignoreInitial: false },
	index: "index.html",
	contentTypes: {
		"image/png": [".png"],
		"image/jpeg": [".jpg", ".jpeg"],
		"image/svg+xml": [".svg"],
		"image/tiff": [".tiff"],
		"image/heif": [".heif"],
		"image/heic": [".heic"],
		"text/javascript; charset=UTF-8": [".js"],
		"text/css": [".css"],
		"font/otf": [".otf"],
		"font/ttf": [".ttf"],
		"font/woff": [".woff"],
		"font/woff2": [".woff2"],
		"text/html; charset=UTF-8": [".html", ".htm"],
		"text/plain; charset=UTF-8": [".txt", ".log"],
		"application/json": [".json"],
		"image/vnd.microsoft.icon": [".ico"],
	},
	logLevel: LogLevel.info,
	stdout: process.stdout,
	stderr: process.stderr,
	insertBefore: [
		/<\/head/i,
		/<\/body/i,
		/<meta/i,
		/<title/i,
		/<script/i,
		/<link/i,
	],
	insertAfter: [/<!doctype\s*html\s*>/i],
	scriptPath: "middleware-static-livereload.js",
	encoding: "utf-8",
	inspectOptions: { colors: true, breakLength: 40 },
};

export class MiddlewareStaticLivereload {
	private readonly idStore: WeakMap<IncomingMessage | ServerResponse, string>;

	private requestCount: number;

	private readonly options: Readonly<MiddlewareOptions>;

	private readonly console: LibConsole;

	private readonly clientScriptPath: string;

	private readonly fileFinder: FileFinder;

	private readonly connectionHandler: ConnectionHandler;

	private readonly contentTypes: Map<string, string>;

	public readonly fileWatcher: FSWatcher | null;

	public constructor(options: MiddlewareOptions) {
		this.idStore = new WeakMap();
		this.requestCount = 0;
		this.options = options;
		this.console = new LibConsole(options);
		this.contentTypes = new Map();
		for (const [type, extensions] of Object.entries(options.contentTypes)) {
			for (const extension of extensions) {
				this.contentTypes.set(extension, type);
			}
		}
		this.clientScriptPath = `/${options.scriptPath}`.replace(/^\/+/, "/");
		this.fileFinder = new FileFinder(options, {
			[this.clientScriptPath]: clientScript,
		});
		this.connectionHandler = new ConnectionHandler(this.console);
		this.fileWatcher = createFileWatcher(options.watch);
		if (this.fileWatcher) {
			this.fileWatcher.on("all", this.onFileEvent.bind(this));
		}
	}

	public get middleware() {
		return (req: IncomingMessage, res: ServerResponse) => {
			const requestId = `#${this.requestCount++}`;
			this.idStore.set(req, requestId);
			this.idStore.set(res, requestId);
			this.console.info(
				`${requestId} ← ${req.method} ${decodeURIComponent(`${req.url}`)}`,
			);
			this.handleRequest(req, res)
				.catch((error) => {
					this.console.error(error);
					if (!res.writableEnded) {
						if (!res.headersSent) {
							const errorCode = isErrorWithCode(error) && error.code;
							res.statusCode = errorCode === "ENOENT" ? 404 : 500;
						}
						res.end(`${error || "Error"}`);
					}
				})
				.finally(() => {
					const headers = { ...res.getHeaders() };
					this.console.debug(requestId, "→", res.statusCode, headers);
				});
		};
	}

	public async close() {
		this.connectionHandler.close();
		if (this.fileWatcher) {
			await this.fileWatcher.close();
		}
	}

	private findDocumentRoot(fileUrl: URL): URL | null {
		for (const documentRoot of this.fileFinder.documentRoots) {
			if (fileUrl.pathname.startsWith(documentRoot.pathname)) {
				return documentRoot;
			}
		}
		return null;
	}

	private onFileEvent(eventName: string, file: string) {
		this.console.debug(`${eventName}: ${file}`);
		const documentRoot = this.findDocumentRoot(pathToFileURL(file));
		if (documentRoot) {
			this.connectionHandler.broadcast(
				relative(fileURLToPath(documentRoot), file).split(pathSep).join("/"),
				eventName,
			);
		} else {
			this.console.error(new Error("Cannot find any documentRoot"));
		}
	}

	private getContentType(pathname: string): string | null {
		return this.contentTypes.get(extname(pathname)) ?? null;
	}

	public getId(item: IncomingMessage | ServerResponse): string {
		return this.idStore.get(item) ?? "#unknown";
	}

	private async handleRequest(req: IncomingMessage, res: ServerResponse) {
		const url = new URL(req.url ?? "/", "http://localhost");
		if (url.pathname === `${this.clientScriptPath}/connect`) {
			this.connectionHandler.handle(req, res);
		} else {
			await this.respondFile(res, url);
		}
	}

	private get snippet() {
		return `<script id="middleware-static-livereload" src="${this.clientScriptPath}" defer></script>`;
	}

	private async respondFile(res: ServerResponse, url: URL) {
		const file = await this.fileFinder.findFile(url.pathname);
		if (this.fileWatcher && this.findDocumentRoot(file.fileUrl) !== null) {
			this.fileWatcher.add(fileURLToPath(file.fileUrl));
		}
		this.console.debug(this.getId(res), "→", fileURLToPath(file.fileUrl));
		const contentType = this.getContentType(file.fileUrl.pathname);
		if (contentType) {
			res.setHeader("content-type", contentType);
		}
		let reader: Readable = createReadStream(file.fileUrl);
		let contentLength = file.stats.size;
		if (contentType?.startsWith("text/html")) {
			const injector = new SnippetInjector(this.options, this.snippet);
			reader = reader.pipe(injector);
			contentLength += injector.snippetByteLength;
		}
		res.setHeader("content-length", contentLength);
		await new Promise((resolve, reject) => {
			res.statusCode = 200;
			reader.pipe(res).once("error", reject).once("finish", resolve);
		});
	}
}

export const middleware = (options: Partial<MiddlewareOptions> = {}) => {
	const msl = new MiddlewareStaticLivereload({ ...defaultOptions, ...options });
	const { fileWatcher } = msl;
	const close = msl.close.bind(msl);
	return Object.assign(msl.middleware, { close, fileWatcher });
};

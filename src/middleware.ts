import type { PathLike } from "node:fs";
import { createReadStream } from "node:fs";
import { unlink, writeFile } from "node:fs/promises";
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
import type { FileOperationsConfig } from "./generateIndexPageHtml.ts";
import { isErrorWithCode } from "./isErrorWithCode.ts";
import { LibConsole, LogLevel } from "./LibConsole.ts";
import { SnippetInjector } from "./SnippetInjector.ts";
import { statOrNull } from "./statOrNull.ts";

export { LogLevel };

export interface MiddlewareOptions {
	/**
	 * Directories that contain files to be served.
	 * If it is an array, it is processed according to the following pseudocode:
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
	 * Otherwise, the middleware watches served files and sends events
	 * to connected clients when they are updated.
	 * If you need to do something with the watcher outside this middleware,
	 * you can pass the watcher object itself.
	 */
	watch: FSWatcher | ChokidarOptions | boolean | null;
	/**
	 * If this value is `foo.txt`, the middleware responds `/foo.txt` to `GET /`,
	 * `/foo/foo.txt` to `GET /foo/`.
	 */
	index: string;
	/**
	 * A map from Content-Type to an array of file extensions.
	 * If you provide a map, it replaces the default map.
	 */
	contentTypes: Record<string, Array<string>>;
	/**
	 * 0: debug, 1: info, 2: error, 3: silent
	 */
	logLevel: LogLevel;
	/**
	 * Streams where the middleware writes messages to.
	 */
	stdout: Writable;
	/**
	 * Streams where the middleware writes messages to.
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
	 * The pathname of the script that enables live reloading.
	 * If the default value conflicts with other middlewares, change this value.
	 */
	scriptPath: string;
	encoding: BufferEncoding;
	inspectOptions: InspectOptions;
	/**
	 * Enables file operations (upload/delete) on directory listing pages.
	 * - `false` or omitted: disabled (default)
	 * - `true`: all operations enabled
	 * - object: enable individual operations
	 */
	fileOperations?:
		| boolean
		| {
				allowUpload?: boolean;
				allowDelete?: boolean;
				allowTextUpload?: boolean;
		  };
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
	fileOperations: false,
};

const normalizeFileOperations = (
	opt: MiddlewareOptions["fileOperations"],
): FileOperationsConfig => {
	if (!opt) {
		return { allowUpload: false, allowDelete: false, allowTextUpload: false };
	}
	if (opt === true) {
		return { allowUpload: true, allowDelete: true, allowTextUpload: true };
	}
	return {
		allowUpload: opt.allowUpload ?? false,
		allowDelete: opt.allowDelete ?? false,
		allowTextUpload: opt.allowTextUpload ?? false,
	};
};

const isValidFileName = (name: string): boolean =>
	name.length > 0 &&
	name !== "." &&
	name !== ".." &&
	!name.includes("/") &&
	!name.includes("\\");

const readBody = (req: IncomingMessage): Promise<Buffer> =>
	new Promise((resolve, reject) => {
		const chunks: Array<Buffer> = [];
		req.on("data", (chunk: Buffer) => chunks.push(chunk));
		req.on("end", () => resolve(Buffer.concat(chunks)));
		req.on("error", reject);
	});

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
		this.fileFinder = new FileFinder(
			{
				...options,
				fileOperations: normalizeFileOperations(options.fileOperations),
			},
			{ [this.clientScriptPath]: clientScript },
		);
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
		} else if (req.method === "POST" && url.searchParams.has("_mslAction")) {
			await this.handleFileOperation(req, res, url);
		} else {
			await this.respondFile(res, url);
		}
	}

	private async findWritableDir(pathname: string): Promise<URL | null> {
		const decoded = decodeURIComponent(pathname);
		for (const documentRoot of this.fileFinder.documentRoots) {
			const dirUrl = new URL(decoded.slice(1), documentRoot);
			const s = await statOrNull(dirUrl);
			if (s?.isDirectory()) {
				return dirUrl;
			}
		}
		return null;
	}

	private async handleFileOperation(
		req: IncomingMessage,
		res: ServerResponse,
		url: URL,
	) {
		const ops = normalizeFileOperations(this.options.fileOperations);
		const action = url.searchParams.get("_mslAction");
		if (action === "upload") {
			if (!ops.allowUpload && !ops.allowTextUpload) {
				res.statusCode = 404;
				res.end("Not Found");
				return;
			}
			await this.handleUpload(req, res, url);
		} else if (action === "delete") {
			if (!ops.allowDelete) {
				res.statusCode = 404;
				res.end("Not Found");
				return;
			}
			await this.handleDelete(req, res, url);
		} else {
			res.statusCode = 404;
			res.end("Not Found");
		}
	}

	private async handleUpload(
		req: IncomingMessage,
		res: ServerResponse,
		url: URL,
	) {
		const rawName = url.searchParams.get("name") ?? "";
		if (!isValidFileName(rawName)) {
			this.console.info(`upload validation error name=${rawName} 400`);
			res.statusCode = 400;
			res.end("Bad Request: invalid filename");
			return;
		}
		const dirUrl = await this.findWritableDir(url.pathname);
		if (!dirUrl) {
			res.statusCode = 404;
			res.end("Not Found");
			return;
		}
		const body = await readBody(req);
		if (body.length === 0) {
			this.console.info(`upload validation error empty body 400`);
			res.statusCode = 400;
			res.end("Bad Request: empty body");
			return;
		}
		const fileUrl = new URL(rawName, dirUrl);
		if (await statOrNull(fileUrl)) {
			this.console.info(`upload conflict ${url.pathname}${rawName} 409`);
			res.statusCode = 409;
			res.end("Conflict: file already exists");
			return;
		}
		await writeFile(fileUrl, body);
		this.console.info(`upload success ${url.pathname}${rawName} 200`);
		res.statusCode = 200;
		res.end("OK");
	}

	private async handleDelete(
		req: IncomingMessage,
		res: ServerResponse,
		url: URL,
	) {
		const body = await readBody(req);
		const params = new URLSearchParams(body.toString("utf-8"));
		const rawName = params.get("name") ?? "";
		if (!isValidFileName(rawName)) {
			this.console.info(`delete validation error name=${rawName} 400`);
			res.statusCode = 400;
			res.end("Bad Request: invalid filename");
			return;
		}
		const dirUrl = await this.findWritableDir(url.pathname);
		if (!dirUrl) {
			res.statusCode = 404;
			res.end("Not Found");
			return;
		}
		const fileUrl = new URL(rawName, dirUrl);
		const s = await statOrNull(fileUrl);
		if (!s) {
			this.console.info(`delete not found ${url.pathname}${rawName} 404`);
			res.statusCode = 404;
			res.end("Not Found: file not found");
			return;
		}
		if (s.isDirectory()) {
			this.console.info(`delete validation error is directory ${rawName} 400`);
			res.statusCode = 400;
			res.end("Bad Request: cannot delete directory");
			return;
		}
		await unlink(fileUrl);
		this.console.info(`delete success ${url.pathname}${rawName} 303`);
		res.setHeader("location", url.pathname);
		res.statusCode = 303;
		res.end();
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

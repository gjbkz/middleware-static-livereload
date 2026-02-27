import type { PathLike, Stats } from "node:fs";
import { mkdtempSync, writeFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ErrorWithCode } from "./ErrorWithCode.ts";
import type { FileOperationsConfig } from "./generateIndexPageHtml.ts";
import { generateIndexPageHtml } from "./generateIndexPageHtml.ts";
import { listItems } from "./listItems.ts";
import { pathLikeToFileUrl } from "./pathLikeToFileUrl.ts";
import { statOrNull } from "./statOrNull.ts";
import { toDirUrl } from "./toDirUrl.ts";

interface FileFinderResult {
	fileUrl: URL;
	stats: Stats;
	relativePath: string;
}

interface FileFinderConstructorOptions {
	baseDir: string;
	documentRoot: Array<PathLike> | PathLike;
	index: string;
	fileOperations?: FileOperationsConfig;
}

export class FileFinder {
	private readonly tempDir: URL;

	private readonly indexFileBaseName: string;

	public readonly documentRoots: ReadonlyArray<URL>;

	private readonly reservedPaths: Readonly<Record<string, URL | undefined>> =
		{};

	private readonly fileOperations: FileOperationsConfig | undefined;

	public constructor(
		{
			baseDir,
			documentRoot,
			index,
			fileOperations,
		}: FileFinderConstructorOptions,
		reserved: Record<string, Buffer | URL | undefined> = {},
	) {
		this.tempDir = toDirUrl(
			pathToFileURL(
				mkdtempSync(join(tmpdir(), "middleware-static-livereload")),
			),
		);
		this.indexFileBaseName = index;
		const documentRoots = [];
		for (const item of listItems(documentRoot)) {
			documentRoots.push(toDirUrl(pathLikeToFileUrl(item, baseDir)));
		}
		this.documentRoots = documentRoots;
		const reservedPaths: Record<string, URL> = {};
		for (const [key, value] of Object.entries(reserved)) {
			if (Buffer.isBuffer(value)) {
				const dest = new URL(key.replace(/^\//, "./"), this.tempDir);
				writeFileSync(dest, value);
				reservedPaths[key] = dest;
			} else if (value && "href" in value) {
				reservedPaths[key] = value;
			}
		}
		this.reservedPaths = reservedPaths;
		this.fileOperations = fileOperations;
	}

	public async findFile(pathname: string): Promise<FileFinderResult> {
		const relativePath = decodeURIComponent(pathname);
		const reservedFileUrl = this.reservedPaths[pathname] ?? null;
		if (reservedFileUrl) {
			const stats = await statOrNull(reservedFileUrl);
			if (stats) {
				return { fileUrl: reservedFileUrl, relativePath, stats };
			}
		}
		for (const documentRoot of this.documentRoots) {
			const result = await this.findFileInDir(documentRoot, relativePath);
			if (result) {
				return result;
			}
		}
		throw new ErrorWithCode("ENOENT", relativePath);
	}

	private async findFileInDir(
		dirUrl: URL,
		relativePath: string,
	): Promise<FileFinderResult | null> {
		const fileUrl = new URL(relativePath.slice(1), dirUrl);
		const stats = await statOrNull(fileUrl);
		if (stats) {
			if (stats.isFile()) {
				return { fileUrl, stats, relativePath };
			} else if (stats.isDirectory()) {
				return await this.findOrCreateIndexFile(fileUrl, relativePath);
			}
		}
		return null;
	}

	private async findOrCreateIndexFile(
		dirUrl: URL,
		relativeDirPath: string,
	): Promise<FileFinderResult> {
		let fileUrl = new URL(this.indexFileBaseName, dirUrl);
		let stats = await statOrNull(fileUrl);
		let relativePath = relativeDirPath;
		if (stats?.isFile()) {
			relativePath = [
				relativePath.replace(/\/$/, ""),
				this.indexFileBaseName.replace(/^\//, ""),
			].join("/");
		} else {
			fileUrl = await this.generateIndexPageFile(dirUrl, relativeDirPath);
			stats = await statOrNull(fileUrl);
		}
		if (!stats) {
			throw new ErrorWithCode(
				"EINDEX",
				`Failed to create index file for ${relativeDirPath}`,
			);
		}
		return { stats, fileUrl, relativePath };
	}

	private async generateIndexPageFile(
		dirUrl: URL,
		relativePath: string,
	): Promise<URL> {
		const dest = new URL(
			`${relativePath.slice(1)}${this.indexFileBaseName}`,
			this.tempDir,
		);
		await mkdir(new URL(".", dest), { recursive: true });
		await writeFile(
			dest,
			await generateIndexPageHtml(dirUrl, relativePath, this.fileOperations),
		);
		return dest;
	}
}

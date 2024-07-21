import type { PathLike, Stats } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ErrorWithCode } from './ErrorWithCode.ts';
import { generateIndexPageHtml } from './generateIndexPageHtml.ts';
import { listItems } from './listItems.ts';
import { pathLikeToFileUrl } from './pathLikeToFileUrl.ts';
import { statOrNull } from './statOrNull.ts';
import { toDirUrl } from './toDirUrl.ts';

interface FileFinderResult {
  fileUrl: URL;
  stats: Stats;
  relativePath: string;
}

interface FileFinderConstructorOptions {
  baseDir: string;
  documentRoot: Array<PathLike> | PathLike;
  index: string;
}

export class FileFinder {
  private readonly tempDir: URL;

  private readonly indexFileBaseName: string;

  private readonly documentRootList: ReadonlyArray<URL>;

  private readonly reservedPaths: Readonly<Record<string, URL | undefined>> =
    {};

  public constructor(
    { baseDir, documentRoot, index }: FileFinderConstructorOptions,
    reservedPaths: Record<string, URL | undefined> = {},
  ) {
    this.tempDir = toDirUrl(
      pathToFileURL(
        mkdtempSync(join(tmpdir(), 'middleware-static-livereload')),
      ),
    );
    this.indexFileBaseName = index;
    const documentRootList = [];
    for (const item of listItems(documentRoot)) {
      documentRootList.push(toDirUrl(pathLikeToFileUrl(item, baseDir)));
    }
    this.documentRootList = documentRootList;
    this.reservedPaths = reservedPaths;
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
    for (const documentRoot of this.documentRootList) {
      const result = await this.findFileInDir(documentRoot, relativePath);
      if (result) {
        return result;
      }
    }
    throw new ErrorWithCode('ENOENT', relativePath);
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
      relativePath = join(relativePath, this.indexFileBaseName);
    } else {
      fileUrl = await this.generateIndexPageFile(dirUrl, relativeDirPath);
      stats = await statOrNull(fileUrl);
    }
    if (!stats) {
      throw new ErrorWithCode(
        'EINDEX',
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
    await mkdir(new URL('.', dest), { recursive: true });
    await writeFile(dest, await generateIndexPageHtml(dirUrl, relativePath));
    return dest;
  }

  public findDocumentRoot(fileUrl: URL): URL | null {
    for (const documentRoot of this.documentRootList) {
      if (fileUrl.pathname.startsWith(documentRoot.pathname)) {
        return documentRoot;
      }
    }
    return null;
  }
}

import * as assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { generateIndexPageHtml } from './generateIndexPageHtml.ts';
import { isErrorWithCode } from './isErrorWithCode.ts';

test('generateIndexPageHtml', async () => {
  const dir = await mkdtemp(join(tmpdir(), `${Date.now()}`));
  const file1 = 'fileあ.txt';
  await writeFile(join(dir, file1), file1);
  let file2: string | null = 'fileあ>.txt';
  try {
    await writeFile(join(dir, file2), file2);
  } catch (error) {
    if (isErrorWithCode(error) && error.code === 'ENOENT') {
      // Windows does not allow creating a file with '>' in the name.
      file2 = null;
    } else {
      throw error;
    }
  }
  const dir1 = 'dir1';
  await mkdir(join(dir, dir1));
  const dir1file1 = 'dir1file1.txt';
  await writeFile(join(dir, dir1, dir1file1), dir1file1);
  const actual = await generateIndexPageHtml(pathToFileURL(dir), 'foo');
  assert.ok(actual.includes('<a href="./file%E3%81%82.txt">fileあ.txt</a>'));
  if (file2) {
    assert.ok(
      actual.includes('<a href="./file%E3%81%82%3E.txt">fileあ&gt;.txt</a>'),
    );
  }
  assert.ok(actual.includes('<a href="./dir1/">dir1/</a>'));
  assert.ok(!actual.includes(dir1file1));
});

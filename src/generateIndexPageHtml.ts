import { readdir, stat } from 'node:fs/promises';
import { toDirUrl } from './toDirUrl.ts';

const css = `
:root {
  font-family: -apple-system, system-ui, Helvetica, Arial, sans-serif;
}
table {
  margin: 1rem auto;
  border-collapse: collapse;
}
.size {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
time {
  font-variant-numeric: tabular-nums;
}
td, th {
  padding: 0 1em;
  line-height: 1.5;
}
`.trim();

const sanitize = (s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;');

const generate = async function* (dirUrl: URL, relativePath: string) {
  dirUrl = toDirUrl(dirUrl);
  yield '<!doctype html>';
  yield '<meta charset="utf-8">';
  yield '<meta name="viewport" content="width=device-width">';
  yield `<title>Index of ${relativePath}</title>`;
  yield `<style>${css}</style>`;
  yield '<table>';
  yield '<tr><th>Name</th><th>Size</th><th>Last modified</th></tr>';
  if (relativePath !== '/') {
    yield '<tr><td><a href="..">..</a></td><td></td><td></td></tr>';
  }
  for (const name of await readdir(dirUrl)) {
    const filePath = new URL(name, dirUrl);
    const stats = await stat(filePath);
    const suffix = stats.isDirectory() ? '/' : '';
    yield '<tr>';
    const href = `./${encodeURIComponent(name)}${suffix}`;
    const hrefText = sanitize(`${name}${suffix}`);
    yield `  <td><a href="${href}">${hrefText}</a></td>`;
    yield `  <td class="size">${stats.size}</td>`;
    yield `  <td><time datetime="${stats.mtime.toISOString()}">${stats.mtime.toLocaleString()}</td>`;
    yield '</tr>';
  }
  yield `<tr><td colspan="3">Created at <time datetime="${new Date().toISOString()}">${new Date().toLocaleString()}</time></td></tr>`;
  yield '</table>';
};

export const generateIndexPageHtml = async (
  dirUrl: URL,
  relativePath: string,
): Promise<string> => {
  let html = '';
  for await (const line of generate(dirUrl, relativePath)) {
    html += `${line}\n`;
  }
  return html;
};

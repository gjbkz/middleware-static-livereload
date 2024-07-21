import * as fs from 'node:fs/promises';

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

/**
 * TODO: use template.html
 */
export const generateIndexHtml = async function* (
  dirUrl: URL,
  relativePath: string,
) {
  yield '<!doctype html>';
  yield '<meta charset="utf-8">';
  yield '<meta name="viewport" content="width=device-width">';
  yield `<title>Index of /${relativePath}</title>`;
  yield `<style>${css}</style>`;
  yield '<table>';
  yield '<tr><th>Name</th><th>Size</th><th>Last modified</th></tr>';
  yield '<tr><td><a href="..">..</a></td><td></td><td></td></tr>';
  for (const name of await fs.readdir(dirUrl)) {
    const filePath = new URL(name, dirUrl);
    const stats = await fs.stat(filePath);
    const isDirectory = stats.isDirectory();
    const href = `${name}${isDirectory ? '/' : ''}`;
    yield '<tr>';
    yield `  <td><a href="./${href}">${href}</a></td>`;
    yield `  <td class="size">${stats.size}</td>`;
    yield `  <td><time datetime="${stats.mtime.toISOString()}">${stats.mtime.toLocaleString()}</td>`;
    yield '</tr>';
  }
  yield `<tr><td colspan="3">Created at <time datetime="${new Date().toISOString()}">${new Date().toLocaleString()}</time></td></tr>`;
  yield '</table>';
};

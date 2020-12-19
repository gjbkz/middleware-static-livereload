import * as path from 'path';
import * as fs from 'fs';

const style = `
<style>
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
</style>
`.trim();

export const generateIndexHTML = async (
    absolutePath: string,
    relativePath: string,
): Promise<string> => [
    '<!doctype html>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width">',
    `<title>Index of /${relativePath}</title>`,
    style,
    '<table>',
    '<tr><th>Name</th><th>Size</th><th>Last modified</th></tr>',
    '<tr><td><a href="..">..</a></td><td></td><td></td></tr>',
    ...(await Promise.all(
        (await fs.promises.readdir(absolutePath)).map(async (name) => {
            const filePath = path.join(absolutePath, name);
            const stats = await fs.promises.stat(filePath);
            const isDirectory = stats.isDirectory();
            const href = `${name}${isDirectory ? '/' : ''}`;
            return [
                '<tr>',
                `<td><a href="./${href}">${href}</a></td>`,
                `<td class="size">${stats.size}</td>`,
                `<td><time datetime="${stats.mtime.toISOString()}">${stats.mtime.toLocaleString()}</td>`,
                '</tr>',
            ].join('');
        }),
    )),
    `<tr><td colspan="3">Created at <time datetime="${new Date().toISOString()}">${new Date().toLocaleString()}</time></td></tr>`,
    '</table>',
].join('\n');

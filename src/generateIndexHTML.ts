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

export const generateIndexHTML = async function* (
    absolutePath: URL,
    relativePath: string,
) {
    yield '<!doctype html>';
    yield '<meta charset="utf-8">';
    yield '<meta name="viewport" content="width=device-width">';
    yield `<title>Index of /${relativePath}</title>`;
    yield style;
    yield '<table>';
    yield '<tr><th>Name</th><th>Size</th><th>Last modified</th></tr>';
    yield '<tr><td><a href="..">..</a></td><td></td><td></td></tr>';
    for (const name of await fs.promises.readdir(absolutePath)) {
        const filePath = new URL(name, absolutePath);
        const stats = await fs.promises.stat(filePath);
        const isDirectory = stats.isDirectory();
        const href = `${name}${isDirectory ? '/' : ''}`;
        yield '<tr>';
        yield `    <td><a href="./${href}">${href}</a></td>`;
        yield `    <td class="size">${stats.size}</td>`;
        yield `    <td><time datetime="${stats.mtime.toISOString()}">${stats.mtime.toLocaleString()}</td>`;
        yield '</tr>';
    }
    yield `<tr><td colspan="3">Created at <time datetime="${new Date().toISOString()}">${new Date().toLocaleString()}</time></td></tr>`;
    yield '</table>';
};

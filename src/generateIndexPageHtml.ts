import { readdir, stat } from "node:fs/promises";
import { toDirUrl } from "./toDirUrl.ts";

export interface FileOperationsConfig {
	allowUpload: boolean;
	allowDelete: boolean;
	allowTextUpload: boolean;
}

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

const sanitize = (s: string) => s.replace(/</g, "&lt;").replace(/>/g, "&gt;");

const sanitizeAttr = (s: string) =>
	s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

const uploadScript = [
	"<script>",
	"document.getElementById('msl-upload-form')?.addEventListener('submit',async(e)=>{",
	"  e.preventDefault();",
	"  const file=document.getElementById('msl-upload-file').files[0];",
	"  if(!file)return;",
	"  const name=document.getElementById('msl-upload-name').value||file.name;",
	"  const res=await fetch('?_mslAction=upload&name='+encodeURIComponent(name),{method:'POST',body:file});",
	"  if(res.ok){location.reload();}else{alert(await res.text());}",
	"});",
	"document.getElementById('msl-text-upload-form')?.addEventListener('submit',async(e)=>{",
	"  e.preventDefault();",
	"  const name=document.getElementById('msl-text-name').value;",
	"  const body=document.getElementById('msl-text-body').value;",
	"  const res=await fetch('?_mslAction=upload&name='+encodeURIComponent(name),{method:'POST',headers:{'Content-Type':'text/plain'},body});",
	"  if(res.ok){location.reload();}else{alert(await res.text());}",
	"});",
	"</script>",
].join("\n");

const generate = async function* (
	dirUrl: URL,
	relativePath: string,
	ops?: FileOperationsConfig,
) {
	dirUrl = toDirUrl(dirUrl);
	yield "<!doctype html>";
	yield '<meta charset="utf-8">';
	yield '<meta name="viewport" content="width=device-width">';
	yield `<title>Index of ${relativePath}</title>`;
	yield `<style>${css}</style>`;
	yield "<table>";
	yield "<tr><th>Name</th><th>Size</th><th>Last modified</th><th></th></tr>";
	if (relativePath !== "/") {
		yield '<tr><td><a href="..">..</a></td><td></td><td></td><td></td></tr>';
	}
	for (const name of await readdir(dirUrl)) {
		const filePath = new URL(name, dirUrl);
		const stats = await stat(filePath);
		const isDir = stats.isDirectory();
		const suffix = isDir ? "/" : "";
		yield "<tr>";
		const href = `./${encodeURIComponent(name)}${suffix}`;
		const hrefText = sanitize(`${name}${suffix}`);
		yield `  <td><a href="${href}">${hrefText}</a></td>`;
		yield `  <td class="size">${stats.size}</td>`;
		yield `  <td><time datetime="${stats.mtime.toISOString()}">${stats.mtime.toLocaleString()}</td>`;
		if (isDir) {
			yield "  <td></td>";
		} else {
			const downloadLink = `<a href="${href}" download="${sanitize(name)}">Download</a>`;
			if (ops?.allowDelete) {
				const deleteForm = `<form method="POST" action="?_mslAction=delete" style="display:inline"><input type="hidden" name="name" value="${sanitizeAttr(name)}"><button type="submit">Delete</button></form>`;
				yield `  <td>${downloadLink} ${deleteForm}</td>`;
			} else {
				yield `  <td>${downloadLink}</td>`;
			}
		}
		yield "</tr>";
	}
	yield `<tr><td colspan="4">Created at <time datetime="${new Date().toISOString()}">${new Date().toLocaleString()}</time></td></tr>`;
	yield "</table>";
	if (ops?.allowUpload) {
		yield '<section><h2>Upload file</h2><form id="msl-upload-form"><label>File: <input type="file" id="msl-upload-file" required></label> <label>Name (optional): <input type="text" id="msl-upload-name"></label> <button type="submit">Upload</button></form></section>';
	}
	if (ops?.allowTextUpload) {
		yield '<section><h2>Create text file</h2><form id="msl-text-upload-form"><label>File name: <input type="text" id="msl-text-name" required></label><br><label>Content:<br><textarea id="msl-text-body" rows="5" cols="40"></textarea></label><br><button type="submit">Create</button></form></section>';
	}
	if (ops?.allowUpload || ops?.allowTextUpload) {
		yield uploadScript;
	}
};

export const generateIndexPageHtml = async (
	dirUrl: URL,
	relativePath: string,
	fileOperations?: FileOperationsConfig,
): Promise<string> => {
	let html = "";
	for await (const line of generate(dirUrl, relativePath, fileOperations)) {
		html += `${line}\n`;
	}
	return html;
};

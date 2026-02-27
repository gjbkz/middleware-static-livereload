import { readdir, stat } from "node:fs/promises";
import { toDirUrl } from "./toDirUrl.ts";

export interface FileOperationsConfig {
	allowFileUpload: boolean;
	allowDelete: boolean;
	allowTextUpload: boolean;
}

const css = `
:root {
  font-family: -apple-system, system-ui, Helvetica, Arial, sans-serif;
}
.msl-container {
  display: grid;
  width: fit-content;
  margin: 1rem auto;
  gap: .5rem;
}
table {
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
:is(button, .msl-btn) {
	min-height: 1.7em;
  padding: 0 .6rem;
  border: 1px solid #bbb;
  border-radius: 3px;
  background: #f5f5f5;
  cursor: pointer;
  font: inherit;
  font-size: 80%;
  &:hover { background: #e8e8e8; }
}
.msl-btn {
  display: inline-block;
  color: inherit;
  text-decoration: none;
}
.msl-delete-btn {
  color: #c00;
  border-color: #ecc;
  background: #fff0f0;
  &:hover { background: #ffe0e0; }
}
details {
  > summary {
    cursor: pointer;
    font-weight: bold;
    font-size: 1.1em;
    padding: .4rem .8rem;
    background: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 4px;
    list-style: none;
    user-select: none;
    &::-webkit-details-marker { display: none; }
  }
  &[open] > summary { border-radius: 4px 4px 0 0; }
  > form {
    display: flex;
    flex-direction: column;
    gap: .6rem;
    padding: .8rem;
    border: 1px solid #ccc;
    border-top: none;
    border-radius: 0 0 4px 4px;
  }
}
.msl-toggle {
  display: flex;
  gap: 1rem;
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
	// Unified form (both allowFileUpload && allowTextUpload)
	"(function(){",
	"  const form=document.getElementById('msl-create-form');",
	"  if(!form)return;",
	"  const fileInput=document.getElementById('msl-create-file');",
	"  const nameInput=document.getElementById('msl-create-name');",
	"  const fileSection=document.getElementById('msl-file-section');",
	"  const textSection=document.getElementById('msl-text-section');",
	"  document.querySelectorAll('input[name=\"msl-mode\"]').forEach(function(r){r.addEventListener('change',function(){",
	"    const isFile=document.getElementById('msl-mode-file').checked;",
	"    fileSection.hidden=!isFile;textSection.hidden=isFile;",
	"  });});",
	"  fileInput.addEventListener('change',function(){",
	"    if(fileInput.files[0]){nameInput.value=fileInput.files[0].name;}",
	"  });",
	"  form.addEventListener('submit',async function(e){",
	"    e.preventDefault();",
	"    const name=nameInput.value;",
	"    if(!name){alert('File name is required');return;}",
	"    const isFile=document.getElementById('msl-mode-file').checked;",
	"    let res;",
	"    if(isFile){",
	"      const file=fileInput.files[0];",
	"      if(!file){alert('Please select a file');return;}",
	"      res=await fetch('?_mslAction=upload&name='+encodeURIComponent(name),{method:'POST',body:file});",
	"    }else{",
	"      const body=document.getElementById('msl-create-body').value;",
	"      res=await fetch('?_mslAction=upload&name='+encodeURIComponent(name),{method:'POST',headers:{'Content-Type':'text/plain'},body});",
	"    }",
	"    if(res.ok){location.reload();}else{alert(await res.text());}",
	"  });",
	"})();",
	// Upload-only form
	"(function(){",
	"  const form=document.getElementById('msl-upload-form');",
	"  if(!form)return;",
	"  const fileInput=document.getElementById('msl-upload-file');",
	"  const nameInput=document.getElementById('msl-upload-name');",
	"  fileInput.addEventListener('change',function(){",
	"    if(fileInput.files[0]){nameInput.value=fileInput.files[0].name;}",
	"  });",
	"  form.addEventListener('submit',async function(e){",
	"    e.preventDefault();",
	"    const file=fileInput.files[0];",
	"    if(!file)return;",
	"    const name=nameInput.value||file.name;",
	"    const res=await fetch('?_mslAction=upload&name='+encodeURIComponent(name),{method:'POST',body:file});",
	"    if(res.ok){location.reload();}else{alert(await res.text());}",
	"  });",
	"})();",
	// Text-only form
	"document.getElementById('msl-text-upload-form')?.addEventListener('submit',async function(e){",
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
	yield '<div class="msl-container">';
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
			const downloadLink = `<a class="msl-btn" href="${href}" download="${sanitize(name)}">Download</a>`;
			if (ops?.allowDelete) {
				const deleteForm = `<form method="POST" action="?_mslAction=delete" style="display:inline"><input type="hidden" name="name" value="${sanitizeAttr(name)}"><button class="msl-delete-btn" type="submit" onclick="return confirm('Delete ${sanitizeAttr(name)}?')">Delete</button></form>`;
				yield `  <td>${downloadLink} ${deleteForm}</td>`;
			} else {
				yield `  <td>${downloadLink}</td>`;
			}
		}
		yield "</tr>";
	}
	yield `<tr><td colspan="4">Created at <time datetime="${new Date().toISOString()}">${new Date().toLocaleString()}</time></td></tr>`;
	yield "</table>";
	if (ops?.allowFileUpload && ops?.allowTextUpload) {
		yield '<details><summary>Create file</summary><form id="msl-create-form"><div class="msl-toggle"><label><input type="radio" name="msl-mode" id="msl-mode-file" value="file" checked> File</label><label><input type="radio" name="msl-mode" id="msl-mode-text" value="text"> Text</label></div><div id="msl-file-section"><label>File: <input type="file" id="msl-create-file"></label></div><div id="msl-text-section" hidden><label>Content:<br><textarea id="msl-create-body" rows="5" cols="40"></textarea></label></div><label>File name: <input type="text" id="msl-create-name" required></label><button type="submit">Create</button></form></details>';
	} else if (ops?.allowFileUpload) {
		yield '<details><summary>Upload file</summary><form id="msl-upload-form"><label>File: <input type="file" id="msl-upload-file" required></label><label>Name: <input type="text" id="msl-upload-name"></label><button type="submit">Upload</button></form></details>';
	} else if (ops?.allowTextUpload) {
		yield '<details><summary>Create text file</summary><form id="msl-text-upload-form"><label>File name: <input type="text" id="msl-text-name" required></label><label>Content:<br><textarea id="msl-text-body" rows="5" cols="40"></textarea></label><button type="submit">Create</button></form></details>';
	}
	yield "</div>";
	if (ops?.allowFileUpload || ops?.allowTextUpload) {
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

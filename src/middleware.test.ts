import * as assert from "node:assert/strict";
import {
	mkdir,
	mkdtemp,
	readFile,
	stat,
	unlink,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { isErrorWithCode } from "./isErrorWithCode.ts";
import { createServer, listenServerSentEvents } from "./server.test.ts";

const listLinks = (html: string) => {
	const links: Array<[string | undefined, string | undefined]> = [];
	for (const match of html.matchAll(/<a[^>]*?href="([^"]+)"[^>]*?>([^<]+)</g)) {
		if (!match[0].includes(" download")) {
			links.push([match[1], match[2]]);
		}
	}
	return links;
};

test("/ 200", async (ctx) => {
	const rootDir = await mkdtemp(join(tmpdir(), `${Date.now()}`));
	const url = await createServer(ctx, { documentRoot: [rootDir], watch: null });
	const res = await fetch(url);
	assert.equal(res.status, 200);
});

test("/ content-type", async (ctx) => {
	const rootDir = await mkdtemp(join(tmpdir(), `${Date.now()}`));
	const url = await createServer(ctx, { documentRoot: [rootDir], watch: null });
	const res = await fetch(url);
	assert.equal(res.status, 200);
});

test("/ index", async (ctx) => {
	const rootDir = await mkdtemp(join(tmpdir(), `${Date.now()}`));
	const url = await createServer(ctx, { documentRoot: [rootDir], watch: null });
	const res1 = await fetch(url);
	assert.deepEqual(listLinks(await res1.text()), []);
	await writeFile(join(rootDir, "foo"), "");
	const res2 = await fetch(url);
	assert.deepEqual(listLinks(await res2.text()), [["./foo", "foo"]]);
});

test("/ index (encoded)", async (ctx) => {
	const rootDir = await mkdtemp(join(tmpdir(), `${Date.now()}`));
	const url = await createServer(ctx, { documentRoot: [rootDir], watch: null });
	await writeFile(join(rootDir, "あ"), "");
	const res = await fetch(url);
	assert.deepEqual(listLinks(await res.text()), [
		[`./${encodeURIComponent("あ")}`, "あ"],
	]);
});

test("/ index (sanitized)", async (ctx) => {
	const rootDir = await mkdtemp(join(tmpdir(), `${Date.now()}`));
	const url = await createServer(ctx, { documentRoot: [rootDir], watch: null });
	try {
		await writeFile(join(rootDir, "あ>あ"), "");
	} catch (error) {
		if (isErrorWithCode(error) && error.code === "ENOENT") {
			// Windows does not allow creating a file with '>' in the name.
			ctx.skip();
			return;
		}
		throw error;
	}
	const res = await fetch(url);
	assert.deepEqual(listLinks(await res.text()), [
		[`./${encodeURIComponent("あ>あ")}`, "あ&gt;あ"],
	]);
});

test("/dir index", async (ctx) => {
	const rootDir = await mkdtemp(join(tmpdir(), `${Date.now()}`));
	const url = await createServer(ctx, { documentRoot: [rootDir], watch: null });
	const dir = join(rootDir, "dir");
	await mkdir(dir, { recursive: true });
	const body = `${Date.now()}`;
	await writeFile(join(dir, "あ-あ"), body);
	const res = await fetch(new URL("./dir", url));
	assert.deepEqual(listLinks(await res.text()), [
		["..", ".."],
		[`./${encodeURIComponent("あ-あ")}`, "あ-あ"],
	]);
});

test("/dir file", async (ctx) => {
	const rootDir = await mkdtemp(join(tmpdir(), `${Date.now()}`));
	const url = await createServer(ctx, { documentRoot: [rootDir], watch: null });
	const dir = join(rootDir, "dir");
	await mkdir(dir, { recursive: true });
	const body = `${Date.now()}`;
	const filePath = join(dir, "あ-あ");
	await writeFile(filePath, body);
	const res = await fetch(new URL("./dir/あ-あ", url));
	assert.equal(await res.text(), body);
});

test("respond the client script", async (ctx) => {
	const rootDir = await mkdtemp(join(tmpdir(), `${Date.now()}`));
	const scriptPath = "client.js";
	const url = await createServer(ctx, { documentRoot: [rootDir], scriptPath });
	const res = await fetch(new URL(`/${scriptPath}`, url));
	const contentType = res.headers.get("content-type");
	assert.equal(typeof contentType, "string");
	assert.ok(contentType?.startsWith("text/javascript"));
});

test("server sent event: connect", async (ctx) => {
	const rootDir = await mkdtemp(join(tmpdir(), `${Date.now()}`));
	const filePath = join(rootDir, "file.txt");
	await writeFile(filePath, `${Date.now()}`);
	const scriptPath = "client.js";
	const url = await createServer(ctx, { documentRoot: [rootDir], scriptPath });
	const sseEndpoint = new URL(`/${scriptPath}/connect`, url);
	const sse = await listenServerSentEvents(sseEndpoint);
	const sseData = await sse.next();
	assert.deepEqual(sseData, {
		done: false,
		value: ["", "#0"],
	});
	sse.abort();
});

test("server sent event: watch only requested files", async (ctx) => {
	const rootDir = await mkdtemp(join(tmpdir(), `${Date.now()}`));
	const dir = join(rootDir, "dir");
	await mkdir(dir, { recursive: true });
	const file1 = join(dir, "file1.txt");
	await writeFile(file1, `${Date.now()}`);
	const file2 = join(dir, "file2.txt");
	await writeFile(file2, `${Date.now()}`);
	const scriptPath = "client.js";
	const url = await createServer(ctx, { documentRoot: [rootDir], scriptPath });
	await fetch(new URL("/dir/file2.txt", url));
	const sseEndpoint = new URL(`/${scriptPath}/connect`, url);
	const sse = await listenServerSentEvents(sseEndpoint);
	const sseData1 = await sse.next();
	assert.deepEqual(sseData1, {
		done: false,
		value: ["", "#1"],
	});
	await writeFile(file1, `${Date.now()}`);
	await writeFile(file2, `${Date.now()}`);
	const sseData2 = await sse.next();
	assert.deepEqual(sseData2, {
		done: false,
		value: ["change", "dir/file2.txt"],
	});
	await unlink(file1);
	await unlink(file2);
	const sseData3 = await sse.next();
	assert.deepEqual(sseData3, {
		done: false,
		value: ["unlink", "dir/file2.txt"],
	});
	sse.abort();
});

// fileOperations tests

test("fileOperations: disabled by default, upload → 404", async (ctx) => {
	const rootDir = await mkdtemp(join(tmpdir(), `${Date.now()}`));
	const url = await createServer(ctx, { documentRoot: [rootDir], watch: null });
	const res = await fetch(new URL("/?_mslAction=upload&name=test.txt", url), {
		method: "POST",
		body: "hello",
	});
	assert.equal(res.status, 404);
});

test("fileOperations: disabled by default, delete → 404", async (ctx) => {
	const rootDir = await mkdtemp(join(tmpdir(), `${Date.now()}`));
	const url = await createServer(ctx, { documentRoot: [rootDir], watch: null });
	const res = await fetch(new URL("/?_mslAction=delete", url), {
		method: "POST",
		body: "name=test.txt",
		headers: { "content-type": "application/x-www-form-urlencoded" },
	});
	assert.equal(res.status, 404);
});

test("fileOperations: index page has no forms when disabled", async (ctx) => {
	const rootDir = await mkdtemp(join(tmpdir(), `${Date.now()}`));
	const url = await createServer(ctx, {
		documentRoot: [rootDir],
		watch: null,
		fileOperations: false,
	});
	const html = await (await fetch(url)).text();
	assert.ok(!html.includes('id="msl-upload-form"'));
	assert.ok(!html.includes('id="msl-text-upload-form"'));
	assert.ok(!html.includes("_mslAction=delete"));
});

test("fileOperations: index page shows upload forms when enabled", async (ctx) => {
	const rootDir = await mkdtemp(join(tmpdir(), `${Date.now()}`));
	await writeFile(join(rootDir, "existing.txt"), "x");
	const url = await createServer(ctx, {
		documentRoot: [rootDir],
		watch: null,
		fileOperations: true,
	});
	const html = await (await fetch(url)).text();
	assert.ok(html.includes('id="msl-create-form"'));
	assert.ok(html.includes("_mslAction=delete"));
});

test("fileOperations: allowDelete only, no upload form", async (ctx) => {
	const rootDir = await mkdtemp(join(tmpdir(), `${Date.now()}`));
	await writeFile(join(rootDir, "existing.txt"), "x");
	const url = await createServer(ctx, {
		documentRoot: [rootDir],
		watch: null,
		fileOperations: { allowDelete: true },
	});
	const html = await (await fetch(url)).text();
	assert.ok(!html.includes('id="msl-upload-form"'));
	assert.ok(!html.includes('id="msl-text-upload-form"'));
	assert.ok(html.includes("_mslAction=delete"));
});

test("fileOperations: upload success (200)", async (ctx) => {
	const rootDir = await mkdtemp(join(tmpdir(), `${Date.now()}`));
	const url = await createServer(ctx, {
		documentRoot: [rootDir],
		watch: null,
		fileOperations: { allowFileUpload: true },
	});
	const res = await fetch(
		new URL("/?_mslAction=upload&name=newfile.txt", url),
		{ method: "POST", body: "hello world" },
	);
	assert.equal(res.status, 200);
	assert.equal(
		await readFile(join(rootDir, "newfile.txt"), "utf-8"),
		"hello world",
	);
});

test("fileOperations: text upload success (200)", async (ctx) => {
	const rootDir = await mkdtemp(join(tmpdir(), `${Date.now()}`));
	const url = await createServer(ctx, {
		documentRoot: [rootDir],
		watch: null,
		fileOperations: { allowTextUpload: true },
	});
	const res = await fetch(new URL("/?_mslAction=upload&name=note.txt", url), {
		method: "POST",
		headers: { "content-type": "text/plain" },
		body: "memo content",
	});
	assert.equal(res.status, 200);
	assert.equal(
		await readFile(join(rootDir, "note.txt"), "utf-8"),
		"memo content",
	);
});

test("fileOperations: upload conflict (409)", async (ctx) => {
	const rootDir = await mkdtemp(join(tmpdir(), `${Date.now()}`));
	await writeFile(join(rootDir, "existing.txt"), "old");
	const url = await createServer(ctx, {
		documentRoot: [rootDir],
		watch: null,
		fileOperations: { allowFileUpload: true },
	});
	const res = await fetch(
		new URL("/?_mslAction=upload&name=existing.txt", url),
		{ method: "POST", body: "new" },
	);
	assert.equal(res.status, 409);
	assert.equal(await readFile(join(rootDir, "existing.txt"), "utf-8"), "old");
});

test("fileOperations: upload invalid filename (400)", async (ctx) => {
	const rootDir = await mkdtemp(join(tmpdir(), `${Date.now()}`));
	const url = await createServer(ctx, {
		documentRoot: [rootDir],
		watch: null,
		fileOperations: { allowFileUpload: true },
	});
	// empty name
	const res1 = await fetch(new URL("/?_mslAction=upload&name=", url), {
		method: "POST",
		body: "x",
	});
	assert.equal(res1.status, 400);
	// path traversal via /
	const res2 = await fetch(
		new URL(
			`/?_mslAction=upload&name=${encodeURIComponent("../evil.txt")}`,
			url,
		),
		{ method: "POST", body: "x" },
	);
	assert.equal(res2.status, 400);
	// bare ..
	const res3 = await fetch(
		new URL(`/?_mslAction=upload&name=${encodeURIComponent("..")}`, url),
		{ method: "POST", body: "x" },
	);
	assert.equal(res3.status, 400);
});

test("fileOperations: upload empty body (400)", async (ctx) => {
	const rootDir = await mkdtemp(join(tmpdir(), `${Date.now()}`));
	const url = await createServer(ctx, {
		documentRoot: [rootDir],
		watch: null,
		fileOperations: { allowFileUpload: true },
	});
	const res = await fetch(new URL("/?_mslAction=upload&name=test.txt", url), {
		method: "POST",
		body: "",
	});
	assert.equal(res.status, 400);
});

test("fileOperations: upload disabled → 404", async (ctx) => {
	const rootDir = await mkdtemp(join(tmpdir(), `${Date.now()}`));
	const url = await createServer(ctx, {
		documentRoot: [rootDir],
		watch: null,
		fileOperations: { allowDelete: true },
	});
	const res = await fetch(new URL("/?_mslAction=upload&name=test.txt", url), {
		method: "POST",
		body: "x",
	});
	assert.equal(res.status, 404);
});

test("fileOperations: delete success (303)", async (ctx) => {
	const rootDir = await mkdtemp(join(tmpdir(), `${Date.now()}`));
	await writeFile(join(rootDir, "todelete.txt"), "bye");
	const url = await createServer(ctx, {
		documentRoot: [rootDir],
		watch: null,
		fileOperations: { allowDelete: true },
	});
	const res = await fetch(new URL("/?_mslAction=delete", url), {
		method: "POST",
		body: "name=todelete.txt",
		headers: { "content-type": "application/x-www-form-urlencoded" },
		redirect: "manual",
	});
	assert.equal(res.status, 303);
	assert.equal(res.headers.get("location"), "/");
	await assert.rejects(() => stat(join(rootDir, "todelete.txt")));
});

test("fileOperations: delete not found (404)", async (ctx) => {
	const rootDir = await mkdtemp(join(tmpdir(), `${Date.now()}`));
	const url = await createServer(ctx, {
		documentRoot: [rootDir],
		watch: null,
		fileOperations: { allowDelete: true },
	});
	const res = await fetch(new URL("/?_mslAction=delete", url), {
		method: "POST",
		body: "name=nonexistent.txt",
		headers: { "content-type": "application/x-www-form-urlencoded" },
	});
	assert.equal(res.status, 404);
});

test("fileOperations: delete directory (400)", async (ctx) => {
	const rootDir = await mkdtemp(join(tmpdir(), `${Date.now()}`));
	await mkdir(join(rootDir, "subdir"));
	const url = await createServer(ctx, {
		documentRoot: [rootDir],
		watch: null,
		fileOperations: { allowDelete: true },
	});
	const res = await fetch(new URL("/?_mslAction=delete", url), {
		method: "POST",
		body: "name=subdir",
		headers: { "content-type": "application/x-www-form-urlencoded" },
	});
	assert.equal(res.status, 400);
});

test("fileOperations: delete path traversal (400)", async (ctx) => {
	const rootDir = await mkdtemp(join(tmpdir(), `${Date.now()}`));
	const url = await createServer(ctx, {
		documentRoot: [rootDir],
		watch: null,
		fileOperations: { allowDelete: true },
	});
	// name with / → 400
	const res1 = await fetch(new URL("/?_mslAction=delete", url), {
		method: "POST",
		body: `name=${encodeURIComponent("../foo.txt")}`,
		headers: { "content-type": "application/x-www-form-urlencoded" },
	});
	assert.equal(res1.status, 400);
	// bare .. → 400
	const res2 = await fetch(new URL("/?_mslAction=delete", url), {
		method: "POST",
		body: `name=${encodeURIComponent("..")}`,
		headers: { "content-type": "application/x-www-form-urlencoded" },
	});
	assert.equal(res2.status, 400);
});

test("fileOperations: delete disabled → 404", async (ctx) => {
	const rootDir = await mkdtemp(join(tmpdir(), `${Date.now()}`));
	await writeFile(join(rootDir, "test.txt"), "x");
	const url = await createServer(ctx, {
		documentRoot: [rootDir],
		watch: null,
		fileOperations: { allowFileUpload: true },
	});
	const res = await fetch(new URL("/?_mslAction=delete", url), {
		method: "POST",
		body: "name=test.txt",
		headers: { "content-type": "application/x-www-form-urlencoded" },
	});
	assert.equal(res.status, 404);
});

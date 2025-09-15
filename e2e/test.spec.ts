import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";
import type { FSWatcher } from "chokidar";
import { LogLevel, middleware } from "../esm/middleware";

interface EventLog {
	name: string;
	file: string;
	date: number;
}

const closeFunctions = new Set<() => Promise<unknown>>();
let baseUrl: URL;
let tempDirUrl: URL;
let waitForEvent: (
	name: string,
	file: RegExp,
	timeoutMs: number,
	initFromTime?: number,
) => Promise<EventLog>;

const createFileEventLogger = (fileWatcher: FSWatcher) => {
	const events: Array<EventLog> = [];
	fileWatcher.on("all", (name, file) => {
		events.push({ name, file, date: Date.now() });
	});
	const listEvents = function* (fromTime: number) {
		for (const event of events) {
			if (fromTime <= event.date) {
				yield event;
			}
		}
	};
	waitForEvent = async (
		name: string,
		file: RegExp,
		timeoutMs = 6000,
		initFromTime = Date.now(),
	) => {
		const isMatched = (event: EventLog) =>
			event.name === name && file.test(event.file);
		const getFirstMatchedEvent = (fromTime: number) => {
			for (const event of listEvents(fromTime)) {
				if (isMatched(event)) {
					return event;
				}
			}
			return null;
		};
		return await new Promise<EventLog>((resolve, reject) => {
			const timerId = setTimeout(() => reject(new Error("Timeout")), timeoutMs);
			let fromTime = initFromTime;
			const check = () =>
				setImmediate(() => {
					const event = getFirstMatchedEvent(fromTime);
					if (event) {
						clearTimeout(timerId);
						fileWatcher.off("all", check);
						resolve(event);
					}
					fromTime = Date.now();
				});
			fileWatcher.on("all", check);
			check();
		});
	};
};

test.beforeAll(async () => {
	const dir = await fs.mkdtemp(path.join(os.tmpdir(), "test-client-"));
	tempDirUrl = pathToFileURL(dir + path.sep);
	closeFunctions.add(async () => {
		await fs.rm(tempDirUrl, { recursive: true, force: true });
	});
	const handler = middleware({ documentRoot: [dir], logLevel: LogLevel.debug });
	const { fileWatcher } = handler;
	if (fileWatcher === null) {
		throw new Error("fileWatcher is not available");
	}
	createFileEventLogger(fileWatcher);
	closeFunctions.add(handler.close);
	const server = http.createServer(handler);
	closeFunctions.add(
		async () =>
			await new Promise((resolve, reject) => {
				server.once("error", reject);
				server.close(resolve);
			}),
	);
	const port = await new Promise<number>((resolve, reject) => {
		if (server) {
			const listen = (port: number) => {
				const removeListeners = () => {
					server.off("error", onError);
					server.off("listening", onListening);
				};
				const onError = (err: unknown) => {
					removeListeners();
					if ((err as NodeJS.ErrnoException).code === "EADDRINUSE") {
						listen(port + 1);
					} else {
						reject(err);
					}
				};
				const onListening = () => {
					removeListeners();
					resolve(port);
				};
				server.once("error", onError);
				server.once("listening", onListening);
				server.listen(port);
			};
			listen(8080);
		}
	});
	console.info(server.address());
	baseUrl = new URL(`http://localhost:${port}`);
});

test.afterAll(async () => {
	for (const closeFunction of closeFunctions) {
		await closeFunction();
	}
	closeFunctions.clear();
});

test("index", async ({ page }) => {
	await page.goto(baseUrl.href);
	await expect(page).toHaveTitle(/^Index of \/$/);
});

test("reload css", async ({ page }) => {
	const testName = "reload-css";
	const testDir = new URL(`${testName}/`, tempDirUrl);
	await test.step("Prepare the files", async () => {
		await fs.mkdir(testDir, { recursive: true });
		await Promise.all([
			fs.writeFile(
				new URL("page.css", testDir),
				"#target{background-color:#99ff99;height:100px;}",
			),
			fs.writeFile(
				new URL("page.js", testDir),
				"document.querySelector('#target').textContent = new Date().toISOString();",
			),
			fs.writeFile(
				new URL("page.html", testDir),
				[
					"<!doctype html>",
					"<head>",
					'<link rel="stylesheet" href="./page.css"/>',
					"</head>",
					"<body>",
					'<h1 id="target">Target</h1>',
					'<script src="./page.js" defer></script>',
					"</body>",
				].join("\n"),
			),
		]);
	});
	await test.step("Open page.html", async () => {
		await Promise.all([
			page.goto(new URL(`${testName}/page.html`, baseUrl).href),
			waitForEvent("add", /page\.html$/, 6000),
			waitForEvent("add", /page\.css$/, 6000),
			waitForEvent("add", /page\.js$/, 6000),
		]);
	});
	await test.step("Ensure page.css is loaded", async () => {
		await expect(page.locator("#target")).toHaveCSS("height", "100px");
	});
	await test.step("Ensure page.js is loaded", async () => {
		await expect(page.locator("#target")).toHaveText(
			/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}/,
		);
	});
	const beforeText = (await page.locator("#target").textContent()) ?? "";
	await test.step("Update page.css", async () => {
		await fs.writeFile(
			new URL("page.css", testDir),
			"#target{background-color:#9999ff;height:200px;}",
		);
		await waitForEvent("change", /page\.css$/, 6000);
	});
	await test.step("Ensure page.css update are applied", async () => {
		await expect(page.locator("#target")).toHaveCSS("height", "200px");
	});
	await test.step("Ensure the page has not been reloaded", async () => {
		await expect(page.locator("#target")).toHaveText(beforeText);
	});
});

test("fetch-file", async ({ page }) => {
	const testName = "fetch-file";
	const testDir = new URL(`${testName}/`, tempDirUrl);
	const testTextContent = "foo";
	await test.step("Prepare the files", async () => {
		await fs.mkdir(testDir, { recursive: true });
		await Promise.all([
			fs.writeFile(
				new URL("page.js", testDir),
				"document.querySelector('#target1').textContent = new Date().toISOString();",
			),
			fs.writeFile(new URL("test.txt", testDir), testTextContent),
			fs.writeFile(
				new URL("page.html", testDir),
				[
					"<!doctype html>",
					"<body>",
					'<h1 id="target1">Target1</h1>',
					'<h1 id="target2">Target2</h1>',
					'<script src="./page.js" defer></script>',
					"</body>",
				].join("\n"),
			),
		]);
	});
	await test.step("Open page.html", async () => {
		await Promise.all([
			page.goto(new URL(`${testName}/page.html`, baseUrl).href),
			waitForEvent("add", /page\.html$/, 6000),
			waitForEvent("add", /page\.js$/, 6000),
		]);
	});
	await test.step("Ensure page.js is loaded", async () => {
		await expect(page.locator("#target1")).toHaveText(
			/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}/,
		);
	});
	const beforeText = (await page.locator("#target1").textContent()) ?? "";
	await test.step("Fetch test.txt", async () => {
		await page.evaluate(
			"fetch('test.txt').then(async (r) => document.querySelector('#target2').textContent = await r.text())",
		);
		await waitForEvent("add", /test\.txt$/, 6000);
	});
	await test.step("Ensure the script has executed", async () => {
		await expect(page.locator("#target2")).toHaveText(testTextContent);
	});
	await test.step("Ensure the page has not been reloaded", async () => {
		await expect(page.locator("#target1")).toHaveText(beforeText);
	});
});

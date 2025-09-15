import * as assert from "node:assert/strict";
import { parse } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import { pathLikeToFileUrl } from "./pathLikeToFileUrl.ts";

const cwd = process.cwd();
const driveRoot = parse(cwd).root;
const rootUrl = pathToFileURL(driveRoot);

test("absolute path", () => {
	const input = "/a";
	const baseDir = "/base";
	const actual = pathLikeToFileUrl(input, baseDir);
	const expected = new URL("/a", rootUrl);
	assert.equal(actual.href, expected.href);
});

test("relative path", () => {
	const input = "a/b";
	const baseDir = "/base";
	const actual = pathLikeToFileUrl(input, baseDir);
	const expected = new URL("/base/a/b", rootUrl);
	assert.equal(actual.href, expected.href);
});

test("absolute path (buffer)", () => {
	const input = Buffer.from("/a");
	const baseDir = "/base";
	const actual = pathLikeToFileUrl(input, baseDir);
	const expected = new URL("/a", rootUrl);
	assert.equal(actual.href, expected.href);
});

test("relative path (buffer)", () => {
	const input = Buffer.from("a/b");
	const baseDir = "/base";
	const actual = pathLikeToFileUrl(input, baseDir);
	const expected = new URL("/base/a/b", rootUrl);
	assert.ok(actual.href, expected.href);
});

test("url", () => {
	const input = new URL("file:///a");
	const baseDir = "/base";
	const actual = pathLikeToFileUrl(input, baseDir);
	const expected = input;
	assert.equal(actual, expected);
});

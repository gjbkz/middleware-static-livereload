import * as assert from "node:assert/strict";
import { test } from "node:test";
import { toDirUrl } from "./toDirUrl.ts";

test("ends with slash", () => {
	const input = new URL("/a/b/c/", "https://example.com/");
	const actual = toDirUrl(input);
	assert.equal(actual.pathname, "/a/b/c/");
});

test("ends without slash", () => {
	const input = new URL("/a/b/c", "https://example.com/");
	const actual = toDirUrl(input);
	assert.equal(actual.pathname, "/a/b/c/");
});

const path = require('path');
const fs = require('fs');
const http = require('http');
const connect = require('connect');
const test = require('@nlib/test');
const middleware = require('..');
const readStream = (stream) => new Promise((resolve, reject) => {
	const chunks = [];
	stream
	.once('error', reject)
	.on('data', (chunk) => chunks.push(chunk))
	.on('end', () => resolve(Buffer.concat(chunks)));
});

test('middleware-static-livereload', (test) => {
	const documentRoot = path.join(__dirname, 'doc');
	const serverPort = 7654;
	const livereloadPort = 7655;
	const getURL = (pathname = '') => `http://127.0.0.1:${serverPort}${pathname}`;
	const results = {};

	test('create a middleware function', () => {
		results.middleware = middleware({
			documentRoot,
			livereload: {port: livereloadPort},
		});
	});

	test('start a server', () => {
		results.server = connect()
		.use(results.middleware)
		.listen(serverPort);
	});

	test('inject a script tag', (test) => {
		const expectedHTML = [
			'<!doctype html>',
			`<script>document.write('<script src="http://'+(location.host||'localhost').split(':')[0]+':${livereloadPort}/livereload.js?snipver=1"></'+'script>')</script>`,
			'<title>middleware-static-livereload</title>',
			'',
		].join('\n');
		return new Promise((resolve) => http.get(getURL('/'), resolve))
		.then((res) => readStream(res))
		.then((receivedHTML) => test.compare(`${receivedHTML}`, expectedHTML));
	});

	test('redirect to / if a directory is requested', (test) => {
		return new Promise((resolve) => http.get(getURL('/directory'), resolve))
		.then((res) => {
			test.compare(res, {
				statusCode: 301,
				headers: {location: '/directory/'},
			});
		});
	});

	test('behave as a static file server', (test) => {
		const expectedJS = [
			'console.log(\'app.js\');',
			'',
		].join('\n');
		return new Promise((resolve) => http.get(getURL('/app.js'), resolve))
		.then((res) => readStream(res))
		.then((receivedJS) => {
			test.compare(`${receivedJS}`, expectedJS);
		});
	});

	test('watch the files', (test) => {
		return new Promise((resolve, reject) => {
			results.middleware.watcher
			.once('all', (eventType, filePath) => {
				try {
					test.compare({eventType, filePath}, {
						eventType: 'change',
						filePath: path.join(documentRoot, 'app.js'),
					});
					resolve();
				} catch (error) {
					reject(error);
				}
			});
			fs.utimes(path.join(documentRoot, 'app.js'), new Date(), new Date(), (error) => {
				if (error) {
					reject(error);
				}
			});
		});
	});

	test('close the livereload server', () => results.middleware.server.close());
	test('close the livereload watcher', () => results.middleware.watcher.close());
	test('close the server', () => new Promise((resolve) => results.server.close(resolve)));

});

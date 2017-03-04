const assert = require('assert');
const path = require('path');
const fs = require('fs');
const http = require('http');
const connect = require('connect');
const readStream = require('j1/readStream');

describe('middleware-static-livereload', function () {
	const documentRoot = path.join(__dirname, 'doc');
	const serverPort = 7654;
	const livereloadPort = 7655;
	const HTTPREDIRECT = 301;
	function getURL(pathname = '') {
		return `http://127.0.0.1:${serverPort}${pathname}`;
	}

	let server = null;
	let watcher = null;

	before(function () {
		server = connect()
			.use(require('../middleware-static-livereload')({
				documentRoot: documentRoot,
				livereload: {port: livereloadPort},
				onStartWatcher: (startedWatcher) => {
					watcher = startedWatcher;
				}
			}))
			.listen(serverPort);
	});

	after(function () {
		server.close();
	});

	it('should inject a script tag', function () {
		const expectedHTML = [
			'<!doctype html>',
			`<script>document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':${livereloadPort}/livereload.js?snipver=1"></' + 'script>')</script>`,
			'<title>middleware-static-livereload</title>',
			''
		].join('\n');
		return new Promise((resolve) => {
			http.get(getURL('/'), resolve);
		})
			.then(readStream)
			.then((receivedHTML) => {
				assert.equal(receivedHTML, expectedHTML);
			});
	});

	it('should redirect to / if a directory is requested', function () {
		return new Promise((resolve) => {
			http.get(getURL('/directory'), resolve);
		})
			.then((res) => {
				assert.equal(res.statusCode, HTTPREDIRECT);
				assert.equal(res.headers.location, '/directory/');
			});
	});

	it('should behave as a static file server', function () {
		const expectedJS = [
			'console.log(\'app.js\');',
			''
		].join('\n');
		return new Promise((resolve) => {
			http.get(getURL('/app.js'), resolve);
		})
			.then(readStream)
			.then((receivedJS) => {
				assert.equal(receivedJS, expectedJS);
			});
	});

	it('should watch the files', function (done) {
		watcher
			.once('all', (eventType, filePath) => {
				try {
					assert.deepEqual([eventType, filePath], ['change', path.join(documentRoot, 'app.js')]);
					done();
				} catch (error) {
					done(error);
				}
			});
		fs.utimes(path.join(documentRoot, 'app.js'), NaN, NaN, (error) => {
			if (error) {
				done(error);
			}
		});
	});
});

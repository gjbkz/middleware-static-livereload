const fs = require('fs');
const path = require('path');
const url = require('url');
const livereload = require('livereload');
const {promisify} = require('@nlib/util');
const {ContentType} = require('@nlib/content-type');
const {ReplaceStream} = require('@nlib/replace-stream');
const stat = promisify(fs.stat, fs);

module.exports = function middleware({
	documentRoot = process.cwd(),
	livereload: livereloadOption = {},
	contentType,
	include = [/\.html?$/],
	exclude = [],
	pattern = /<!doctype\s+html\s*[^<>]*>/i,
} = {}) {
	include = Array.isArray(include) ? include : [include];
	exclude = Array.isArray(exclude) ? exclude : [exclude];
	contentType = new ContentType(contentType);
	let server;
	const waitListening = new Promise((resolve) => {
		server = livereload.createServer(livereloadOption, resolve);
	})
	.then(() => server.server._server.address().port);
	const watcher = server.watch(documentRoot);
	return Object.assign(
		(req, res, next) => {
			const parsed = url.parse(req.url);
			const filePath = path.join(documentRoot, parsed.pathname.replace(/\/$/, '/index.html'));
			Promise.all([
				stat(filePath),
				waitListening,
			])
			.then(([stats, port]) => {
				if (stats.isDirectory()) {
					const newURL = Object.assign({}, parsed);
					newURL.pathname += '/';
					res.writeHead(301, {'location': url.format(newURL)});
					res.end();
					return null;
				}
				if (include.some((regexp) => regexp.test(filePath)) && exclude.every((regexp) => !regexp.test(filePath))) {
					res.writeHead(200, {'content-type': contentType.get(filePath)});
					return new Promise((resolve, reject) => {
						fs.createReadStream(filePath)
						.pipe(new ReplaceStream([{
							pattern,
							replacement: (match) => `${match}\n<script>document.write('<script src="http://'+(location.host||'localhost').split(':')[0]+':${port}/livereload.js?snipver=1"></'+'script>')</script>`,
						}]))
						.pipe(res)
						.once('error', reject)
						.once('finish', resolve);
					});
				}
				res.writeHead(200, {
					'content-type': contentType.get(filePath),
					'content-length': `${stats.size}`,
				});
				return new Promise((resolve, reject) => {
					fs.createReadStream(filePath)
					.pipe(res)
					.once('error', reject)
					.once('finish', resolve);
				});
			})
			.catch(next);
		},
		{server, watcher}
	);
};

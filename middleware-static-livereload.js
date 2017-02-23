const fs = require('fs');
const path = require('path');
const livereload = require('livereload');
const promisify = require('@kei-ito/promisify');
const mime = require('@kei-ito/mime');
const readFile = promisify(fs.readFile, fs);
const stat = promisify(fs.stat, fs);

const getScript = (port) => {
	return `\n<script>document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':${port}/livereload.js?snipver=1"></' + 'script>')</script>`;
};

module.exports = (options = {}) => {
	const {
		documentRoot = process.cwd(),
		livereload: livereloadOption = {},
		include = [/\.html(\?.*)?$/],
		insertAt = [
			{
				match: /<\!DOCTYPE.+?>/i,
				fn: (match) => {
					return match + getScript(port);
				}
			}
		],
		onStartWatcher
	} = options;
	const {
		port = 35729
	} = livereloadOption;
	const watcher = livereload.createServer(livereloadOption)
		.watch(documentRoot);
	if (onStartWatcher) {
		onStartWatcher(watcher);
	}
	return function (req, res, next) {
		const reqUrl = req.url.split(/\?/)[0];
		if (!path.extname(reqUrl) && /[^\/]$/.test(reqUrl)) {
			res.writeHead(301, {
				Location: reqUrl + '/'
			});
			res.end();
			return;
		}
		const reqPath = path.join(documentRoot, reqUrl.replace(/\/$/, '/index.html'));
		const isMatched = include.find((exp) => {
			return exp.test(reqPath);
		});
		if (isMatched) {
			readFile(reqPath, 'utf8')
				.then((body) => {
					insertAt.find(({match, fn}) => {
						let inserted;
						body = body.replace(match, (...args) => {
							inserted = true;
							return fn(...args);
						});
						return inserted;
					});
					body = Buffer.from(body);
					res.writeHead(200, {
						'Content-Length': body.length,
						'Content-Type': mime(reqPath)
					});
					res.end(body);
				})
				.catch(next);
			return;
		} else {
			stat(reqPath)
				.then((stats) => {
					res.writeHead(200, {
						'Content-Length': stats.size,
						'Content-Type': mime(reqPath)
					});
					fs.createReadStream(reqPath)
						.pipe(res);
				})
				.catch(next);
		}
	};
};

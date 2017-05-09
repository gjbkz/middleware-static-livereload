const fs = require('fs');
const path = require('path');
const livereload = require('livereload');
const promisify = require('j1/promisify');
const mime = require('j1/mime');
const readFile = promisify(fs.readFile, fs);
const stat = promisify(fs.stat, fs);

const DEFAULTPORT = 35729;
const HTTPREDIRECT = 301;
const HTTPOK = 200;

function getScript(port = DEFAULTPORT) {
	return `\n<script>document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':${port}/livereload.js?snipver=1"></' + 'script>')</script>`;
}

function middleware(options = {}) {
	const {
		documentRoot = process.cwd(),
		livereload: livereloadOption = {},
		include = [/\.html(\?.*)?$/],
		insertAt = [
			{
				match: /<!DOCTYPE.+?>/i,
				fn: (match) => {
					return match + getScript(livereloadOption.port);
				}
			}
		],
		onStartWatcher
	} = options;
	const watcher = livereload.createServer(livereloadOption).watch(documentRoot);
	if (onStartWatcher) {
		onStartWatcher(watcher);
	}
	return function (req, res, next) {
		const [reqUrl] = req.url.split(/\?/);
		if (!path.extname(reqUrl) && (/[^/]$/).test(reqUrl)) {
			res.writeHead(HTTPREDIRECT, {Location: `${reqUrl}/`});
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
					let inserted = false;
					body = body.replace(match, (...args) => {
						inserted = true;
						return fn(...args);
					});
					return inserted;
				});
				body = Buffer.from(body);
				res.writeHead(HTTPOK, {
					'Content-Length': body.length,
					'Content-Type': mime(reqPath)
				});
				res.end(body);
			})
			.catch(next);
		} else {
			stat(reqPath)
			.then((stats) => {
				res.writeHead(HTTPOK, {
					'Content-Length': stats.size,
					'Content-Type': mime(reqPath)
				});
				fs.createReadStream(reqPath)
					.pipe(res);
			})
			.catch(next);
		}
	};
}

module.exports = middleware;

# middleware-static-livereload

A middleware for [connect](https://github.com/senchalabs/connect) server.
It injects the [livereload](https://github.com/napcs/node-livereload) script
into .html files before serving them.

[![Build Status](https://travis-ci.org/kei-ito/middleware-static-livereload.svg?branch=master)](https://travis-ci.org/kei-ito/middleware-static-livereload)

## Install

```
npm install middleware-static-livereload
```

## Usage

```javascript
require('connect')()
	.use(require('middleware-static-livereload')({
		documentRoot: '/server',
	}))
	.listen(3000);
```

## API

See [the code](https://github.com/kei-ito/middleware-static-livereload/blob/master/changeExt.js).

## License

MIT

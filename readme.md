# middleware-static-livereload

[![CircleCI](https://circleci.com/gh/kei-ito/middleware-static-livereload.svg?style=svg)](https://circleci.com/gh/kei-ito/middleware-static-livereload)
[![Build Status](https://travis-ci.com/kei-ito/middleware-static-livereload.svg?branch=master)](https://travis-ci.com/kei-ito/middleware-static-livereload)
[![Build status](https://ci.appveyor.com/api/projects/status/github/kei-ito/middleware-static-livereload?branch=master&svg=true)](https://ci.appveyor.com/project/kei-ito/middleware-static-livereload/branch/master)
[![codecov](https://codecov.io/gh/kei-ito/middleware-static-livereload/branch/master/graph/badge.svg)](https://codecov.io/gh/kei-ito/middleware-static-livereload)

A middleware for [connect](https://github.com/senchalabs/connect) server.
It injects the [livereload](https://github.com/napcs/node-livereload) script
into .html files before serving them.

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

## License

MIT

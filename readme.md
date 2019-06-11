# middleware-static-livereload

[![CircleCI](https://circleci.com/gh/kei-ito/middleware-static-livereload.svg?style=svg)](https://circleci.com/gh/kei-ito/middleware-static-livereload)
[![Build Status](https://travis-ci.com/kei-ito/middleware-static-livereload.svg?branch=master)](https://travis-ci.com/kei-ito/middleware-static-livereload)
[![Build status](https://ci.appveyor.com/api/projects/status/github/kei-ito/middleware-static-livereload?branch=master&svg=true)](https://ci.appveyor.com/project/kei-ito/middleware-static-livereload/branch/master)
[![codecov](https://codecov.io/gh/kei-ito/middleware-static-livereload/branch/master/graph/badge.svg)](https://codecov.io/gh/kei-ito/middleware-static-livereload)
[![BrowserStack Status](https://www.browserstack.com/automate/badge.svg?badge_key=RThwZG1nRWNGOFFOQjc5TFJJTGovbFNJVmVmTUZxSU8zVG9MWjBnMlpiOD0tLWFHNlkrZ3JHd0FmVCtVL3k1TU1NcVE9PQ==--13129bc5044f47c05b3068e5a810a374d2dda6aa)](https://www.browserstack.com/automate/public-build/RThwZG1nRWNGOFFOQjc5TFJJTGovbFNJVmVmTUZxSU8zVG9MWjBnMlpiOD0tLWFHNlkrZ3JHd0FmVCtVL3k1TU1NcVE9PQ==--13129bc5044f47c05b3068e5a810a374d2dda6aa)

A middleware for [connect](https://github.com/senchalabs/connect) server.
It injects the autoreload script into text/html files before serving them.

## Install

```
npm install middleware-static-livereload
```

## Usage

```javascript
const http = require('http');
const connect = require('connect');
const app = connect();
app.use(require('middleware-static-livereload')({
  documentRoot: 'docs',
}));
const server = http.createServer(app).listen(3000);
```

## LICENSE

The middleware-static-livereload project is licensed under the terms of the Apache 2.0 License.

/* eslint-disable dot-notation */
/* eslint-disable no-console */
/* eslint-disable import/unambiguous */
/* eslint-disable import/no-commonjs */
//@ts-check
const assert = require('assert');
const fs = require('fs');
const http = require('http');
const https = require('https');
const os = require('os');
const path = require('path');
const { Local } = require('browserstack-local');
const { Builder, Browser } = require('selenium-webdriver');
const { middleware, LogLevel } = require('./lib/middleware.js');
const pkg = require('./package.json');

const buildId = process.env['GITHUB_RUN_ID'] || new Date().toISOString();
const localIdentifier = `${pkg.name}-${Date.now()}`;
const userName = `${process.env['BROWSERSTACK_USERNAME']}`;
const accessKey = `${process.env['BROWSERSTACK_ACCESS_KEY']}`;
const useBrowserStack = Boolean(userName && accessKey);
const bsServerUrl = 'https://hub-cloud.browserstack.com/wd/hub';
const browserName = process.env['BROWSERSTACK_BROWSER_NAME'];
const browserVersion = process.env['BROWSERSTACK_BROWSER_VERSION'];
const clientOs = process.env['BROWSERSTACK_OS'];
const clientOsVersion = process.env['BROWSERSTACK_OS_VERSION'];

const capabilities = {
  'bstack:options': {
    os: clientOs,
    osVersion: clientOsVersion,
    browserVersion,
    consoleLogs: 'info',
    projectName: pkg.name,
    buildName: `${pkg.name}#${buildId}`,
    sessionName: [clientOs, clientOsVersion, process.version].join(' '),
    local: true,
    userName,
    accessKey,
    localIdentifier,
  },
  browserName,
};

const bsLocalOptions = {
  key: accessKey,
  verbose: true,
  forceLocal: true,
  onlyAutomate: true,
  localIdentifier,
};

/** @type {Set<() => Promise<void | unknown>>} */
const closeFunctions = new Set();
/** @type {Set<import('selenium-webdriver').Session>} */
const sessions = new Set();

const closeAll = async () => {
  for (const closeFunction of closeFunctions) {
    await closeFunction();
  }
};

/**
 * @typedef {{name: string, file: string, date: number}} EventLog
 * @param {import('chokidar').FSWatcher} fileWatcher
 */
const createFileEventLogger = (fileWatcher) => {
  /** @type {Array<EventLog>} */
  const events = [];
  const clear = () => events.splice(0, events.length);
  fileWatcher.on('all', (name, file) => {
    events.push({ name, file, date: Date.now() });
  });
  /** @param {number} fromTime */
  const listEvents = function* (fromTime) {
    for (const event of events) {
      if (fromTime <= event.date) {
        yield event;
      }
    }
  };
  /**
   * @param {string} name
   * @param {RegExp} file
   * @param {number} timeoutMs
   * @param {number} [initFromTime]
   * @returns {Promise<EventLog>}
   */
  const waitForEvent = async (
    name,
    file,
    timeoutMs,
    initFromTime = Date.now(),
  ) => {
    /** @param {EventLog} event */
    const isMatched = (event) => event.name === name && file.test(event.file);
    /** @param {number} fromTime */
    const getFirstMatchedEvent = (fromTime) => {
      for (const event of listEvents(fromTime)) {
        if (isMatched(event)) {
          return event;
        }
      }
      return null;
    };
    return await new Promise((resolve, reject) => {
      const timerId = setTimeout(() => reject(new Error('Timeout')), timeoutMs);
      let fromTime = initFromTime;
      const check = () =>
        setImmediate(() => {
          const event = getFirstMatchedEvent(fromTime);
          if (event) {
            clearTimeout(timerId);
            fileWatcher.off('all', check);
            resolve(event);
          }
          fromTime = Date.now();
        });
      fileWatcher.on('all', check);
      check();
    });
  };
  return { clear, waitForEvent };
};

/**
 * @param {number} port
 */
const startBrowserStackLocal = async (port) => {
  const bsLocal = new Local();
  closeFunctions.add(async () => {
    await new Promise((resolve) => {
      if (bsLocal) {
        bsLocal.stop(() => resolve(null));
      } else {
        resolve(null);
      }
    });
  });
  const error = await new Promise((resolve) => {
    bsLocal.start({ ...bsLocalOptions, only: `localhost,${port},0` }, resolve);
  });
  if (error) {
    throw error;
  }
  const startedAt = Date.now();
  const timeoutMs = 20000;
  await new Promise((resolve, reject) => {
    const check = function () {
      if (bsLocal.isRunning()) {
        resolve(null);
      } else if (Date.now() - startedAt < timeoutMs) {
        setTimeout(check, 300);
      } else {
        reject(new Error('Timeout: Failed to start browserstack-local'));
      }
    };
    check();
  });
  console.info('BrowserStackLocal is running');
  return bsLocal;
};

const setup = async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-client-'));
  const handler = middleware({ documentRoot: [dir], logLevel: LogLevel.debug });
  const { fileWatcher } = handler;
  if (fileWatcher === null) {
    throw new Error('fileWatcher is not available');
  }
  const fileEvents = createFileEventLogger(fileWatcher);
  closeFunctions.add(handler.close);
  const server = http.createServer(handler);
  closeFunctions.add(
    async () =>
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.close(resolve);
      }),
  );
  await new Promise((resolve, reject) => {
    if (server) {
      server.once('error', reject);
      server.once('listening', resolve);
      server.listen(8080);
    }
  });
  const address = server.address();
  console.info(address);
  if (typeof address === 'string' || address === null) {
    throw new Error('Server address is not available');
  }
  const baseUrl = `http://localhost:${address.port}`;
  const builder = new Builder();
  if (useBrowserStack) {
    await startBrowserStackLocal(address.port);
    builder.usingServer(bsServerUrl).withCapabilities(capabilities);
  } else {
    builder.forBrowser(Browser.CHROME);
  }
  const driver = await builder.build();
  sessions.add(await driver.getSession());
  closeFunctions.add(async () => await driver.quit());
  return { baseUrl, dir, driver, fileEvents };
};

/**
 * @param {import('selenium-webdriver').WebDriver} driver
 * @param {string} selector
 */
const getColor = async (driver, selector) => {
  const color = await driver.executeScript(
    `return getComputedStyle(document.querySelector("${selector}")).color`,
  );
  return typeof color === 'string' && color.replace(/\s+/g, '');
};

/**
 * @param {number} ms
 */
const waitMs = async (ms) => {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const test = async () => {
  assert.equal(typeof middleware, 'function');
  const { baseUrl, dir, driver, fileEvents } = await setup();
  await fs.promises.writeFile(path.join(dir, 'page.css'), 'h1{color:#F00;}');
  await fs.promises.writeFile(
    path.join(dir, 'page.html'),
    [
      '<!DOCTYPE html>',
      '<link rel="stylesheet" href="page.css">',
      '<title>Test</title>',
      '<body>',
      '<h1>Hello World</h1>',
      '</body>',
    ].join('\n'),
  );
  await Promise.all([
    driver.get(`${baseUrl}/page.html`),
    fileEvents.waitForEvent('add', /page\.css$/, 10000),
  ]);
  assert.equal(await getColor(driver, 'h1'), 'rgb(255,0,0)');
  await Promise.all([
    fs.promises.writeFile(path.join(dir, 'page.css'), 'h1{color:#00F;}'),
    fileEvents.waitForEvent('change', /page\.css$/, 10000),
  ]);
  const startedAt = Date.now();
  const timeoutMs = 3000;
  while (1) {
    if (timeoutMs < Date.now() - startedAt) {
      throw new Error('Timeout');
    }
    const color = await getColor(driver, 'h1');
    if (color === 'rgb(0,0,255)') {
      break;
    }
    await waitMs(100);
  }
};

/**
 * @param {boolean} passed
 */
const markResult = async (passed) => {
  if (!useBrowserStack) {
    return;
  }
  for (const session of sessions) {
    const endpoint = new URL('https://api.browserstack.com');
    endpoint.pathname = `/automate/sessions/${session.getId()}.json`;
    endpoint.username = userName;
    endpoint.password = accessKey;
    /** @type {import('http').ServerResponse} */
    const res = await new Promise((resolve, reject) => {
      const req = https.request(endpoint, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
      });
      req.once('error', reject);
      req.once('response', resolve);
      req.write(JSON.stringify({ status: passed ? 'passed' : 'failed' }));
      req.end();
    });
    console.log(`${res.statusCode} ${res.statusMessage}`);
  }
};

test()
  .then(
    async () => await markResult(true),
    async (error) => {
      await markResult(false);
      throw error;
    },
  )
  .then(closeAll, async (error) => {
    console.error(error);
    await closeAll();
    process.exit(1);
  });

/* eslint-disable no-console */
/* eslint-disable import/unambiguous */
/* eslint-disable import/no-commonjs */
//@ts-check
const assert = require('assert');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { Builder, Browser } = require('selenium-webdriver');
const { middleware, LogLevel } = require('./lib/middleware.js');

/** @type {Set<() => Promise<void | unknown>>} */
const closeFunctions = new Set();

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
   * @param {number} [timeoutMs]
   * @param {number} [initFromTime]
   * @returns {Promise<EventLog>}
   */
  const waitForEvent = async (
    name,
    file,
    timeoutMs = 3000,
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

const getDriver = async () => {
  if (process.env.BROWSERSTACK_BROWSERNAME) {
    const capability = {
      'browserName': process.env.BROWSERSTACK_BROWSERNAME,
      'bstacks:options': {
        os: process.env.BROWSERSTACK_OS,
        osVersion: process.env.BROWSERSTACK_OS_VERSION,
        browserVersion: process.env.BROWSERSTACK_BROWSER_VERSION,
      },
    };
    const serverUrl = new URL('https://hub-cloud.browserstack.com/wd/hub');
    serverUrl.username = `${process.env.BROWSERSTACK_USERNAME}`;
    serverUrl.password = `${process.env.BROWSERSTACK_ACCESS_KEY}`;
    return await new Builder()
      .usingServer(`${serverUrl}`)
      .withCapabilities(capability)
      .build();
  }
  return await new Builder().forBrowser(Browser.CHROME).build();
};

const setup = async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-client-'));
  const driver = await getDriver();
  closeFunctions.add(async () => await driver.quit());
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
  if (typeof address === 'string' || address === null) {
    throw new Error('Server address is not available');
  }
  const baseUrl = `http://localhost:${address.port}`;
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
  await fs.promises.writeFile(
    path.join(dir, 'page.css'),
    'h1 { color: rgb(255,0,0); }',
  );
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
    fileEvents.waitForEvent('add', /page\.css$/, 1000),
  ]);
  assert.equal(await getColor(driver, 'h1'), 'rgb(255,0,0)');
  await Promise.all([
    fs.promises.writeFile(
      path.join(dir, 'page.css'),
      'h1 { color: rgb(0,0,255); }',
    ),
    fileEvents.waitForEvent('change', /page\.css$/, 1000),
  ]);
  const startedAt = Date.now();
  const timeoutMs = 1000;
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

test().then(closeAll, async (error) => {
  console.error(error);
  await closeAll();
  process.exit(1);
});

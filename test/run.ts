/* eslint-disable require-atomic-updates */
/**
 * https://www.browserstack.com/question/664
 * Question: What ports can I use to test development environments or private
 * servers using BrowserStack?
 * → We support all ports for all browsers other than Safari.
 */
import type {TestFn} from 'ava';
import anyTest from 'ava';
import type * as BrowserStack from 'browserstack-local';
import * as connect from 'connect';
import {promises as afs} from 'fs';
import * as http from 'http';
import * as selenium from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import {URL} from 'url';
import {middleware} from '../src';
import {copy} from '../src/copy';
import {capabilities} from './util/capabilities';
import {browserStack} from './util/constants';
import {createBrowserStackLocal} from './util/createBrowserStackLocal';
import {markResult} from './util/markResult';

interface ITextContext {
    session?: selenium.Session,
    builder?: selenium.Builder,
    driver?: selenium.ThenableWebDriver,
    bsLocal?: BrowserStack.Local,
    passed?: boolean,
    server?: http.Server,
}

const test = anyTest as TestFn<ITextContext>;
const testDirectory = new URL('.', import.meta.url);
const directory = {
    src: new URL('src', testDirectory),
    webroot: new URL('webroot', testDirectory),
    output: new URL('output', testDirectory),
    test1: new URL('test-1', testDirectory),
    test2: new URL('test-2', testDirectory),
    test3: new URL('test-3', testDirectory),
};
const createServer = async (
    port: number,
    host: string,
    onError: (error: unknown) => void,
): Promise<http.Server> => {
    const app = connect();
    app.use(middleware({logLevel: 0, documentRoot: directory.webroot}));
    return await new Promise((resolve, reject) => {
        const server = http.createServer(app);
        server.once('error', reject);
        server.once('listening', () => {
            server.removeListener('error', reject);
            server.once('error', onError);
            resolve(server);
        });
        server.listen(port, host);
    });
};

test.afterEach(async ({context: {session, driver, server, bsLocal, passed}}) => {
    await Promise.all([
        session && markResult(session, passed || false),
        driver && driver.quit(),
        server && new Promise<void>((resolve, reject) => {
            server.close((error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        }),
        bsLocal && new Promise<void>((resolve) => {
            bsLocal.stop(resolve);
        }),
    ]);
});

capabilities.forEach((capability, index) => {
    const {'bstack:options': bstack} = capability;
    const name = bstack.sessionName;
    const subTitle = `${bstack.os || bstack.deviceName || '-'} ${capability.browserName}`;
    test.serial(`#${index + 1} ${name} ${subTitle}`, async (t) => {
        t.timeout(120000);
        await copy(directory.src, directory.webroot);
        await afs.mkdir(directory.output, {recursive: true});
        const port = 9200 + index;
        const host = (/safari/i).test(capability.browserName) ? 'bs-local.com' : 'localhost';
        const baseURL = new URL(`http://${host}:${port}`);
        t.context.server = await createServer(port, host, t.log);
        const builder = new selenium.Builder().withCapabilities(capability);
        t.context.builder = builder;
        if (browserStack) {
            builder.usingServer(browserStack.server);
            t.context.bsLocal = await createBrowserStackLocal({
                accessKey: browserStack.accessKey,
                port,
                localIdentifier: bstack.localIdentifier,
            });
        } else {
            builder.setChromeOptions(new chrome.Options().addArguments('--auto-open-devtools-for-tabs'));
        }
        const driver = t.context.driver = builder.build();
        t.context.session = await driver.getSession();
        await driver.get(`${new URL('/', baseURL)}`);
        for (const testName of ['test-1', 'test-2', 'test-3']) {
            t.log(`Title: ${await driver.getTitle()}`);
            await copy(new URL(testName, testDirectory), directory.webroot);
            await driver.wait(selenium.until.titleIs(`passed: ${testName}`), 5000);
            const base64 = await driver.takeScreenshot();
            const screenShot = Buffer.from(base64, 'base64');
            await afs.writeFile(new URL(`${Date.now()}-${testName}.png`, directory.output), screenShot);
        }
        t.context.passed = true;
        t.pass();
    });
});

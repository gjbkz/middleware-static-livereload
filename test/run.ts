/**
 * https://www.browserstack.com/question/664
 * Question: What ports can I use to test development environments or private
 * servers using BrowserStack?
 * → We support all ports for all browsers other than Safari.
 */
import type {TestInterface} from 'ava';
import anyTest from 'ava';
import {URL} from 'url';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';
import * as selenium from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import type * as BrowserStack from 'browserstack-local';
import * as connect from 'connect';
import {browserStack} from './util/constants';
import {createBrowserStackLocal} from './util/createBrowserStackLocal';
import {markResult} from './util/markResult';
import {capabilities} from './util/capabilities';
import {copy} from './copy';
import {middleware} from '..';
const {promises: afs} = fs;

interface ITextContext {
    session?: selenium.Session,
    builder?: selenium.Builder,
    driver?: selenium.ThenableWebDriver,
    bsLocal?: BrowserStack.Local,
    passed?: boolean,
    server?: http.Server,
}

const test = anyTest as TestInterface<ITextContext>;

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
    const name = capability['bstack:options'].sessionName;
    const directory = {
        src: path.join(__dirname, 'src'),
        webroot: path.join(__dirname, 'webroot'),
        output: path.join(__dirname, 'output'),
        test1: path.join(__dirname, 'test-1'),
        test2: path.join(__dirname, 'test-2'),
        test3: path.join(__dirname, 'test-3'),
    };
    const subTitle = [
        capability['bstack:options'].os || capability['bstack:options'].deviceName || '-',
        capability.browserName,
    ].join(' ');
    test.serial(`#${index + 1} ${name} ${subTitle}`, async (t) => {
        t.timeout(120000);
        await Promise.all([
            copy(directory.src, directory.webroot),
            afs.mkdir(directory.output, {recursive: true}),
        ]);
        const port = 9200 + index;
        const host = (/safari/i).test(capability.browserName) ? 'bs-local.com' : 'localhost';
        const baseURL = new URL(`http://${host}:${port}`);
        {
            const app = connect();
            app.use(middleware({logLevel: 0, documentRoot: directory.webroot}));
            t.context.server = await new Promise((resolve, reject) => {
                const server = http.createServer(app);
                server.once('error', reject);
                server.once('listening', () => {
                    server.removeListener('error', reject);
                    server.once('error', t.log);
                    resolve(server);
                });
                server.listen(port, host);
            });
        }
        const builder = new selenium.Builder().withCapabilities(capability);
        t.context.builder = builder;
        if (browserStack) {
            builder.usingServer(browserStack.server);
            t.context.bsLocal = await createBrowserStackLocal({
                accessKey: browserStack.accessKey,
                port,
                localIdentifier: capability['bstack:options'].localIdentifier,
            });
        } else {
            builder.setChromeOptions(new chrome.Options().addArguments('--auto-open-devtools-for-tabs'));
        }
        const driver = t.context.driver = builder.build();
        t.context.session = await driver.getSession();
        await driver.get(`${new URL('/', baseURL)}`);
        for (const testName of ['test-1', 'test-2', 'test-3']) {
            t.log(`Title: ${await driver.getTitle()}`);
            await copy(path.join(__dirname, testName), directory.webroot);
            await driver.wait(selenium.until.titleIs(`passed: ${testName}`), 5000);
            const base64 = await driver.takeScreenshot();
            const screenShot = Buffer.from(base64, 'base64');
            await afs.writeFile(path.join(directory.output, `${Date.now()}-${testName}.png`), screenShot);
        }
        t.context.passed = true;
        t.pass();
    });
});

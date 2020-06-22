import anyTest, {TestInterface, ExecutionContext} from 'ava';
import {URL} from 'url';
import * as path from 'path';
import * as fs from 'fs';
import * as childProcess from 'child_process';
import * as selenium from 'selenium-webdriver';
import * as BrowserStack from 'browserstack-local';
import {browserStack} from './util/constants';
import {spawn} from './util/spawn';
import {createBrowserStackLocal} from './util/createBrowserStackLocal';
import {markResult} from './util/markResult';
import {getCapabilities} from './util/getCapabilities';
import {ISpawnParameters} from './util/types';
const {promises: afs} = fs;

interface ITextContext {
    session?: selenium.Session,
    builder?: selenium.Builder,
    driver?: selenium.ThenableWebDriver,
    bsLocal?: BrowserStack.Local,
    port: number,
    passed: boolean,
    processes: Array<{
        process: childProcess.ChildProcess,
        exit: boolean,
    }>,
    run: (
        t: ExecutionContext<ITextContext>,
        parameters: ISpawnParameters,
    ) => void,
}

const test = anyTest as TestInterface<ITextContext>;

/**
 * https://www.browserstack.com/question/664
 * Question: What ports can I use to test development environments or private
 * servers using BrowserStack?
 * → We support all ports for all browsers other than Safari.
 */
let port = 9200;
test.beforeEach((t) => {
    Object.assign(t.context, {
        passed: false,
        port: port++,
        processes: [],
        run(
            t: ExecutionContext<ITextContext>,
            parameters: ISpawnParameters,
        ) {
            const subProcess = childProcess.spawn(
                parameters.command,
                parameters.args || [],
                {
                    ...parameters.options || {},
                    shell: true,
                },
            )
            .on('error', (error) => t.fail(`${error as {toString: () => string}}`));
            t.context.processes.push({
                process: subProcess,
                exit: false,
            });
        },
    });
});

test.afterEach(async (t) => {
    if (t.context.session) {
        await markResult(t.context.session, t.context.passed);
    }
    if (t.context.driver) {
        await t.context.driver.quit();
    }
    await new Promise((resolve) => t.context.bsLocal ? t.context.bsLocal.stop(resolve) : resolve());
    for (const {process, exit} of t.context.processes) {
        if (!exit) {
            process.kill();
        }
    }
});

const testDirectories = fs.readdirSync(__dirname)
.filter((name) => {
    try {
        return fs.statSync(path.join(__dirname, name, 'package.json')).isFile();
    } catch (error) {
        return false;
    }
});

const build = async (
    testDirectory: string,
) => {
    const spawnOptions: childProcess.SpawnOptionsWithoutStdio = {
        cwd: testDirectory,
        shell: true,
    };
    await spawn({command: 'npm install', options: spawnOptions});
    await spawn({command: 'npm run build', options: spawnOptions});
};

getCapabilities(testDirectories).forEach((capability, index) => {
    const name = capability['bstack:options'].sessionName;
    const testDirectory = path.join(__dirname, name);
    const outputDirectory = path.join(__dirname, name, 'output');
    const subTitle = [
        capability['bstack:options'].os || capability['bstack:options'].deviceName || '-',
        capability.browserName,
    ].join(' ');
    test.serial(`#${index + 1} ${name} ${subTitle}`, async (t) => {
        await Promise.all([
            build(testDirectory),
            afs.mkdir(outputDirectory, {recursive: true}),
        ]);
        const host = (/safari/i).test(capability.browserName) ? 'bs-local.com' : 'localhost';
        const baseURL = new URL(`http://${host}:${t.context.port}`);
        t.context.run(t, {
            command: `npm run dev -- --port ${baseURL.port} --host ${host}`,
            options: {cwd: testDirectory},
        });
        const builder = new selenium.Builder().withCapabilities(capability);
        t.context.builder = builder;
        if (browserStack) {
            builder.usingServer(browserStack.server);
            t.context.bsLocal = await createBrowserStackLocal({
                accessKey: browserStack.key,
                port: t.context.port,
                localIdentifier: capability['bstack:options'].localIdentifier,
            });
        }
        const driver = t.context.driver = builder.build();
        t.context.session = await driver.getSession();
        await driver.get(`${new URL('/', baseURL)}`);
        t.is(await driver.getTitle(), name);
        const tests = Object.keys(
            (JSON.parse(
                await afs.readFile(
                    path.join(testDirectory, 'package.json'),
                    'utf8',
                ),
            ) as {scripts: {[key: string]: string}})
            .scripts,
        )
        .filter((command) => command.startsWith('test-'));
        for (const testCommand of tests) {
            t.context.run(t, {
                command: `npm run ${testCommand}`,
                options: {cwd: testDirectory},
            });
            await driver.wait(selenium.until.titleIs(`passed: ${testCommand}`), 5000);
            const base64 = await driver.takeScreenshot();
            const screenShot = Buffer.from(base64, 'base64');
            await afs.writeFile(path.join(outputDirectory, `${Date.now()}-${testCommand}.png`), screenShot);
        }
        t.context.passed = true;
    });
});

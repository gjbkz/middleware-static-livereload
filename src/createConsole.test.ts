import test from 'ava';
import * as stream from 'stream';
import {LogLevel} from './types';
import {createConsole} from './createConsole';

interface ITest {
    logLevel: LogLevel,
    logs: Array<['debug' | 'info' | 'error', string | number]>,
    expected: {
        stdout: string,
        stderr: string,
    },
}

([
    {
        logLevel: LogLevel.debug,
        logs: [
            ['debug', 'AAA'],
            ['info', 'BBB'],
            ['error', 'CCC'],
            ['debug', 'DDD'],
            ['info', 'EEE'],
            ['error', 'FFF'],
        ],
        expected: {
            stdout: [
                'AAA',
                'BBB',
                'DDD',
                'EEE',
                '',
            ].join('\n'),
            stderr: [
                'CCC',
                'FFF',
                '',
            ].join('\n'),
        },
    },
    {
        logLevel: LogLevel.info,
        logs: [
            ['debug', 'AAA'],
            ['info', 'BBB'],
            ['error', 'CCC'],
            ['debug', 'DDD'],
            ['info', 'EEE'],
            ['error', 'FFF'],
        ],
        expected: {
            stdout: [
                'BBB',
                'EEE',
                '',
            ].join('\n'),
            stderr: [
                'CCC',
                'FFF',
                '',
            ].join('\n'),
        },
    },
    {
        logLevel: LogLevel.error,
        logs: [
            ['debug', 'AAA'],
            ['info', 'BBB'],
            ['error', 'CCC'],
            ['debug', 'DDD'],
            ['info', 'EEE'],
            ['error', 'FFF'],
        ],
        expected: {
            stdout: '',
            stderr: [
                'CCC',
                'FFF',
                '',
            ].join('\n'),
        },
    },
    {
        logLevel: LogLevel.silent,
        logs: [
            ['debug', 'AAA'],
            ['info', 'BBB'],
            ['error', 'CCC'],
            ['debug', 'DDD'],
            ['info', 'EEE'],
            ['error', 'FFF'],
        ],
        expected: {
            stdout: '',
            stderr: '',
        },
    },
] as Array<ITest>).forEach(({logLevel, logs, expected}, index) => {
    test(`#${index + 1} logLevel: ${logLevel}`, (t) => {
        const stdoutResult: Array<Buffer> = [];
        const stdout = new stream.Writable({
            write(chunk, _encoding, callback) {
                stdoutResult.push(chunk);
                callback();
            },
        });
        const stderrResult: Array<Buffer> = [];
        const stderr = new stream.Writable({
            write(chunk, _encoding, callback) {
                stderrResult.push(chunk);
                callback();
            },
        });
        const console = createConsole({logLevel, stdout, stderr});
        for (const [method, message] of logs) {
            console[method](message);
        }
        console.stdout.end();
        console.stderr.end();
        t.is(`${Buffer.concat(stdoutResult)}`, expected.stdout);
        t.is(`${Buffer.concat(stderrResult)}`, expected.stderr);
    });
});


test('stdout and stderr', (t) => {
    const console = createConsole();
    t.is(console.stdout, process.stdout);
    t.is(console.stderr, process.stderr);
});

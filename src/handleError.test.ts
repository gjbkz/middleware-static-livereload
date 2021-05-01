import * as stream from 'stream';
import test from 'ava';
import {handleError} from './handleError';
import type {ServerResponseLike} from './types';
import {createConsole} from './createConsole';

test('404', (t) => {
    let endIsCalled = 0;
    const written: Array<Buffer> = [];
    const writable = new stream.Writable({
        write(chunk, _encoding, callback) {
            written.push(chunk);
            callback();
        },
    });
    const console = createConsole({stdout: writable, stderr: writable});
    const res: ServerResponseLike = {end: () => endIsCalled++};
    const error = Object.assign(new Error(), {code: 'ENOENT'});
    handleError('', res, error, console);
    t.is(res.statusCode, 404);
    t.is(endIsCalled, 1);
});

test('500', (t) => {
    let endIsCalled = 0;
    const written: Array<Buffer> = [];
    const writable = new stream.Writable({
        write(chunk, _encoding, callback) {
            written.push(chunk);
            callback();
        },
    });
    const console = createConsole({stdout: writable, stderr: writable});
    const res: ServerResponseLike = {end: () => endIsCalled++};
    const error = Object.assign(new Error(), {code: 'ERROR'});
    handleError('', res, error, console);
    t.is(res.statusCode, 500);
    t.is(endIsCalled, 1);
});

test('401', (t) => {
    let endIsCalled = 0;
    const written: Array<Buffer> = [];
    const writable = new stream.Writable({
        write(chunk, _encoding, callback) {
            written.push(chunk);
            callback();
        },
    });
    const console = createConsole({stdout: writable, stderr: writable});
    const res: ServerResponseLike = {
        headersSent: true,
        statusCode: 401,
        end: () => endIsCalled++,
    };
    const error = Object.assign(new Error(), {code: 'ERROR'});
    handleError('', res, error, console);
    t.is(res.statusCode, 401);
    t.is(endIsCalled, 1);
});

test('Ended', (t) => {
    let endIsCalled = 0;
    const written: Array<Buffer> = [];
    const writable = new stream.Writable({
        write(chunk, _encoding, callback) {
            written.push(chunk);
            callback();
        },
    });
    const console = createConsole({stdout: writable, stderr: writable});
    const res: ServerResponseLike = {
        writableEnded: true,
        statusCode: 200,
        end: () => endIsCalled++,
    };
    const error = Object.assign(new Error(), {code: 'ERROR'});
    handleError('', res, error, console);
    t.is(res.statusCode, 200);
    t.is(endIsCalled, 0);
});

import * as util from 'util';
import {LogLevel, IConsole} from './types';
import {createWriter} from './createWriter';

export const createConsole = (
    parameters: {
        logLevel?: LogLevel,
        stdout?: NodeJS.WritableStream,
        stderr?: NodeJS.WritableStream,
        inspectOptions?: util.InspectOptions,
    } = {},
): IConsole => {
    const inspectOptions = {
        colors: true,
        breakLength: 40,
        ...parameters.inspectOptions,
    };
    const stdout = createWriter(parameters.stdout || process.stdout, inspectOptions);
    const stderr = createWriter(parameters.stderr || process.stderr, inspectOptions);
    const ignore = () => {};
    const logLevel = 'logLevel' in parameters ? parameters.logLevel : LogLevel.info;
    switch (logLevel) {
    case LogLevel.silent:
        return {logLevel, debug: ignore, info: ignore, error: ignore};
    case LogLevel.error:
        return {logLevel, debug: ignore, info: ignore, error: stderr};
    case LogLevel.info:
        return {logLevel, debug: ignore, info: stdout, error: stderr};
    case LogLevel.debug:
        return {logLevel, debug: stdout, info: stdout, error: stderr};
    default:
        throw new Error(`Invalid logLevel: ${logLevel}`);
    }
};

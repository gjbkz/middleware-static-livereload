import * as util from 'util';
import {LogLevel, IConsole} from './types';
import {createWriter} from './createWriter';

interface IParameters {
    stdout: NodeJS.WritableStream,
    stderr: NodeJS.WritableStream,
    logLevel: LogLevel,
    inspectOptions: util.InspectOptions,
}

export const createConsole = (
    parameters: IParameters,
): IConsole => {
    const stdout = createWriter(parameters.stdout, parameters.inspectOptions);
    const stderr = createWriter(parameters.stderr, parameters.inspectOptions);
    const ignore = () => {};
    switch (parameters.logLevel) {
    case LogLevel.silent:
        return {debug: ignore, info: ignore, error: ignore};
    case LogLevel.error:
        return {debug: ignore, info: ignore, error: stderr};
    case LogLevel.info:
        return {debug: ignore, info: stdout, error: stderr};
    case LogLevel.debug:
        return {debug: stdout, info: stdout, error: stderr};
    default:
        throw new Error(`Invalid logLevel: ${parameters.logLevel}`);
    }
};

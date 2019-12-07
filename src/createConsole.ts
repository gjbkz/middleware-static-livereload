import {LogLevel, IConsole, IOptions} from './types';
import {createWriter} from './createWriter';

const createNoop = () => () => {
    // noop
};

export const createConsole = (
    parameters: IOptions = {},
): IConsole => {
    const inspectOptions = {
        colors: true,
        breakLength: 40,
        ...parameters.inspectOptions,
    };
    const stdout = parameters.stdout || process.stdout;
    const stderr = parameters.stderr || process.stderr;
    const out = createWriter(stdout, inspectOptions);
    const err = createWriter(stderr, inspectOptions);
    const ignore = Object.assign(createNoop(), {end: createNoop()});
    const logLevel = 'logLevel' in parameters ? parameters.logLevel : LogLevel.info;
    switch (logLevel) {
    case LogLevel.silent:
        return {logLevel, debug: ignore, info: ignore, error: ignore, stdout, stderr};
    case LogLevel.error:
        return {logLevel, debug: ignore, info: ignore, error: err, stdout, stderr};
    case LogLevel.info:
        return {logLevel, debug: ignore, info: out, error: err, stdout, stderr};
    case LogLevel.debug:
        return {logLevel, debug: out, info: out, error: err, stdout, stderr};
    default:
        throw new Error(`Invalid logLevel: ${logLevel}`);
    }
};

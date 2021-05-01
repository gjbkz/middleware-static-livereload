import * as console from 'console';
import type * as util from 'util';
import type {Writable} from 'stream';
import {stringify} from './stringify';

export const createWriter = (
    stream: Writable,
    inspectOptions: util.InspectOptions,
) => (...args: Array<unknown>) => {
    const message = args.map((arg) => stringify(arg, inspectOptions)).join(' ');
    if (stream.writable) {
        stream.write(`${message}\n`);
    } else {
        console.warn(`console is not writable: ${message}`);
    }
};

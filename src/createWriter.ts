import * as console from 'console';
import type {Writable} from 'stream';
import type * as util from 'util';
import {stringify} from './stringify.ts';

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

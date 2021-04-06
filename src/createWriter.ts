import type * as util from 'util';
import type {Writable} from 'stream';
import {stringify} from './stringify';
import type {ILog} from './types';

export const createWriter = (
    stream: Writable,
    inspectOptions: util.InspectOptions,
): ILog => (...args: Array<any>) => {
    const message = args.map((arg) => stringify(arg, inspectOptions)).join(' ');
    if (stream.writable) {
        stream.write(`${message}\n`);
    } else {
        console.log(`console is not writable: ${message}`);
    }
};

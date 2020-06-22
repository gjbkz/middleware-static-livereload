import * as util from 'util';
import {stringify} from './stringify';
import {ILog} from './types';

export const createWriter = (
    stream: NodeJS.WritableStream,
    inspectOptions: util.InspectOptions,
): ILog => (...args: Array<any>) => {
    const message = args.map((arg) => stringify(arg, inspectOptions)).join(' ');
    if (stream.writable) {
        stream.write(`${message}\n`);
    } else {
        console.log(`console is not writable: ${message}`);
    }
};

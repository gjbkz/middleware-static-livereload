import * as util from 'util';
import {stringify} from './stringify';
import {ILog} from './types';

export const createWriter = (
    stream: NodeJS.WritableStream,
    inspectOptions: util.InspectOptions,
): ILog => (...args: Array<any>) => {
    stream.write(`${args.map((arg) => stringify(arg, inspectOptions)).join(' ')}\n`);
};

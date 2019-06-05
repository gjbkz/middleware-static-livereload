import * as util from 'util';
import {stringify} from './stringify';
import {ILog} from './types';

export const createWriter = (
    stream: NodeJS.WritableStream,
    inspectOptions: util.InspectOptions,
): ILog => (...args: Array<any>) => {
    args.forEach((arg, index) => {
        stream.write(`${index === 0 ? '' : ' '}${stringify(arg, inspectOptions)}`);
    });
    stream.write('\n');
};

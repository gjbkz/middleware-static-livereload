import * as util from 'util';

export const stringify = (item: unknown, inspectOptions: util.InspectOptions): string => {
    if (typeof item === 'string') {
        return item.trim();
    }
    return util.inspect(item, inspectOptions).trim();
};

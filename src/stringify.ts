import * as util from 'util';

export const stringify = (
    item: any,
    inspectOptions: util.InspectOptions,
): string => {
    if (typeof item === 'string') {
        return item;
    }
    return util.inspect(item, inspectOptions);
};

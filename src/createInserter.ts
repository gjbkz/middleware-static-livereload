import {ensureArray} from './ensureArray';
import type {Options} from './types';

export const defaultInsertBefore = [
    /<\/head/i,
    /<\/body/i,
    /<meta/i,
    /<title/i,
    /<script/i,
    /<link/i,
];

export const defaultInsertAfter = [
    /<!doctype\s*html\s*>/i,
];

export const createInserter = (
    options: Options = {},
) => {
    const [insertBefore, insertAfter] = (options.insertBefore || options.insertAfter) ? [
        ensureArray(options.insertBefore || []),
        ensureArray(options.insertAfter || []),
    ] : [defaultInsertBefore, defaultInsertAfter];
    return (
        input: string,
        insertee: Buffer | string,
    ): string | null => {
        for (const pattern of insertBefore) {
            const result = input.replace(pattern, `${insertee}$&`);
            if (result !== input) {
                return result;
            }
        }
        for (const pattern of insertAfter) {
            const result = input.replace(pattern, `$&${insertee}`);
            if (result !== input) {
                return result;
            }
        }
        return null;
    };
};

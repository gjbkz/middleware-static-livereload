import {ensureArray} from './ensureArray';

export const defaultInsertBefore = [
    /<\/head/i,
    /<\/body/i,
    /<meta/i,
    /<title/i,
    /<script/i,
    /<link/i,
    /<script/i,
];

export const defaultInsertAfter = [
    /<!doctype\s*html\s*>/i,
];

export const createInserter = (
    options: {
        insertBefore?: string | RegExp | Array<string | RegExp>,
        insertAfter?: string | RegExp | Array<string | RegExp>,
    } = {},
) => {
    const [insertBefore, insertAfter] = (options.insertBefore || options.insertAfter) ? [
        ensureArray(options.insertBefore || []),
        ensureArray(options.insertAfter || []),
    ] : [defaultInsertBefore, defaultInsertAfter];
    return (
        input: string,
        insertee: string | Buffer,
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

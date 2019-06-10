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
    const [insertBefore, insertAfter] = (options.insertBefore || options.insertAfter)
    ? [ensureArray(options.insertBefore || []), ensureArray(options.insertAfter || [])]
    : [defaultInsertBefore, defaultInsertAfter];
    return (
        input: string,
        insertee: string | Buffer,
    ): string | null => {
        let done = false;
        let result = input;
        for (const pattern of insertBefore) {
            result = input.replace(pattern, (match) => {
                done = true;
                return `${insertee}${match}`;
            });
            if (done) {
                return result;
            }
        }
        for (const pattern of insertAfter) {
            result = input.replace(pattern, (match) => {
                done = true;
                return `${match}${insertee}`;
            });
            if (done) {
                return result;
            }
        }
        return null;
    };
};

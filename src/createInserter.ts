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
        for (const pattern of insertBefore) {
            const match = input.match(pattern);
            if (match) {
                return `${insertee}\n${match[0]}`;
            }
        }
        for (const pattern of insertAfter) {
            const match = input.match(pattern);
            if (match) {
                return `${match[0]}\n${insertee}`;
            }
        }
        return null;
    };
};

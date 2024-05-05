import * as path from 'path';
import {defaultContentTypes} from './defaultContentTypes.ts';
import type {Options} from './types.ts';

type ContentTypeGetter = (file: string) => string | null;

export const compileContentTypes = (
    overrides: Options['contentTypes'] = {},
): ContentTypeGetter => {
    const map = new Map<string, string>();
    for (const types of [defaultContentTypes, overrides]) {
        for (const [type, extensions] of Object.entries(types)) {
            for (const extension of extensions) {
                map.set(extension, type);
            }
        }
    }
    return (file: string) => map.get(path.extname(file)) ?? null;
};

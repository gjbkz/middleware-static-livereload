import * as path from 'path';
import {ensureArray} from './ensureArray';
import {IContentTypeGetter, IOptions} from './types';
import {defaultContentTypes} from './defaultContentTypes';

export const compileContentTypes = (
    overrides: IOptions['contentTypes'] = {},
): IContentTypeGetter => {
    const map = new Map<string, string>();
    for (const types of [defaultContentTypes, overrides]) {
        for (const [type, extensions] of Object.entries(types)) {
            for (const extension of ensureArray(extensions)) {
                map.set(extension, type);
            }
        }
    }
    return (file: string) => map.get(path.extname(file)) || null;
};

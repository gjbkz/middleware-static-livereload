import * as path from 'path';
import {ensureArray} from './ensureArray';
import {IContentTypeGetter} from './types';

export const defaultContentTypes = {
    'image/png': ['.png'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/svg+xml': ['.svg'],
    'image/tiff': ['.tiff'],
    'image/heif': ['.heif'],
    'image/heic': ['.heic'],
    'text/javascript': ['.js'],
    'text/css': ['.css'],
    'font/otf': ['.otf'],
    'font/ttf': ['.ttf'],
    'font/woff': ['.woff'],
    'font/woff2': ['.woff2'],
    'text/html': ['.html', '.htm'],
    'text/plain': ['.txt', '.log'],
    'application/json': ['.json'],
    'image/vnd.microsoft.icon': ['.ico'],
};

export const compileContentTypes = (
    overrides: {
        [type: string]: string | Array<string>,
    } = {},
): IContentTypeGetter => {
    const map = new Map<string, string>();
    for (const [type, extensions] of Object.entries({...defaultContentTypes, ...overrides})) {
        for (const extension of ensureArray(extensions)) {
            map.set(extension, type);
        }
    }
    return (file: string) => map.get(path.extname(file)) || null;
};

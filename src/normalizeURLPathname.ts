import * as path from 'path';
import type {URL} from 'url';

export const normalizeURLPathname = (
    url: URL,
    index: string,
) => url.pathname.replace(/\/$/, index).split('/').join(path.sep);

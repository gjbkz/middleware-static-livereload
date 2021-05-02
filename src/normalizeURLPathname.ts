import * as path from 'path';
import type {URL} from 'url';

export const normalizeURLPathname = ({pathname}: URL, index: string) => pathname
.replace(/\/$/, index)
.split('/')
.join(path.sep);

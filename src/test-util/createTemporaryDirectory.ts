import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

export const createTemporaryDirectory = (
    prefix = 'temp-',
): string => fs.mkdtempSync(path.join(os.tmpdir(), prefix));

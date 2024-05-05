import * as path from 'path';
import {fileURLToPath} from 'url';
import {compileContentTypes} from './compileContentTypes.ts';
import {createConnectionHandler} from './createConnectionHandler.ts';
import {createConsole} from './createConsole.ts';
import {createFileFinder} from './createFileFinder.ts';
import {createFileWatcher} from './createFileWatcher.ts';
import {createSnippetInjector} from './createSnippetInjector.ts';
import type {Options} from './types.ts';

export const getTools = (options: Options = {}) => {
    const clientScriptPath = `/${options.scriptPath ?? 'middleware-static-livereload.js'}`.replace(/^\/+/, '/');
    const findFile = createFileFinder(options, {
        [clientScriptPath]: new URL('client-script.js', import.meta.url),
    });
    const console = createConsole(options);
    const handleConnection = createConnectionHandler({console});
    const fileWatcher = createFileWatcher(options);
    if (fileWatcher) {
        fileWatcher.on('all', (eventName, file) => {
            console.debug(`${eventName}: ${file}`);
            const documentRoot = findFile.documentRoots.find((url) => file.startsWith(fileURLToPath(url)));
            if (documentRoot) {
                handleConnection.sendEvent(
                    path.relative(fileURLToPath(documentRoot), file).split(path.sep).join('/'),
                    eventName,
                );
            } else {
                console.error(new Error('Cannot find a documentRoot'));
            }
        });
    }
    return {
        console,
        findFile,
        handleConnection,
        fileWatcher,
        injectSnippet: createSnippetInjector(options, `<script id="middleware-static-livereload" src="${clientScriptPath}" defer></script>`),
        getContentType: compileContentTypes(options.contentTypes),
        connectionPath: `${clientScriptPath}/connect`,
    };
};

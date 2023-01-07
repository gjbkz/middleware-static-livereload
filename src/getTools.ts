import * as path from 'path';
import {fileURLToPath} from 'url';
import {createFileFinder} from './createFileFinder';
import {createConsole} from './createConsole';
import {compileContentTypes} from './compileContentTypes';
import {createSnippetInjector} from './createSnippetInjector';
import {createConnectionHandler} from './createConnectionHandler';
import {createFileWatcher} from './createFileWatcher';
import type {Options} from './types';

export const getTools = (options: Options = {}) => {
    const clientScriptPath = `/${options.scriptPath || 'middleware-static-livereload.js'}`.replace(/^\/+/, '/');
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

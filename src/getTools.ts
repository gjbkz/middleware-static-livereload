import * as path from 'path';
import {createFileFinder} from './createFileFinder';
import {createConsole} from './createConsole';
import {compileContentTypes} from './compileContentTypes';
import {createSnippetInjector} from './createSnippetInjector';
import {createConnectionHandler} from './createConnectionHandler';
import {createFileWatcher} from './createFileWatcher';
import type {IOptions} from './types';

export const getTools = (
    options: IOptions = {},
) => {
    const clientScriptPath = `/${options.scriptPath || 'middleware-static-livereload.js'}`.replace(/^\/+/, '/');
    const findFile = createFileFinder(options, {
        [clientScriptPath]: path.join(__dirname, 'client-script.js'),
    });
    const console = createConsole(options);
    const handleConnection = createConnectionHandler({console});
    const fileWatcher = createFileWatcher(options);
    if (fileWatcher) {
        fileWatcher.on('all', (eventName, file) => {
            console.debug(`${eventName}: ${file}`);
            const documentRoot = findFile.documentRoots.find((pathString) => file.startsWith(pathString));
            if (documentRoot) {
                handleConnection.sendEvent(
                    path.relative(documentRoot, file).split(path.sep).join('/'),
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

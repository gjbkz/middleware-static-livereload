import * as path from 'path';
import {createFileFinder} from './createFileFinder';
import {createConsole} from './createConsole';
import {compileContentTypes} from './compileContentTypes';
import {createSnippetInjector} from './createSnippetInjector';
import {createConnectionHandler} from './createConnectionHandler';
import {createWatcher} from './createWatcher';
import {IOptions} from './types';

export const getTools = (
    options: IOptions = {},
) => {
    const prefix = `${options.scriptPrefix || 'middleware-static-livereload'}`.replace(/^\/*/, '/');
    const clientScriptPath = `${prefix}/script.js`;
    const findFile = createFileFinder(options, {
        [clientScriptPath]: path.join(__dirname, 'client', 'script.js'),
        [`${clientScriptPath}/polyfill.js`]: require.resolve('event-source-polyfill/src/eventsource.min.js'),
    });
    const console = createConsole(options);
    const handleConnection = createConnectionHandler({console});
    return {
        console,
        findFile,
        handleConnection,
        injectSnippet: createSnippetInjector(options, `<script id="middleware-static-livereload" src="${clientScriptPath}" defer></script>`),
        getContentType: compileContentTypes(options.contentTypes),
        watcher: createWatcher({
            console,
            chokidar: options.chokidar || {},
            sendEvent: handleConnection.sendEvent,
            documentRoots: findFile.documentRoots,
        }),
        connectionPath: `${clientScriptPath}/connect`,
    };
};

import * as path from 'path';
import {createFileFinder} from './createFileFinder';
import {createConsole} from './createConsole';
import {compileContentTypes} from './compileContentTypes';
import {createSnippetInjector} from './createSnippetInjector';
import {createConnectionHandler} from './createConnectionHandler';
import {createFileWatcher} from './createFileWatcher';
import {IOptions} from './types';

export const getTools = (
    options: IOptions = {},
) => {
    const prefix = `/${options.scriptPrefix || 'middleware-static-livereload'}`.replace(/^\/+/, '/');
    const clientScriptPath = `${prefix}.js`;
    const findFile = createFileFinder(options, {
        [clientScriptPath]: path.join(__dirname, 'client-script.js'),
        [`${clientScriptPath}/polyfill.js`]: require.resolve('event-source-polyfill/src/eventsource.min.js'),
    });
    const console = createConsole(options);
    const handleConnection = createConnectionHandler({console});
    const fileWatcher = createFileWatcher(options);
    if (fileWatcher) {
        fileWatcher.on('all', (eventName, file) => {
            console.debug(`${eventName}: ${file}`);
            const documentRoot = findFile.documentRoots.find((documentRoot) => file.startsWith(documentRoot));
            if (!documentRoot) {
                throw new Error('Cannot find a documentRoot');
            }
            handleConnection.sendEvent(
                path.relative(documentRoot, file).split(path.sep).join('/'),
                eventName,
            );
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

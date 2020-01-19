const http = require('http');
const connect = require('connect');
const console = require('console');
const app = connect();
const getHost = () => {
    const index = process.argv.indexOf('--host');
    let host = 'localhost';
    if (0 <= index) {
        host = process.argv[index + 1];
    }
    return host;
};
const getPort = () => {
    const index = process.argv.indexOf('--port');
    let port = 3000;
    if (0 <= index) {
        port = Number(process.argv[index + 1]);
    }
    if (0 < port) {
        return port;
    }
    throw new Error(`InvalidPort: ${port}`);
};

app.use(require('middleware-static-livereload').middleware({
    documentRoot: 'lib',
}));
const server = http.createServer(app);
server.once('error', (error) => {
    console.error(error);
    process.exit(1);
});
server.once('listening', () => console.log(server.address()));
server.listen(getPort(), getHost());

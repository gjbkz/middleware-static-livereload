/**
 * Development server for manual testing
 * Usage: node e2e/server.ts <documentRoot>
 */
import { createServer } from "node:http";
import { parseArgs } from "node:util";
import connect from "connect";
import { middleware } from "../src/middleware.ts";

const { positionals } = parseArgs({ allowPositionals: true });
const documentRoot = positionals.length > 0 ? positionals : [process.cwd()];
console.info(`documentRoot: ${documentRoot.join(" ")}`);

const app = connect();
app.use(middleware({ documentRoot, fileOperations: true }));

const server = createServer(app);
server.listen(3000, "localhost", () => {
	console.info("http://localhost:3000");
});

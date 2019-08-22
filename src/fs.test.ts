import * as path from 'path';
import anyTest, {TestInterface} from 'ava';
import {createTemporaryDirectory} from './test-util/createTemporaryDirectory';
import {mkdirpSync, stat, writeFile, writeFilep} from './fs';

const test = anyTest as TestInterface<{
    directory: string,
}>;

test.beforeEach(async (t) => {
    t.context.directory = await createTemporaryDirectory('fstest-');
});

test('creates a directory', async (t) => {
    const target = path.join(t.context.directory, 'foo', 'bar', 'baz');
    mkdirpSync(target);
    const stats = await stat(target);
    t.true(stats.isDirectory());
});

test('fails to create a directory on a file', async (t) => {
    const target = path.join(t.context.directory, 'foo');
    await writeFile(target, target);
    t.throws(() => mkdirpSync(target));
});

test('fails to write a file on a directory', async (t) => {
    const target = t.context.directory;
    await t.throwsAsync(async () => {
        await writeFilep(target, target);
    });
});

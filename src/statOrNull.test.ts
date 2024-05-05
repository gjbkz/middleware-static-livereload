import ava from 'ava';
import {statOrNull} from './statOrNull.ts';

ava('directory', async (t) => {
    const stats = await statOrNull(new URL('.', import.meta.url));
    t.true(stats?.isDirectory());
});

ava('file', async (t) => {
    const stats = await statOrNull(new URL(import.meta.url));
    t.true(stats?.isFile());
});

ava('null', async (t) => {
    const stats = await statOrNull(new URL(`${import.meta.url}--`));
    t.is(stats, null);
});

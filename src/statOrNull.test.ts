import ava from 'ava';
import {statOrNull} from './statOrNull';

ava('directory', async (t) => {
    const stats = await statOrNull(new URL('.', import.meta.url));
    t.true(stats && stats.isDirectory());
});

ava('file', async (t) => {
    const stats = await statOrNull(new URL(import.meta.url));
    t.true(stats && stats.isFile());
});

ava('null', async (t) => {
    const stats = await statOrNull(new URL(`${import.meta.url}--`));
    t.is(stats, null);
});

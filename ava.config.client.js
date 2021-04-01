export default {
    extensions: ['ts', 'js'],
    require: ['ts-node/register'],
    timeout: '2m',
    files: [
        'test/run.ts',
    ],
};

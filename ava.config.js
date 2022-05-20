export default {
    extensions: {ts: 'module'},
    nodeArguments: [
        '--loader=ts-node/esm',
        '--experimental-specifier-resolution=node',
    ],
    timeout: '2m',
    files: ['src/**/*.test.ts'],
};

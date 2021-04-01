export default {
    extensions: ['ts', 'js'],
    require: ['ts-node/register'],
    timeout: '2m',
    files: [
        'lib/**/*.test.js',
    ],
};

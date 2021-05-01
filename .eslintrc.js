module.exports = {
    ignorePatterns: [
        'test/src',
        'test/test-*',
    ],
    extends: [
        '@nlib/eslint-config',
    ],
    env: {
        es6: true,
        node: true,
    },
    rules: {
        '@nlib/no-globals': 'off',
        '@typescript-eslint/no-redeclare': 'off',
    },
    overrides: [
        {
            files: [
                '*.test.ts',
            ],
            rules: {
                'max-lines-per-function': 'off',
            },
        },
        {
            files: [
                'test/**',
            ],
            parserOptions: {
                project: 'tsconfig.base.json',
            },
            rules: {
                'max-lines-per-function': 'off',
                'no-console': 'off',
                'no-process-env': 'off',
                '@typescript-eslint/no-triple-slash-reference': 'off',
            },
        },
        {
            files: [
                'src/client-script.js',
                'test/*/{src,test-*}/**/*.js',
            ],
            env: {
                es6: false,
                browser: true,
                node: false,
            },
            rules: {
                'max-lines-per-function': 'off',
                'prefer-arrow-callback': 'off',
                'prefer-destructuring': 'off',
                'prefer-template': 'off',
                'func-style': [
                    'error',
                    'declaration',
                ],
                'no-restricted-syntax': [
                    'error',
                    'TemplateElement',
                    'ArrayPattern',
                    'ObjectPattern',
                    'ArrowFunctionExpression',
                ],
            },
        },
    ],
};

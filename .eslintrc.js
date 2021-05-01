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
        {
            files: [
                'src/types.ts',
                'src/stringify.ts',
                'src/createWriter.ts',
            ],
            rules: {
                '@typescript-eslint/no-explicit-any': 'off',
            },
        },
        {
            files: [
                'src/createWriter.ts',
            ],
            rules: {
                'no-console': 'off',
            },
        },
        {
            files: [
                'src/middleware.ts',
            ],
            rules: {
                '@typescript-eslint/no-floating-promises': 'off',
            },
        },
        {
            files: [
                'copy.ts',
                'test/**/*',
            ],
            rules: {
                'no-console': 'off',
            },
        },
        {
            files: [
                'test/run.ts',
            ],
            rules: {
                'require-atomic-updates': 'off',
            },
        },
        {
            files: [
                'test/util/createBrowserStackLocal.ts',
            ],
            rules: {
                '@typescript-eslint/no-unnecessary-condition': 'off',
            },
        },
        {
            files: [
                'src/LogLevel.ts',
            ],
            rules: {
                '@typescript-eslint/no-redeclare': 'off',
            },
        },
    ],
};

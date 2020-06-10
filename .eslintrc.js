module.exports = {
    env: {
        node: true,
        es6: true,
        commonjs: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:jest/recommended',
        'prettier',
        'prettier/@typescript-eslint',
    ],
    plugins: ['@typescript-eslint', 'jest'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
    rules: {
        '@typescript-eslint/no-use-before-define': 'off',
    },
};

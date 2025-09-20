module.exports = {
    'env': {
        'browser': true,
        'es2021': true,
        'node': true,
        'jest': true
    },
    'extends': [
        'eslint:recommended'
    ],
    'parserOptions': {
        'ecmaVersion': 12,
        'sourceType': 'script'
    },
    'rules': {
        'indent': ['warn', 4],
        'linebreak-style': ['error', 'unix'],
        'quotes': ['warn', 'single'],
        'semi': ['warn', 'always'],
        'no-unused-vars': ['warn'],
        'no-console': 'off',
        'no-undef': 'warn'
    },
    'globals': {
        'google': 'readonly',
        'authToken': 'readonly',
        'getCurrentUser': 'readonly',
        'closeModal': 'readonly',
        'changePassword': 'readonly',
        'authenticatedFetch': 'readonly'
    },
    'ignorePatterns': [
        'node_modules/',
        'dist/',
        'build/',
        '*.min.js'
    ]
};
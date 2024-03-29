module.exports = {
    "env": {
        "es6": true,
        "node": true
    },
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "project": "tsconfig.json",
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "extends": ["plugin:@typescript-eslint/recommended"],
    "rules": {
        "@typescript-eslint/member-delimiter-style": [
            "warn",
            {
                "multiline": {
                    "delimiter": "semi",
                    "requireLast": true
                },
                "singleline": {
                    "delimiter": "semi",
                    "requireLast": false
                }
            }
        ],
        "@typescript-eslint/semi": [
            "warn",
            "always"
        ],
        "curly": "warn",
        "eqeqeq": [
            "warn",
            "always"
        ],
        "no-redeclare": "warn",
        "no-throw-literal": "warn",
        "no-unused-expressions": "warn",
        "indent": ["error", 4],
        "linebreak-style": ["error", "unix"],
        "quotes": ["error", "single"],
        "semi": ["error", "always"],
        "no-empty": "warn",
        "no-cond-assign": ["error", "always"],
        "for-direction": "off",
        "newline-after-var": ["error", "always"],
        "object-curly-spacing": ["error", "always"],
        "space-before-function-paren": ["error", "never"]
    }
};
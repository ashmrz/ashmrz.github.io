import eslint from "@eslint/js";
import globals from "globals";

export default [
    {
        ignores: [
            "dist/**",
            "node_modules/**",
            "public/**",
            "source-media/**"
        ]
    },
    eslint.configs.recommended,
    {
        files: ["js/**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: globals.browser
        }
    },
    {
        files: ["scripts/**/*.mjs", "*.config.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: globals.node
        }
    }
];

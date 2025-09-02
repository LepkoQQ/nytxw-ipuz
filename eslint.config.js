import { defineConfig, globalIgnores } from "@eslint/config-helpers";
import js from "@eslint/js";
import pluginImport from "eslint-plugin-import";
import pluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";

export default defineConfig([
  js.configs.recommended,
  pluginImport.flatConfigs.recommended,
  globalIgnores(["dist/"]),
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "no-console": "warn",
      "no-alert": "warn",
      "import/extensions": ["error", "always", { ignorePackages: true }],
      "import/no-extraneous-dependencies": [
        "error",
        {
          optionalDependencies: false,
          devDependencies: ["eslint.config.js"],
        },
      ],
    },
  },
  pluginPrettierRecommended,
]);

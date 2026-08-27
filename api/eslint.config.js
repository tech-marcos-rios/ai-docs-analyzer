import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.eslint.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },
  {
    files: ["tests/**/*.ts"],
    rules: {
      // Mocks (vi.fn(), fake async streams sin await real) chocan con estas reglas
      // pensadas para código de producción — ruido, no bugs reales.
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/require-await": "off",
    },
  },
  {
    ignores: [
      "dist/",
      "node_modules/",
      "src/generated/",
      "eslint.config.js",
      "vitest.config.ts",
      "prisma.config.ts",
    ],
  },
);

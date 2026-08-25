import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // The React-Compiler-era hook rules are strict and, on a few genuinely
    // SSR-safe patterns (mount-guard flags to avoid hydration mismatch,
    // reading localStorage on mount, rendering a dynamically-chosen icon
    // component), they report false positives. We keep them ON as warnings so
    // real issues still surface without failing the build on known-safe code.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
    },
  },
]);

export default eslintConfig;

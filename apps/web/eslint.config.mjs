import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default [
  {
    ignores: [
      ".next/**",
      "out/**",
      "node_modules/**",
      "tsconfig.tsbuildinfo",
    ],
  },
  ...nextCoreWebVitals,
];

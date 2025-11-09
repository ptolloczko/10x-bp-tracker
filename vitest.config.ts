import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Enable globals like describe, it, expect
    globals: true,

    // Environment for DOM testing
    environment: "jsdom",

    // Setup files to run before each test file
    setupFiles: ["./src/test/setup.ts"],

    // Include patterns
    include: ["**/*.{test,spec}.{ts,tsx}"],

    // Exclude patterns
    exclude: ["node_modules", "dist", ".idea", ".git", ".cache", "**/e2e/**"],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules",
        "dist",
        ".astro",
        "**/*.d.ts",
        "**/*.config.*",
        "**/test/**",
        "**/e2e/**",
        "**/.astro/**",
      ],
      // Enable only when needed
      enabled: false,
    },

    // Reporters
    reporters: ["default"],

    // Globals
    typecheck: {
      enabled: false,
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    coverage: { 
      reporter: ["text", "html"],
      exclude: [
        "node_modules/",
        "src/components/ui/",  // Exclude shadcn/ui components
        "**/*.d.ts"
      ]
    }
  }
});

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/exponential-decay-simulator/",
  plugins: [react()],
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    clearMocks: true,
  },
});

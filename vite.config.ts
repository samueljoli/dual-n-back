import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [svelte()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules/**", ".direnv/**", "src-tauri/**", "dist/**"],
  },
});

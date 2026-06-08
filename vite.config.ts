import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { fileURLToPath } from "url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(root, "client/src"),
      "@shared": resolve(root, "shared"),
    },
  },
  root: resolve(root, "client"),
  build: {
    outDir: resolve(root, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    allowedHosts: "all",
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});

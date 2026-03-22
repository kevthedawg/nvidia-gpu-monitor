import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@backend": resolve(__dirname, "../backend/src"),
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:3090",
      "/trpc": "http://localhost:3090",
    },
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    open: "http://localhost:5173",
    allowedHosts: [".monkeycode-ai.live"],
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    allowedHosts: [".monkeycode-ai.live"],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    proxy: {
      "/api": {
        target: process.env.NODE_ENV === "production" 
          ? "https://bidm-smartprocure.replit.app"
          : "http://0.0.0.0:5000",
        changeOrigin: true,
        secure: true,
      },
    },
    allowedHosts: [
      "*.replit.dev",
      "*.replit.app",
      "8625dedb-d1a2-49bb-8222-c076d4157e3f-00-2lpxq2k5704t1.pike.replit.dev"
    ],
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
  },
});
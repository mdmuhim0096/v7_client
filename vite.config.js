// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ["v7-client.onrender.com"], // ✅ NO protocol, NO slash
    cors: {
      origin: ["https://v7-client.onrender.com"],
    },
  },
  base: "/v3/",
});

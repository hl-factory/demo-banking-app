import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server binds 127.0.0.1:4101 (also overridable via CLI flags).
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 4101,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 4101,
  },
});

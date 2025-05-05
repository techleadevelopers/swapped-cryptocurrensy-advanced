import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    allowedHosts: [
      process.env['REPLIT_DOMAINS'] ? process.env['REPLIT_DOMAINS'].split(',')[0] : 'localhost'
    ]
  },
  // Outras opções de configuração podem ser adicionadas aqui
});
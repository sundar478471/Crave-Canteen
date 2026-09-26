import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        tailwindcss(),
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          devOptions: {
            enabled: true
          },
          includeAssets: ['icon.svg'],
          workbox: {
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          },
          manifest: {
            name: 'CraveCanteen Hub',
            short_name: 'CraveCanteen',
            description: 'Smart campus dining. Digital vouchers and real-time tracking.',
            theme_color: '#7c3aed',
            background_color: '#0f172a',
            display: 'standalone',
            icons: [
              {
                src: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png',
                sizes: '512x512',
                type: 'image/png'
              },
              {
                src: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ]
          }
        })
      ],
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
              vendor: ['react', 'react-dom', 'lucide-react', 'recharts']
            }
          }
        }
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
          '@root': path.resolve(__dirname, '.'),
        }
      }
    };
});

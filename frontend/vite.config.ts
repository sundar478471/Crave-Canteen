import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, path.resolve(__dirname, '..'), '');
    return {
      root: path.resolve(__dirname),
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['icons/icon.svg'],
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
        outDir: '../dist',
        emptyOutDir: true,
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
        'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.GEMINI_API_KEY || env.API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_API_KEY || env.GEMINI_API_KEY || env.API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
          '@shared': path.resolve(__dirname, '../shared'),
          '@frontend': path.resolve(__dirname, './src')
        }
      }
    };
});

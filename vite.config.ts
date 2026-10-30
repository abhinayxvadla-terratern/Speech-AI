import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import fs from 'fs';

function vadDevPlugin(): Plugin {
  return {
    name: 'vad-dev-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/vad-assets/')) {
          return next();
        }
        const assetName = req.url.replace('/vad-assets/', '').split('?')[0];
        let filePath = '';
        if (assetName.startsWith('ort-')) {
          filePath = path.resolve(__dirname, 'node_modules/onnxruntime-web/dist', assetName);
        } else {
          filePath = path.resolve(__dirname, 'node_modules/@ricky0123/vad-web/dist', assetName);
        }

        if (fs.existsSync(filePath)) {
          if (assetName.endsWith('.wasm')) {
            res.setHeader('Content-Type', 'application/wasm');
          } else if (assetName.endsWith('.mjs') || assetName.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
          } else if (assetName.endsWith('.onnx')) {
            res.setHeader('Content-Type', 'application/octet-stream');
          }
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
          fs.createReadStream(filePath).pipe(res);
          return;
        }
        next();
      });
    },
  };
}

function edgeTtsDevPlugin(): Plugin {
  return {
    name: 'edge-tts-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/tts')) {
          return next();
        }

        try {
          const url = new URL(req.url, 'http://localhost');
          let text = url.searchParams.get('text');
          let voice = url.searchParams.get('voice') || 'de-DE-KatjaNeural';

          if (req.method === 'POST') {
            const body = await new Promise<string>((resolve) => {
              let acc = '';
              req.on('data', (c: any) => (acc += c));
              req.on('end', () => resolve(acc));
            });
            if (body) {
              try {
                const parsed = JSON.parse(body);
                if (parsed.text) text = parsed.text;
                if (parsed.voice) voice = parsed.voice;
              } catch {
                // ignore json parse error, fall back to query params
              }
            }
          }

          if (!text) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing "text" parameter' }));
            return;
          }

          const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
          const tts = new MsEdgeTTS();
          await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
          const { audioStream } = tts.toStream(text);

          const chunks: any[] = [];
          await new Promise<void>((resolve, reject) => {
            audioStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            audioStream.on('end', () => {
              try { tts.close(); } catch {}
              resolve();
            });
            audioStream.on('error', (err) => {
              try { tts.close(); } catch {}
              reject(err);
            });
          });

          const fullBuffer = Buffer.concat(chunks);
          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Content-Length', fullBuffer.length);
          res.setHeader('Cache-Control', 'public, max-age=3600');
          res.end(fullBuffer);
        } catch (err: any) {
          console.error('Edge TTS dev middleware error:', err?.message || err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err?.message || 'TTS Error' }));
          }
        }
      });
    },
  };
}

function serverApiDevPlugin(): Plugin {
  return {
    name: 'server-api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/keys') && !req.url?.startsWith('/api/llm')) {
          return next();
        }

        try {
          const body = await new Promise<string>((resolve) => {
            let acc = '';
            req.on('data', (c: any) => (acc += c));
            req.on('end', () => resolve(acc));
          });

          let parsedBody = {};
          if (body) {
            try {
              parsedBody = JSON.parse(body);
            } catch {}
          }

          const mockReq: any = {
            method: req.method,
            headers: req.headers,
            query: Object.fromEntries(new URL(req.url, 'http://localhost').searchParams),
            body: parsedBody,
          };

          const mockRes: any = {
            headersSent: false,
            statusCode: 200,
            status(code: number) {
              this.statusCode = code;
              res.statusCode = code;
              return this;
            },
            setHeader(key: string, val: any) {
              res.setHeader(key, val);
              return this;
            },
            json(data: any) {
              this.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
              this.headersSent = true;
            },
            end(data: any) {
              res.end(data);
              this.headersSent = true;
            },
          };

          if (req.url.startsWith('/api/keys')) {
            const { default: handler } = await import('./api/keys');
            await handler(mockReq, mockRes);
            return;
          }

          if (req.url.startsWith('/api/llm')) {
            const { default: handler } = await import('./api/llm');
            await handler(mockReq, mockRes);
            return;
          }
        } catch (err: any) {
          console.error('Server API dev middleware error:', err?.message || err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message || 'Server API Error' }));
          }
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'script',
        includeAssets: [
          'favicon.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'maskable-icon-512x512.png',
        ],
        manifest: {
          name: 'SpeechAI',
          short_name: 'SpeechAI',
          description: 'SpeechAI - German for Career & Study',
          theme_color: '#00215C',
          background_color: '#FAFBFF',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,onnx,woff,woff2,ttf}'],
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [
            /^\/api\//,
            /^https:\/\/.*\.supabase\.co\/.*/,
          ],
          runtimeCaching: [
            // 1. Live NetworkOnly: Supabase API calls, auth requests & realtime
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: 'NetworkOnly',
            },
            // 2. Live NetworkOnly: Voice sessions, LLM cascade, Edge TTS, API endpoints
            {
              urlPattern: /^\/api\/.*/i,
              handler: 'NetworkOnly',
            },
            // 3. NetworkFirst: Dynamic / user data routes & page navigations
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'app-dynamic-pages',
                networkTimeoutSeconds: 3,
              },
            },
            // 4. StaleWhileRevalidate for Google Fonts stylesheets
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts-stylesheets',
              },
            },
            // 5. CacheFirst for Google Fonts webfonts
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
      edgeTtsDevPlugin(),
      vadDevPlugin(),
      serverApiDevPlugin(),
    ],
    define: {
      'process.env.GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY || env.VITE_GROQ_API_KEY || ''),
      'process.env.OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY || ''),
      'process.env.ADMIN_ENCRYPTION_KEY': JSON.stringify(env.ADMIN_ENCRYPTION_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'credentialless',
      },
    },
  };
});

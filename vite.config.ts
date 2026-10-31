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
        if (
          !req.url?.startsWith('/api/keys') &&
          !req.url?.startsWith('/api/llm') &&
          !req.url?.startsWith('/api/stt') &&
          !req.url?.startsWith('/api/feedback-notify')
        ) {
          return next();
        }

        try {
          const chunks: any[] = [];
          await new Promise<void>((resolve, reject) => {
            req.on('data', (c: any) => chunks.push(c));
            req.on('end', () => resolve());
            req.on('error', (err: any) => reject(err));
          });

          const rawBuffer = Buffer.concat(chunks.map((c) => (Buffer.isBuffer(c) ? c : Buffer.from(c))));

          let parsedBody: any = rawBuffer;
          if (req.url.startsWith('/api/keys') || req.url.startsWith('/api/llm') || req.url.startsWith('/api/feedback-notify')) {
            try {
              const bodyStr = rawBuffer.toString('utf-8');
              if (bodyStr) parsedBody = JSON.parse(bodyStr);
            } catch {
              parsedBody = {};
            }
          }

          const mockReq: any = {
            method: req.method,
            headers: req.headers,
            query: Object.fromEntries(new URL(req.url, 'http://localhost').searchParams),
            body: parsedBody,
            on: req.on.bind(req),
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

          if (req.url.startsWith('/api/stt')) {
            const { default: handler } = await import('./api/stt');
            await handler(mockReq, mockRes);
            return;
          }

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

          if (req.url.startsWith('/api/feedback-notify')) {
            const { default: handler } = await import('./api/feedback-notify');
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
      edgeTtsDevPlugin(),
      vadDevPlugin(),
      serverApiDevPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        workbox: {
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: /^\/vad-assets\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'vad-assets-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
          ],
        },
        manifest: false,
      }),
    ],
    define: {
      '__APP_BUILD_TIME__': JSON.stringify(new Date().toISOString()),
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
    },
  };
});

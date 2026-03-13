import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import http from 'node:http'

const unmProxyPlugin = () => ({
  name: 'unm-proxy',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      const url = req.url || ''
      if (!url.startsWith('/unm-api')) {
        next()
        return
      }

      const forwardPath = url.replace(/^\/unm-api/, '') || '/'
      const absoluteUrl = `http://music.163.com${forwardPath}`
      const chunks: Buffer[] = []
      req.on('data', (chunk: Buffer) => chunks.push(chunk))
      req.on('end', () => {
        const proxyReq = http.request(
          {
            host: '127.0.0.1',
            port: 3100,
            method: req.method,
            path: absoluteUrl,
            headers: {
              ...req.headers,
              host: 'music.163.com',
              connection: 'close'
            }
          },
          (proxyRes) => {
            res.writeHead(proxyRes.statusCode || 500, proxyRes.headers)
            proxyRes.pipe(res)
          }
        )
        proxyReq.on('error', () => {
          res.statusCode = 502
          res.end('unm proxy error')
        })
        const body = Buffer.concat(chunks)
        if (body.length > 0) {
          proxyReq.write(body)
        }
        proxyReq.end()
      })
    })
  }
})

export default defineConfig({
  plugins: [vue(), unmProxyPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  base: process.env.GITHUB_ACTIONS ? '/yu_123/' : '/',
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3100',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        app: fileURLToPath(new URL('./src/main.ts', import.meta.url))
      },
      external: [/AlgerMusicPlayer/],
      output: {
        entryFileNames: (chunkInfo) => (chunkInfo.name === 'app' ? 'assets/app.js' : 'assets/bootstrap.js'),
        chunkFileNames: 'assets/chunk-[name].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || ''
          if (name.endsWith('.css')) {
            return 'assets/app.css'
          }
          return 'assets/[name][extname]'
        }
      }
    }
  }
})

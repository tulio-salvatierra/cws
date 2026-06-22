/* global process */

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { SERVER_ENV_KEYS } from './env.keys.js'

// In ESM, __dirname is not defined. Recreate it from import.meta.url
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const LOCAL_SERVERLESS_HANDLERS = [
  {
    route: '/api/client-portal-notify',
    handlerUrl: new URL('./api/client-portal-notify.js', import.meta.url).href,
  },
  {
    route: '/api/lead-outreach',
    handlerUrl: new URL('./api/lead-outreach.js', import.meta.url).href,
  },
]

function clientPortalApiPlugin(env) {
  return {
    name: 'client-portal-local-api',
    configureServer(server) {
      server.middlewares.use('/api/client-portal-intake', async (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { ok: false, error: 'Method not allowed' })
          return
        }

        if (!env.GOOGLE_SHEETS_WEBHOOK_URL || !env.GOOGLE_SHEETS_WEBHOOK_SECRET) {
          sendJson(res, 500, {
            ok: false,
            error: 'Missing Google Sheets webhook environment variables.',
          })
          return
        }

        try {
          const requestBody = await readJsonBody(req)
          const response = await fetch(env.GOOGLE_SHEETS_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...requestBody,
              secret: env.GOOGLE_SHEETS_WEBHOOK_SECRET,
            }),
          })

          const result = await response.json().catch(() => null)

          if (!response.ok || result?.ok === false) {
            sendJson(res, 502, {
              ok: false,
              error: result?.error || 'Google Sheet sync failed',
            })
            return
          }

          sendJson(res, 200, { ok: true, result })
        } catch (error) {
          sendJson(res, 500, {
            ok: false,
            error: error instanceof Error ? error.message : 'Client portal sync failed',
          })
        }
      })

      LOCAL_SERVERLESS_HANDLERS.forEach(({ route, handlerUrl }) => {
        mountServerlessHandler(server, route, handlerUrl, env)
      })
    },
  }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''

    req.setEncoding('utf8')
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

function mountServerlessHandler(server, route, handlerUrl, env) {
  server.middlewares.use(route, async (req, res) => {
    try {
      applyLocalServerEnv(env)
      const body = await readJsonBody(req)
      const { default: handler } = await import(`${handlerUrl}?t=${Date.now()}`)
      let statusCode = 200
      let responseSent = false

      const apiRes = {
        status(code) {
          statusCode = code
          return this
        },
        json(payload) {
          if (!responseSent) {
            responseSent = true
            sendJson(res, statusCode, payload)
          }
          return this
        },
      }

      await handler(
        {
          method: req.method,
          headers: req.headers,
          body,
        },
        apiRes,
      )
    } catch (error) {
      sendJson(res, 500, {
        ok: false,
        error: error instanceof Error ? error.message : 'Local API route failed',
      })
    }
  })
}

function applyLocalServerEnv(env) {
  SERVER_ENV_KEYS.forEach((key) => {
    if (env[key]) {
      process.env[key] = env[key]
    }
  })
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')

  return {
    plugins: [react(), clientPortalApiPlugin(env)],
    assetsInclude: ['**/*.glb'],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'), // Alias para facilitar las importaciones
      },
    },
    // Dev server and preview will both use port 5174
    server: {
      port: 5174,
      strictPort: true,
      proxy: {
        // Proxy n8n webhook calls in dev to avoid CORS (browser → n8n.cloud cross-origin)
        '/webhook': {
          target: 'https://ciceroweb.app.n8n.cloud',
          changeOrigin: true,
          secure: true,
        },
      },
    },
    preview: {
      port: 5174,
      strictPort: true,
    },
    build: {
      chunkSizeWarningLimit: 600,
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.js'],
      globals: true,
    },
  }
})

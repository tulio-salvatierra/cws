import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import validateProductionClientEnv from './scripts/validate-production-client-env.mjs'
import {
  GoogleSheetsWebhookTimeoutError,
  postGoogleSheetsWebhook,
} from './server/google-sheets-webhook.js'

// In ESM, __dirname is not defined. Recreate it from import.meta.url
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
          const { response, result } = await postGoogleSheetsWebhook({
            url: env.GOOGLE_SHEETS_WEBHOOK_URL,
            secret: env.GOOGLE_SHEETS_WEBHOOK_SECRET,
            payload: requestBody,
          })

          if (!response.ok || result?.ok === false) {
            sendJson(res, 502, {
              ok: false,
              error: result?.error || 'Google Sheet sync failed',
            })
            return
          }

          sendJson(res, 200, { ok: true, result })
        } catch (error) {
          sendJson(res, error instanceof GoogleSheetsWebhookTimeoutError ? 504 : 502, {
            ok: false,
            error: error instanceof GoogleSheetsWebhookTimeoutError
              ? 'Google Sheet sync timed out. Please try again.'
              : 'Google Sheet sync failed. Please try again.',
          })
        }
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

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const productionEnvPlugin = validateProductionClientEnv(mode, env)

  return {
    plugins: [react(), productionEnvPlugin, clientPortalApiPlugin(env)].filter(Boolean),
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

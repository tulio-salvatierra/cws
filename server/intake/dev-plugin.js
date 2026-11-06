import { readConfigs } from './configs.js'
import intakeHandler from './handler.js'
import { MAX_BYTES } from '../../src/lib/intake/model.js'
import { Buffer } from 'node:buffer'
export default function intakePlugin() {
  function middleware(server) {
    server.middlewares.use(async (req, res, next) => {
      const pathname = new URL(req.url, 'http://localhost').pathname
      if (pathname === '/intake' || pathname.startsWith('/intake/')) {
        res.setHeader('X-Robots-Tag', 'noindex, nofollow')
        const slug = pathname.replace(/^\/intake\//, '').replace(/\/$/, '').replace(/\.html$/, '')
        if (!readConfigs().some(c => c.slug === slug)) { res.statusCode = 404; res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><meta name="robots" content="noindex, nofollow"><title>Intake not found</title><h1>Intake not found</h1>'); return }
      }
      if (pathname !== '/api/intake') return next()
      let size = 0, chunks = [], tooLarge = false
      req.on('data', chunk => { size += Buffer.byteLength(chunk); if (size > MAX_BYTES) { tooLarge = true; chunks = [] } else if (!tooLarge) chunks.push(Buffer.from(chunk)) })
      req.on('end', async () => {
        const response = { setHeader: (key, value) => res.setHeader(key, value), status: code => { res.statusCode = code; return response }, json: payload => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(payload)); return response } }
        if (tooLarge) return response.status(413).json({ ok: false, error: 'Answers are too large.' })
        req.body = Buffer.concat(chunks).toString('utf8') || '{}'
        try { await intakeHandler(req, response) } catch { response.status(500).json({ ok: false, error: 'Unable to send. Please copy or download your answers.' }) }
      })
    })
  }
  return { name: 'client-intake', buildStart: () => { readConfigs() }, configureServer: middleware, configurePreviewServer: middleware }
}

// Render only sitemap-listed public routes using the built application. React
// replaces the snapshot on startup, as it does on the Negocio Listo pages.
import { readFile, writeFile } from 'node:fs/promises'
import { preview } from 'vite'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { JSDOM } from 'jsdom'
import { canonicalPages } from './canonical-pages.mjs'

const urls = canonicalPages(await readFile('public/sitemap.xml', 'utf8'))
const template = await readFile('dist/index.html', 'utf8')
await writeFile('dist/app-shell.html', template)
// Capture from the original shell so rerunning a route cannot inherit an
// earlier snapshot. Vite serves all built assets with their correct MIME types.
const publicPaths = new Set(urls.map((url) => url.pathname))
const server = await preview({
  configFile: false,
  preview: { host: '127.0.0.1', port: 0 },
  plugins: [{
    name: 'prerender-original-shell',
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!publicPaths.has(new URL(req.url, 'http://localhost').pathname)) return next()
        res.setHeader('Content-Type', 'text/html')
        res.end(template.replace('<html ', '<html data-prerender '))
      })
    },
  }],
})
const origin = server.resolvedUrls.local[0]
let browser
try {
  const executablePath = process.env.CHROME_EXECUTABLE_PATH || (process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    : await chromium.executablePath())
  browser = await puppeteer.launch({
    executablePath,
    args: process.platform === 'linux'
      ? chromium.args
      : ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    headless: true,
  })
  for (const url of urls) {
    const page = await browser.newPage()
    try {
      const errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.setRequestInterception(true)
      page.on('request', (request) => {
        const requestUrl = request.url()
        if (request.resourceType() === 'media') request.abort()
        else if (requestUrl.startsWith(origin) || requestUrl.startsWith('data:') || requestUrl.startsWith('blob:')) request.continue()
        else request.abort()
      })
      console.log(`[prerender] Rendering ${url.pathname}`)
      await page.goto(new URL(url.pathname, origin).href, { waitUntil: 'networkidle0' })
      await page.waitForSelector('main h1', { timeout: 10000 })
      const snapshot = await page.evaluate(() => {
        const root = document.getElementById('root').cloneNode(true)
        root.querySelectorAll('[data-loading-container], canvas, script, iframe').forEach((node) => node.remove())
        root.querySelectorAll('.app-shell--loading').forEach((node) => node.classList.remove('app-shell--loading'))
        // Animation start states must not hide content in the static response.
        root.querySelectorAll('[style]').forEach((node) => {
          for (const property of ['opacity', 'visibility', 'transform', 'translate', 'clip-path']) node.style.removeProperty(property)
        })
        const schemas = [...document.querySelectorAll('script[type="application/ld+json"]')].map((node) => node.outerHTML).join('\n')
        return { html: root.innerHTML, schemas, h1: root.querySelector('main h1')?.textContent.trim(), links: root.querySelectorAll('a[href]').length }
      })
      if (errors.length || !snapshot.h1 || !snapshot.links) throw new Error(`${url.pathname}: ${errors.join('; ') || 'missing heading or links'}`)
      const file = url.pathname === '/' ? 'dist/index.html' : `dist${url.pathname}.html`
      const shell = url.pathname === '/' ? template : await readFile(file, 'utf8')
      const document = new JSDOM(shell).window.document
      const root = document.getElementById('root')
      if (!root) throw new Error(`Missing root in ${file}`)
      root.innerHTML = snapshot.html
      document.querySelectorAll('script[type="application/ld+json"]').forEach((node) => node.remove())
      document.head.insertAdjacentHTML('beforeend', snapshot.schemas)
      const html = '<!doctype html>\n' + document.documentElement.outerHTML
      await writeFile(file, html)
      console.log(`[prerender] ${url.pathname}: heading and ${snapshot.links} links`)
    } finally {
      if (browser.connected) await page.close()
    }
  }
} finally {
  await browser?.close()
  await new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve()))
}

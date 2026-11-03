// Only sitemap-listed public pages get static canonical shells. Never include
// private review/admin routes or replace the richer Negocio Listo snapshots.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export function canonicalPages(sitemap) {
  return [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => {
    const url = new URL(match[1])
    if (url.origin !== 'https://www.cicerowebstudio.xyz' || /^\/(review|admin)(\/|$)/.test(url.pathname)) {
      throw new Error(`Invalid public canonical: ${url}`)
    }
    return url
  })
}

export function canonicalShell(template, url) {
  return template
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`)
    .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`)
}

async function main() {
  const sitemap = await readFile('public/sitemap.xml', 'utf8')
  const template = await readFile('dist/index.html', 'utf8')
  for (const url of canonicalPages(sitemap)) {
    if (url.pathname === '/' || /\/(?:en\/)?negocio-listo$/.test(url.pathname)) continue
    const file = path.join('dist', `${url.pathname.slice(1)}.html`)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, canonicalShell(template, url.href))
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => { console.error(error); process.exit(1) })
}

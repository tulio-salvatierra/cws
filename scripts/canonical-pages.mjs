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

const escapeAttr = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Replace exactly one occurrence of a tag; throw if the template no longer has it,
// so a template change can't silently ship homepage meta on every route again.
function replaceOne(html, pattern, replacement, label) {
  if (!pattern.test(html)) throw new Error(`canonical-pages: template is missing ${label}`)
  return html.replace(pattern, replacement)
}

export function canonicalShell(template, url, meta) {
  let html = template
  html = replaceOne(html, /<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`, 'canonical')
  html = replaceOne(html, /<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`, 'og:url')
  if (!meta) return html
  const title = escapeAttr(meta.title)
  const description = escapeAttr(meta.description)
  html = replaceOne(html, /<title>[^<]*<\/title>/, `<title>${title}</title>`, '<title>')
  html = replaceOne(html, /<meta\s+name="description"[^>]*>/, `<meta name="description" content="${description}" />`, 'description')
  html = replaceOne(html, /<meta\s+property="og:title"[^>]*>/, `<meta property="og:title" content="${title}" />`, 'og:title')
  html = replaceOne(html, /<meta\s+property="og:description"[^>]*>/, `<meta property="og:description" content="${description}" />`, 'og:description')
  html = replaceOne(html, /<meta\s+name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${title}" />`, 'twitter:title')
  html = replaceOne(html, /<meta\s+name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${description}" />`, 'twitter:description')
  return html
}

async function main() {
  const sitemap = await readFile('public/sitemap.xml', 'utf8')
  const template = await readFile('dist/index.html', 'utf8')
  const routeMeta = JSON.parse(await readFile('src/data/route-meta.json', 'utf8'))
  for (const url of canonicalPages(sitemap)) {
    if (url.pathname === '/' || /\/(?:en\/)?negocio-listo$/.test(url.pathname)) continue
    const meta = routeMeta[url.pathname]
    if (!meta) throw new Error(`canonical-pages: no title/description in src/data/route-meta.json for ${url.pathname}`)
    const file = path.join('dist', `${url.pathname.slice(1)}.html`)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, canonicalShell(template, url.href, meta))
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => { console.error(error); process.exit(1) })
}

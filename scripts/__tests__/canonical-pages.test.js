import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { canonicalPages, canonicalShell } from '../canonical-pages.mjs'
import { updateCanonicalUrl } from '../../src/lib/seo'

const read = (name) => readFileSync(name, 'utf8')

describe('public canonical URLs', () => {
  it('uses final URLs with exact static routes, preserving API/review/SPA rewrites', () => {
    const urls = canonicalPages(read('public/sitemap.xml'))
    const config = JSON.parse(read('vercel.json'))
    expect(urls).toHaveLength(20)
    expect(new Set(urls.map(String)).size).toBe(20)
    for (const url of urls.filter((url) => url.pathname !== '/')) {
      expect(config.rewrites).toContainEqual({ source: url.pathname, destination: `${url.pathname}.html` })
    }
    expect(config.rewrites).toContainEqual({ source: '/review/:path*', destination: 'https://cws-review.vercel.app/:path*' })
    expect(config.rewrites[0]).toEqual({ source: '/api/command-queue', destination: '/api/sales' })
    expect(config.rewrites.at(-1).destination).toBe('/index.html')
    expect(read('public/robots.txt')).toContain('Disallow: /review/')
    expect(read('public/robots.txt')).toContain('Sitemap: https://www.cicerowebstudio.xyz/sitemap.xml')
  })

  it('replaces inherited homepage canonicals without changing application markup', () => {
    const template = read('index.html')
    const shell = canonicalShell(template, 'https://www.cicerowebstudio.xyz/about')
    expect(shell).toContain('rel="canonical" href="https://www.cicerowebstudio.xyz/about"')
    expect(shell).toContain('property="og:url" content="https://www.cicerowebstudio.xyz/about"')
    expect(shell.split('</head>')[1]).toBe(template.split('</head>')[1])
    expect(shell.match(/rel="canonical"/g)).toHaveLength(1)
  })

  it('updates one canonical during SPA navigation, omitting queries and trailing slash', () => {
    document.head.innerHTML = '<link rel="canonical" href="https://www.cicerowebstudio.xyz/">'
    window.history.replaceState({}, '', '/about/?campaign=test')
    updateCanonicalUrl()
    expect(document.querySelector('link[rel="canonical"]').href).toBe('https://www.cicerowebstudio.xyz/about')
    window.history.replaceState({}, '', '/blog')
    updateCanonicalUrl()
    expect(document.querySelector('link[rel="canonical"]').href).toBe('https://www.cicerowebstudio.xyz/blog')
    expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1)
    window.history.replaceState({}, '', '/')
  })

  it('rejects private and nonpreferred sitemap URLs', () => {
    for (const url of ['https://www.cicerowebstudio.xyz/review/private', 'https://www.cicerowebstudio.xyz/admin', 'https://cicerowebstudio.xyz/about']) {
      expect(() => canonicalPages(`<loc>${url}</loc>`)).toThrow()
    }
  })
})

describe('per-route titles and descriptions', () => {
  const routeMeta = JSON.parse(read('src/data/route-meta.json'))

  it('has unique meta for every sitemap page that gets a static shell', () => {
    const shellPaths = canonicalPages(read('public/sitemap.xml'))
      .map((url) => url.pathname)
      .filter((p) => p !== '/' && !/\/(?:en\/)?negocio-listo$/.test(p))
    for (const p of shellPaths) {
      expect(routeMeta[p], p).toBeTruthy()
      expect(routeMeta[p].title.length, p).toBeGreaterThan(10)
      expect(routeMeta[p].description.length, p).toBeGreaterThan(50)
    }
    const titles = Object.values(routeMeta).map((m) => m.title)
    expect(new Set(titles).size).toBe(titles.length)
  })

  it('keeps the homepage entry identical to index.html', () => {
    const html = read('index.html')
    expect(html).toContain(`<title>${routeMeta['/'].title}</title>`)
    expect(html).toContain(`content="${routeMeta['/'].description}"`)
  })

  it('matches landing page and article data so runtime and static meta agree', async () => {
    const { landingPagesData } = await import('../../src/data/landingPagesData')
    const { articles } = await import('../../src/data/articles')
    for (const page of landingPagesData) {
      expect(page.meta.title.length, page.id).toBeLessThanOrEqual(60)
      expect(routeMeta[`/landing/${page.id}`]).toEqual({ title: page.meta.title, description: page.meta.description })
    }
    for (const article of articles) {
      const meta = routeMeta[`/blog/${article.slug}`]
      expect(meta.description).toBe(article.excerpt)
      expect(meta.title.startsWith(article.title)).toBe(true)
    }
  })

  it('writes route title, description and social tags into the static shell', () => {
    const template = read('index.html')
    const meta = { title: 'Blog & Tips | Cicero Web Studio', description: 'Say "hi" <now>' }
    const shell = canonicalShell(template, 'https://www.cicerowebstudio.xyz/blog', meta)
    expect(shell).toContain('<title>Blog &amp; Tips | Cicero Web Studio</title>')
    expect(shell).toContain('<meta name="description" content="Say &quot;hi&quot; &lt;now&gt;" />')
    expect(shell).toContain('<meta property="og:title" content="Blog &amp; Tips | Cicero Web Studio" />')
    expect(shell).toContain('<meta name="twitter:description" content="Say &quot;hi&quot; &lt;now&gt;" />')
    expect(shell).not.toContain(routeMeta['/'].title)
    expect(shell.split('</head>')[1]).toBe(template.split('</head>')[1])
  })

  it('fails loudly if the template loses a tag', () => {
    const template = read('index.html').replace(/<title>[^<]*<\/title>/, '')
    expect(() => canonicalShell(template, 'https://www.cicerowebstudio.xyz/blog', routeMeta['/blog'])).toThrow(/<title>/)
  })
})

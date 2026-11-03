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

import { describe, expect, it } from 'vitest'
import { renderPage } from '../prerender-negocio-listo.mjs'

const template = `<!doctype html>
<html lang="en">
  <head>
    <title>Chicago Web Design That Drives Customers | Cicero Web Studio</title>
    <meta name="description" content="home" />
    <meta property="og:title" content="home" />
    <meta property="og:image" content="https://cicerowebstudio.com/preview.jpg" />
    <meta property="og:url" content="https://cicerowebstudio.xyz/" />
    <meta property="og:locale" content="en_US" />
    <link rel="canonical" href="https://cicerowebstudio.xyz/" />
  </head>
  <body><div id="root"></div></body>
</html>`

describe('Negocio Listo prerender', () => {
  it('bakes Spanish metadata, hreflang and JSON-LD into the page head', () => {
    const html = renderPage(template, 'es')
    expect(html).toContain('<html lang="es">')
    expect(html).toContain('<title>Negocio Listo: página web y perfil de Google desde $149/mes | Cicero Web Studio</title>')
    expect(html).toContain('<link rel="canonical" href="https://cicerowebstudio.xyz/negocio-listo" />')
    expect(html).toContain('<meta property="og:image" content="https://cicerowebstudio.xyz/images/negocio-listo/og.jpg" />')
    expect(html).toContain('<meta property="og:locale" content="es_US" />')
    expect(html).toContain('hreflang="en" href="https://cicerowebstudio.xyz/en/negocio-listo"')
    expect(html).toContain('hreflang="x-default" href="https://cicerowebstudio.xyz/negocio-listo"')
    expect(html).not.toContain('Drives Customers')
    const jsonLd = JSON.parse(html.match(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/s)[1])
    const service = jsonLd['@graph'].find((node) => node['@type'] === 'Service')
    expect(service.offers.map((offer) => offer.price)).toEqual(['149', '249', '349'])
  })

  it('renders an English snapshot with the plans and FAQ inside #root', () => {
    const html = renderPage(template, 'en')
    expect(html).toContain('<link rel="canonical" href="https://cicerowebstudio.xyz/en/negocio-listo" />')
    expect(html).toMatch(/<div id="root">[\s\S]*Can customers find you[\s\S]*Pick your plan[\s\S]*12-month minimum[\s\S]*<\/div>/)
  })
})

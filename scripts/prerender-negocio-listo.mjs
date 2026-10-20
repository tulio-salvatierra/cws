// Build step: writes dist/negocio-listo.html and dist/en/negocio-listo.html from dist/index.html
// with the page's own <title>, meta description, Open Graph, canonical, hreflang and JSON-LD
// baked in, plus a static HTML snapshot of the content inside #root (React replaces it on mount).
// Why: the SPA serves one index.html for every route, so link previews (WhatsApp, Facebook,
// Instagram — which don't run JavaScript) would otherwise show the homepage title and image.
// vercel.json rewrites /negocio-listo and /en/negocio-listo to these files.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { NEGOCIO_LISTO, NL_PATHS, NL_SITE_URL, negocioListoJsonLd, negocioListoUrl } from '../src/data/negocioListo.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')

export function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function setMeta(html, attr, key, content) {
  const tag = `<meta ${attr}="${key}" content="${escapeHtml(content)}" />`
  const pattern = new RegExp(`<meta\\s+${attr}="${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 's')
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `    ${tag}\n  </head>`)
}

export function renderSnapshot(copy) {
  const e = escapeHtml
  const plans = copy.plans.items.map((plan) => `
      <article class="nl-plan${plan.popular ? ' nl-plan--popular' : ''}">
        <h3 class="nl-plan__name">${e(plan.name)}</h3>
        <p class="nl-plan__price"><span>$${plan.price}</span>${e(copy.plans.perMonth)}</p>
        <p class="nl-plan__tagline">${e(plan.tagline)}</p>
        <ul class="nl-plan__features">${plan.features.map((f) => `<li>${e(f)}</li>`).join('')}</ul>
      </article>`).join('')
  const faq = copy.faq.items.map((item) => `<details class="nl-faq__item"><summary>${e(item.q)}</summary><p class="nl-muted">${e(item.a)}</p></details>`).join('')
  return `
    <div class="nl-page" lang="${copy.lang}">
      <section class="nl-wrap nl-section">
        <p class="nl-eyebrow">${e(copy.hero.eyebrow)}</p>
        <h1 class="nl-h1">${e(copy.hero.titleA)} <span class="nl-accent">${e(copy.hero.titleB)}</span></h1>
        <p class="nl-lead">${e(copy.hero.sub)}</p>
        <p><a class="nl-btn nl-btn--primary" href="#formulario">${e(copy.hero.ctaPrimary)}</a></p>
      </section>
      <section class="nl-wrap nl-section">
        <h2 class="nl-h2">${e(copy.problem.titleA)} ${e(copy.problem.titleB)}</h2>
        <p class="nl-lead">${e(copy.problem.body)}</p>
        <ul>${copy.problem.items.map((i) => `<li><strong>${e(i.title)}</strong>: ${e(i.body)}</li>`).join('')}</ul>
      </section>
      <section id="planes" class="nl-wrap nl-section">
        <h2 class="nl-h2">${e(copy.plans.title)}</h2>
        <div class="nl-plans">${plans}</div>
        <p class="nl-fine">${e(copy.plans.addon.name)} ${e(copy.plans.addon.price)}: ${e(copy.plans.addon.body)}</p>
        <p class="nl-fine">${e(copy.plans.finePrint)}</p>
      </section>
      <section class="nl-wrap nl-section">
        <h2 class="nl-h2">${e(copy.how.title)}</h2>
        <ol>${copy.how.steps.map((s) => `<li><strong>${e(s.title)}</strong>: ${e(s.body)}</li>`).join('')}</ol>
        <p class="nl-muted">${e(copy.transcript.text)}</p>
      </section>
      <section id="formulario" class="nl-wrap nl-section">
        <h2 class="nl-h2">${e(copy.form.titleA)} ${e(copy.form.titleB)}</h2>
        <p class="nl-lead">${e(copy.form.sub)}</p>
      </section>
      <section class="nl-wrap nl-section">
        <h2 class="nl-h2">${e(copy.faq.title)}</h2>
        <div class="nl-faq__list">${faq}</div>
      </section>
    </div>`
}

export function renderPage(template, lang) {
  const copy = NEGOCIO_LISTO[lang]
  const url = negocioListoUrl(lang)
  const image = `${NL_SITE_URL}/images/negocio-listo/og.jpg`
  let html = template.replace(/<html lang="[^"]*">/, `<html lang="${lang}">`)
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(copy.seo.title)}</title>`)
  html = setMeta(html, 'name', 'description', copy.seo.description)
  html = setMeta(html, 'property', 'og:title', copy.seo.title)
  html = setMeta(html, 'property', 'og:description', copy.seo.description)
  html = setMeta(html, 'property', 'og:image', image)
  html = setMeta(html, 'property', 'og:image:width', '1200')
  html = setMeta(html, 'property', 'og:image:height', '630')
  html = setMeta(html, 'property', 'og:image:alt', copy.seo.ogImageAlt)
  html = setMeta(html, 'property', 'og:url', url)
  html = setMeta(html, 'property', 'og:locale', lang === 'es' ? 'es_US' : 'en_US')
  html = setMeta(html, 'property', 'og:locale:alternate', lang === 'es' ? 'en_US' : 'es_US')
  html = setMeta(html, 'name', 'twitter:title', copy.seo.title)
  html = setMeta(html, 'name', 'twitter:description', copy.seo.description)
  html = setMeta(html, 'name', 'twitter:image', image)
  html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`)
  const head = [
    `<link rel="alternate" hreflang="es" href="${negocioListoUrl('es')}" />`,
    `<link rel="alternate" hreflang="en" href="${negocioListoUrl('en')}" />`,
    `<link rel="alternate" hreflang="x-default" href="${negocioListoUrl('es')}" />`,
    `<link rel="preload" as="image" href="/images/negocio-listo/poster-${lang}.jpg" />`,
    `<script type="application/ld+json" data-jsonld-id="negocio-listo">${JSON.stringify(negocioListoJsonLd(lang)).replace(/</g, '\\u003c')}</script>`,
  ].map((line) => `    ${line}`).join('\n')
  html = html.replace('</head>', `${head}\n  </head>`)
  html = html.replace('<div id="root"></div>', `<div id="root">${renderSnapshot(copy)}\n    </div>`)
  return html
}

async function main() {
  const template = await readFile(path.join(dist, 'index.html'), 'utf8')
  for (const lang of Object.keys(NL_PATHS)) {
    const file = path.join(dist, `${NL_PATHS[lang].slice(1)}.html`)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, renderPage(template, lang))
    console.log(`[prerender] ${NL_PATHS[lang]} -> ${path.relative(root, file)}`)
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => { console.error(error); process.exit(1) })
}

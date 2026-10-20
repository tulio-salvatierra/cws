import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import NegocioListoLeadForm, { CheckIcon } from './NegocioListoLeadForm'
import NegocioListoPopup from './NegocioListoPopup'
import { addJsonLd, updateSEO } from '@/lib/seo'
import {
  NEGOCIO_LISTO,
  NL_PATHS,
  NL_SITE_URL,
  NL_WHATSAPP,
  NL_WHATSAPP_DISPLAY,
  negocioListoJsonLd,
  negocioListoUrl,
} from '@/data/negocioListo'
import './NegocioListo.css'

function useNegocioListoSEO(lang) {
  useEffect(() => {
    const copy = NEGOCIO_LISTO[lang]
    updateSEO({
      title: copy.seo.title,
      description: copy.seo.description,
      canonical: negocioListoUrl(lang),
      ogImage: `${NL_SITE_URL}/images/negocio-listo/og.jpg`,
    })
    const previousLang = document.documentElement.lang
    document.documentElement.lang = lang
    // The prerendered HTML already carries these; replace them so they are never duplicated.
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((link) => link.remove())
    const alternates = [['es', 'es'], ['en', 'en'], ['x-default', 'es']].map(([hreflang, target]) => {
      const link = document.createElement('link')
      link.rel = 'alternate'
      link.hreflang = hreflang
      link.href = negocioListoUrl(target)
      link.dataset.nlAlternate = 'true'
      document.head.appendChild(link)
      return link
    })
    addJsonLd(negocioListoJsonLd(lang), 'negocio-listo')
    return () => {
      document.documentElement.lang = previousLang || 'en'
      alternates.forEach((link) => link.remove())
      document.querySelector('script[data-jsonld-id="negocio-listo"]')?.remove()
    }
  }, [lang])
}

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function HeroVideo({ copy }) {
  const t = copy.hero
  const phoneRef = useRef(null)
  const [soundOn, setSoundOn] = useState(false)
  const [ambient, setAmbient] = useState(false)
  const src = `/videos/negocio-listo-${copy.lang}.mp4`
  const poster = `/images/negocio-listo/poster-${copy.lang}.jpg`

  useEffect(() => {
    // The blurred ambient copy is decoration: desktop only, and never with reduced motion.
    const wide = window.matchMedia('(min-width: 768px)').matches
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setAmbient(wide && !calm)
  }, [])

  useEffect(() => { setSoundOn(false) }, [copy.lang])

  const toggleSound = () => {
    const video = phoneRef.current
    if (!video) return
    const next = !soundOn
    video.muted = !next
    if (next) video.currentTime = 0
    video.play().catch(() => {})
    setSoundOn(next)
  }

  return (
    <>
      <div className="nl-hero__ambient" aria-hidden="true">
        {ambient ? (
          <video key={`bg-${copy.lang}`} src={src} poster={poster} autoPlay muted loop playsInline preload="none" tabIndex={-1} />
        ) : (
          <img src={poster} alt="" />
        )}
      </div>
      <div className="nl-hero__media">
        <div className="nl-phone">
          <video
            key={copy.lang}
            ref={phoneRef}
            src={src}
            poster={poster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={t.videoLabel}
            width="1080"
            height="1920"
          />
          <button type="button" className="nl-sound" onClick={toggleSound} aria-pressed={soundOn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 5 6 9H2v6h4l5 4V5z" />
              {soundOn ? <><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a10 10 0 0 1 0 14" /></> : <><path d="m22 9-6 6" /><path d="m16 9 6 6" /></>}
            </svg>
            {soundOn ? t.soundOff : t.soundOn}
          </button>
        </div>
        <details className="nl-transcript">
          <summary>{copy.transcript.toggle}</summary>
          <p>{copy.transcript.text}</p>
        </details>
      </div>
    </>
  )
}

export default function NegocioListo({ lang = 'es' }) {
  const copy = NEGOCIO_LISTO[lang] || NEGOCIO_LISTO.es
  const other = lang === 'es' ? 'en' : 'es'
  const [plan, setPlan] = useState('crecer')
  useNegocioListoSEO(copy.lang)

  const choosePlan = useCallback((id) => {
    setPlan(id)
    scrollToId('formulario')
  }, [])

  const whatsappHref = `https://wa.me/${NL_WHATSAPP}?text=${encodeURIComponent(copy.lang === 'es' ? 'Hola, quiero mi revisión gratis de Negocio Listo.' : 'Hi, I want my free Negocio Listo check.')}`

  return (
    <div className="nl-page" lang={copy.lang}>
      <section className="nl-hero">
        <HeroVideo copy={copy} />
        <div className="nl-wrap nl-hero__inner">
          <div className="nl-hero__copy">
            <div className="nl-hero__top">
              <p className="nl-eyebrow">{copy.hero.eyebrow}</p>
              <Link className="nl-lang" to={NL_PATHS[other]} hrefLang={other} aria-label={copy.nav.langSwitchLabel}>{copy.nav.langSwitch}</Link>
            </div>
            <h1 className="nl-h1">{copy.hero.titleA} <span className="nl-accent">{copy.hero.titleB}</span></h1>
            <p className="nl-lead">{copy.hero.sub}</p>
            <div className="nl-actions">
              <a className="nl-btn nl-btn--primary" href="#formulario" onClick={(e) => { e.preventDefault(); scrollToId('formulario') }}>{copy.hero.ctaPrimary}</a>
              <a className="nl-btn nl-btn--secondary" href="#planes" onClick={(e) => { e.preventDefault(); scrollToId('planes') }}>{copy.hero.ctaSecondary}</a>
            </div>
            <p className="nl-from"><span className="nl-from__label">{copy.hero.from}</span> <span className="nl-from__price">$149</span><span className="nl-from__per">{copy.hero.perMonth}</span></p>
          </div>
        </div>
      </section>

      <section className="nl-wrap nl-section" aria-labelledby="nl-problem-title">
        <div className="nl-split">
          <h2 id="nl-problem-title" className="nl-h2">{copy.problem.titleA} <span className="nl-accent">{copy.problem.titleB}</span></h2>
          <p className="nl-lead nl-split__aside">{copy.problem.body}</p>
        </div>
        <ul className="nl-cards" role="list">
          {copy.problem.items.map((item) => (
            <li key={item.title} className="nl-card">
              <span className="nl-check" aria-hidden="true"><CheckIcon /></span>
              <h3 className="nl-card__title">{item.title}</h3>
              <p className="nl-muted">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="nl-band nl-bg-accent">
        <div className="nl-wrap nl-band__inner">
          <h2 className="nl-band__title">{copy.band.title}</h2>
          <p className="nl-band__body">{copy.band.body}</p>
        </div>
      </section>

      <section id="planes" className="nl-wrap nl-section" aria-labelledby="nl-plans-title">
        <p className="nl-eyebrow">{copy.plans.eyebrow}</p>
        <h2 id="nl-plans-title" className="nl-h2 nl-h2--xl">{copy.plans.title}</h2>
        <div className="nl-plans">
          {copy.plans.items.map((item) => (
            <article key={item.id} className={`nl-plan${item.popular ? ' nl-plan--popular' : ''}`} aria-labelledby={`nl-plan-${item.id}`}>
              {item.popular && <span className="nl-plan__badge">{copy.plans.popular}</span>}
              <h3 id={`nl-plan-${item.id}`} className="nl-plan__name">{item.name}</h3>
              <p className="nl-plan__price"><span>${item.price}</span>{copy.plans.perMonth}</p>
              <p className="nl-plan__tagline">{item.tagline}</p>
              <ul className="nl-plan__features" role="list">
                {item.features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
              <button type="button" className={`nl-btn nl-btn--block ${item.popular ? 'nl-btn--dark' : 'nl-btn--secondary'}`} onClick={() => choosePlan(item.id)}>
                {copy.plans.choose} {item.name}
              </button>
            </article>
          ))}
        </div>
        <div className="nl-addon">
          <p className="nl-addon__label">{copy.plans.addon.label}</p>
          <p className="nl-addon__name">{copy.plans.addon.name} <span className="nl-accent">{copy.plans.addon.price}</span></p>
          <p className="nl-muted">{copy.plans.addon.body}</p>
        </div>
        <p className="nl-fine nl-plans__fine">{copy.plans.finePrint}</p>
      </section>

      <section className="nl-how nl-bg-raised" aria-labelledby="nl-how-title">
        <div className="nl-wrap nl-section">
          <h2 id="nl-how-title" className="nl-h2">{copy.how.title}</h2>
          <ol className="nl-steps">
            {copy.how.steps.map((step, index) => (
              <li key={step.title} className="nl-step">
                <span className="nl-step__n" aria-hidden="true">0{index + 1}</span>
                <h3 className="nl-card__title">{step.title}</h3>
                <p className="nl-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="formulario" className="nl-wrap nl-section nl-form-section" aria-labelledby="nl-form-title">
        <div className="nl-form-section__intro">
          <h2 id="nl-form-title" className="nl-h2 nl-h2--xl">{copy.form.titleA} <span className="nl-accent">{copy.form.titleB}</span></h2>
          <p className="nl-lead">{copy.form.sub}</p>
          <div className="nl-whatsapp">
            <p className="nl-muted">{copy.form.whatsappLabel}</p>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="nl-whatsapp__link">
              {copy.form.whatsappCta}<span>{NL_WHATSAPP_DISPLAY}</span>
            </a>
          </div>
        </div>
        <div className="nl-form-card">
          <NegocioListoLeadForm copy={copy} variant="inline" selectedPlan={plan} onPlanChange={setPlan} />
        </div>
      </section>

      <section className="nl-wrap nl-section nl-faq" aria-labelledby="nl-faq-title">
        <h2 id="nl-faq-title" className="nl-h2">{copy.faq.title}</h2>
        <div className="nl-faq__list">
          {copy.faq.items.map((item) => (
            <details key={item.q} className="nl-faq__item">
              <summary>{item.q}</summary>
              <p className="nl-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <NegocioListoPopup key={copy.lang} copy={copy} />
    </div>
  )
}

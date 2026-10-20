// Negocio Listo landing page copy (ES at /negocio-listo, EN at /en/negocio-listo).
// Plain ESM with no asset imports so scripts/prerender-negocio-listo.mjs can read it in Node.
// Source of plan copy: the owner-provided Negocio Listo graphics in public/images/negocio-listo.

export const NL_SITE_URL = 'https://cicerowebstudio.xyz'
export const NL_PATHS = { es: '/negocio-listo', en: '/en/negocio-listo' }
export const NL_WHATSAPP = '17863146121'
export const NL_WHATSAPP_DISPLAY = '(786) 314-6121'
export const NL_INSTAGRAM = 'https://www.instagram.com/cicerowebstudio/'
export const NL_CALENDLY = 'https://calendly.com/cicerowebstudio-info/30min'

export const NL_PLAN_IDS = ['basico', 'crecer', 'destacado']

export const NEGOCIO_LISTO = {
  es: {
    lang: 'es',
    seo: {
      title: 'Negocio Listo: página web y perfil de Google desde $149/mes | Cicero Web Studio',
      description: 'Sitio web bilingüe, perfil de Google optimizado y más llamadas para contratistas y negocios en Cicero, Berwyn y Chicago. Planes mensuales desde $149. Revisión gratis de tu perfil de Google.',
      ogImageAlt: 'Negocio Listo de Cicero Web Studio',
    },
    nav: { cta: 'Revisión gratis', langSwitch: 'English', langSwitchLabel: 'Ver esta página en inglés' },
    hero: {
      eyebrow: 'CICERO · BERWYN · CHICAGO',
      titleA: '¿Tus clientes te encuentran',
      titleB: 'en Google?',
      sub: 'Sitio web, Google y ahora también ChatGPT. En español y en inglés. Planes mensuales para contratistas, sin pagar $1,000 o más por adelantado.',
      ctaPrimary: 'Quiero mi revisión gratis',
      ctaSecondary: 'Ver planes',
      from: 'Desde',
      perMonth: '/mes',
      soundOn: 'Activar sonido',
      soundOff: 'Silenciar',
      videoLabel: 'Video: Tulio explica Negocio Listo',
    },
    problem: {
      titleA: '¿No sales en Google Maps?',
      titleB: 'Ese trabajo se lo lleva otro.',
      body: 'Cuando alguien busca “contratista cerca de mí”, aparece tu competencia. Negocio Listo te arma tu página web y tu perfil de Google para que te encuentren y te llamen.',
      items: [
        { title: 'Sitio web bilingüe', body: 'Cinco páginas en español y en inglés, con hosting y cambios pequeños incluidos.' },
        { title: 'Perfil de Google', body: 'Configurado y optimizado para que aparezcas en Google Maps y en búsquedas locales.' },
        { title: 'Más llamadas y reseñas', body: 'Un sistema para pedir reseñas y un texto automático cuando pierdes una llamada.' },
      ],
    },
    band: {
      title: 'Sin pagar $1,000 o más por adelantado.',
      body: 'Un sitio web normal cuesta miles antes de empezar. Con Negocio Listo pagas un plan mensual y nosotros nos encargamos de todo.',
    },
    plans: {
      eyebrow: 'NEGOCIO LISTO',
      title: 'Elige tu plan',
      popular: 'MÁS POPULAR',
      choose: 'Elegir',
      perMonth: '/mes',
      finePrint: 'Contrato mínimo de 12 meses. Cuota de instalación según el plan.',
      items: [
        { id: 'basico', name: 'Básico', price: 149, tagline: 'Tu negocio listo en línea', features: ['Sitio web bilingüe de 5 páginas', 'Hosting y cambios pequeños incluidos', 'Perfil de Google configurado y optimizado', 'SEO local básico'] },
        { id: 'crecer', name: 'Crecer', price: 249, popular: true, tagline: 'Más llamadas, más reseñas', features: ['Todo lo de Básico', 'Publicaciones mensuales en tu perfil de Google', 'Sistema para pedir reseñas', 'Respuesta automática por texto cuando pierdes una llamada', 'Reporte mensual de una página'] },
        { id: 'destacado', name: 'Destacado', price: 349, tagline: 'Aparece en Google y en la IA', features: ['Todo lo de Crecer', 'Optimización para búsquedas con IA (ChatGPT, Gemini, Google)', 'Una página nueva de preguntas frecuentes cada mes', 'Revisión mensual: ¿apareces cuando preguntan por tu servicio?'] },
      ],
      addon: { label: '+ EXTRA', name: 'Contenido', price: '+$300/mes', body: 'Sesión de foto y video cada trimestre, convertida en publicaciones mensuales.' },
    },
    how: {
      title: 'Así de fácil',
      steps: [
        { title: 'Pide tu revisión gratis', body: 'Llena el formulario o escríbenos por WhatsApp.' },
        { title: 'Te decimos qué te falta', body: '10 minutos, en español. Revisamos tu perfil de Google contigo.' },
        { title: 'Te lo armamos', body: 'Nosotros hacemos la página web y el perfil. Tú sigues trabajando.' },
      ],
    },
    faq: {
      title: 'Preguntas frecuentes',
      items: [
        { q: '¿Cuánto cuesta Negocio Listo?', a: 'Hay tres planes mensuales: Básico a $149, Crecer a $249 y Destacado a $349. El contrato mínimo es de 12 meses y la cuota de instalación depende del plan.' },
        { q: '¿Tengo que pagar mucho por adelantado?', a: 'No. En vez de pagar $1,000 o más por un sitio web, pagas un plan mensual que incluye la página, el hosting y los cambios pequeños.' },
        { q: '¿La página está en español y en inglés?', a: 'Sí. Todos los planes incluyen un sitio web bilingüe de 5 páginas, para que te encuentren clientes que hablan español y clientes que hablan inglés.' },
        { q: '¿Qué es la revisión gratis del perfil de Google?', a: 'Son 10 minutos, en español. Revisamos tu perfil de Google y te decimos qué te falta para aparecer cuando buscan tu servicio cerca de ellos.' },
        { q: '¿Qué significa aparecer en la IA?', a: 'Cada vez más gente pregunta a ChatGPT, Gemini o Google qué contratista contratar. El plan Destacado optimiza tu negocio para esas respuestas y revisa cada mes si apareces.' },
        { q: '¿En qué zonas trabajan?', a: 'Trabajamos con negocios en Cicero, Berwyn, Chicago y los alrededores.' },
      ],
    },
    transcript: {
      toggle: 'Ver lo que dice el video',
      text: 'Si no sales en Google Maps, no existes para tus clientes. Y ese trabajo se lo lleva otro. En Negocio Listo te armamos tu página web y tu perfil de Google My Business, para que te encuentren y te llamen. Desde $150 al mes. Todo listo para recibir clientes. Comenta LISTO y reviso tu perfil de Google gratis.',
    },
    form: {
      titleA: 'Revisión gratis',
      titleB: 'de tu perfil de Google',
      sub: '10 minutos, en español. Te decimos qué te falta. Sin compromiso.',
      whatsappLabel: '¿Prefieres escribirnos?',
      whatsappCta: 'Escríbenos por WhatsApp',
      name: 'Nombre',
      business: 'Nombre del negocio',
      phone: 'Teléfono / WhatsApp',
      email: 'Correo (opcional)',
      type: 'Tipo de negocio',
      typePlaceholder: 'Elige uno',
      plan: 'Plan que te interesa',
      planUnsure: 'Todavía no sé',
      site: '¿Ya tienes página web?',
      yes: 'Sí',
      no: 'No',
      consent: 'Al enviar, aceptas que te contactemos por teléfono, texto o correo sobre Negocio Listo.',
      submit: 'Pedir mi revisión gratis',
      sending: 'Enviando…',
      required: 'Escribe tu nombre y un teléfono válido.',
      error: 'No pudimos enviar tus datos. Intenta otra vez o escríbenos por WhatsApp.',
      doneTitle: '¡Listo! Ya tenemos tus datos.',
      doneBody: 'Te escribimos pronto para tu revisión gratis. Si quieres, agenda la llamada ahora.',
      doneCta: 'Agendar llamada',
    },
    popup: {
      eyebrow: 'NEGOCIO LISTO',
      title: 'Revisión GRATIS de tu perfil de Google',
      sub: '10 minutos, en español. Te decimos qué te falta para que te encuentren.',
      submit: 'Quiero mi revisión',
      notNow: 'Ahora no',
      close: 'Cerrar',
      doneTitle: '¡Gracias!',
      doneBody: 'Te escribimos pronto. Mientras tanto, mira los planes.',
      doneCta: 'Ver planes',
    },
    businessTypes: [
      { id: 'construction', label: 'Construcción / remodelación' },
      { id: 'roofing', label: 'Techos' },
      { id: 'plumbing', label: 'Plomería' },
      { id: 'electrical', label: 'Electricidad' },
      { id: 'hvac', label: 'Calefacción / aire (HVAC)' },
      { id: 'landscaping', label: 'Jardinería / landscaping' },
      { id: 'cleaning', label: 'Limpieza' },
      { id: 'painting', label: 'Pintura' },
      { id: 'other', label: 'Otro' },
    ],
    footer: 'Cicero · Berwyn · Chicago',
  },
  en: {
    lang: 'en',
    seo: {
      title: 'Negocio Listo: website and Google profile from $149/mo | Cicero Web Studio',
      description: 'Bilingual website, optimized Google Business Profile and more calls for contractors and local businesses in Cicero, Berwyn and Chicago. Monthly plans from $149. Free Google profile check.',
      ogImageAlt: 'Negocio Listo by Cicero Web Studio',
    },
    nav: { cta: 'Free check', langSwitch: 'Español', langSwitchLabel: 'Ver esta página en español' },
    hero: {
      eyebrow: 'CICERO · BERWYN · CHICAGO',
      titleA: 'Can customers find you',
      titleB: 'on Google?',
      sub: 'Website, Google, and now ChatGPT. In Spanish and English. Monthly plans for contractors, without paying $1,000 or more upfront.',
      ctaPrimary: 'Get my free check',
      ctaSecondary: 'See plans',
      from: 'From',
      perMonth: '/mo',
      soundOn: 'Turn sound on',
      soundOff: 'Mute',
      videoLabel: 'Video: Tulio explains Negocio Listo',
    },
    problem: {
      titleA: 'Not on Google Maps?',
      titleB: 'That job goes to someone else.',
      body: 'When someone searches “contractor near me,” your competition shows up. Negocio Listo builds your website and your Google profile so people can find you and call you.',
      items: [
        { title: 'Bilingual website', body: 'Five pages in English and Spanish, with hosting and small edits included.' },
        { title: 'Google profile', body: 'Set up and optimized so you show up on Google Maps and local searches.' },
        { title: 'More calls and reviews', body: 'A review-request system and an automatic text-back when you miss a call.' },
      ],
    },
    band: {
      title: 'No $1,000+ upfront.',
      body: 'A typical website costs thousands before work even starts. With Negocio Listo you pay a monthly plan and we handle everything.',
    },
    plans: {
      eyebrow: 'NEGOCIO LISTO',
      title: 'Pick your plan',
      popular: 'MOST POPULAR',
      choose: 'Choose',
      perMonth: '/mo',
      finePrint: '12-month minimum. Setup fee varies by plan.',
      items: [
        { id: 'basico', name: 'Básico', price: 149, tagline: 'Your business, ready online', features: ['Bilingual 5-page website', 'Hosting and small edits included', 'Google Business Profile set up and optimized', 'Local SEO basics'] },
        { id: 'crecer', name: 'Crecer', price: 249, popular: true, tagline: 'More calls, more reviews', features: ['Everything in Básico', 'Monthly Google profile posts', 'Review-request system', 'Automatic text-back when you miss a call', '1-page monthly report'] },
        { id: 'destacado', name: 'Destacado', price: 349, tagline: 'Show up on Google and in AI answers', features: ['Everything in Crecer', 'AI search optimization (ChatGPT, Gemini, Google)', 'One new FAQ page every month', 'Monthly check: do you show up when people ask for your service?'] },
      ],
      addon: { label: '+ ADD-ON', name: 'Contenido', price: '+$300/mo', body: 'Quarterly photo and video shoot, turned into monthly posts.' },
    },
    how: {
      title: 'This easy',
      steps: [
        { title: 'Ask for your free check', body: 'Fill out the form or message us on WhatsApp.' },
        { title: 'We show you what’s missing', body: '10 minutes. We go over your Google profile with you.' },
        { title: 'We build it', body: 'We handle the website and the profile. You keep working.' },
      ],
    },
    faq: {
      title: 'Questions',
      items: [
        { q: 'How much does Negocio Listo cost?', a: 'There are three monthly plans: Básico at $149, Crecer at $249 and Destacado at $349. There is a 12-month minimum and the setup fee varies by plan.' },
        { q: 'Do I have to pay a lot upfront?', a: 'No. Instead of paying $1,000 or more for a website, you pay a monthly plan that includes the site, hosting and small edits.' },
        { q: 'Is the website in English and Spanish?', a: 'Yes. Every plan includes a bilingual 5-page website, so both English- and Spanish-speaking customers can find you.' },
        { q: 'What is the free Google profile check?', a: 'It takes 10 minutes. We review your Google profile and show you what’s missing to show up when people search for your service nearby.' },
        { q: 'What does showing up in AI mean?', a: 'More people now ask ChatGPT, Gemini or Google which contractor to hire. The Destacado plan optimizes your business for those answers and checks every month whether you show up.' },
        { q: 'What areas do you serve?', a: 'We work with businesses in Cicero, Berwyn, Chicago and nearby areas.' },
      ],
    },
    transcript: {
      toggle: 'Read what the video says',
      text: 'If your business isn’t showing up on Google Maps, your competition is stealing your customers. You do great work. But when somebody searches “contractor near me,” you are nowhere to be found. And that job goes to someone else. With Negocio Listo, we build a website and we build your Google profile so people can find you and call you. Starts at $150 a month. Comment LISTO and I’ll review your Google profile for you for free.',
    },
    form: {
      titleA: 'Free Google',
      titleB: 'profile check',
      sub: '10 minutes. We’ll show you what’s missing. No commitment.',
      whatsappLabel: 'Rather message us?',
      whatsappCta: 'Message us on WhatsApp',
      name: 'Name',
      business: 'Business name',
      phone: 'Phone / WhatsApp',
      email: 'Email (optional)',
      type: 'Type of business',
      typePlaceholder: 'Pick one',
      plan: 'Plan you’re interested in',
      planUnsure: 'Not sure yet',
      site: 'Do you already have a website?',
      yes: 'Yes',
      no: 'No',
      consent: 'By submitting, you agree we can contact you by phone, text or email about Negocio Listo.',
      submit: 'Get my free check',
      sending: 'Sending…',
      required: 'Enter your name and a valid phone number.',
      error: 'We couldn’t send your info. Try again or message us on WhatsApp.',
      doneTitle: 'Done! We have your info.',
      doneBody: 'We’ll reach out soon for your free check. Want to book the call now?',
      doneCta: 'Book a call',
    },
    popup: {
      eyebrow: 'NEGOCIO LISTO',
      title: 'FREE Google profile check',
      sub: '10 minutes. We’ll show you what’s missing so customers can find you.',
      submit: 'Get my check',
      notNow: 'Not now',
      close: 'Close',
      doneTitle: 'Thanks!',
      doneBody: 'We’ll reach out soon. Meanwhile, check out the plans.',
      doneCta: 'See plans',
    },
    businessTypes: [
      { id: 'construction', label: 'Construction / remodeling' },
      { id: 'roofing', label: 'Roofing' },
      { id: 'plumbing', label: 'Plumbing' },
      { id: 'electrical', label: 'Electrical' },
      { id: 'hvac', label: 'HVAC' },
      { id: 'landscaping', label: 'Landscaping' },
      { id: 'cleaning', label: 'Cleaning' },
      { id: 'painting', label: 'Painting' },
      { id: 'other', label: 'Other' },
    ],
    footer: 'Cicero · Berwyn · Chicago',
  },
}

export const NL_BUSINESS_TYPE_IDS = NEGOCIO_LISTO.es.businessTypes.map((type) => type.id)

export function negocioListoUrl(lang) {
  return `${NL_SITE_URL}${NL_PATHS[lang]}`
}

/** JSON-LD graph shared by the client hook and the build-time prerender. */
export function negocioListoJsonLd(lang) {
  const copy = NEGOCIO_LISTO[lang]
  const url = negocioListoUrl(lang)
  const org = { '@id': `${NL_SITE_URL}/#organization` }
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfessionalService',
        '@id': `${NL_SITE_URL}/#organization`,
        name: 'Cicero Web Studio',
        url: NL_SITE_URL,
        telephone: `+${NL_WHATSAPP}`,
        image: `${NL_SITE_URL}/images/negocio-listo/og.jpg`,
        priceRange: '$149–$349/mo',
        address: { '@type': 'PostalAddress', addressLocality: 'Cicero', addressRegion: 'IL', addressCountry: 'US' },
        areaServed: ['Cicero, IL', 'Berwyn, IL', 'Chicago, IL'].map((name) => ({ '@type': 'City', name })),
        knowsLanguage: ['es', 'en'],
        sameAs: [NL_INSTAGRAM],
      },
      {
        '@type': 'Service',
        '@id': `${url}#service`,
        name: 'Negocio Listo',
        serviceType: lang === 'es' ? 'Página web y perfil de Google para negocios locales' : 'Website and Google Business Profile for local businesses',
        description: copy.seo.description,
        provider: org,
        areaServed: ['Cicero, IL', 'Berwyn, IL', 'Chicago, IL'],
        inLanguage: lang,
        url,
        offers: copy.plans.items.map((plan) => ({
          '@type': 'Offer',
          name: `Negocio Listo ${plan.name}`,
          description: plan.features.join('. '),
          price: String(plan.price),
          priceCurrency: 'USD',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: String(plan.price),
            priceCurrency: 'USD',
            unitCode: 'MON',
            referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' },
          },
          url: `${url}#planes`,
        })),
      },
      {
        '@type': 'VideoObject',
        name: lang === 'es' ? 'Negocio Listo: que tus clientes te encuentren en Google' : 'Negocio Listo: get found by customers on Google',
        description: copy.transcript.text,
        thumbnailUrl: `${NL_SITE_URL}/images/negocio-listo/poster-${lang}.jpg`,
        contentUrl: `${NL_SITE_URL}/videos/negocio-listo-${lang}.mp4`,
        uploadDate: '2026-10-20',
        duration: lang === 'es' ? 'PT24S' : 'PT35S',
        inLanguage: lang,
        transcript: copy.transcript.text,
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        inLanguage: lang,
        mainEntity: copy.faq.items.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  }
}

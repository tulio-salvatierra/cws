---
name: negocio-listo-proposal
description: Turn notes from a Cicero Web Studio discovery call or free Google-profile check into a one-page Negocio Listo proposal in Spanish or English. Use when Tulio says to write, prep or send a proposal or quote for a prospect, or after a sales call.
---

# Negocio Listo proposal

Cicero Web Studio (CWS) sells one main offer, **Negocio Listo**: a monthly plan for local
businesses (often Spanish-speaking contractors) that covers a bilingual website, Google
Business Profile and local SEO, with no big upfront website cost. This skill turns call notes
into a short proposal Tulio reviews and sends himself.

## Source of truth for plans and prices

Plans, prices and features come from the live Negocio Listo page, defined in this repo at
`src/data/negocioListo.js` (pages `/negocio-listo` and `/en/negocio-listo` on
cicerowebstudio.xyz). Read it every time. Don't rely on memory or this file for numbers.

At the time of writing it lists Básico, Crecer and Destacado monthly plans, an optional
Contenido add-on, a one-time $300 setup fee and a 12-month minimum term. Use the setup fee
from the page too; if the page and these notes ever disagree, the page wins and you flag it.

Never invent a discount, a custom price, a legacy price or a payment plan. Older clients on
lower legacy prices are exceptions and never a reference for new proposals.

## Inputs

- Call or check notes: business name, owner name, trade, area, what they told us, what we
  found (Google profile gaps, site problems, missing Spanish, reviews, missed calls).
- Language: the language the owner used on the call. If unclear, ask.
- Plan Tulio recommends. If he didn't say, suggest one and explain why in one line.

If notes are thin, ask for what's missing (name, trade, the problem they care about most)
before drafting. Don't fill gaps with assumptions.

## Payment terms (every Negocio Listo proposal, DEC-040)

Use these words or a close translation. Never tie the monthly start to the launch date.

- **Setup:** $300 one-time, paid when you sign. (Setup only, never "setup + first month".)
- **Monthly plan:** starts 14 days after the setup payment, the same week you see your first design, then the same day each month.
- **Term:** 12 months from the first monthly payment.
- **Launch timing doesn't change billing:** if the launch waits on your photos, approvals or your own timing, the plan continues as scheduled.

Spanish: "Instalación: $300, un solo pago al firmar. Tu plan mensual empieza 14 días después de la instalación, la misma semana que ves tu primer diseño, y se cobra el mismo día cada mes. Contrato de 12 meses desde el primer pago mensual. Si el lanzamiento se retrasa por fotos, aprobaciones o tu propio tiempo, el plan sigue igual."

## Proposal structure (one page)

1. **Para / For**: business and owner name, date.
2. **Lo que vimos / What we found**: 2–4 specific findings from the call or check, in plain
   words ("No apareces en Google Maps cuando buscan 'roofer Cicero'").
3. **Lo que vamos a hacer / What we'll do**: the recommended plan's features from the
   source file, tied to the findings above. Plan name in bold.
4. **Inversión / Investment**: monthly price from the source file, setup fee from the page, 12-month minimum, add-on only if discussed. Always state the payment timing exactly as in **Payment terms** below.
5. **Cómo empezamos / How we start**: three steps. Sign and pay the $300 setup (day 0), send logo,
   photos and service list, and see the first design around day 14, when the monthly plan starts.
   Other draft timing only if Tulio gave one.
6. **Next step**: one line with a date to reply or book a call, and Tulio's contact.

Keep it to one page. Plain, warm language a busy owner reads in two minutes. Many owners
read English as a second language, so use short sentences and no jargon (no "SEO
optimization funnel"). Market care, craft, trust and close service, not AI or tech.

## Output

- The proposal text, ready to paste into a doc or email, in the chosen language.
- Below it, for Tulio only:
  - **Check before sending**: price, setup fee, plan choice, any promise in the notes.
  - **Questions**: anything you left as a placeholder.
  - **Scope flags**: requests outside the plan (e-commerce, extra pages, ads, logo design).
    Mark each as included, add-on or "likely scope change — quote separately".

## Hard limits

- Draft only. Tulio reviews and sends. Never email, message or share the proposal.
- No prices, discounts or commitments Tulio hasn't approved.
- Don't save prospect details into this repository (it is public). Save the proposal in
  the client's Drive folder or CWS OS only if Tulio asks.

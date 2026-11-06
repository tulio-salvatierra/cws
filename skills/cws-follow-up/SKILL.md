---
name: cws-follow-up
description: Draft Cicero Web Studio's warm sales follow-ups — replies to prospects who answered, recaps after a demo or call, and nudges on stalled proposals. Use when Tulio asks who to follow up with, to answer a prospect, or to recap a call. Not for the cold Day 0/4/10 email sequence, which CWS OS already runs.
---

# CWS follow-up

Cicero Web Studio (CWS) is a one-person web studio in Chicago run by Tulio. Clients are
local businesses, many Spanish-speaking contractors. This skill drafts the follow-ups that
need a human touch. It never sends anything.

## What this skill covers (and what it doesn't)

CWS OS (`/admin` → Sales) already handles cold outreach: it builds the daily queue, tracks
the Day 0 / Day 4 / Day 10 sequence, prepares template drafts, and sends only after Tulio
confirms. Do not rebuild or replace that. If Tulio asks for the cold sequence, point him to
the Sales queue.

This skill covers the conversations templates can't:

1. **Reply to a prospect who answered** (interested, asked a question, asked for price).
2. **Recap after the free demo or the ~15-minute call**: what we found, the ~3
   recommendations, and the one next step.
3. **Nudge a stalled warm lead**: proposal sent with no answer, call booked then missed,
   "let me think about it".

## Steps

1. **Find who needs a warm follow-up.** Use whatever you can read, in this order:
   - CWS OS Sales data (Supabase project `cws-os-staging`, which is production): leads that
     replied, have a call or proposal recorded, or have an open promise. Read only.
   - The email or WhatsApp thread Tulio pastes or points to.
   - If you can read neither, ask Tulio for the thread. Don't guess what the prospect said.
2. **For each person, pull the facts**: business name, what they do, what they said last,
   what we offered, when we last spoke. Note anything missing instead of filling it in.
3. **Pick the language.** Reply in the language the prospect used. If unknown, Spanish
   first for contractor leads from the Negocio Listo pages, English otherwise.
4. **Draft the message** using the rules below. One message per person.
5. **Hand back a short list**, most valuable first:
   - Who, why now (one line), channel (email / WhatsApp / text / call)
   - The draft, ready to copy
   - Anything Tulio must decide first (price, scope, a promise)

## Writing rules

- Short. 3–6 sentences for email, 1–3 for WhatsApp or text.
- Sound like Tulio: warm, direct, neighborly. Lead with care, craft and trust, never with
  AI or technology.
- Refer to something specific they said or something we found on their Google profile
  or site.
- One clear next step with a time ("¿Te queda bien el jueves a las 4?"), not "let me know".
- No pressure tactics, fake urgency or invented deadlines.
- Never quote a price, discount or setup fee that Tulio hasn't confirmed in this
  conversation or that isn't on the current Negocio Listo page. If price comes up, say a
  proposal is coming, and flag it for Tulio.
- Never promise delivery dates, results ("you'll rank #1") or work outside the plan.
- Commercial cold email rules (postal address, opt-out) live in CWS OS. A one-to-one reply
  in an existing conversation doesn't need them, but never add someone to a sequence or
  mailing list from here.

## Hard limits

- Draft only. Tulio sends. Never send email, WhatsApp, texts or DMs, and never change lead
  status in CWS OS.
- Don't write prospect details into this repository (it is public).

## Example

Prospect wrote: "Me interesa pero ¿cuánto cuesta?"

> Hola Marco, gracias por escribir. Revisé tu perfil de Google y te faltan fotos de
> trabajos y el horario, por eso casi no sales en Maps en Cicero. El precio depende del
> plan; te mando una propuesta sencilla de una página después de una llamada de 15 minutos.
> ¿Te queda bien mañana a las 5?

Flag for Tulio: prospect asked for price; proposal needed after the call.

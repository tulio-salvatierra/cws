/* global process */

import { Resend } from 'resend'

let resendClient

export function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    return null
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }

  return resendClient
}

export function getFromEmail() {
  const from = process.env.RESEND_FROM_EMAIL

  if (!from) {
    return null
  }

  if (from.includes('<')) {
    return from
  }

  return `Cicero Web Studio <${from}>`
}

export async function sendResendEmail(payload, options = {}) {
  const resend = getResendClient()

  if (!resend) {
    return {
      data: null,
      error: { message: 'Missing Resend API key.' },
    }
  }

  const { idempotencyKey: payloadKey, ...emailPayload } = payload
  const idempotencyKey = options.idempotencyKey ?? payloadKey
  const requestOptions = idempotencyKey ? { idempotencyKey } : undefined
  const { data, error } = await resend.emails.send(emailPayload, requestOptions)
  return { data, error }
}

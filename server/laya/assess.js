/* global process */

const POLICY_VERSION = 'cws-laya-shadow-v1'
const TIMEOUT_MS = 6_000

export async function assessDraftSafely({ topic, draft, brief }) {
  const url = process.env.LAYA_SERVICE_URL?.trim()
  const token = process.env.LAYA_SERVICE_TOKEN?.trim()

  if (!url || !token) {
    return {
      available: false,
      mode: 'shadow-only',
      policy_version: POLICY_VERSION,
      status: 'not_configured',
    }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        policy_version: POLICY_VERSION,
        state: { topic, draft, channel_brief: brief },
      }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(payload.error || `Laya service returned ${response.status}.`)
    if (payload?.mode !== 'shadow-only' || payload?.policy_version !== POLICY_VERSION || !payload?.result?.answers) {
      throw new Error('Laya service returned an invalid assessment.')
    }
    return { available: true, ...payload }
  } catch (error) {
    return {
      available: false,
      mode: 'shadow-only',
      policy_version: POLICY_VERSION,
      status: 'unavailable',
      error: safeErrorMessage(error),
    }
  }
}

function safeErrorMessage(error) {
  const message = error instanceof Error ? error.message : ''
  return message && message.length <= 200 ? message : 'Laya assessment unavailable.'
}

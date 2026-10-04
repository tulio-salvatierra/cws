/* global process */
export async function assessDraftSafely({ topic, draft, brief }) {
  const url = process.env.LAYA_SERVICE_URL?.trim()
  const token = process.env.LAYA_SERVICE_TOKEN?.trim()
  if (!url || !token) return { available: false, status: 'not_configured', mode: 'shadow-only' }
  try {
    const response = await fetch(url, {
      method: 'POST', signal: AbortSignal.timeout(50_000),
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ policy_version: 'cws-laya-shadow-v1', state: { topic, draft, channel_brief: brief } }),
    })
    const payload = await response.json()
    const answers = payload?.result?.answers
    const probability = value => Number.isFinite(value) && value >= 0 && value <= 1
    if (!response.ok || payload?.mode !== 'shadow-only' || payload?.policy_version !== 'cws-laya-shadow-v1'
      || !probability(answers?.forbidden_claim?.noul) || !probability(answers?.review_priority?.confidence)
      || !['allow', 'review', 'block'].includes(answers?.review_priority?.choice)
      || !Number.isFinite(answers?.brief_fit?.score) || answers.brief_fit.score < 0 || answers.brief_fit.score > 3) throw new Error('Invalid assessment')
    return { ...payload, available: true }
  } catch {
    return { available: false, status: 'unavailable', mode: 'shadow-only' }
  }
}

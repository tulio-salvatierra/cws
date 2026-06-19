/* global process */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  if (!process.env.GOOGLE_SHEETS_WEBHOOK_URL || !process.env.GOOGLE_SHEETS_WEBHOOK_SECRET) {
    return res.status(500).json({
      ok: false,
      error: 'Missing Google Sheets webhook environment variables.',
    })
  }

  const response = await fetch(process.env.GOOGLE_SHEETS_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...req.body,
      secret: process.env.GOOGLE_SHEETS_WEBHOOK_SECRET,
    }),
  })

  const result = await response.json().catch(() => null)

  if (!response.ok || result?.ok === false) {
    return res.status(502).json({
      ok: false,
      error: result?.error || 'Google Sheet sync failed',
    })
  }

  return res.status(200).json({ ok: true, result })
}

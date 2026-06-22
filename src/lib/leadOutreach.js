export async function sendLeadOutreachEmail({ lead, type, personalNote = '' }) {
  const response = await fetch('/api/lead-outreach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lead, type, personalNote }),
  })

  const result = await response.json().catch(() => null)

  if (!response.ok || result?.ok === false) {
    throw new Error(result?.error || `Lead outreach failed with status ${response.status}`)
  }

  return {
    leadId: lead.id,
    type,
    sent: true,
    result,
  }
}

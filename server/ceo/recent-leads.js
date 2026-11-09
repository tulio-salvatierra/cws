// Leads added or contacted in the last 7 Chicago days, for the CEO Today list.
// Read-only: owner actions on these rows go through the Sales endpoint.
const DAY_MS = 24 * 60 * 60 * 1000
const CLOSED = new Set(['won', 'lost'])

export function chicagoDay(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

function sourceNotes(source) {
  if (typeof source !== 'string' || !source.trim().startsWith('{')) return { hypothesis: null, address: null }
  try {
    const parsed = JSON.parse(source)
    const text = (value, max) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null)
    return { hypothesis: text(parsed.opportunity_hypothesis, 300), address: text(parsed.address, 120) }
  } catch {
    return { hypothesis: null, address: null }
  }
}

export function buildRecentLeads({ leads = [], now = new Date(), days = 7, limit = 40 } = {}) {
  const since = chicagoDay(new Date(now.getTime() - (days - 1) * DAY_MS))
  const rows = []
  for (const lead of leads) {
    if (!lead?.id || lead.is_test === true || CLOSED.has(lead.status)) continue
    const addedOn = chicagoDay(lead.created_at)
    const contactedOn = chicagoDay(lead.last_contacted_at)
    const added = addedOn && addedOn >= since
    const contacted = contactedOn && contactedOn >= since
    if (!added && !contacted) continue
    const notes = sourceNotes(lead.source)
    rows.push({
      id: lead.id,
      business: lead.company || lead.name || lead.email || lead.phone || 'Lead',
      contact_name: lead.company && lead.name ? lead.name : null,
      email: lead.email || null,
      phone: lead.phone || null,
      locality: lead.locality || null,
      status: lead.status || 'new',
      response_state: lead.response_state || null,
      sales_classification: lead.sales_classification || null,
      added_on: addedOn,
      contacted_on: contactedOn,
      added_this_week: Boolean(added),
      hypothesis: notes.hypothesis,
      address: notes.address,
    })
  }
  rows.sort((a, b) => String(b.contacted_on || b.added_on).localeCompare(String(a.contacted_on || a.added_on)) || a.business.localeCompare(b.business))
  return { since, total: rows.length, items: rows.slice(0, limit) }
}

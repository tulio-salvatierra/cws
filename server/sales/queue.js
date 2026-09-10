export const CHICAGO_TIME_ZONE = 'America/Chicago'
export const DAILY_NEW_PROSPECT_TARGET = 5

const PRIORITY = {
  inbound: 1,
  promised: 2,
  warm: 3,
  follow_up: 4,
  new_prospect: 5,
}
const SUCCESSFUL_SEND_STATUSES = new Set(['sent', 'delivered'])
const CLOSED_LEAD_STATUSES = new Set(['won', 'lost', 'unresponsive'])

export function chicagoDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error('A valid current time is required.')
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CHICAGO_TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date)
  const get = (type) => parts.find((part) => part.type === type)?.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function addCalendarDays(dateString, days) {
  const [year, month, day] = String(dateString).split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return date.toISOString().slice(0, 10)
}

export function isChicagoBusinessDay(value = new Date()) {
  const [year, month, day] = chicagoDate(value).split('-').map(Number)
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return weekday !== 0 && weekday !== 6
}

export function deriveFollowUpState(sends, today) {
  const successful = sends
    .filter((send) => SUCCESSFUL_SEND_STATUSES.has(send.status))
    .sort((a, b) => timestamp(a).localeCompare(timestamp(b)) || String(a.id || '').localeCompare(String(b.id || '')))
  const initial = successful.find((send) => send.send_type === 'intro')
  if (!initial) return { state: 'day_0', initialSentAt: null, dueOn: null, followUpCount: 0 }

  const initialDate = chicagoDate(initial.sent_at || initial.created_at)
  // A historic follow-up from before the current initial contact must not
  // advance this sequence. The outbound history is the source of truth.
  const initialTimestamp = timestamp(initial)
  const followUpCount = successful.filter((send) => (
    send.send_type === 'follow_up' && timestamp(send) > initialTimestamp
  )).length
  if (followUpCount >= 2) return { state: 'dormant', initialSentAt: initial.sent_at || initial.created_at, dueOn: null, followUpCount }

  const dueOn = addCalendarDays(initialDate, followUpCount === 0 ? 4 : 10)
  if (today >= dueOn) {
    return {
      state: followUpCount === 0 ? 'day_4_due' : 'day_10_due',
      initialSentAt: initial.sent_at || initial.created_at,
      dueOn,
      followUpCount,
    }
  }
  return { state: 'waiting', initialSentAt: initial.sent_at || initial.created_at, dueOn, followUpCount }
}

export function buildSalesCommandQueue({ leads = [], promisedActions = [], outreachSends = [], now = new Date() }) {
  const today = chicagoDate(now)
  const sendsByLead = new Map()
  outreachSends.forEach((send) => {
    if (!send.lead_id) return
    const sends = sendsByLead.get(send.lead_id) || []
    sends.push(send)
    sendsByLead.set(send.lead_id, sends)
  })

  const leadsById = new Map(leads.map((lead) => [lead.id, lead]))
  const items = []
  const classifiedLeadIds = new Set()
  for (const lead of leads) {
    if (lead.sales_classification) classifiedLeadIds.add(lead.id)
    if (!isActive(lead)) continue
    if (lead.sales_classification === 'inbound') {
      items.push(commandItem('inbound', lead, {
        actionableOn: chicagoDate(lead.created_at),
        reason: 'Inbound lead awaiting a Sales response',
        ...contactRecommendation(lead, 'Prepare email', 'Call', 'intro'),
      }))
      continue
    }
    if (lead.sales_classification !== 'prospect') continue
    if (lead.response_state === 'warm') {
      items.push(commandItem('warm', lead, {
        actionableOn: chicagoDate(lead.created_at),
        reason: 'Warm response needs an owner reply',
        ...contactRecommendation(lead, 'Prepare email', 'Call'),
      }))
      continue
    }
    const sequence = deriveFollowUpState(sendsByLead.get(lead.id) || [], today)
    if (sequence.state === 'day_0') {
      items.push(commandItem('new_prospect', lead, {
        actionableOn: chicagoDate(lead.created_at),
        reason: 'No successful initial outreach yet',
        ...contactRecommendation(lead, 'Prepare initial email', 'Call', 'intro'),
      }))
    } else if (sequence.state === 'day_4_due' || sequence.state === 'day_10_due') {
      const finalFollowUp = sequence.state === 'day_10_due'
      items.push(commandItem('follow_up', lead, {
        actionableOn: sequence.dueOn,
        reason: finalFollowUp ? 'Day 10 final follow-up due' : 'Day 4 follow-up due',
        ...contactRecommendation(lead, finalFollowUp ? 'Prepare final follow-up' : 'Prepare follow-up', 'Call', 'follow_up'),
        sequence,
      }))
    }
  }

  promisedActions
    .filter((action) => !action.completed_at && action.due_on <= today && leadsById.has(action.lead_id))
    .forEach((action) => {
      const lead = leadsById.get(action.lead_id)
      items.push(commandItem('promised', lead, {
        id: action.id,
        actionableOn: action.due_on,
        reason: `Promised action due: ${action.action_text}`,
        recommendation: 'Complete promised action',
        promisedAction: action,
      }))
    })

  const sortedItems = items.sort(compareItems)
  const prospectInitialsToday = new Set(
    outreachSends
      .filter((send) => SUCCESSFUL_SEND_STATUSES.has(send.status) && send.send_type === 'intro' && chicagoDate(send.sent_at || send.created_at) === today)
      .filter((send) => leadsById.get(send.lead_id)?.sales_classification === 'prospect')
      .map((send) => send.lead_id),
  ).size
  const businessDay = isChicagoBusinessDay(now)
  const target = businessDay ? DAILY_NEW_PROSPECT_TARGET : 0
  const summary = {
    today,
    newOutreachToday: prospectInitialsToday,
    dailyTarget: target,
    newProspectContactsRemaining: Math.max(0, target - prospectInitialsToday),
    dueFollowUps: sortedItems.filter((item) => item.category === 'follow_up').length,
    warmResponses: sortedItems.filter((item) => item.category === 'warm').length,
    promisedActionsDue: sortedItems.filter((item) => item.category === 'promised').length,
    unclassifiedLeads: leads.length - classifiedLeadIds.size,
  }
  return { items: sortedItems, summary }
}

function contactRecommendation(lead, emailRecommendation, phoneRecommendation, sendType = 'follow_up') {
  return lead.email
    ? { recommendation: emailRecommendation, sendType }
    : { recommendation: phoneRecommendation, sendType: null, phone_only: true }
}

function commandItem(category, lead, details) {
  return {
    id: `${category}:${details.id || lead.id}`,
    category,
    priority: PRIORITY[category],
    lead: {
      id: lead.id, name: lead.name, email: lead.email, company: lead.company,
      phone: lead.phone, locality: lead.locality, status: lead.status,
      sales_classification: lead.sales_classification, response_state: lead.response_state,
      last_contacted_at: lead.last_contacted_at, created_at: lead.created_at,
    },
    ...details,
  }
}

function isActive(lead) {
  return !CLOSED_LEAD_STATUSES.has(lead.status)
}

function compareItems(a, b) {
  return a.priority - b.priority
    || String(a.actionableOn).localeCompare(String(b.actionableOn))
    || timestamp(a.promisedAction || a.lead).localeCompare(timestamp(b.promisedAction || b.lead))
    || a.id.localeCompare(b.id)
}

function timestamp(value) {
  return String(value.sent_at || value.created_at || '')
}

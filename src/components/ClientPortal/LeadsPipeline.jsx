import { useMemo, useState } from 'react'
import {
  LEAD_OUTREACH_TYPES,
  LEAD_STATUS_OPTIONS,
} from '../../data/clientPortalLeads'
import { sendLeadOutreachEmail } from '../../lib/leadOutreach'

const statusStyles = {
  New: 'border-zinc-200 bg-zinc-100 text-zinc-700',
  Researching: 'border-indigo-200 bg-indigo-100 text-indigo-800',
  'Ready to Contact': 'border-orange-200 bg-orange-100 text-orange-800',
  Contacted: 'border-sky-200 bg-sky-100 text-sky-800',
  'Follow-Up': 'border-amber-200 bg-amber-100 text-amber-800',
  Qualified: 'border-emerald-200 bg-emerald-100 text-emerald-800',
  Won: 'border-lime-200 bg-lime-100 text-lime-800',
  Lost: 'border-rose-200 bg-rose-100 text-rose-800',
  'Do Not Contact': 'border-zinc-300 bg-zinc-200 text-zinc-600',
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function cloneLead(lead) {
  return {
    ...lead,
    activity: (lead.activity || []).map((entry) => ({ ...entry })),
  }
}

export default function LeadsPipeline({ initialLeads }) {
  const [leads, setLeads] = useState(() => initialLeads.map(cloneLead))
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeads[0]?.id)
  const [personalNote, setPersonalNote] = useState('')
  const [noteText, setNoteText] = useState('')
  const [sendStatus, setSendStatus] = useState('')
  const [sendingType, setSendingType] = useState('')

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) || leads[0],
    [leads, selectedLeadId],
  )

  const metrics = useMemo(() => buildLeadMetrics(leads), [leads])

  function patchLead(leadId, updateLead) {
    setLeads((currentLeads) =>
      currentLeads.map((lead) => (lead.id === leadId ? updateLead(lead) : lead)),
    )
  }

  function updateSelectedLead(patch) {
    patchLead(selectedLead.id, (lead) => ({ ...lead, ...patch }))
  }

  function appendActivity(entry, patch = {}) {
    patchLead(selectedLead.id, (lead) => ({
      ...lead,
      ...patch,
      activity: [
        {
          id: `${lead.id}-${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          ...entry,
        },
        ...(lead.activity || []),
      ],
    }))
  }

  async function handleSendOutreach(type) {
    setSendStatus('')
    setSendingType(type)

    try {
      await sendLeadOutreachEmail({ lead: selectedLead, type, personalNote })
      const nextStatus = type === 'followUp' ? 'Follow-Up' : 'Contacted'

      appendActivity(
        {
          type: LEAD_OUTREACH_TYPES[type].activityLabel,
          summary: personalNote.trim() || `${LEAD_OUTREACH_TYPES[type].activityLabel} sent.`,
        },
        {
          status: nextStatus,
          lastContacted: new Date().toISOString().slice(0, 10),
        },
      )
      setPersonalNote('')
      setSendStatus(`${LEAD_OUTREACH_TYPES[type].activityLabel} sent.`)
    } catch (error) {
      setSendStatus(error instanceof Error ? error.message : 'Outreach could not be sent.')
    } finally {
      setSendingType('')
    }
  }

  function handleAddNote(event) {
    event.preventDefault()
    if (!noteText.trim()) return

    appendActivity({
      type: 'Note',
      summary: noteText.trim(),
    })
    setNoteText('')
  }

  function handleDoNotContact() {
    appendActivity(
      {
        type: 'Compliance',
        summary: 'Lead marked do not contact.',
      },
      {
        status: 'Do Not Contact',
        doNotContact: true,
      },
    )
    setSendStatus('Lead marked do not contact.')
  }

  if (!selectedLead) {
    return (
      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-zinc-600">No leads have been added yet.</p>
      </section>
    )
  }

  const emailDisabled = selectedLead.doNotContact || selectedLead.status === 'Do Not Contact'

  return (
    <div className="grid gap-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <LeadMetric label="Open leads" value={metrics.openLeads} />
        <LeadMetric label="Ready" value={metrics.readyToContact} />
        <LeadMetric label="Follow-up" value={metrics.followUps} />
        <LeadMetric label="Qualified" value={metrics.qualified} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <h2 className="text-sm font-bold text-zinc-950 shadow-none">Lead pipeline</h2>
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {leads.length} total
            </span>
          </div>

          <div className="divide-y divide-zinc-200">
            {leads.map((lead) => (
              <button
                key={lead.id}
                type="button"
                onClick={() => {
                  setSelectedLeadId(lead.id)
                  setSendStatus('')
                }}
                className={`block w-full px-4 py-4 text-left transition hover:bg-zinc-50 ${
                  selectedLead.id === lead.id ? 'bg-orange-50/70' : 'bg-white'
                }`}
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-base font-bold text-zinc-950 shadow-none">
                      {lead.businessName}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-600">
                      {lead.source} · Fit {lead.fitScore}/100
                    </p>
                  </div>
                  <LeadStatusBadge status={lead.status} />
                </div>
              </button>
            ))}
          </div>
        </div>

        <aside className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
              Selected lead
            </p>
            <h2 className="mt-1 text-xl font-main text-zinc-950 shadow-none">
              {selectedLead.businessName}
            </h2>
            <p className="text-sm text-zinc-600">{selectedLead.email}</p>
          </div>

          <div className="grid gap-4">
            <LeadField label="Status">
              <select
                value={selectedLead.status}
                onChange={(event) => updateSelectedLead({ status: event.target.value })}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                {LEAD_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </LeadField>

            <LeadField label="Next follow-up">
              <input
                type="date"
                value={selectedLead.nextFollowUpDate || ''}
                onChange={(event) => updateSelectedLead({ nextFollowUpDate: event.target.value })}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </LeadField>

            <LeadField label="Outreach note">
              <textarea
                value={personalNote}
                onChange={(event) => setPersonalNote(event.target.value)}
                rows={4}
                placeholder="Optional line to personalize the email..."
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </LeadField>

            <div className="grid gap-2 sm:grid-cols-2">
              <ActionButton
                disabled={emailDisabled || Boolean(sendingType)}
                onClick={() => handleSendOutreach('intro')}
              >
                {sendingType === 'intro' ? 'Sending...' : LEAD_OUTREACH_TYPES.intro.label}
              </ActionButton>
              <ActionButton
                variant="secondary"
                disabled={emailDisabled || Boolean(sendingType)}
                onClick={() => handleSendOutreach('followUp')}
              >
                {sendingType === 'followUp'
                  ? 'Sending...'
                  : LEAD_OUTREACH_TYPES.followUp.label}
              </ActionButton>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <ActionButton
                variant="secondary"
                onClick={() => updateSelectedLead({ status: 'Won' })}
              >
                Convert to client
              </ActionButton>
              <ActionButton variant="danger" onClick={handleDoNotContact}>
                Do not contact
              </ActionButton>
            </div>

            {sendStatus && (
              <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700">
                {sendStatus}
              </p>
            )}
          </div>
        </aside>
      </section>

      <section className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-zinc-950 shadow-none">Lead record</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <LeadInfo label="Contact" value={selectedLead.contactName} />
            <LeadInfo label="Phone" value={selectedLead.phone} />
            <LeadInfo label="Last contacted" value={formatDate(selectedLead.lastContacted)} />
            <LeadInfo label="Next follow-up" value={formatDate(selectedLead.nextFollowUpDate)} />
            <LeadInfo label="Notes" value={selectedLead.notes} />
          </dl>

          <div className="mt-5 grid gap-2">
            {selectedLead.websiteUrl && (
              <LeadLink href={selectedLead.websiteUrl}>Website</LeadLink>
            )}
            {selectedLead.googleBusinessProfileUrl && (
              <LeadLink href={selectedLead.googleBusinessProfileUrl}>
                Google Business Profile
              </LeadLink>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-950 shadow-none">Activity</h2>
              <p className="text-sm text-zinc-500">Notes and outreach history for this lead.</p>
            </div>
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                placeholder="Add note..."
                className="min-w-0 rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
              <button
                type="submit"
                className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
              >
                Add
              </button>
            </form>
          </div>

          <ul className="mt-4 space-y-2">
            {(selectedLead.activity || []).map((entry) => (
              <li key={entry.id} className="rounded-md border border-zinc-200 px-3 py-2">
                <p className="text-sm font-semibold text-zinc-900">
                  {entry.type} · {formatDate(entry.date)}
                </p>
                <p className="mt-1 text-sm text-zinc-600">{entry.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}

function LeadMetric({ label, value }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-main text-zinc-950 shadow-none">{value}</p>
    </div>
  )
}

function LeadStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${
        statusStyles[status] || statusStyles.New
      }`}
    >
      {status}
    </span>
  )
}

function LeadField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  )
}

function LeadInfo({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-1 text-zinc-900">{value || 'Not provided'}</dd>
    </div>
  )
}

function LeadLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-10 items-center justify-center rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:border-orange-500 hover:text-orange-700"
    >
      {children}
    </a>
  )
}

function ActionButton({ children, disabled = false, onClick, variant = 'primary' }) {
  const variantClass =
    variant === 'danger'
      ? 'border border-rose-200 text-rose-700 hover:border-rose-400 hover:bg-rose-50'
      : variant === 'secondary'
        ? 'border border-zinc-300 text-zinc-800 hover:border-orange-500 hover:text-orange-700'
        : 'bg-zinc-950 text-white hover:bg-orange-700'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-h-10 rounded-md px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400 ${variantClass}`}
    >
      {children}
    </button>
  )
}

function buildLeadMetrics(leads) {
  return {
    openLeads: leads.filter((lead) => !['Won', 'Lost', 'Do Not Contact'].includes(lead.status)).length,
    readyToContact: leads.filter((lead) => lead.status === 'Ready to Contact').length,
    followUps: leads.filter((lead) => lead.status === 'Follow-Up').length,
    qualified: leads.filter((lead) => lead.status === 'Qualified').length,
  }
}

function formatDate(dateValue) {
  if (!dateValue) return 'Not set'

  return dateFormatter.format(new Date(`${dateValue}T00:00:00`))
}

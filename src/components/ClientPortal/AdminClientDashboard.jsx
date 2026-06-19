import { useMemo, useState } from 'react'
import {
  DEFAULT_PROJECT_PHASES,
  PROJECT_STATUS_OPTIONS,
  clientPortalClients,
} from '../../data/clientPortalData'
import { CLIENT_PORTAL_GOOGLE_SHEET } from '../../lib/clientPortalGoogleSheet'
import {
  sendClientPortalUpdate,
  notifyClientWhenReportIsReady,
  sendProjectPhaseUpdate,
  sendProjectStatusUpdate,
} from '../../lib/clientPortalAutomations'
import DeliverablesChecklist from './DeliverablesChecklist'
import StatusBadge from './StatusBadge'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function cloneClient(client) {
  return {
    ...client,
    socialMediaLinks: [...(client.socialMediaLinks || [])],
    nextSteps: [...(client.nextSteps || [])],
    deliverables: (client.deliverables || []).map((deliverable) => ({ ...deliverable })),
    reportLinks: (client.reportLinks || []).map((link) => ({ ...link })),
    adminNotes: [...(client.adminNotes || [])],
    communicationLog: (client.communicationLog || []).map((entry) => ({ ...entry })),
  }
}

export default function AdminClientDashboard() {
  const [clients, setClients] = useState(() => clientPortalClients.map(cloneClient))
  const [selectedClientId, setSelectedClientId] = useState(clientPortalClients[0].id)
  const [noteText, setNoteText] = useState('')
  const [sheetSyncStatus, setSheetSyncStatus] = useState('')

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) || clients[0],
    [clients, selectedClientId],
  )

  function updateSelectedClient(patch) {
    setClients((currentClients) =>
      currentClients.map((client) =>
        client.id === selectedClient.id ? { ...client, ...patch } : client,
      ),
    )
  }

  function handleProjectStatusChange(nextStatus) {
    updateSelectedClient({ projectStatus: nextStatus })
    void sendProjectStatusUpdate(selectedClient, nextStatus)
  }

  function handlePhaseChange(nextPhase) {
    updateSelectedClient({ currentPhase: nextPhase })
    void sendProjectPhaseUpdate(selectedClient, nextPhase)
  }

  function toggleDeliverable(deliverableId) {
    updateSelectedClient({
      deliverables: selectedClient.deliverables.map((deliverable) =>
        deliverable.id === deliverableId
          ? {
              ...deliverable,
              completed: !deliverable.completed,
              status: deliverable.completed ? 'Not Started' : 'Complete',
            }
          : deliverable,
      ),
    })
  }

  function handleAddNote(event) {
    event.preventDefault()
    if (!noteText.trim()) return

    updateSelectedClient({
      adminNotes: [noteText.trim(), ...selectedClient.adminNotes],
    })
    setNoteText('')
  }

  function updatePrimaryReportLink(value) {
    const nextLinks = selectedClient.reportLinks.length
      ? selectedClient.reportLinks.map((link, index) =>
          index === 0 ? { ...link, url: value } : link,
        )
      : [{ label: 'Strategy report', url: value }]

    updateSelectedClient({ reportLinks: nextLinks })
    void notifyClientWhenReportIsReady(selectedClient, value)
  }

  async function syncSelectedClientToSheet() {
    setSheetSyncStatus('Syncing workbook tabs...')
    const latestClient = clients.find((client) => client.id === selectedClient.id) || selectedClient
    const result = await sendClientPortalUpdate(latestClient, { manualSync: true })

    setSheetSyncStatus(
      result?.synced
        ? 'Workbook sync sent.'
        : 'Workbook sync payload is ready. Add the webhook URL to write live.',
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white shadow-none">Client Portal Admin</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage onboarding, phases, deliverables, balances, links, and notes.
          </p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-gray-300">
          {clients.length} active clients
        </div>
      </div>

      <section className="mb-5 rounded-lg border border-orange-500/30 bg-orange-500/10 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-300">
              Google Sheet source
            </p>
            <h2 className="mt-1 text-base font-semibold text-white shadow-none">
              {CLIENT_PORTAL_GOOGLE_SHEET.label}
            </h2>
            <p className="mt-1 text-sm text-orange-100/80">
              Sheet ID {CLIENT_PORTAL_GOOGLE_SHEET.id} · tab {CLIENT_PORTAL_GOOGLE_SHEET.gid}
            </p>
          </div>
          <a
            href={CLIENT_PORTAL_GOOGLE_SHEET.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-bold text-gray-950 transition hover:bg-orange-100"
          >
            Open Sheet
          </a>
          <button
            type="button"
            onClick={syncSelectedClientToSheet}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-orange-200 px-4 py-2 text-sm font-bold text-orange-100 transition hover:bg-orange-500/20"
          >
            Sync Selected Client
          </button>
        </div>
        {sheetSyncStatus && (
          <p className="mt-3 text-sm font-medium text-orange-100">{sheetSyncStatus}</p>
        )}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
          <div className="border-b border-gray-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-white shadow-none">All clients</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-gray-950 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Phase</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Deposit</th>
                  <th className="px-4 py-3 text-right">Open</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className={`border-t border-gray-800 ${
                      selectedClient.id === client.id ? 'bg-gray-800/80' : 'bg-gray-900'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{client.businessName}</p>
                      <p className="text-xs text-gray-500">{client.clientName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={client.projectStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-300">{client.currentPhase}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {currencyFormatter.format(client.balanceDue)}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {client.depositPaid ? 'Paid' : 'Unpaid'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedClientId(client.id)}
                        className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-200 transition hover:border-orange-400 hover:text-orange-300"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-300">Selected client</p>
            <h2 className="mt-1 text-lg font-semibold text-white shadow-none">
              {selectedClient.businessName}
            </h2>
            <p className="text-sm text-gray-400">{selectedClient.email}</p>
          </div>

          <div className="grid gap-4">
            <Field label="Project status">
              <select
                value={selectedClient.projectStatus}
                onChange={(event) => handleProjectStatusChange(event.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-orange-400"
              >
                {PROJECT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Current phase">
              <select
                value={selectedClient.currentPhase}
                onChange={(event) => handlePhaseChange(event.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-orange-400"
              >
                {DEFAULT_PROJECT_PHASES.map((phase) => (
                  <option key={phase} value={phase}>
                    {phase}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <Field label="Balance due">
                <input
                  type="number"
                  min="0"
                  value={selectedClient.balanceDue}
                  onChange={(event) =>
                    updateSelectedClient({ balanceDue: Number(event.target.value || 0) })
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-orange-400"
                />
              </Field>

              <label className="flex min-h-11 items-center gap-3 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-200">
                <input
                  type="checkbox"
                  checked={selectedClient.depositPaid}
                  onChange={(event) => updateSelectedClient({ depositPaid: event.target.checked })}
                  className="h-4 w-4 accent-orange-500"
                />
                Deposit paid
              </label>
            </div>

            <Field label="Google Drive folder">
              <input
                type="url"
                value={selectedClient.googleDriveFolderUrl}
                onChange={(event) => updateSelectedClient({ googleDriveFolderUrl: event.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-orange-400"
              />
            </Field>

            <Field label="Primary report link">
              <input
                type="url"
                value={selectedClient.reportLinks[0]?.url || ''}
                onChange={(event) => updatePrimaryReportLink(event.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-orange-400"
              />
            </Field>
          </div>
        </aside>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white shadow-none">Deliverables</h2>
              <p className="text-sm text-gray-500">Toggle items as project work is completed.</p>
            </div>
            <StatusBadge status={selectedClient.currentPhase} />
          </div>
          <DeliverablesChecklist
            deliverables={selectedClient.deliverables}
            onToggle={toggleDeliverable}
          />
        </section>

        <section className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <h2 className="text-sm font-semibold text-white shadow-none">Admin notes</h2>
          <form onSubmit={handleAddNote} className="mt-3 flex gap-2">
            <input
              value={noteText}
              onChange={(event) => setNoteText(event.target.value)}
              placeholder="Add note..."
              className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-orange-400"
            />
            <button
              type="submit"
              className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-500"
            >
              Add
            </button>
          </form>
          <ul className="mt-3 space-y-2">
            {selectedClient.adminNotes.map((note) => (
              <li key={note} className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-300">
                {note}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      {children}
    </label>
  )
}

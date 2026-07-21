import { useMemo, useState } from 'react'
import ClientDashboard from '../../components/ClientPortal/ClientDashboard'
import ClientIntakeForm from '../../components/ClientPortal/ClientIntakeForm'
import DeliverablesChecklist from '../../components/ClientPortal/DeliverablesChecklist'
import LeadsPipeline from '../../components/ClientPortal/LeadsPipeline'
import StatusBadge from '../../components/ClientPortal/StatusBadge'
import { clientPortalClients } from '../../data/clientPortalData'
import { clientPortalLeads } from '../../data/clientPortalLeads'

const PORTAL_VIEWS = [
  { id: 'summary', label: 'Summary' },
  { id: 'leads', label: 'Leads' },
  { id: 'project', label: 'Project' },
  { id: 'client', label: 'Client' },
  { id: 'intake', label: 'Intake' },
]

const advisorPrompts = [
  'Move one active project one phase forward today.',
  'Close one open loop before starting new production work.',
  'Confirm the next client-facing deliverable before noon.',
  'Collect one missing asset that could slow delivery.',
  'Review unpaid balances before opening new work.',
  'Turn one repeated note into a checklist item.',
  'Send one useful update to the client with the quietest log.',
]

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export default function ClientPortalPage() {
  const [activeView, setActiveView] = useState('summary')
  const [selectedClientId, setSelectedClientId] = useState(clientPortalClients[0]?.id)

  const selectedClient = useMemo(
    () =>
      clientPortalClients.find((client) => client.id === selectedClientId) ||
      clientPortalClients[0],
    [selectedClientId],
  )

  const summary = useMemo(() => buildExecutiveSummary(clientPortalClients, clientPortalLeads), [])

  return (
    <section className="min-h-screen bg-zinc-50 px-4 pb-16 pt-36 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-700">
              Cicero Web Studio
            </p>
            <h1 className="mt-2 text-4xl font-main leading-tight text-zinc-950 shadow-none md:text-5xl">
              Executive summary
            </h1>
          </div>

          <nav
            aria-label="Client portal views"
            className="flex w-full gap-1 overflow-x-auto rounded-lg border border-zinc-200 bg-white p-1 shadow-sm lg:w-auto"
          >
            {PORTAL_VIEWS.map((view) => (
              <button
                key={view.id}
                type="button"
                onClick={() => setActiveView(view.id)}
                className={`min-h-10 rounded-md px-4 text-sm font-semibold transition ${
                  activeView === view.id
                    ? 'bg-zinc-950 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
                }`}
              >
                {view.label}
              </button>
            ))}
          </nav>
        </div>

        {activeView === 'summary' && (
          <ExecutiveSummary
            clients={clientPortalClients}
            summary={summary}
            onOpenProject={(clientId) => {
              setSelectedClientId(clientId)
              setActiveView('project')
            }}
            onOpenClient={(clientId) => {
              setSelectedClientId(clientId)
              setActiveView('client')
            }}
          />
        )}

        {activeView === 'project' && selectedClient && (
          <ProjectView
            clients={clientPortalClients}
            selectedClient={selectedClient}
            onSelectClient={setSelectedClientId}
          />
        )}

        {activeView === 'leads' && <LeadsPipeline initialLeads={clientPortalLeads} />}

        {activeView === 'client' && selectedClient && (
          <ClientRecordView
            clients={clientPortalClients}
            selectedClient={selectedClient}
            onSelectClient={setSelectedClientId}
          />
        )}

        {activeView === 'intake' && (
          <div className="mx-auto max-w-4xl">
            <ClientIntakeForm />
          </div>
        )}
      </div>
    </section>
  )
}

function ExecutiveSummary({ clients, summary, onOpenProject, onOpenClient }) {
  return (
    <div className="grid gap-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric label="Active projects" value={summary.activeProjects} />
        <SummaryMetric label="Open leads" value={summary.openLeads} />
        <SummaryMetric label="Open balance" value={currencyFormatter.format(summary.openBalance)} />
        <SummaryMetric label="Open deliverables" value={summary.openDeliverables} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <h2 className="text-sm font-bold text-zinc-950 shadow-none">Current projects</h2>
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {clients.length} total
            </span>
          </div>

          <div className="divide-y divide-zinc-200">
            {clients.map((client) => (
              <div
                key={client.id}
                className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-zinc-950 shadow-none">
                      {client.businessName}
                    </h3>
                    <StatusBadge status={client.projectStatus} />
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">
                    {client.currentPhase} · {getProjectProgress(client)}% complete
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenProject(client.id)}
                    className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
                  >
                    Project
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenClient(client.id)}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-orange-500 hover:text-orange-700"
                  >
                    Client
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5">
          <section className="rounded-lg border border-zinc-950 bg-zinc-950 p-4 text-white shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-300">
              Advisor
            </p>
            <p className="mt-3 text-lg font-semibold leading-snug">{summary.advisorPrompt}</p>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-950 shadow-none">Today</h2>
            <ul className="mt-3 space-y-2">
              {summary.tasks.map((task) => (
                <li key={task.id} className="rounded-md border border-zinc-200 px-3 py-2">
                  <p className="text-sm font-semibold text-zinc-900">{task.label}</p>
                  <p className="text-xs text-zinc-500">{task.context}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>
    </div>
  )
}

function ProjectView({ clients, selectedClient, onSelectClient }) {
  return (
    <div className="grid gap-5">
      <PortalToolbar
        label="Project"
        title={selectedClient.businessName}
        clients={clients}
        selectedClient={selectedClient}
        onSelectClient={onSelectClient}
      />

      <ClientDashboard client={selectedClient} />
    </div>
  )
}

function ClientRecordView({ clients, selectedClient, onSelectClient }) {
  return (
    <div className="grid gap-5">
      <PortalToolbar
        label="Client"
        title={selectedClient.businessName}
        clients={clients}
        selectedClient={selectedClient}
        onSelectClient={onSelectClient}
      />

      <section className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-zinc-950 shadow-none">Contact</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <InfoRow label="Contact" value={selectedClient.contactName || selectedClient.clientName} />
            <InfoRow label="Email" value={selectedClient.email} />
            <InfoRow label="Phone" value={selectedClient.phone} />
            <InfoRow label="Project type" value={selectedClient.projectType} />
            <InfoRow
              label="Balance"
              value={currencyFormatter.format(selectedClient.balanceDue || 0)}
            />
          </dl>

          <div className="mt-5 grid gap-2">
            {selectedClient.websiteUrl && (
              <PortalLink href={selectedClient.websiteUrl}>Website</PortalLink>
            )}
            {selectedClient.googleBusinessProfileUrl && (
              <PortalLink href={selectedClient.googleBusinessProfileUrl}>
                Google Business Profile
              </PortalLink>
            )}
            {selectedClient.googleDriveFolderUrl && (
              <PortalLink href={selectedClient.googleDriveFolderUrl}>Drive folder</PortalLink>
            )}
          </div>
        </div>

        <div className="grid gap-5">
          <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-950 shadow-none">Intake snapshot</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <TextBlock label="Goals" value={selectedClient.topGoals || selectedClient.businessGoals} />
              <TextBlock label="Services" value={selectedClient.servicesOffered} />
              <TextBlock label="Service area" value={selectedClient.serviceArea} />
              <TextBlock label="Challenges" value={selectedClient.marketingChallenges} />
              <TextBlock label="Competitors" value={selectedClient.competitors} />
              <TextBlock label="Customer questions" value={selectedClient.customerQuestions} />
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-zinc-950 shadow-none">Deliverables</h2>
              <StatusBadge status={selectedClient.currentPhase} />
            </div>
            <DeliverablesChecklist deliverables={selectedClient.deliverables} compact />
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-950 shadow-none">Communication</h2>
            <ul className="mt-3 space-y-2">
              {(selectedClient.communicationLog || []).map((entry) => (
                <li key={`${entry.date}-${entry.summary}`} className="rounded-md border border-zinc-200 px-3 py-2">
                  <p className="text-sm font-semibold text-zinc-900">
                    {entry.type} · {formatDate(entry.date)}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">{entry.summary}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>
    </div>
  )
}

function PortalToolbar({ label, title, clients, selectedClient, onSelectClient }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">{label}</p>
        <h2 className="mt-1 text-2xl font-main text-zinc-950 shadow-none">{title}</h2>
      </div>

      <label className="block min-w-[240px]">
        <span className="sr-only">Select client</span>
        <select
          value={selectedClient.id}
          onChange={(event) => onSelectClient(event.target.value)}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        >
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.businessName}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

function SummaryMetric({ label, value }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-main text-zinc-950 shadow-none">{value}</p>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-1 text-zinc-900">{value || 'Not provided'}</dd>
    </div>
  )
}

function TextBlock({ label, value }) {
  return (
    <div className="rounded-md border border-zinc-200 px-3 py-2">
      <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-sm text-zinc-700">{value || 'Not provided'}</p>
    </div>
  )
}

function PortalLink({ href, children }) {
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

function buildExecutiveSummary(clients, leads) {
  const activeProjects = clients.filter((client) => client.projectStatus !== 'Delivered').length
  const openLeads = leads.filter(
    (lead) => !['Won', 'Lost', 'Do Not Contact'].includes(lead.status),
  ).length
  const openBalance = clients.reduce((total, client) => total + Number(client.balanceDue || 0), 0)
  const openDeliverables = clients.reduce(
    (total, client) =>
      total + (client.deliverables || []).filter((deliverable) => !deliverable.completed).length,
    0,
  )
  const nextDeliveryDate = getNextDeliveryDate(clients)

  return {
    activeProjects,
    openLeads,
    openBalance,
    openDeliverables,
    nextDeliveryDate,
    advisorPrompt: advisorPrompts[new Date().getDay()],
    tasks: buildTodayTasks(clients, leads),
  }
}

function buildTodayTasks(clients, leads) {
  const leadTasks = leads
    .filter((lead) => lead.nextFollowUpDate && !lead.doNotContact)
    .map((lead) => ({
      id: `${lead.id}-follow-up`,
      label: `Follow up with ${lead.businessName}`,
      context: formatDate(lead.nextFollowUpDate),
    }))

  const nextSteps = clients.flatMap((client) =>
    (client.nextSteps || []).map((step, index) => ({
      id: `${client.id}-step-${index}`,
      label: step,
      context: client.businessName,
    })),
  )

  const balanceTasks = clients
    .filter((client) => Number(client.balanceDue || 0) > 0)
    .map((client) => ({
      id: `${client.id}-balance`,
      label: `Review ${currencyFormatter.format(client.balanceDue)} balance`,
      context: client.businessName,
    }))

  return [...leadTasks, ...nextSteps, ...balanceTasks].slice(0, 5)
}

function getProjectProgress(client) {
  const deliverables = client.deliverables || []
  if (!deliverables.length) return 0

  const completed = deliverables.filter((deliverable) => deliverable.completed).length
  return Math.round((completed / deliverables.length) * 100)
}

function getNextDeliveryDate(clients) {
  const sortedDates = clients
    .map((client) => client.estimatedDeliveryDate)
    .filter(Boolean)
    .sort()

  return sortedDates[0] ? formatDate(sortedDates[0]) : 'Not set'
}

function formatDate(dateValue) {
  if (!dateValue) return 'Not set'

  return dateFormatter.format(new Date(`${dateValue}T00:00:00`))
}

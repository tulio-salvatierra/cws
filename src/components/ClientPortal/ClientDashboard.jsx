import { DEFAULT_PROJECT_PHASES } from '../../data/clientPortalData'
import DeliverablesChecklist from './DeliverablesChecklist'
import StatusBadge from './StatusBadge'

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

function formatDate(dateValue) {
  return dateFormatter.format(new Date(`${dateValue}T00:00:00`))
}

export default function ClientDashboard({ client }) {
  const currentPhaseIndex = DEFAULT_PROJECT_PHASES.indexOf(client.currentPhase)
  const completedDeliverables = client.deliverables.filter((item) => item.completed).length
  const deliverableTotal = client.deliverables.length

  return (
    <section className="rounded-lg border border-zinc-200 bg-zinc-950 p-4 text-white shadow-xl md:p-6">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-300">Client dashboard</p>
          <h2 className="mt-1 text-2xl font-main text-white shadow-none">{client.businessName}</h2>
          <p className="mt-1 text-sm text-zinc-300">{client.clientName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={client.projectStatus} />
          <StatusBadge status={client.currentPhase} />
        </div>
      </div>

      <div className="grid gap-3 py-5 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Deposit paid" value={client.depositPaid ? 'Yes' : 'No'} />
        <Metric label="Balance due" value={currencyFormatter.format(client.balanceDue)} />
        <Metric label="Start date" value={formatDate(client.startDate)} />
        <Metric label="Est. delivery" value={formatDate(client.estimatedDeliveryDate)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-white">Project phases</h3>
            <span className="text-xs text-zinc-400">
              {Math.max(currentPhaseIndex + 1, 1)} of {DEFAULT_PROJECT_PHASES.length}
            </span>
          </div>
          <ol className="grid gap-2">
            {DEFAULT_PROJECT_PHASES.map((phase, index) => {
              const isComplete = index < currentPhaseIndex
              const isCurrent = phase === client.currentPhase

              return (
                <li key={phase} className="flex items-center gap-3 text-sm">
                  <span
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                      isComplete
                        ? 'border-emerald-400 bg-emerald-400 text-zinc-950'
                        : isCurrent
                          ? 'border-orange-300 bg-orange-300 text-zinc-950'
                          : 'border-zinc-700 text-zinc-500'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className={isCurrent ? 'font-semibold text-white' : 'text-zinc-300'}>
                    {phase}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-white">Next steps</h3>
            <span className="text-xs text-zinc-400">
              {completedDeliverables}/{deliverableTotal} done
            </span>
          </div>
          <ul className="space-y-2">
            {client.nextSteps.map((step) => (
              <li key={step} className="rounded-lg bg-white/10 px-3 py-2 text-sm text-zinc-100">
                {step}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-white/10 bg-zinc-100 p-4 text-zinc-950">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-950">Deliverables checklist</h3>
            <p className="text-sm text-zinc-600">Progress shown from the current mock project file.</p>
          </div>
          <a
            href={client.googleDriveFolderUrl}
            className="text-sm font-semibold text-orange-700 hover:text-zinc-950"
            target="_blank"
            rel="noreferrer"
          >
            Drive folder
          </a>
        </div>
        <DeliverablesChecklist deliverables={client.deliverables} />
      </div>
    </section>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-base font-bold text-white">{value}</p>
    </div>
  )
}

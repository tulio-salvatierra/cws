import ClientDashboard from '../../components/ClientPortal/ClientDashboard'
import ClientIntakeForm from '../../components/ClientPortal/ClientIntakeForm'
import { clientPortalClients } from '../../data/clientPortalData'

export default function ClientPortalPage() {
  const demoClient = clientPortalClients[0]

  return (
    <section className="min-h-screen px-4 pb-16 pt-36 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-800">
            Cicero Web Studio
          </p>
          <h1 className="mt-2 text-4xl font-main leading-tight text-zinc-950 shadow-none md:text-5xl">
            Client portal foundation
          </h1>
          <p className="mt-3 text-base text-zinc-700">
            A lightweight workspace for intake, project progress, deliverables, payments, and future automation.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <ClientIntakeForm />
          <ClientDashboard client={demoClient} />
        </div>
      </div>
    </section>
  )
}

const STATUS_STYLES = {
  'Intake Received': 'bg-amber-100 text-amber-800 border-amber-200',
  'In Progress': 'bg-sky-100 text-sky-800 border-sky-200',
  'Waiting on Client': 'bg-orange-100 text-orange-800 border-orange-200',
  'Ready for Review': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Delivered: 'bg-violet-100 text-violet-800 border-violet-200',
  'Final Payment': 'bg-rose-100 text-rose-800 border-rose-200',
  'Research Phase': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Website Audit': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Google Business Profile Audit': 'bg-lime-100 text-lime-800 border-lime-200',
  'Social Media Audit': 'bg-pink-100 text-pink-800 border-pink-200',
  'Competitor Research': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  'Strategy Report': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Delivery Meeting': 'bg-blue-100 text-blue-800 border-blue-200',
}

export default function StatusBadge({ status }) {
  const badgeClass = STATUS_STYLES[status] || 'bg-zinc-100 text-zinc-700 border-zinc-200'

  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>
      {status}
    </span>
  )
}

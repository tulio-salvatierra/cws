import { Link } from 'react-router-dom'

const cards = [
  ['Workspace', 'Campaigns, variants, tasks, planning, knowledge, and agent runs.', '/workspace'],
  ['Campaigns', 'Manage active campaign work and content variants.', '/workspace/campaigns'],
  ['Tasks', 'Track delivery work and status.', '/workspace/tasks'],
  ['Planning', 'Goals, initiatives, and projects.', '/workspace/planning'],
  ['Knowledge', 'Decisions and learnings.', '/workspace/knowledge'],
  ['Agent runs', 'Review automation activity.', '/workspace/agent-runs'],
]

export default function AdminOverview() {
  return <div className="p-6 md:p-10"><div className="max-w-6xl"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-400">CWS Operating System</p><h1 className="mt-3 text-3xl font-semibold text-white">What needs your attention?</h1><p className="mt-3 max-w-2xl text-sm text-gray-400">One place to move work from direction to delivery. Legacy publishing tools remain available in the sidebar.</p><div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{cards.map(([title, description, to]) => <Link key={to} to={to} className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5 transition hover:border-indigo-500"><h2 className="text-lg font-semibold text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-gray-400">{description}</p><p className="mt-5 text-sm font-medium text-indigo-300">Open →</p></Link>)}</div></div></div>
}

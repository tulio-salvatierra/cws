// src/pages/admin/SettingsPage.jsx
import GenerateButton from '../../components/admin/GenerateButton'

const WORKFLOWS = [
  {
    id: 'WF1',
    name: 'Research Agent',
    schedule: 'Mon – Fri, 6 am CST',
    trigger: 'Schedule',
    description: 'GPT-4o web search → Claude extracts 5 topics → saves to research_topics → triggers WF2',
  },
  {
    id: 'WF2',
    name: 'Copy Agent',
    schedule: 'Triggered by WF1 (or manually)',
    trigger: 'Webhook',
    description: 'Picks latest research topic → Claude writes copy for 7 platforms → saves platform_posts → triggers WF3',
  },
  {
    id: 'WF3',
    name: 'Image Agent',
    schedule: 'Triggered by WF2',
    trigger: 'Webhook',
    description: 'Builds DALL-E 3 prompt → generates image → updates content_draft → triggers WF4',
  },
  {
    id: 'WF4',
    name: 'Compiler & Notifier',
    schedule: 'Triggered by WF3',
    trigger: 'Webhook',
    description: 'Assembles full content package → saves notification → marks draft review_pending',
  },
  {
    id: 'WF5',
    name: 'Scheduler',
    schedule: 'Mon – Fri, 7 am CST',
    trigger: 'Schedule',
    description: 'Picks up approved drafts → patches 7 platform_posts with staggered scheduled_at → marks draft scheduled',
  },
]

const STATUS_FLOW = [
  { label: 'draft',          style: 'bg-gray-800 text-gray-400',         note: 'WF2 creates' },
  { label: 'review_pending', style: 'bg-orange-900/70 text-orange-300',  note: 'WF4 marks' },
  { label: 'approved',       style: 'bg-yellow-900/70 text-yellow-300',  note: '← you approve' },
  { label: 'scheduled',      style: 'bg-indigo-900/70 text-indigo-300',  note: 'WF5 schedules' },
  { label: 'published',      style: 'bg-green-900/70 text-green-300',    note: 'after posting' },
]

const PLATFORM_TIMES = [
  { platform: 'LinkedIn',   time: '8 am CST',  why: 'B2B peak, professionals checking before meetings' },
  { platform: 'Instagram',  time: '9 am CST',  why: 'Mid-morning scroll peak' },
  { platform: 'Facebook',   time: '10 am CST', why: 'Best organic reach for business pages' },
  { platform: 'WhatsApp',   time: '11 am CST', why: 'Business messaging prime time' },
  { platform: 'X / Twitter',time: '12 pm CST', why: 'Lunchtime engagement spike' },
  { platform: 'Pinterest',  time: '2 pm CST',  why: 'Afternoon inspiration browsing' },
  { platform: 'YouTube',    time: '3 pm CST',  why: 'Pre-commute video consumption' },
]

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-white text-lg font-semibold mb-6">Settings</h1>

      {/* ── Manual Trigger ── */}
      <section className="mb-8">
        <h2 className="text-white text-sm font-semibold mb-1">Manual Pipeline Trigger</h2>
        <p className="text-gray-500 text-xs mb-3">
          Bypasses WF1 research and starts the copy + image pipeline directly on the latest research topic.
        </p>
        <GenerateButton webhookUrl={import.meta.env.VITE_N8N_WF2_WEBHOOK_URL} />
      </section>

      {/* ── Status flow ── */}
      <section className="mb-8">
        <h2 className="text-white text-sm font-semibold mb-3">Draft Status Flow</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FLOW.map((s, i) => (
              <div key={s.label} className="flex items-center gap-2">
                {i > 0 && <span className="text-gray-700 text-sm">→</span>}
                <div className="flex flex-col items-center gap-0.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${s.style}`}>
                    {s.label.replace('_', ' ')}
                  </span>
                  <span className="text-gray-600 text-[10px]">{s.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow pipeline ── */}
      <section className="mb-8">
        <h2 className="text-white text-sm font-semibold mb-3">n8n Workflows</h2>
        <div className="flex flex-col gap-2">
          {WORKFLOWS.map(wf => (
            <div key={wf.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-start gap-4">
              {/* Badge */}
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-950 border border-indigo-800/60 rounded-lg flex items-center justify-center mt-0.5">
                <span className="text-indigo-400 text-xs font-bold">{wf.id}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-white text-sm font-medium">{wf.name}</p>
                  <span className="bg-green-950 text-green-400 text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide">
                    active
                  </span>
                  <span className="bg-gray-800 text-gray-500 text-[10px] px-1.5 py-0.5 rounded font-medium">
                    {wf.trigger}
                  </span>
                </div>
                <p className="text-indigo-400 text-xs mb-1">{wf.schedule}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{wf.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Posting schedule ── */}
      <section>
        <h2 className="text-white text-sm font-semibold mb-1">Posting Schedule</h2>
        <p className="text-gray-500 text-xs mb-3">
          WF5 staggers posts across the day to maximise engagement on each platform.
        </p>
        <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
          {PLATFORM_TIMES.map(({ platform, time, why }) => (
            <div key={platform} className="flex items-start gap-4 px-4 py-2.5">
              <span className="text-gray-200 text-sm w-28 flex-shrink-0">{platform}</span>
              <span className="text-indigo-400 text-sm font-mono w-20 flex-shrink-0">{time}</span>
              <span className="text-gray-600 text-xs leading-relaxed">{why}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

import draft from '../server/outreach/draft.js'
import leads from '../server/outreach/leads.js'
import mailingListSend from '../server/outreach/mailing-list-send.js'
import send from '../server/outreach/send.js'
import subscribers from '../server/outreach/subscribers.js'
import templates from '../server/outreach/templates.js'

const handlers = {
  '/draft': draft,
  '/leads': leads,
  '/mailing-list-send': mailingListSend,
  '/send': send,
  '/subscribers': subscribers,
  '/templates': templates,
}

export default async function handler(req, res) {
  const rewrittenPath = Array.isArray(req.query?.path) ? req.query.path.join('/') : req.query?.path
  const pathname = rewrittenPath
    ? `/${rewrittenPath}`
    : (req.url || '').split('?')[0].replace(/^\/api\/outreach/, '') || '/'
  const target = handlers[pathname]
  if (!target) return res.status(404).json({ ok: false, error: 'Outreach route not found.' })
  return target(req, res)
}

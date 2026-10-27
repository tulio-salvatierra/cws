import { REASON_CATEGORIES } from '../../../shared/laya-feedback'

export default function LayaSavedFeedback({ response }) {
  return <>
    {response.reason_category && <p className="mt-2 text-sm">Reason category: {REASON_CATEGORIES[response.reason_category] || response.reason_category}</p>}
    {response.alternative_action && <p className="mt-2 whitespace-pre-wrap text-sm">What I would do instead: {response.alternative_action}</p>}
  </>
}

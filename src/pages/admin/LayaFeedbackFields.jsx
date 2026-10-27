import { REASON_CATEGORIES } from '../../../shared/laya-feedback'

export default function LayaFeedbackFields({ category, alternative, onCategoryChange, onAlternativeChange, disabled }) {
  return <div className="space-y-3">
    <label className="block text-sm text-gray-200">Reason category (optional)
      <select disabled={disabled} value={category} onChange={event => onCategoryChange(event.target.value)} className="mt-2 block w-full rounded bg-gray-800 p-2">
        <option value="">No category</option>
        {Object.entries(REASON_CATEGORIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </label>
    <label className="block text-sm text-gray-200">What would you do instead? (optional)
      <textarea disabled={disabled} maxLength={2000} rows={3} value={alternative} onChange={event => onAlternativeChange(event.target.value)} className="mt-2 block w-full rounded bg-gray-800 p-2" />
    </label>
    <p className="text-xs leading-5 text-gray-400">Saved with your response for later review. This does not create a task or change Laya’s behavior.</p>
  </div>
}

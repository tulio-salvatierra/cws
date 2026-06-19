import { useState } from 'react'
import { runNewIntakeAutomation } from '../../lib/clientPortalAutomations'

const TEXT_FIELDS = [
  { id: 'clientName', label: 'Client name', type: 'text', required: true },
  { id: 'businessName', label: 'Business name', type: 'text', required: true },
  { id: 'contactName', label: 'Contact name', type: 'text' },
  { id: 'email', label: 'Email', type: 'email', required: true },
  { id: 'phone', label: 'Phone', type: 'tel' },
  { id: 'websiteUrl', label: 'Website URL', type: 'url' },
  { id: 'projectType', label: 'Project type', type: 'text' },
  { id: 'socialMediaLinks', label: 'Social media links', type: 'text' },
  { id: 'googleBusinessProfileUrl', label: 'Google Business Profile URL', type: 'url' },
]

const TEXTAREA_FIELDS = [
  { id: 'businessDescription', label: 'Business description' },
  { id: 'servicesOffered', label: 'Services offered' },
  { id: 'serviceArea', label: 'Service area' },
  { id: 'topGoals', label: 'Top 3 goals' },
  { id: 'marketingChallenges', label: 'Marketing challenges' },
  { id: 'idealCustomer', label: 'Ideal customer' },
  { id: 'customerQuestions', label: 'Customer questions' },
  { id: 'competitors', label: 'Competitors' },
  { id: 'currentMarketingActivities', label: 'Current marketing activities' },
  { id: 'notes', label: 'Notes' },
]

export default function ClientIntakeForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const form = event.currentTarget
    setIsSubmitting(true)
    setSuccessMessage('')
    setErrorMessage('')

    const formData = new FormData(form)
    const intakePayload = Object.fromEntries(formData.entries())

    try {
      await runNewIntakeAutomation(intakePayload)
      form.reset()
      setSuccessMessage('Intake captured and synced to the client dashboard workbook.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Intake could not be saved.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="rounded-lg border border-white/70 bg-white/90 p-4 shadow-xl backdrop-blur md:p-6">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">Client intake</p>
        <h2 className="mt-1 text-2xl font-main text-zinc-950 shadow-none">Start a project file</h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          Capture the same fields used by the CWS Client Dashboard workbook.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {TEXT_FIELDS.map((field) => (
            <div key={field.id} className={field.id === 'socialMediaLinks' ? 'sm:col-span-2' : ''}>
              <label htmlFor={field.id} className="block text-sm font-semibold text-zinc-800">
                {field.label}
              </label>
              <input
                id={field.id}
                name={field.id}
                type={field.type}
                required={field.required}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              />
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {TEXTAREA_FIELDS.map((field) => (
            <div key={field.id}>
              <label htmlFor={field.id} className="block text-sm font-semibold text-zinc-800">
                {field.label}
              </label>
              <textarea
                id={field.id}
                name={field.id}
                rows={4}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              />
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-dashed border-orange-300 bg-orange-50 px-4 py-3">
          <p className="text-sm font-semibold text-orange-900">File upload placeholder</p>
          <p className="mt-1 text-sm text-orange-800">
            Future integration: connect this area to Google Drive, R2, or Supabase Storage for logos,
            brand files, photos, and report assets.
          </p>
        </div>

        {successMessage && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-zinc-950 px-5 py-2 text-sm font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-zinc-500"
        >
          {isSubmitting ? 'Saving intake...' : 'Submit intake'}
        </button>
      </form>
    </section>
  )
}

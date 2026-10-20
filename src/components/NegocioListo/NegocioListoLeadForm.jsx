import { useRef, useState } from 'react'
import { hasValidUsPhone, submitNegocioListoLead } from '@/lib/negocioListoLead'
import { NL_CALENDLY } from '@/data/negocioListo'

/**
 * Shared lead form. `variant="popup"` asks for the minimum (name, phone, business type);
 * `variant="inline"` adds business name, email, plan and website questions.
 */
export default function NegocioListoLeadForm({ copy, variant, selectedPlan, onPlanChange, onDone, autoFocusRef }) {
  const t = copy.form
  const startedAt = useRef(Date.now())
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const idPrefix = `nl-${variant}`
  const isInline = variant === 'inline'

  const handleSubmit = async (event) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') || '').trim()
    const phone = String(data.get('phone') || '').trim()
    if (!name || !hasValidUsPhone(phone)) {
      setStatus('invalid')
      setMessage(t.required)
      return
    }
    setStatus('sending')
    setMessage('')
    try {
      await submitNegocioListoLead({
        form: variant,
        lang: copy.lang,
        name,
        phone,
        email: String(data.get('email') || ''),
        business_name: String(data.get('business_name') || ''),
        business_type: String(data.get('business_type') || ''),
        plan_interest: String(data.get('plan_interest') || ''),
        has_website: String(data.get('has_website') || ''),
        company_website: String(data.get('company_website') || ''),
        elapsed_ms: Date.now() - startedAt.current,
      })
      setStatus('done')
      onDone?.()
    } catch {
      setStatus('error')
      setMessage(t.error)
    }
  }

  if (status === 'done' && isInline) {
    return (
      <div className="nl-form-done" role="status">
        <span className="nl-check nl-check--lg" aria-hidden="true"><CheckIcon /></span>
        <h3 className="nl-form-done__title">{t.doneTitle}</h3>
        <p className="nl-muted">{t.doneBody}</p>
        <a className="nl-btn nl-btn--primary" href={NL_CALENDLY} target="_blank" rel="noopener noreferrer">{t.doneCta}</a>
      </div>
    )
  }

  const typeSelect = (
    <div className="nl-field">
      <label htmlFor={`${idPrefix}-type`}>{t.type}</label>
      <select id={`${idPrefix}-type`} name="business_type" className="nl-input" defaultValue="">
        <option value="" disabled>{t.typePlaceholder}</option>
        {copy.businessTypes.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
      </select>
    </div>
  )

  return (
    <form className="nl-form" onSubmit={handleSubmit} noValidate>
      {/* Honeypot: hidden from people and assistive tech, filled by naive bots. */}
      <div className="nl-hp" aria-hidden="true">
        <label htmlFor={`${idPrefix}-hp`}>Website</label>
        <input id={`${idPrefix}-hp`} name="company_website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={isInline ? 'nl-form__row' : 'nl-form__stack'}>
        <div className="nl-field">
          <label htmlFor={`${idPrefix}-name`}>{t.name} *</label>
          <input ref={autoFocusRef} id={`${idPrefix}-name`} name="name" className="nl-input" autoComplete="name" required />
        </div>
        {isInline && (
          <div className="nl-field">
            <label htmlFor={`${idPrefix}-biz`}>{t.business}</label>
            <input id={`${idPrefix}-biz`} name="business_name" className="nl-input" autoComplete="organization" />
          </div>
        )}
      </div>

      <div className={isInline ? 'nl-form__row' : 'nl-form__stack'}>
        <div className="nl-field">
          <label htmlFor={`${idPrefix}-phone`}>{t.phone} *</label>
          <input id={`${idPrefix}-phone`} name="phone" type="tel" inputMode="tel" className="nl-input" autoComplete="tel" required />
        </div>
        {isInline ? (
          <div className="nl-field">
            <label htmlFor={`${idPrefix}-email`}>{t.email}</label>
            <input id={`${idPrefix}-email`} name="email" type="email" inputMode="email" className="nl-input" autoComplete="email" />
          </div>
        ) : typeSelect}
      </div>

      {isInline && (
        <>
          <div className="nl-form__row">
            {typeSelect}
            <div className="nl-field">
              <label htmlFor={`${idPrefix}-plan`}>{t.plan}</label>
              <select id={`${idPrefix}-plan`} name="plan_interest" className="nl-input" value={selectedPlan} onChange={(event) => onPlanChange?.(event.target.value)}>
                {copy.plans.items.map((plan) => (
                  <option key={plan.id} value={plan.id}>{plan.name} · ${plan.price}{copy.plans.perMonth}</option>
                ))}
                <option value="unsure">{t.planUnsure}</option>
              </select>
            </div>
          </div>
          <fieldset className="nl-fieldset">
            <legend>{t.site}</legend>
            <div className="nl-radios">
              <label className="nl-radio"><input type="radio" name="has_website" value="yes" /> {t.yes}</label>
              <label className="nl-radio"><input type="radio" name="has_website" value="no" /> {t.no}</label>
            </div>
          </fieldset>
        </>
      )}

      <p className="nl-fine">{t.consent}</p>
      {message && <p className="nl-form__error" role="alert">{message}</p>}
      <button type="submit" className="nl-btn nl-btn--primary nl-btn--block" disabled={status === 'sending'}>
        {status === 'sending' ? t.sending : variant === 'popup' ? copy.popup.submit : t.submit}
      </button>
    </form>
  )
}

export function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

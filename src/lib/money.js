export function dollarsToCents(value) {
  const match = String(value || '').trim().match(/^(\d{1,7})(?:\.(\d{1,2}))?$/)
  if (!match) return null
  const whole = Number(match[1])
  const fraction = Number((match[2] || '').padEnd(2, '0'))
  const cents = whole * 100 + fraction
  return Number.isSafeInteger(cents) && cents > 0 && cents <= 1000000000 ? cents : null
}

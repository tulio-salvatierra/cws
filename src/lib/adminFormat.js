// Admin display helpers. Raw ISO timestamps and record ids stay available
// (title attribute / snapshot JSON) but are not what the owner reads.
export function formatChicagoDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date)
}

export function humanizeKey(value) {
  return String(value || '').replaceAll('_', ' ')
}

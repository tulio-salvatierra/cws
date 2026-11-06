import { isRecord } from './schema.js'
export const MAX_BYTES = 100000
export const MAX_ROWS = 40
export const NOT_SURE = 'Not sure'
export function serviceFields(config, service) {
  return config.serviceFields.map(f => ({ ...f, options: service?.presets?.[f.id] ?? f.options ?? [] }))
}
export function initialValue(field, suggested = false) {
  if (field.type === 'repeater') return structuredClone(field.prefill ?? [])
  if (['checkbox', 'radio'].includes(field.type)) return { selected: field.type === 'checkbox' ? (field.prefill ?? (suggested ? field.options ?? [] : [])) : (field.prefill ? [field.prefill] : []), other: '', added: [], notSure: false }
  return field.prefill ?? ''
}
export function initialAnswers(config) {
  return { version: 1, sections: Object.fromEntries(config.sections.map(s => [s.id, Object.fromEntries(s.fields.map(f => [f.id, initialValue(f)]))])), services: config.services.map(s => ({ id: s.id, name: s.name, fields: Object.fromEntries(serviceFields(config, s).map(f => [f.id, initialValue(f, true)])) })) }
}
// Retain current answers when a config removes section questions from an older draft.
export function restoreAnswers(config, saved) {
  if (!isRecord(saved) || !isRecord(saved.sections)) return validateAnswers(config, saved)
  const sections = Object.fromEntries(config.sections.map(section => {
    const previous = saved.sections[section.id]
    if (previous !== undefined && !isRecord(previous)) throw new Error('Invalid saved section')
    return [section.id, Object.fromEntries(section.fields.map(field => [field.id, previous?.[field.id] ?? initialValue(field)]))]
  }))
  return validateAnswers(config, { ...saved, sections })
}
export function hasAnswer(value) {
  if (typeof value === 'string') return !!value.trim()
  if (Array.isArray(value)) return value.some(row => Object.values(row).some(hasAnswer))
  return !!(value?.notSure || value?.selected?.length || value?.other?.trim() || value?.added?.some(v => v.trim()))
}
export function validateAnswers(config, answers) {
  const fail = message => { throw new Error(message) }
  const string = v => typeof v === 'string' && v.length <= 5000 && ![...v].some(c => c.charCodeAt(0) < 32 && !['\n', '\r', '\t'].includes(c))
  const keys = (obj, allowed) => isRecord(obj) && Object.keys(obj).every(k => allowed.includes(k))
  function value(f, v) {
    if (v === undefined) return
    if (['text', 'textarea', 'email', 'tel'].includes(f.type)) { if (!string(v)) fail(`Invalid ${f.label}`); if (f.type === 'email' && v.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) fail(`Invalid ${f.label}`); return }
    if (f.type === 'repeater') { if (!Array.isArray(v) || v.length > MAX_ROWS) fail(`Too many rows for ${f.label}`); v.forEach(row => { if (!keys(row, f.columns.map(c => c.id))) fail(`Invalid columns for ${f.label}`); f.columns.forEach(c => value(c, row[c.id])) }); return }
    if (!keys(v, ['selected', 'other', 'added', 'notSure', 'order']) || !Array.isArray(v.selected) || v.selected.length > 60 || !v.selected.every(x => (f.options ?? []).includes(x)) || new Set(v.selected).size !== v.selected.length || !string(v.other) || !Array.isArray(v.added) || v.added.length > MAX_ROWS || !v.added.every(string) || typeof v.notSure !== 'boolean') fail(`Invalid choices for ${f.label}`)
    if (v.order !== undefined && (!Array.isArray(v.order) || v.order.length > 100 || !v.order.every(x => typeof x === 'string' && [...v.selected, ...v.added].includes(x)))) fail(`Invalid order for ${f.label}`)
    if (f.type === 'radio' && v.selected.length > 1) fail(`Choose one answer for ${f.label}`)
    if ((!f.allowOther && v.other) || (!f.allowAdd && v.added.length) || (f.allowNotSure === false && v.notSure)) fail(`Unsupported answer for ${f.label}`)
    if (v.notSure && (v.selected.length || v.other || v.added.length)) fail(`Not sure must be exclusive for ${f.label}`)
    if (f.type === 'radio' && v.other && v.selected.length) fail(`Choose one answer for ${f.label}`)
  }
  if (!keys(answers, ['version', 'sections', 'services']) || answers.version !== 1 || !keys(answers.sections, config.sections.map(s => s.id)) || !Array.isArray(answers.services) || answers.services.length > 30) fail('Invalid intake answers')
  config.sections.forEach(s => { const fields = answers.sections[s.id] ?? {}; if (!keys(fields, s.fields.map(f => f.id))) fail(`Invalid section ${s.title}`); s.fields.forEach(f => value(f, fields[f.id])) })
  const ids = new Set()
  answers.services.forEach(s => {
    if (!keys(s, ['id', 'name', 'fields']) || typeof s.id !== 'string' || !/^[a-z][a-z0-9-]{0,80}$/.test(s.id) || ids.has(s.id) || !string(s.name) || s.name.length > 160) fail('Invalid or duplicate service')
    ids.add(s.id); const definition = config.services.find(x => x.id === s.id)
    if (!definition && (!config.allowAddService || !s.id.startsWith('custom-'))) fail('Unknown service')
    if (definition && s.name !== definition.name) fail('Service name does not match config')
    const fields = serviceFields(config, definition)
    if (!keys(s.fields, fields.map(f => f.id))) fail('Invalid service fields')
    fields.forEach(f => value(f, s.fields[f.id]))
  })
  if (config.services.some(s => !ids.has(s.id))) fail('Missing configured service')
  return answers
}
function linesFor(field, value) {
  if (!hasAnswer(value)) return []
  if (typeof value === 'string') return [`- ${field.label}: ${value.trim().replace(/\n/g, '\n  ')}`]
  if (field.type === 'repeater') return [`${field.label}:`, ...value.filter(row => Object.values(row).some(hasAnswer)).map(row => '- ' + field.columns.filter(c => row[c.id]?.trim()).map(c => `${c.label}: ${row[c.id].trim()}`).join(' | '))]
  if (value.notSure) return [`- ${field.label}: Not sure`]
  const selected = [...orderedValues(value), ...(value.other.trim() ? [value.other.trim()] : [])]
  return [`${field.label}:`, ...selected.map((v, i) => `- ${field.ordered ? `${i + 1}. ` : ''}${v.replace(/\n/g, '\n  ')}`)]
}
export function summarize(config, answers) {
  const lines = [`Intake — ${config.clientName}`]
  for (const section of config.sections) { const content = section.fields.flatMap(f => linesFor(f, answers.sections[section.id]?.[f.id])); if (content.length) lines.push('', section.title, ...content) }
  for (const service of answers.services) {
    const fields = serviceFields(config, config.services.find(s => s.id === service.id)); const status = fields[0]
    lines.push('', service.name || 'Unnamed service', ...(hasAnswer(service.fields.status) ? linesFor(status, service.fields.status) : ['- Service status: Not answered']))
    for (const f of fields.slice(1)) if (!service.fields[f.id]?.notSure) lines.push(...linesFor(f, service.fields[f.id]))
    const unsure = fields.filter(f => service.fields[f.id]?.notSure).map(f => f.label)
    if (unsure.length) lines.push(`Still deciding: ${unsure.join('; ')}`)
  }
  return lines.join('\n')
}

export function orderedValues(value) {
  const values = [...value.selected, ...value.added].filter(v => v.trim())
  return [...new Set([...(value.order ?? []).filter(v => values.includes(v)), ...values])]
}

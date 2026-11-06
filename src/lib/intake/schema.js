const types = ['text', 'textarea', 'email', 'tel', 'radio', 'checkbox', 'repeater']
const idPattern = /^[a-z][a-z0-9-]{0,63}$/
const own = (value) => value && typeof value === 'object' && !Array.isArray(value)
export function validateConfig(config, source = 'intake config') {
  const fail = (path, message) => { throw new Error(`${source}: ${path} ${message}`) }
  const text = (v, path) => { if (typeof v !== 'string' || !v.trim() || v.length > 5000) fail(path, 'must be nonempty text (max 5000 characters)') }
  const id = (v, path) => { if (typeof v !== 'string' || !idPattern.test(v) || ['constructor', 'prototype', '__proto__'].includes(v)) fail(path, 'must be a safe lowercase identifier') }
  const array = (v, path) => { if (!Array.isArray(v) || v.length > 60) fail(path, 'must be an array of at most 60 items') }
  const unique = (items, path) => { const ids = new Set(); for (const item of items) { id(item?.id, path); if (ids.has(item.id)) fail(path, `has duplicate id ${item.id}`); ids.add(item.id) } }
  const strings = (v, path) => { array(v, path); v.forEach(x => text(x, path)); if (new Set(v).size !== v.length) fail(path, 'has duplicate options') }
  function field(f, path, column = false) {
    if (!own(f)) fail(path, 'must be an object')
    id(f.id, path + '.id'); text(f.label, path + '.label')
    if (!types.includes(f.type) || (column && !['text', 'textarea', 'email', 'tel'].includes(f.type))) fail(path, 'has an unsupported field type')
    for (const flag of ['allowOther', 'allowNotSure', 'allowAdd', 'ordered']) if (f[flag] !== undefined && typeof f[flag] !== 'boolean') fail(path + '.' + flag, 'must be boolean')
    if (f.help !== undefined) text(f.help, path + '.help')
    if (f.options !== undefined) strings(f.options, path + '.options')
    if (f.rows !== undefined && (!Number.isInteger(f.rows) || f.rows < 1 || f.rows > 20)) fail(path + '.rows', 'must be an integer from 1 to 20')
    if (f.type === 'repeater') {
      array(f.columns, path + '.columns'); if (!f.columns.length) fail(path, 'requires columns'); unique(f.columns, path + '.columns'); f.columns.forEach(c => field(c, path + '.' + c.id, true))
      if (f.prefill !== undefined) { array(f.prefill, path + '.prefill'); if (f.prefill.length > 40) fail(path, 'prefill must have at most 40 rows'); for (const row of f.prefill) { if (!own(row)) fail(path, 'prefill rows must be objects'); for (const [key, val] of Object.entries(row)) if (!f.columns.some(c => c.id === key) || typeof val !== 'string' || val.length > 5000) fail(path, 'has invalid prefill row') } }
    } else if (f.prefill !== undefined) {
      if (f.type === 'checkbox') strings(f.prefill, path + '.prefill')
      else if (typeof f.prefill !== 'string' || f.prefill.length > 5000) fail(path, 'prefill must be text')
      if (['radio', 'checkbox'].includes(f.type)) for (const v of [].concat(f.prefill)) if (!f.options?.includes(v)) fail(path, 'prefill must match an option')
    }
  }
  if (!own(config)) fail('', 'must be an object')
  id(config.slug, 'slug'); for (const k of ['clientName', 'greeting', 'intro']) text(config[k], k)
  if (typeof config.allowAddService !== 'boolean') fail('allowAddService', 'must be boolean')
  for (const k of ['sections', 'serviceFields', 'services']) { array(config[k], k); unique(config[k], k) }
  if (config.services.length > 30) fail('services', 'must have at most 30 services')
  if (config.clientName.length > 160 || /[\r\n]/.test(config.clientName)) fail('clientName', 'must be a single line of at most 160 characters')
  config.sections.forEach(s => { text(s.title, s.id + '.title'); array(s.fields, s.id + '.fields'); unique(s.fields, s.id + '.fields'); s.fields.forEach(f => field(f, s.id + '.' + f.id)) })
  config.serviceFields.forEach(f => field(f, 'serviceFields.' + f.id))
  if (config.serviceFields[0]?.id !== 'status' || config.serviceFields[0]?.type !== 'radio') fail('serviceFields', 'must begin with a radio field named status')
  config.services.forEach(s => { text(s.name, s.id + '.name'); if (s.name.length > 160) fail(s.id, 'service name must have at most 160 characters'); if (!own(s.presets)) fail(s.id, 'requires presets object'); for (const [key, options] of Object.entries(s.presets)) { const f = config.serviceFields.find(f => f.id === key); if (!f || !['radio', 'checkbox'].includes(f.type)) fail(s.id, `preset ${key} must target a choice field`); strings(options, s.id + '.' + key) } })
  return config
}
export const isRecord = own

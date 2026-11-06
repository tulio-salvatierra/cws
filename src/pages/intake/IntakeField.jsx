import { useId } from 'react'
import { initialValue, MAX_ROWS, orderedValues } from '../../lib/intake/model.js'
export default function IntakeField({ field, value, onChange }) {
  const uid = useId()
  const helpId = field.help ? `${uid}-help` : undefined
  const v = value ?? initialValue(field)
  const hint = field.help && <p className="intake-help" id={helpId}>{field.help}</p>
  if (field.type === 'repeater') return <fieldset className="intake-field"><legend>{field.label}</legend>{hint}{v.map((row, i) => <div className="intake-row" key={i}>{field.columns.map(column => <IntakeField key={column.id} field={column} value={row[column.id] ?? ''} onChange={next => onChange(v.map((r, j) => i === j ? { ...r, [column.id]: next } : r))} />)}<div className="intake-actions">{field.ordered && <><button type="button" disabled={i === 0} aria-label={`Move row ${i + 1} up`} onClick={() => { const rows = [...v]; [rows[i - 1], rows[i]] = [rows[i], rows[i - 1]]; onChange(rows) }}>Move up</button><button type="button" disabled={i === v.length - 1} aria-label={`Move row ${i + 1} down`} onClick={() => { const rows = [...v]; [rows[i + 1], rows[i]] = [rows[i], rows[i + 1]]; onChange(rows) }}>Move down</button></>}{field.allowAdd && <button type="button" onClick={() => onChange(v.filter((_, j) => i !== j))}>Remove row {i + 1}</button>}</div></div>)}{field.allowAdd && <button type="button" disabled={v.length >= MAX_ROWS} onClick={() => onChange([...v, Object.fromEntries(field.columns.map(c => [c.id, '']))])}>Add</button>}</fieldset>
  if (['radio', 'checkbox'].includes(field.type)) {
    const update = next => onChange({ ...next, order: (next.order ?? []).filter(x => [...next.selected, ...next.added].includes(x)) })
    const ordered = orderedValues(v)
    const move = (index, delta) => { const order = [...ordered]; [order[index], order[index + delta]] = [order[index + delta], order[index]]; update({ ...v, order }) }
    return <fieldset className="intake-field" aria-describedby={helpId}><legend>{field.label}</legend>{hint}
      {(field.options ?? []).map(option => <label className="intake-choice" key={option}><input type={field.type} name={uid} checked={v.selected.includes(option)} onChange={e => update({ ...v, notSure: false, other: field.type === 'radio' ? '' : v.other, selected: field.type === 'radio' ? [option] : e.target.checked ? [...v.selected, option] : v.selected.filter(x => x !== option) })} /><span>{option}</span></label>)}
      {v.added.map((item, i) => <div className="intake-added" key={i}><label htmlFor={`${uid}-add-${i}`}>Added {field.ordered ? 'step' : 'item'} {i + 1}</label><input id={`${uid}-add-${i}`} value={item} maxLength={5000} onChange={e => { const added = v.added.map((x, j) => i === j ? e.target.value : x); update({ ...v, added, order: ordered.map(x => x === item ? e.target.value : x) }) }} /><button type="button" aria-label={`Remove added item ${i + 1}`} onClick={() => update({ ...v, added: v.added.filter((_, j) => i !== j) })}>Remove</button></div>)}
      {field.allowAdd && <button type="button" disabled={v.added.length >= MAX_ROWS} onClick={() => update({ ...v, notSure: false, added: [...v.added, ''] })}>{field.ordered ? 'Add a step' : 'Add'}</button>}
      {field.ordered && ordered.length > 0 && <div className="intake-order"><p>Selected order</p><ol>{ordered.map((item, i) => <li key={`${item}-${i}`}><span>{i + 1}. {item}</span><div className="intake-actions"><button type="button" disabled={i === 0} aria-label={`Move ${item} up`} onClick={() => move(i, -1)}>↑ <span className="intake-sr">Move up</span></button><button type="button" disabled={i === ordered.length - 1} aria-label={`Move ${item} down`} onClick={() => move(i, 1)}>↓ <span className="intake-sr">Move down</span></button></div></li>)}</ol></div>}
      {field.allowOther && <label className="intake-field" htmlFor={`${uid}-other`}>Other<input id={`${uid}-other`} maxLength={5000} value={v.other} onChange={e => update({ ...v, other: e.target.value, notSure: false, selected: field.type === 'radio' ? [] : v.selected })} /></label>}
      {field.allowNotSure !== false && <label className="intake-choice"><input type={field.type} name={uid} checked={v.notSure} onChange={e => update({ selected: [], added: [], other: '', notSure: e.target.checked, order: [] })} /><span>Not sure</span></label>}
    </fieldset>
  }
  const props = { id: uid, value: v, onChange: e => onChange(e.target.value), maxLength: 5000, 'aria-describedby': helpId }
  return <div className="intake-field"><label htmlFor={uid}>{field.label}</label>{hint}{field.type === 'textarea' ? <textarea {...props} rows={field.rows ?? 4} /> : <input {...props} type={field.type} />}</div>
}

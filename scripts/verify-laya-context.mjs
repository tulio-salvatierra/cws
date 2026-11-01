// Local-only database-backed smoke test. Run after fixtures + both migrations.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { loadWorldModel } from '../server/laya/world-model.js'
import { loadMoves } from '../server/laya/move-responses.js'
const docker = process.env.DOCKER_BIN || 'docker'
const container = process.env.LAYA_TEST_CONTAINER || 'laya-world-verification-20261101'
const workspaceId = '44444444-4444-4444-8444-444444444444'
function sql(query) {
  return execFileSync(docker, ['exec', '-i', container, 'psql', '-X', '-U', 'postgres', '-d', 'laya_verify', '-At', '-v', 'ON_ERROR_STOP=1'], { input: query, encoding: 'utf8' }).trim()
}
const quote = value => "'" + String(value).replaceAll("'", "''") + "'"
const identifier = value => { assert.match(value, /^[a-z_]+$/); return '"' + value + '"' }
const client = { from(table) {
  let columns = '*', filters = [], orders = [], cap, single = false
  const q = {
    select(fields) { columns = fields === '*' ? '*' : fields.split(',').map(identifier).join(','); return q },
    eq(field, value) { filters.push(`${identifier(field)}=${quote(value)}`); return q },
    order(field, options) { orders.push(`${identifier(field)} ${options.ascending ? 'asc' : 'desc'}${options.nullsFirst === false ? ' nulls last' : ''}`); return q },
    limit(value) { assert(Number.isSafeInteger(value)); cap = value; return q },
    maybeSingle() { single = true; return q },
    then(resolve, reject) {
      try {
        const query = `select ${columns} from public.${identifier(table)}${filters.length ? ' where ' + filters.join(' and ') : ''}${orders.length ? ' order by ' + orders.join(',') : ''}${cap ? ' limit ' + cap : ''}`
        const output = sql(`set role service_role; select coalesce(json_agg(t),'[]') from (${query}) t;`)
        const rows = JSON.parse(output.split('\n').at(-1)); return Promise.resolve({ data: single ? rows[0] || null : rows }).then(resolve, reject)
      } catch (error) { return Promise.resolve({ data: null, error: error.message }).then(resolve, reject) }
    },
  }
  return q
} }
const before = sql('select md5(string_agg(to_jsonb(t)::text,\'\' order by id)) from public.laya_move_choices t;')
const model = await loadWorldModel({ client, workspaceId })
const moves = await loadMoves({ client, workspaceId })
assert.equal(model.identity.name, 'Combined loader fixture')
assert.equal(model.current_state.financial.cash_cents, 0)
assert.equal(model.current_state.financial.revenue_cents, null)
assert.equal(model.business_units[0].status, 'proposed')
assert.equal(model.recent_decisions[0].status, 'proposed')
assert.equal(model.recent_decision_contexts[0].decision_snapshot.status, 'proposed')
assert.equal(model.lessons[0].recommendation, 'observe')
assert(Object.values(model.coverage).every(x => x.available))
assert.equal(moves.available, true)
assert.equal(moves.events.length, 1)
assert.equal(moves.events[0].action, 'do')
assert.equal(sql('select md5(string_agg(to_jsonb(t)::text,\'\' order by id)) from public.laya_move_choices t;'), before)
console.log('PASS: database-backed World Model + Next Move loaders; all eight sources available; null/zero/status preserved; reads leave choices unchanged.')

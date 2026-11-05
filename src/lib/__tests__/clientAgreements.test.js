import { describe, it, expect } from 'vitest'
import { agreementSummary } from '../clientAgreements'
const a = { id: 'a', setup_cents: 30000, monthly_cents: 15000, term_months: 12, billing_start_date: null, launch_date: null }
const setup = { id: 'o0', amount_cents: 30000, status: 'expected', due_date: '2026-10-11' }
const mapping = [{ agreement_id: 'a', installment: 0, financial_obligation_id: 'o0' }]
const receipt = { financial_obligation_id: 'o0', amount_cents: 30000 }
describe('client agreement balances', () => {
 it('reuses setup receipt, keeps all payments out of due/received/MRR until billing begins', () => {
  expect(agreementSummary(a, mapping, [setup], [receipt], '2026-10-11')).toMatchObject({ total:210000, received:30000, due:0, future:180000, remaining:180000, activeMonthly:0, status:'Billing not started' })
 })
 it('uses owner-confirmed billing start for term and MRR without claiming the finished site launched', () => {
  const installments = [...mapping, ...[1, 2].map(n => ({ agreement_id:'a', installment:n, financial_obligation_id:`o${n}` }))]
  const bills = [setup, { id:'o1',amount_cents:15000,status:'expected',due_date:'2026-10-11' }, { id:'o2',amount_cents:15000,status:'expected',due_date:'2026-11-11' }]
  expect(agreementSummary({...a,billing_start_date:'2026-10-11'}, installments, bills, [receipt], '2026-10-12')).toMatchObject({ status:'Active', activeMonthly:15000, due:15000, future:15000, end:'2027-10-11' })
 })
 it('separates partial, overdue, future and waived installments', () => {
  const installments = [...mapping, ...[1,2,3].map(n => ({ agreement_id:'a',installment:n,financial_obligation_id:`o${n}` }))]
  const bills = [setup,...[1,2,3].map(n=>({id:`o${n}`,amount_cents:15000,status:n===3?'waived':'expected',due_date:`2026-${n===1?'10':n===2?'11':'12'}-31`}))]
  const s=agreementSummary({...a,billing_start_date:'2026-10-31',launch_date:'2026-10-31'},installments,bills,[receipt,{financial_obligation_id:'o1',amount_cents:5000}],'2026-11-01')
  expect(s).toMatchObject({received:35000,due:10000,overdue:10000,future:15000,remaining:25000,activeMonthly:15000,end:'2027-10-31'})
 })
 it('ends monthly commitment at term end without erasing unpaid balances', () => {
  expect(agreementSummary({...a,billing_start_date:'2025-10-11',launch_date:'2025-10-11'},mapping,[setup],[],'2026-10-11')).toMatchObject({status:'Term completed',activeMonthly:0,due:30000})
 })
})

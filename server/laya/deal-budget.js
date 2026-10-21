export const latestBudgets = (rows,workspaceId) => [...rows].filter(r=>r.workspace_id===workspaceId).sort((a,b)=>Number(b.revision)-Number(a.revision)).filter((r,i,all)=>all.findIndex(item=>item.agreement_id===r.agreement_id)===i)
export function dealSnapshot({workspaceId,agreementId,agreements,projects,budgets,costs=[]}) {
  const latest=latestBudgets(budgets,workspaceId)
  return {
    agreements:agreements.filter(a=>a.workspace_id===workspaceId).map(a=>{
      const b=latest.find(row=>row.agreement_id===a.id)
      return {id:a.id,client_id:a.client_id,product_name:a.product_name,setup_cents:a.setup_cents,monthly_cents:a.monthly_cents,term_months:a.term_months,plan:a.id===agreementId || !b?null:Object.fromEntries(['setup_hours','monthly_hours','setup_cost_cents','monthly_cost_cents','window_start','window_end','deal_window_hours'].map(k=>[k,b[k]]))}
    }).sort((a,b)=>a.id.localeCompare(b.id)),
    costs:costs.filter(c=>c.workspace_id===workspaceId).map(c=>Object.fromEntries(['id','operations_project_id','amount_cents','incurred_on','updated_at'].map(k=>[k,c[k] ?? null]))).sort((a,b)=>a.id.localeCompare(b.id)),
    projects:projects.filter(p=>p.workspace_id===workspaceId).map(p=>Object.fromEntries(['id','client_id','service_agreement_id','status','actual_hours','updated_at'].map(k=>[k,p[k] ?? null]))).sort((a,b)=>a.id.localeCompare(b.id)),
  }
}
export function canonical(value) {
  if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`
  if(value && typeof value==='object')return `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`
  return JSON.stringify(value)
}

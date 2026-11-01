/** Stored context contracts. SQL remains authoritative for validation and access. */
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
export type Metrics = Record<string, { value: number | null; unit: string; source: string }>
export interface ContextRecord {
  id: string; workspace_id: string; created_by: string; created_at: string; updated_at: string
  source_note: string; observed_at: string | null; valid_until: string | null; evidence: Json[]
}
export interface CompanyProfile extends ContextRecord {
  mission: string | null; objective: string | null; legal_structure: string | null
  operating_geography: string[] | null; jurisdictions: string[] | null
  human_capabilities: string[] | null; company_capabilities: string[] | null; strategic_principles: string[] | null
}
export interface CompanyState extends ContextRecord {
  financial: Record<string, Json> | null; sales_pipeline: Record<string, Json> | null
  clients_projects: Record<string, Json> | null; marketing: Record<string, Json> | null
  capacity: Record<string, Json> | null; blockers: string[] | null; unknowns: string[] | null
}
export interface CompanyUnit extends ContextRecord {
  unit_key: string; name: string; kind: string | null
  status: 'proposed' | 'active' | 'paused' | 'retired'; performance: Metrics | null
}
export interface CompanyConstraint extends ContextRecord {
  category: 'legal' | 'jurisdictional' | 'financial' | 'platform' | 'owner_time' | 'risk' | 'prohibited_action'
  statement: string; jurisdiction: string | null; status: 'unverified' | 'confirmed' | 'retired'; source_url: string | null
}
export interface CompanyOpportunity extends ContextRecord {
  unit_id: string | null; title: string; hypothesis: string | null
  expected_value_cents: number | null; cost_cents: number | null; currency: string | null
  human_hours: number | null; scalability: string | null; strategic_value: string | null; risk: string | null
  confidence: number | null; success_criteria: string | null; deadline: string | null
  status: 'candidate' | 'testing' | 'paused' | 'completed' | 'rejected'
}
export interface DecisionContext extends ContextRecord {
  decision_id: string; state_snapshot_id: string | null; opportunity_id: string | null
  alternatives: Json[] | null; rationale: string | null; expected_outcome: string | null
  assumptions: string[] | null; confidence: number | null; decision_snapshot: Record<string, Json>
}
export interface CompanyOutcome extends ContextRecord {
  decision_context_id: string; actual_outcome: string | null; metrics: Metrics | null
  human_feedback: string | null; lesson: string | null; recommendation: 'scale' | 'modify' | 'kill' | 'observe' | null
}
export type Freshness = 'unknown' | 'invalid_future' | 'unbounded' | 'stale' | 'current'
export const WORLD_MODEL_VERSION: 'company-world-v1'
export const WORLD_TABLES: Record<string, string>
export const STATE_SECTIONS: string[]
export function evidenceFreshness(row: Partial<ContextRecord> | null, now: Date): Freshness
export function assembleWorldModel(input: {workspaceId: string; workspace?: {id: string; name: string; slug: string}; reads?: Record<string, {data?: ContextRecord[] | null; error?: unknown; truncated?: boolean; has_more?: boolean}>; now?: Date}): Record<string, unknown>
export function loadWorldModel(context: {client: import('@supabase/supabase-js').SupabaseClient; workspaceId: string}, now?: Date): Promise<Record<string, unknown>>

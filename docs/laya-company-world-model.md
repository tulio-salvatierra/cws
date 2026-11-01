# Laya Company World Model v1

This foundation supplies context to later decision evaluators within CWS OS. It adds no model calls, autonomous actions, UI, new serverless function, ranking, publishing or decision activation. Existing Laya evaluation and owner-response semantics remain intact.

## Canonical identity and records

`workspaces.id/name/slug` is the existing canonical company identity. `company_profiles` extends it one-to-one; it never creates another company. No seed data is included: configured identity is read at request time, and owner-confirmed facts can be recorded without asserting that proposed business units exist or are active.

| Table | Purpose | Mutation model |
| --- | --- | --- |
| company_profiles | Mission/objective, legal structure, geography/jurisdictions, human/company capabilities and principles | Owner insert/update; one per workspace |
| company_state_snapshots | Financial, pipeline, clients/projects, marketing, capacity, blockers and explicit unknowns | Owner append-only |
| company_units | Flexible key/name/kind and proposed/active/paused/retired status, common performance metrics | Owner insert/update; default proposed |
| company_constraints | Legal/jurisdictional, financial, platform, time, risk and prohibited-action evidence | Owner insert/update; default unverified |
| company_opportunities | Hypothesis, expected value/cost/currency/hours, scale/strategic value/risk/confidence, success criteria and deadline/status | Owner insert/update; default candidate |
| company_decision_contexts | Existing decision + exact state reference, opportunity, alternatives, rationale, expected outcome, assumptions and confidence | Owner append-only; database captures decision row |
| company_outcomes | Actual result, metrics, human feedback, lesson and scale/modify/kill/observe recommendation | Owner append-only, linked to exact decision context |

All new records have workspace/actor/time provenance, a required source note, evidence references, optional observation time and expiry. Same-workspace composite foreign keys prevent cross-company links. Identity/provenance cannot be moved by updates. No delete privileges, anonymous/member access or service-role writes are granted. Existing `business_decisions` retains its activation rules and authority; a context or outcome does not activate, supersede or otherwise edit it. A decision context's database-generated `decision_snapshot` preserves the existing row at insertion, including its lifecycle state. Later amendments append another context. Existing Laya response history is separate and untouched.

## Data contract

SQL constraints are authoritative. `src/types/supabase.ts` includes the new table Row/Insert/Update contracts using the existing database type conventions. These additions were prepared from the migration, not generated from an applied database. `server/laya/world-model.d.ts` adds domain contracts; the project has no TypeScript checking script.

Unknown scalar/list/section values are SQL NULL; JSON unknowns use JSON null. Zero means explicitly measured zero. Empty lists/maps mean an explicitly empty collection, never inferred absence. State sections are extensible JSON objects; they are owner-recorded snapshots, not automatically reconciled financial totals. Their source note must explain period, scope and completeness, including off-system work. Existing department tables remain operational sources of truth. This initial version does not scrape or aggregate them or declare an empty register complete.

Unit `performance` and outcome `metrics` use the same validated shape:

```json
{"revenue": {"value": null, "unit": "USD cents", "source": "Unverified; accounting reconciliation needed"}}
```

Every metric requires numeric-or-null `value`, nonempty `unit` and `source`. Money estimates use integer cents with explicit currency; human hours are nonnegative integers, confidence is nullable 0–1. Confidence is recorded judgment, never a model-derived score or authorization. Evidence arrays may contain source table/row/version/field references or source URLs and retrieval notes; they are reference data, not executable instructions. Freeform source references are not automatically verified or fetched.

Legal/jurisdictional/platform constraints marked confirmed require a source URL, observation time and expiry. Confirmation describes recorded evidence, not permanent applicability or legal approval. The reader derives freshness every time. The application must retrieve/reverify the authority when needed; no legal facts are seeded. Null expiry means unbounded evidence, not current evidence.

## Read contract

Authenticated active owners call `GET /api/ceo-today?view=world_model`. It reuses existing authentication, returns `Cache-Control: no-store`, and performs SELECTs only. The standard CEO response takes its existing path. `loadWorldModel(context, now)` is the bounded loader; `assembleWorldModel(...)` is the pure deterministic projection with an injectable clock.

The result includes canonical identity/profile/objective, current state plus the latest historical snapshot, units, constraints, bottlenecks, opportunities, risks, recent decisions/contexts/outcomes, lessons, missing information, evidence freshness and per-source coverage.

- Latest state is ordered by observation time, creation time, ID. It supplies current values only when observation and expiry bracket the evaluation clock. Historical values remain explicitly accessible as `latest_state_snapshot`; expired, unbounded or undated evidence never becomes current state.
- Freshness is `current`, `stale`, `unbounded`, `unknown`, or `invalid_future`. Future observations are rejected on writes. Profile and registry records remain visible alongside freshness; consumers must consult that metadata before relying on them.
- Failed or cross-workspace reads become null with missing-information entries. A 1,000-row registry cap fails closed rather than silently treating the partial registry as complete.
- Decisions, contexts and outcomes are latest-20 history windows with `has_more`; they are not full history exports. Linked state/context IDs remain durable even when the linked record falls outside a returned window.
- A successful HTTP read may contain unavailable sections (for example before migration); inspect `coverage` and `missing_information`. Missing company facts are never fabricated.
- Reads are separate queries, not a transactionally consistent cross-table snapshot. Decision contexts bind to explicit immutable state snapshots; consumers must not treat assembled live registries as an atomic decision record.

## Verification and release

Apply only the new migration after reviewing the target/history; do not broadly replay the historical migrations, which include production-data export guards. Use `supabase test db` for `supabase/tests/company_world_model_test.sql` in a prepared local test database. Application tests cover freshness boundaries, unknowns/zero, failed/capped/cross-workspace reads, canonical identity, history windows and owner route authorization. Release verification on 2026-11-01: the PostgreSQL 17 fixture applies both World Model and the released Next Move migration, runs 53 pgTAP assertions, then exercises both actual loaders against synthetic records. Run `DOCKER_BIN=/path/to/docker bash scripts/test-laya-company-world.sh` against a fresh local container (default `laya-world-verification-20261101`). It creates only the guarded `laya_verify` database and fails if it already exists. The fixture reproduces the relevant production table columns/checks and owner/decision helper functions, with synthetic auth records; it is not a replay of all historic migrations. Production migration `20261101182102` is applied with all seven tables empty and RLS/grants verified; application release status is in the task handoff.

# LAYA-001 verification — 2026-10-21

## Scope and rules

Read-only deterministic `decision_review` in the existing CEO Today decision section. No new endpoint, LLM/provider call, schema change, evaluation row, or Act/Dismiss control. Existing owner activation/RLS and department priority ordering are unchanged.

| Source state | Verdict |
| --- | --- |
| Required review data missing/invalid | needs_data |
| Active, review date reached or owner-observed condition | do |
| Active, future date and no observation | hold |
| Complete proposed candidate (never binding) | hold |
| Superseded or rejected | skip |

Closed status alone is enough to skip a binding review; other states validate review terms first. Active records also require activation evidence. Incomplete, invalid or future-dated condition observations yield needs_data. The evaluator never infers arbitrary free-text conditions or invents financial exposure.

The shared contract includes evaluator, policy_version, subject, verdict, next_action, why, assumptions, missing_data, money_at_stake (null), and related_decisions. Every why claim includes its exact business_decisions source row/workspace/version and field values. Evaluation time, Chicago date and timezone accompany date-based claims. The UI exposes verdict, next action, missing data and expandable field evidence with a source-row anchor.

## Validation

- 463 Vitest tests in 60 files pass, including 20 evaluator cases covering the contract/source values, verdict scenarios, Chicago midnight/DST, both triggers, workspace isolation, determinism and no network/mutation. API and UI tests verify sourced output, missing-data display, source navigation and unchanged owner activation protection.
- ESLint, import casing, production build and both landing prerenders pass with placeholder client env. Existing lottie/chunk warnings only.
- Added GitHub Actions on PRs and main pushes: Node22, npm ci, full test suite (verdict regressions fail), lint and placeholder-env build; no credentials/providers required.
- No schema, policy, grant or migration changed. Production baseline is 67 migrations, one proposed decision/zero active, posts43/sends17; no laya_evaluations table yet because no owner response is offered in this milestone.
- Full decision-row baseline hash: `9ef3704692d721930dbd7d70cc0e1aad`.
- PR #33 merged at `7adc611f0f2989560642d70f04ce0f67f02a8c4f`. GitHub Actions [Tests run 39643952356](https://github.com/tulio-salvatierra/cws/actions/runs/39643952356) passed npm ci, full tests, lint and build; Vercel preview check also passed.
- Production `dpl_ECtznNE9zvxJQJoEnC9x6yfarQcH` is READY on the verified www/root aliases, built from the merge SHA.
- Signed-in CEO Today renders the existing proposal as `needs_data`, naming its unset review_by/revisit_condition. Expanded source evidence shows the decision ID, proposed status, exact absent-field values, policy version, Chicago date and condition-observation limitation. Source-anchor navigation and reload work. Existing owner controls remain separate; none clicked.
- Final full decision-row hash matches baseline exactly. Still one proposed/zero active, posts43/sends17, 67 migrations, no evaluation table. No decision or evaluation was persisted by verification.
- CEO Today runtime error scan for the final 15-minute window found no errors.

# Marketing content assessments

Based on the six-department CWS OS release `707b2b9`, not the legacy Marketing M2 checkout.

- Marketing owns the Content check panel. Weekly captions and Creative Studio captions can prefill it; inference only starts after Evaluate with Laya.
- The existing owner-authenticated Marketing creative endpoint handles `GET ?feature=laya`, `assess_marketing_asset`, and `review_laya_assessment`.
- Active business briefs are selected within the authenticated workspace. Each completed Ask run stores an immutable text and brief snapshot plus advisory output.
- Reviewing creates a separate Ask receipt; it does not approve, schedule, publish, or update the source asset.
- CEO Today reads a separate recent-review summary. Its deterministic five-action priority projection is unchanged. The review window is explicitly the latest 100 assessments.
- `/admin/agent-runs` redirects to `/admin/marketing#laya-assessments`.
- Existing legacy runs are preserved, not silently migrated or presented as new review requests.

## Runtime

Server-only `GENERATION_SUPABASE_URL`, `GENERATION_SUPABASE_SERVICE_ROLE_KEY`, `LAYA_SERVICE_URL` (full `/assess` endpoint), and `LAYA_SERVICE_TOKEN` are required for assessments. No OpenAI key is needed for this check. Existing generation features retain their own requirements.

Laya timeout is 50 seconds; Marketing creative function duration is 60 seconds. Missing configuration, timeout, malformed output, or unavailable service produces explicit unavailable feedback, never an automated pass. Owner review and existing publishing confirmation remain separate.

The current desktop tunnel is temporary. Desktop sleep, service termination, or tunnel replacement can interrupt assessment access without breaking the rest of CWS. No nameserver or mail changes are part of this release.

No database migrations are required. The implementation uses existing channel_brief and agent_runs tables.

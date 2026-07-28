-- Close unnecessary RPC execution surface on CWS OS SECURITY DEFINER functions.
-- Migrations 006-011 are already applied to cws-os-staging, so this is forward-only.

-- End-user helpers: authenticated callers only.
revoke all on function public.create_workspace(text, text) from public;
revoke all on function public.create_workspace(text, text) from anon;
revoke all on function public.create_workspace(text, text) from authenticated;
grant execute on function public.create_workspace(text, text) to authenticated;

revoke all on function public.is_workspace_member(uuid) from public;
revoke all on function public.is_workspace_member(uuid) from anon;
revoke all on function public.is_workspace_member(uuid) from authenticated;
grant execute on function public.is_workspace_member(uuid) to authenticated;

revoke all on function public.is_workspace_owner(uuid) from public;
revoke all on function public.is_workspace_owner(uuid) from anon;
revoke all on function public.is_workspace_owner(uuid) from authenticated;
grant execute on function public.is_workspace_owner(uuid) to authenticated;

-- Trigger-only guards: never directly callable by API roles.
revoke all on function public.protect_workspace_membership() from public;
revoke all on function public.protect_workspace_membership() from anon;
revoke all on function public.protect_workspace_membership() from authenticated;

revoke all on function public.protect_approval_lifecycle() from public;
revoke all on function public.protect_approval_lifecycle() from anon;
revoke all on function public.protect_approval_lifecycle() from authenticated;

revoke all on function public.protect_agent_run_lifecycle() from public;
revoke all on function public.protect_agent_run_lifecycle() from anon;
revoke all on function public.protect_agent_run_lifecycle() from authenticated;

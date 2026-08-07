-- Harden legacy trigger and RLS helper functions without changing their behavior.
-- The workspace helpers are invoked by RLS policies and must not be exposed as
-- public RPC endpoints.

alter function public.update_updated_at()
  set search_path = public;

revoke execute on function public.is_workspace_member(uuid)
  from authenticated;

revoke execute on function public.is_workspace_owner(uuid)
  from authenticated;

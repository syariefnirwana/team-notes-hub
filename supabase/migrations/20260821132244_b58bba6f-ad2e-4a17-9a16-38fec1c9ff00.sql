revoke all on function public.has_role(uuid, public.app_role) from public, anon;
revoke all on function public.guard_studio_role() from public, anon, authenticated;
revoke all on function public.ensure_profile(text, text) from public, anon;
revoke all on function public.set_studio_role(uuid, public.studio_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.ensure_profile(text, text) to authenticated;
grant execute on function public.set_studio_role(uuid, public.studio_role) to authenticated;
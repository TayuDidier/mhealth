-- Migration 009: single-hospital data integrity + provider approval gate
--
-- (a) When an auth user is deleted, remove their public.users row too. The
--     existing ON DELETE CASCADE FKs then clean up patient_profiles / providers
--     / appointments / messages. A hard FK on users.id -> auth.users(id) is NOT
--     used because seeded provider/patient records exist in public.users without
--     matching auth logins; a trigger keeps deletions consistent without
--     invalidating that seed data.
--
-- (b) Only an admin may change a provider's status, so a provider cannot
--     self-approve or re-activate a deactivated account through the API.

-- (a) auth user deletion -> cascade to the public profile row
create or replace function public.handle_auth_user_deleted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.users where id = old.id;
  return old;
end;
$$;

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute function public.handle_auth_user_deleted();

-- (b) provider status is admin-only (non-admin status changes are ignored)
create or replace function public.enforce_provider_status_admin_only()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status
     and coalesce(public.current_user_role(), '') <> 'admin' then
    new.status := old.status;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_provider_status_admin_only on public.providers;
create trigger trg_provider_status_admin_only
  before update on public.providers
  for each row execute function public.enforce_provider_status_admin_only();

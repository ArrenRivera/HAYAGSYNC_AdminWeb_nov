begin;

create or replace function public.sync_staff_auth_email()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  if new.email is distinct from old.email then
    update public.users
    set email = new.email
    where id = new.id;
  end if;

  return new;
end
$function$;

revoke all on function public.sync_staff_auth_email()
  from public, anon, authenticated;

drop trigger if exists hayagsync_sync_staff_auth_email on auth.users;
create trigger hayagsync_sync_staff_auth_email
  after update of email on auth.users
  for each row
  execute function public.sync_staff_auth_email();

commit;

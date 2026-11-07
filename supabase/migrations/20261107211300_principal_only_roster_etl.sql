begin;

create or replace function private.require_principal_roster_etl_import()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  v_actor_user_id uuid;
begin
  if coalesce(new.details ->> 'uploaded_by', '') !~*
    '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'ETL imports must identify an active Principal account.';
  end if;

  v_actor_user_id := (new.details ->> 'uploaded_by')::uuid;
  if not exists (
    select 1
    from public.users as profile
    where profile.id = v_actor_user_id
      and profile.is_active
      and profile.role = 'principal'
  ) then
    raise exception 'Only an active Principal account can import roster data.';
  end if;

  return new;
end
$function$;

revoke all on function private.require_principal_roster_etl_import()
  from public, anon, authenticated;

drop trigger if exists etl_runs_require_principal_importer on public.etl_runs;
create trigger etl_runs_require_principal_importer
  before insert on public.etl_runs
  for each row
  execute function private.require_principal_roster_etl_import();

commit;

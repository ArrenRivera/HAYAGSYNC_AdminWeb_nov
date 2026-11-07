begin;

alter table public.users
  add column if not exists is_active boolean not null default true,
  add column if not exists must_change_password boolean not null default false;

create or replace function public.complete_my_password_setup()
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $function$
begin
  if auth.uid() is null then
    raise exception 'A signed-in account is required.';
  end if;

  update public.users
  set must_change_password = false
  where id = auth.uid()
    and is_active
    and role in (
      'adviser',
      'board_of_discipline',
      'ministrong_tagasubaybay',
      'osd',
      'principal',
      'school_president'
    );

  if not found then
    raise exception 'An active staff profile is required.';
  end if;
end
$function$;

revoke all on function public.complete_my_password_setup()
  from public, anon, authenticated;
grant execute on function public.complete_my_password_setup()
  to authenticated;

commit;

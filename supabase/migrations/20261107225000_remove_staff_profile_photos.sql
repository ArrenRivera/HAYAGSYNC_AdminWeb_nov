begin;

drop policy if exists staff_profile_photos_delete_own on storage.objects;
create policy staff_profile_photos_delete_own
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'staff-profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1
      from public.users as profile
      where profile.id = auth.uid()
        and profile.is_active
        and profile.role in (
          'adviser',
          'board_of_discipline',
          'ministrong_tagasubaybay',
          'osd',
          'principal',
          'school_president'
        )
    )
  );

create or replace function public.update_my_profile_avatar(p_avatar text)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $function$
begin
  if auth.uid() is null
    or (p_avatar is not null and p_avatar is distinct from (auth.uid()::text || '/profile.webp')) then
    raise exception 'You can only set or remove your own profile photo.';
  end if;

  update public.users
  set avatar = p_avatar
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
    raise exception 'An active staff profile is required to manage a profile photo.';
  end if;
end
$function$;

revoke all on function public.update_my_profile_avatar(text)
  from public, anon, authenticated;
grant execute on function public.update_my_profile_avatar(text)
  to authenticated;

commit;

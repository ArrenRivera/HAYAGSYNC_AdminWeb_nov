begin;

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'staff-profile-photos',
  'staff-profile-photos',
  false,
  5242880,
  array['image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists staff_profile_photos_read_active_staff on storage.objects;
create policy staff_profile_photos_read_active_staff
  on storage.objects for select to authenticated
  using (
    bucket_id = 'staff-profile-photos'
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

drop policy if exists staff_profile_photos_insert_own on storage.objects;
create policy staff_profile_photos_insert_own
  on storage.objects for insert to authenticated
  with check (
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

drop policy if exists staff_profile_photos_update_own on storage.objects;
create policy staff_profile_photos_update_own
  on storage.objects for update to authenticated
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
  )
  with check (
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
    or p_avatar is distinct from (auth.uid()::text || '/profile.webp') then
    raise exception 'You can only set your own profile photo.';
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
    raise exception 'An active staff profile is required to set a profile photo.';
  end if;
end
$function$;

revoke all on function public.update_my_profile_avatar(text)
  from public, anon, authenticated;
grant execute on function public.update_my_profile_avatar(text)
  to authenticated;

commit;

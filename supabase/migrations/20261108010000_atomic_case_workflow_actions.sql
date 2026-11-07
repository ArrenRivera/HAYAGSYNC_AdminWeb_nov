begin;

do $migration$
begin
  if to_regclass('public.reports') is null
    or to_regclass('public.timeline_events') is null
    or to_regprocedure('private.can_access_report(bigint)') is null
    or to_regprocedure('private.enforce_report_workflow()') is null then
    raise exception
      'Case workflow migration requires the HayagSYNC reports, timeline_events, and private authorization/workflow functions. Apply and verify the base schema first.';
  end if;
end
$migration$;

create or replace function public.apply_case_workflow_action(
  p_report_id bigint,
  p_updates jsonb,
  p_event_title text,
  p_event_description text
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  v_report_id bigint;
begin
  if auth.uid() is null or not exists (
    select 1
    from public.users as u
    where u.id = auth.uid()
      and u.is_active
      and u.role in (
        'adviser', 'board_of_discipline', 'ministrong_tagasubaybay',
        'osd', 'principal', 'school_president'
      )
  ) then
    raise exception 'An active staff account is required to update a case.';
  end if;

  if p_report_id is null or p_report_id < 1 then
    raise exception 'A valid case ID is required.';
  end if;
  if jsonb_typeof(p_updates) is distinct from 'object' then
    raise exception 'Case updates must be a JSON object.';
  end if;
  if exists (
    select 1
    from jsonb_object_keys(p_updates) as update_fields(field_name)
    where field_name <> all (array[
      'status', 'discipline_action', 'discipline_notes', 'escalated_to',
      'escalation_reason', 'escalation_notes', 'board_referred',
      'hearing_notes', 'board_decision', 'board_recommendations'
    ])
  ) then
    raise exception 'The request contains unsupported case fields.';
  end if;
  if coalesce(p_event_title, '') = '' or length(p_event_title) > 200
    or length(coalesce(p_event_description, '')) > 5000 then
    raise exception 'A valid case timeline event is required.';
  end if;
  if not (p_updates ? 'status') or coalesce(p_updates ->> 'status', '') = '' then
    raise exception 'A new case status is required.';
  end if;

  if not private.can_access_report(p_report_id) then
    raise exception 'You do not have permission to update this case.';
  end if;

  update public.reports as r
  set status = p_updates ->> 'status',
      discipline_action = case
        when p_updates ? 'discipline_action' then p_updates ->> 'discipline_action'
        else r.discipline_action
      end,
      discipline_notes = case
        when p_updates ? 'discipline_notes' then p_updates ->> 'discipline_notes'
        else r.discipline_notes
      end,
      escalated_to = case
        when p_updates ? 'escalated_to' then p_updates ->> 'escalated_to'
        else r.escalated_to
      end,
      escalation_reason = case
        when p_updates ? 'escalation_reason' then p_updates ->> 'escalation_reason'
        else r.escalation_reason
      end,
      escalation_notes = case
        when p_updates ? 'escalation_notes' then p_updates ->> 'escalation_notes'
        else r.escalation_notes
      end,
      board_referred = case
        when p_updates ? 'board_referred' then (p_updates ->> 'board_referred')::boolean
        else r.board_referred
      end,
      hearing_notes = case
        when p_updates ? 'hearing_notes' then p_updates ->> 'hearing_notes'
        else r.hearing_notes
      end,
      board_decision = case
        when p_updates ? 'board_decision' then p_updates ->> 'board_decision'
        else r.board_decision
      end,
      board_recommendations = case
        when p_updates ? 'board_recommendations' then p_updates ->> 'board_recommendations'
        else r.board_recommendations
      end
  where r.id = p_report_id
    and private.can_access_report(r.id)
  returning r.id into v_report_id;

  if v_report_id is null then
    raise exception 'The case does not exist or is outside your authorized scope.';
  end if;

  insert into public.timeline_events (report_id, title, description)
  values (p_report_id, p_event_title, coalesce(p_event_description, ''));

  return v_report_id;
end
$function$;

revoke all on function public.apply_case_workflow_action(bigint, jsonb, text, text)
  from public, anon;
grant execute on function public.apply_case_workflow_action(bigint, jsonb, text, text)
  to authenticated;

commit;

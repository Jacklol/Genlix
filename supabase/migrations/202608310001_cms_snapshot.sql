-- Genlix snapshot CMS.
--
-- The public site reads one active immutable JSON snapshot. A new revision is
-- committed and activated in a single transaction by cms_commit_snapshot().
-- Tables are intentionally closed to anon/authenticated; application access is
-- through server-side functions using the Supabase secret/service-role key.

create extension if not exists pgcrypto with schema extensions;

create or replace function public.cms_calculate_checksum(content jsonb)
returns text
language sql
immutable
strict
parallel safe
set search_path = pg_catalog
as $function$
  select encode(extensions.digest(convert_to(content::text, 'UTF8'), 'sha256'), 'hex');
$function$;

create table public.cms_snapshots (
  snapshot_id bigint generated always as identity primary key,
  revision bigint not null unique check (revision >= 0),
  schema_version integer not null check (schema_version > 0),
  content jsonb not null check (
    jsonb_typeof(content) = 'object'
    and octet_length(content::text) <= 8388608
  ),
  checksum text not null check (checksum ~ '^[0-9a-f]{64}$'),
  actor text not null check (char_length(btrim(actor)) between 1 and 320),
  reason text not null check (char_length(btrim(reason)) between 1 and 2000),
  created_at timestamptz not null default now(),
  unique (snapshot_id, revision)
);

comment on table public.cms_snapshots is
  'Append-only, immutable CMS revisions. Mutate only through cms_commit_snapshot().';

create table public.cms_state (
  singleton boolean primary key default true check (singleton),
  active_snapshot_id bigint not null,
  active_revision bigint not null unique check (active_revision >= 0),
  updated_at timestamptz not null default now(),
  constraint cms_state_active_snapshot_revision_fkey
    foreign key (active_snapshot_id, active_revision)
    references public.cms_snapshots (snapshot_id, revision)
);

comment on table public.cms_state is
  'Exactly one row points at the currently published immutable CMS snapshot.';

create table public.cms_audit_log (
  audit_id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('initialize', 'commit')),
  previous_revision bigint,
  new_revision bigint not null unique,
  snapshot_id bigint not null references public.cms_snapshots (snapshot_id),
  checksum text not null check (checksum ~ '^[0-9a-f]{64}$'),
  actor text not null check (char_length(btrim(actor)) between 1 and 320),
  reason text not null check (char_length(btrim(reason)) between 1 and 2000),
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default now(),
  check (previous_revision is null or previous_revision < new_revision)
);

comment on table public.cms_audit_log is
  'Append-only audit trail for initialization and successful CMS commits.';

create table public.media_assets (
  media_id bigint generated always as identity primary key,
  bucket_id text not null default 'cms-media' check (bucket_id = 'cms-media'),
  object_path text not null unique check (char_length(btrim(object_path)) > 0),
  original_filename text,
  mime_type text not null check (
    mime_type in ('image/jpeg', 'image/png', 'image/webp')
  ),
  byte_size bigint not null check (byte_size > 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  checksum text not null check (checksum ~ '^[0-9a-f]{64}$'),
  actor text not null check (char_length(btrim(actor)) between 1 and 320),
  created_at timestamptz not null default now()
);

comment on table public.media_assets is
  'Append-only metadata for immutable objects in the public cms-media Storage bucket.';

-- The first published revision is a valid empty schema-version-1 document.
-- It gives every later commit a concrete expected_revision (starting at 0).
do $seed$
declare
  initial_content constant jsonb :=
    '{"schemaVersion": 1, "products": [], "news": []}'::jsonb;
  initial_snapshot_id bigint;
  initial_checksum text;
begin
  initial_checksum := public.cms_calculate_checksum(initial_content);

  select cms_snapshots.snapshot_id
    into initial_snapshot_id
    from public.cms_snapshots
   where cms_snapshots.revision = 0;

  if initial_snapshot_id is null then
    insert into public.cms_snapshots (
      revision,
      schema_version,
      content,
      checksum,
      actor,
      reason
    )
    values (
      0,
      1,
      initial_content,
      initial_checksum,
      'system:migration',
      'Initialize snapshot CMS'
    )
    returning snapshot_id into initial_snapshot_id;
  end if;

  insert into public.cms_state (singleton, active_snapshot_id, active_revision)
  values (true, initial_snapshot_id, 0)
  on conflict (singleton) do nothing;

  insert into public.cms_audit_log (
    event_type,
    previous_revision,
    new_revision,
    snapshot_id,
    checksum,
    actor,
    reason,
    details
  )
  values (
    'initialize',
    null,
    0,
    initial_snapshot_id,
    initial_checksum,
    'system:migration',
    'Initialize snapshot CMS',
    jsonb_build_object('schema_version', 1)
  )
  on conflict (new_revision) do nothing;
end;
$seed$;

create or replace function public.cms_reject_immutable_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
begin
  raise exception using
    errcode = '55000',
    message = format('%I is append-only; %s is not allowed', tg_table_name, tg_op);
end;
$function$;

create trigger cms_snapshots_are_immutable
before update or delete on public.cms_snapshots
for each row execute function public.cms_reject_immutable_mutation();

create trigger cms_audit_log_is_immutable
before update or delete on public.cms_audit_log
for each row execute function public.cms_reject_immutable_mutation();

create trigger media_assets_are_immutable
before update or delete on public.media_assets
for each row execute function public.cms_reject_immutable_mutation();

create or replace function public.cms_protect_singleton_state()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
begin
  if tg_op in ('INSERT', 'DELETE') then
    raise exception using
      errcode = '55000',
      message = 'cms_state is a protected singleton';
  end if;

  if new.singleton is distinct from old.singleton then
    raise exception using
      errcode = '55000',
      message = 'cms_state singleton key cannot change';
  end if;

  if new.active_revision <> old.active_revision + 1 then
    raise exception using
      errcode = '55000',
      message = 'cms_state revision must advance by exactly one';
  end if;

  return new;
end;
$function$;

create trigger cms_state_is_protected
before insert or update or delete on public.cms_state
for each row execute function public.cms_protect_singleton_state();

create or replace view public.cms_current_snapshot
with (security_invoker = true)
as
select
  snapshots.revision,
  snapshots.schema_version,
  snapshots.content,
  snapshots.checksum,
  snapshots.created_at,
  snapshots.actor,
  snapshots.reason
from public.cms_state as state
join public.cms_snapshots as snapshots
  on snapshots.snapshot_id = state.active_snapshot_id
 and snapshots.revision = state.active_revision
where state.singleton = true;

comment on view public.cms_current_snapshot is
  'The active published snapshot. Access is granted only to service_role.';

create or replace function public.cms_get_current_snapshot()
returns table (
  revision bigint,
  schema_version integer,
  content jsonb,
  checksum text,
  created_at timestamptz,
  actor text,
  reason text
)
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select
    snapshots.revision,
    snapshots.schema_version,
    snapshots.content,
    snapshots.checksum,
    snapshots.created_at,
    snapshots.actor,
    snapshots.reason
  from public.cms_state as state
  join public.cms_snapshots as snapshots
    on snapshots.snapshot_id = state.active_snapshot_id
   and snapshots.revision = state.active_revision
  where state.singleton = true;
$function$;

create or replace function public.cms_commit_snapshot(
  p_expected_revision bigint,
  p_content jsonb,
  p_checksum text,
  p_actor text,
  p_reason text
)
returns table (
  revision bigint,
  schema_version integer,
  content jsonb,
  checksum text,
  created_at timestamptz,
  actor text,
  reason text
)
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  current_snapshot_id bigint;
  current_revision bigint;
  next_revision bigint;
  next_snapshot_id bigint;
  next_schema_version integer := 1;
  calculated_checksum text;
  snapshot_created_at timestamptz;
begin
  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception using
      errcode = '22023',
      message = 'expected_revision must be a non-negative bigint';
  end if;

  if p_content is null or jsonb_typeof(p_content) <> 'object' then
    raise exception using
      errcode = '22023',
      message = 'new_content must be a JSON object';
  end if;

  if p_content ? 'schemaVersion' then
    if jsonb_typeof(p_content -> 'schemaVersion') <> 'number'
       or (p_content ->> 'schemaVersion') !~ '^[1-9][0-9]*$' then
      raise exception using
        errcode = '22023',
        message = 'new_content.schemaVersion must be a positive integer';
    end if;

    next_schema_version := (p_content ->> 'schemaVersion')::integer;
  end if;

  if p_actor is null or char_length(btrim(p_actor)) not between 1 and 320 then
    raise exception using
      errcode = '22023',
      message = 'actor is required and must not exceed 320 characters';
  end if;

  if p_reason is null or char_length(btrim(p_reason)) not between 1 and 2000 then
    raise exception using
      errcode = '22023',
      message = 'reason is required and must not exceed 2000 characters';
  end if;

  calculated_checksum := public.cms_calculate_checksum(p_content);

  if p_checksum is null
     or lower(btrim(p_checksum)) !~ '^[0-9a-f]{64}$'
     or lower(btrim(p_checksum)) <> calculated_checksum then
    raise exception using
      errcode = '22023',
      message = 'checksum does not match canonical jsonb content',
      detail = format('Expected checksum %s', calculated_checksum);
  end if;

  -- This row lock serializes publishers. A stale caller fails after the lock is
  -- acquired, so two concurrent commits can never publish the same revision.
  select state.active_snapshot_id, state.active_revision
    into current_snapshot_id, current_revision
    from public.cms_state as state
   where state.singleton = true
   for update;

  if not found then
    raise exception using
      errcode = '55000',
      message = 'cms_state singleton is missing';
  end if;

  if current_revision <> p_expected_revision then
    raise exception using
      errcode = '40001',
      message = 'CMS revision conflict',
      detail = format(
        'Expected revision %s but active revision is %s',
        p_expected_revision,
        current_revision
      ),
      hint = 'Reload the active snapshot, reapply the edit, and retry.';
  end if;

  next_revision := current_revision + 1;

  insert into public.cms_snapshots (
    revision,
    schema_version,
    content,
    checksum,
    actor,
    reason
  )
  values (
    next_revision,
    next_schema_version,
    p_content,
    calculated_checksum,
    btrim(p_actor),
    btrim(p_reason)
  )
  returning cms_snapshots.snapshot_id, cms_snapshots.created_at
    into next_snapshot_id, snapshot_created_at;

  update public.cms_state as state
     set active_snapshot_id = next_snapshot_id,
         active_revision = next_revision,
         updated_at = snapshot_created_at
   where state.singleton = true;

  insert into public.cms_audit_log (
    event_type,
    previous_revision,
    new_revision,
    snapshot_id,
    checksum,
    actor,
    reason,
    details
  )
  values (
    'commit',
    current_revision,
    next_revision,
    next_snapshot_id,
    calculated_checksum,
    btrim(p_actor),
    btrim(p_reason),
    jsonb_build_object(
      'previous_snapshot_id', current_snapshot_id,
      'schema_version', next_schema_version
    )
  );

  return query
  select
    next_revision,
    next_schema_version,
    p_content,
    calculated_checksum,
    snapshot_created_at,
    btrim(p_actor),
    btrim(p_reason);
end;
$function$;

-- Public site media is readable through the bucket URL/CDN. There are no
-- anon/authenticated write policies on storage.objects: upload authorization
-- stays in trusted server code, which issues unique paths and never uses upsert.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'cms-media',
  'cms-media',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do nothing;

-- Defense in depth: no table is available through the Data API by default.
-- service_role receives only the minimum direct privileges it needs. Snapshot
-- and state mutations remain available solely through the SECURITY DEFINER RPC.
alter table public.cms_snapshots enable row level security;
alter table public.cms_snapshots force row level security;
alter table public.cms_state enable row level security;
alter table public.cms_state force row level security;
alter table public.cms_audit_log enable row level security;
alter table public.cms_audit_log force row level security;
alter table public.media_assets enable row level security;
alter table public.media_assets force row level security;

revoke all on table public.cms_snapshots from public, anon, authenticated, service_role;
revoke all on table public.cms_state from public, anon, authenticated, service_role;
revoke all on table public.cms_audit_log from public, anon, authenticated, service_role;
revoke all on table public.media_assets from public, anon, authenticated, service_role;
revoke all on table public.cms_current_snapshot from public, anon, authenticated, service_role;

grant select on table public.cms_snapshots to service_role;
grant select on table public.cms_state to service_role;
grant select on table public.cms_audit_log to service_role;
grant select, insert on table public.media_assets to service_role;
grant select on table public.cms_current_snapshot to service_role;
grant usage, select on sequence public.media_assets_media_id_seq to service_role;

revoke all on function public.cms_calculate_checksum(jsonb) from public, anon, authenticated;
revoke all on function public.cms_get_current_snapshot() from public, anon, authenticated;
revoke all on function public.cms_commit_snapshot(bigint, jsonb, text, text, text)
  from public, anon, authenticated;
revoke all on function public.cms_reject_immutable_mutation() from public, anon, authenticated;
revoke all on function public.cms_protect_singleton_state() from public, anon, authenticated;

grant execute on function public.cms_calculate_checksum(jsonb) to service_role;
grant execute on function public.cms_get_current_snapshot() to service_role;
grant execute on function public.cms_commit_snapshot(bigint, jsonb, text, text, text)
  to service_role;

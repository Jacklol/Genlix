-- Partnership requests submitted from the public Genlix site.
--
-- Access is intentionally limited to the server-side service role. Public
-- visitors submit through a validated Server Action and never talk to this
-- table directly.

create table if not exists public.contact_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  company text not null check (char_length(btrim(company)) between 2 and 160),
  contact_name text not null check (char_length(btrim(contact_name)) between 2 and 120),
  phone text not null check (char_length(btrim(phone)) between 7 and 40),
  email text check (email is null or char_length(btrim(email)) between 5 and 254),
  business_type text not null check (
    business_type in ('horeca', 'retail', 'distributor')
  ),
  product_slug text check (
    product_slug is null or char_length(btrim(product_slug)) between 1 and 120
  ),
  product_title text check (
    product_title is null or char_length(btrim(product_title)) between 1 and 240
  ),
  product_channel text check (
    product_channel is null or product_channel in ('horeca', 'retail')
  ),
  source_path text not null default '/' check (
    char_length(source_path) between 1 and 300 and left(source_path, 1) = '/'
  ),
  status text not null default 'new' check (
    status in ('new', 'in_progress', 'closed')
  ),
  admin_note text check (admin_note is null or char_length(admin_note) <= 4000),
  ip_hash text check (ip_hash is null or ip_hash ~ '^[0-9a-f]{64}$'),
  privacy_accepted_at timestamptz not null
);

comment on table public.contact_requests is
  'B2B partnership requests received through the validated public contact form.';

create index if not exists contact_requests_created_at_idx
  on public.contact_requests (created_at desc);

create index if not exists contact_requests_status_created_at_idx
  on public.contact_requests (status, created_at desc);

create index if not exists contact_requests_ip_hash_created_at_idx
  on public.contact_requests (ip_hash, created_at desc)
  where ip_hash is not null;

create or replace function public.contact_requests_set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

drop trigger if exists contact_requests_set_updated_at on public.contact_requests;

create trigger contact_requests_set_updated_at
before update on public.contact_requests
for each row execute function public.contact_requests_set_updated_at();

alter table public.contact_requests enable row level security;

revoke all on table public.contact_requests from anon, authenticated;
grant select, insert, update on table public.contact_requests to service_role;

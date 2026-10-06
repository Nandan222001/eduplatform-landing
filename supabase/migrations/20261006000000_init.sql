-- Sarasvi website backend: form submissions + first-party analytics.
-- Run once in Supabase: Dashboard -> SQL Editor -> paste -> Run
-- (or `supabase db push` with the Supabase CLI).
--
-- Security model: Row Level Security is ON and there are NO policies for the
-- anon/authenticated roles, so the public API keys can neither read nor write
-- these tables. Only the website's server functions (/api/submit, /api/track),
-- which use the service-role key kept in Vercel env vars, can insert rows.
-- You read the data in the Supabase dashboard (Table Editor / SQL Editor).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- forms
create table if not exists public.form_submissions (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  form_type        text not null check (form_type in ('demo-request', 'newsletter', 'feedback')),
  name             text check (char_length(name) <= 100),
  email            text not null check (char_length(email) <= 200 and email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'),
  phone            text check (char_length(phone) <= 30),
  institution      text check (char_length(institution) <= 150),
  role             text check (char_length(role) <= 60),
  students         text check (char_length(students) <= 40),
  message          text check (char_length(message) <= 1000),
  privacy_consent  boolean not null default false,
  publish_consent  boolean not null default false,  -- feedback: may we publish it word for word?
  page_url         text check (char_length(page_url) <= 500),
  referrer         text check (char_length(referrer) <= 500),
  utm              jsonb not null default '{}'::jsonb,
  country          text check (char_length(country) <= 2),
  user_agent       text check (char_length(user_agent) <= 400),
  ip_hash          text,                            -- salted SHA-256, never the raw IP
  status           text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'closed', 'spam')),
  notes            text
);
create index if not exists form_submissions_created_idx on public.form_submissions (created_at desc);
create index if not exists form_submissions_type_idx    on public.form_submissions (form_type, created_at desc);
create index if not exists form_submissions_iphash_idx  on public.form_submissions (ip_hash, created_at desc);

-- ------------------------------------------------------------ analytics
create table if not exists public.analytics_events (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  event        text not null check (event ~ '^[a-z_]{2,40}$'),
  path         text not null check (char_length(path) <= 300),
  referrer     text check (char_length(referrer) <= 300),
  utm_source   text check (char_length(utm_source) <= 100),
  utm_medium   text check (char_length(utm_medium) <= 100),
  utm_campaign text check (char_length(utm_campaign) <= 100),
  session_id   text check (char_length(session_id) <= 40),  -- random per tab session, no cookie
  device       text check (device in ('mobile', 'tablet', 'desktop')),
  screen_w     int  check (screen_w between 0 and 10000),
  lang         text check (char_length(lang) <= 20),
  country      text check (char_length(country) <= 2),
  props        jsonb not null default '{}'::jsonb check (pg_column_size(props) <= 2000)
);
create index if not exists analytics_events_created_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_event_idx   on public.analytics_events (event, created_at desc);

-- ------------------------------------------------------------- security
alter table public.form_submissions enable row level security;
alter table public.analytics_events  enable row level security;
revoke all on public.form_submissions from anon, authenticated;
revoke all on public.analytics_events  from anon, authenticated;

-- -------------------------------------------------------- report views
-- security_invoker so the views obey the same RLS as the tables.
create or replace view public.report_daily_traffic with (security_invoker = true) as
select date_trunc('day', created_at)::date as day,
       count(*) filter (where event = 'page_view')                     as page_views,
       count(distinct session_id) filter (where event = 'page_view')   as visitors,
       count(*) filter (where event = 'form_submit')                   as form_submits,
       count(*) filter (where event = 'cta_click')                     as cta_clicks
from public.analytics_events
group by 1 order by 1 desc;

create or replace view public.report_top_pages with (security_invoker = true) as
select path, count(*) as views, count(distinct session_id) as visitors
from public.analytics_events
where event = 'page_view' and created_at > now() - interval '30 days'
group by path order by views desc;

create or replace view public.report_traffic_sources with (security_invoker = true) as
select coalesce(nullif(utm_source, ''), nullif(split_part(split_part(referrer, '://', 2), '/', 1), ''), '(direct)') as source,
       count(distinct session_id) as visitors
from public.analytics_events
where event = 'page_view' and created_at > now() - interval '30 days'
group by 1 order by visitors desc;

create or replace view public.report_leads_by_day with (security_invoker = true) as
select date_trunc('day', created_at)::date as day, form_type, count(*) as submissions
from public.form_submissions
where status <> 'spam'
group by 1, 2 order by 1 desc, 2;

revoke all on public.report_daily_traffic, public.report_top_pages,
              public.report_traffic_sources, public.report_leads_by_day from anon, authenticated;

-- ------------------------------------------------------ data retention
-- Matches the privacy policy: analytics 14 months, enquiries 24 months.
-- Schedule it with pg_cron (Database -> Extensions -> pg_cron), e.g.:
--   select cron.schedule('sarasvi-retention', '0 3 * * *', 'select public.purge_old_data()');
create or replace function public.purge_old_data() returns void
language sql security definer set search_path = public as $$
  delete from public.analytics_events where created_at < now() - interval '14 months';
  delete from public.form_submissions where created_at < now() - interval '24 months' and status <> 'qualified';
$$;
revoke all on function public.purge_old_data() from public, anon, authenticated;

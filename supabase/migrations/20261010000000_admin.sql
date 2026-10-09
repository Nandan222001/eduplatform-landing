-- Admin panel support. Run once in Supabase -> SQL Editor (after the first migration).
--  * form_submissions.approved : the admin ticked "show on website" for a feedback
--    submission whose author also allowed publishing (publish_consent).
--  * admin_stats(days)         : one call returns everything the dashboard shows.
-- Both are reachable only with the service-role key (the website's server code).

alter table public.form_submissions add column if not exists approved boolean not null default false;
create index if not exists form_submissions_approved_idx on public.form_submissions (approved) where approved;

create or replace function public.admin_stats(p_days int default 30)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  d   int         := greatest(1, least(coalesce(p_days, 30), 365));
  t0  timestamptz := now() - make_interval(days => d);
  tp  timestamptz := now() - make_interval(days => d * 2);
  result jsonb;
begin
  select jsonb_build_object(
    'days', d,
    'totals', jsonb_build_object(
      'page_views',  (select count(*) from analytics_events where event = 'page_view' and created_at >= t0),
      'visitors',    (select count(distinct session_id) from analytics_events where event = 'page_view' and created_at >= t0),
      'leads',       (select count(*) from form_submissions where created_at >= t0 and status <> 'spam' and form_type = 'demo-request'),
      'subscribers', (select count(*) from form_submissions where created_at >= t0 and status <> 'spam' and form_type = 'newsletter'),
      'feedback',    (select count(*) from form_submissions where created_at >= t0 and status <> 'spam' and form_type = 'feedback')
    ),
    'previous', jsonb_build_object(
      'page_views',  (select count(*) from analytics_events where event = 'page_view' and created_at >= tp and created_at < t0),
      'visitors',    (select count(distinct session_id) from analytics_events where event = 'page_view' and created_at >= tp and created_at < t0),
      'leads',       (select count(*) from form_submissions where created_at >= tp and created_at < t0 and status <> 'spam' and form_type = 'demo-request')
    ),
    'all_time', jsonb_build_object(
      'leads',    (select count(*) from form_submissions where form_type = 'demo-request' and status <> 'spam'),
      'new_leads',(select count(*) from form_submissions where form_type = 'demo-request' and status = 'new'),
      'events',   (select count(*) from analytics_events),
      'pending_feedback', (select count(*) from form_submissions where form_type = 'feedback' and publish_consent and not approved and status <> 'spam')
    ),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object('day', g.day, 'visitors', coalesce(v.visitors, 0), 'page_views', coalesce(v.page_views, 0), 'leads', coalesce(l.leads, 0)) order by g.day)
      from generate_series((t0)::date, now()::date, interval '1 day') as g(day)
      left join (select created_at::date as day, count(distinct session_id) as visitors, count(*) as page_views
                 from analytics_events where event = 'page_view' and created_at >= t0 group by 1) v on v.day = g.day::date
      left join (select created_at::date as day, count(*) as leads
                 from form_submissions where created_at >= t0 and status <> 'spam' and form_type = 'demo-request' group by 1) l on l.day = g.day::date
    ), '[]'::jsonb),
    'top_pages', coalesce((select jsonb_agg(x) from (
      select path, count(*) as views, count(distinct session_id) as visitors from analytics_events
      where event = 'page_view' and created_at >= t0 group by path order by views desc limit 8) x), '[]'::jsonb),
    'sources', coalesce((select jsonb_agg(x) from (
      select coalesce(nullif(utm_source, ''), nullif(split_part(split_part(referrer, '://', 2), '/', 1), ''), '(direct)') as source,
             count(distinct session_id) as visitors
      from analytics_events where event = 'page_view' and created_at >= t0 group by 1 order by visitors desc limit 8) x), '[]'::jsonb),
    'devices', coalesce((select jsonb_agg(x) from (
      select coalesce(device, 'unknown') as device, count(distinct session_id) as visitors from analytics_events
      where event = 'page_view' and created_at >= t0 group by 1 order by visitors desc) x), '[]'::jsonb),
    'countries', coalesce((select jsonb_agg(x) from (
      select coalesce(country, '??') as country, count(distinct session_id) as visitors from analytics_events
      where event = 'page_view' and created_at >= t0 group by 1 order by visitors desc limit 8) x), '[]'::jsonb),
    'top_clicks', coalesce((select jsonb_agg(x) from (
      select coalesce(props->>'label', '(unlabelled)') as label, count(*) as clicks from analytics_events
      where event = 'cta_click' and created_at >= t0 group by 1 order by clicks desc limit 8) x), '[]'::jsonb),
    'faq', coalesce((select jsonb_agg(x) from (
      select coalesce(props->>'question', '?') as question, count(*) as opens from analytics_events
      where event = 'faq_open' and created_at >= t0 group by 1 order by opens desc limit 6) x), '[]'::jsonb),
    'funnel', jsonb_build_object(
      'visitors',  (select count(distinct session_id) from analytics_events where event = 'page_view' and created_at >= t0),
      'scrolled',  (select count(distinct session_id) from analytics_events where event = 'scroll_depth' and (props->>'percent')::int >= 50 and created_at >= t0),
      'clicked',   (select count(distinct session_id) from analytics_events where event = 'cta_click' and created_at >= t0),
      'submitted', (select count(distinct session_id) from analytics_events where event = 'form_submit' and created_at >= t0)
    ),
    'leads_by_status', coalesce((select jsonb_object_agg(status, n) from (
      select status, count(*) as n from form_submissions where form_type = 'demo-request' group by status) s), '{}'::jsonb)
  ) into result;
  return result;
end $$;

revoke all on function public.admin_stats(int) from public, anon, authenticated;
grant execute on function public.admin_stats(int) to service_role;

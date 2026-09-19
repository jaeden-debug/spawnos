-- App Store acquisition reporting (Apple App Store Connect Analytics Reports API).
--
-- Source of truth: Apple's "App Downloads" reports (Standard + Detailed),
-- fetched by the daily /api/cron/app-store-sync job. Nothing in here is
-- real-time and nothing identifies a person: Apple only ever gives us
-- aggregated counts per day and dimension.
--
-- DATES
--   report_date      Apple's "Date" column: the calendar day the downloads
--                    happened. Apple's API docs do not state a timezone; the
--                    App Analytics dashboard uses UTC, so every comparison with
--                    first-party funnel data in this schema buckets by UTC day.
--   processing_date  The day Apple generated the report instance. One daily
--                    instance can carry several report_dates, and Apple states
--                    that a newer instance REPLACES older rows for the same
--                    date — rows are never summed across instances.
--
-- IDEMPOTENCY
--   * Every downloaded file segment is recorded in app_store_report_segments
--     (PK = Apple's segment id, plus its MD5 checksum). A segment already
--     imported with the same checksum is never downloaded again.
--   * app_store_apply_download_segment() replaces a date's rows atomically,
--     and only when the incoming processing_date is at least as new as what
--     is stored. Re-importing the same segment is a no-op in effect; an older
--     segment can never overwrite newer data.
--
-- ACCESS
--   RLS on, no policies: only the service role (server) can read or write.

-- ── Import ledger ───────────────────────────────────────────────────────────
create table if not exists public.app_store_report_segments (
  segment_id        text primary key,
  app_id            text not null,
  request_id        text not null,
  access_type       text not null check (access_type in ('ONGOING', 'ONE_TIME_SNAPSHOT')),
  report_id         text not null,
  report_name       text not null,
  report_variant    text not null check (report_variant in ('standard', 'detailed')),
  instance_id       text not null,
  granularity       text not null check (granularity in ('DAILY', 'WEEKLY', 'MONTHLY')),
  processing_date   date not null,
  checksum          text,
  size_bytes        bigint,
  row_count         integer,
  data_date_min     date,
  data_date_max     date,
  dates_applied     date[] not null default '{}',
  dates_superseded  date[] not null default '{}',
  status            text not null check (status in ('imported', 'failed')),
  error             text,
  first_seen_at     timestamptz not null default now(),
  imported_at       timestamptz,
  updated_at        timestamptz not null default now()
);

create index if not exists app_store_report_segments_instance_idx
  on public.app_store_report_segments (instance_id);

-- ── Normalized download facts ───────────────────────────────────────────────
-- One row per (report variant, granularity, date, full dimension set).
-- Empty string (not NULL) marks "dimension absent" so the unique key works.
create table if not exists public.app_store_download_facts (
  id                bigint generated always as identity primary key,
  app_id            text not null,
  report_variant    text not null check (report_variant in ('standard', 'detailed')),
  granularity       text not null check (granularity in ('DAILY', 'WEEKLY', 'MONTHLY')),
  report_date       date not null,
  download_type     text not null,
  source_type       text not null default '',
  source_info       text not null default '',
  campaign          text not null default '',
  page_type         text not null default '',
  page_title        text not null default '',
  territory         text not null default '',
  device            text not null default '',
  platform_version  text not null default '',
  app_version       text not null default '',
  pre_order         text not null default '',
  counts            integer not null check (counts >= 0),
  processing_date   date not null,
  segment_id        text not null references public.app_store_report_segments (segment_id),
  created_at        timestamptz not null default now(),
  constraint app_store_download_facts_dims_key unique (
    app_id, report_variant, granularity, report_date, download_type, source_type,
    source_info, campaign, page_type, page_title, territory, device,
    platform_version, app_version, pre_order
  )
);

create index if not exists app_store_download_facts_date_idx
  on public.app_store_download_facts (app_id, report_variant, granularity, report_date);

-- ── Sync state (one row per app) ────────────────────────────────────────────
create table if not exists public.app_store_sync_state (
  app_id                        text primary key,
  last_attempt_at               timestamptz,
  last_success_at               timestamptz,
  latest_available_processing_date date,
  latest_imported_processing_date  date,
  latest_complete_report_date   date,
  latest_report_date_with_data  date,
  consecutive_failures          integer not null default 0,
  last_error_code               text,
  last_error                    text,
  last_failure_alert_at         timestamptz,
  lock_owner                    text,
  lock_until                    timestamptz,
  updated_at                    timestamptz not null default now()
);

-- ── Sync run log ────────────────────────────────────────────────────────────
create table if not exists public.app_store_sync_runs (
  id                  bigint generated always as identity primary key,
  run_id              text not null unique,
  app_id              text not null,
  trigger             text not null check (trigger in ('cron', 'manual', 'backfill', 'test')),
  status              text not null check (status in ('running', 'success', 'partial', 'failed', 'not_configured', 'skipped_locked')),
  started_at          timestamptz not null default now(),
  finished_at         timestamptz,
  segments_seen       integer not null default 0,
  segments_imported   integer not null default 0,
  segments_skipped    integer not null default 0,
  segments_failed     integer not null default 0,
  rows_imported       integer not null default 0,
  dates_applied       date[] not null default '{}',
  error_code          text,
  error               text,
  email_outcome       text,
  details             jsonb not null default '{}'::jsonb
);

create index if not exists app_store_sync_runs_started_idx
  on public.app_store_sync_runs (app_id, started_at desc);

-- ── Email log + per-date dedupe claims ──────────────────────────────────────
create table if not exists public.app_store_alerts (
  id            bigint generated always as identity primary key,
  app_id        text not null,
  kind          text not null check (kind in ('acquisition', 'sync_failure', 'test')),
  dedupe_key    text not null unique,
  report_dates  date[] not null default '{}',
  recipient     text not null,
  subject       text not null,
  status        text not null check (status in ('sending', 'sent', 'failed')),
  attempts      integer not null default 1,
  provider_id   text,
  error         text,
  created_at    timestamptz not null default now(),
  sent_at       timestamptz
);

-- A date can be announced at most once per kind. Claimed before sending;
-- released again if the provider rejects the email so the next run retries.
create table if not exists public.app_store_alert_dates (
  app_id       text not null,
  kind         text not null check (kind in ('acquisition')),
  report_date  date not null,
  alert_id     bigint not null references public.app_store_alerts (id) on delete cascade,
  claimed_at   timestamptz not null default now(),
  primary key (app_id, kind, report_date)
);

alter table public.app_store_report_segments enable row level security;
alter table public.app_store_download_facts  enable row level security;
alter table public.app_store_sync_state      enable row level security;
alter table public.app_store_sync_runs       enable row level security;
alter table public.app_store_alerts          enable row level security;
alter table public.app_store_alert_dates     enable row level security;

-- ── Atomic segment import ───────────────────────────────────────────────────
-- p_segment: ledger fields (segment_id, app_id, request_id, access_type,
--            report_id, report_name, report_variant, instance_id, granularity,
--            processing_date, checksum, size_bytes)
-- p_rows:    [{report_date, download_type, source_type, source_info, campaign,
--              page_type, page_title, territory, device, platform_version,
--              app_version, pre_order, counts}]  — already normalized and
--            aggregated by the importer (no duplicate dimension sets).
create or replace function public.app_store_apply_download_segment(p_segment jsonb, p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app        text := p_segment->>'app_id';
  v_variant    text := p_segment->>'report_variant';
  v_gran       text := p_segment->>'granularity';
  v_pd         date := (p_segment->>'processing_date')::date;
  v_seg        text := p_segment->>'segment_id';
  v_date       date;
  v_existing   date;
  v_applied    date[] := '{}';
  v_superseded date[] := '{}';
  v_inserted   integer := 0;
  v_n          integer;
begin
  if v_app is null or v_variant is null or v_gran is null or v_pd is null or v_seg is null then
    raise exception 'app_store_apply_download_segment: incomplete segment metadata';
  end if;

  -- Serialize imports for this app so two overlapping runs cannot interleave
  -- a delete/insert for the same date.
  perform pg_advisory_xact_lock(hashtext('app_store_import:' || v_app));

  -- Ledger row first (facts reference it).
  insert into public.app_store_report_segments as s (
    segment_id, app_id, request_id, access_type, report_id, report_name,
    report_variant, instance_id, granularity, processing_date, checksum,
    size_bytes, status, updated_at
  ) values (
    v_seg, v_app, p_segment->>'request_id', p_segment->>'access_type',
    p_segment->>'report_id', p_segment->>'report_name', v_variant,
    p_segment->>'instance_id', v_gran, v_pd, p_segment->>'checksum',
    nullif(p_segment->>'size_bytes', '')::bigint, 'imported', now()
  )
  on conflict (segment_id) do update set
    checksum   = excluded.checksum,
    size_bytes = excluded.size_bytes,
    status     = 'imported',
    error      = null,
    updated_at = now();

  for v_date in
    select distinct (r->>'report_date')::date from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) r order by 1
  loop
    select max(processing_date) into v_existing
      from public.app_store_download_facts
     where app_id = v_app and report_variant = v_variant
       and granularity = v_gran and report_date = v_date;

    if v_existing is not null and v_existing > v_pd then
      v_superseded := v_superseded || v_date;
      continue;
    end if;

    delete from public.app_store_download_facts
     where app_id = v_app and report_variant = v_variant
       and granularity = v_gran and report_date = v_date;

    insert into public.app_store_download_facts (
      app_id, report_variant, granularity, report_date, download_type,
      source_type, source_info, campaign, page_type, page_title, territory,
      device, platform_version, app_version, pre_order, counts,
      processing_date, segment_id
    )
    select v_app, v_variant, v_gran, v_date,
           coalesce(r->>'download_type', ''),
           coalesce(r->>'source_type', ''), coalesce(r->>'source_info', ''),
           coalesce(r->>'campaign', ''), coalesce(r->>'page_type', ''),
           coalesce(r->>'page_title', ''), coalesce(r->>'territory', ''),
           coalesce(r->>'device', ''), coalesce(r->>'platform_version', ''),
           coalesce(r->>'app_version', ''), coalesce(r->>'pre_order', ''),
           (r->>'counts')::integer, v_pd, v_seg
      from jsonb_array_elements(p_rows) r
     where (r->>'report_date')::date = v_date;

    get diagnostics v_n = row_count;
    v_inserted := v_inserted + v_n;
    v_applied := v_applied || v_date;
  end loop;

  update public.app_store_report_segments set
    row_count        = jsonb_array_length(coalesce(p_rows, '[]'::jsonb)),
    data_date_min    = (select min((r->>'report_date')::date) from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) r),
    data_date_max    = (select max((r->>'report_date')::date) from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) r),
    dates_applied    = v_applied,
    dates_superseded = v_superseded,
    imported_at      = now(),
    updated_at       = now()
  where segment_id = v_seg;

  return jsonb_build_object(
    'segment_id', v_seg,
    'rows_inserted', v_inserted,
    'dates_applied', to_jsonb(v_applied),
    'dates_superseded', to_jsonb(v_superseded)
  );
end;
$$;

-- ── Run lease: at most one sync per app at a time ──────────────────────────
create or replace function public.app_store_acquire_sync_lock(p_app_id text, p_owner text, p_ttl_seconds integer default 600)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok boolean;
begin
  insert into public.app_store_sync_state (app_id) values (p_app_id)
  on conflict (app_id) do nothing;

  update public.app_store_sync_state
     set lock_owner = p_owner,
         lock_until = now() + make_interval(secs => p_ttl_seconds),
         last_attempt_at = now(),
         updated_at = now()
   where app_id = p_app_id
     and (lock_until is null or lock_until < now() or lock_owner = p_owner)
  returning true into v_ok;

  return coalesce(v_ok, false);
end;
$$;

create or replace function public.app_store_release_sync_lock(p_app_id text, p_owner text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.app_store_sync_state
     set lock_owner = null, lock_until = null, updated_at = now()
   where app_id = p_app_id and lock_owner = p_owner;
$$;

-- ── Email claims ────────────────────────────────────────────────────────────
-- Claims the given dates for an acquisition email. Returns the new alert id
-- and the dates this caller actually won (dates already announced, or being
-- announced by a concurrent run, are excluded). Returns alert_id = null when
-- nothing was claimable, in which case no email must be sent.
create or replace function public.app_store_claim_acquisition_alert(
  p_app_id text, p_dates date[], p_recipient text, p_subject text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alert   bigint;
  v_claimed date[];
  v_key     text;
begin
  perform pg_advisory_xact_lock(hashtext('app_store_alert:' || p_app_id));

  select array_agg(d order by d) into v_claimed
    from unnest(p_dates) d
   where not exists (
     select 1 from public.app_store_alert_dates a
      where a.app_id = p_app_id and a.kind = 'acquisition' and a.report_date = d
   )
     -- Give up on a date after 5 failed provider attempts rather than retrying forever.
     and not exists (
     select 1 from public.app_store_alerts x
      where x.app_id = p_app_id and x.kind = 'acquisition' and x.status = 'failed'
        and x.attempts >= 5 and d = any (x.report_dates)
   );

  if v_claimed is null or array_length(v_claimed, 1) is null then
    return jsonb_build_object('alert_id', null, 'dates', '[]'::jsonb);
  end if;

  v_key := 'acquisition:' || p_app_id || ':' || array_to_string(v_claimed, ',');

  insert into public.app_store_alerts (app_id, kind, dedupe_key, report_dates, recipient, subject, status)
  values (p_app_id, 'acquisition', v_key, v_claimed, p_recipient, p_subject, 'sending')
  on conflict (dedupe_key) do update
     set attempts = public.app_store_alerts.attempts + 1,
         status = 'sending',
         subject = excluded.subject,
         error = null
  returning id into v_alert;

  insert into public.app_store_alert_dates (app_id, kind, report_date, alert_id)
  select p_app_id, 'acquisition', d, v_alert from unnest(v_claimed) d
  on conflict do nothing;

  return jsonb_build_object('alert_id', v_alert, 'dedupe_key', v_key, 'dates', to_jsonb(v_claimed));
end;
$$;

-- Releases claims after a provider failure so the next run can retry.
create or replace function public.app_store_fail_acquisition_alert(p_alert_id bigint, p_error text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.app_store_alert_dates where alert_id = p_alert_id;
  update public.app_store_alerts set status = 'failed', error = left(p_error, 1000) where id = p_alert_id;
$$;

-- Atomically decides whether a sync-failure alert may be sent now.
create or replace function public.app_store_claim_failure_alert(
  p_app_id text, p_min_failures integer, p_cooldown_hours integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok boolean;
begin
  update public.app_store_sync_state
     set last_failure_alert_at = now(), updated_at = now()
   where app_id = p_app_id
     and consecutive_failures >= p_min_failures
     and (last_failure_alert_at is null
          or last_failure_alert_at < now() - make_interval(hours => p_cooldown_hours))
  returning true into v_ok;
  return coalesce(v_ok, false);
end;
$$;

-- ── Reporting views ─────────────────────────────────────────────────────────
-- Totals come from the STANDARD report (fewest dimensions, so least exposed
-- to Apple's privacy thresholding). Source/campaign breakdowns can only come
-- from the DETAILED report, which Apple thresholds (<5 users dropped) and
-- noises (about ±2) — label them as such wherever they are shown.

create or replace view public.app_store_daily_downloads with (security_invoker = true) as
select
  app_id,
  report_date,
  sum(counts) filter (where lower(download_type) = 'first-time download') as first_time_downloads,
  sum(counts) filter (where lower(download_type) = 'redownload')          as redownloads,
  sum(counts) filter (where lower(download_type) in ('manual update', 'auto-update')) as updates,
  sum(counts) filter (where lower(download_type) = 'restore')             as restores,
  sum(counts) filter (where lower(download_type) in ('first-time download', 'redownload')) as total_downloads,
  max(processing_date) as processing_date
from public.app_store_download_facts
where report_variant = 'standard' and granularity = 'DAILY'
group by app_id, report_date;

create or replace view public.app_store_daily_territories with (security_invoker = true) as
select
  app_id,
  report_date,
  territory,
  sum(counts) filter (where lower(download_type) = 'first-time download') as first_time_downloads,
  sum(counts) filter (where lower(download_type) = 'redownload')          as redownloads
from public.app_store_download_facts
where report_variant = 'standard' and granularity = 'DAILY'
group by app_id, report_date, territory;

create or replace view public.app_store_daily_sources with (security_invoker = true) as
select
  app_id,
  report_date,
  source_type,
  source_info,
  campaign,
  sum(counts) filter (where lower(download_type) = 'first-time download') as first_time_downloads,
  sum(counts) filter (where lower(download_type) = 'redownload')          as redownloads
from public.app_store_download_facts
where report_variant = 'detailed' and granularity = 'DAILY'
group by app_id, report_date, source_type, source_info, campaign;

comment on view public.app_store_daily_sources is
  'From Apple''s DETAILED report: privacy-thresholded (<5 users omitted) and noised (~±2). Never present as exact or deterministic attribution.';

-- First-party funnel by UTC day (test traffic excluded). Aggregate only.
create or replace view public.funnel_daily with (security_invoker = true) as
select
  (created_at at time zone 'UTC')::date as day_utc,
  site,
  event,
  from_blackwater,
  coalesce(utm_source, '')   as utm_source,
  coalesce(utm_medium, '')   as utm_medium,
  coalesce(utm_campaign, '') as utm_campaign,
  (click_id_type is not null or lower(coalesce(utm_medium, '')) in ('cpc', 'ppc', 'paid', 'paidsearch')) as is_paid,
  coalesce(app_store_ct, '') as app_store_ct,
  count(*) as events
from public.funnel_events
where is_test = false
group by 1, 2, 3, 4, 5, 6, 7, 8, 9;

revoke all on public.app_store_daily_downloads, public.app_store_daily_territories,
  public.app_store_daily_sources, public.funnel_daily from anon, authenticated;
revoke all on function public.app_store_apply_download_segment(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.app_store_acquire_sync_lock(text, text, integer) from public, anon, authenticated;
revoke all on function public.app_store_release_sync_lock(text, text) from public, anon, authenticated;
revoke all on function public.app_store_claim_acquisition_alert(text, date[], text, text) from public, anon, authenticated;
revoke all on function public.app_store_fail_acquisition_alert(bigint, text) from public, anon, authenticated;
revoke all on function public.app_store_claim_failure_alert(text, integer, integer) from public, anon, authenticated;

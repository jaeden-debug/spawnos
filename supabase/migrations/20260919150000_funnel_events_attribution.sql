-- Funnel ledger: campaign attribution columns (additive, nullable).
--
-- Extends public.funnel_events (created 20260919131655, is_test 20260919131710)
-- so a visit that starts on a Google Ads click and hops Blackwater -> spawnos.ca
-- -> App Store keeps its campaign context on every event it emits.
--
-- Privacy:
--   * utm_* are campaign labels we or Google put in our own URLs. No PII.
--   * click_id is Google's ad-click identifier (gclid / gbraid / wbraid). It is
--     pseudonymous and is kept ONLY so an App Store click can later be reported
--     back to Google Ads as an offline conversion (Google's import window is 90
--     days). purge_funnel_click_ids() nulls it after 90 days; the daily App
--     Store sync calls it.
--   * No IP, no user agent, no cookie, no user id. Unchanged from the ledger.
--
-- Existing rows and existing writers are unaffected: every column is nullable
-- and the insert path ignores fields it is not sent.

alter table public.funnel_events
  add column if not exists utm_source    text,
  add column if not exists utm_medium    text,
  add column if not exists utm_campaign  text,
  add column if not exists utm_term      text,
  add column if not exists utm_content   text,
  add column if not exists click_id_type text,
  add column if not exists click_id      text,
  add column if not exists ref_placement text,
  add column if not exists app_store_ct  text;

alter table public.funnel_events
  drop constraint if exists funnel_events_click_id_type_check;
alter table public.funnel_events
  add constraint funnel_events_click_id_type_check
  check (click_id_type is null or click_id_type in ('gclid', 'gbraid', 'wbraid'));

comment on column public.funnel_events.click_id is
  'Google Ads click id (gclid/gbraid/wbraid). Pseudonymous; nulled after 90 days by purge_funnel_click_ids().';
comment on column public.funnel_events.ref_placement is
  'Blackwater placement that sent this visitor to spawnos.ca (bw_placement URL param).';
comment on column public.funnel_events.app_store_ct is
  'Apple App Store campaign token (ct) on the link that was clicked, when a campaign link was used.';

create index if not exists funnel_events_created_at_idx on public.funnel_events (created_at);
create index if not exists funnel_events_campaign_idx
  on public.funnel_events (utm_source, utm_campaign) where utm_source is not null;

create or replace function public.purge_funnel_click_ids(p_older_than interval default interval '90 days')
returns integer
language sql
security definer
set search_path = public
as $$
  with purged as (
    update public.funnel_events
       set click_id = null
     where click_id is not null
       and created_at < now() - p_older_than
    returning 1
  )
  select count(*)::integer from purged;
$$;

revoke all on function public.purge_funnel_click_ids(interval) from public, anon, authenticated;

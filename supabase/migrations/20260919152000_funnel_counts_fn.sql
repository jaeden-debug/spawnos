-- Aggregated first-party funnel counts for a UTC day range (inclusive).
--
-- Returns counts only; never rows. Test traffic (is_test) is excluded. Used by
-- the App Store acquisition email and the founder acquisition dashboard to put
-- OUR funnel next to Apple's aggregate downloads for the same UTC days. The
-- two are compared side by side and are never joined per visitor.

create or replace function public.funnel_counts(p_from date, p_to date)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with e as (
    select *,
           (click_id_type is not null
            or lower(coalesce(utm_medium, '')) in ('cpc', 'ppc', 'paid', 'paidsearch')) as is_paid
      from public.funnel_events
     where is_test = false
       and created_at >= (p_from::timestamp at time zone 'UTC')
       and created_at <  ((p_to + 1)::timestamp at time zone 'UTC')
  ),
  store_clicks as (
    select * from e
     where (site = 'blackwater' and event = 'spawnos_appstore_click')
        or (site = 'spawnos'    and event = 'spawnos_app_store_click')
  )
  select jsonb_build_object(
    'bw_impressions',            (select count(*) from e where site = 'blackwater' and event = 'spawnos_impression'),
    'bw_to_spawnos_clicks',      (select count(*) from e where site = 'blackwater' and event = 'spawnos_cta_click'),
    'bw_app_store_clicks',       (select count(*) from e where site = 'blackwater' and event = 'spawnos_appstore_click'),
    'spawnos_arrivals_from_bw',  (select count(*) from e where site = 'spawnos' and event = 'blackwater_to_spawnos_click'),
    'spawnos_app_store_clicks',  (select count(*) from e where site = 'spawnos' and event = 'spawnos_app_store_click'),
    'spawnos_app_store_clicks_from_bw',
                                 (select count(*) from e where site = 'spawnos' and event = 'spawnos_app_store_click' and from_blackwater),
    'paid_app_store_clicks',     (select count(*) from store_clicks where is_paid),
    'app_store_clicks_by_campaign',
      coalesce((select jsonb_object_agg(app_store_ct, n)
                  from (select app_store_ct, count(*) as n from store_clicks
                         where app_store_ct is not null group by app_store_ct) c), '{}'::jsonb)
  );
$$;

revoke all on function public.funnel_counts(date, date) from public, anon, authenticated;

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  appStoreCampaignUrl,
  blackwaterCampaignToken,
  isBlackwaterAttribution,
  isPaidAttribution,
  parseAttribution,
  spawnosCampaignToken,
} from '../attribution'
import { isCronAuthorized } from '../cron-auth'
import { acquisitionSubject, buildAcquisitionEmail, territoryName } from '../email'

describe('campaign attribution', () => {
  it('captures utm tags, a Google Ads click id and the Blackwater placement', () => {
    const attr = parseAttribution('?utm_source=google&utm_medium=cpc&utm_campaign=spawnos_betta&utm_term=betta+fry&gclid=Cj0KCQjw_abc-123&bw_placement=fry_timeline_ctx')
    expect(attr).toEqual({
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'spawnos_betta',
      utm_term: 'betta fry',
      click_id_type: 'gclid',
      click_id: 'Cj0KCQjw_abc-123',
      ref_placement: 'fry_timeline_ctx',
    })
    expect(isPaidAttribution(attr)).toBe(true)
    expect(isBlackwaterAttribution(attr)).toBe(true)
  })

  it('accepts gbraid/wbraid and rejects malformed click ids and placements', () => {
    expect(parseAttribution('?gbraid=0AAAAA_braid-1')?.click_id_type).toBe('gbraid')
    expect(parseAttribution('?wbraid=CkQKCQjwbraid9')?.click_id_type).toBe('wbraid')
    expect(parseAttribution('?gclid=<script>')).toBeNull()
    expect(parseAttribution('?bw_placement=Robert%27);DROP')).toBeNull()
    expect(parseAttribution('')).toBeNull()
  })

  it('treats paid utm_medium without a click id as paid', () => {
    expect(isPaidAttribution({ utm_medium: 'CPC' })).toBe(true)
    expect(isPaidAttribution({ utm_medium: 'referral' })).toBe(false)
  })
})

describe('Apple campaign links', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('keeps the plain listing link until a provider token exists', () => {
    expect(appStoreCampaignUrl('spawnos_direct', '')).toBe('https://apps.apple.com/app/id6803675364')
  })

  it("builds Apple's documented campaign link format", () => {
    expect(appStoreCampaignUrl('bw_org_fry', '118000000')).toBe(
      'https://apps.apple.com/app/apple-store/id6803675364?pt=118000000&ct=bw_org_fry&mt=8',
    )
  })

  it('falls back rather than emitting an invalid campaign token', () => {
    expect(appStoreCampaignUrl('x'.repeat(31), '118000000')).toBe('https://apps.apple.com/app/id6803675364')
    expect(appStoreCampaignUrl('has space', '118000000')).toBe('https://apps.apple.com/app/id6803675364')
  })

  it('reads the provider token from the public env var', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_STORE_PROVIDER_TOKEN', '123456')
    expect(appStoreCampaignUrl('spawnos_direct')).toContain('pt=123456&ct=spawnos_direct')
  })

  it('names campaigns within Apple’s 30-character limit', () => {
    const tokens = [
      blackwaterCampaignToken('fry_timeline_ctx', false),
      blackwaterCampaignToken('pairing_ctx', true),
      blackwaterCampaignToken('footer_card', false),
      blackwaterCampaignToken('home_card', true),
      blackwaterCampaignToken('some_future_placement_name', true),
      spawnosCampaignToken({ gclid: undefined, click_id: 'Cj0abcdefgh', ref_placement: 'fry' } as never, true),
      spawnosCampaignToken(null, true),
      spawnosCampaignToken(null, false),
      spawnosCampaignToken({ utm_medium: 'cpc' }, false),
    ]
    expect(tokens).toEqual([
      'bw_org_fry', 'bw_gads_pair', 'bw_org_card', 'bw_gads_home', 'bw_gads_somefuturepl',
      'spawnos_gads_via_bw', 'spawnos_via_bw', 'spawnos_direct', 'spawnos_gads',
    ])
    expect(tokens.every((t) => t.length <= 30)).toBe(true)
  })
})

describe('cron authentication', () => {
  const secret = 'a'.repeat(32)
  it('accepts only the exact bearer secret', () => {
    expect(isCronAuthorized(`Bearer ${secret}`, secret)).toBe(true)
    expect(isCronAuthorized(`Bearer ${secret}x`, secret)).toBe(false)
    expect(isCronAuthorized(secret, secret)).toBe(false)
    expect(isCronAuthorized(null, secret)).toBe(false)
  })
  it('refuses everything when the secret is unset or weak', () => {
    expect(isCronAuthorized('Bearer ', undefined)).toBe(false)
    expect(isCronAuthorized('Bearer short', 'short')).toBe(false)
  })
})

describe('email wording', () => {
  it('uses singular/plural correctly and prefixes tests', () => {
    const day = { report_date: '2026-09-17', first_time_downloads: 1, redownloads: 0, total_downloads: 1 }
    expect(acquisitionSubject({ days: [day] })).toBe('SpawnOS — Apple reported 1 first-time download for Sep 17, 2026')
    expect(acquisitionSubject({ days: [day], test: true })).toMatch(/^TEST — /)
  })

  it('says campaigns are thresholded when Apple reports none', () => {
    const email = buildAcquisitionEmail({
      days: [{ report_date: '2026-09-17', first_time_downloads: 2, redownloads: 0, total_downloads: 2 }],
      territories: [],
      sourceTypes: [],
      campaigns: [],
      funnel: {
        bwImpressions: 0, bwToSpawnosClicks: 0, bwAppStoreClicks: 0, spawnosArrivalsFromBw: 0,
        spawnosAppStoreClicks: 0, spawnosAppStoreClicksFromBw: 0, paidAppStoreClicks: 0, appStoreClicksByCampaign: {},
      },
    })
    expect(email.text).toContain('Apple omits campaign rows from fewer than 5 users')
    expect(email.html).toContain('VIEW APP STORE ANALYTICS')
  })

  it('names territories from ISO codes and keeps unknown values', () => {
    expect(territoryName('CA')).toBe('Canada')
    expect(territoryName('United States')).toBe('United States')
  })
})

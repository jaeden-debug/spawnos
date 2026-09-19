import { beforeEach, describe, expect, it, vi } from 'vitest'

const inserted: Array<Record<string, unknown>> = []
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({ insert: async (row: Record<string, unknown>) => { inserted.push(row); return { error: null } } }),
  }),
}))

const { POST } = await import('@/app/api/funnel/route')

function beacon(body: Record<string, unknown>, origin = 'https://blackwateraquatics.ca') {
  return POST(
    new Request('https://spawnos.ca/api/funnel', {
      method: 'POST',
      headers: { origin, 'content-type': 'text/plain', 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' },
      body: JSON.stringify(body),
    }) as never,
  )
}

describe('funnel ledger attribution (existing behaviour preserved)', () => {
  beforeEach(() => {
    inserted.length = 0
  })

  it('stores the original fields exactly as before, plus validated campaign context', async () => {
    const res = await beacon({
      event: 'spawnos_appstore_click',
      site: 'blackwater',
      page_path: '/pages/how-to-raise-betta-fry',
      page_type: 'page',
      placement: 'fry_timeline_ctx',
      is_test: false,
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'spawnos_betta',
      click_id_type: 'gclid',
      click_id: 'Cj0KCQjw_abc-123',
      app_store_ct: 'bw_gads_fry',
    })
    expect(res.status).toBe(204)
    expect(inserted[0]).toMatchObject({
      event: 'spawnos_appstore_click',
      site: 'blackwater',
      placement: 'fry_timeline_ctx',
      device: 'mobile',
      from_blackwater: false,
      is_test: false,
      utm_source: 'google',
      click_id_type: 'gclid',
      click_id: 'Cj0KCQjw_abc-123',
      app_store_ct: 'bw_gads_fry',
    })
    // No IP, user agent or identifier is ever stored.
    expect(Object.keys(inserted[0])).not.toContain('ip')
    expect(Object.keys(inserted[0])).not.toContain('user_agent')
  })

  it('keeps QA traffic flagged so reporting can exclude it', async () => {
    await beacon({ event: 'spawnos_impression', site: 'blackwater', is_test: true })
    expect(inserted[0].is_test).toBe(true)
  })

  it('drops malformed click ids, placements and campaign tokens instead of storing them', async () => {
    await beacon({
      event: 'spawnos_app_store_click',
      site: 'spawnos',
      click_id_type: 'gclid',
      click_id: '<script>alert(1)</script>',
      ref_placement: 'Fry Timeline',
      app_store_ct: 'x'.repeat(40),
    }, 'https://spawnos.ca')
    expect(inserted[0]).toMatchObject({ click_id_type: null, click_id: null, ref_placement: null, app_store_ct: null })
  })

  it('still rejects unknown origins and events silently', async () => {
    await beacon({ event: 'spawnos_impression', site: 'blackwater' }, 'https://evil.example')
    await beacon({ event: 'purchase', site: 'blackwater' })
    expect(inserted).toHaveLength(0)
  })
})

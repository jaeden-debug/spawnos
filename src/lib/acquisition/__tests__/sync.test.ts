import { describe, expect, it } from 'vitest'
import { runAppStoreSync, sendTestEmails, type SyncDeps } from '../sync'
import { APP, FakeApple, FakeMailer, fakeClient, MemoryStore, standardTsv, detailedTsv } from './helpers'

const NOW = new Date('2026-09-19T15:00:00Z')

function setup(opts: { withClient?: boolean } = {}) {
  const apple = new FakeApple()
  const store = new MemoryStore()
  const mailer = new FakeMailer()
  const deps = (): SyncDeps => ({
    appId: APP,
    client: opts.withClient === false ? null : fakeClient(apple),
    store,
    mailer,
    recipient: 'alerts@spawnos.ca',
    sender: 'SpawnOS Reports <reports@spawnos.app>',
    trigger: 'cron',
    now: () => NOW,
    log: () => undefined,
  })
  return { apple, store, mailer, deps }
}

/** Apple instance processed 2026-09-19 carrying the (complete) 2026-09-17 day. */
function positiveDay(apple: FakeApple) {
  const ongoing = apple.addRequest('ONGOING')
  apple.addInstance(ongoing, 'standard', '2026-09-19', standardTsv([
    { date: '2026-09-17', territory: 'CA', source: 'Web referrer', counts: 2 },
    { date: '2026-09-17', territory: 'US', source: 'App Store search', counts: 1 },
    { date: '2026-09-17', type: 'Redownload', territory: 'CA', counts: 1 },
  ]))
  apple.addInstance(ongoing, 'detailed', '2026-09-19', detailedTsv([
    { date: '2026-09-17', campaign: 'bw_org_fry', sourceInfo: 'blackwateraquatics.ca', counts: 5 },
  ]))
  return ongoing
}

describe('App Store sync', () => {
  it('does nothing (and sends nothing) when Apple credentials are missing', async () => {
    const { deps, mailer, store } = setup({ withClient: false })
    const res = await runAppStoreSync(deps())
    expect(res.status).toBe('not_configured')
    expect(mailer.sent).toHaveLength(0)
    expect(store.state.size).toBe(0)
  })

  it('imports a positive day and emails with Apple date wording, territories and campaigns', async () => {
    const { apple, deps, mailer, store } = setup()
    positiveDay(apple)
    store.funnel.push(
      { day: '2026-09-17', site: 'blackwater', event: 'spawnos_impression' },
      { day: '2026-09-17', site: 'blackwater', event: 'spawnos_cta_click' },
      { day: '2026-09-17', site: 'spawnos', event: 'spawnos_app_store_click', from_blackwater: true, app_store_ct: 'spawnos_via_bw' },
      { day: '2026-09-17', site: 'spawnos', event: 'spawnos_app_store_click', is_test: true },
    )
    const res = await runAppStoreSync(deps())

    expect(res.status).toBe('success')
    expect(res.segmentsImported).toBe(2)
    expect(res.latestCompleteReportDate).toBe('2026-09-17')
    expect(res.email).toBe('sent')
    expect(res.announcedDates).toEqual(['2026-09-17'])
    expect(mailer.sent).toHaveLength(1)

    const email = mailer.sent[0]
    expect(email.to).toBe('alerts@spawnos.ca')
    expect(email.subject).toBe('SpawnOS — Apple reported 3 first-time downloads for Sep 17, 2026')
    expect(email.text).toContain('First-time downloads: 3')
    expect(email.text).toContain('Redownloads: 1')
    expect(email.text).toContain('September 17, 2026')
    expect(email.text).toContain('Canada: 2')
    expect(email.text).toContain('United States: 1')
    expect(email.text).toContain('bw_org_fry: 5')
    expect(email.text).toContain('Blackwater SpawnOS CTA impressions: 1')
    // Test traffic is excluded from the funnel.
    expect(email.text).toContain('spawnos.ca → App Store clicks: 1 (1 from Blackwater visits)')
    expect(email.text).toContain('VIEW APP STORE ANALYTICS')
    expect(email.text).not.toMatch(/see who downloaded/i)
    expect(email.subject).not.toMatch(/today/i)
    expect(email.idempotencyKey).toBe(`acquisition:${APP}:2026-09-17`)
  })

  it('is idempotent: a second run skips stored segments and never re-emails', async () => {
    const { apple, deps, mailer, store } = setup()
    positiveDay(apple)
    await runAppStoreSync(deps())
    const factsAfterFirst = JSON.stringify(store.facts)
    const res = await runAppStoreSync(deps())
    expect(res.segmentsImported).toBe(0)
    expect(res.segmentsSkipped).toBe(2)
    expect(res.email).toBe('already_announced')
    expect(mailer.sent).toHaveLength(1)
    expect(JSON.stringify(store.facts)).toBe(factsAfterFirst)
  })

  it('skips cleanly when another run holds the lease (cron invoked twice concurrently)', async () => {
    const { apple, deps, store, mailer } = setup()
    positiveDay(apple)
    store.lockOwner = 'other-run'
    const res = await runAppStoreSync(deps())
    expect(res.status).toBe('skipped_locked')
    expect(mailer.sent).toHaveLength(0)
    expect(store.facts).toHaveLength(0)
  })

  it('sends nothing for a zero-download day', async () => {
    const { apple, deps, mailer } = setup()
    const ongoing = apple.addRequest('ONGOING')
    apple.addInstance(ongoing, 'standard', '2026-09-19', standardTsv([]))
    apple.addInstance(ongoing, 'detailed', '2026-09-19', detailedTsv([]))
    const res = await runAppStoreSync(deps())
    expect(res.status).toBe('success')
    expect(res.email).toBe('no_new_first_time_downloads')
    expect(mailer.sent).toHaveLength(0)
  })

  it('does not email a redownload-only day (not new installs)', async () => {
    const { apple, deps, mailer } = setup()
    const ongoing = apple.addRequest('ONGOING')
    apple.addInstance(ongoing, 'standard', '2026-09-19', standardTsv([{ date: '2026-09-17', type: 'Redownload', counts: 2 }]))
    const res = await runAppStoreSync(deps())
    expect(res.email).toBe('no_new_first_time_downloads')
    expect(mailer.sent).toHaveLength(0)
  })

  it('waits for Apple completeness: a date newer than the 2-day window is imported but not announced', async () => {
    const { apple, deps, mailer, store } = setup()
    const ongoing = apple.addRequest('ONGOING')
    apple.addInstance(ongoing, 'standard', '2026-09-19', standardTsv([{ date: '2026-09-18', counts: 4 }]))
    const res = await runAppStoreSync(deps())
    expect(store.facts).toHaveLength(1)
    expect(res.latestCompleteReportDate).toBe('2026-09-17')
    expect(res.email).toBe('no_new_first_time_downloads')
    expect(mailer.sent).toHaveLength(0)
  })

  it('replaces (never sums) a date when Apple republishes it in a newer instance', async () => {
    const { apple, deps, store } = setup()
    const ongoing = apple.addRequest('ONGOING')
    apple.addInstance(ongoing, 'standard', '2026-09-18', standardTsv([{ date: '2026-09-16', counts: 2 }]))
    apple.addInstance(ongoing, 'standard', '2026-09-19', standardTsv([{ date: '2026-09-16', counts: 3 }]))
    await runAppStoreSync(deps())
    const daily = await store.getDailyDownloads(APP, '2026-09-16', '2026-09-16')
    expect(daily[0].first_time_downloads).toBe(3)
  })

  it('never lets an older instance overwrite newer data, even if imported later', async () => {
    const { apple, deps, store } = setup()
    const ongoing = apple.addRequest('ONGOING')
    apple.addInstance(ongoing, 'standard', '2026-09-19', standardTsv([{ date: '2026-09-16', counts: 3 }]))
    await runAppStoreSync(deps())
    apple.addInstance(ongoing, 'standard', '2026-09-17', standardTsv([{ date: '2026-09-16', counts: 9 }]))
    await runAppStoreSync(deps())
    const daily = await store.getDailyDownloads(APP, '2026-09-16', '2026-09-16')
    expect(daily[0].first_time_downloads).toBe(3)
  })

  it('re-imports a segment whose checksum changed without double counting', async () => {
    const { apple, deps, store } = setup()
    const ongoing = apple.addRequest('ONGOING')
    apple.addInstance(ongoing, 'standard', '2026-09-19', standardTsv([{ date: '2026-09-17', counts: 1 }]), { segmentId: 'seg-fixed' })
    await runAppStoreSync(deps())
    ongoing.reports[0].instances = []
    apple.addInstance(ongoing, 'standard', '2026-09-19', standardTsv([{ date: '2026-09-17', counts: 2 }]), { segmentId: 'seg-fixed' })
    const res = await runAppStoreSync(deps())
    expect(res.segmentsImported).toBe(1)
    expect((await store.getDailyDownloads(APP, '2026-09-17', '2026-09-17'))[0].first_time_downloads).toBe(2)
  })

  it('treats a missing report as "not yet" — no failure, no email', async () => {
    const { apple, deps, mailer, store } = setup()
    apple.addRequest('ONGOING')
    const res = await runAppStoreSync(deps())
    expect(res.status).toBe('success')
    expect(res.email).toBe('no_complete_report_yet')
    expect(store.state.get(APP)?.consecutive_failures).toBe(0)
    expect(mailer.sent).toHaveLength(0)
  })

  it('backfills history from the one-time snapshot and only announces recent dates', async () => {
    const { apple, deps, mailer, store } = setup()
    const snapshot = apple.addRequest('ONE_TIME_SNAPSHOT')
    const history = []
    for (let d = 1; d <= 17; d++) history.push({ date: `2026-09-${String(d).padStart(2, '0')}`, counts: 1 })
    apple.addInstance(snapshot, 'standard', '2026-09-19', standardTsv(history))
    apple.addRequest('ONGOING')
    const res = await runAppStoreSync(deps())
    expect(res.datesApplied).toHaveLength(17)
    expect((await store.getDailyDownloads(APP, '2026-09-01', '2026-09-30')).length).toBe(17)
    expect(res.announcedDates).toEqual(['2026-09-11', '2026-09-12', '2026-09-13', '2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17'])
    expect(mailer.sent).toHaveLength(1)
    expect(mailer.sent[0].subject).toBe('SpawnOS — Apple reported 7 first-time downloads for Sep 11–17, 2026')
  })

  it('lets the ongoing report win over the snapshot for the same processing date', async () => {
    const { apple, deps, store } = setup()
    const snapshot = apple.addRequest('ONE_TIME_SNAPSHOT')
    apple.addInstance(snapshot, 'standard', '2026-09-19', standardTsv([{ date: '2026-09-17', counts: 2 }]))
    const ongoing = apple.addRequest('ONGOING')
    apple.addInstance(ongoing, 'standard', '2026-09-19', standardTsv([{ date: '2026-09-17', counts: 3 }]))
    await runAppStoreSync(deps())
    expect((await store.getDailyDownloads(APP, '2026-09-17', '2026-09-17'))[0].first_time_downloads).toBe(3)
  })

  it('handles an Apple outage: fails the run, alerts only on repeated failure, then rate-limits', async () => {
    const { apple, deps, mailer, store } = setup()
    apple.failStatus = 503
    const first = await runAppStoreSync(deps())
    expect(first.status).toBe('failed')
    expect(first.errorCode).toBe('unavailable')
    expect(mailer.sent).toHaveLength(0)

    const second = await runAppStoreSync(deps())
    expect(second.email).toBe('failure_alert_sent')
    expect(mailer.sent).toHaveLength(1)
    expect(mailer.sent[0].subject).toBe('SpawnOS App Store Reporting Failed')
    expect(mailer.sent[0].text).toContain('does NOT mean zero downloads')

    const third = await runAppStoreSync(deps())
    expect(third.email).toBe('failure_alert_suppressed')
    expect(mailer.sent).toHaveLength(1)
    expect(store.state.get(APP)?.consecutive_failures).toBe(3)
  })

  it('classifies expired or invalid credentials as an auth failure', async () => {
    const { apple, deps, mailer } = setup()
    apple.failStatus = 401
    await runAppStoreSync(deps())
    const res = await runAppStoreSync(deps())
    expect(res.errorCode).toBe('auth')
    expect(mailer.sent[0].text).toContain('authentication failed')
  })

  it('recovers after a failure and resets the failure counter', async () => {
    const { apple, deps, store } = setup()
    positiveDay(apple)
    apple.failStatus = 503
    await runAppStoreSync(deps())
    apple.failStatus = null
    const res = await runAppStoreSync(deps())
    expect(res.status).toBe('success')
    expect(store.state.get(APP)?.consecutive_failures).toBe(0)
  })

  it('marks a checksum mismatch as a failed segment and retries it on the next run', async () => {
    const { apple, deps, store } = setup()
    const ongoing = apple.addRequest('ONGOING')
    const inst = apple.addInstance(ongoing, 'standard', '2026-09-19', standardTsv([{ date: '2026-09-17', counts: 1 }]), { checksum: '0'.repeat(32) })
    const first = await runAppStoreSync(deps())
    expect(first.status).toBe('partial')
    expect(first.segmentsFailed).toBe(1)
    expect(store.facts).toHaveLength(0)
    delete inst.segments[0].checksum
    const second = await runAppStoreSync(deps())
    expect(second.segmentsImported).toBe(1)
    expect(store.facts).toHaveLength(1)
  })

  it('records an incomplete (unparseable) report as partial without importing it', async () => {
    const { apple, deps, store } = setup()
    const ongoing = apple.addRequest('ONGOING')
    apple.addInstance(ongoing, 'standard', '2026-09-19', 'Date\tTerritory\n2026-09-17\tCA\n')
    const res = await runAppStoreSync(deps())
    expect(res.status).toBe('partial')
    expect(res.errorCode).toBe('incomplete_report')
    expect(store.facts).toHaveLength(0)
  })

  it('releases the email claim when the provider fails, then delivers exactly once', async () => {
    const { apple, deps, mailer } = setup()
    positiveDay(apple)
    mailer.failNext = 1
    const first = await runAppStoreSync(deps())
    expect(first.email).toBe('send_failed')
    expect(mailer.sent).toHaveLength(0)
    const second = await runAppStoreSync(deps())
    expect(second.email).toBe('sent')
    const third = await runAppStoreSync(deps())
    expect(third.email).toBe('already_announced')
    expect(mailer.sent).toHaveLength(1)
  })

  it('flags a stopped ongoing request but still imports snapshot data', async () => {
    const { apple, deps, store } = setup()
    const snapshot = apple.addRequest('ONE_TIME_SNAPSHOT')
    apple.addInstance(snapshot, 'standard', '2026-09-19', standardTsv([{ date: '2026-09-17', counts: 1 }]))
    apple.addRequest('ONGOING', { stopped: true })
    const res = await runAppStoreSync(deps())
    expect(res.status).toBe('partial')
    expect(res.errorCode).toBe('request_stopped')
    expect(store.facts).toHaveLength(1)
  })

  it('flags a stale feed when Apple stops publishing new instances', async () => {
    const { apple, deps } = setup()
    const ongoing = apple.addRequest('ONGOING')
    apple.addInstance(ongoing, 'standard', '2026-09-10', standardTsv([{ date: '2026-09-08', counts: 1 }]))
    const res = await runAppStoreSync(deps())
    expect(res.status).toBe('partial')
    expect(res.errorCode).toBe('report_stale')
  })

  it('sends only clearly prefixed TEST emails from the test hook', async () => {
    const { deps, mailer, store } = setup()
    const results = await sendTestEmails(deps(), ['acquisition', 'failure'])
    expect(results.every((r) => r.ok)).toBe(true)
    expect(mailer.sent.map((m) => m.subject.startsWith('TEST — '))).toEqual([true, true])
    expect(store.facts).toHaveLength(0)
  })
})

import { NextRequest, NextResponse } from 'next/server'
import { isCronAuthorized } from '@/lib/acquisition/cron-auth'
import { createSyncDeps } from '@/lib/acquisition/server'
import { runAppStoreSync, sendTestEmails } from '@/lib/acquisition/sync'
import type { SyncTrigger } from '@/lib/acquisition/types'

/**
 * Daily App Store acquisition sync (Vercel Cron → GET, manual → POST).
 *
 * Protected by CRON_SECRET: Vercel Cron sends `Authorization: Bearer
 * <CRON_SECRET>` automatically when that env var exists. Without the secret
 * configured, the endpoint refuses every call.
 *
 * Idempotent and overlap-safe (run lease + per-segment ledger + per-date email
 * claims), so a double invocation cannot double-count or double-email.
 *
 * Query options (all require the secret):
 *   ?trigger=manual|backfill   label the run (default: cron)
 *   ?test_email=acquisition|failure|both
 *        send clearly "TEST —"-prefixed sample emails to the report inbox and
 *        do NOT run the sync. Never touches report data.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function handle(request: NextRequest) {
  if (!isCronAuthorized(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const params = request.nextUrl.searchParams
  const testEmail = params.get('test_email')
  const triggerParam = params.get('trigger')
  const trigger: SyncTrigger = triggerParam === 'manual' || triggerParam === 'backfill' ? triggerParam : 'cron'

  try {
    const deps = createSyncDeps(testEmail ? 'test' : trigger)

    if (testEmail) {
      const kinds: Array<'acquisition' | 'failure'> =
        testEmail === 'both' ? ['acquisition', 'failure'] : testEmail === 'failure' ? ['failure'] : ['acquisition']
      const results = await sendTestEmails(deps, kinds)
      return NextResponse.json({ test_email: results, recipient: deps.recipient })
    }

    const result = await runAppStoreSync(deps)
    // The run itself is recorded in app_store_sync_runs; the response carries
    // only operational counters (no report data beyond dates).
    const httpStatus = result.status === 'failed' ? 502 : 200
    return NextResponse.json(
      {
        run_id: result.runId,
        status: result.status,
        segments: {
          seen: result.segmentsSeen,
          imported: result.segmentsImported,
          skipped: result.segmentsSkipped,
          failed: result.segmentsFailed,
        },
        rows_imported: result.rowsImported,
        dates_applied: result.datesApplied,
        latest_available_processing_date: result.latestAvailableProcessingDate,
        latest_complete_report_date: result.latestCompleteReportDate,
        email: result.email,
        announced_dates: result.announcedDates,
        error_code: result.errorCode ?? null,
        error: result.error ?? null,
        warnings: result.warnings,
      },
      { status: httpStatus },
    )
  } catch (err) {
    console.error('[app-store-sync] unhandled', err)
    return NextResponse.json({ status: 'failed', error: (err as Error).message.slice(0, 300) }, { status: 500 })
  }
}

export const GET = handle
export const POST = handle

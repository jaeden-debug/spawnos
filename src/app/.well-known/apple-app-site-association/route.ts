/**
 * Apple App Site Association — served from spawnos.app for iOS Universal Links.
 *
 * Served by a route handler (not /public) so we control the exact status,
 * content type and body: Apple requires HTTP 200, no redirect, no .json
 * extension, and valid JSON.
 *
 * Team ID 632569QA3T is the SpawnOS Apple Developer team; the bundle id
 * matches the App Store Connect record for the native app.
 *
 * Only paths the native app genuinely handles are listed. Everything else on
 * spawnos.app (marketing redirects, API routes) must keep working in the
 * browser, so it is explicitly excluded.
 */
export const dynamic = 'force-static'

const APP_ID = '632569QA3T.com.blackwateraquatics.spawnos'

const AASA = {
  applinks: {
    details: [
      {
        appIDs: [APP_ID],
        components: [
          { '/': '/auth/*', comment: 'Supabase auth callbacks (magic link, recovery)' },
          { '/': '/open/*', comment: 'Deep links into a spawn, animal or pair' },
        ],
      },
    ],
  },
  // Declared so a future Handoff/Shared Web Credentials use does not require
  // re-publishing this file; harmless when unused.
  webcredentials: { apps: [APP_ID] },
}

export function GET() {
  return new Response(JSON.stringify(AASA), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=3600',
    },
  })
}

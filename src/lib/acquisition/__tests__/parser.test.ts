import { describe, expect, it } from 'vitest'
import { decompress, parseDownloadsReport, ReportParseError, splitDelimited } from '../parser'
import { APP, detailedTsv, gz, standardTsv } from './helpers'

describe('App Downloads report parser', () => {
  it('parses a gzipped tab-delimited Standard report by header name', () => {
    const parsed = parseDownloadsReport(
      gz(standardTsv([
        { date: '2026-09-17', territory: 'CA', counts: 2 },
        { date: '2026-09-17', territory: 'US', counts: 1 },
        { date: '2026-09-17', type: 'Redownload', territory: 'CA', counts: 1 },
      ])),
      { appId: APP },
    )
    expect(parsed.dates).toEqual(['2026-09-17'])
    expect(parsed.rows).toHaveLength(3)
    const ca = parsed.rows.find((r) => r.territory === 'CA' && r.download_type === 'first-time download')
    expect(ca?.counts).toBe(2)
    expect(parsed.rows.every((r) => r.campaign === '')).toBe(true)
  })

  it('reads Detailed-only columns (Source Info, Campaign)', () => {
    const parsed = parseDownloadsReport(
      gz(detailedTsv([{ date: '2026-09-17', campaign: 'bw_org_fry', sourceInfo: 'blackwateraquatics.ca', counts: 5 }])),
    )
    expect(parsed.rows[0]).toMatchObject({ campaign: 'bw_org_fry', source_info: 'blackwateraquatics.ca', source_type: 'Web referrer', counts: 5 })
  })

  it('does not depend on column order or header case', () => {
    const text = 'counts\tterritory\tDOWNLOAD TYPE\tdate\n4\tGB\tfirst-time download\t2026-09-10\n'
    const parsed = parseDownloadsReport(text)
    expect(parsed.rows[0]).toMatchObject({ report_date: '2026-09-10', territory: 'GB', counts: 4 })
  })

  it('accepts comma-delimited files with quoted fields', () => {
    const text = 'Date,Download Type,Page Title,Counts\n2026-09-11,Redownload,"Fry, Timeline ""A""",3\n'
    const parsed = parseDownloadsReport(text)
    expect(parsed.rows[0]).toMatchObject({ page_title: 'Fry, Timeline "A"', download_type: 'redownload', counts: 3 })
  })

  it('aggregates rows with identical dimensions so a file cannot yield duplicate facts', () => {
    const parsed = parseDownloadsReport(standardTsv([
      { date: '2026-09-12', counts: 1 },
      { date: '2026-09-12', counts: 2 },
    ]))
    expect(parsed.rows).toHaveLength(1)
    expect(parsed.rows[0].counts).toBe(3)
  })

  it('normalizes US-style and compact dates', () => {
    expect(parseDownloadsReport('Date\tDownload Type\tCounts\n09/05/2026\tRestore\t1\n').rows[0].report_date).toBe('2026-09-05')
    expect(parseDownloadsReport('Date\tDownload Type\tCounts\n20260906\tRestore\t1\n').rows[0].report_date).toBe('2026-09-06')
  })

  it('skips rows for other apps when an app id is given', () => {
    const text = 'Date\tApp Apple Identifier\tDownload Type\tCounts\n2026-09-12\t999\tFirst-time download\t7\n2026-09-12\t' + APP + '\tFirst-time download\t1\n'
    expect(parseDownloadsReport(text, { appId: APP }).rows.map((r) => r.counts)).toEqual([1])
  })

  it('returns no rows for an empty file (a zero-download day is not an error)', () => {
    expect(parseDownloadsReport('').rows).toEqual([])
    expect(parseDownloadsReport('Date\tDownload Type\tCounts\n').rows).toEqual([])
  })

  it('rejects an incomplete report missing required columns', () => {
    expect(() => parseDownloadsReport('Date\tTerritory\n2026-09-12\tCA\n')).toThrow(ReportParseError)
  })

  it('rejects corrupt counts and dates instead of importing garbage', () => {
    expect(() => parseDownloadsReport('Date\tDownload Type\tCounts\n2026-09-12\tRedownload\tabc\n')).toThrow(ReportParseError)
    expect(() => parseDownloadsReport('Date\tDownload Type\tCounts\nyesterday\tRedownload\t1\n')).toThrow(ReportParseError)
  })

  it('rejects a truncated gzip stream', () => {
    const full = gz(standardTsv([{ date: '2026-09-12', counts: 1 }]))
    expect(() => decompress(full.subarray(0, full.length - 8))).toThrow(ReportParseError)
  })

  it('splits CRLF files and ignores blank lines', () => {
    expect(splitDelimited('a\tb\r\n\r\n1\t2\r\n', '\t')).toEqual([['a', 'b'], ['1', '2']])
  })
})

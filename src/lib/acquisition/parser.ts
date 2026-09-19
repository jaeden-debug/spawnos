import crypto from 'node:crypto'
import zlib from 'node:zlib'
import { AscError } from './asc-client'
import type { DownloadRow } from './types'

/**
 * Parser for Apple's "App Downloads" analytics report files.
 *
 * Apple documents the file as gzip-compressed, tab-delimited text with a
 * header row, and warns that column ORDER can change — so columns are always
 * resolved by header name, case-insensitively. A comma-delimited file is
 * accepted too (the API reference calls segments "CSV").
 *
 * Columns (Apple, "App Store Downloads"):
 *   Standard + Detailed: Date, App Name, App Apple Identifier, Download Type,
 *     App Version, Device, Platform Version, Source Type, Page Type, Pre-Order,
 *     Territory, Counts
 *   Detailed only: Source Info, Campaign, Page Title
 *
 * Output rows are aggregated by their full dimension set, so a file can never
 * produce two rows the database would treat as the same fact.
 */

export class ReportParseError extends AscError {
  constructor(message: string) {
    super(message, 'incomplete_report')
    this.name = 'ReportParseError'
  }
}

const COLUMN_ALIASES: Record<keyof Omit<DownloadRow, 'counts'> | 'counts' | 'app_apple_identifier', string[]> = {
  report_date: ['date'],
  download_type: ['download type'],
  source_type: ['source type'],
  source_info: ['source info'],
  campaign: ['campaign'],
  page_type: ['page type'],
  page_title: ['page title'],
  territory: ['territory'],
  device: ['device'],
  platform_version: ['platform version'],
  app_version: ['app version'],
  pre_order: ['pre-order', 'pre order', 'preorder'],
  counts: ['counts', 'count'],
  app_apple_identifier: ['app apple identifier', 'apple identifier'],
}

const REQUIRED: Array<keyof typeof COLUMN_ALIASES> = ['report_date', 'download_type', 'counts']

export function md5Hex(buf: Buffer): string {
  return crypto.createHash('md5').update(buf).digest('hex')
}

export function decompress(buf: Buffer): string {
  const isGzip = buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b
  let text: string
  try {
    text = isGzip ? zlib.gunzipSync(buf).toString('utf8') : buf.toString('utf8')
  } catch (err) {
    throw new ReportParseError(`Report segment could not be decompressed: ${(err as Error).message}`)
  }
  return text.replace(/^﻿/, '')
}

/** RFC 4180-style splitter that works for tab or comma delimiters. */
export function splitDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
      continue
    }
    if (ch === '"' && field === '') {
      inQuotes = true
    } else if (ch === delimiter) {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += ch
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}

const normHeader = (h: string) => h.trim().toLowerCase().replace(/[_\s]+/g, ' ')

export function normalizeDate(raw: string): string {
  const v = raw.trim()
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v)
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`
  m = /^(\d{4})(\d{2})(\d{2})$/.exec(v)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  throw new ReportParseError(`Unrecognised report date "${v.slice(0, 20)}"`)
}

export interface ParsedDownloads {
  rows: DownloadRow[]
  sourceRowCount: number
  dates: string[]
}

export function parseDownloadsReport(input: Buffer | string, opts: { appId?: string } = {}): ParsedDownloads {
  const text = typeof input === 'string' ? input : decompress(input)
  const firstLine = text.split(/\r?\n/, 1)[0] ?? ''
  const delimiter = firstLine.includes('\t') ? '\t' : ','
  const table = splitDelimited(text, delimiter)
  if (table.length === 0) return { rows: [], sourceRowCount: 0, dates: [] }

  const header = table[0].map(normHeader)
  const index = {} as Record<keyof typeof COLUMN_ALIASES, number>
  for (const key of Object.keys(COLUMN_ALIASES) as Array<keyof typeof COLUMN_ALIASES>) {
    index[key] = header.findIndex((h) => COLUMN_ALIASES[key].includes(h))
  }
  const missing = REQUIRED.filter((k) => index[k] < 0)
  if (missing.length) {
    throw new ReportParseError(`Report is missing required column(s): ${missing.join(', ')}`)
  }

  const cell = (row: string[], key: keyof typeof COLUMN_ALIASES) =>
    index[key] >= 0 ? (row[index[key]] ?? '').trim() : ''

  const merged = new Map<string, DownloadRow>()
  let sourceRowCount = 0
  for (const raw of table.slice(1)) {
    sourceRowCount++
    if (opts.appId) {
      const rowApp = cell(raw, 'app_apple_identifier')
      if (rowApp && rowApp !== opts.appId) continue
    }
    const countsRaw = cell(raw, 'counts').replace(/,/g, '')
    if (!/^\d+(\.0+)?$/.test(countsRaw)) {
      throw new ReportParseError(`Invalid Counts value "${countsRaw.slice(0, 20)}"`)
    }
    const row: DownloadRow = {
      report_date: normalizeDate(cell(raw, 'report_date')),
      download_type: cell(raw, 'download_type').toLowerCase(),
      source_type: cell(raw, 'source_type'),
      source_info: cell(raw, 'source_info'),
      campaign: cell(raw, 'campaign'),
      page_type: cell(raw, 'page_type'),
      page_title: cell(raw, 'page_title'),
      territory: cell(raw, 'territory'),
      device: cell(raw, 'device'),
      platform_version: cell(raw, 'platform_version'),
      app_version: cell(raw, 'app_version'),
      pre_order: cell(raw, 'pre_order'),
      counts: Math.round(Number(countsRaw)),
    }
    if (!row.download_type) throw new ReportParseError('Row without a Download Type')
    const key = [
      row.report_date, row.download_type, row.source_type, row.source_info, row.campaign,
      row.page_type, row.page_title, row.territory, row.device, row.platform_version,
      row.app_version, row.pre_order,
    ].join('')
    const existing = merged.get(key)
    if (existing) existing.counts += row.counts
    else merged.set(key, row)
  }

  const rows = [...merged.values()]
  const dates = [...new Set(rows.map((r) => r.report_date))].sort()
  return { rows, sourceRowCount, dates }
}

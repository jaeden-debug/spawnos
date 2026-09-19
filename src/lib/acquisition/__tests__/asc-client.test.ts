import crypto from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { AscClient, AscError, signAscJwt } from '../asc-client'
import { ascCredentialsFromEnv, normalizePrivateKey } from '../config'
import { listReportRequests, pickDownloadReports } from '../reports'
import { FakeApple, fakeClient, testKeyPem } from './helpers'

describe('App Store Connect authentication', () => {
  it('signs an ES256 JWT Apple can verify, within the 20-minute ceiling', () => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' })
    const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()
    const token = signAscJwt({ issuerId: 'iss-1', keyId: 'KID1234567', privateKey: pem }, 1_800_000_000)
    const [h, p, s] = token.split('.')
    const header = JSON.parse(Buffer.from(h, 'base64url').toString())
    const payload = JSON.parse(Buffer.from(p, 'base64url').toString())
    expect(header).toEqual({ alg: 'ES256', kid: 'KID1234567', typ: 'JWT' })
    expect(payload.iss).toBe('iss-1')
    expect(payload.aud).toBe('appstoreconnect-v1')
    expect(payload.exp - payload.iat).toBeLessThanOrEqual(20 * 60)
    const ok = crypto.verify('sha256', Buffer.from(`${h}.${p}`), { key: publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(s, 'base64url'))
    expect(ok).toBe(true)
  })

  it('refuses token lifetimes Apple would reject', () => {
    expect(() => signAscJwt({ issuerId: 'i', keyId: 'k', privateKey: testKeyPem() }, 0, 21 * 60)).toThrow()
  })

  it('accepts the private key as PEM, escaped PEM or base64 PEM, and reports missing credentials as null', () => {
    const pem = testKeyPem()
    expect(normalizePrivateKey(pem)).toContain('BEGIN PRIVATE KEY')
    expect(normalizePrivateKey(pem.replace(/\n/g, '\\n'))).toBe(pem.trim())
    expect(normalizePrivateKey(Buffer.from(pem).toString('base64'))).toBe(pem.trim())
    expect(ascCredentialsFromEnv({} as NodeJS.ProcessEnv)).toBeNull()
    expect(
      ascCredentialsFromEnv({ APP_STORE_CONNECT_ISSUER_ID: 'a', APP_STORE_CONNECT_KEY_ID: 'b', APP_STORE_CONNECT_PRIVATE_KEY: pem } as unknown as NodeJS.ProcessEnv),
    ).not.toBeNull()
  })

  it('treats 401 as an auth failure without retrying', async () => {
    const apple = new FakeApple()
    apple.failStatus = 401
    const client = fakeClient(apple)
    await expect(listReportRequests(client, '1')).rejects.toMatchObject({ code: 'auth', status: 401 })
    expect(apple.calls).toHaveLength(1)
  })

  it('retries a transient Apple outage and then succeeds', async () => {
    const apple = new FakeApple()
    apple.addRequest('ONGOING')
    apple.failStatus = 503
    apple.failCount = 2
    const client = fakeClient(apple)
    const requests = await listReportRequests(client, '1')
    expect(requests).toHaveLength(1)
    expect(apple.calls).toHaveLength(3)
  })

  it('gives up after the retry budget on a persistent outage', async () => {
    const apple = new FakeApple()
    apple.failStatus = 503
    await expect(listReportRequests(fakeClient(apple), '1')).rejects.toBeInstanceOf(AscError)
    expect(apple.calls).toHaveLength(3)
  })

  it('follows JSON:API pagination', async () => {
    const pages: Record<string, unknown> = {
      'https://api.test/v1/x': { data: [{ id: '1', type: 't', attributes: {} }], links: { next: 'https://api.test/v1/x?cursor=2' } },
      'https://api.test/v1/x?cursor=2': { data: [{ id: '2', type: 't', attributes: {} }] },
    }
    const client = new AscClient(
      { issuerId: 'i', keyId: 'k', privateKey: testKeyPem() },
      { baseUrl: 'https://api.test', fetch: async (url) => new Response(JSON.stringify(pages[url])), sleep: async () => undefined },
    )
    const all = await client.getAll('/v1/x')
    expect(all.map((r) => r.id)).toEqual(['1', '2'])
  })

  it('downloads pre-signed segment URLs without sending our bearer token', async () => {
    const apple = new FakeApple()
    const req = apple.addRequest('ONGOING')
    apple.addInstance(req, 'standard', '2026-09-19', 'Date\tDownload Type\tCounts\n')
    const client = fakeClient(apple)
    const seg = req.reports[0].instances[0].segments[0]
    await client.download(`https://files.test/${seg.id}`)
    const call = apple.calls.find((c) => c.url.startsWith('https://files.test/'))
    expect(call?.auth).toBeNull()
  })
})

describe('report discovery', () => {
  it('picks the Standard and Detailed App Downloads reports and ignores look-alikes', () => {
    const picked = pickDownloadReports([
      { id: 'a', name: 'Streaming Downloads Performance', category: 'PERFORMANCE' },
      { id: 'b', name: 'App Downloads Detailed', category: 'COMMERCE' },
      { id: 'c', name: 'App Store Purchases Standard', category: 'COMMERCE' },
      { id: 'd', name: 'App Downloads Standard', category: 'COMMERCE' },
    ])
    expect(picked.standard?.id).toBe('d')
    expect(picked.detailed?.id).toBe('b')
  })
})

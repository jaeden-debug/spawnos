import type { MetadataRoute } from 'next'

const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://spawnos.ca').replace(/\/$/, '')

/**
 * AI answer engines are an explicit acquisition channel for SpawnOS, so the
 * assistant crawlers are named and allowed rather than left to the wildcard.
 * Naming them matters: some operators block these by default via a CDN rule or
 * a copied robots template, and a silent block is invisible until you notice
 * you are never cited.
 *
 * Two distinct jobs per vendor, and they are not the same crawler:
 *  - training crawlers (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended)
 *  - live answer/citation fetchers (OAI-SearchBot, ChatGPT-User, Claude-User,
 *    PerplexityBot, Perplexity-User)
 * Blocking the second kind is what removes you from cited answers.
 */
const AI_CRAWLERS = [
  'GPTBot',            // OpenAI training
  'OAI-SearchBot',     // ChatGPT search index
  'ChatGPT-User',      // ChatGPT live fetch on a user's behalf
  'ClaudeBot',         // Anthropic crawler
  'Claude-User',       // Claude live fetch
  'Claude-SearchBot',
  'PerplexityBot',     // Perplexity index
  'Perplexity-User',   // Perplexity live fetch
  'Google-Extended',   // Gemini / AI Overviews grounding
  'Applebot',          // Siri / Spotlight
  'Applebot-Extended',
  'CCBot',             // Common Crawl — feeds many models
  'meta-externalagent',
  'Bytespider',
  'cohere-ai',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Private/app surfaces and API routes should not be crawled or indexed.
        disallow: ['/dashboard', '/api/'],
      },
      {
        userAgent: AI_CRAWLERS,
        allow: '/',
        disallow: ['/dashboard', '/api/'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  }
}

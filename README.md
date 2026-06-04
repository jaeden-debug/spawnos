# SpawnOS — Aquarium Operating System

The science-grade aquarium tool hub by **Blackwater Aquatics Canada**.

Species database · Water parameter calculators · Fish compatibility checker · AI tank blueprint generator.

---

## What's Inside

| Route | Description |
|-------|-------------|
| `/` | Homepage |
| `/species` | Freshwater species database (10+ species) |
| `/species/[slug]` | Individual species care guide with full parameters and FAQ |
| `/tools` | Calculator hub |
| `/tools/water-parameters` | Species parameter reference table |
| `/tools/stocking-density` | Stocking calculator |
| `/tools/nitrogen-cycle` | Nitrogen cycle tracker |
| `/tools/fish-compatibility` | Compatibility checker |
| `/tools/tank-volume` | Tank volume calculator |
| `/tools/ph-buffer` | pH buffer dose calculator |
| `/tools/temperature-converter` | °F / °C converter with species reference |
| `/tools/feeding-calculator` | Daily feeding amount calculator |
| `/blueprints` | AI Tank Blueprint Generator (OpenAI) |
| `/knowledge` | Knowledge base bridge to Blackwater Aquatics Canada |
| `/about` | About SpawnOS |
| `/dashboard` | Breeder dashboard (Supabase auth required) |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (optional for public features)
# Add OPENAI_API_KEY for AI blueprint generation

# 3. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Public tools (/, /species, /tools, /blueprints, /knowledge, /about) work without any environment variables.**

The AI Blueprint Generator works without `OPENAI_API_KEY` — it returns a labeled mock blueprint for local development.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Optional* | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional* | Supabase anon key |
| `OPENAI_API_KEY` | Optional** | OpenAI API key |
| `NEXT_PUBLIC_SITE_URL` | Optional | Canonical URL for SEO (default: https://spawnos.app) |

*Required only for `/dashboard` features (breeder tools, fish library, etc.)  
**Required for real AI blueprints. Without it, a mock blueprint is returned.

---

## Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v3 + custom `spawn-*` design tokens
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **AI:** OpenAI GPT-4o mini (server-side only)
- **Deployment:** Vercel

---

## Docs

- [`docs/SETUP.md`](docs/SETUP.md) — Full setup guide including Supabase and Vercel deployment
- [`docs/OPENAI_SETUP.md`](docs/OPENAI_SETUP.md) — OpenAI API key setup and mock mode
- [`docs/SEO_STRATEGY.md`](docs/SEO_STRATEGY.md) — SEO keyword targets and schema markup
- [`docs/DATABASE.md`](docs/DATABASE.md) — Database schema reference
- [`docs/V1_FEATURES.md`](docs/V1_FEATURES.md) — Breeder dashboard feature reference

---

## Architecture

```
src/
├── app/
│   ├── page.tsx                    # Homepage
│   ├── species/                    # Species database
│   ├── tools/                      # Calculator pages
│   ├── blueprints/                 # AI blueprint generator
│   ├── knowledge/                  # Knowledge base bridge
│   ├── about/                      # About page
│   ├── api/blueprint/              # Server-side OpenAI route
│   ├── dashboard/                  # Breeder dashboard (auth-gated)
│   ├── login/ signup/              # Auth pages
│   └── layout.tsx globals.css      # Root layout + styles
├── components/
│   ├── layout/                     # SiteHeader, SiteFooter, ToolLayout, DashboardShell
│   ├── tools/                      # Interactive calculator components (client)
│   ├── blueprints/                 # BlueprintGenerator (client)
│   ├── auth/                       # LoginForm
│   └── ui/ fish/ pairs/ spawns/   # Dashboard UI components
├── data/
│   ├── species.ts                  # 10 species data objects
│   └── tools.ts                    # Tool metadata
├── lib/
│   ├── schema.ts                   # JSON-LD structured data helpers
│   ├── utils.ts                    # Utility functions
│   └── supabase/                   # Supabase client/server/middleware
├── types/
│   ├── species.ts                  # Species and parameter types
│   ├── blueprint.ts                # AI blueprint types
│   ├── database.ts                 # Supabase table types
│   └── genetics.ts                 # Genetics engine types
└── supabase/
    └── schema.sql                  # Plug-and-play database schema
```

---

## Blackwater Aquatics Canada

SpawnOS is a product of [Blackwater Aquatics Canada](https://blackwateraquatics.ca).

SpawnOS = precision tools.  
Blackwater = long-form knowledge.

Both are free. Use them together.

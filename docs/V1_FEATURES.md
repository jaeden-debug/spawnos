# SpawnOS V1 — Feature Reference

SpawnOS V1 is a complete, launch-ready betta and fish breeding management platform. Here's what works.

---

## Authentication

- Email/password signup with Supabase Auth
- Auto-profile creation on signup via database trigger
- Protected dashboard routes via middleware
- Redirect unauthenticated users to login
- Redirect authenticated users away from auth pages
- User menu with sign-out

---

## Fish Library (`/dashboard/fish`)

- Add fish with full trait profile (tail type, color, pattern, scale, finnage, body quality)
- Edit any fish profile in-modal
- Delete fish with confirmation
- Filter by sex, status, tail type, pattern type
- Search by name, strain, color
- Photo URL field (Supabase Storage structure ready)
- Auto-calculated rarity score on save
- Fish status: active, retired, sold, deceased

### Fish Profile (`/dashboard/fish/[id]`)

- Full trait display with badges
- Value potential calculation (tier: low / medium / high / elite)
- Genotype + breeder notes
- Pair history (all pairs this fish has been in)
- Lineage (parents and offspring from lineage records)
- Fish notes (health, growth, breeding, trait, general)
- Edit and delete from profile page

---

## Pair Builder (`/dashboard/pairs`)

- Create pairs by selecting male and female from active fish library
- Live Zylx.ai compatibility prediction during pair creation
- Predicted outcomes displayed before saving
- Pair name and breeding goal fields
- Pair statuses: planned, active, spawned, retired
- Filter pairs by status

### Pair Detail (`/dashboard/pairs/[id]`)

- Full Zylx.ai prediction panel
- Edit goal and notes inline
- Change pair status inline
- View connected spawns
- Delete pair with confirmation

---

## Genetics Engine (Zylx.ai)

Prediction outputs for any male × female combination:

- **Compatibility Score** (0–100): Health, color harmony, aggression, fertility
- **Predictability Score** (0–100): How consistent fry outcomes will be
- **Rare Trait Chance** (0–100): Based on pattern rarity and metallic genetics
- **High Value Potential** (0–100): Composite pattern + finnage + body score
- **Likely Outcomes**: Color, pattern, tail predictions
- **Rare Outcomes**: Specific rare trait possibilities
- **Warnings**: Health concerns, sex mismatches, low compatibility flags
- **Breeder Recommendation**: Summary verdict with context
- **Selection Tips**: When and how to select holdbacks
- **Cull Watch Notes**: What to watch for and cull
- **Holdback Advice**: How many to keep and what to prioritize

---

## Spawn Tracker (`/dashboard/spawns`)

- Create spawns linked to any saved pair
- Track: spawn date, hatch date, estimated eggs, estimated hatched, current fry count
- 7 stages: eggs, wrigglers, free-swimming, growout, jarring, juvenile, sold
- Auto-calculated survival rate
- Stage filter
- Spawn detail panel with survival calculator
- Add dated spawn log entries with:
  - Fry count (auto-updates spawn survival rate)
  - Water temperature
  - Feeding notes
  - Water change notes
  - Health notes
  - General notes
- View all log history per spawn

---

## Survival Calculator (embedded in Spawn Tracker)

- Hatch rate (hatched / eggs × 100)
- Survival rate (current fry / hatched × 100)
- Loss count
- Stage-specific guidance text
- Warnings triggered at:
  - Hatch rate < 30% (critical)
  - Hatch rate < 60% (below average)
  - Survival rate < 20% (critical loss)
  - Survival rate < 50% (below average)
  - Survival rate < 75% (moderate)

---

## Lineage Records (`/dashboard/lineage`)

- Add parent-child relationships between any fish
- Visualize parent and offspring connections per fish
- Inbreeding risk checker (detects parent-child, siblings, shared grandparents)
- View all lineage links with removal option
- Fish list with "linked" indicator

---

## Calculators (`/dashboard/calculators`)

Three calculator modes:

### Trait Prediction Calculator
Manual entry for both male and female fish. Enter all trait fields and run a full Zylx.ai prediction without needing saved fish.

### Match Calculator
Load from your fish library, select male and female, see live prediction output.

### Value Potential Calculator
Enter a single fish's traits and get:
- Value tier (low / medium / high / elite)
- Score out of 100
- Best selling traits
- Holdback priorities
- What to look for in fry
- Unstable traits to watch

---

## Dashboard Overview (`/dashboard`)

- Stats: active fish, active pairs, active spawns, average survival rate
- Best pair by compatibility score
- Recent spawn logs (5 most recent)
- Active spawns grid
- Fish needing updates (not updated in 14+ days)
- Quick actions: Add Fish, Create Pair, Log Spawn, Open Trait Calculator

---

## Design System

- Dark background (#080c0f)
- Cyan accent (#00d4ff) with glow effects
- Amber secondary accent (#f59e0b)
- Glassmorphism cards with backdrop blur
- Smooth hover transitions
- Mobile-first responsive layout
- Bottom navigation on mobile
- Sidebar navigation on desktop
- Custom scrollbar
- Cyan selection highlight

---

## What's Planned for V2

- Google OAuth integration
- Supabase Storage photo uploads (structure is ready)
- Batch photo management
- Spawn notes / pair notes sections
- Export as PDF (spawn reports, lineage reports)
- Breeder metrics dashboard (total spawns per year, best pairs)
- Offspring jarring tracker
- Trait inheritance Punnett square view
- Market pricing tools
- Multi-location tracking (tanks, grow-out vessels)

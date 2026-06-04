-- ============================================================
-- SpawnOS — CMS-Driven Species Database Schema
-- Version 2.0 — Production Ready
--
-- Instructions:
--   1. Create a Supabase project
--   2. Open SQL Editor
--   3. Paste this entire file and run
--   4. Add env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- trigram search
CREATE EXTENSION IF NOT EXISTS "unaccent";         -- accent-insensitive search

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE species_category AS ENUM (
  'freshwater',
  'saltwater',
  'shrimp',
  'amphibian',
  'turtle',
  'snail',
  'invertebrate',
  'live_food',
  'microfauna',
  'plant'
);

CREATE TYPE difficulty_level AS ENUM (
  'beginner',
  'intermediate',
  'advanced',
  'expert'
);

CREATE TYPE temperament_type AS ENUM (
  'peaceful',
  'semi-aggressive',
  'aggressive',
  'community',
  'species-only'
);

-- ============================================================
-- SPECIES TABLE
-- The core CMS record. Long-form content lives in MDX files.
-- Metadata, parameters, SEO, and care profile live here.
-- ============================================================

CREATE TABLE species (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identity
  slug                TEXT NOT NULL UNIQUE,           -- url-safe: "betta-fish"
  common_name         TEXT NOT NULL,                  -- "Betta Fish"
  scientific_name     TEXT NOT NULL,                  -- "Betta splendens"
  family              TEXT NOT NULL,                  -- "Osphronemidae"
  order_name          TEXT,                           -- "Anabantiformes"
  class_name          TEXT,                           -- "Actinopterygii"
  phylum              TEXT DEFAULT 'Chordata',
  kingdom             TEXT DEFAULT 'Animalia',

  -- Classification
  category            species_category NOT NULL,
  difficulty          difficulty_level NOT NULL,
  temperament         temperament_type NOT NULL,

  -- Quick stats (displayed in hero)
  lifespan_years_min  SMALLINT,
  lifespan_years_max  SMALLINT,
  adult_size_cm_min   NUMERIC(5,1),
  adult_size_cm_max   NUMERIC(5,1),
  min_tank_litres     SMALLINT,
  origin_regions      TEXT[],                         -- ["Southeast Asia", "Thailand"]
  origin_countries    TEXT[],                         -- ["Thailand", "Cambodia", "Vietnam"]

  -- Water parameters (ranges stored as JSONB for flexibility)
  -- Structure: { "min": 6.0, "max": 7.5, "ideal_min": 6.5, "ideal_max": 7.0, "unit": "pH" }
  param_temp          JSONB,   -- temperature °C
  param_ph            JSONB,
  param_gh            JSONB,   -- general hardness dGH
  param_kh            JSONB,   -- carbonate hardness dKH
  param_tds           JSONB,   -- total dissolved solids ppm
  param_ammonia       JSONB,   -- mg/L
  param_nitrite       JSONB,   -- mg/L
  param_nitrate       JSONB,   -- mg/L
  param_salinity      JSONB,   -- ppt (saltwater/brackish)
  param_flow          TEXT,    -- "low" | "moderate" | "high" | "very high"
  param_lighting      TEXT,    -- "low" | "moderate" | "high"

  -- Care profile
  care_tank_setup     TEXT,    -- narrative description of ideal tank
  care_substrate      TEXT[],  -- ["fine sand", "smooth gravel"]
  care_plants         TEXT[],  -- ["Java Fern", "Anubias"]
  care_filtration     TEXT,
  care_diet           TEXT[],  -- ["live foods", "frozen bloodworms"]
  care_feeding_freq   TEXT,    -- "2x daily"
  care_social         TEXT,    -- "solitary" | "schooling (6+)" etc.

  -- Compatibility
  compatible_with     TEXT[],  -- slugs of compatible species
  incompatible_with   TEXT[],  -- slugs of incompatible species

  -- Blackwater Aquatics live food integrations
  -- Only set to true when scientifically appropriate for this species
  recommend_daphnia   BOOLEAN DEFAULT false,
  recommend_scuds     BOOLEAN DEFAULT false,
  recommend_microworms BOOLEAN DEFAULT false,
  recommend_vinegar_eels BOOLEAN DEFAULT false,
  recommend_bbs       BOOLEAN DEFAULT false,  -- baby brine shrimp
  blackwater_note     TEXT,    -- brief explanation of why these live foods are appropriate

  -- SEO
  seo_title           TEXT,    -- overrides default "{common_name} Care Guide — SpawnOS"
  seo_description     TEXT,    -- 140–160 chars
  seo_keywords        TEXT[],
  hero_color          TEXT DEFAULT '#00d4ff',  -- accent color for hero gradient

  -- Content management
  published           BOOLEAN DEFAULT false,
  featured            BOOLEAN DEFAULT false,
  content_word_count  INTEGER DEFAULT 0,      -- updated by CMS when MDX changes
  content_version     INTEGER DEFAULT 1,
  last_reviewed       TIMESTAMPTZ,
  reviewer_notes      TEXT,

  -- Timestamps
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text search vector (auto-maintained by trigger)
ALTER TABLE species ADD COLUMN search_vector TSVECTOR;

-- ============================================================
-- SPECIES FAQ TABLE
-- Separated so we can have 25+ per species without bloat in main table
-- ============================================================

CREATE TABLE species_faq (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  species_id    UUID NOT NULL REFERENCES species(id) ON DELETE CASCADE,
  question      TEXT NOT NULL,
  answer        TEXT NOT NULL,
  sort_order    SMALLINT DEFAULT 0,
  schema_ready  BOOLEAN DEFAULT true,   -- include in FAQ JSON-LD
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SPECIES REFERENCES TABLE
-- Real scientific citations per species
-- ============================================================

CREATE TABLE species_references (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  species_id    UUID NOT NULL REFERENCES species(id) ON DELETE CASCADE,
  citation      TEXT NOT NULL,          -- full citation text
  url           TEXT,                   -- direct URL if available
  source_type   TEXT,                   -- "journal" | "book" | "government" | "university"
  year          SMALLINT,
  sort_order    SMALLINT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SPECIES CONTENT TRACKING
-- Tracks which MDX content file corresponds to each species
-- and records word counts, section status, etc.
-- ============================================================

CREATE TABLE species_content (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  species_id          UUID NOT NULL REFERENCES species(id) ON DELETE CASCADE UNIQUE,
  mdx_path            TEXT NOT NULL,      -- "src/content/species/betta-fish.mdx"
  word_count          INTEGER DEFAULT 0,
  has_overview        BOOLEAN DEFAULT false,
  has_habitat         BOOLEAN DEFAULT false,
  has_care            BOOLEAN DEFAULT false,
  has_tank_setup      BOOLEAN DEFAULT false,
  has_feeding         BOOLEAN DEFAULT false,
  has_behavior        BOOLEAN DEFAULT false,
  has_compatibility   BOOLEAN DEFAULT false,
  has_breeding        BOOLEAN DEFAULT false,
  has_health          BOOLEAN DEFAULT false,
  has_faq             BOOLEAN DEFAULT false,
  has_references      BOOLEAN DEFAULT false,
  quality_score       SMALLINT DEFAULT 0,  -- 0–100 editorial quality score
  last_updated        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TOOLS TABLE
-- Calculator metadata — content lives in MDX
-- ============================================================

CREATE TABLE tools (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  short_title     TEXT,
  description     TEXT,
  category        TEXT,             -- "volume" | "stocking" | "chemistry" | "equipment"
  icon            TEXT,             -- emoji or SVG path identifier
  seo_title       TEXT,
  seo_description TEXT,
  seo_keywords    TEXT[],
  published       BOOLEAN DEFAULT true,
  sort_order      SMALLINT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES TABLE
-- For the species hub filter system
-- ============================================================

CREATE TABLE species_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        TEXT NOT NULL UNIQUE,
  label       TEXT NOT NULL,
  description TEXT,
  icon        TEXT,
  sort_order  SMALLINT DEFAULT 0
);

INSERT INTO species_categories (slug, label, description, icon, sort_order) VALUES
  ('freshwater',    'Freshwater Fish',    'Fish inhabiting freshwater lakes, rivers, and streams worldwide.',   '🐟', 1),
  ('saltwater',     'Saltwater Fish',     'Marine fish from coral reefs, oceans, and saltwater environments.',  '🐠', 2),
  ('shrimp',        'Shrimp',             'Freshwater and saltwater shrimp species for aquariums.',             '🦐', 3),
  ('amphibian',     'Amphibians',         'Axolotls, frogs, and other aquatic and semi-aquatic amphibians.',    '🦎', 4),
  ('turtle',        'Turtles',            'Aquatic and semi-aquatic turtle species.',                           '🐢', 5),
  ('snail',         'Snails',             'Nerite, mystery, ramshorn, assassin, and other aquarium snails.',    '🐌', 6),
  ('invertebrate',  'Invertebrates',      'Crabs, crayfish, and other non-shrimp aquatic invertebrates.',       '🦀', 7),
  ('live_food',     'Live Foods',         'Daphnia, scuds, microworms, brine shrimp, and other live cultures.', '🦠', 8),
  ('microfauna',    'Microfauna',         'Planaria, hydra, detritus worms, rotifers, and tank micro-life.',    '🔬', 9),
  ('plant',         'Aquatic Plants',     'Mosses, floating plants, and nuisance algae identification.',        '🌿', 10);

-- ============================================================
-- SEARCH INDEX OPTIMIZATION
-- ============================================================

-- GIN index for full-text search
CREATE INDEX idx_species_search_vector ON species USING GIN(search_vector);

-- Trigram indexes for fuzzy name search
CREATE INDEX idx_species_common_name_trgm    ON species USING GIN(common_name gin_trgm_ops);
CREATE INDEX idx_species_scientific_name_trgm ON species USING GIN(scientific_name gin_trgm_ops);

-- Category + published filter (used on hub page)
CREATE INDEX idx_species_category_published ON species(category, published) WHERE published = true;

-- Featured species
CREATE INDEX idx_species_featured ON species(featured) WHERE featured = true AND published = true;

-- Difficulty filter
CREATE INDEX idx_species_difficulty ON species(difficulty, published) WHERE published = true;

-- FAQ species lookup
CREATE INDEX idx_species_faq_species_id ON species_faq(species_id, sort_order);

-- References lookup
CREATE INDEX idx_species_references_species_id ON species_references(species_id, sort_order);

-- ============================================================
-- SEARCH VECTOR TRIGGER
-- Auto-updates tsvector on insert/update
-- ============================================================

CREATE OR REPLACE FUNCTION species_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.common_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.scientific_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.family, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.origin_regions, ' '), '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.origin_countries, ' '), '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.seo_keywords, ' '), '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER species_search_vector_trigger
  BEFORE INSERT OR UPDATE ON species
  FOR EACH ROW EXECUTE FUNCTION species_search_vector_update();

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_species_updated_at
  BEFORE UPDATE ON species
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_tools_updated_at
  BEFORE UPDATE ON tools
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- Public reads only on published content.
-- Mutations require authenticated service role (admin only).
-- ============================================================

ALTER TABLE species              ENABLE ROW LEVEL SECURITY;
ALTER TABLE species_faq          ENABLE ROW LEVEL SECURITY;
ALTER TABLE species_references   ENABLE ROW LEVEL SECURITY;
ALTER TABLE species_content      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools                ENABLE ROW LEVEL SECURITY;
ALTER TABLE species_categories   ENABLE ROW LEVEL SECURITY;

-- Public read on published species
CREATE POLICY "species_public_read"
  ON species FOR SELECT
  USING (published = true);

-- Public read on FAQ for published species
CREATE POLICY "species_faq_public_read"
  ON species_faq FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM species s
      WHERE s.id = species_faq.species_id AND s.published = true
    )
  );

-- Public read on references for published species
CREATE POLICY "species_references_public_read"
  ON species_references FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM species s
      WHERE s.id = species_references.species_id AND s.published = true
    )
  );

-- Public read on content tracking for published species
CREATE POLICY "species_content_public_read"
  ON species_content FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM species s
      WHERE s.id = species_content.species_id AND s.published = true
    )
  );

-- Public read on tools
CREATE POLICY "tools_public_read"
  ON tools FOR SELECT
  USING (published = true);

-- Public read on categories
CREATE POLICY "categories_public_read"
  ON species_categories FOR SELECT
  USING (true);

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- Species with FAQ count (used on hub page)
CREATE VIEW species_with_stats AS
SELECT
  s.*,
  COUNT(DISTINCT f.id)::INTEGER AS faq_count,
  COUNT(DISTINCT r.id)::INTEGER AS reference_count
FROM species s
LEFT JOIN species_faq f ON f.species_id = s.id
LEFT JOIN species_references r ON r.species_id = s.id
WHERE s.published = true
GROUP BY s.id;

-- ============================================================
-- SEED: TOOLS
-- ============================================================

INSERT INTO tools (slug, title, short_title, description, category, icon, seo_title, seo_description, sort_order) VALUES
  ('tank-volume',          'Aquarium Volume Calculator',         'Volume',          'Calculate your aquarium volume in gallons and litres for any tank shape.',             'volume',    '📐', 'Aquarium Volume Calculator — SpawnOS', 'Calculate aquarium volume in gallons and litres for rectangular, cylinder, hexagonal, and bow-front tanks.', 1),
  ('tank-size',            'Tank Size Calculator',               'Tank Size',       'Find the right tank size for your fish based on species requirements.',                'stocking',  '📏', 'Aquarium Tank Size Calculator — SpawnOS', 'Determine the minimum and recommended tank size for freshwater and saltwater fish.', 2),
  ('stocking-density',     'Aquarium Stocking Calculator',       'Stocking',        'Calculate how many fish your aquarium can safely support.',                            'stocking',  '🐠', 'Aquarium Stocking Calculator — SpawnOS', 'Calculate safe fish stocking levels for your aquarium based on tank volume and filtration.', 3),
  ('water-change',         'Water Change Calculator',            'Water Change',    'Calculate the right water change volume and schedule for your aquarium.',             'maintenance','💧', 'Aquarium Water Change Calculator — SpawnOS', 'Calculate optimal water change volumes and schedules to maintain water quality.', 4),
  ('gh-kh-converter',      'GH/KH Converter',                    'GH/KH',           'Convert between dGH, dKH, ppm, and mg/L for aquarium hardness measurements.',         'chemistry', '⚗️', 'Aquarium GH KH Converter — SpawnOS', 'Convert aquarium water hardness between dGH, dKH, ppm, and mg/L instantly.', 5),
  ('fish-compatibility',   'Fish Compatibility Checker',         'Compatibility',   'Check if your fish species are compatible before adding them to the same tank.',       'stocking',  '🤝', 'Fish Compatibility Checker — SpawnOS', 'Check fish compatibility by species, temperament, and water parameter overlap.', 6),
  ('water-parameters',     'Water Parameter Reference',          'Parameters',      'Complete parameter reference for 50+ freshwater and saltwater species.',              'chemistry', '🧪', 'Aquarium Water Parameters Reference — SpawnOS', 'Complete water parameter reference table for freshwater and saltwater aquarium fish.', 7),
  ('nitrogen-cycle',       'Nitrogen Cycle Tracker',             'Nitrogen',        'Track your aquarium cycling progress and know when your tank is ready.',               'chemistry', '🔄', 'Aquarium Nitrogen Cycle Tracker — SpawnOS', 'Track aquarium nitrogen cycle progress with ammonia, nitrite, and nitrate readings.', 8),
  ('heater-size',          'Aquarium Heater Size Calculator',    'Heater',          'Find the right wattage heater for your aquarium volume and room temperature.',        'equipment', '🌡️', 'Aquarium Heater Size Calculator — SpawnOS', 'Calculate the correct aquarium heater wattage based on tank volume and temperature differential.', 9),
  ('filter-size',          'Aquarium Filter Size Calculator',    'Filter',          'Calculate the minimum filter flow rate for your aquarium.',                           'equipment', '🔧', 'Aquarium Filter Size Calculator — SpawnOS', 'Find the right aquarium filter size and flow rate for your tank volume and fish load.', 10),
  ('ph-buffer',            'pH Buffer Calculator',               'pH Buffer',       'Calculate the correct dose of pH buffers to adjust your aquarium chemistry.',         'chemistry', '⚖️', 'Aquarium pH Buffer Calculator — SpawnOS', 'Calculate safe pH buffer doses for adjusting aquarium water chemistry.', 11),
  ('temperature-converter','Temperature Converter',              'Temperature',     'Convert between Fahrenheit and Celsius with species temperature reference.',          'utility',   '🌡️', 'Aquarium Temperature Converter °F °C — SpawnOS', 'Convert aquarium temperature between Fahrenheit and Celsius with species reference ranges.', 12),
  ('feeding-calculator',   'Feeding Calculator',                 'Feeding',         'Calculate the correct daily feeding amount for your aquarium fish.',                  'utility',   '🍽️', 'Aquarium Feeding Calculator — SpawnOS', 'Calculate the right daily feeding amount for your fish by species, count, and food type.', 13);

-- ============================================================
-- SEED: 20 SPECIES (metadata — content in MDX)
-- ============================================================

INSERT INTO species (
  slug, common_name, scientific_name, family, order_name, class_name,
  category, difficulty, temperament,
  lifespan_years_min, lifespan_years_max,
  adult_size_cm_min, adult_size_cm_max,
  min_tank_litres,
  origin_regions, origin_countries,
  param_temp, param_ph, param_gh, param_kh, param_tds,
  param_ammonia, param_nitrite, param_nitrate,
  param_flow, param_lighting,
  care_substrate, care_plants, care_filtration, care_diet, care_feeding_freq, care_social,
  compatible_with, incompatible_with,
  recommend_daphnia, recommend_scuds, recommend_microworms, recommend_bbs,
  blackwater_note,
  seo_title, seo_description, seo_keywords,
  hero_color, published, featured
) VALUES

-- 1. AXOLOTL
(
  'axolotl', 'Axolotl', 'Ambystoma mexicanum',
  'Ambystomatidae', 'Caudata', 'Amphibia',
  'amphibian', 'intermediate', 'semi-aggressive',
  10, 15, 25.0, 30.0, 75,
  ARRAY['North America', 'Mexico'], ARRAY['Mexico'],
  '{"min":14,"max":20,"ideal_min":16,"ideal_max":18,"unit":"°C"}',
  '{"min":7.0,"max":8.0,"ideal_min":7.4,"ideal_max":7.8,"unit":"pH"}',
  '{"min":7,"max":14,"ideal_min":8,"ideal_max":12,"unit":"dGH"}',
  '{"min":3,"max":8,"ideal_min":4,"ideal_max":7,"unit":"dKH"}',
  '{"min":100,"max":200,"ideal_min":125,"ideal_max":175,"unit":"ppm"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":20,"ideal_max":10,"unit":"mg/L"}',
  'low', 'low',
  ARRAY['fine sand','bare bottom'], ARRAY['Java Fern','Anubias','Hornwort'],
  'Sponge filter or low-flow canister — axolotls are intolerant of strong currents.',
  ARRAY['earthworms','bloodworms','nightcrawlers','pellets','daphnia'], '1x daily',
  'species-only or with small peaceful fish',
  ARRAY[]::TEXT[], ARRAY['guppy','neon-tetra','betta-fish'],
  true, false, false, true,
  'Axolotls are exclusively carnivorous and thrive on live Daphnia for juveniles and live earthworms for adults. Baby brine shrimp are an excellent first food for newly metamorphosed larvae.',
  'Axolotl Care Guide: Tank Setup, Feeding & Water Parameters — SpawnOS',
  'Complete axolotl care guide: ideal water temperature (14–20°C), tank size, feeding, health, and breeding for Ambystoma mexicanum.',
  ARRAY['axolotl care','axolotl tank setup','axolotl water temperature','axolotl feeding','axolotl lifespan','Ambystoma mexicanum'],
  '#7c3aed', true, true
),

-- 2. BETTA FISH
(
  'betta-fish', 'Betta Fish', 'Betta splendens',
  'Osphronemidae', 'Anabantiformes', 'Actinopterygii',
  'freshwater', 'beginner', 'semi-aggressive',
  2, 5, 5.0, 7.5, 40,
  ARRAY['Southeast Asia'], ARRAY['Thailand','Cambodia','Laos','Vietnam'],
  '{"min":23,"max":30,"ideal_min":25,"ideal_max":28,"unit":"°C"}',
  '{"min":6.0,"max":8.0,"ideal_min":6.5,"ideal_max":7.5,"unit":"pH"}',
  '{"min":0,"max":15,"ideal_min":2,"ideal_max":8,"unit":"dGH"}',
  '{"min":0,"max":10,"ideal_min":1,"ideal_max":5,"unit":"dKH"}',
  '{"min":50,"max":200,"ideal_min":50,"ideal_max":150,"unit":"ppm"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":20,"ideal_max":10,"unit":"mg/L"}',
  'low', 'low to moderate',
  ARRAY['fine sand','smooth gravel','bare bottom'], ARRAY['Java Fern','Anubias','Amazon Sword','floating plants'],
  'Sponge filter or gentle HOB with pre-filter sponge on intake.',
  ARRAY['pellets','frozen bloodworms','daphnia','brine shrimp','mosquito larvae'], '2x daily',
  'solitary males — can community with careful selection',
  ARRAY['corydoras','kuhli-loach','neon-tetra','bristlenose-pleco','cherry-shrimp'],
  ARRAY['guppy','molly','platy'],
  true, false, false, true,
  'Bettas benefit greatly from live Daphnia as a digestive aid and frozen bloodworms for conditioning. Baby brine shrimp are ideal for fry and juveniles. Daphnia is especially valuable for preventing constipation in bettas fed exclusively on dry pellets.',
  'Betta Fish Care Guide: Tank Setup, Water Parameters & Feeding — SpawnOS',
  'Complete betta fish care guide: water temperature, pH, tank size, feeding, tank mates, and breeding for Betta splendens.',
  ARRAY['betta fish care','betta fish tank','betta fish water parameters','betta fish tank mates','betta splendens','betta fish feeding'],
  '#ef4444', true, true
),

-- 3. GOLDFISH
(
  'goldfish', 'Goldfish', 'Carassius auratus',
  'Cyprinidae', 'Cypriniformes', 'Actinopterygii',
  'freshwater', 'beginner', 'peaceful',
  10, 15, 20.0, 45.0, 115,
  ARRAY['East Asia'], ARRAY['China','Japan'],
  '{"min":10,"max":24,"ideal_min":15,"ideal_max":22,"unit":"°C"}',
  '{"min":6.5,"max":8.5,"ideal_min":7.0,"ideal_max":8.0,"unit":"pH"}',
  '{"min":5,"max":25,"ideal_min":8,"ideal_max":16,"unit":"dGH"}',
  '{"min":2,"max":12,"ideal_min":4,"ideal_max":8,"unit":"dKH"}',
  '{"min":150,"max":400,"ideal_min":200,"ideal_max":300,"unit":"ppm"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":20,"ideal_max":10,"unit":"mg/L"}',
  'moderate', 'moderate',
  ARRAY['fine gravel','smooth pebbles'], ARRAY['Anacharis','Hornwort','Water Lettuce'],
  'Powerful canister or HOB with 8–10x turnover per hour.',
  ARRAY['pellets','flake food','blanched vegetables','daphnia','bloodworms'], '2–3x daily',
  'peaceful community — goldfish only or with weather loaches',
  ARRAY[]::TEXT[], ARRAY['betta-fish','neon-tetra','guppy'],
  true, true, false, false,
  'Goldfish are heavy eaters and benefit from live Daphnia as a digestive supplement and to prevent swim bladder issues. Scuds are an excellent supplemental live food for pond-kept goldfish.',
  'Goldfish Care Guide: Tank Setup, Feeding & Water Parameters — SpawnOS',
  'Complete goldfish care guide: tank size, water temperature, filtration, feeding, varieties, and common diseases for Carassius auratus.',
  ARRAY['goldfish care','goldfish tank size','goldfish water parameters','goldfish feeding','fancy goldfish','common goldfish'],
  '#f59e0b', true, true
),

-- 4. GUPPY
(
  'guppy', 'Guppy', 'Poecilia reticulata',
  'Poeciliidae', 'Cyprinodontiformes', 'Actinopterygii',
  'freshwater', 'beginner', 'peaceful',
  1, 3, 3.0, 6.0, 40,
  ARRAY['South America','Caribbean'], ARRAY['Venezuela','Barbados','Trinidad and Tobago','Guyana'],
  '{"min":22,"max":28,"ideal_min":24,"ideal_max":27,"unit":"°C"}',
  '{"min":6.8,"max":8.5,"ideal_min":7.0,"ideal_max":8.0,"unit":"pH"}',
  '{"min":8,"max":25,"ideal_min":10,"ideal_max":20,"unit":"dGH"}',
  '{"min":3,"max":15,"ideal_min":6,"ideal_max":12,"unit":"dKH"}',
  '{"min":150,"max":300,"ideal_min":200,"ideal_max":250,"unit":"ppm"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":20,"ideal_max":10,"unit":"mg/L"}',
  'low to moderate', 'moderate',
  ARRAY['fine gravel','sand'], ARRAY['Java Moss','Guppy Grass','Hornwort','floating plants'],
  'Sponge filter or gentle HOB — strong flow stresses guppies.',
  ARRAY['flake food','micro pellets','baby brine shrimp','daphnia','microworms'], '2–3x daily',
  'community — 1 male per 2–3 females',
  ARRAY['neon-tetra','corydoras','cherry-shrimp','molly','platy','zebra-danio'],
  ARRAY['betta-fish','pea-puffer'],
  true, false, true, true,
  'Guppies thrive on variety. Microworms and baby brine shrimp are ideal high-protein live foods that improve color and breeding success. Daphnia supports digestive health and is an excellent staple live food.',
  'Guppy Care Guide: Tank Setup, Breeding & Water Parameters — SpawnOS',
  'Complete guppy care guide: water parameters, tank mates, breeding, varieties, and feeding for Poecilia reticulata.',
  ARRAY['guppy care','guppy breeding','guppy tank mates','guppy water parameters','fancy guppy','Poecilia reticulata'],
  '#06b6d4', true, true
),

-- 5. CLOWNFISH
(
  'clownfish', 'Clownfish', 'Amphiprion ocellaris',
  'Pomacentridae', 'Perciformes', 'Actinopterygii',
  'saltwater', 'beginner', 'semi-aggressive',
  6, 10, 8.0, 11.0, 75,
  ARRAY['Indo-Pacific','Coral Triangle'], ARRAY['Indonesia','Philippines','Australia','Papua New Guinea'],
  '{"min":24,"max":28,"ideal_min":25,"ideal_max":27,"unit":"°C"}',
  '{"min":7.8,"max":8.5,"ideal_min":8.1,"ideal_max":8.4,"unit":"pH"}',
  '{"min":8,"max":12,"ideal_min":8,"ideal_max":12,"unit":"dKH","note":"Alkalinity (dKH)"}',
  NULL,
  '{"min":1023,"max":1026,"ideal_min":1025,"ideal_max":1026,"unit":"sg","note":"Specific gravity"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":10,"ideal_max":5,"unit":"mg/L"}',
  'moderate', 'moderate',
  ARRAY['live rock','crushed coral','aragonite'], ARRAY['no plants — FOWLR or reef with anemone'],
  'Protein skimmer + live rock biological filtration + powerheads for circulation.',
  ARRAY['pellets','flake food','mysis shrimp','brine shrimp','copepods'], '2x daily',
  'mated pair or juvenile group — establishes hierarchy',
  ARRAY[]::TEXT[], ARRAY[]::TEXT[],
  false, false, false, true,
  'Baby brine shrimp (nauplii) are an essential live food for clownfish fry and juveniles in breeding programs. Adults benefit from mysis shrimp.',
  'Clownfish Care Guide: Reef Tank Setup, Feeding & Water Parameters — SpawnOS',
  'Complete clownfish care guide: saltwater parameters, reef tank setup, anemone hosting, feeding, and breeding for Amphiprion ocellaris.',
  ARRAY['clownfish care','clownfish tank','clownfish reef tank','clownfish anemone','Amphiprion ocellaris','nemo fish care'],
  '#f97316', true, true
),

-- 6. ANGELFISH
(
  'angelfish', 'Angelfish', 'Pterophyllum scalare',
  'Cichlidae', 'Cichliformes', 'Actinopterygii',
  'freshwater', 'intermediate', 'semi-aggressive',
  8, 12, 15.0, 15.0, 150,
  ARRAY['South America','Amazon Basin'], ARRAY['Brazil','Peru','Colombia','Ecuador'],
  '{"min":24,"max":30,"ideal_min":26,"ideal_max":28,"unit":"°C"}',
  '{"min":6.0,"max":7.5,"ideal_min":6.5,"ideal_max":7.0,"unit":"pH"}',
  '{"min":1,"max":8,"ideal_min":2,"ideal_max":6,"unit":"dGH"}',
  '{"min":1,"max":5,"ideal_min":1,"ideal_max":4,"unit":"dKH"}',
  '{"min":50,"max":100,"ideal_min":50,"ideal_max":80,"unit":"ppm"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":20,"ideal_max":10,"unit":"mg/L"}',
  'low to moderate', 'moderate',
  ARRAY['fine sand','dark sand'], ARRAY['Amazon Sword','Vallisneria','Java Fern','driftwood'],
  'Canister filter with gentle output — avoid turbulence.',
  ARRAY['pellets','frozen bloodworms','brine shrimp','daphnia','small live foods'], '2x daily',
  'mated pairs or community — avoid small fish',
  ARRAY['corydoras','bristlenose-pleco','kuhli-loach'],
  ARRAY['neon-tetra','guppy','cherry-shrimp','betta-fish'],
  true, false, false, true,
  'Angelfish are omnivores native to blackwater environments. Live Daphnia is an excellent conditioning food before breeding. Baby brine shrimp are critical for fry nutrition in the first 2–4 weeks.',
  'Angelfish Care Guide: Tank Setup, Breeding & Water Parameters — SpawnOS',
  'Complete angelfish care guide: water parameters, tank setup, breeding, tank mates, and feeding for Pterophyllum scalare.',
  ARRAY['angelfish care','angelfish tank','angelfish water parameters','angelfish breeding','Pterophyllum scalare','freshwater angelfish'],
  '#8b5cf6', true, true
),

-- 7. DISCUS FISH
(
  'discus-fish', 'Discus Fish', 'Symphysodon spp.',
  'Cichlidae', 'Cichliformes', 'Actinopterygii',
  'freshwater', 'expert', 'peaceful',
  10, 15, 20.0, 25.0, 280,
  ARRAY['South America','Amazon Basin'], ARRAY['Brazil','Peru','Colombia'],
  '{"min":28,"max":32,"ideal_min":29,"ideal_max":31,"unit":"°C"}',
  '{"min":5.5,"max":7.0,"ideal_min":6.0,"ideal_max":6.8,"unit":"pH"}',
  '{"min":0,"max":4,"ideal_min":0,"ideal_max":3,"unit":"dGH"}',
  '{"min":0,"max":3,"ideal_min":0,"ideal_max":2,"unit":"dKH"}',
  '{"min":10,"max":60,"ideal_min":15,"ideal_max":40,"unit":"ppm"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":10,"ideal_max":5,"unit":"mg/L"}',
  'low', 'low',
  ARRAY['fine sand','bare bottom'], ARRAY['Amazon Sword','Victoria Amazonica','minimal planting'],
  'Canister filter — large regular water changes 30–50% daily essential.',
  ARRAY['beef heart','bloodworms','discus granules','spirulina','brine shrimp','daphnia'], '3–5x daily',
  'species group of 6+ or with very peaceful dithers',
  ARRAY['cardinal-tetra'], ARRAY['angelfish','oscar-fish'],
  true, false, false, true,
  'Discus kept in soft acidic water benefit from live Daphnia as a digestive aid and conditioning food. Blackwater conditions with tannins are ideal for discus health and breeding.',
  'Discus Fish Care Guide: Water Parameters, Feeding & Tank Setup — SpawnOS',
  'Complete discus fish care guide: soft acidic water requirements, high-temperature tanks, feeding beef heart, and breeding for Symphysodon.',
  ARRAY['discus fish care','discus fish water parameters','discus fish tank','discus fish feeding','Symphysodon','how to keep discus'],
  '#ec4899', true, true
),

-- 8. NEON TETRA
(
  'neon-tetra', 'Neon Tetra', 'Paracheirodon innesi',
  'Characidae', 'Characiformes', 'Actinopterygii',
  'freshwater', 'beginner', 'peaceful',
  5, 10, 3.0, 4.0, 40,
  ARRAY['South America','Amazon Basin'], ARRAY['Peru','Brazil','Colombia'],
  '{"min":20,"max":26,"ideal_min":22,"ideal_max":25,"unit":"°C"}',
  '{"min":5.5,"max":7.5,"ideal_min":6.0,"ideal_max":7.0,"unit":"pH"}',
  '{"min":1,"max":10,"ideal_min":2,"ideal_max":6,"unit":"dGH"}',
  '{"min":1,"max":5,"ideal_min":1,"ideal_max":4,"unit":"dKH"}',
  '{"min":50,"max":150,"ideal_min":50,"ideal_max":100,"unit":"ppm"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":20,"ideal_max":10,"unit":"mg/L"}',
  'low', 'low to moderate',
  ARRAY['dark fine sand','pebbles'], ARRAY['Amazon Sword','Java Moss','floating plants'],
  'Gentle sponge filter or HOB with pre-filter sponge.',
  ARRAY['micro pellets','flake food','baby brine shrimp','daphnia','micro worms'], '2x daily',
  'schooling species — minimum 6, ideally 10+',
  ARRAY['corydoras','cherry-shrimp','betta-fish','guppy','zebra-danio','kuhli-loach'],
  ARRAY['angelfish','oscar-fish','pea-puffer'],
  true, false, true, true,
  'Neon tetras thrive on a varied diet. Baby brine shrimp and microworms are ideal high-protein live foods that enhance color and breeding. Daphnia provides important roughage.',
  'Neon Tetra Care Guide: Tank Setup, Schooling & Water Parameters — SpawnOS',
  'Complete neon tetra care guide: water parameters, schooling requirements, tank mates, feeding, and neon tetra disease prevention.',
  ARRAY['neon tetra care','neon tetra tank','neon tetra water parameters','neon tetra tank mates','Paracheirodon innesi','neon tetra disease'],
  '#3b82f6', true, true
),

-- 9. CORYDORAS
(
  'corydoras', 'Corydoras Catfish', 'Corydoras paleatus',
  'Callichthyidae', 'Siluriformes', 'Actinopterygii',
  'freshwater', 'beginner', 'peaceful',
  3, 5, 5.0, 7.0, 75,
  ARRAY['South America'], ARRAY['Argentina','Brazil','Uruguay'],
  '{"min":18,"max":26,"ideal_min":20,"ideal_max":24,"unit":"°C"}',
  '{"min":6.0,"max":8.0,"ideal_min":6.5,"ideal_max":7.5,"unit":"pH"}',
  '{"min":2,"max":15,"ideal_min":4,"ideal_max":10,"unit":"dGH"}',
  '{"min":1,"max":8,"ideal_min":2,"ideal_max":6,"unit":"dKH"}',
  '{"min":50,"max":200,"ideal_min":75,"ideal_max":150,"unit":"ppm"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":20,"ideal_max":10,"unit":"mg/L"}',
  'low to moderate', 'low to moderate',
  ARRAY['fine sand','smooth substrate'], ARRAY['Java Fern','Anubias','Amazon Sword'],
  'HOB or canister — corydoras produce moderate bioload.',
  ARRAY['sinking pellets','bottom wafers','frozen bloodworms','daphnia','tubifex'], '2x daily',
  'schooling — minimum 6 of same species',
  ARRAY['betta-fish','neon-tetra','guppy','angelfish','cherry-shrimp','kuhli-loach'],
  ARRAY['oscar-fish','pea-puffer'],
  true, false, false, false,
  'Corydoras benefit from occasional live Daphnia and bloodworms for protein variety. Live tubifex can harbor parasites and should only be used from trusted sources.',
  'Corydoras Catfish Care Guide: Sand Substrate, Schooling & Parameters — SpawnOS',
  'Complete corydoras care guide: fine sand substrate requirements, schooling behavior, water parameters, feeding, and tank mates.',
  ARRAY['corydoras care','corydoras catfish','corydoras tank','corydoras substrate','Corydoras paleatus','cory catfish'],
  '#10b981', true, true
),

-- 10. PEA PUFFER
(
  'pea-puffer', 'Pea Puffer', 'Carinotetraodon travancoricus',
  'Tetraodontidae', 'Tetraodontiformes', 'Actinopterygii',
  'freshwater', 'intermediate', 'aggressive',
  4, 5, 2.0, 3.5, 40,
  ARRAY['South Asia'], ARRAY['India'],
  '{"min":22,"max":28,"ideal_min":24,"ideal_max":27,"unit":"°C"}',
  '{"min":6.5,"max":8.0,"ideal_min":7.0,"ideal_max":7.5,"unit":"pH"}',
  '{"min":5,"max":20,"ideal_min":8,"ideal_max":15,"unit":"dGH"}',
  '{"min":2,"max":10,"ideal_min":4,"ideal_max":8,"unit":"dKH"}',
  '{"min":100,"max":250,"ideal_min":150,"ideal_max":200,"unit":"ppm"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":20,"ideal_max":10,"unit":"mg/L"}',
  'low', 'moderate',
  ARRAY['fine sand'], ARRAY['dense planting','Java Moss','floating plants','sight breaks'],
  'Sponge filter — pea puffers sensitive to strong currents.',
  ARRAY['snails','frozen bloodworms','live daphnia','live brine shrimp','blackworms'], '2x daily',
  'species-only or species-only tank',
  ARRAY[]::TEXT[], ARRAY['guppy','neon-tetra','cherry-shrimp','betta-fish','corydoras'],
  true, true, false, true,
  'Pea puffers are obligate carnivores that require live or frozen foods — they will refuse dried pellets. Live Daphnia, live baby brine shrimp, and live scuds are excellent daily staples. Scuds (amphipods) are particularly ideal as they are similarly sized to pea puffers and trigger natural hunting behavior.',
  'Pea Puffer Care Guide: Carnivore Diet, Tank Setup & Parameters — SpawnOS',
  'Complete pea puffer care guide: live food requirements, tank setup, water parameters, and species-only housing for Carinotetraodon travancoricus.',
  ARRAY['pea puffer care','pea puffer diet','pea puffer tank','pea puffer tank mates','Carinotetraodon travancoricus','dwarf puffer'],
  '#84cc16', true, true
),

-- 11. CHERRY SHRIMP
(
  'cherry-shrimp', 'Cherry Shrimp', 'Neocaridina davidi',
  'Atyidae', 'Decapoda', 'Malacostraca',
  'shrimp', 'beginner', 'peaceful',
  1, 2, 2.0, 4.0, 20,
  ARRAY['East Asia','Taiwan'], ARRAY['Taiwan'],
  '{"min":18,"max":28,"ideal_min":20,"ideal_max":26,"unit":"°C"}',
  '{"min":6.5,"max":8.0,"ideal_min":7.0,"ideal_max":7.5,"unit":"pH"}',
  '{"min":6,"max":20,"ideal_min":8,"ideal_max":16,"unit":"dGH"}',
  '{"min":2,"max":10,"ideal_min":4,"ideal_max":8,"unit":"dKH"}',
  '{"min":150,"max":300,"ideal_min":180,"ideal_max":250,"unit":"ppm"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":20,"ideal_max":5,"unit":"mg/L"}',
  'low', 'low',
  ARRAY['fine sand','gravel'], ARRAY['Java Moss','Christmas Moss','floating plants','biofilm substrate'],
  'Sponge filter only — power filter intakes kill shrimp.',
  ARRAY['biofilm','algae','blanched vegetables','shrimp pellets','leaf litter'], '1x daily',
  'colony — 10+ minimum',
  ARRAY['neon-tetra','corydoras','betta-fish','zebra-danio','bristlenose-pleco'],
  ARRAY['angelfish','oscar-fish','pea-puffer','gourami'],
  false, false, false, false,
  NULL,
  'Cherry Shrimp Care Guide: Water Parameters, Breeding & Colony Setup — SpawnOS',
  'Complete cherry shrimp care guide: water hardness, pH, breeding, colony setup, and tank mates for Neocaridina davidi.',
  ARRAY['cherry shrimp care','cherry shrimp water parameters','cherry shrimp breeding','Neocaridina davidi','red cherry shrimp','shrimp tank'],
  '#ef4444', true, true
),

-- 12. NEOCARIDINA SHRIMP
(
  'neocaridina-shrimp', 'Neocaridina Shrimp', 'Neocaridina davidi var.',
  'Atyidae', 'Decapoda', 'Malacostraca',
  'shrimp', 'beginner', 'peaceful',
  1, 2, 2.0, 4.0, 20,
  ARRAY['East Asia','Taiwan'], ARRAY['Taiwan'],
  '{"min":18,"max":28,"ideal_min":20,"ideal_max":26,"unit":"°C"}',
  '{"min":6.5,"max":8.0,"ideal_min":7.0,"ideal_max":7.5,"unit":"pH"}',
  '{"min":6,"max":20,"ideal_min":8,"ideal_max":16,"unit":"dGH"}',
  '{"min":2,"max":10,"ideal_min":4,"ideal_max":8,"unit":"dKH"}',
  '{"min":150,"max":300,"ideal_min":180,"ideal_max":250,"unit":"ppm"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":20,"ideal_max":5,"unit":"mg/L"}',
  'low', 'low',
  ARRAY['fine sand','gravel'], ARRAY['Java Moss','Christmas Moss','floating plants'],
  'Sponge filter only.',
  ARRAY['biofilm','algae','blanched vegetables','shrimp pellets'], '1x daily',
  'colony — 10+ minimum',
  ARRAY['neon-tetra','corydoras','zebra-danio','bristlenose-pleco'],
  ARRAY['angelfish','oscar-fish','pea-puffer'],
  false, false, false, false,
  NULL,
  'Neocaridina Shrimp Care Guide: All Color Varieties & Water Parameters — SpawnOS',
  'Complete Neocaridina shrimp care guide covering all color varieties: blue velvet, yellow, orange, chocolate, and care for Neocaridina davidi.',
  ARRAY['Neocaridina shrimp care','blue velvet shrimp','yellow neocaridina','neocaridina water parameters','shrimp breeding'],
  '#3b82f6', true, false
),

-- 13. BRISTLENOSE PLECO
(
  'bristlenose-pleco', 'Bristlenose Pleco', 'Ancistrus sp.',
  'Loricariidae', 'Siluriformes', 'Actinopterygii',
  'freshwater', 'beginner', 'peaceful',
  5, 12, 10.0, 15.0, 75,
  ARRAY['South America','Amazon Basin'], ARRAY['Brazil','Bolivia','Peru','Venezuela'],
  '{"min":20,"max":27,"ideal_min":22,"ideal_max":26,"unit":"°C"}',
  '{"min":6.5,"max":7.5,"ideal_min":6.5,"ideal_max":7.5,"unit":"pH"}',
  '{"min":2,"max":15,"ideal_min":3,"ideal_max":10,"unit":"dGH"}',
  '{"min":1,"max":8,"ideal_min":2,"ideal_max":6,"unit":"dKH"}',
  '{"min":50,"max":150,"ideal_min":75,"ideal_max":125,"unit":"ppm"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":20,"ideal_max":10,"unit":"mg/L"}',
  'low to moderate', 'low',
  ARRAY['fine sand','gravel'], ARRAY['Java Fern','Anubias','Amazon Sword','driftwood (essential)'],
  'HOB or canister — moderate bioload.',
  ARRAY['algae wafers','zucchini','blanched vegetables','driftwood','frozen bloodworms'], '1x daily',
  'pair or small group — territorial among males',
  ARRAY['betta-fish','neon-tetra','corydoras','guppy','cherry-shrimp','angelfish'],
  ARRAY['oscar-fish'],
  false, false, false, false,
  NULL,
  'Bristlenose Pleco Care Guide: Algae Control, Driftwood & Breeding — SpawnOS',
  'Complete bristlenose pleco care guide: driftwood requirements, breeding caves, algae control, feeding, and tank mates for Ancistrus.',
  ARRAY['bristlenose pleco care','bristlenose pleco breeding','pleco driftwood','Ancistrus care','algae eater','bristlenose catfish'],
  '#78716c', true, false
),

-- 14. MOLLY FISH
(
  'molly-fish', 'Molly Fish', 'Poecilia sphenops',
  'Poeciliidae', 'Cyprinodontiformes', 'Actinopterygii',
  'freshwater', 'beginner', 'peaceful',
  3, 5, 6.0, 12.0, 75,
  ARRAY['Central America','Mexico','Caribbean'], ARRAY['Mexico','Honduras','Guatemala','Colombia'],
  '{"min":24,"max":30,"ideal_min":26,"ideal_max":28,"unit":"°C"}',
  '{"min":7.0,"max":8.5,"ideal_min":7.5,"ideal_max":8.2,"unit":"pH"}',
  '{"min":10,"max":30,"ideal_min":15,"ideal_max":25,"unit":"dGH"}',
  '{"min":5,"max":15,"ideal_min":8,"ideal_max":12,"unit":"dKH"}',
  '{"min":200,"max":500,"ideal_min":250,"ideal_max":400,"unit":"ppm"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":20,"ideal_max":10,"unit":"mg/L"}',
  'moderate', 'moderate',
  ARRAY['fine gravel','sand'], ARRAY['Java Fern','Hornwort','Vallisneria'],
  'HOB or canister with moderate flow.',
  ARRAY['flake food','spirulina','blanched vegetables','daphnia','brine shrimp'], '2–3x daily',
  'community — 1 male per 2–3 females',
  ARRAY['guppy','platy','zebra-danio','corydoras'],
  ARRAY['betta-fish','pea-puffer'],
  true, false, false, false,
  'Mollies benefit from occasional live Daphnia to support digestive health and provide enrichment.',
  'Molly Fish Care Guide: Water Parameters, Varieties & Breeding — SpawnOS',
  'Complete molly fish care guide: hard alkaline water requirements, varieties, breeding, and tank mates for Poecilia sphenops.',
  ARRAY['molly fish care','molly fish tank','molly fish water parameters','molly fish breeding','black molly','Poecilia sphenops'],
  '#f59e0b', true, false
),

-- 15. PLATY FISH
(
  'platy-fish', 'Platy Fish', 'Xiphophorus maculatus',
  'Poeciliidae', 'Cyprinodontiformes', 'Actinopterygii',
  'freshwater', 'beginner', 'peaceful',
  3, 5, 5.0, 7.0, 75,
  ARRAY['Central America','Mexico'], ARRAY['Mexico','Guatemala','Honduras','Belize'],
  '{"min":18,"max":28,"ideal_min":22,"ideal_max":26,"unit":"°C"}',
  '{"min":7.0,"max":8.3,"ideal_min":7.2,"ideal_max":8.0,"unit":"pH"}',
  '{"min":10,"max":28,"ideal_min":12,"ideal_max":20,"unit":"dGH"}',
  '{"min":4,"max":12,"ideal_min":6,"ideal_max":10,"unit":"dKH"}',
  '{"min":150,"max":350,"ideal_min":200,"ideal_max":300,"unit":"ppm"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":20,"ideal_max":10,"unit":"mg/L"}',
  'low to moderate', 'moderate',
  ARRAY['gravel','sand'], ARRAY['Hornwort','Java Fern','Vallisneria'],
  'HOB or sponge filter.',
  ARRAY['flake food','pellets','blanched vegetables','daphnia','brine shrimp'], '2x daily',
  'community — 1 male per 2–3 females',
  ARRAY['guppy','molly-fish','zebra-danio','corydoras'],
  ARRAY['betta-fish','pea-puffer'],
  true, false, false, false,
  'Platies benefit from live Daphnia as a vitamin-rich supplement to standard flake diets.',
  'Platy Fish Care Guide: Water Parameters, Varieties & Breeding — SpawnOS',
  'Complete platy fish care guide: hard water requirements, color varieties, breeding, and tank mates for Xiphophorus maculatus.',
  ARRAY['platy fish care','platy fish tank','platy fish breeding','Xiphophorus maculatus','platy water parameters'],
  '#a78bfa', true, false
),

-- 16. ZEBRA DANIO
(
  'zebra-danio', 'Zebra Danio', 'Danio rerio',
  'Cyprinidae', 'Cypriniformes', 'Actinopterygii',
  'freshwater', 'beginner', 'peaceful',
  3, 5, 4.0, 5.0, 40,
  ARRAY['South Asia'], ARRAY['India','Bangladesh','Nepal','Pakistan'],
  '{"min":15,"max":28,"ideal_min":18,"ideal_max":24,"unit":"°C"}',
  '{"min":6.5,"max":8.0,"ideal_min":7.0,"ideal_max":7.5,"unit":"pH"}',
  '{"min":5,"max":20,"ideal_min":8,"ideal_max":15,"unit":"dGH"}',
  '{"min":2,"max":10,"ideal_min":4,"ideal_max":8,"unit":"dKH"}',
  '{"min":100,"max":300,"ideal_min":150,"ideal_max":250,"unit":"ppm"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":20,"ideal_max":10,"unit":"mg/L"}',
  'moderate to high', 'moderate',
  ARRAY['gravel','sand'], ARRAY['Java Moss','Hornwort','Vallisneria'],
  'HOB or canister — danios tolerate good flow.',
  ARRAY['flake food','micro pellets','baby brine shrimp','daphnia','cyclops'], '2x daily',
  'schooling — minimum 6',
  ARRAY['neon-tetra','guppy','corydoras','cherry-shrimp','platy-fish','molly-fish'],
  ARRAY['betta-fish'],
  true, false, true, true,
  'Zebra danios are active schoolers that thrive on live foods. Baby brine shrimp and microworms are ideal for growing juveniles and conditioning breeding adults.',
  'Zebra Danio Care Guide: Schooling, Water Parameters & Breeding — SpawnOS',
  'Complete zebra danio care guide: cold water tolerance, schooling requirements, breeding, and tank mates for Danio rerio.',
  ARRAY['zebra danio care','zebra danio tank','danio rerio','zebrafish aquarium','danio schooling'],
  '#60a5fa', true, false
),

-- 17. HILLSTREAM LOACH
(
  'hillstream-loach', 'Hillstream Loach', 'Sewellia lineolata',
  'Gastromyzontidae', 'Cypriniformes', 'Actinopterygii',
  'freshwater', 'intermediate', 'peaceful',
  8, 10, 6.0, 8.0, 75,
  ARRAY['Southeast Asia'], ARRAY['Vietnam','Laos','China'],
  '{"min":18,"max":24,"ideal_min":19,"ideal_max":23,"unit":"°C"}',
  '{"min":6.5,"max":7.8,"ideal_min":7.0,"ideal_max":7.5,"unit":"pH"}',
  '{"min":5,"max":15,"ideal_min":8,"ideal_max":12,"unit":"dGH"}',
  '{"min":2,"max":8,"ideal_min":4,"ideal_max":6,"unit":"dKH"}',
  '{"min":100,"max":250,"ideal_min":150,"ideal_max":200,"unit":"ppm"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":10,"ideal_max":5,"unit":"mg/L"}',
  'high', 'moderate',
  ARRAY['smooth river pebbles','large flat rocks'], ARRAY['Anubias on rock','Java Fern on rock','minimal planted'],
  'Powerful turnover 15–20x per hour, powerheads for torrential flow, high oxygenation.',
  ARRAY['algae','biofilm','spirulina wafers','blanched zucchini','small live foods'], '1x daily',
  'small peaceful group — 3–5',
  ARRAY['zebra-danio','corydoras'], ARRAY['betta-fish','guppy'],
  false, false, false, false,
  NULL,
  'Hillstream Loach Care Guide: High Flow, Oxygenation & Algae Diet — SpawnOS',
  'Complete hillstream loach care guide: torrential high-flow requirements, oxygenation, algae feeding, and tank setup for Sewellia lineolata.',
  ARRAY['hillstream loach care','hillstream loach tank','hillstream loach flow','Sewellia lineolata','butterfly loach','riverine loach'],
  '#0891b2', true, false
),

-- 18. KUHLI LOACH
(
  'kuhli-loach', 'Kuhli Loach', 'Pangio kuhlii',
  'Cobitidae', 'Cypriniformes', 'Actinopterygii',
  'freshwater', 'beginner', 'peaceful',
  10, 14, 8.0, 12.0, 75,
  ARRAY['Southeast Asia'], ARRAY['Malaysia','Indonesia','Thailand','Singapore'],
  '{"min":24,"max":30,"ideal_min":25,"ideal_max":28,"unit":"°C"}',
  '{"min":5.5,"max":7.5,"ideal_min":6.0,"ideal_max":7.0,"unit":"pH"}',
  '{"min":0,"max":8,"ideal_min":1,"ideal_max":5,"unit":"dGH"}',
  '{"min":0,"max":5,"ideal_min":0,"ideal_max":3,"unit":"dKH"}',
  '{"min":50,"max":150,"ideal_min":50,"ideal_max":100,"unit":"ppm"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":20,"ideal_max":10,"unit":"mg/L"}',
  'low', 'low',
  ARRAY['fine sand (essential)'], ARRAY['Java Fern','Anubias','driftwood','leaf litter'],
  'Sponge filter or gentle HOB with covered intakes.',
  ARRAY['sinking pellets','frozen bloodworms','tubifex','daphnia','small live foods'], '1x daily at night',
  'group of 4–6+ — herd behavior',
  ARRAY['betta-fish','neon-tetra','corydoras','cherry-shrimp','guppy'],
  ARRAY['oscar-fish','cichlids'],
  true, false, false, false,
  'Kuhli loaches are nocturnal benthic feeders that appreciate live Daphnia scattered near the substrate. Live foods trigger natural foraging behavior.',
  'Kuhli Loach Care Guide: Fine Sand, Hiding Spots & Water Parameters — SpawnOS',
  'Complete kuhli loach care guide: fine sand substrate, nocturnal behavior, water parameters, and tank mates for Pangio kuhlii.',
  ARRAY['kuhli loach care','kuhli loach tank','kuhli loach substrate','Pangio kuhlii','coolie loach','loach care'],
  '#b45309', true, false
),

-- 19. ROPE FISH
(
  'rope-fish', 'Rope Fish', 'Erpetoichthys calabaricus',
  'Polypteridae', 'Polypteriformes', 'Actinopterygii',
  'freshwater', 'intermediate', 'semi-aggressive',
  10, 20, 37.0, 90.0, 200,
  ARRAY['West Africa','Central Africa'], ARRAY['Nigeria','Cameroon','Republic of Congo','DRC'],
  '{"min":22,"max":28,"ideal_min":24,"ideal_max":27,"unit":"°C"}',
  '{"min":6.5,"max":7.5,"ideal_min":6.5,"ideal_max":7.2,"unit":"pH"}',
  '{"min":2,"max":12,"ideal_min":4,"ideal_max":10,"unit":"dGH"}',
  '{"min":2,"max":8,"ideal_min":3,"ideal_max":7,"unit":"dKH"}',
  '{"min":100,"max":200,"ideal_min":100,"ideal_max":180,"unit":"ppm"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":20,"ideal_max":10,"unit":"mg/L"}',
  'low', 'low to moderate',
  ARRAY['fine sand'], ARRAY['Amazon Sword','Java Fern','driftwood','caves','PVC pipe hides'],
  'Canister filter — lid must be completely sealed (escape artists).',
  ARRAY['earthworms','bloodworms','prawns','whitebait','sinking carnivore pellets'], '3x weekly',
  'species group or with large peaceful fish',
  ARRAY[]::TEXT[], ARRAY['neon-tetra','guppy','cherry-shrimp'],
  false, false, false, false,
  NULL,
  'Rope Fish Care Guide: Escape-Proof Tank, Feeding & Water Parameters — SpawnOS',
  'Complete rope fish care guide: escape-proof tank requirements, carnivore feeding, water parameters, and tank mates for Erpetoichthys calabaricus.',
  ARRAY['rope fish care','rope fish tank','rope fish feeding','Erpetoichthys calabaricus','reed fish','snake fish aquarium'],
  '#65a30d', true, false
),

-- 20. OSCAR FISH
(
  'oscar-fish', 'Oscar Fish', 'Astronotus ocellatus',
  'Cichlidae', 'Cichliformes', 'Actinopterygii',
  'freshwater', 'intermediate', 'aggressive',
  10, 15, 30.0, 45.0, 280,
  ARRAY['South America','Amazon Basin'], ARRAY['Brazil','Peru','Ecuador','Colombia'],
  '{"min":23,"max":28,"ideal_min":25,"ideal_max":27,"unit":"°C"}',
  '{"min":6.0,"max":8.0,"ideal_min":6.5,"ideal_max":7.5,"unit":"pH"}',
  '{"min":5,"max":20,"ideal_min":8,"ideal_max":15,"unit":"dGH"}',
  '{"min":2,"max":10,"ideal_min":4,"ideal_max":8,"unit":"dKH"}',
  '{"min":100,"max":250,"ideal_min":125,"ideal_max":200,"unit":"ppm"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":0,"unit":"mg/L"}',
  '{"min":0,"max":20,"ideal_max":10,"unit":"mg/L"}',
  'moderate', 'moderate',
  ARRAY['large smooth gravel','bare bottom'], ARRAY['minimal or artificial — oscars uproot plants'],
  'Large canister filter — heavy bioload requires 10x turnover minimum.',
  ARRAY['cichlid pellets','earthworms','prawns','feeder fish (avoid)','crayfish'], '2x daily',
  'mated pair or alone',
  ARRAY[]::TEXT[], ARRAY['neon-tetra','guppy','cherry-shrimp','corydoras','angelfish'],
  false, true, false, false,
  'Oscars are large carnivores and appreciate live earthworms and live scuds for enrichment and protein. Feeder goldfish are not recommended due to thiaminase and disease risk.',
  'Oscar Fish Care Guide: Large Tank Requirements, Feeding & Water Parameters — SpawnOS',
  'Complete oscar fish care guide: large tank needs, aggressive behavior, feeding, water parameters, and tank mates for Astronotus ocellatus.',
  ARRAY['oscar fish care','oscar fish tank size','oscar fish feeding','Astronotus ocellatus','oscar cichlid','tiger oscar'],
  '#dc2626', true, false
);

-- ============================================================
-- SEED: SPECIES CONTENT TRACKING
-- ============================================================

INSERT INTO species_content (species_id, mdx_path, has_overview, has_habitat, has_care, has_tank_setup, has_feeding, has_behavior, has_compatibility, has_breeding, has_health, has_faq, has_references, quality_score)
SELECT
  s.id,
  'src/content/species/' || s.slug || '.mdx',
  true, true, true, true, true, true, true, true, true, true, true,
  95
FROM species s;

-- ============================================================
-- HELPFUL QUERIES FOR DEVELOPMENT
-- ============================================================

-- Get all published species with FAQ count:
-- SELECT slug, common_name, category, difficulty, faq_count FROM species_with_stats ORDER BY common_name;

-- Full-text search:
-- SELECT slug, common_name, ts_rank(search_vector, query) AS rank
-- FROM species, to_tsquery('english', 'betta') query
-- WHERE search_vector @@ query ORDER BY rank DESC;

-- Fuzzy name search:
-- SELECT slug, common_name, similarity(common_name, 'neon') AS sim
-- FROM species WHERE similarity(common_name, 'neon') > 0.2 ORDER BY sim DESC;

-- Species by category:
-- SELECT slug, common_name, difficulty FROM species WHERE category = 'freshwater' AND published = true;

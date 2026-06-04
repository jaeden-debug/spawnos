-- ============================================================
-- SpawnOS V1 — Supabase Schema
-- Blackwater Aquatics Canada | Powered by Zylx.ai
-- ============================================================
-- INSTRUCTIONS:
-- 1. Go to your Supabase project → SQL Editor
-- 2. Paste this entire file and click "Run"
-- 3. All tables, indexes, RLS policies, and triggers will be created
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE: profiles
-- Extends auth.users with display info
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  display_name TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TABLE: fish
-- Core fish registry
-- ============================================================
CREATE TABLE IF NOT EXISTS public.fish (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  sex                   TEXT NOT NULL DEFAULT 'unknown' CHECK (sex IN ('male', 'female', 'unknown')),
  species               TEXT NOT NULL DEFAULT 'betta',
  strain                TEXT,
  tail_type             TEXT,
  color_base            TEXT,
  pattern_type          TEXT,
  scale_type            TEXT,
  finnage               TEXT,
  body_type             TEXT,
  eye_color             TEXT,
  traits                JSONB,
  genotype_notes        TEXT,
  breeder_notes         TEXT,
  rarity_score          NUMERIC,
  estimated_value_range TEXT,
  photo_url             TEXT,
  birth_date            DATE,
  acquired_date         DATE,
  status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'retired', 'sold', 'deceased')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fish_user_id_idx ON public.fish(user_id);
CREATE INDEX IF NOT EXISTS fish_status_idx ON public.fish(status);
CREATE INDEX IF NOT EXISTS fish_sex_idx ON public.fish(sex);
CREATE INDEX IF NOT EXISTS fish_tail_type_idx ON public.fish(tail_type);
CREATE INDEX IF NOT EXISTS fish_pattern_type_idx ON public.fish(pattern_type);

CREATE TRIGGER fish_updated_at
  BEFORE UPDATE ON public.fish
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: pairs
-- Breeding pair records with prediction data
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pairs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  male_id             UUID NOT NULL REFERENCES public.fish(id) ON DELETE RESTRICT,
  female_id           UUID NOT NULL REFERENCES public.fish(id) ON DELETE RESTRICT,
  pair_name           TEXT,
  goal                TEXT,
  compatibility_score NUMERIC,
  predicted_outcomes  JSONB,
  value_potential     JSONB,
  notes               TEXT,
  status              TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'spawned', 'retired')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pairs_user_id_idx ON public.pairs(user_id);
CREATE INDEX IF NOT EXISTS pairs_male_id_idx ON public.pairs(male_id);
CREATE INDEX IF NOT EXISTS pairs_female_id_idx ON public.pairs(female_id);
CREATE INDEX IF NOT EXISTS pairs_status_idx ON public.pairs(status);

CREATE TRIGGER pairs_updated_at
  BEFORE UPDATE ON public.pairs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: spawns
-- Individual spawn tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS public.spawns (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pair_id           UUID NOT NULL REFERENCES public.pairs(id) ON DELETE RESTRICT,
  spawn_date        DATE,
  hatch_date        DATE,
  estimated_eggs    INTEGER,
  estimated_hatched INTEGER,
  current_fry_count INTEGER,
  survival_rate     NUMERIC,
  stage             TEXT NOT NULL DEFAULT 'eggs' CHECK (
    stage IN ('eggs', 'wrigglers', 'free-swimming', 'growout', 'jarring', 'juvenile', 'sold')
  ),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS spawns_user_id_idx ON public.spawns(user_id);
CREATE INDEX IF NOT EXISTS spawns_pair_id_idx ON public.spawns(pair_id);
CREATE INDEX IF NOT EXISTS spawns_stage_idx ON public.spawns(stage);

CREATE TRIGGER spawns_updated_at
  BEFORE UPDATE ON public.spawns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: spawn_logs
-- Dated entries within a spawn
-- ============================================================
CREATE TABLE IF NOT EXISTS public.spawn_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spawn_id            UUID NOT NULL REFERENCES public.spawns(id) ON DELETE CASCADE,
  log_date            DATE NOT NULL DEFAULT CURRENT_DATE,
  fry_count           INTEGER,
  water_temp          NUMERIC,
  feeding_notes       TEXT,
  water_change_notes  TEXT,
  health_notes        TEXT,
  photos              JSONB,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS spawn_logs_user_id_idx ON public.spawn_logs(user_id);
CREATE INDEX IF NOT EXISTS spawn_logs_spawn_id_idx ON public.spawn_logs(spawn_id);
CREATE INDEX IF NOT EXISTS spawn_logs_date_idx ON public.spawn_logs(log_date);

-- ============================================================
-- TABLE: lineage_links
-- Parent-child relationships between fish
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lineage_links (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_fish_id UUID NOT NULL REFERENCES public.fish(id) ON DELETE CASCADE,
  child_fish_id  UUID NOT NULL REFERENCES public.fish(id) ON DELETE CASCADE,
  relationship   TEXT NOT NULL CHECK (relationship IN ('father', 'mother', 'offspring')),
  spawn_id       UUID REFERENCES public.spawns(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, parent_fish_id, child_fish_id)
);

CREATE INDEX IF NOT EXISTS lineage_links_user_id_idx ON public.lineage_links(user_id);
CREATE INDEX IF NOT EXISTS lineage_links_parent_idx ON public.lineage_links(parent_fish_id);
CREATE INDEX IF NOT EXISTS lineage_links_child_idx ON public.lineage_links(child_fish_id);

-- ============================================================
-- TABLE: fish_notes
-- Notes attached to individual fish
-- ============================================================
CREATE TABLE IF NOT EXISTS public.fish_notes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fish_id    UUID NOT NULL REFERENCES public.fish(id) ON DELETE CASCADE,
  note_type  TEXT NOT NULL DEFAULT 'general' CHECK (
    note_type IN ('health', 'growth', 'breeding', 'trait', 'general')
  ),
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  photos     JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fish_notes_user_id_idx ON public.fish_notes(user_id);
CREATE INDEX IF NOT EXISTS fish_notes_fish_id_idx ON public.fish_notes(fish_id);
CREATE INDEX IF NOT EXISTS fish_notes_type_idx ON public.fish_notes(note_type);

-- ============================================================
-- TABLE: calculator_runs
-- Saved calculator sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.calculator_runs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calculator_type  TEXT NOT NULL,
  input_data       JSONB NOT NULL,
  output_data      JSONB NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS calculator_runs_user_id_idx ON public.calculator_runs(user_id);
CREATE INDEX IF NOT EXISTS calculator_runs_type_idx ON public.calculator_runs(calculator_type);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- All tables are user-scoped. Users can only access their own data.
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fish ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spawns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spawn_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lineage_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fish_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculator_runs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- profiles policies
-- ============================================================
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- fish policies
-- ============================================================
DROP POLICY IF EXISTS "fish_select" ON public.fish;
DROP POLICY IF EXISTS "fish_insert" ON public.fish;
DROP POLICY IF EXISTS "fish_update" ON public.fish;
DROP POLICY IF EXISTS "fish_delete" ON public.fish;

CREATE POLICY "fish_select" ON public.fish FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "fish_insert" ON public.fish FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fish_update" ON public.fish FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "fish_delete" ON public.fish FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- pairs policies
-- ============================================================
DROP POLICY IF EXISTS "pairs_select" ON public.pairs;
DROP POLICY IF EXISTS "pairs_insert" ON public.pairs;
DROP POLICY IF EXISTS "pairs_update" ON public.pairs;
DROP POLICY IF EXISTS "pairs_delete" ON public.pairs;

CREATE POLICY "pairs_select" ON public.pairs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pairs_insert" ON public.pairs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pairs_update" ON public.pairs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "pairs_delete" ON public.pairs FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- spawns policies
-- ============================================================
DROP POLICY IF EXISTS "spawns_select" ON public.spawns;
DROP POLICY IF EXISTS "spawns_insert" ON public.spawns;
DROP POLICY IF EXISTS "spawns_update" ON public.spawns;
DROP POLICY IF EXISTS "spawns_delete" ON public.spawns;

CREATE POLICY "spawns_select" ON public.spawns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "spawns_insert" ON public.spawns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "spawns_update" ON public.spawns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "spawns_delete" ON public.spawns FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- spawn_logs policies
-- ============================================================
DROP POLICY IF EXISTS "spawn_logs_select" ON public.spawn_logs;
DROP POLICY IF EXISTS "spawn_logs_insert" ON public.spawn_logs;
DROP POLICY IF EXISTS "spawn_logs_update" ON public.spawn_logs;
DROP POLICY IF EXISTS "spawn_logs_delete" ON public.spawn_logs;

CREATE POLICY "spawn_logs_select" ON public.spawn_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "spawn_logs_insert" ON public.spawn_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "spawn_logs_update" ON public.spawn_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "spawn_logs_delete" ON public.spawn_logs FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- lineage_links policies
-- ============================================================
DROP POLICY IF EXISTS "lineage_links_select" ON public.lineage_links;
DROP POLICY IF EXISTS "lineage_links_insert" ON public.lineage_links;
DROP POLICY IF EXISTS "lineage_links_update" ON public.lineage_links;
DROP POLICY IF EXISTS "lineage_links_delete" ON public.lineage_links;

CREATE POLICY "lineage_links_select" ON public.lineage_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "lineage_links_insert" ON public.lineage_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lineage_links_update" ON public.lineage_links FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "lineage_links_delete" ON public.lineage_links FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- fish_notes policies
-- ============================================================
DROP POLICY IF EXISTS "fish_notes_select" ON public.fish_notes;
DROP POLICY IF EXISTS "fish_notes_insert" ON public.fish_notes;
DROP POLICY IF EXISTS "fish_notes_update" ON public.fish_notes;
DROP POLICY IF EXISTS "fish_notes_delete" ON public.fish_notes;

CREATE POLICY "fish_notes_select" ON public.fish_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "fish_notes_insert" ON public.fish_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fish_notes_update" ON public.fish_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "fish_notes_delete" ON public.fish_notes FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- calculator_runs policies
-- ============================================================
DROP POLICY IF EXISTS "calculator_runs_select" ON public.calculator_runs;
DROP POLICY IF EXISTS "calculator_runs_insert" ON public.calculator_runs;
DROP POLICY IF EXISTS "calculator_runs_delete" ON public.calculator_runs;

CREATE POLICY "calculator_runs_select" ON public.calculator_runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "calculator_runs_insert" ON public.calculator_runs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "calculator_runs_delete" ON public.calculator_runs FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKET NOTES
-- ============================================================
-- After running this SQL, create a storage bucket for fish photos:
--
-- 1. Go to Supabase Dashboard → Storage
-- 2. Create a new bucket named: fish-photos
-- 3. Set it to PUBLIC (for photo display)
-- 4. Add the following storage policy:
--
-- Policy name: fish-photos-upload
-- Allowed operation: INSERT
-- Policy definition: auth.uid()::text = (storage.foldername(name))[1]
--
-- This allows users to upload to fish-photos/<their-user-id>/...
-- ============================================================

-- ============================================================
-- END OF SCHEMA
-- SpawnOS V1 | Blackwater Aquatics Canada
-- ============================================================

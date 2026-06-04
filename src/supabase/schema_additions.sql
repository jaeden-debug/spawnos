-- ============================================================
-- SpawnOS — Schema Additions
-- Apply this AFTER the base schema.sql
-- ============================================================
-- Run in Supabase SQL Editor:
--   1. Paste and run schema.sql (base)
--   2. Paste and run this file (additions)
-- ============================================================

-- ─── Profiles ──────────────────────────────────────────────────────────────
-- Extended user profile with subscription management and public breeder data.
-- Automatically created when a new user signs up via the trigger below.

CREATE TABLE IF NOT EXISTS public.profiles (
  id                    UUID    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username              TEXT    UNIQUE,
  display_name          TEXT,
  bio                   TEXT,
  location              TEXT,
  website               TEXT,
  avatar_url            TEXT,

  -- Subscription
  subscription_tier     TEXT    NOT NULL DEFAULT 'free'
                        CHECK (subscription_tier IN ('free', 'pro', 'breeder')),
  subscription_status   TEXT    NOT NULL DEFAULT 'active'
                        CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  stripe_customer_id    TEXT    UNIQUE,
  stripe_subscription_id TEXT   UNIQUE,
  trial_ends_at         TIMESTAMPTZ,
  subscription_ends_at  TIMESTAMPTZ,

  -- Breeder public profile
  is_public             BOOLEAN NOT NULL DEFAULT false,
  breeder_since         DATE,
  specialties           TEXT[], -- e.g. ['betta fish', 'cherry shrimp']
  social_instagram      TEXT,
  social_youtube        TEXT,

  -- Meta
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username      ON public.profiles (username);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_cid    ON public.profiles (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_public     ON public.profiles (is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_profiles_tier          ON public.profiles (subscription_tier);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_own_read"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_write"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;

-- Users can read their own profile
CREATE POLICY "profiles_own_read" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_own_write" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Anyone can read public profiles (for /breeders/[username] pages)
CREATE POLICY "profiles_public_read" ON public.profiles
  FOR SELECT USING (is_public = true);

-- ─── Parameter Logs ───────────────────────────────────────────────────────
-- Water test results logged per tank over time.
-- Enables trend charting and proactive health monitoring.

CREATE TABLE IF NOT EXISTS public.parameter_logs (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tank_name   TEXT    NOT NULL DEFAULT 'Main Tank',
  logged_at   DATE    NOT NULL DEFAULT CURRENT_DATE,

  -- Water parameters — all nullable (only log what you test)
  ph          DECIMAL(4,2),
  ammonia     DECIMAL(6,3),
  nitrite     DECIMAL(6,3),
  nitrate     DECIMAL(6,2),
  temperature DECIMAL(4,1),
  gh          DECIMAL(5,1),
  kh          DECIMAL(5,1),
  tds         INTEGER,
  salinity    DECIMAL(5,2),

  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_param_logs_user      ON public.parameter_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_param_logs_user_tank ON public.parameter_logs (user_id, tank_name);
CREATE INDEX IF NOT EXISTS idx_param_logs_date      ON public.parameter_logs (user_id, logged_at DESC);

-- RLS
ALTER TABLE public.parameter_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "param_logs_own" ON public.parameter_logs;

CREATE POLICY "param_logs_own" ON public.parameter_logs
  FOR ALL USING (auth.uid() = user_id);

-- ─── Auto-create profile on signup ────────────────────────────────────────
-- When a new auth user is created, automatically create their profile row.
-- display_name is pulled from the auth metadata if provided during signup.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─── Auto-update updated_at ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─── Helper view: public breeder listing ─────────────────────────────────
-- Used by /breeders index page. Only shows users with is_public = true.

CREATE OR REPLACE VIEW public.public_breeders AS
  SELECT
    p.id,
    p.username,
    p.display_name,
    p.bio,
    p.location,
    p.avatar_url,
    p.specialties,
    p.social_instagram,
    p.social_youtube,
    p.breeder_since,
    p.subscription_tier,
    p.created_at,
    COUNT(DISTINCT f.id)::int  AS fish_count,
    COUNT(DISTINCT s.id)::int  AS spawn_count
  FROM public.profiles p
  LEFT JOIN public.fish f    ON f.user_id = p.id
  LEFT JOIN public.spawns s  ON s.user_id = p.id
  WHERE p.is_public = true
    AND p.username IS NOT NULL
  GROUP BY p.id
  ORDER BY p.created_at DESC;

-- Public read on the view
GRANT SELECT ON public.public_breeders TO anon, authenticated;

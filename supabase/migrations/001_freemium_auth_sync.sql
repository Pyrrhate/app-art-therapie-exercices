-- Pastek Art — Freemium: Auth profiles, cloud sync, RLS
-- Run in Supabase SQL Editor or via: supabase db push

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE public.user_tier AS ENUM ('free', 'premium');

-- ---------------------------------------------------------------------------
-- users (profile linked to auth.users — id mirrors auth.users.id)
-- ---------------------------------------------------------------------------
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  tier public.user_tier NOT NULL DEFAULT 'free',
  premium_sessions_balance INTEGER NOT NULL DEFAULT 3 CHECK (premium_sessions_balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_email_lower_idx ON public.users (lower(email));

COMMENT ON TABLE public.users IS
  'Profil applicatif Pastek Art. tier=premium ou balance>0 → routage LLM premium clarity.';

-- Auto-create profile on sign-up (Magic Link, Google, Apple)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, tier, premium_sessions_balance)
  VALUES (NEW.id, COALESCE(NEW.email, ''), 'free', 3)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- creative_threads (mirror of local FilEntry in AsyncStorage)
-- ---------------------------------------------------------------------------
CREATE TABLE public.creative_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  local_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK (
    source IN (
      'ritual',
      'mandala',
      'nuances',
      'ping-pong',
      'color-journey',
      'emotion-explorer',
      'zen-garden'
    )
  ),
  summary TEXT NOT NULL,
  detail TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, local_id)
);

CREATE INDEX creative_threads_user_created_idx
  ON public.creative_threads (user_id, created_at DESC);

COMMENT ON TABLE public.creative_threads IS
  'Historique Fil créatif synchronisé depuis AsyncStorage (@art_therapie/creative_fil).';

-- ---------------------------------------------------------------------------
-- BYOC stubs (Premium Cloud Sync — step 5)
-- ---------------------------------------------------------------------------
CREATE TYPE public.cloud_provider AS ENUM ('google_drive', 'onedrive');

CREATE TABLE public.user_cloud_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  provider public.cloud_provider NOT NULL,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  provider_account_id TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

CREATE TRIGGER user_cloud_integrations_set_updated_at
  BEFORE UPDATE ON public.user_cloud_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RPC: decrement premium session balance (called from Next.js service role)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.decrement_premium_balance(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE public.users
  SET premium_sessions_balance = GREATEST(premium_sessions_balance - 1, 0)
  WHERE id = p_user_id
    AND tier = 'free'
    AND premium_sessions_balance > 0
  RETURNING premium_sessions_balance INTO new_balance;

  RETURN COALESCE(new_balance, -1);
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_premium_balance(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_premium_balance(UUID) TO service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cloud_integrations ENABLE ROW LEVEL SECURITY;

-- users: read/update own profile only
CREATE POLICY users_select_own ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY users_update_own ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- creative_threads: full CRUD on own rows
CREATE POLICY creative_threads_select_own ON public.creative_threads
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY creative_threads_insert_own ON public.creative_threads
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY creative_threads_update_own ON public.creative_threads
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY creative_threads_delete_own ON public.creative_threads
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- cloud integrations: own rows only
CREATE POLICY cloud_integrations_select_own ON public.user_cloud_integrations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY cloud_integrations_insert_own ON public.user_cloud_integrations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY cloud_integrations_update_own ON public.user_cloud_integrations
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY cloud_integrations_delete_own ON public.user_cloud_integrations
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

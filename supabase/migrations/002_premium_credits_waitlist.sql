-- Pastek Art — 3 crédits premium + liste d'attente lancement officiel
-- Exécuter dans Supabase SQL Editor après 001_freemium_auth_sync.sql

-- ---------------------------------------------------------------------------
-- 3 crédits premium à l'inscription (au lieu de 1)
-- ---------------------------------------------------------------------------
ALTER TABLE public.users
  ALTER COLUMN premium_sessions_balance SET DEFAULT 3;

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

-- Comptes existants encore à 1 crédit (ancienne offre) → passer à 3
UPDATE public.users
SET premium_sessions_balance = 3
WHERE tier = 'free'
  AND premium_sessions_balance = 1;

-- ---------------------------------------------------------------------------
-- launch_waitlist — alerte lancement officiel Premium
-- ---------------------------------------------------------------------------
CREATE TABLE public.launch_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE UNIQUE INDEX launch_waitlist_email_lower_idx
  ON public.launch_waitlist (lower(email));

COMMENT ON TABLE public.launch_waitlist IS
  'Inscriptions alerte lancement officiel Pastek Art Premium (crédits épuisés).';

ALTER TABLE public.launch_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY launch_waitlist_select_own ON public.launch_waitlist
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY launch_waitlist_insert_own ON public.launch_waitlist
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

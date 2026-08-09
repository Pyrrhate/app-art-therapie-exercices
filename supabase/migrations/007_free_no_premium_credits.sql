-- Pastek Art — fin des crédits Premium (produit gratuit)
-- Les colonnes restent pour compatibilité ; plus d'attribution ni de consommation.

ALTER TABLE public.users
  ALTER COLUMN premium_sessions_balance SET DEFAULT 0;

COMMENT ON COLUMN public.users.premium_sessions_balance IS
  'Historique freemium — non consommé. Le produit est gratuit ; BYOK ou HF pour l''IA.';

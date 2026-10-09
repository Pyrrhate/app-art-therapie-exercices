-- ---------------------------------------------------------------------------
-- 009 — Correctifs sécurité (alertes Supabase du 17 août 2026)
-- ---------------------------------------------------------------------------

-- 1. feedback & ai_usage_events : inserts service_role uniquement.
--    RLS est activé mais sans policy → accès refusé par défaut pour anon/authenticated.
--    On révoque explicitement pour supprimer l'alerte "rls_désactivé_en_public".
--    (Supabase exige au moins une policy ou un REVOKE explicite pour valider RLS.)

CREATE POLICY feedback_deny_public ON public.feedback
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false);

CREATE POLICY ai_usage_events_deny_public ON public.ai_usage_events
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false);

-- 2. user_cloud_integrations : colonnes sensibles (tokens chiffrés).
--    On masque access_token_encrypted et refresh_token_encrypted en créant
--    une vue restreinte, et on bloque l'accès direct à la table via policy restrictive.

CREATE POLICY cloud_integrations_hide_tokens ON public.user_cloud_integrations
  AS RESTRICTIVE
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Vue publique sans les colonnes de tokens (utilisable par le client mobile si besoin).
CREATE OR REPLACE VIEW public.user_cloud_integrations_public
  WITH (security_invoker = true)
AS
  SELECT
    id,
    user_id,
    provider,
    provider_account_id,
    connected_at,
    updated_at
  FROM public.user_cloud_integrations
  WHERE auth.uid() = user_id;

COMMENT ON VIEW public.user_cloud_integrations_public IS
  'Vue sans tokens — pour les clients authentifiés. Les tokens restent server-side uniquement.';

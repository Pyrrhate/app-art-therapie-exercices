-- Étend les providers autorisés pour le mode BYOK (clé client, jamais stockée).
ALTER TABLE public.ai_usage_events
  DROP CONSTRAINT IF EXISTS ai_usage_events_provider_check;

ALTER TABLE public.ai_usage_events
  ADD CONSTRAINT ai_usage_events_provider_check
  CHECK (
    provider IS NULL
    OR provider IN (
      'huggingface',
      'mistral',
      'openai',
      'anthropic',
      'local'
    )
  );

COMMENT ON COLUMN public.ai_usage_events.provider IS
  'huggingface | mistral | openai | anthropic | local — openai/anthropic/mistral peuvent être BYOK.';

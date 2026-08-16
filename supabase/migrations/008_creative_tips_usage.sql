-- Autorise le nouvel événement « pistes créatives » (opt-in après exercice).
ALTER TABLE public.ai_usage_events
  DROP CONSTRAINT IF EXISTS ai_usage_events_event_type_check;

ALTER TABLE public.ai_usage_events
  ADD CONSTRAINT ai_usage_events_event_type_check
  CHECK (
    event_type IN (
      'exercise_generate',
      'exercise_augment',
      'exercise_creative_tips',
      'reflection_analyze',
      'reflection_ocr',
      'ping_pong'
    )
  );

-- Alignement providers BYOK déjà utilisés côté API.
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
      'gemini',
      'scaleway',
      'ovhcloud',
      'alephalpha',
      'ollama',
      'cohere',
      'local'
    )
  );

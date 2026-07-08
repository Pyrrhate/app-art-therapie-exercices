-- ---------------------------------------------------------------------------
-- Journal des appels IA (stats admin) — inserts via service role uniquement
-- ---------------------------------------------------------------------------
CREATE TABLE public.ai_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'exercise_generate',
      'exercise_augment',
      'reflection_analyze',
      'reflection_ocr',
      'ping_pong'
    )
  ),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  source TEXT NOT NULL CHECK (source IN ('ai', 'fallback')),
  provider TEXT CHECK (provider IN ('huggingface', 'mistral', 'local')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ai_usage_events_type_created_idx
  ON public.ai_usage_events (event_type, created_at DESC);

CREATE INDEX ai_usage_events_created_idx
  ON public.ai_usage_events (created_at DESC);

ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

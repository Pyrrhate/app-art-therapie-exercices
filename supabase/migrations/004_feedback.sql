-- ---------------------------------------------------------------------------
-- AI reflection feedback (evals loop)
-- Inserts via Next.js service role only — no client-facing RLS policies.
-- ---------------------------------------------------------------------------
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating IN (1, 2, 3)),
  comment TEXT,
  ai_response_text TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX feedback_session_id_idx ON public.feedback (session_id);
CREATE INDEX feedback_created_at_idx ON public.feedback (created_at DESC);
CREATE INDEX feedback_rating_idx ON public.feedback (rating);
CREATE INDEX feedback_prompt_version_idx ON public.feedback (prompt_version);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

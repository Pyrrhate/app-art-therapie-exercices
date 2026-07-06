import { getApiUrl } from "@/lib/config";
import { getSupabaseClient } from "@/lib/supabase/client";

export async function uploadArtworkToCloud(input: {
  imageBase64: string;
  filEntryId?: string;
}): Promise<{ remoteUrl?: string; provider?: string } | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  const base = getApiUrl().replace(/\/$/, "");
  const response = await fetch(`${base}/api/integrations/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) return null;

  return (await response.json()) as {
    remoteUrl?: string;
    provider?: string;
  };
}

/** Upload silencieux après sauvegarde d'une œuvre (compte + cloud connecté). */
export async function tryUploadArtworkToCloud(
  imageBase64: string | undefined,
  filEntryId?: string
): Promise<void> {
  if (!imageBase64 || imageBase64.length < 100) return;
  try {
    await uploadArtworkToCloud({ imageBase64, filEntryId });
  } catch {
    /* non bloquant */
  }
}

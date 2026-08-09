import { isValidSupabaseAnonKey, isValidSupabaseUrl } from "@art-therapie/shared";
import { isEncryptionConfigured } from "@/lib/crypto/secrets";
import { jsonResponse, handleOptions } from "@/lib/cors";
import { isGoogleDriveConfigured } from "@/lib/integrations/google-drive";
import { isOneDriveConfigured } from "@/lib/integrations/onedrive";

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  const hasHfToken = Boolean(process.env.HF_TOKEN?.trim());
  const hasMistralKey = Boolean(process.env.MISTRAL_API_KEY?.trim());
  const supabaseUrl = process.env.SUPABASE_URL?.trim() ?? "";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim() ?? "";
  const hasSupabaseUrl = isValidSupabaseUrl(supabaseUrl);
  const hasSupabaseAnon = isValidSupabaseAnonKey(supabaseAnonKey);
  const hasSupabaseServiceRole = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
  const hasSupabase = hasSupabaseUrl && hasSupabaseServiceRole;
  const textModel =
    process.env.HF_TEXT_MODEL ?? "meta-llama/Llama-3.1-8B-Instruct";
  const visionModel =
    process.env.HF_VISION_MODEL ?? "zai-org/GLM-4.5V:novita";

  return jsonResponse(
    {
      status: "ok",
      provider: process.env.AI_PROVIDER ?? "huggingface",
      aiConfigured: hasHfToken,
      mistralConfigured: hasMistralKey,
      supabaseConfigured: hasSupabase,
      supabaseUrlConfigured: hasSupabaseUrl,
      supabaseAnonConfigured: hasSupabaseAnon,
      supabaseServiceRoleConfigured: hasSupabaseServiceRole,
      supabasePublicConfigured: hasSupabaseUrl && hasSupabaseAnon,
      supabaseAnonValid: hasSupabaseAnon,
      textModel,
      visionModel,
      mistralTextModel: process.env.MISTRAL_TEXT_MODEL ?? "mistral-small-latest",
      reflectionPipeline: "warm-v2",
      aiHint: hasHfToken
        ? undefined
        : "Configurez HF_TOKEN sur Vercel pour activer l'IA (sinon mode secours).",
      gitSha:
        process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
        process.env.GIT_COMMIT_SHA?.slice(0, 7) ??
        null,
      byokBodySupported: true,
      googleDriveConfigured: isGoogleDriveConfigured(),
      oneDriveConfigured: isOneDriveConfigured(),
      integrationEncryptionConfigured: isEncryptionConfigured(),
      timestamp: new Date().toISOString(),
    },
    request
  );
}

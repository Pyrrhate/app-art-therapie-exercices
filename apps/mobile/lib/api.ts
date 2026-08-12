import { getApiUrl } from "./config";
import { getSupabaseClient } from "./supabase/client";
import { resolveByokCredentials } from "./aiKeys";
import { isByokEnabledPath } from "./byok-headers";
import { getPromptOverrides } from "./promptOverrides";
import { getFallbackExercise, getFallbackAugmentedExercise } from "./ritual/fallback";
import { getFallbackPingPongReply } from "./ping-pong/fallback";
import { buildLocalColorMirror } from "./color-journey/mirror-fallback";
import { buildLocalNuanceMirror } from "./nuance-finder/mirror-fallback";
import type {
  ArtisticTechnique,
  ExerciseResponse,
  ReflectionResponse,
} from "./types";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = getSupabaseClient();
  if (!supabase) return {};
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

/**
 * Enrichit le corps JSON : promptOverrides + byok (clé dans le body).
 * Pas de headers X-Custom-AI-* : le preflight CORS les bloque si l'API
 * n'expose que Content-Type / Authorization (cas actuel en prod).
 */
async function enrichAiRequestBody(
  path: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  if (!isByokEnabledPath(path)) return body;

  let next = body;

  try {
    const overrides = await getPromptOverrides();
    if (Object.keys(overrides).length > 0) {
      next = { ...next, promptOverrides: overrides };
    }
  } catch {
    /* overrides optionnels */
  }

  try {
    const credentials = await resolveByokCredentials();
    if (credentials) {
      next = {
        ...next,
        byok: {
          provider: credentials.provider,
          apiKey: credentials.key,
        },
      };
    }
  } catch {
    /* BYOK optionnel */
  }

  return next;
}

class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const base = getApiUrl().replace(/\/$/, "");
  const url = `${base}${path}`;
  const method = (options.method ?? "GET").toUpperCase();
  const headers: Record<string, string> = {
    ...(await getAuthHeaders()),
    ...(options.headers as Record<string, string> | undefined),
  };

  // Content-Type sur GET déclenche un preflight CORS inutile
  if (method !== "GET" && method !== "HEAD" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let body = options.body;
  if (
    typeof body === "string" &&
    method !== "GET" &&
    method !== "HEAD" &&
    isByokEnabledPath(path)
  ) {
    try {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      body = JSON.stringify(await enrichAiRequestBody(path, parsed));
    } catch {
      /* corps non-JSON — laisser tel quel */
    }
  }

  let response: Response;
  try {
    response = await fetch(url, { ...options, method, headers, body });
  } catch {
    const hint =
      base === ""
        ? " Relancez Expo (`npx expo start --web --clear`) pour réactiver le proxy API."
        : ` URL tentée : ${url.split("?")[0]}`;
    throw new ApiError(
      `Impossible de joindre le serveur.${hint}`,
      "NETWORK_ERROR"
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    if (response.status === 413) {
      throw new ApiError(
        "Photo trop lourde (maximum 3 Mo). Choisissez une image plus légère.",
        "IMAGE_TOO_LARGE",
        413
      );
    }
    const contentType = response.headers.get("content-type") ?? "";
    const hint = contentType.includes("text/html")
      ? " Vérifiez que EXPO_PUBLIC_API_URL pointe vers api.pastek-art.eu (pas le site web)."
      : "";
    throw new ApiError(
      `Réponse serveur invalide.${hint}`,
      "INVALID_RESPONSE",
      response.status
    );
  }

  if (!response.ok) {
    const body = data as { error?: string; code?: string };
    throw new ApiError(
      body.error ?? "Une erreur est survenue.",
      body.code,
      response.status
    );
  }

  return data as T;
}

function isRecoverableApiError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return true;
  return (
    error.code === "NETWORK_ERROR" ||
    error.code === "INVALID_RESPONSE" ||
    error.status === 404 ||
    error.status === 503 ||
    error.status === 502
  );
}

export async function generateExercise(
  impulse: string,
  technique: ArtisticTechnique,
  durationMinutes?: number,
  augmentationContext?: string
): Promise<ExerciseResponse> {
  const byokActive = Boolean(await resolveByokCredentials().catch(() => null));

  try {
    return await request<ExerciseResponse>("/api/exercise/generate", {
      method: "POST",
      body: JSON.stringify({
        impulse,
        technique,
        durationMinutes,
        ...(augmentationContext ? { augmentationContext } : {}),
      }),
    });
  } catch (error) {
    // Avec une clé perso, ne pas masquer l'erreur derrière un exercice local silencieux
    if (byokActive) {
      throw error;
    }
    if (isRecoverableApiError(error)) {
      return getFallbackExercise(impulse, technique, durationMinutes);
    }
    throw error;
  }
}

export async function generateAugmentedExercise(
  impulse: string,
  technique: ArtisticTechnique,
  augmentationContext: string,
  durationMinutes?: number
): Promise<ExerciseResponse> {
  const byokActive = Boolean(await resolveByokCredentials().catch(() => null));

  try {
    return await request<ExerciseResponse>("/api/exercise/generate", {
      method: "POST",
      body: JSON.stringify({
        impulse,
        technique,
        durationMinutes,
        augmentationContext,
      }),
    });
  } catch (error) {
    if (byokActive) {
      throw error;
    }
    if (isRecoverableApiError(error)) {
      return getFallbackAugmentedExercise(
        impulse,
        technique,
        augmentationContext,
        durationMinutes
      );
    }
    throw error;
  }
}

export async function analyzeArtwork(context: {
  imageBase64?: string;
  impulse?: string;
  technique?: ArtisticTechnique;
  exercise?: string;
  durationMinutes?: number;
  writtenText?: string;
  colorContext?: string;
  previousReflection?: string;
}): Promise<ReflectionResponse> {
  return request<ReflectionResponse>("/api/reflection/analyze", {
    method: "POST",
    body: JSON.stringify(context),
  });
}

/** Analyse croisée de plusieurs traces du Fil (max 5). */
export async function analyzeFilSelection(payload: {
  entries: Array<{
    summary: string;
    detail?: string;
    impulse?: string;
    technique?: string;
    reflection?: string;
    exercise?: string;
  }>;
}): Promise<ReflectionResponse> {
  const lines = payload.entries.slice(0, 5).map((e, i) => {
    const parts = [
      `Trace ${i + 1} — ${e.summary}`,
      e.impulse ? `Impulsion : ${e.impulse}` : null,
      e.technique ? `Technique : ${e.technique}` : null,
      e.exercise ? `Exercice : ${e.exercise.slice(0, 400)}` : null,
      e.reflection ? `Miroir : ${e.reflection.slice(0, 600)}` : null,
      e.detail ? `Détail : ${e.detail.slice(0, 400)}` : null,
    ].filter(Boolean);
    return parts.join("\n");
  });

  return analyzeArtwork({
    impulse: "Fil créatif",
    exercise: "Lire ces traces ensemble avec bienveillance",
    writtenText: `Voici ${Math.min(payload.entries.length, 5)} traces du Fil créatif à croiser :\n\n${lines.join("\n\n---\n\n")}`,
  });
}

export async function transcribeHandwriting(
  imageBase64: string
): Promise<{ text: string; source: "ai" | "fallback" }> {
  return request<{ text: string; source: "ai" | "fallback" }>(
    "/api/reflection/ocr",
    {
      method: "POST",
      body: JSON.stringify({ imageBase64 }),
    }
  );
}

export type ReflectionFeedbackPayload = {
  rating: 1 | 2 | 3;
  comment?: string | null;
  ai_response_text: string;
  prompt_version: string;
  session_id: string;
};

/** Envoie un retour sur la réflexion IA — ne lève jamais (évite de bloquer l'UI). */
export async function submitReflectionFeedback(
  payload: ReflectionFeedbackPayload
): Promise<boolean> {
  try {
    await request<{ ok: true }>("/api/feedback", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return true;
  } catch {
    return false;
  }
}

export async function checkHealth(): Promise<{
  ok: boolean;
  provider?: string;
  aiConfigured?: boolean;
  textModel?: string;
  visionModel?: string;
  reflectionPipeline?: string;
  aiHint?: string;
}> {
  try {
    const result = await request<{
      status: string;
      provider?: string;
      aiConfigured?: boolean;
      textModel?: string;
      visionModel?: string;
      reflectionPipeline?: string;
      aiHint?: string;
    }>("/api/health");
    return {
      ok: result.status === "ok",
      provider: result.provider,
      aiConfigured: result.aiConfigured,
      textModel: result.textModel,
      visionModel: result.visionModel,
      reflectionPipeline: result.reflectionPipeline,
      aiHint: result.aiHint,
    };
  } catch {
    return { ok: false };
  }
}

type PingPongApiPayload = {
  logicalWord?: string;
  suggestedWord?: string;
  /** Ancien format API (un seul mot) */
  word?: string;
  source?: "ai" | "fallback";
};

export async function fetchPingPongWord(
  word: string,
  history: string[]
): Promise<{ logicalWord: string; suggestedWord: string; source: "ai" | "fallback" }> {
  const data = await request<PingPongApiPayload>("/api/ping-pong", {
    method: "POST",
    body: JSON.stringify({ word, history }),
  });

  const logicalWord = data.logicalWord?.trim() || data.word?.trim();
  const suggestedWord = data.suggestedWord?.trim();

  if (logicalWord && suggestedWord) {
    return {
      logicalWord,
      suggestedWord,
      source: data.source ?? "ai",
    };
  }

  const fallback = getFallbackPingPongReply(word, history);
  return {
    logicalWord: logicalWord || fallback.logicalWord,
    suggestedWord: suggestedWord || fallback.suggestedWord,
    source: data.source ?? (logicalWord ? "ai" : "fallback"),
  };
}

export async function fetchColorJourneyMirror(payload: {
  mode: "turn" | "synthesis";
  turn?: number;
  chosen?: { hex: string; label: string; dimensionId: string };
  history: Array<{ hex: string; label: string; dimensionId: string }>;
}): Promise<{ mirror: string; source: "ai" | "fallback" }> {
  try {
    return await request<{ mirror: string; source: "ai" | "fallback" }>(
      "/api/color-journey/mirror",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  } catch {
    return {
      mirror: buildLocalColorMirror(payload),
      source: "fallback",
    };
  }
}

export async function fetchNuanceMirror(payload: {
  colors: Array<{ hex: string; label: string }>;
  harmonyName?: string;
  discoveredElements?: string[];
  revealedCount: number;
  totalCells: number;
}): Promise<{ mirror: string; source: "ai" | "fallback" }> {
  try {
    return await request<{ mirror: string; source: "ai" | "fallback" }>(
      "/api/nuances/mirror",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  } catch {
    return {
      mirror: buildLocalNuanceMirror(payload),
      source: "fallback",
    };
  }
}

export { ApiError, getApiUrl };

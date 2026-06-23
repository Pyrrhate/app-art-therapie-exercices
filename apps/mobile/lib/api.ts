import { getApiUrl } from "./config";
import { getFallbackExercise, getFallbackAugmentedExercise } from "./ritual/fallback";
import type {
  ArtisticTechnique,
  ExerciseResponse,
  ReflectionResponse,
} from "./types";

const API_URL = getApiUrl();

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
  const url = `${API_URL.replace(/\/$/, "")}${path}`;
  const method = (options.method ?? "GET").toUpperCase();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  // Content-Type sur GET déclenche un preflight CORS inutile
  if (method !== "GET" && method !== "HEAD" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(url, { ...options, method, headers });
  } catch {
    throw new ApiError(
      "Impossible de joindre le serveur. Vérifiez l'URL API et votre connexion.",
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
}): Promise<ReflectionResponse> {
  return request<ReflectionResponse>("/api/reflection/analyze", {
    method: "POST",
    body: JSON.stringify(context),
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

export async function fetchPingPongWord(
  word: string,
  history: string[]
): Promise<{ word: string; source: "ai" | "fallback" }> {
  return request<{ word: string; source: "ai" | "fallback" }>(
    "/api/ping-pong",
    {
      method: "POST",
      body: JSON.stringify({ word, history }),
    }
  );
}

export { ApiError, getApiUrl };

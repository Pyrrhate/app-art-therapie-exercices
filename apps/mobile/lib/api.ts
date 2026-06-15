import { getApiUrl } from "./config";
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
    throw new ApiError(
      "Réponse serveur invalide.",
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

export async function generateExercise(
  impulse: string,
  technique: ArtisticTechnique,
  durationMinutes?: number
): Promise<ExerciseResponse> {
  return request<ExerciseResponse>("/api/exercise/generate", {
    method: "POST",
    body: JSON.stringify({ impulse, technique, durationMinutes }),
  });
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

export async function startColorJourney(context: {
  mood?: string;
  seedWord?: string;
}): Promise<{
  intro: string;
  turn: number;
  dimension: { id: string; title: string; subtitle: string };
  proposals: Array<{ hex: string; label: string; hint: string }>;
  contextNote?: string;
  source: "ai" | "fallback";
}> {
  return request("/api/color-journey/start", {
    method: "POST",
    body: JSON.stringify(context),
  });
}

export async function chooseColorJourney(input: {
  turn: number;
  chosen: { hex: string; label: string; hint?: string };
  history: Array<{ hex: string; label: string; dimensionId: string }>;
  mood?: string;
  seedWord?: string;
}): Promise<{
  reflection: string;
  psychology: string;
  theory: string;
  question?: string;
  source: "ai" | "fallback";
  nextTurn?: number;
  nextDimension?: { id: string; title: string; subtitle: string };
  proposals?: Array<{ hex: string; label: string; hint: string }>;
  contextNote?: string;
}> {
  return request("/api/color-journey/choose", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function synthesizeColorJourney(input: {
  history: Array<{ hex: string; label: string; dimensionId: string }>;
  mood?: string;
}): Promise<{
  summary: string;
  suggestedImpulse: string;
  palette: Array<{ hex: string; label: string; dimensionId: string }>;
  source: "ai" | "fallback";
}> {
  return request("/api/color-journey/synthesize", {
    method: "POST",
    body: JSON.stringify(input),
  });
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

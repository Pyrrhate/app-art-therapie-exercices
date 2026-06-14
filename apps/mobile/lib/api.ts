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
  technique: ArtisticTechnique
): Promise<ExerciseResponse> {
  return request<ExerciseResponse>("/api/exercise/generate", {
    method: "POST",
    body: JSON.stringify({ impulse, technique }),
  });
}

export async function analyzeArtwork(
  imageBase64: string,
  context?: { impulse?: string; technique?: ArtisticTechnique }
): Promise<ReflectionResponse> {
  return request<ReflectionResponse>("/api/reflection/analyze", {
    method: "POST",
    body: JSON.stringify({
      imageBase64,
      ...context,
    }),
  });
}

export async function checkHealth(): Promise<{
  ok: boolean;
  provider?: string;
}> {
  try {
    const result = await request<{ status: string; provider?: string }>(
      "/api/health"
    );
    return { ok: result.status === "ok", provider: result.provider };
  } catch {
    return { ok: false };
  }
}

export { ApiError, getApiUrl };

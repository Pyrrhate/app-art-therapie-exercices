import Constants from "expo-constants";
import type {
  ArtisticTechnique,
  ExerciseResponse,
  ReflectionResponse,
} from "./types";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  "http://localhost:3000";

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

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.error ?? "Une erreur est survenue.",
      data.code,
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

export async function checkHealth(): Promise<boolean> {
  try {
    const result = await request<{ status: string }>("/api/health");
    return result.status === "ok";
  } catch {
    return false;
  }
}

export { ApiError };

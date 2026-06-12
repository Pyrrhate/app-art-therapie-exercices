import { HuggingFaceProvider } from "./huggingface";
import { MistralProvider } from "./mistral";
import type { AIProvider } from "../types";

let cachedProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  const provider = process.env.AI_PROVIDER ?? "huggingface";

  switch (provider) {
    case "mistral":
      cachedProvider = new MistralProvider();
      break;
    case "huggingface":
    default:
      cachedProvider = new HuggingFaceProvider();
      break;
  }

  return cachedProvider;
}

import { HuggingFaceProvider } from "./huggingface";
import { MistralProvider } from "./mistral";
import type { AIProvider } from "../types";

let freeProvider: AIProvider | null = null;
let premiumProvider: AIProvider | null = null;

export function getFreeAIProvider(): AIProvider {
  if (!freeProvider) freeProvider = new HuggingFaceProvider();
  return freeProvider;
}

export function getPremiumAIProvider(): AIProvider {
  if (!premiumProvider) premiumProvider = new MistralProvider();
  return premiumProvider;
}

export function getAIProviderForFreemium(usePremiumLlm: boolean): AIProvider {
  return usePremiumLlm ? getPremiumAIProvider() : getFreeAIProvider();
}

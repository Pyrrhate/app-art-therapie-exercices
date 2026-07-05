const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  azure: "Microsoft",
  email: "Email (lien magique)",
};

export function formatAuthError(
  error: unknown,
  provider?: "google" | "azure" | "email"
): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "msg" in error &&
          typeof (error as { msg: unknown }).msg === "string"
        ? (error as { msg: string }).msg
        : "Connexion impossible.";

  if (
    raw.includes("provider is not enabled") ||
    raw.includes("Unsupported provider")
  ) {
    const label = provider ? PROVIDER_LABELS[provider] : "Ce mode de connexion";
    return `${label} n'est pas activé dans votre projet Supabase.\n\nDashboard → Authentication → Providers → activez-le.\n\nEn attendant, utilisez le lien magique par email.`;
  }

  return raw;
}

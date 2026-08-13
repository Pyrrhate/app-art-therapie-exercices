import i18n from "@/lib/i18n";

function providerLabel(provider?: "google" | "azure" | "email"): string {
  if (provider === "google") return i18n.t("app:auth.providerGoogle");
  if (provider === "azure") return i18n.t("app:auth.providerMicrosoft");
  if (provider === "email") return i18n.t("app:auth.providerEmail");
  return i18n.t("app:auth.providerGeneric");
}

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
        : i18n.t("app:auth.errorGeneric");

  if (
    raw.includes("provider is not enabled") ||
    raw.includes("Unsupported provider")
  ) {
    return i18n.t("app:auth.errorProviderDisabled", {
      label: providerLabel(provider),
    });
  }

  const lower = raw.toLowerCase();
  if (
    lower.includes("no api key found") ||
    lower.includes("invalid api key")
  ) {
    return i18n.t("app:auth.errorInvalidApiKey");
  }

  if (
    lower.includes("code verifier") ||
    lower.includes("flow state") ||
    lower.includes("invalid flow state")
  ) {
    return i18n.t("app:auth.errorFlowExpired");
  }

  return raw;
}

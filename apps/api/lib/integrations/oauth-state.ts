import { createHmac, timingSafeEqual } from "node:crypto";
import type { CloudProviderId } from "./types";

function stateSecret(): string {
  return (
    process.env.OAUTH_STATE_SECRET?.trim() ||
    process.env.INTEGRATION_ENCRYPTION_KEY?.trim() ||
    "pastek-dev-oauth-state"
  );
}

/**
 * State OAuth signé (HMAC) : userId + provider + expiration (15 min).
 * Évite de binder des tokens sur un userId arbitraire.
 */
export function signOAuthState(
  userId: string,
  provider: CloudProviderId
): string {
  const payload = Buffer.from(
    JSON.stringify({
      u: userId,
      p: provider,
      e: Date.now() + 15 * 60_000,
    }),
    "utf8"
  ).toString("base64url");
  const sig = createHmac("sha256", stateSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

/** Retourne userId si valide, sinon null. */
export function verifyOAuthState(
  state: string,
  expectedProvider: CloudProviderId
): string | null {
  const [payload, sig] = state.split(".");
  if (!payload || !sig) return null;

  const expectedSig = createHmac("sha256", stateSecret())
    .update(payload)
    .digest("base64url");

  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as { u?: string; p?: string; e?: number };
    if (
      !data.u ||
      data.p !== expectedProvider ||
      typeof data.e !== "number" ||
      data.e < Date.now()
    ) {
      return null;
    }
    return data.u;
  } catch {
    return null;
  }
}

/** URL de retour app après OAuth (query `connected` forcée). */
export function integrationReturnUrl(provider: CloudProviderId): string {
  const raw =
    process.env.MOBILE_INTEGRATION_RETURN_URL?.trim() ||
    "https://pastek-art.eu/app/premium-cloud";

  try {
    const hasScheme = /^https?:\/\//i.test(raw);
    const url = new URL(hasScheme ? raw : `https://pastek-art.eu${raw}`);
    url.searchParams.set("connected", provider);
    return url.toString();
  } catch {
    return `https://pastek-art.eu/app/premium-cloud?connected=${provider}`;
  }
}

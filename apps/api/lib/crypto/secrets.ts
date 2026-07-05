import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer | null {
  const raw = process.env.INTEGRATION_ENCRYPTION_KEY?.trim();
  if (!raw) return null;

  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }

  const buf = Buffer.from(raw, "base64");
  if (buf.length === 32) return buf;

  console.warn(
    "[crypto] INTEGRATION_ENCRYPTION_KEY invalide (32 octets attendus en hex ou base64)."
  );
  return null;
}

/** Chiffre une valeur sensible (token OAuth). Retourne `iv:tag:ciphertext` en base64. */
export function encryptSecret(plaintext: string): string | null {
  const key = getEncryptionKey();
  if (!key) return null;

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

export function decryptSecret(payload: string): string | null {
  const key = getEncryptionKey();
  if (!key) return null;

  const parts = payload.split(":");
  if (parts.length !== 3) return null;

  try {
    const iv = Buffer.from(parts[0]!, "base64");
    const tag = Buffer.from(parts[1]!, "base64");
    const data = Buffer.from(parts[2]!, "base64");
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

export function isEncryptionConfigured(): boolean {
  return getEncryptionKey() !== null;
}

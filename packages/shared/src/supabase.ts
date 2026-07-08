/** Valide l'URL projet Supabase (pas l'URL de l'API Pastek). */
export function isValidSupabaseUrl(url: string): boolean {
  const trimmed = url.trim();
  return /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(trimmed);
}

/** JWT anon complet (3 segments, commence par eyJ). */
export function isValidSupabaseAnonKey(key: string): boolean {
  const trimmed = key.trim();
  const parts = trimmed.split(".");
  return (
    parts.length === 3 &&
    trimmed.startsWith("eyJ") &&
    parts.every((part) => part.length > 0)
  );
}

export function isValidSupabasePublicConfig(
  url: string,
  anonKey: string
): boolean {
  return isValidSupabaseUrl(url) && isValidSupabaseAnonKey(anonKey);
}

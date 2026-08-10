import type { ReactNode } from "react";

/**
 * Ancien provider Supabase Auth — devenu no-op (local-first, pas de session app).
 * Conservé pour ne pas casser le layout.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return children;
}

import { addFilEntry } from "./storage";
import type { FilEntry } from "./types";

/** Enregistre une trace dans le Fil sans action utilisateur. */
export async function recordFilEntry(
  entry: Omit<FilEntry, "id" | "createdAt">
): Promise<FilEntry> {
  return addFilEntry(entry);
}

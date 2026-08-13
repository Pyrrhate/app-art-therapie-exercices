import { addFilEntry } from "./storage";
import { mergeTags } from "./tags";
import type { FilEntry } from "./types";
import { noteSeasonPractice } from "@/lib/seasons/storage";

/** Enregistre une trace dans le Fil sans action utilisateur. */
export async function recordFilEntry(
  entry: Omit<FilEntry, "id" | "createdAt">
): Promise<FilEntry> {
  let tags = entry.tags;
  let metadata = entry.metadata;

  if (entry.source === "ritual") {
    const season = await noteSeasonPractice();
    if (season) {
      tags = mergeTags(tags, [season.title]);
      metadata = {
        ...metadata,
        seasonId: season.catalogId,
        seasonTitle: season.title,
      };
    }
  }

  return addFilEntry({ ...entry, tags, metadata });
}

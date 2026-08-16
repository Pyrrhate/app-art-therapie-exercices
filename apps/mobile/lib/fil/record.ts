import { addFilEntry } from "./storage";
import { mergeTags } from "./tags";
import type { FilEntry } from "./types";
import i18n from "@/lib/i18n";
import { getSeasonRunTitle } from "@/lib/seasons/catalog";
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
      const seasonTitle = getSeasonRunTitle(
        season,
        i18n.getFixedT(null, "seasons")
      );
      tags = mergeTags(tags, [seasonTitle]);
      metadata = {
        ...metadata,
        seasonId: season.catalogId,
        seasonTitle,
      };
    }
  }

  return addFilEntry({ ...entry, tags, metadata });
}

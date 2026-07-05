import { getFilEntries, replaceFilEntries } from "@/lib/fil/storage";
import type { FilEntry, FilMetadata } from "@/lib/fil/types";
import { getSupabaseClient } from "@/lib/supabase/client";

export interface SyncLocalHistoryResult {
  synced: number;
  skipped: number;
  total: number;
}

let syncInFlight: Promise<SyncLocalHistoryResult> | null = null;

/** Retire les URI locales (file://) — inutilisables hors appareil. */
function metadataForCloud(metadata?: FilMetadata): FilMetadata {
  if (!metadata) return {};
  const { photoUri: _photoUri, ...rest } = metadata;
  return rest;
}

function toCloudRow(entry: FilEntry, userId: string) {
  return {
    user_id: userId,
    local_id: entry.id,
    source: entry.source,
    summary: entry.summary,
    detail: entry.detail ?? null,
    metadata: metadataForCloud(entry.metadata),
    created_at: entry.createdAt,
  };
}

/**
 * Lit le Fil local (AsyncStorage) et pousse les entrées non synchronisées
 * vers Supabase `creative_threads`, puis marque `synced: true` localement.
 */
export async function syncLocalHistoryToCloud(): Promise<SyncLocalHistoryResult> {
  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { synced: 0, skipped: 0, total: 0 };
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return { synced: 0, skipped: 0, total: 0 };
    }

    const entries = await getFilEntries();
    const pending = entries.filter((entry) => !entry.synced);
    const alreadySynced = entries.length - pending.length;

    if (pending.length === 0) {
      return { synced: 0, skipped: alreadySynced, total: entries.length };
    }

    const rows = pending.map((entry) => toCloudRow(entry, session.user.id));
    const { error } = await supabase
      .from("creative_threads")
      .upsert(rows, { onConflict: "user_id,local_id" });

    if (error) {
      throw error;
    }

    const syncedAt = new Date().toISOString();
    const pendingIds = new Set(pending.map((e) => e.id));
    const updated = entries.map((entry) =>
      pendingIds.has(entry.id)
        ? { ...entry, synced: true, syncedAt }
        : entry
    );

    await replaceFilEntries(updated);

    return {
      synced: pending.length,
      skipped: alreadySynced,
      total: entries.length,
    };
  })();

  try {
    return await syncInFlight;
  } finally {
    syncInFlight = null;
  }
}

export async function countUnsyncedFilEntries(): Promise<number> {
  const entries = await getFilEntries();
  return entries.filter((e) => !e.synced).length;
}

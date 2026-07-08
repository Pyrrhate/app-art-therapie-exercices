import { getSupabaseAdmin } from "@/lib/supabase/admin";

export interface FeedbackRow {
  id: string;
  user_id: string | null;
  session_id: string;
  rating: number;
  comment: string | null;
  ai_response_text: string;
  prompt_version: string;
  created_at: string;
}

export interface FeedbackStats {
  total: number;
  perfect: number;
  interesting: number;
  missed: number;
  withComment: number;
}

export interface FeedbackByVersion {
  prompt_version: string;
  total: number;
  avgRating: number;
}

export interface FeedbackListResult {
  items: FeedbackRow[];
  stats: FeedbackStats;
  byVersion: FeedbackByVersion[];
}

export interface FeedbackFilters {
  rating?: 1 | 2 | 3;
  promptVersion?: string;
  limit?: number;
}

function buildStats(rows: Pick<FeedbackRow, "rating" | "comment">[]): FeedbackStats {
  return {
    total: rows.length,
    perfect: rows.filter((r) => r.rating === 3).length,
    interesting: rows.filter((r) => r.rating === 2).length,
    missed: rows.filter((r) => r.rating === 1).length,
    withComment: rows.filter((r) => r.comment?.trim()).length,
  };
}

function buildByVersion(rows: Pick<FeedbackRow, "rating" | "prompt_version">[]): FeedbackByVersion[] {
  const map = new Map<string, { total: number; sum: number }>();

  for (const row of rows) {
    const entry = map.get(row.prompt_version) ?? { total: 0, sum: 0 };
    entry.total += 1;
    entry.sum += row.rating;
    map.set(row.prompt_version, entry);
  }

  return [...map.entries()]
    .map(([prompt_version, { total, sum }]) => ({
      prompt_version,
      total,
      avgRating: total > 0 ? Math.round((sum / total) * 100) / 100 : 0,
    }))
    .sort((a, b) => b.prompt_version.localeCompare(a.prompt_version));
}

export async function listFeedback(
  filters: FeedbackFilters = {}
): Promise<FeedbackListResult | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const limit = Math.min(Math.max(filters.limit ?? 200, 1), 500);

  let query = admin
    .from("feedback")
    .select(
      "id, user_id, session_id, rating, comment, ai_response_text, prompt_version, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.rating) {
    query = query.eq("rating", filters.rating);
  }
  if (filters.promptVersion?.trim()) {
    query = query.eq("prompt_version", filters.promptVersion.trim());
  }

  const { data: items, error } = await query;
  if (error) {
    console.warn("[admin/feedback]", error.message);
    return null;
  }

  const rows = (items ?? []) as FeedbackRow[];

  const { data: allForStats, error: statsError } = await admin
    .from("feedback")
    .select("rating, comment, prompt_version");

  if (statsError) {
    console.warn("[admin/feedback/stats]", statsError.message);
    return {
      items: rows,
      stats: buildStats(rows),
      byVersion: buildByVersion(rows),
    };
  }

  const statsRows = (allForStats ?? []) as Pick<
    FeedbackRow,
    "rating" | "comment" | "prompt_version"
  >[];

  return {
    items: rows,
    stats: buildStats(statsRows),
    byVersion: buildByVersion(statsRows),
  };
}

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  AI_USAGE_EVENT_TYPES,
  type AiUsageEventType,
} from "./usage-types";

export interface UsageEventCounts {
  total: number;
  ai: number;
  fallback: number;
}

export interface UsageSummary {
  allTime: Record<AiUsageEventType, UsageEventCounts>;
  last7Days: Record<AiUsageEventType, number>;
  last24Hours: Record<AiUsageEventType, number>;
  feedbackTotal: number;
  firstEventAt: string | null;
  lastEventAt: string | null;
}

type UsageRow = {
  event_type: string;
  source: string;
  created_at: string;
};

function emptyCounts(): Record<AiUsageEventType, UsageEventCounts> {
  return Object.fromEntries(
    AI_USAGE_EVENT_TYPES.map((type) => [
      type,
      { total: 0, ai: 0, fallback: 0 },
    ])
  ) as Record<AiUsageEventType, UsageEventCounts>;
}

function emptyTotals(): Record<AiUsageEventType, number> {
  return Object.fromEntries(
    AI_USAGE_EVENT_TYPES.map((type) => [type, 0])
  ) as Record<AiUsageEventType, number>;
}

function isEventType(value: string): value is AiUsageEventType {
  return (AI_USAGE_EVENT_TYPES as readonly string[]).includes(value);
}

export async function getUsageSummary(): Promise<UsageSummary | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const [{ data: events, error: eventsError }, { count: feedbackTotal, error: feedbackError }] =
    await Promise.all([
      admin
        .from("ai_usage_events")
        .select("event_type, source, created_at")
        .order("created_at", { ascending: false })
        .limit(10_000),
      admin.from("feedback").select("id", { count: "exact", head: true }),
    ]);

  if (eventsError) {
    console.warn("[admin/usage]", eventsError.message);
    return null;
  }

  if (feedbackError) {
    console.warn("[admin/usage/feedback]", feedbackError.message);
  }

  const rows = (events ?? []) as UsageRow[];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const allTime = emptyCounts();
  const last7Days = emptyTotals();
  const last24Hours = emptyTotals();

  for (const row of rows) {
    if (!isEventType(row.event_type)) continue;

    const bucket = allTime[row.event_type];
    bucket.total += 1;
    if (row.source === "ai") bucket.ai += 1;
    if (row.source === "fallback") bucket.fallback += 1;

    const ageMs = now - new Date(row.created_at).getTime();
    if (ageMs <= 7 * dayMs) {
      last7Days[row.event_type] += 1;
    }
    if (ageMs <= dayMs) {
      last24Hours[row.event_type] += 1;
    }
  }

  return {
    allTime,
    last7Days,
    last24Hours,
    feedbackTotal: feedbackTotal ?? 0,
    firstEventAt: rows.length ? rows[rows.length - 1]!.created_at : null,
    lastEventAt: rows.length ? rows[0]!.created_at : null,
  };
}

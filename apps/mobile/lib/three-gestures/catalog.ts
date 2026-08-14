/** Identifiants de micro-gestes (libellés via amorces:threeGestures.gestures.*). */
export const THREE_GESTURE_IDS = [
  "three_slow_circles",
  "single_breath_line",
  "fill_without_looking_up",
  "press_hard_then_light",
  "non_dominant_marks",
  "dots_then_connect",
  "spiral_from_center",
  "edge_to_edge_sweep",
  "tiny_detail_only",
  "continuous_loop",
  "pause_between_marks",
  "soft_then_bold",
] as const;

export type ThreeGestureId = (typeof THREE_GESTURE_IDS)[number];

export const THREE_GESTURES_OFFER_COUNT = 3;

function shuffle<T>(items: readonly T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

export function pickThreeGestures(
  exclude: readonly ThreeGestureId[] = []
): ThreeGestureId[] {
  const pool = THREE_GESTURE_IDS.filter((id) => !exclude.includes(id));
  const source = pool.length >= THREE_GESTURES_OFFER_COUNT ? pool : THREE_GESTURE_IDS;
  return shuffle(source).slice(0, THREE_GESTURES_OFFER_COUNT);
}

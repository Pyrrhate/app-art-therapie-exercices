/** Identifiants de contraintes douces (libellés via amorces:oneRule.rules.*). */
export const ONE_RULE_IDS = [
  "one_color_only",
  "tiny_format",
  "non_dominant_hand",
  "no_outlines",
  "only_verticals",
  "eyes_closed_first_minute",
  "no_lifting_tool",
  "fill_edges_first",
  "silence_no_music",
  "reuse_one_shape",
  "leave_half_blank",
  "work_very_slow",
] as const;

export type OneRuleId = (typeof ONE_RULE_IDS)[number];

/** Tirages supplémentaires autorisés (en plus du premier). */
export const ONE_RULE_MAX_REDRAWS = 2;

export function pickOneRule(exclude: readonly OneRuleId[] = []): OneRuleId {
  const pool = ONE_RULE_IDS.filter((id) => !exclude.includes(id));
  const source = pool.length > 0 ? pool : ONE_RULE_IDS;
  return source[Math.floor(Math.random() * source.length)]!;
}

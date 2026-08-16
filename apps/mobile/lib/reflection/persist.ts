/**
 * Compose miroir + approfondissement pour stockage / export unifié.
 */
export function composeReflectionWithDeepen(
  reflection: string | null | undefined,
  deepenedReflection: string | null | undefined,
  deepenLabel: string
): string | undefined {
  const base = reflection?.trim() || "";
  const deep = deepenedReflection?.trim() || "";
  if (!base && !deep) return undefined;
  if (!deep) return base;
  if (!base) return deep;
  return `${base}\n\n—— ${deepenLabel} ——\n\n${deep}`;
}

/** Questions à privilégier : approfondissement s'il existe, sinon miroir initial. */
export function resolveOpenQuestionsForPersist(
  openQuestions: string[] | undefined,
  deepenedOpenQuestions: string[] | undefined
): string[] | undefined {
  if (deepenedOpenQuestions && deepenedOpenQuestions.length > 0) {
    return deepenedOpenQuestions;
  }
  if (openQuestions && openQuestions.length > 0) {
    return openQuestions;
  }
  return undefined;
}

import { describe, expect, it } from "vitest";
import {
  deriveExerciseKeywords,
  ensureTechniqueKeyword,
  sanitizeExerciseKeywords,
} from "./exercise-keywords";

describe("deriveExerciseKeywords", () => {
  it("inclut la technique et l'impulsion", () => {
    const keywords = deriveExerciseKeywords("Océan calme", "painting");
    expect(keywords[0]).toBe("Peinture");
    expect(keywords.some((k) => k.toLowerCase().includes("océan"))).toBe(true);
  });

  it("évite les mots vides", () => {
    const keywords = deriveExerciseKeywords("créer", "drawing");
    expect(keywords).not.toContain("Créer");
    expect(keywords.length).toBeGreaterThanOrEqual(2);
  });
});

describe("ensureTechniqueKeyword", () => {
  it("ajoute le label technique s'il manque", () => {
    const result = ensureTechniqueKeyword(["Océan"], "writing");
    expect(result[0]).toBe("Écriture");
  });
});

describe("sanitizeExerciseKeywords", () => {
  it("filtre et limite à 5 mots", () => {
    expect(
      sanitizeExerciseKeywords(["  Bon  ", "", "x", "a".repeat(30), "Mot"])
    ).toEqual(["Bon", "Mot"]);
  });
});

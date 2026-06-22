import { describe, expect, it } from "vitest";
import { getFallbackExercise } from "./fallbacks";
import { deriveExerciseKeywords } from "./exercise-keywords";

describe("getFallbackExercise", () => {
  it("retourne un exercice non vide avec mots-clés", () => {
    const result = getFallbackExercise({
      impulse: "Océan",
      technique: "painting",
      durationMinutes: 30,
    });
    expect(result.exercise.length).toBeGreaterThan(50);
    expect(result.source).toBe("fallback");
    expect(result.durationMinutes).toBe(30);
    expect(result.keywords.length).toBeGreaterThan(0);
  });

  it("adapte le ton pour les techniques performatives", () => {
    const result = getFallbackExercise({
      impulse: "Liberté",
      technique: "dance",
      durationMinutes: 15,
    });
    expect(result.exercise.toLowerCase()).toContain("mouvement");
  });
});

describe("deriveExerciseKeywords", () => {
  it("aligne mobile et API", () => {
    const keywords = deriveExerciseKeywords("Forêt", "drawing");
    expect(keywords[0]).toBe("Dessin");
  });
});

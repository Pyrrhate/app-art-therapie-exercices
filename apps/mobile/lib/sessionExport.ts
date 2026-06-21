import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import { formatSessionDate, getTechniqueLabel } from "@/constants";
import { sanitizeAiDisplayText } from "@/lib/sanitizeAiText";
import type { SavedSession } from "@/lib/types";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSessionHtml(session: SavedSession): string {
  const exercise = escapeHtml(sanitizeAiDisplayText(session.exercise));
  const reflection = session.reflection
    ? sanitizeAiDisplayText(session.reflection)
    : "";
  const paragraphs = reflection
    .split(/\n\s*\n/)
    .filter((p) => p.trim())
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("");
  const questions = (session.openQuestions ?? [])
    .map((q) => `<li>${escapeHtml(sanitizeAiDisplayText(q))}</li>`)
    .join("");
  const written = session.writtenText
    ? `<section><h2>Texte écrit</h2><p>${escapeHtml(session.writtenText)}</p></section>`
    : "";
  const followUp = session.followUpExercise
    ? `<section><h2>Poursuite suggérée</h2><p>${escapeHtml(sanitizeAiDisplayText(session.followUpExercise))}</p></section>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Exercice — ${escapeHtml(session.impulse)}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    body { font-family: Georgia, serif; color: #3d3530; background: #FAF7F4; line-height: 1.65; margin: 0; padding: 24px; }
    h1 { font-weight: 300; font-size: 1.75rem; margin: 0 0 8px; color: #2c2622; }
    .meta { color: #8a7a6e; font-size: 0.9rem; margin-bottom: 24px; }
    h2 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #6B8F71; margin: 24px 0 8px; }
    section { background: #fff; border: 1px solid #e8dfd8; border-radius: 12px; padding: 16px 20px; margin-bottom: 16px; }
    p { margin: 0 0 12px; }
    p:last-child { margin-bottom: 0; }
    .reflection p { font-style: italic; color: #4a5c4d; }
    ul { margin: 0; padding-left: 1.2rem; }
    footer { margin-top: 32px; font-size: 0.75rem; color: #b8a090; text-align: center; }
  </style>
</head>
<body>
  <h1>${escapeHtml(session.impulse)}</h1>
  <p class="meta">${escapeHtml(formatSessionDate(session.createdAt))} · ${escapeHtml(getTechniqueLabel(session.technique))} · ${session.durationMinutes} min</p>
  <section><h2>Exercice</h2><p>${exercise}</p></section>
  ${written}
  ${
    paragraphs
      ? `<section class="reflection"><h2>Miroir créatif</h2>${paragraphs}</section>`
      : ""
  }
  ${
    questions
      ? `<section><h2>Questions d'exploration</h2><ul>${questions}</ul></section>`
      : ""
  }
  ${followUp}
  <footer>Art Thérapie — export local</footer>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
}

function exportWebPdf(html: string): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error(
      "Popup bloquée — autorisez les fenêtres pour exporter en PDF"
    );
  }
  printWindow.document.write(html);
  printWindow.document.close();
}

async function exportNativeHtml(
  html: string,
  filename: string
): Promise<string> {
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, html, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return uri;
}

import type { FilEntry } from "@/lib/fil/types";
import type { SavedSession } from "@/lib/types";

export async function exportFilRitualPdf(
  entry: FilEntry
): Promise<{ uri?: string; message: string }> {
  const m = entry.metadata;
  if (!m?.technique || !m.exercise) {
    throw new Error("Cette trace ne contient pas de fiche d'exercice complète.");
  }
  return exportSessionPdf({
    id: entry.id,
    impulse: m.impulse ?? entry.summary,
    technique: m.technique,
    exercise: m.exercise,
    durationMinutes: m.durationMinutes ?? 15,
    photoUri: m.photoUri,
    reflection: m.reflection,
    openQuestions: m.openQuestions,
    writtenText: m.writtenText,
    followUpExercise: m.followUpExercise,
    createdAt: entry.createdAt,
  });
}

export async function exportSessionPdf(
  session: SavedSession
): Promise<{ uri?: string; message: string }> {
  const html = buildSessionHtml(session);
  const filename = `exercice-${session.id.slice(0, 8)}.html`;

  if (Platform.OS === "web") {
    exportWebPdf(html);
    return {
      message:
        "Fenêtre d'impression ouverte — choisissez « Enregistrer en PDF ».",
    };
  }

  const uri = await exportNativeHtml(html, filename);
  try {
    const Sharing = await import("expo-sharing");
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "text/html",
        dialogTitle: "Exporter votre exercice",
      });
      return {
        uri,
        message: "Fiche partagée — ouvrez-la dans le navigateur pour imprimer.",
      };
    }
  } catch {
    /* expo-sharing optionnel */
  }

  return { uri, message: `Fiche enregistrée : ${uri}` };
}

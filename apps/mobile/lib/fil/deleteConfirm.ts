import { Alert, Platform } from "react-native";

function truncateSummary(summary: string, max = 72): string {
  const trimmed = summary.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

/** Confirmation avant de retirer une trace du Fil. */
export async function confirmDeleteFilEntry(summary: string): Promise<boolean> {
  const excerpt = truncateSummary(summary);
  const message = excerpt
    ? `« ${excerpt} » sera définitivement retirée de votre Fil sur cet appareil.`
    : "Cette trace sera définitivement retirée de votre Fil sur cet appareil.";

  if (Platform.OS === "web") {
    return window.confirm(`Supprimer cette trace ?\n\n${message}`);
  }

  return new Promise((resolve) => {
    Alert.alert("Supprimer cette trace ?", message, [
      { text: "Annuler", style: "cancel", onPress: () => resolve(false) },
      { text: "Supprimer", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

/** Double confirmation avant d'effacer l'intégralité du Fil. */
export async function confirmClearAllFil(count: number): Promise<boolean> {
  const countLabel =
    count === 1 ? "1 trace" : `${count} traces`;

  if (Platform.OS === "web") {
    const first = window.confirm(
      `Effacer tout le Fil créatif ?\n\n${countLabel} seront supprimées.\n\nVous pouvez aussi retirer les traces une par une depuis leur fiche.`
    );
    if (!first) return false;

    return window.confirm(
      `Dernière confirmation\n\nEffacer définitivement ${countLabel} ? Cette action est irréversible.`
    );
  }

  return new Promise((resolve) => {
    Alert.alert(
      "Effacer tout le Fil ?",
      `${countLabel} seront supprimées de cet appareil.\n\nPour un contrôle fin, retirez les traces une par une depuis leur fiche.`,
      [
        { text: "Annuler", style: "cancel", onPress: () => resolve(false) },
        {
          text: "Continuer",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Dernière confirmation",
              `Effacer définitivement ${countLabel} ? Cette action est irréversible.`,
              [
                { text: "Annuler", style: "cancel", onPress: () => resolve(false) },
                {
                  text: "Tout effacer",
                  style: "destructive",
                  onPress: () => resolve(true),
                },
              ]
            );
          },
        },
      ]
    );
  });
}

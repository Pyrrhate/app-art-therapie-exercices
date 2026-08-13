import { Alert, Platform } from "react-native";
import i18n from "@/lib/i18n";

function truncateSummary(summary: string, max = 72): string {
  const trimmed = summary.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

/** Confirmation avant de retirer une trace du Fil. */
export async function confirmDeleteFilEntry(summary: string): Promise<boolean> {
  const t = i18n.getFixedT(null, "fil");
  const excerpt = truncateSummary(summary);
  const title = t("confirm.deleteTitle");
  const message = excerpt
    ? t("confirm.deleteBodyExcerpt", { excerpt })
    : t("confirm.deleteBody");

  if (Platform.OS === "web") {
    return window.confirm(`${title}\n\n${message}`);
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      {
        text: t("confirm.cancel"),
        style: "cancel",
        onPress: () => resolve(false),
      },
      {
        text: t("confirm.delete"),
        style: "destructive",
        onPress: () => resolve(true),
      },
    ]);
  });
}

/** Double confirmation avant d'effacer l'intégralité du Fil. */
export async function confirmClearAllFil(count: number): Promise<boolean> {
  const t = i18n.getFixedT(null, "fil");
  const countLabel = t("confirm.count", { count });

  if (Platform.OS === "web") {
    const first = window.confirm(
      `${t("confirm.clearTitleWeb")}\n\n${t("confirm.clearBodyWeb", { countLabel })}`
    );
    if (!first) return false;

    return window.confirm(
      `${t("confirm.finalTitle")}\n\n${t("confirm.finalBody", { countLabel })}`
    );
  }

  return new Promise((resolve) => {
    Alert.alert(t("confirm.clearTitle"), t("confirm.clearBody", { countLabel }), [
      {
        text: t("confirm.cancel"),
        style: "cancel",
        onPress: () => resolve(false),
      },
      {
        text: t("confirm.clearContinue"),
        style: "destructive",
        onPress: () => {
          Alert.alert(
            t("confirm.finalTitle"),
            t("confirm.finalBody", { countLabel }),
            [
              {
                text: t("confirm.cancel"),
                style: "cancel",
                onPress: () => resolve(false),
              },
              {
                text: t("confirm.clearConfirm"),
                style: "destructive",
                onPress: () => resolve(true),
              },
            ]
          );
        },
      },
    ]);
  });
}

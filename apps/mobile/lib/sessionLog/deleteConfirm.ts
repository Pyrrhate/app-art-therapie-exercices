import { Alert, Platform } from "react-native";
import i18n from "@/lib/i18n";

export async function confirmDeleteJournalEntry(): Promise<boolean> {
  const t = i18n.getFixedT(null, "journal");
  const title = t("deleteConfirmTitle");
  const message = t("deleteConfirmBody");

  if (Platform.OS === "web") {
    return window.confirm(`${title}\n\n${message}`);
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      {
        text: i18n.t("common:actions.cancel"),
        style: "cancel",
        onPress: () => resolve(false),
      },
      {
        text: t("delete"),
        style: "destructive",
        onPress: () => resolve(true),
      },
    ]);
  });
}

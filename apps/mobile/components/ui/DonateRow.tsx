import { View } from "react-native";
import { KofiDonateLink } from "@/components/ui/KofiDonateLink";

/** Ligne Donate alignée à droite, marges compactes au-dessus de la nav. */
export function DonateRow() {
  return (
    <View
      className="w-full flex-row justify-end"
      style={{ marginTop: 5, marginBottom: 15 }}
    >
      <KofiDonateLink />
    </View>
  );
}

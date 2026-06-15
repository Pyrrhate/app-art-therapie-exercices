import { useState } from "react";
import { Text, View } from "react-native";
import { PrimaryButton } from "@/components/ui/Button";
import { addFilEntry } from "@/lib/fil/storage";
import type { FilEntry } from "@/lib/fil/types";

interface AddToFilBarProps {
  entry: Omit<FilEntry, "id" | "createdAt">;
  onAdded?: () => void;
}

export function AddToFilBar({ entry, onAdded }: AddToFilBarProps) {
  const [added, setAdded] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (added || saving) return;
    setSaving(true);
    try {
      await addFilEntry(entry);
      setAdded(true);
      onAdded?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="bg-white rounded-2xl border border-sand-200 px-4 py-4 mt-4">
      <Text className="text-sand-600 text-sm leading-6 mb-3">
        {added
          ? "Trace ajoutée à votre Fil créatif."
          : "Conserver une trace de ce moment dans votre Fil ?"}
      </Text>
      {!added && (
        <PrimaryButton
          label={saving ? "…" : "Ajouter au Fil"}
          onPress={handleAdd}
          variant="ghost"
          disabled={saving}
        />
      )}
    </View>
  );
}

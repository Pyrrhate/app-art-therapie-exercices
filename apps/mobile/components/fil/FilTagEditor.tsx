import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { PrimaryButton } from "@/components/ui/Button";
import {
  FIL_MAX_TAG_LENGTH,
  FIL_MAX_TAGS_PER_ENTRY,
  mergeTags,
  normalizeTag,
} from "@/lib/fil/tags";
import { FilTagChip } from "./FilTagChip";
import { panelBg, textMuted, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface FilTagEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export function FilTagEditor({ tags, onChange }: FilTagEditorProps) {
  const isDark = useIsDark();
  const [draft, setDraft] = useState("");

  function addTag() {
    const next = normalizeTag(draft);
    if (!next) return;
    onChange(mergeTags(tags, [next]));
    setDraft("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t.toLowerCase() !== tag.toLowerCase()));
  }

  const canAdd = tags.length < FIL_MAX_TAGS_PER_ENTRY;

  return (
    <View className={`rounded-3xl border px-5 py-5 ${panelBg(isDark)}`}>
      <Text className="text-sage-600 text-xs uppercase tracking-wider mb-3">
        Vos tags
      </Text>
      <Text className={`text-sm leading-6 mb-3 ${textSecondary(isDark)}`}>
        Ajoutez des mots à vous — en plus de la technique, qui s&apos;affiche
        toute seule.
      </Text>
      {tags.length > 0 ? (
        <View className="flex-row flex-wrap gap-2 mb-3">
          {tags.map((tag) => (
            <View key={tag} className="flex-row items-center">
              <FilTagChip label={tag} />
              <Pressable
                onPress={() => removeTag(tag)}
                hitSlop={8}
                accessibilityLabel={`Retirer le tag ${tag}`}
                className="ml-1"
              >
                <Text className={`text-xs ${textMuted(isDark)}`}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <Text className={`text-xs mb-3 ${textMuted(isDark)}`}>
          Aucun tag personnel pour l&apos;instant.
        </Text>
      )}
      {canAdd ? (
        <View className="gap-2">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="ex. nocturne, A6, encre…"
            placeholderTextColor={isDark ? "#8A8078" : "#B8A090"}
            maxLength={FIL_MAX_TAG_LENGTH}
            onSubmitEditing={addTag}
            returnKeyType="done"
            className={`rounded-2xl border px-4 py-3 text-base ${
              isDark
                ? "border-sand-600 bg-sand-900 text-sand-100"
                : "border-sand-200 bg-white text-sand-800"
            }`}
          />
          <PrimaryButton
            label="Ajouter le tag"
            onPress={addTag}
            variant="ghost"
            disabled={!normalizeTag(draft)}
          />
        </View>
      ) : (
        <Text className={`text-xs ${textMuted(isDark)}`}>
          Maximum {FIL_MAX_TAGS_PER_ENTRY} tags par trace.
        </Text>
      )}
    </View>
  );
}

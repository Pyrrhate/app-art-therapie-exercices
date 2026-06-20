import { useCallback, useState } from "react";
import { Alert, Image, Platform, Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { HoverScale } from "@/components/emotion-explorer/HoverScale";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { ContentCard } from "@/components/ui/Card";
import { ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { formatSessionDate, getTechniqueLabel } from "@/constants";
import { sanitizeAiDisplayText } from "@/lib/sanitizeAiText";
import { deleteSession, getSessions } from "@/lib/storage";
import { panelBg, textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";
import type { ArtisticTechnique, SavedSession } from "@/lib/types";

const TECHNIQUE_ACCENT: Record<ArtisticTechnique, string> = {
  drawing: "#6B8F71",
  painting: "#A8856A",
  writing: "#8FA88A",
  mixed_media: "#C4A484",
  collage: "#9A8070",
  volume: "#7A6558",
  recyclart: "#527058",
  video: "#5C4D42",
  music: "#8FA88A",
  dance: "#C4A484",
  theatre: "#A8856A",
};

function SessionListItem({
  item,
  onDelete,
  isDark,
}: {
  item: SavedSession;
  onDelete: (id: string) => void;
  isDark: boolean;
}) {
  const exercise = sanitizeAiDisplayText(item.exercise);
  const accent = TECHNIQUE_ACCENT[item.technique] ?? "#6B8F71";

  const card = (
    <View className={`rounded-3xl border overflow-hidden mb-4 ${panelBg(isDark)}`}>
      <View style={{ height: 4, backgroundColor: accent }} />
      {item.photoUri ? (
        <Image
          source={{ uri: item.photoUri }}
          className="w-full h-36 bg-sand-100"
          resizeMode="cover"
        />
      ) : null}
      <View className="px-5 py-4">
        <Text className={`text-xs mb-2 ${textMuted(isDark)}`}>
          {formatSessionDate(item.createdAt)}
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-3">
          <View
            className="rounded-full px-3 py-1"
            style={{ backgroundColor: `${accent}22` }}
          >
            <Text className={`text-xs font-medium ${textPrimary(isDark)}`}>
              {getTechniqueLabel(item.technique)}
            </Text>
          </View>
          <View
            className={`rounded-full px-3 py-1 ${isDark ? "bg-sand-700" : "bg-sand-100"}`}
          >
            <Text className={`text-xs ${textSecondary(isDark)}`}>
              {item.durationMinutes} min
            </Text>
          </View>
        </View>
        <Text className={`font-medium text-base mb-2 ${textPrimary(isDark)}`}>
          {item.impulse}
        </Text>
        {exercise ? (
          <Text className={`text-sm leading-6 ${textSecondary(isDark)}`} numberOfLines={3}>
            {exercise}
          </Text>
        ) : null}
        <View className="flex-row justify-between items-center mt-4">
          <Text className="text-sage-600 text-sm">Voir le détail →</Text>
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onDelete(item.id);
            }}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Supprimer cette session"
          >
            <Text className={`text-xs ${textMuted(isDark)}`}>Supprimer</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  if (Platform.OS === "web") {
    return (
      <HoverScale
        onPress={() => router.push(`/sessions/${item.id}`)}
        hoverScale={1.01}
        accessibilityRole="button"
      >
        {card}
      </HoverScale>
    );
  }

  return (
    <Pressable
      onPress={() => router.push(`/sessions/${item.id}`)}
      accessibilityRole="button"
    >
      {card}
    </Pressable>
  );
}

export default function SessionsListScreen() {
  const isDark = useIsDark();
  const [sessions, setSessions] = useState<SavedSession[]>([]);

  const load = useCallback(async () => {
    const all = await getSessions();
    setSessions(all.filter((s) => s.exercise?.trim()));
  }, []);

  async function handleRefresh() {
    await load();
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function confirmDelete(id: string) {
    if (Platform.OS === "web") {
      if (
        window.confirm(
          "Supprimer cet exercice sauvegardé ? Cette action est irréversible."
        )
      ) {
        void deleteSession(id).then(load);
      }
      return;
    }
    Alert.alert(
      "Supprimer cet exercice ?",
      "Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            await deleteSession(id);
            load();
          },
        },
      ]
    );
  }

  return (
    <ScreenContainer scrollable refreshable onRefresh={handleRefresh}>
      <ScreenNavBar />

      <PastekScreenHero
        label="Vos traces"
        title="Mes exercices "
        accent="sauvegardés"
        description="Vos fiches d'exercice, gardées localement sur cet appareil — à relire ou à refaire quand vous en avez envie."
        className="mb-6"
      />

      {sessions.length === 0 ? (
        <ContentCard className="border-dashed items-center py-12">
          <Text className={`text-center leading-6 ${textSecondary(isDark)}`}>
            Aucune fiche pour l&apos;instant.{"\n"}
            Parcourez un rituel guidé, réalisez l&apos;exercice, puis sauvegardez-le pour le retrouver ici.
          </Text>
        </ContentCard>
      ) : (
        sessions.map((item) => (
          <SessionListItem
            key={item.id}
            item={item}
            onDelete={confirmDelete}
            isDark={isDark}
          />
        ))
      )}
    </ScreenContainer>
  );
}

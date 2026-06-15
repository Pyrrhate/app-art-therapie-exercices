import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { formatSessionDate, getTechniqueLabel } from "@/constants";
import { sanitizeAiDisplayText } from "@/lib/sanitizeAiText";
import { deleteSession, getSessions } from "@/lib/storage";
import type { SavedSession } from "@/lib/types";

function SessionListItem({
  item,
  onDelete,
}: {
  item: SavedSession;
  onDelete: (id: string) => void;
}) {
  const exercise = sanitizeAiDisplayText(item.exercise);

  return (
    <Pressable
      onPress={() => router.push(`/sessions/${item.id}`)}
      className="bg-white rounded-2xl border border-sand-200 overflow-hidden mb-4 active:border-sage-400"
    >
      {item.photoUri ? (
        <Image
          source={{ uri: item.photoUri }}
          className="w-full h-36 bg-sand-100"
          resizeMode="cover"
        />
      ) : null}
      <View className="px-5 py-4">
        <Text className="text-sand-400 text-xs mb-1">
          {formatSessionDate(item.createdAt)}
        </Text>
        <Text className="text-sand-800 font-medium text-base mb-1">
          {item.impulse}
        </Text>
        <Text className="text-sand-500 text-sm mb-2">
          {getTechniqueLabel(item.technique)} · {item.durationMinutes} min
        </Text>
        {exercise ? (
          <Text className="text-sand-600 text-sm leading-6" numberOfLines={3}>
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
            hitSlop={8}
          >
            <Text className="text-sand-400 text-xs">Supprimer</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

export default function SessionsListScreen() {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const all = await getSessions();
    setSessions(all.filter((s) => s.exercise?.trim()));
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    load();
  }, [load]);

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
    <ScreenContainer scrollable={false}>
      <ScreenNavBar />

      <ScrollView
        className="flex-1"
        style={Platform.OS === "web" ? { flex: 1, minHeight: 0 } : { flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#6B8F71"]}
            tintColor="#6B8F71"
          />
        }
      >
        <Text className="text-sage-500 text-sm uppercase tracking-widest mb-2">
          Mémoire des pratiques
        </Text>
        <Text className="text-3xl font-light text-sand-800 mb-2">
          Mes exercices sauvegardés
        </Text>
        <Text className="text-sand-500 text-base mb-6 leading-6">
          Vos fiches d&apos;exercice, gardées localement sur cet appareil — à relire ou à refaire quand vous en avez envie.
        </Text>

        {sessions.length === 0 ? (
          <View className="bg-white rounded-2xl border border-dashed border-sand-300 px-6 py-12 items-center">
            <Text className="text-sand-400 text-center leading-6">
              Aucune fiche pour l&apos;instant.{"\n"}
              Parcourez un rituel guidé, réalisez l&apos;exercice, puis sauvegardez-le pour le retrouver ici.
            </Text>
          </View>
        ) : (
          sessions.map((item) => (
            <SessionListItem
              key={item.id}
              item={item}
              onDelete={confirmDelete}
            />
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

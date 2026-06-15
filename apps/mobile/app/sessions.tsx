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
import { useFocusEffect } from "expo-router";
import { ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { formatSessionDate, getTechniqueLabel } from "@/constants";
import { sanitizeAiDisplayText } from "@/lib/sanitizeAiText";
import { deleteSession, getSessions } from "@/lib/storage";
import type { SavedSession } from "@/lib/types";

function SessionCard({
  item,
  onDelete,
}: {
  item: SavedSession;
  onDelete: (id: string) => void;
}) {
  const exercise = sanitizeAiDisplayText(item.exercise);
  const reflection = item.reflection
    ? sanitizeAiDisplayText(item.reflection)
    : "";
  const reflectionParagraphs = reflection
    ? reflection.split(/\n\s*\n/).filter((p) => p.trim())
    : [];

  return (
    <View className="bg-white rounded-2xl border border-sand-200 overflow-hidden mb-4">
      {item.photoUri ? (
        <Image
          source={{ uri: item.photoUri }}
          className="w-full h-44 bg-sand-100"
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
        <Text className="text-sand-500 text-sm mb-4">
          {getTechniqueLabel(item.technique)} · {item.durationMinutes} min
        </Text>

        {exercise ? (
          <View className="mb-4">
            <Text className="text-sand-700 text-xs uppercase tracking-wider mb-2">
              Exercice
            </Text>
            <Text className="text-sand-700 text-sm leading-6">{exercise}</Text>
          </View>
        ) : null}

        {reflectionParagraphs.length > 0 ? (
          <View className="mb-2">
            <Text className="text-sage-600 text-xs uppercase tracking-wider mb-2">
              Miroir créatif
            </Text>
            {reflectionParagraphs.map((paragraph, index) => (
              <Text
                key={index}
                className="text-sage-700 text-sm leading-6 mb-3 italic"
              >
                {paragraph}
              </Text>
            ))}
          </View>
        ) : null}

        {item.openQuestions?.length ? (
          <View className="mt-2 mb-2">
            {item.openQuestions.map((q, i) => (
              <Text key={i} className="text-sand-500 text-sm leading-6 mb-1">
                · {sanitizeAiDisplayText(q)}
              </Text>
            ))}
          </View>
        ) : null}

        <Pressable onPress={() => onDelete(item.id)} className="mt-4">
          <Text className="text-sand-400 text-xs">Supprimer</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function SessionsScreen() {
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
        <Text className="text-3xl font-light text-sand-800 mb-2">
          Mes exercices
        </Text>
        <Text className="text-sand-500 text-base mb-6 leading-6">
          Rituels créatifs sauvegardés sur cet appareil — exercice et réflexion
          complets.
        </Text>

        {sessions.length === 0 ? (
          <View className="bg-white rounded-2xl border border-dashed border-sand-300 px-6 py-12 items-center">
            <Text className="text-sand-400 text-center leading-6">
              Aucun exercice sauvegardé.{"\n"}
              Terminez un rituel et appuyez sur « Sauvegarder localement ».
            </Text>
          </View>
        ) : (
          sessions.map((item) => (
            <SessionCard
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

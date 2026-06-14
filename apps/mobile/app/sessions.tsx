import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { formatSessionDate, getTechniqueLabel } from "@/constants";
import { sanitizeAiDisplayText } from "@/lib/sanitizeAiText";
import { deleteSession, getSessions } from "@/lib/storage";
import type { SavedSession } from "@/lib/types";

export default function SessionsScreen() {
  const [sessions, setSessions] = useState<SavedSession[]>([]);

  const load = useCallback(async () => {
    setSessions(await getSessions());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    load();
  }, [load]);

  function confirmDelete(id: string) {
    Alert.alert(
      "Supprimer cette session ?",
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
    <View className="flex-1 bg-sand-50 px-6 pt-16 pb-8">
      <Pressable onPress={() => router.back()} className="mb-8">
        <Text className="text-sage-500 text-base">← Retour</Text>
      </Pressable>

      <Text className="text-3xl font-light text-sand-800 mb-2">
        Mes sessions
      </Text>
      <Text className="text-sand-500 text-base mb-8 leading-6">
        Vos rituels sauvegardés sur cet appareil uniquement.
      </Text>

      {sessions.length === 0 ? (
        <View className="bg-white rounded-2xl border border-dashed border-sand-300 px-6 py-12 items-center">
          <Text className="text-sand-400 text-center leading-6">
            Aucune session pour l'instant.{"\n"}
            Terminez un rituel et appuyez sur « Sauvegarder ».
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 16, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <View className="bg-white rounded-2xl border border-sand-200 overflow-hidden">
              {item.photoUri && (
                <Image
                  source={{ uri: item.photoUri }}
                  className="w-full h-40 bg-sand-100"
                  resizeMode="cover"
                />
              )}
              <View className="px-5 py-4">
                <Text className="text-sand-400 text-xs mb-1">
                  {formatSessionDate(item.createdAt)}
                </Text>
                <Text className="text-sand-800 font-medium text-base mb-1">
                  {item.impulse}
                </Text>
                <Text className="text-sand-500 text-sm mb-3">
                  {getTechniqueLabel(item.technique)}
                </Text>
                {sanitizeAiDisplayText(item.exercise) ? (
                  <Text className="text-sand-600 text-sm leading-5" numberOfLines={3}>
                    {sanitizeAiDisplayText(item.exercise)}
                  </Text>
                ) : null}
                {item.reflection && sanitizeAiDisplayText(item.reflection) ? (
                  <Text className="text-sage-600 text-sm mt-3 italic leading-5" numberOfLines={2}>
                    {sanitizeAiDisplayText(item.reflection)}
                  </Text>
                ) : null}
                <Pressable onPress={() => confirmDelete(item.id)} className="mt-4">
                  <Text className="text-sand-400 text-xs">Supprimer</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

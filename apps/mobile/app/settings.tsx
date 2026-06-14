import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { SupportButton } from "@/components/SupportButton";
import { checkHealth } from "@/lib/api";
import { getApiUrl } from "@/lib/config";

export default function SettingsScreen() {
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [visionModel, setVisionModel] = useState<string | null>(null);
  const apiUrl = getApiUrl();

  useEffect(() => {
    checkHealth().then(({ ok, provider: p, aiConfigured: ai, visionModel: vm }) => {
      setApiOk(ok);
      setProvider(p ?? null);
      setAiConfigured(ai ?? null);
      setVisionModel(vm ?? null);
    });
  }, []);

  return (
    <View className="flex-1 bg-sand-50 px-6 pt-16 pb-8">
      <Pressable onPress={() => router.back()} className="mb-8">
        <Text className="text-sage-500 text-base">← Retour</Text>
      </Pressable>

      <Text className="text-3xl font-light text-sand-800 mb-2">Paramètres</Text>
      <Text className="text-sand-500 text-base mb-10 leading-6">
        Vos créations restent sur votre appareil. Aucun compte requis.
      </Text>

      <View className="gap-4">
        <Pressable
          onPress={() => router.push("/sessions")}
          className="bg-white rounded-2xl border border-sand-200 px-5 py-5 flex-row justify-between items-center"
        >
          <View>
            <Text className="text-sand-700 font-medium mb-1">
              Mes sessions
            </Text>
            <Text className="text-sand-500 text-sm">
              Consulter vos rituels sauvegardés
            </Text>
          </View>
          <Text className="text-sage-500 text-lg">→</Text>
        </Pressable>

        <View className="bg-white rounded-2xl border border-sand-200 px-5 py-5">
          <Text className="text-sand-700 font-medium mb-2">Connexion API</Text>
          <Text className="text-sand-400 text-xs mb-3" numberOfLines={2}>
            {apiUrl || "(proxy local → " + (process.env.EXPO_PUBLIC_API_URL ?? "API") + ")"}
          </Text>
          <View className="flex-row items-center gap-2">
            {apiOk === null ? (
              <ActivityIndicator size="small" color="#6B8F71" />
            ) : (
              <>
                <View
                  className={`w-2 h-2 rounded-full ${apiOk ? "bg-sage-500" : "bg-red-400"}`}
                />
                <Text className="text-sand-600 text-sm">
                  {apiOk
                    ? `Connecté${provider ? ` (${provider})` : ""}`
                    : "Serveur inaccessible — vérifiez l'URL ou le réseau"}
                </Text>
              </>
            )}
          </View>
          {apiOk && aiConfigured === false && (
            <Text className="text-amber-700 text-xs mt-3 leading-5">
              IA non configurée sur le serveur (HF_TOKEN manquant sur Vercel).
              La réflexion photo utilisera le mode secours.
            </Text>
          )}
          {apiOk && aiConfigured && visionModel && (
            <Text className="text-sand-400 text-xs mt-2">
              Vision : {visionModel}
            </Text>
          )}
          {!apiOk && apiOk !== null && (
            <Text className="text-sand-400 text-xs mt-3 leading-5">
              Web local : relancez avec npm run mobile:web:clear après npm install.
              Sur téléphone : utilisez l'IP locale du PC dans EXPO_PUBLIC_API_URL.
            </Text>
          )}
        </View>

        <View className="bg-white rounded-2xl border border-sand-200 px-5 py-5">
          <Text className="text-sand-700 font-medium mb-2">Stockage local</Text>
          <Text className="text-sand-500 text-sm leading-5">
            Toutes vos sessions sont enregistrées via AsyncStorage, uniquement
            sur cet appareil.
          </Text>
        </View>

        <View className="bg-white rounded-2xl border border-sand-200 px-5 py-5">
          <Text className="text-sand-700 font-medium mb-2">Confidentialité</Text>
          <Text className="text-sand-500 text-sm leading-5">
            Les photos envoyées pour la réflexion IA transitent par le serveur
            mais ne sont jamais stockées côté serveur.
          </Text>
        </View>

        <SupportButton />

        <Text className="text-sand-400 text-xs text-center mt-4">
          Art Thérapie · v0.1.0 · MVP
        </Text>
      </View>
    </View>
  );
}

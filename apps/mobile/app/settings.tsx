import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { SupportButton } from "@/components/SupportButton";
import { TimerSoundPicker } from "@/components/TimerSoundPicker";
import { ScreenContainer } from "@/components/ui/Button";
import { checkHealth } from "@/lib/api";
import { getApiUrl } from "@/lib/config";
import { getTimerSound, setTimerSound } from "@/lib/preferences";
import { previewTimerSound, type TimerSoundId } from "@/lib/sounds";

export default function SettingsScreen() {
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [textModel, setTextModel] = useState<string | null>(null);
  const [visionModel, setVisionModel] = useState<string | null>(null);
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [timerSound, setTimerSoundState] = useState<TimerSoundId>("gong");
  const apiUrl = getApiUrl();

  useEffect(() => {
    checkHealth().then(
      ({
        ok,
        provider: p,
        aiConfigured: ai,
        textModel: tm,
        visionModel: vm,
        aiHint: hint,
      }) => {
        setApiOk(ok);
        setProvider(p ?? null);
        setAiConfigured(ai ?? null);
        setTextModel(tm ?? null);
        setVisionModel(vm ?? null);
        setAiHint(hint ?? null);
      }
    );
    getTimerSound().then(setTimerSoundState);
  }, []);

  async function handleTimerSoundChange(id: TimerSoundId) {
    setTimerSoundState(id);
    await setTimerSound(id);
    await previewTimerSound(id);
  }

  return (
    <ScreenContainer scrollable>
      <Pressable onPress={() => router.back()} className="mb-6 -mt-2">
        <Text className="text-sage-500 text-base">← Retour</Text>
      </Pressable>

      <Text className="text-3xl font-light text-sand-800 mb-2">Paramètres</Text>
      <Text className="text-sand-500 text-base mb-8 leading-6">
        Vos créations restent sur votre appareil. Aucun compte requis.
      </Text>

      <View className="gap-4 pb-8">
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

        <Pressable
          onPress={() => router.push("/privacy")}
          className="bg-white rounded-2xl border border-sand-200 px-5 py-5 flex-row justify-between items-center"
        >
          <View>
            <Text className="text-sand-700 font-medium mb-1">
              Confidentialité & mentions légales
            </Text>
            <Text className="text-sand-500 text-sm">
              Données locales, envoi IA, vos droits
            </Text>
          </View>
          <Text className="text-sage-500 text-lg">→</Text>
        </Pressable>

        <View className="bg-white rounded-2xl border border-sand-200 px-5 py-5">
          <Text className="text-sand-700 font-medium mb-2">
            Son de fin de timer
          </Text>
          <Text className="text-sand-500 text-sm mb-4 leading-5">
            Un signal doux lorsque le temps créatif est écoulé.
          </Text>
          <TimerSoundPicker
            selected={timerSound}
            onSelect={handleTimerSoundChange}
          />
        </View>

        <View className="bg-white rounded-2xl border border-sand-200 px-5 py-5">
          <Text className="text-sand-700 font-medium mb-2">Connexion API</Text>
          <Text className="text-sand-400 text-xs mb-3" numberOfLines={2}>
            {apiUrl ||
              "(proxy local → " +
                (process.env.EXPO_PUBLIC_API_URL ?? "API") +
                ")"}
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
          {aiHint && (
            <Text className="text-amber-700 text-xs mt-3 leading-5">
              {aiHint}
            </Text>
          )}
          {apiOk && aiConfigured === false && (
            <Text className="text-amber-700 text-xs mt-3 leading-5">
              IA non configurée (HF_TOKEN manquant sur Vercel). Exercices et
              réflexion photo utilisent le mode secours.
            </Text>
          )}
          {apiOk && aiConfigured && (
            <Text className="text-sand-400 text-xs mt-2 leading-5">
              Texte : {textModel ?? "—"}
              {"\n"}Vision : {visionModel ?? "—"}
              {"\n"}
              Recommandé : Qwen/Qwen2.5-VL-7B-Instruct:fastest pour l'analyse
              photo.
            </Text>
          )}
          {!apiOk && apiOk !== null && (
            <Text className="text-sand-400 text-xs mt-3 leading-5">
              Web local : relancez avec npm run mobile:web:clear après npm
              install. Sur téléphone : utilisez l'IP locale du PC dans
              EXPO_PUBLIC_API_URL. Vérifiez aussi ALLOWED_ORIGINS sur Vercel.
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

        <SupportButton />

        <Text className="text-sand-400 text-xs text-center mt-4">
          Art Thérapie · v0.1.0 · MVP
        </Text>
      </View>
    </ScreenContainer>
  );
}

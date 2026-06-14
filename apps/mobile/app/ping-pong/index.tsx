import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ApiError, fetchPingPongWord } from "@/lib/api";
import { showAlert } from "@/lib/alert";
import { PING_PONG_MAX_TURNS, type PingPongTurn } from "@/lib/ping-pong/types";
import { useRitualStore } from "@/lib/store";

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function PingPongScreen() {
  const setImpulse = useRitualStore((s) => s.setImpulse);
  const scrollRef = useRef<ScrollView>(null);
  const [turns, setTurns] = useState<PingPongTurn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);

  const userTurnCount = turns.filter((t) => t.from === "user").length;
  const canPlay = !finished && userTurnCount < PING_PONG_MAX_TURNS;

  async function handleSubmit() {
    const word = input.trim();
    if (!word || loading || !canPlay) return;

    setInput("");
    const userTurn: PingPongTurn = { id: makeId(), word, from: "user" };
    const nextTurns = [...turns, userTurn];
    setTurns(nextTurns);

    const history = nextTurns.slice(0, -1).map((t) => t.word);

    if (userTurnCount + 1 >= PING_PONG_MAX_TURNS) {
      setFinished(true);
      return;
    }

    setLoading(true);
    try {
      const result = await fetchPingPongWord(word, history);
      setTurns((prev) => [
        ...prev,
        { id: makeId(), word: result.word, from: "ai" },
      ]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (error) {
      showAlert(
        "Connexion indisponible",
        error instanceof ApiError
          ? error.message
          : "Impossible de joindre le serveur."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleCreateFromJourney() {
    const lastUser = [...turns].reverse().find((t) => t.from === "user");
    const impulse = lastUser?.word ?? turns[turns.length - 1]?.word ?? "";
    if (!impulse) return;
    setImpulse(impulse);
    router.push("/ritual");
  }

  const chain = turns.map((t) => t.word).join("  →  ");

  return (
    <ScreenContainer scrollable={false}>
      <View className="flex-1 px-0">
        <Pressable onPress={() => router.back()} className="mb-4 px-6">
          <Text className="text-sage-500 text-base">← Accueil</Text>
        </Pressable>

        <View className="px-6 mb-4">
          <Text className="text-sage-500 text-sm uppercase tracking-widest mb-2">
            Ping-Pong créatif
          </Text>
          <Text className="text-2xl font-light text-sand-800 leading-tight">
            Laissez les mots danser
          </Text>
          <Text className="text-sand-500 text-sm mt-2 leading-5">
            Un mot suggère le suivant — sans réfléchir trop. {PING_PONG_MAX_TURNS}{" "}
            envois, puis une impulsion pour créer.
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 24, gap: 12 }}
          keyboardShouldPersistTaps="handled"
        >
          {turns.length === 0 && (
            <View className="bg-white/80 rounded-2xl border border-dashed border-sand-300 px-5 py-8 items-center">
              <Text className="text-sand-400 text-center leading-6">
                Tapez un premier mot — un arbre, une couleur, un ressenti…
              </Text>
            </View>
          )}

          {turns.map((turn, index) => (
            <View
              key={turn.id}
              className={`max-w-[85%] ${turn.from === "user" ? "self-end" : "self-start"}`}
            >
              <View
                className={`rounded-2xl px-4 py-3 ${
                  turn.from === "user"
                    ? "bg-sage-500"
                    : "bg-white border border-sand-200"
                }`}
              >
                <Text
                  className={`text-lg font-light tracking-wide ${
                    turn.from === "user" ? "text-white" : "text-sand-700"
                  }`}
                >
                  {turn.word}
                </Text>
              </View>
              {index < turns.length - 1 && turn.from === "ai" && (
                <Text className="text-sand-300 text-center text-xs mt-2">↓</Text>
              )}
            </View>
          ))}

          {loading && (
            <View className="self-start bg-white border border-sand-200 rounded-2xl px-4 py-3">
              <ActivityIndicator color="#6B8F71" />
            </View>
          )}

          {finished && (
            <View className="bg-white rounded-2xl border border-sage-500/30 px-5 py-5 mt-4">
              <Text className="text-sand-700 font-medium mb-2">
                Votre cheminement
              </Text>
              <Text className="text-sand-600 text-sm leading-6 mb-4">
                {chain}
              </Text>
              <PrimaryButton
                label="Créer à partir de ce cheminement"
                onPress={handleCreateFromJourney}
              />
            </View>
          )}
        </ScrollView>

        {canPlay && (
          <View className="px-6 pt-3 pb-6 border-t border-sand-200 bg-sand-50">
            <View className="flex-row items-center gap-3">
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Un mot…"
                placeholderTextColor="#B8A090"
                onSubmitEditing={handleSubmit}
                returnKeyType="send"
                editable={!loading}
                className="flex-1 bg-white border border-sand-200 rounded-2xl px-4 py-3 text-sand-800 text-base"
              />
              <Pressable
                onPress={handleSubmit}
                disabled={!input.trim() || loading}
                className={`rounded-2xl px-4 py-3 ${input.trim() && !loading ? "bg-sage-500" : "bg-sand-200"}`}
              >
                <Text className="text-white font-medium">→</Text>
              </Pressable>
            </View>
            <Text className="text-sand-400 text-xs text-center mt-2">
              Tour {userTurnCount + 1} / {PING_PONG_MAX_TURNS}
            </Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

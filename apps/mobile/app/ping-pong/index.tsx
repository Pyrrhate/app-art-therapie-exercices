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
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { ApiError, fetchPingPongWord } from "@/lib/api";
import { AddToFilBar } from "@/components/fil/AddToFilBar";
import { CreativeBridge } from "@/components/fil/CreativeBridge";
import { startRitualFromImpulse } from "@/lib/fil/bridges";
import { showAlert } from "@/lib/alert";
import { getFallbackPingPongWord } from "@/lib/ping-pong/fallback";
import { PING_PONG_MAX_TURNS, type PingPongTurn } from "@/lib/ping-pong/types";

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function PingPongScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [turns, setTurns] = useState<PingPongTurn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [useAiSuggestions, setUseAiSuggestions] = useState(false);
  const [usingLocalWords, setUsingLocalWords] = useState(false);

  const userTurnCount = turns.filter((t) => t.from === "user").length;
  const canPlay = !finished && userTurnCount < PING_PONG_MAX_TURNS;
  const canExitToExercise = turns.length >= 1;
  const chain = turns.map((t) => t.word).join("  →  ");

  function scrollToEnd() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }

  function appendPartnerWord(word: string, history: string[]) {
    const partnerWord = getFallbackPingPongWord(word, history);
    setTurns((prev) => [
      ...prev,
      { id: makeId(), word: partnerWord, from: "ai" },
    ]);
    scrollToEnd();
  }

  async function fetchPartnerWord(word: string, history: string[]) {
    setLoading(true);
    try {
      const result = await fetchPingPongWord(word, history);
      setUsingLocalWords(false);
      setTurns((prev) => [
        ...prev,
        { id: makeId(), word: result.word, from: "ai" },
      ]);
      scrollToEnd();
    } catch (error) {
      setUsingLocalWords(true);
      appendPartnerWord(word, history);
      if (!(error instanceof ApiError)) {
        showAlert(
          "Suggestion indisponible",
          "Un mot local prend le relais — vous pouvez continuer l'amorce."
        );
      }
    } finally {
      setLoading(false);
    }
  }

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
      scrollToEnd();
      return;
    }

    if (useAiSuggestions) {
      await fetchPartnerWord(word, history);
    } else {
      appendPartnerWord(word, history);
    }
  }

  function handleCreateFromJourney() {
    if (!chain) return;
    startRitualFromImpulse(chain, "mixed_media");
  }

  return (
    <ScreenContainer scrollable={false}>
      <View className="flex-1 px-0">
        <View className="px-6">
          <ScreenNavBar
            backLabel="← Accueil"
            onBack={() => router.replace("/")}
          />
        </View>

        <View className="px-6 mb-4">
          <Text className="text-sage-500 text-sm uppercase tracking-widest mb-2">
            Ping-Pong créatif
          </Text>
          <Text className="text-2xl font-light text-sand-800 leading-tight">
            Laissez les mots danser
          </Text>
          <Text className="text-sand-500 text-sm mt-2 leading-5">
            Amorce rapide — 2 à 3 minutes pour faire émerger une impulsion, puis
            passer à l'exercice. {PING_PONG_MAX_TURNS} envois suffisent.
          </Text>
          <View className="flex-row items-center gap-2 mt-3">
            <Pressable
              onPress={() => {
                setUseAiSuggestions((value) => !value);
                if (useAiSuggestions) setUsingLocalWords(false);
              }}
              className={`rounded-full px-3 py-1.5 border ${
                useAiSuggestions
                  ? "bg-sage-100 border-sage-400"
                  : "bg-white border-sand-200"
              }`}
            >
              <Text
                className={`text-xs ${
                  useAiSuggestions ? "text-sage-700" : "text-sand-500"
                }`}
              >
                Suggestions IA
              </Text>
            </Pressable>
            {useAiSuggestions && usingLocalWords && (
              <Text className="text-amber-700 text-xs">
                Mots locaux — connexion indisponible.
              </Text>
            )}
          </View>
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
                Tapez un premier mot — un arbre, une couleur, un ressenti… Puis
                passez à l'exercice quand l'impulsion est là.
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
            <>
              <View className="bg-white rounded-2xl border border-sage-500/30 px-5 py-5 mt-4">
                <Text className="text-sand-700 font-medium mb-2">
                  Votre cheminement
                </Text>
                <Text className="text-sand-600 text-sm leading-6">{chain}</Text>
              </View>

              <CreativeBridge
                title="Votre impulsion est prête"
                subtitle="Transformez cette chaîne de mots en matière, couleur ou geste — l'exercice vous attend."
                actions={[
                  {
                    label: "Passer à l'exercice",
                    onPress: handleCreateFromJourney,
                    variant: "primary",
                  },
                ]}
              />

              <AddToFilBar
                entry={{
                  source: "ping-pong",
                  summary: "Amorce ping-pong",
                  detail: chain,
                  metadata: { chain },
                }}
              />
            </>
          )}
        </ScrollView>

        {!finished && (canPlay || canExitToExercise) && (
          <View className="px-6 pt-3 pb-6 border-t border-sand-200 bg-sand-50 gap-3">
            {canExitToExercise && !finished && (
              <PrimaryButton
                label="Passer à l'exercice"
                onPress={handleCreateFromJourney}
              />
            )}

            {canPlay && (
              <>
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
                <Text className="text-sand-400 text-xs text-center">
                  Tour {userTurnCount + 1} / {PING_PONG_MAX_TURNS}
                </Text>
              </>
            )}
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

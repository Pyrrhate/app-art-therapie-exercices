import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { ApiError, fetchPingPongWord } from "@/lib/api";
import { CreativeBridge } from "@/components/fil/CreativeBridge";
import { recordFilEntry } from "@/lib/fil/record";
import { startRitualFromImpulse } from "@/lib/fil/bridges";
import { showAlert } from "@/lib/alert";
import { getFallbackPingPongReply } from "@/lib/ping-pong/fallback";
import {
  PING_PONG_TOTAL_STEPS,
  PING_PONG_USER_TURNS,
  type PingPongTurn,
} from "@/lib/ping-pong/types";
import { navigateHome } from "@/lib/navigation";

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function turnToWords(turn: PingPongTurn): string[] {
  if (turn.from === "user") return [turn.word];
  return [turn.logicalWord ?? turn.word, turn.suggestedWord ?? ""].filter(Boolean);
}

function buildHistory(turns: PingPongTurn[]): string[] {
  return turns.flatMap(turnToWords);
}

export default function PingPongScreen() {
  const { t } = useTranslation("amorces");
  const scrollRef = useRef<ScrollView>(null);
  const [turns, setTurns] = useState<PingPongTurn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const filRecordedRef = useRef(false);
  const [useAiSuggestions, setUseAiSuggestions] = useState(false);
  const [usingLocalWords, setUsingLocalWords] = useState(false);

  const userTurnCount = turns.filter((t) => t.from === "user").length;
  const currentStep = finished ? PING_PONG_TOTAL_STEPS : turns.length + 1;
  const canPlay = !finished && userTurnCount < PING_PONG_USER_TURNS;
  const canExitToExercise = turns.length >= 1;
  const chain = buildHistory(turns).join("  →  ");

  function recordPingPongFil() {
    if (filRecordedRef.current || !chain.trim()) return;
    filRecordedRef.current = true;
    void recordFilEntry({
      source: "ping-pong",
      summary: t("pingPong.filSummary"),
      detail: chain,
      metadata: { chain },
    });
  }

  useEffect(() => {
    if (finished) recordPingPongFil();
  }, [finished, chain]);

  function handleCreateFromJourney() {
    if (!chain) return;
    recordPingPongFil();
    startRitualFromImpulse(chain, "mixed_media");
  }

  function scrollToEnd() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }

  function appendPartnerReply(word: string, history: string[]) {
    const reply = getFallbackPingPongReply(word, history);
    setTurns((prev) => [
      ...prev,
      {
        id: makeId(),
        word: reply.logicalWord,
        from: "ai",
        logicalWord: reply.logicalWord,
        suggestedWord: reply.suggestedWord,
      },
    ]);
    scrollToEnd();
  }

  async function fetchPartnerReply(word: string, history: string[]) {
    setLoading(true);
    try {
      const result = await fetchPingPongWord(word, history);
      setUsingLocalWords(false);
      setTurns((prev) => [
        ...prev,
        {
          id: makeId(),
          word: result.logicalWord,
          from: "ai",
          logicalWord: result.logicalWord,
          suggestedWord: result.suggestedWord,
        },
      ]);
      scrollToEnd();
    } catch (error) {
      setUsingLocalWords(true);
      appendPartnerReply(word, history);
      if (!(error instanceof ApiError)) {
        showAlert(
          t("pingPong.suggestionUnavailableTitle"),
          t("pingPong.suggestionUnavailableBody")
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

    const history = buildHistory(turns);

    if (userTurnCount + 1 >= PING_PONG_USER_TURNS) {
      setFinished(true);
      scrollToEnd();
      return;
    }

    if (useAiSuggestions) {
      await fetchPartnerReply(word, history);
    } else {
      appendPartnerReply(word, history);
    }
  }

  const stickyFooter = !finished && (canPlay || canExitToExercise) ? (
      <View className="gap-3">
        {canPlay && (
          <>
            <View className="flex-row items-center gap-3">
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder={t("pingPong.inputPlaceholder")}
                placeholderTextColor="#B8A090"
                onSubmitEditing={handleSubmit}
                returnKeyType="send"
                editable={!loading}
                className="flex-1 bg-white border border-sand-200 rounded-2xl px-4 py-3 text-sand-800 text-base"
              />
              <Pressable
                onPress={handleSubmit}
                disabled={!input.trim() || loading}
                accessibilityRole="button"
                accessibilityLabel={t("pingPong.sendWord")}
                className={`rounded-2xl px-4 py-3 ${input.trim() && !loading ? "bg-sage-500" : "bg-sand-200"}`}
              >
                <Text className="text-white font-medium">→</Text>
              </Pressable>
            </View>
            <Text className="text-sand-400 text-xs text-center">
              {t("pingPong.step", {
                current: currentStep,
                total: PING_PONG_TOTAL_STEPS,
              })}
              {currentStep % 2 === 1
                ? t("pingPong.yourTurn")
                : t("pingPong.aiTurn")}
            </Text>
          </>
        )}

        {canExitToExercise && (
          <PrimaryButton
            label={t("pingPong.toExercise")}
            onPress={handleCreateFromJourney}
            variant="ghost"
            align="center"
          />
        )}
      </View>
    ) : null;

  return (
    <ScreenContainer
      compactTop
      scrollRef={scrollRef}
      fixedHeader={
        <View>
          <ScreenNavBar backLabel={t("nav.home")} onBack={navigateHome} />
          <PastekScreenHero
            label={t("pingPong.heroLabel")}
            title={t("pingPong.heroTitle")}
            accent={t("pingPong.heroAccent")}
            description={t("pingPong.heroDescription")}
            className="mb-3"
          />
          <View className="flex-row items-center gap-2 mt-1 mb-2">
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
                {t("pingPong.aiSuggestions")}
              </Text>
            </Pressable>
            {useAiSuggestions && usingLocalWords && (
              <Text className="text-amber-700 text-xs">
                {t("pingPong.localWords")}
              </Text>
            )}
          </View>
        </View>
      }
      stickyFooter={stickyFooter}
    >
      <View className="gap-3 pb-2">
        {turns.length === 0 && (
          <View className="bg-white/80 rounded-2xl border border-dashed border-sand-300 px-5 py-8 items-center">
            <Text className="text-sand-400 text-center leading-6">
              {t("pingPong.emptyHint")}
            </Text>
          </View>
        )}

        {turns.map((turn, index) => (
          <View
            key={turn.id}
            className={`max-w-[90%] ${turn.from === "user" ? "self-end" : "self-start"}`}
          >
            {turn.from === "ai" ? (
              <View className="bg-white border border-sand-200 rounded-2xl px-4 py-3">
                <Text className="text-sage-600 text-[10px] uppercase tracking-wider mb-2">
                  {t("pingPong.aiTurnLabel")}
                </Text>
                <Text className="text-sand-800 text-lg font-light tracking-wide">
                  {turn.logicalWord ?? turn.word}
                  {(turn.suggestedWord ?? "").length > 0 && (
                    <>
                      <Text className="text-sand-300"> · </Text>
                      <Text className="text-sage-700">{turn.suggestedWord}</Text>
                    </>
                  )}
                </Text>
              </View>
            ) : (
              <View className="rounded-2xl px-4 py-3 bg-sage-500">
                <Text className="text-white text-lg font-light tracking-wide">
                  {turn.word}
                </Text>
              </View>
            )}
            {index < turns.length - 1 && (
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
            <View className="bg-white rounded-2xl border border-sage-500/30 px-5 py-5 mt-2">
              <Text className="text-sand-700 font-medium mb-2">
                {t("pingPong.chainTitle")}
              </Text>
              <Text className="text-sand-600 text-sm leading-6">{chain}</Text>
            </View>

            <CreativeBridge
              title={t("pingPong.bridgeTitle")}
              subtitle={t("pingPong.bridgeSubtitle")}
              actions={[
                {
                  label: t("pingPong.toExercise"),
                  onPress: handleCreateFromJourney,
                  variant: "primary",
                },
              ]}
            />
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

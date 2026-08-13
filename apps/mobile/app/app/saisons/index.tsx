import { useCallback, useState } from "react";
import { Alert, Platform, Pressable, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { TechniquePicker } from "@/components/TechniquePicker";
import { AccentCard } from "@/components/ui/Card";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { navigateHome } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { SEASON_CATALOG } from "@/lib/seasons/catalog";
import { applyActiveSeasonToRitual } from "@/lib/seasons/apply";
import {
  abandonActiveSeason,
  getSeasonsState,
  practicedToday,
  seasonDayIndex,
  startCatalogSeason,
  startCustomSeason,
} from "@/lib/seasons/storage";
import type { SeasonDuration, SeasonRun, SeasonsState } from "@/lib/seasons/types";
import { useEnabledTechniques } from "@/lib/techniques/managed";
import type { ArtisticTechnique } from "@/lib/types";
import { panelBg, textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

const DURATIONS: SeasonDuration[] = [7, 10, 14];

async function confirmAbandon(title: string): Promise<boolean> {
  const message = `La saison « ${title} » sera clôturée. Vous pourrez en commencer une autre.`;
  if (Platform.OS === "web") {
    return window.confirm(`Quitter cette saison ?\n\n${message}`);
  }
  return new Promise((resolve) => {
    Alert.alert("Quitter cette saison ?", message, [
      { text: "Rester", style: "cancel", onPress: () => resolve(false) },
      { text: "Quitter", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

function SeasonProgress({ run }: { run: SeasonRun }) {
  const isDark = useIsDark();
  const day = Math.min(seasonDayIndex(run), run.durationDays);
  const sessions = run.completedDates.length;
  const todayDone = practicedToday(run);

  return (
    <AccentCard className="gap-3 mb-6">
      <Text className="text-sage-600 text-xs uppercase tracking-wider">
        Saison en cours
      </Text>
      <Text className={`font-display text-2xl ${textPrimary(isDark)}`}>
        {run.title}
      </Text>
      <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
        Jour {day}/{run.durationDays}
        {" · "}
        {sessions === 0
          ? "aucune séance encore"
          : `${sessions} séance${sessions > 1 ? "s" : ""}`}
        {todayDone ? " · aujourd'hui, c'est fait" : ""}
      </Text>
      <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
        {run.constraint}
      </Text>
      <PrimaryButton
        label={todayDone ? "Créer encore aujourd'hui" : "Continuer la saison"}
        onPress={() => {
          void applyActiveSeasonToRitual().then(() => {
            router.push(ROUTES.ritual);
          });
        }}
      />
      <PrimaryButton
        label="Quitter cette saison"
        variant="ghost"
        onPress={() => {
          void (async () => {
            const ok = await confirmAbandon(run.title);
            if (!ok) return;
            await abandonActiveSeason();
            router.replace(ROUTES.seasons);
          })();
        }}
      />
    </AccentCard>
  );
}

export default function SeasonsScreen() {
  const isDark = useIsDark();
  const techniques = useEnabledTechniques();
  const [state, setState] = useState<SeasonsState | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customConstraint, setCustomConstraint] = useState("");
  const [customDays, setCustomDays] = useState<SeasonDuration>(7);
  const [customTechnique, setCustomTechnique] =
    useState<ArtisticTechnique | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState(await getSeasonsState());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  async function beginCatalog(id: string) {
    if (active) {
      const ok = await confirmAbandon(active.title);
      if (!ok) return;
    }
    setBusy(true);
    setError(null);
    try {
      await startCatalogSeason(id);
      await applyActiveSeasonToRitual({ preferSuggestedImpulse: true });
      router.push(ROUTES.ritual);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de démarrer.");
    } finally {
      setBusy(false);
    }
  }

  async function beginCustom() {
    if (active) {
      const ok = await confirmAbandon(active.title);
      if (!ok) return;
    }
    setBusy(true);
    setError(null);
    try {
      await startCustomSeason({
        title: customTitle,
        constraint: customConstraint,
        durationDays: customDays,
        suggestedTechnique: customTechnique ?? undefined,
      });
      await applyActiveSeasonToRitual({ preferSuggestedImpulse: false });
      router.push(ROUTES.ritual);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de démarrer.");
    } finally {
      setBusy(false);
    }
  }

  const active = state?.active ?? null;
  const history = state?.history ?? [];

  return (
    <ScreenContainer scrollable refreshable onRefresh={load} compactTop>
      <ScreenNavBar backLabel="← Accueil" onBack={navigateHome} />

      <PastekScreenHero
        label="Saisons"
        title="Une contrainte douce, "
        accent="plusieurs jours"
        description="Sept à quatorze jours. Pas un défi : une habitude légère. Les jours manqués ne cassent rien."
        className="mb-6"
      />

      {active ? <SeasonProgress run={active} /> : null}

      <Text className={`text-xs uppercase tracking-[0.18em] font-medium mb-3 ${textMuted(isDark)}`}>
        {active ? "Après celle-ci" : "Saisons proposées"}
      </Text>

      <View className="gap-3 mb-8">
        {SEASON_CATALOG.map((def) => (
          <View
            key={def.id}
            className={`rounded-3xl border px-5 py-5 ${panelBg(isDark)}`}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className={`font-display text-xl ${textPrimary(isDark)}`}>
                {def.title}
              </Text>
              <Text className={`text-xs ${textMuted(isDark)}`}>
                {def.durationDays} jours
              </Text>
            </View>
            <Text className={`text-sm leading-6 mb-3 ${textSecondary(isDark)}`}>
              {def.invitation}
            </Text>
            <Text className={`text-xs leading-5 mb-4 ${textMuted(isDark)}`}>
              Contrainte : {def.constraint}
            </Text>
            <PrimaryButton
              label={active ? "Remplacer et commencer" : "Commencer"}
              onPress={() => void beginCatalog(def.id)}
              disabled={busy}
              variant={active ? "ghost" : "primary"}
            />
          </View>
        ))}
      </View>

      <Pressable onPress={() => setShowCustom((v) => !v)} className="mb-3">
        <Text className="text-sage-600 text-sm font-medium">
          {showCustom ? "Masquer ma saison" : "Créer la mienne"}
        </Text>
      </Pressable>

      {showCustom ? (
        <View className={`rounded-3xl border px-5 py-5 mb-8 gap-4 ${panelBg(isDark)}`}>
          <TextInput
            value={customTitle}
            onChangeText={setCustomTitle}
            placeholder="Titre (ex. Encres d'hiver)"
            placeholderTextColor={isDark ? "#8A8078" : "#B8A090"}
            className={`rounded-2xl border px-4 py-3 text-base ${
              isDark
                ? "border-sand-600 bg-sand-900 text-sand-100"
                : "border-sand-200 bg-white text-sand-800"
            }`}
          />
          <TextInput
            value={customConstraint}
            onChangeText={setCustomConstraint}
            placeholder="La contrainte, en une ou deux phrases…"
            placeholderTextColor={isDark ? "#8A8078" : "#B8A090"}
            multiline
            className={`rounded-2xl border px-4 py-3 text-base min-h-[88px] ${
              isDark
                ? "border-sand-600 bg-sand-900 text-sand-100"
                : "border-sand-200 bg-white text-sand-800"
            }`}
          />
          <View className="flex-row flex-wrap gap-2">
            {DURATIONS.map((d) => (
              <Pressable
                key={d}
                onPress={() => setCustomDays(d)}
                className={`rounded-full px-3 py-1.5 border ${
                  customDays === d
                    ? "bg-sage-500 border-sage-500"
                    : isDark
                      ? "border-sand-600"
                      : "border-sand-200"
                }`}
              >
                <Text
                  className={`text-xs ${
                    customDays === d ? "text-white font-medium" : textMuted(isDark)
                  }`}
                >
                  {d} jours
                </Text>
              </Pressable>
            ))}
          </View>
          <Text className={`text-sm font-medium ${textSecondary(isDark)}`}>
            Technique suggérée (optionnel)
          </Text>
          <TechniquePicker
            selected={customTechnique}
            onSelect={(t) =>
              setCustomTechnique((current) => (current === t ? null : t))
            }
            techniques={techniques}
          />
          <PrimaryButton
            label="Démarrer ma saison"
            onPress={() => void beginCustom()}
            disabled={busy}
          />
        </View>
      ) : null}

      {error ? (
        <Text className="text-red-500 text-sm mb-4 leading-5">{error}</Text>
      ) : null}

      {history.length > 0 ? (
        <View className="pb-8">
          <Text
            className={`text-xs uppercase tracking-[0.18em] font-medium mb-3 ${textMuted(isDark)}`}
          >
            Saisons passées
          </Text>
          {history.map((run) => (
            <View key={run.id} className="mb-3">
              <Text className={`text-sm font-medium ${textPrimary(isDark)}`}>
                {run.title}
              </Text>
              <Text className={`text-xs leading-5 ${textMuted(isDark)}`}>
                {run.status === "completed" ? "Terminée" : "Interrompue"} ·{" "}
                {run.completedDates.length} séance
                {run.completedDates.length > 1 ? "s" : ""} · {run.durationDays}{" "}
                jours
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScreenContainer>
  );
}

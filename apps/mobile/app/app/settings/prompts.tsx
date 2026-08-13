import { useCallback, useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  PROMPT_CATALOG,
  PROMPT_IDS,
  PROMPT_OVERRIDE_LIMITS,
  type PromptId,
} from "@art-therapie/shared";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { showAlert } from "@/lib/alert";
import {
  getPromptOverrides,
  removePromptOverride,
  savePromptOverride,
} from "@/lib/promptOverrides";
import { ROUTES } from "@/lib/routes";
import {
  panelBg,
  textMuted,
  textPrimary,
  textSecondary,
} from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

function PromptCard({
  id,
  override,
  expanded,
  draft,
  saving,
  onToggle,
  onDraftChange,
  onSave,
  onReset,
}: {
  id: PromptId;
  override?: string;
  expanded: boolean;
  draft: string;
  saving: boolean;
  onToggle: () => void;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  onReset: () => void;
}) {
  const isDark = useIsDark();
  const { t } = useTranslation("app");
  const entry = PROMPT_CATALOG[id];
  const hasOverride = Boolean(override);
  const charCount = draft.trim().length;

  return (
    <View className={`rounded-3xl border px-5 py-5 gap-3 ${panelBg(isDark)}`}>
      <Pressable onPress={onToggle} accessibilityRole="button">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className={`font-medium text-base ${textPrimary(isDark)}`}>
              {entry.title}
            </Text>
            <Text className={`text-sm leading-5 mt-1 ${textSecondary(isDark)}`}>
              {entry.description}
            </Text>
          </View>
          {hasOverride ? (
            <View className="rounded-full bg-sage-100 px-3 py-1">
              <Text className="text-sage-700 text-xs font-medium">
                {t("prompts.custom")}
              </Text>
            </View>
          ) : (
            <View
              className={`rounded-full px-3 py-1 ${
                isDark ? "bg-sand-700" : "bg-sand-100"
              }`}
            >
              <Text className={`text-xs ${textMuted(isDark)}`}>
                {t("prompts.default")}
              </Text>
            </View>
          )}
        </View>
        <Text className="text-sage-600 text-xs mt-3">
          {expanded ? t("prompts.hide") : t("prompts.show")}
        </Text>
      </Pressable>

      {expanded ? (
        <View className="gap-3 mt-1">
          <Text className={`text-xs uppercase tracking-wider ${textMuted(isDark)}`}>
            {t("prompts.activePrompt")}
          </Text>
          <TextInput
            value={draft}
            onChangeText={onDraftChange}
            multiline
            textAlignVertical="top"
            className={`rounded-2xl border px-4 py-3 text-sm leading-6 min-h-[180px] ${
              isDark
                ? "bg-sand-900 border-sand-600 text-sand-100"
                : "bg-sand-50 border-sand-200 text-sand-800"
            }`}
            accessibilityLabel={t("prompts.fieldLabel", { title: entry.title })}
          />
          <Text className={`text-xs ${textMuted(isDark)}`}>
            {t("prompts.charCount", {
              chars: charCount,
              max: PROMPT_OVERRIDE_LIMITS.maxLength,
            })}
            {charCount > 0 && charCount < PROMPT_OVERRIDE_LIMITS.minLength
              ? t("prompts.minHint", { min: PROMPT_OVERRIDE_LIMITS.minLength })
              : ""}
          </Text>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <PrimaryButton
                label={saving ? t("prompts.saving") : t("prompts.save")}
                onPress={onSave}
                disabled={
                  saving ||
                  draft.trim().length < PROMPT_OVERRIDE_LIMITS.minLength ||
                  draft.trim() === (override ?? entry.body).trim()
                }
              />
            </View>
            <View className="flex-1">
              <PrimaryButton
                label={
                  hasOverride
                    ? t("prompts.backToDefault")
                    : t("prompts.restoreText")
                }
                onPress={onReset}
                variant="ghost"
                disabled={saving}
              />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default function PromptsSettingsScreen() {
  const isDark = useIsDark();
  const { t } = useTranslation("app");
  const [overrides, setOverrides] = useState<
    Partial<Record<PromptId, string>>
  >({});
  const [drafts, setDrafts] = useState<Record<PromptId, string>>(() => {
    const initial = {} as Record<PromptId, string>;
    for (const id of PROMPT_IDS) {
      initial[id] = PROMPT_CATALOG[id].body;
    }
    return initial;
  });
  const [expanded, setExpanded] = useState<PromptId | null>(null);
  const [savingId, setSavingId] = useState<PromptId | null>(null);

  const refresh = useCallback(async () => {
    const stored = await getPromptOverrides();
    setOverrides(stored);
    setDrafts((prev) => {
      const next = { ...prev };
      for (const id of PROMPT_IDS) {
        next[id] = stored[id] ?? PROMPT_CATALOG[id].body;
      }
      return next;
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  async function handleSave(id: PromptId) {
    setSavingId(id);
    try {
      await savePromptOverride(id, drafts[id]);
      await refresh();
      showAlert(t("prompts.savedTitle"), t("prompts.savedBody"));
    } catch (error) {
      showAlert(
        t("prompts.saveFailTitle"),
        error instanceof Error ? error.message : t("prompts.retryLater")
      );
    } finally {
      setSavingId(null);
    }
  }

  async function handleReset(id: PromptId) {
    setSavingId(id);
    try {
      if (overrides[id]) {
        await removePromptOverride(id);
      }
      setDrafts((prev) => ({ ...prev, [id]: PROMPT_CATALOG[id].body }));
      await refresh();
      showAlert(t("prompts.resetTitle"), t("prompts.resetBody"));
    } catch (error) {
      showAlert(
        t("prompts.resetFailTitle"),
        error instanceof Error ? error.message : t("prompts.retryLater")
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <ScreenContainer scrollable refreshable onRefresh={refresh} compactTop>
      <ScreenNavBar
        backLabel={t("nav.backSettings")}
        onBack={() => router.push(ROUTES.settings)}
      />

      <PastekScreenHero
        label={t("prompts.heroLabel")}
        title={t("prompts.heroTitle")}
        accent={t("prompts.heroAccent")}
        description={t("prompts.heroDescription")}
        className="mb-6"
      />

      <View
        className={`rounded-3xl border px-5 py-4 mb-5 ${
          isDark
            ? "bg-sage-900/30 border-sage-700"
            : "bg-sage-50 border-sage-100"
        }`}
      >
        <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
          {t("prompts.intro")}
        </Text>
      </View>

      <View className="gap-4 pb-10">
        {PROMPT_IDS.map((id) => (
          <PromptCard
            key={id}
            id={id}
            override={overrides[id]}
            expanded={expanded === id}
            draft={drafts[id]}
            saving={savingId === id}
            onToggle={() =>
              setExpanded((prev) => (prev === id ? null : id))
            }
            onDraftChange={(value) =>
              setDrafts((prev) => ({ ...prev, [id]: value }))
            }
            onSave={() => void handleSave(id)}
            onReset={() => void handleReset(id)}
          />
        ))}
      </View>
    </ScreenContainer>
  );
}

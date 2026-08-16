/**
 * Réglages moteurs IA (BYOK) — clés en stockage local uniquement.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import {
  EUROPEAN_BYOK_PROVIDERS,
  CANADIAN_BYOK_PROVIDERS,
  GLOBAL_BYOK_PROVIDERS,
  type ByokProviderId,
} from "@art-therapie/shared";
import { PrimaryButton } from "@/components/ui/Button";
import { showAlert } from "@/lib/alert";
import { getApiUrl } from "@/lib/config";
import {
  AI_KEY_PROVIDERS,
  getAiKey,
  getSelectedAiProvider,
  hasAiKey,
  removeAiKey,
  saveAiKey,
  setSelectedAiProvider,
  type AiKeyProvider,
} from "@/lib/aiKeys";
import {
  panelBg,
  textMuted,
  textPrimary,
  textSecondary,
} from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

/** Métadonnées non traduisibles : nom du produit, URL de doc, type de champ. */
type ProviderMeta = {
  id: AiKeyProvider;
  title: string;
  docsUrl: string;
  docsLabel: string;
  /** Champ = URL plutôt que clé secrète */
  isUrl?: boolean;
};

const PROVIDER_META: Record<AiKeyProvider, ProviderMeta> = {
  mistral: {
    id: "mistral",
    title: "Mistral AI",
    docsUrl: "https://console.mistral.ai/api-keys",
    docsLabel: "console.mistral.ai",
  },
  scaleway: {
    id: "scaleway",
    title: "Scaleway Generative",
    docsUrl: "https://console.scaleway.com/iam/api-keys",
    docsLabel: "console.scaleway.com/iam",
  },
  ovhcloud: {
    id: "ovhcloud",
    title: "OVHcloud AI Endpoints",
    docsUrl: "https://endpoints.ai.cloud.ovh.net/",
    docsLabel: "endpoints.ai.cloud.ovh.net",
  },
  alephalpha: {
    id: "alephalpha",
    title: "Aleph Alpha",
    docsUrl: "https://app.aleph-alpha.com/",
    docsLabel: "app.aleph-alpha.com",
  },
  ollama: {
    id: "ollama",
    title: "Ollama (local)",
    docsUrl: "https://ollama.com/",
    docsLabel: "ollama.com",
    isUrl: true,
  },
  cohere: {
    id: "cohere",
    title: "Cohere",
    docsUrl: "https://dashboard.cohere.com/api-keys",
    docsLabel: "dashboard.cohere.com",
  },
  openai: {
    id: "openai",
    title: "OpenAI",
    docsUrl: "https://platform.openai.com/api-keys",
    docsLabel: "platform.openai.com",
  },
  anthropic: {
    id: "anthropic",
    title: "Anthropic (Claude)",
    docsUrl: "https://console.anthropic.com/settings/keys",
    docsLabel: "console.anthropic.com",
  },
  gemini: {
    id: "gemini",
    title: "Google Gemini",
    docsUrl: "https://aistudio.google.com/apikey",
    docsLabel: "aistudio.google.com",
  },
};

async function openDocs(
  url: string,
  alertTitle: string,
  alertBody: string
): Promise<void> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return;
    }
  } catch {
    /* fallback web */
  }
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  showAlert(alertTitle, alertBody);
}

function emptySavedMap(): Record<AiKeyProvider, boolean> {
  return Object.fromEntries(
    AI_KEY_PROVIDERS.map((id) => [id, false])
  ) as Record<AiKeyProvider, boolean>;
}

function emptyDrafts(): Record<AiKeyProvider, string> {
  return Object.fromEntries(
    AI_KEY_PROVIDERS.map((id) => [id, ""])
  ) as Record<AiKeyProvider, string>;
}

function ProviderCard({
  meta,
  saved,
  selected,
  draft,
  saving,
  testing,
  onDraftChange,
  onSave,
  onRemove,
  onSelect,
  onTest,
}: {
  meta: ProviderMeta;
  saved: boolean;
  selected: boolean;
  draft: string;
  saving: boolean;
  testing: boolean;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  onRemove: () => void;
  onSelect: () => void;
  onTest: () => void;
}) {
  const isDark = useIsDark();
  const { t } = useTranslation("app");
  const minLen = meta.isUrl ? 7 : 8;

  return (
    <View className={`rounded-3xl border px-5 py-5 gap-3 ${panelBg(isDark)}`}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className={`font-medium text-base ${textPrimary(isDark)}`}>
            {meta.title}
          </Text>
          <Text className="text-sage-600 text-xs mt-1">
            {t(`aiSettings.providers.${meta.id}.badge`)}
          </Text>
        </View>
        {saved ? (
          <View className="rounded-full bg-sage-100 px-3 py-1">
            <Text className="text-sage-700 text-xs font-medium">
              {meta.isUrl ? t("aiSettings.urlSaved") : t("aiSettings.keySaved")}
            </Text>
          </View>
        ) : (
          <View
            className={`rounded-full px-3 py-1 ${
              isDark ? "bg-sand-700" : "bg-sand-100"
            }`}
          >
            <Text className={`text-xs ${textMuted(isDark)}`}>
              {meta.isUrl ? t("aiSettings.noUrl") : t("aiSettings.noKey")}
            </Text>
          </View>
        )}
      </View>

      <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
        {t(`aiSettings.providers.${meta.id}.why`)}
      </Text>

      <Pressable
        onPress={() =>
          void openDocs(
            meta.docsUrl,
            t("aiSettings.linkUnavailableTitle"),
            t("aiSettings.linkUnavailableBody")
          )
        }
        accessibilityRole="link"
        accessibilityLabel={t("aiSettings.docsA11y", { provider: meta.title })}
      >
        <Text className="text-sage-600 text-sm underline">
          {t("aiSettings.docs", { label: meta.docsLabel })}
        </Text>
      </Pressable>

      {saved ? (
        <View className="gap-3">
          <Text className={`text-xs leading-5 ${textMuted(isDark)}`}>
            {Platform.OS === "web"
              ? t("aiSettings.storageWeb")
              : t("aiSettings.storageNative")}
          </Text>
          <View className="flex-row gap-3 flex-wrap">
            <View className="flex-1 min-w-[140px]">
              <PrimaryButton
                label={
                  selected
                    ? t("aiSettings.engineActive")
                    : t("aiSettings.useEngine")
                }
                onPress={onSelect}
                variant={selected ? "secondary" : "primary"}
                disabled={selected}
              />
            </View>
            <View className="flex-1 min-w-[140px]">
              <PrimaryButton
                label={
                  testing
                    ? t("aiSettings.testing")
                    : t("aiSettings.testConnection")
                }
                onPress={onTest}
                variant="secondary"
                disabled={testing}
              />
            </View>
            <View className="flex-1 min-w-[140px]">
              <PrimaryButton
                label={t("aiSettings.remove")}
                onPress={onRemove}
                variant="ghost"
              />
            </View>
          </View>
        </View>
      ) : (
        <View className="gap-3">
          <TextInput
            value={draft}
            onChangeText={onDraftChange}
            placeholder={t(`aiSettings.providers.${meta.id}.placeholder`)}
            placeholderTextColor="#A89F91"
            secureTextEntry={!meta.isUrl}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            textContentType={meta.isUrl ? "URL" : "password"}
            className={`rounded-2xl border px-4 py-3 text-base ${
              isDark
                ? "bg-sand-900 border-sand-600 text-sand-100"
                : "bg-sand-50 border-sand-200 text-sand-800"
            }`}
            accessibilityLabel={
              meta.isUrl
                ? t("aiSettings.urlFieldLabel", { provider: meta.title })
                : t("aiSettings.keyFieldLabel", { provider: meta.title })
            }
          />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <PrimaryButton
                label={
                  saving ? t("aiSettings.saving") : t("aiSettings.saveLocally")
                }
                onPress={onSave}
                disabled={saving || draft.trim().length < minLen}
              />
            </View>
            <View className="flex-1">
              <PrimaryButton
                label={testing ? t("aiSettings.testing") : t("aiSettings.test")}
                onPress={onTest}
                variant="secondary"
                disabled={testing || draft.trim().length < minLen}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  const isDark = useIsDark();
  return (
    <View className="gap-1 mt-2 mb-1">
      <Text className={`text-base font-medium ${textPrimary(isDark)}`}>
        {title}
      </Text>
      <Text className={`text-xs leading-5 ${textMuted(isDark)}`}>
        {subtitle}
      </Text>
    </View>
  );
}

export function AISettings({
  onRefreshReady,
}: {
  onRefreshReady?: (refresh: () => Promise<void>) => void;
}) {
  const isDark = useIsDark();
  const { t } = useTranslation("app");
  const [savedMap, setSavedMap] =
    useState<Record<AiKeyProvider, boolean>>(emptySavedMap);
  const [drafts, setDrafts] =
    useState<Record<AiKeyProvider, string>>(emptyDrafts);
  const [savingProvider, setSavingProvider] = useState<AiKeyProvider | null>(
    null
  );
  const [testingProvider, setTestingProvider] = useState<AiKeyProvider | null>(
    null
  );
  const [selected, setSelected] = useState<AiKeyProvider>("mistral");
  const [loading, setLoading] = useState(true);

  const european = useMemo(
    () =>
      EUROPEAN_BYOK_PROVIDERS.map((id) => PROVIDER_META[id as ByokProviderId]),
    []
  );
  const canadian = useMemo(
    () =>
      CANADIAN_BYOK_PROVIDERS.map((id) => PROVIDER_META[id as ByokProviderId]),
    []
  );
  const global = useMemo(
    () => GLOBAL_BYOK_PROVIDERS.map((id) => PROVIDER_META[id as ByokProviderId]),
    []
  );

  const refresh = useCallback(async () => {
    const entries = await Promise.all(
      AI_KEY_PROVIDERS.map(async (id) => [id, await hasAiKey(id)] as const)
    );
    const next = emptySavedMap();
    for (const [id, ok] of entries) next[id] = ok;
    setSavedMap(next);
    setSelected(await getSelectedAiProvider());
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    onRefreshReady?.(refresh);
  }, [refresh, onRefreshReady]);

  async function handleSave(provider: AiKeyProvider) {
    setSavingProvider(provider);
    try {
      await saveAiKey(provider, drafts[provider]);
      await setSelectedAiProvider(provider);
      setDrafts((prev) => ({ ...prev, [provider]: "" }));
      setSelected(provider);
      await refresh();
      showAlert(t("aiSettings.savedTitle"), t("aiSettings.savedBody"));
    } catch (error) {
      showAlert(
        t("aiSettings.saveFailTitle"),
        error instanceof Error ? error.message : t("aiSettings.saveFailBody")
      );
    } finally {
      setSavingProvider(null);
    }
  }

  async function handleRemove(provider: AiKeyProvider) {
    try {
      await removeAiKey(provider);
      await refresh();
      showAlert(t("aiSettings.removedTitle"), t("aiSettings.removedBody"));
    } catch (error) {
      showAlert(
        t("aiSettings.removeFailTitle"),
        error instanceof Error ? error.message : t("aiSettings.retryLater")
      );
    }
  }

  async function handleSelect(provider: AiKeyProvider) {
    await setSelectedAiProvider(provider);
    setSelected(provider);
    showAlert(
      t("aiSettings.selectedTitle"),
      t("aiSettings.selectedBody", {
        provider: PROVIDER_META[provider].title,
      })
    );
  }

  async function handleTest(provider: AiKeyProvider) {
    setTestingProvider(provider);
    try {
      const key =
        (await getAiKey(provider))?.trim() || drafts[provider].trim();
      if (!key) {
        showAlert(
          t("aiSettings.nothingToTestTitle"),
          t("aiSettings.nothingToTestBody")
        );
        return;
      }

      const base = getApiUrl().replace(/\/$/, "");
      const response = await fetch(`${base}/api/ai/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: key }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };
      showAlert(
        data.ok ? t("aiSettings.testOkTitle") : t("aiSettings.testFailTitle"),
        data.message ??
          (data.ok
            ? t("aiSettings.testOkBody")
            : t("aiSettings.testFailBody"))
      );
    } catch (error) {
      showAlert(
        t("aiSettings.testErrorTitle"),
        error instanceof Error ? error.message : t("aiSettings.testErrorBody")
      );
    } finally {
      setTestingProvider(null);
    }
  }

  function renderGroup(metas: ProviderMeta[]) {
    return metas.map((meta) => (
      <ProviderCard
        key={meta.id}
        meta={meta}
        saved={savedMap[meta.id]}
        selected={selected === meta.id && savedMap[meta.id]}
        draft={drafts[meta.id]}
        saving={savingProvider === meta.id}
        testing={testingProvider === meta.id}
        onDraftChange={(value) =>
          setDrafts((prev) => ({ ...prev, [meta.id]: value }))
        }
        onSave={() => void handleSave(meta.id)}
        onRemove={() => void handleRemove(meta.id)}
        onSelect={() => void handleSelect(meta.id)}
        onTest={() => void handleTest(meta.id)}
      />
    ));
  }

  if (loading) {
    return (
      <Text className={`text-sm ${textMuted(isDark)}`}>
        {t("aiSettings.loading")}
      </Text>
    );
  }

  return (
    <View className="gap-4 pb-10">
      <View className="flex-row flex-wrap gap-2">
        <View
          className={`rounded-full px-3 py-1.5 border ${
            isDark
              ? "bg-sage-900/40 border-sage-700"
              : "bg-mint-100 border-sage-200"
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              isDark ? "text-sage-200" : "text-sage-800"
            }`}
          >
            {t("aiSettings.badgeLocal")}
          </Text>
        </View>
        <View
          className={`rounded-full px-3 py-1.5 border ${
            isDark
              ? "bg-melon-700/30 border-melon-700"
              : "bg-melon-50 border-melon-200"
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              isDark ? "text-melon-200" : "text-melon-700"
            }`}
          >
            {t("aiSettings.badgeByok")}
          </Text>
        </View>
      </View>

      <View
        className={`rounded-3xl border px-5 py-4 ${
          isDark
            ? "bg-sage-900/30 border-sage-700"
            : "bg-sage-50 border-sage-100"
        }`}
      >
        <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
          {t("aiSettings.disclaimer")}
        </Text>
      </View>

      <SectionTitle
        title={t("aiSettings.europeanTitle")}
        subtitle={t("aiSettings.europeanSubtitle")}
      />
      {renderGroup(european)}

      <SectionTitle
        title={t("aiSettings.canadianTitle")}
        subtitle={t("aiSettings.canadianSubtitle")}
      />
      {renderGroup(canadian)}

      <SectionTitle
        title={t("aiSettings.globalTitle")}
        subtitle={t("aiSettings.globalSubtitle")}
      />
      {renderGroup(global)}
    </View>
  );
}

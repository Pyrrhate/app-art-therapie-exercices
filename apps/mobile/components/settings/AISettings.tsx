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
import {
  EUROPEAN_BYOK_PROVIDERS,
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

type ProviderMeta = {
  id: AiKeyProvider;
  title: string;
  badge: string;
  why: string;
  docsUrl: string;
  docsLabel: string;
  placeholder: string;
  /** Champ = URL plutôt que clé secrète */
  isUrl?: boolean;
};

const PROVIDER_META: Record<AiKeyProvider, ProviderMeta> = {
  mistral: {
    id: "mistral",
    title: "Mistral AI",
    badge: "Recommandé (FR)",
    why: "Modèles francophones fluides pour consignes et miroir créatif.",
    docsUrl: "https://console.mistral.ai/api-keys",
    docsLabel: "console.mistral.ai",
    placeholder: "Coller votre clé Mistral…",
  },
  scaleway: {
    id: "scaleway",
    title: "Scaleway Generative",
    badge: "Souverain UE",
    why: "API générative européenne (compatible OpenAI), hébergée en Europe.",
    docsUrl: "https://console.scaleway.com/",
    docsLabel: "console.scaleway.com",
    placeholder: "Clé API Scaleway…",
  },
  ovhcloud: {
    id: "ovhcloud",
    title: "OVHcloud AI Endpoints",
    badge: "Souverain UE",
    why: "Endpoints IA OVHcloud (compatible OpenAI), données en Europe.",
    docsUrl: "https://endpoints.ai.cloud.ovh.net/",
    docsLabel: "endpoints.ai.cloud.ovh.net",
    placeholder: "Jeton OVHcloud AI…",
  },
  alephalpha: {
    id: "alephalpha",
    title: "Aleph Alpha",
    badge: "Souverain UE",
    why: "LLM européen (Allemagne) pour une exploration créative souveraine.",
    docsUrl: "https://app.aleph-alpha.com/",
    docsLabel: "app.aleph-alpha.com",
    placeholder: "Clé Aleph Alpha…",
  },
  ollama: {
    id: "ollama",
    title: "Ollama (local)",
    badge: "Hors ligne",
    why: "Modèle sur votre machine — aucune clé cloud. Indiquez l’URL du service. Sur API hébergée (Vercel), Ollama doit être joignable depuis le serveur (tunnel / IP), pas seulement localhost du téléphone.",
    docsUrl: "https://ollama.com/",
    docsLabel: "ollama.com",
    placeholder: "http://127.0.0.1:11434",
    isUrl: true,
  },
  openai: {
    id: "openai",
    title: "OpenAI",
    badge: "Global",
    why: "Alternative polyvalente texte / image si vous avez déjà un compte.",
    docsUrl: "https://platform.openai.com/api-keys",
    docsLabel: "platform.openai.com",
    placeholder: "Clé OpenAI…",
  },
  anthropic: {
    id: "anthropic",
    title: "Anthropic (Claude)",
    badge: "Vision",
    why: "Excellent pour observer une œuvre avec nuance, sans jugement esthétique.",
    docsUrl: "https://console.anthropic.com/settings/keys",
    docsLabel: "console.anthropic.com",
    placeholder: "Clé Anthropic…",
  },
  gemini: {
    id: "gemini",
    title: "Google Gemini",
    badge: "Créatif / rapide",
    why: "Modèles Gemini (ex. 2.5 Flash). Créez une clé sur AI Studio sans restriction HTTP / IP — Pastek relaie depuis le serveur.",
    docsUrl: "https://aistudio.google.com/apikey",
    docsLabel: "aistudio.google.com",
    placeholder: "Clé Google AI…",
  },
};

async function openDocs(url: string): Promise<void> {
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
  showAlert("Lien indisponible", "Ouvrez le tableau de bord API dans votre navigateur.");
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
  const minLen = meta.isUrl ? 7 : 8;

  return (
    <View className={`rounded-3xl border px-5 py-5 gap-3 ${panelBg(isDark)}`}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className={`font-medium text-base ${textPrimary(isDark)}`}>
            {meta.title}
          </Text>
          <Text className="text-sage-600 text-xs mt-1">{meta.badge}</Text>
        </View>
        {saved ? (
          <View className="rounded-full bg-sage-100 px-3 py-1">
            <Text className="text-sage-700 text-xs font-medium">
              {meta.isUrl ? "URL enregistrée" : "Clé enregistrée"}
            </Text>
          </View>
        ) : (
          <View
            className={`rounded-full px-3 py-1 ${
              isDark ? "bg-sand-700" : "bg-sand-100"
            }`}
          >
            <Text className={`text-xs ${textMuted(isDark)}`}>
              {meta.isUrl ? "Aucune URL" : "Aucune clé"}
            </Text>
          </View>
        )}
      </View>

      <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
        {meta.why}
      </Text>

      <Pressable
        onPress={() => void openDocs(meta.docsUrl)}
        accessibilityRole="link"
        accessibilityLabel={`Documentation ${meta.title}`}
      >
        <Text className="text-sage-600 text-sm underline">
          Documentation → {meta.docsLabel}
        </Text>
      </Pressable>

      {saved ? (
        <View className="gap-3">
          <Text className={`text-xs leading-5 ${textMuted(isDark)}`}>
            Stockage local
            {Platform.OS === "web"
              ? " (navigateur)."
              : " (coffre sécurisé)."}{" "}
            Pastek Art ne conserve jamais la clé sur ses serveurs.
          </Text>
          <View className="flex-row gap-3 flex-wrap">
            <View className="flex-1 min-w-[140px]">
              <PrimaryButton
                label={selected ? "Moteur actif" : "Utiliser ce moteur"}
                onPress={onSelect}
                variant={selected ? "secondary" : "primary"}
                disabled={selected}
              />
            </View>
            <View className="flex-1 min-w-[140px]">
              <PrimaryButton
                label={testing ? "Test…" : "Tester la connexion"}
                onPress={onTest}
                variant="secondary"
                disabled={testing}
              />
            </View>
            <View className="flex-1 min-w-[140px]">
              <PrimaryButton
                label="Supprimer"
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
            placeholder={meta.placeholder}
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
              meta.isUrl ? `URL ${meta.title}` : `Clé API ${meta.title}`
            }
          />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <PrimaryButton
                label={saving ? "Enregistrement…" : "Sauvegarder localement"}
                onPress={onSave}
                disabled={saving || draft.trim().length < minLen}
              />
            </View>
            <View className="flex-1">
              <PrimaryButton
                label={testing ? "Test…" : "Tester"}
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
      showAlert(
        "Enregistré localement",
        "La valeur reste sur cet appareil. Pastek Art ne la stocke pas."
      );
    } catch (error) {
      showAlert(
        "Impossible d'enregistrer",
        error instanceof Error ? error.message : "Vérifiez la valeur et réessayez."
      );
    } finally {
      setSavingProvider(null);
    }
  }

  async function handleRemove(provider: AiKeyProvider) {
    try {
      await removeAiKey(provider);
      await refresh();
      showAlert("Supprimé", "Ce moteur n'est plus disponible localement.");
    } catch (error) {
      showAlert(
        "Suppression impossible",
        error instanceof Error ? error.message : "Réessayez dans un instant."
      );
    }
  }

  async function handleSelect(provider: AiKeyProvider) {
    await setSelectedAiProvider(provider);
    setSelected(provider);
    showAlert(
      "Moteur sélectionné",
      `${PROVIDER_META[provider].title} sera utilisé pour vos prochaines générations.`
    );
  }

  async function handleTest(provider: AiKeyProvider) {
    setTestingProvider(provider);
    try {
      const key =
        (await getAiKey(provider))?.trim() || drafts[provider].trim();
      if (!key) {
        showAlert("Rien à tester", "Enregistrez ou saisissez une clé / URL.");
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
        data.ok ? "Connexion OK" : "Échec du test",
        data.message ??
          (data.ok
            ? "Le fournisseur a répondu."
            : "Vérifiez la clé, le modèle et le réseau.")
      );
    } catch (error) {
      showAlert(
        "Test impossible",
        error instanceof Error
          ? error.message
          : "Impossible de joindre l’API Pastek."
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
        Chargement des moteurs…
      </Text>
    );
  }

  return (
    <View className="gap-4 pb-10">
      <View
        className={`rounded-3xl border px-5 py-4 ${
          isDark
            ? "bg-sage-900/30 border-sage-700"
            : "bg-sage-50 border-sage-100"
        }`}
      >
        <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
          Cette application est un outil de génération d&apos;exercices créatifs
          et d&apos;exploration personnelle. Elle ne remplace pas une thérapie
          médicale ou psychologique.
        </Text>
      </View>

      <SectionTitle
        title="🇪🇺 Fournisseurs européens & souverains"
        subtitle="Mistral, Scaleway, OVHcloud, Aleph Alpha, Ollama local."
      />
      {renderGroup(european)}

      <SectionTitle
        title="🌐 Fournisseurs globaux"
        subtitle="OpenAI, Anthropic, Google Gemini."
      />
      {renderGroup(global)}
    </View>
  );
}

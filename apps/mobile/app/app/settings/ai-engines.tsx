import { useCallback, useEffect, useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { showAlert } from "@/lib/alert";
import {
  getSelectedAiProvider,
  hasAiKey,
  removeAiKey,
  saveAiKey,
  setSelectedAiProvider,
  type AiKeyProvider,
} from "@/lib/aiKeys";
import { ROUTES } from "@/lib/routes";
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
};

const PROVIDERS: ProviderMeta[] = [
  {
    id: "mistral",
    title: "Mistral AI",
    badge: "Recommandé pour le texte",
    why: "Modèles francophones fluides, idéaux pour les consignes créatives et le miroir chaleureux — ton doux, sans jargon clinique.",
    docsUrl: "https://console.mistral.ai/api-keys",
    docsLabel: "console.mistral.ai",
    placeholder: "Coller votre clé Mistral…",
  },
  {
    id: "anthropic",
    title: "Anthropic (Claude)",
    badge: "Recommandé pour la vision",
    why: "Excellent pour observer une œuvre avec nuance : couleurs, geste, composition — sans juger la « qualité » artistique.",
    docsUrl: "https://console.anthropic.com/settings/keys",
    docsLabel: "console.anthropic.com",
    placeholder: "Coller votre clé Anthropic…",
  },
  {
    id: "openai",
    title: "OpenAI",
    badge: "Option avancée",
    why: "Alternative polyvalente (texte et image). Utile si vous avez déjà un compte OpenAI et une clé active.",
    docsUrl: "https://platform.openai.com/api-keys",
    docsLabel: "platform.openai.com",
    placeholder: "Coller votre clé OpenAI…",
  },
];

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

function ProviderCard({
  meta,
  saved,
  selected,
  draft,
  saving,
  onDraftChange,
  onSave,
  onRemove,
  onSelect,
}: {
  meta: ProviderMeta;
  saved: boolean;
  selected: boolean;
  draft: string;
  saving: boolean;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  onRemove: () => void;
  onSelect: () => void;
}) {
  const isDark = useIsDark();

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
              Clé enregistrée
            </Text>
          </View>
        ) : (
          <View
            className={`rounded-full px-3 py-1 ${
              isDark ? "bg-sand-700" : "bg-sand-100"
            }`}
          >
            <Text className={`text-xs ${textMuted(isDark)}`}>Aucune clé</Text>
          </View>
        )}
      </View>

      <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
        {meta.why}
      </Text>

      <Pressable
        onPress={() => void openDocs(meta.docsUrl)}
        accessibilityRole="link"
        accessibilityLabel={`Comment obtenir ma clé ${meta.title}`}
      >
        <Text className="text-sage-600 text-sm underline">
          Comment obtenir ma clé ? → {meta.docsLabel}
        </Text>
      </Pressable>

      {saved ? (
        <View className="gap-3">
          <Text className={`text-xs leading-5 ${textMuted(isDark)}`}>
            Votre clé reste sur cet appareil
            {Platform.OS === "web"
              ? " (stockage navigateur)."
              : " (coffre sécurisé)."}{" "}
            Pastek Art ne la conserve jamais sur ses serveurs.
          </Text>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <PrimaryButton
                label={selected ? "Moteur actif" : "Utiliser ce moteur"}
                onPress={onSelect}
                variant={selected ? "secondary" : "primary"}
                disabled={selected}
              />
            </View>
            <View className="flex-1">
              <PrimaryButton
                label="Supprimer la clé"
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
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            textContentType="password"
            className={`rounded-2xl border px-4 py-3 text-base ${
              isDark
                ? "bg-sand-900 border-sand-600 text-sand-100"
                : "bg-sand-50 border-sand-200 text-sand-800"
            }`}
            accessibilityLabel={`Clé API ${meta.title}`}
          />
          <PrimaryButton
            label={saving ? "Enregistrement…" : "Sauvegarder localement"}
            onPress={onSave}
            disabled={saving || draft.trim().length < 8}
          />
        </View>
      )}
    </View>
  );
}

export default function AiEnginesScreen() {
  const isDark = useIsDark();
  const [savedMap, setSavedMap] = useState<Record<AiKeyProvider, boolean>>({
    mistral: false,
    anthropic: false,
    openai: false,
  });
  const [drafts, setDrafts] = useState<Record<AiKeyProvider, string>>({
    mistral: "",
    anthropic: "",
    openai: "",
  });
  const [savingProvider, setSavingProvider] = useState<AiKeyProvider | null>(
    null
  );
  const [selected, setSelected] = useState<AiKeyProvider>("mistral");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [mistral, anthropic, openai, preferred] = await Promise.all([
      hasAiKey("mistral"),
      hasAiKey("anthropic"),
      hasAiKey("openai"),
      getSelectedAiProvider(),
    ]);
    setSavedMap({ mistral, anthropic, openai });
    setSelected(preferred);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleSave(provider: AiKeyProvider) {
    setSavingProvider(provider);
    try {
      await saveAiKey(provider, drafts[provider]);
      await setSelectedAiProvider(provider);
      setDrafts((prev) => ({ ...prev, [provider]: "" }));
      setSelected(provider);
      await refresh();
      showAlert(
        "Clé enregistrée",
        "Elle reste sur cet appareil. Vous pouvez maintenant générer avec votre propre moteur."
      );
    } catch (error) {
      showAlert(
        "Impossible d'enregistrer",
        error instanceof Error ? error.message : "Vérifiez la clé et réessayez."
      );
    } finally {
      setSavingProvider(null);
    }
  }

  async function handleRemove(provider: AiKeyProvider) {
    try {
      await removeAiKey(provider);
      await refresh();
      showAlert("Clé supprimée", "Le moteur n'est plus disponible localement.");
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
      `${PROVIDERS.find((p) => p.id === provider)?.title ?? provider} sera utilisé pour vos prochaines générations.`
    );
  }

  return (
    <ScreenContainer scrollable refreshable onRefresh={refresh} compactTop>
      <ScreenNavBar
        backLabel="← Réglages"
        onBack={() => router.push(ROUTES.settings)}
      />

      <PastekScreenHero
        label="Moteurs IA"
        title="Vos clés, "
        accent="votre confidentialité"
        description="Apportez votre propre clé API (BYOK). Elle reste sur l'appareil et n'est jamais stockée par Pastek Art."
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
          Sans clé personnelle, l&apos;app utilise le mode gratuit (Hugging Face)
          ou le secours local. Avec une clé, vous pilotez le modèle — Pastek Art
          ne fait que relayer la requête, sans conserver la clé.
        </Text>
      </View>

      {loading ? (
        <Text className={`text-sm ${textMuted(isDark)}`}>
          Chargement des moteurs…
        </Text>
      ) : (
        <View className="gap-4 pb-10">
          {PROVIDERS.map((meta) => (
            <ProviderCard
              key={meta.id}
              meta={meta}
              saved={savedMap[meta.id]}
              selected={selected === meta.id && savedMap[meta.id]}
              draft={drafts[meta.id]}
              saving={savingProvider === meta.id}
              onDraftChange={(value) =>
                setDrafts((prev) => ({ ...prev, [meta.id]: value }))
              }
              onSave={() => void handleSave(meta.id)}
              onRemove={() => void handleRemove(meta.id)}
              onSelect={() => void handleSelect(meta.id)}
            />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

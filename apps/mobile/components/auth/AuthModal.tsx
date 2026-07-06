import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { PrimaryButton } from "@/components/ui/Button";
import { PREMIUM_SIGNUP_CREDITS } from "@art-therapie/shared";
import { showAlert } from "@/lib/alert";
import { signInWithMagicLink, signInWithOAuth } from "@/lib/supabase/auth";
import { formatAuthError } from "@/lib/supabase/errors";
import {
  initSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = "form" | "magic-link-sent";

export function AuthModal({ visible, onClose, onSuccess }: AuthModalProps) {
  const isDark = useIsDark();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [busy, setBusy] = useState<"email" | "google" | "azure" | null>(null);

  const [ready, setReady] = useState(isSupabaseConfigured());

  useEffect(() => {
    if (!visible) {
      setStep("form");
      setEmail("");
      setBusy(null);
      return;
    }
    if (!ready) {
      void initSupabaseClient().then(setReady);
    }
  }, [visible, ready]);

  async function handleMagicLink() {
    const trimmed = email.trim();
    if (!trimmed.includes("@")) {
      showAlert("Email invalide", "Entrez une adresse email valide.");
      return;
    }

    setBusy("email");
    try {
      await signInWithMagicLink(trimmed);
      setStep("magic-link-sent");
    } catch (error) {
      showAlert("Lien magique", formatAuthError(error, "email"));
    } finally {
      setBusy(null);
    }
  }

  async function handleOAuth(provider: "google" | "azure") {
    setBusy(provider);
    try {
      await signInWithOAuth(provider);
      onSuccess?.();
      onClose();
    } catch (error) {
      showAlert("Connexion", formatAuthError(error, provider));
    } finally {
      setBusy(null);
    }
  }

  if (!visible) return null;

  const cardBg = isDark ? "bg-sand-800 border-sand-700" : "bg-sand-50 border-sage-100";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 justify-end sm:justify-center px-4 pb-8 sm:pb-0"
        style={{ backgroundColor: "rgba(42, 47, 40, 0.45)" }}
        onPress={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable
            onPress={(e) => e.stopPropagation?.()}
            className={`rounded-3xl border px-6 py-6 max-w-md w-full self-center ${cardBg}`}
            style={
              Platform.OS === "web"
                ? ({ boxShadow: "0 8px 30px rgba(73, 99, 73, 0.12)" } as const)
                : undefined
            }
          >
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1 pr-4">
                <Text className="text-xs uppercase tracking-widest text-sage-500 mb-1">
                  Compte Pastek Art
                </Text>
                <Text className={`font-display text-xl ${textPrimary(isDark)}`}>
                  Sécurisez votre Fil créatif
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Fermer">
                <Text className={`text-lg ${textMuted(isDark)}`}>×</Text>
              </Pressable>
            </View>

            {step === "magic-link-sent" ? (
              <View className="gap-4">
                <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
                  Un lien de connexion a été envoyé à{" "}
                  <Text className="font-medium">{email.trim()}</Text>. Ouvrez-le
                  sur cet appareil pour activer votre compte et synchroniser
                  votre historique.
                </Text>
                <Text className={`text-xs leading-5 ${textMuted(isDark)}`}>
                  Vous recevez {PREMIUM_SIGNUP_CREDITS} générations Premium
                  offertes à la création du compte.
                </Text>
                <PrimaryButton label="Fermer" onPress={onClose} variant="ghost" />
              </View>
            ) : (
              <View className="gap-4">
                {!ready ? (
                  <View className="items-center py-6">
                    <ActivityIndicator color="#496349" />
                  </View>
                ) : (
                  <>
                <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
                  Connexion sans mot de passe. Vos traces restent sur l&apos;appareil
                  jusqu&apos;à la première synchronisation.
                </Text>

                <View>
                  <Text className={`text-xs mb-2 ${textMuted(isDark)}`}>
                    Email — lien magique
                  </Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    placeholder="vous@exemple.fr"
                    placeholderTextColor={isDark ? "#8A8078" : "#B8A090"}
                    className={`rounded-2xl border px-4 py-3 text-base ${
                      isDark
                        ? "border-sand-600 bg-sand-900 text-sand-100"
                        : "border-sand-200 bg-white text-sand-800"
                    }`}
                  />
                </View>

                <PrimaryButton
                  label={busy === "email" ? "Envoi…" : "Recevoir le lien magique"}
                  onPress={() => void handleMagicLink()}
                  disabled={busy !== null}
                />

                <View className="flex-row items-center gap-3 my-1">
                  <View
                    className={`flex-1 h-px ${isDark ? "bg-sand-700" : "bg-sand-200"}`}
                  />
                  <Text className={`text-xs ${textMuted(isDark)}`}>ou</Text>
                  <View
                    className={`flex-1 h-px ${isDark ? "bg-sand-700" : "bg-sand-200"}`}
                  />
                </View>

                <View className="gap-3">
                  <OAuthButton
                    label="Continuer avec Google"
                    busy={busy === "google"}
                    disabled={busy !== null && busy !== "google"}
                    onPress={() => void handleOAuth("google")}
                    isDark={isDark}
                  />
                  <OAuthButton
                    label="Continuer avec Microsoft"
                    busy={busy === "azure"}
                    disabled={busy !== null && busy !== "azure"}
                    onPress={() => void handleOAuth("azure")}
                    isDark={isDark}
                  />
                </View>

                <Text className={`text-xs text-center leading-5 ${textMuted(isDark)}`}>
                  Gratuit · sans carte bancaire · {PREMIUM_SIGNUP_CREDITS}{" "}
                  générations Premium offertes
                </Text>
                  </>
                )}
              </View>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

function OAuthButton({
  label,
  onPress,
  busy,
  disabled,
  isDark,
}: {
  label: string;
  onPress: () => void;
  busy: boolean;
  disabled: boolean;
  isDark: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`rounded-full px-6 py-3.5 min-h-[48px] flex-row items-center justify-center gap-2 border ${
        isDark ? "bg-sand-900 border-sand-600" : "bg-white border-sand-200"
      } ${disabled ? "opacity-50" : ""}`}
    >
      {busy ? (
        <ActivityIndicator color="#496349" />
      ) : (
        <Text
          className={`text-sm font-medium ${
            isDark ? "text-sand-100" : "text-sand-800"
          }`}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

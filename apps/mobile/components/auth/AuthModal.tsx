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
import { useTranslation } from "react-i18next";
import { PrimaryButton } from "@/components/ui/Button";
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
  const { t } = useTranslation("app");
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
      showAlert(t("auth.invalidEmailTitle"), t("auth.invalidEmailBody"));
      return;
    }

    setBusy("email");
    try {
      await signInWithMagicLink(trimmed);
      setStep("magic-link-sent");
    } catch (error) {
      showAlert(t("auth.magicLinkAlertTitle"), formatAuthError(error, "email"));
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
      showAlert(t("auth.signInAlertTitle"), formatAuthError(error, provider));
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
                  {t("auth.brand")}
                </Text>
                <Text className={`font-display text-xl ${textPrimary(isDark)}`}>
                  {t("auth.title")}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                accessibilityLabel={t("auth.close")}
              >
                <Text className={`text-lg ${textMuted(isDark)}`}>×</Text>
              </Pressable>
            </View>

            {step === "magic-link-sent" ? (
              <View className="gap-4">
                <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
                  {t("auth.magicLinkSent", { email: email.trim() })}
                </Text>
                <PrimaryButton
                  label={t("auth.close")}
                  onPress={onClose}
                  variant="ghost"
                />
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
                  {t("auth.intro")}
                </Text>

                <View>
                  <Text className={`text-xs mb-2 ${textMuted(isDark)}`}>
                    {t("auth.emailLabel")}
                  </Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    placeholder={t("auth.emailPlaceholder")}
                    placeholderTextColor={isDark ? "#8A8078" : "#B8A090"}
                    className={`rounded-2xl border px-4 py-3 text-base ${
                      isDark
                        ? "border-sand-600 bg-sand-900 text-sand-100"
                        : "border-sand-200 bg-white text-sand-800"
                    }`}
                  />
                </View>

                <PrimaryButton
                  label={
                    busy === "email" ? t("auth.sending") : t("auth.sendLink")
                  }
                  onPress={() => void handleMagicLink()}
                  disabled={busy !== null}
                />

                <View className="flex-row items-center gap-3 my-1">
                  <View
                    className={`flex-1 h-px ${isDark ? "bg-sand-700" : "bg-sand-200"}`}
                  />
                  <Text className={`text-xs ${textMuted(isDark)}`}>
                    {t("auth.or")}
                  </Text>
                  <View
                    className={`flex-1 h-px ${isDark ? "bg-sand-700" : "bg-sand-200"}`}
                  />
                </View>

                <View className="gap-3">
                  <OAuthButton
                    label={t("auth.continueGoogle")}
                    busy={busy === "google"}
                    disabled={busy !== null && busy !== "google"}
                    onPress={() => void handleOAuth("google")}
                    isDark={isDark}
                  />
                  <OAuthButton
                    label={t("auth.continueMicrosoft")}
                    busy={busy === "azure"}
                    disabled={busy !== null && busy !== "azure"}
                    onPress={() => void handleOAuth("azure")}
                    isDark={isDark}
                  />
                </View>

                <Text className={`text-xs text-center leading-5 ${textMuted(isDark)}`}>
                  {t("auth.footer")}
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

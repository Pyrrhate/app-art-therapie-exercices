import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { formatSessionDate } from "@/constants";
import type { CloudIntegrationStatus } from "@/lib/integrations/cloud";
import { panelBg, textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface CloudProviderToggleProps {
  title: string;
  description: string;
  status: CloudIntegrationStatus | null;
  loading: boolean;
  disabled?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function CloudProviderToggle({
  title,
  description,
  status,
  loading,
  disabled = false,
  onConnect,
  onDisconnect,
}: CloudProviderToggleProps) {
  const isDark = useIsDark();
  const connected = status?.connected ?? false;

  return (
    <View
      className={`rounded-2xl border px-4 py-4 gap-3 ${panelBg(isDark)} ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className={`font-medium mb-1 ${textPrimary(isDark)}`}>
            {title}
          </Text>
          <Text className={`text-sm leading-5 ${textSecondary(isDark)}`}>
            {description}
          </Text>
          {status && !status.configured ? (
            <Text className="text-amber-700 text-xs mt-2 leading-5">
              OAuth serveur non configuré — connexion en attente de déploiement.
            </Text>
          ) : null}
          {connected && status?.providerAccountId ? (
            <Text className={`text-xs mt-2 ${textMuted(isDark)}`}>
              Compte : {status.providerAccountId}
            </Text>
          ) : null}
          {connected && status?.connectedAt ? (
            <Text className={`text-xs ${textMuted(isDark)}`}>
              Connecté le {formatSessionDate(status.connectedAt)}
            </Text>
          ) : null}
        </View>
        {loading ? <ActivityIndicator color="#496349" /> : null}
      </View>

      <Pressable
        onPress={connected ? onDisconnect : onConnect}
        disabled={disabled || loading}
        className={`rounded-full py-3 px-5 items-center border ${
          connected
            ? isDark
              ? "border-sand-600 bg-transparent"
              : "border-sand-300 bg-white"
            : "bg-sage-500 border-sage-500"
        }`}
      >
        <Text
          className={`text-sm font-semibold ${
            connected
              ? isDark
                ? "text-sand-200"
                : "text-sand-800"
              : "text-white"
          }`}
        >
          {connected ? "Déconnecter" : "Connecter"}
        </Text>
      </Pressable>
    </View>
  );
}

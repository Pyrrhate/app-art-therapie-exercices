import { Text, View } from "react-native";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { CHANGELOG } from "@/lib/changelog";
import { textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

export default function ChangelogScreen() {
  const isDark = useIsDark();

  return (
    <ScreenContainer scrollable refreshable compactTop>
      <ScreenNavBar />

      <PastekScreenHero
        label="Produit"
        title="Mises à "
        accent="jour"
        description="Les grandes évolutions de Pastek Art — sans les petits correctifs du quotidien."
        className="mb-8"
      />

      <View className="gap-4 pb-8">
        {CHANGELOG.map((entry, index) => (
          <View
            key={entry.id}
            className={`rounded-2xl border px-5 py-5 ${
              isDark ? "border-sand-700 bg-sand-900/40" : "border-sand-200 bg-white"
            }`}
          >
            <View className="flex-row items-start justify-between gap-3 mb-3">
              <Text
                className={`font-display text-lg leading-6 flex-1 ${textPrimary(isDark)}`}
              >
                {entry.title}
              </Text>
              {index === 0 ? (
                <View className="bg-sage-100 rounded-full px-2.5 py-1 shrink-0">
                  <Text className="text-sage-700 text-[10px] font-semibold uppercase tracking-wider">
                    Récent
                  </Text>
                </View>
              ) : null}
            </View>

            <Text className={`text-xs uppercase tracking-wider mb-3 ${textMuted(isDark)}`}>
              {entry.dateLabel}
            </Text>

            <View className="gap-2">
              {entry.highlights.map((line) => (
                <View key={line} className="flex-row gap-2">
                  <Text className={`text-sm leading-5 ${textMuted(isDark)}`}>·</Text>
                  <Text className={`text-sm leading-6 flex-1 ${textSecondary(isDark)}`}>
                    {line}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      <Text className={`text-xs text-center leading-5 pb-8 ${textMuted(isDark)}`}>
        Pastek Art · générateur d&apos;exercices d&apos;art-thérapie
      </Text>
    </ScreenContainer>
  );
}

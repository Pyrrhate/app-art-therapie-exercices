import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { FEATURES } from "@/lib/features";
import type { MandalaTheme } from "@/lib/mandala/types";
import { MANDALA_THEME_LABELS } from "@/lib/mandala/palette";

const THEMES: MandalaTheme[] = ["calm", "energy", "focus"];

export default function MandalaThemeScreen() {
  useEffect(() => {
    if (!FEATURES.mandala) {
      router.replace("/");
    }
  }, []);

  if (!FEATURES.mandala) {
    return null;
  }

  return (
    <ScreenContainer scrollable refreshable>
      <ScreenNavBar
        backLabel="← Accueil"
        onBack={() => router.replace("/")}
      />

      <PastekScreenHero
        label="Studio Mandala"
        title="Une pause "
        accent="apaisante"
        description="Détente créative à votre rythme — sans chrono ni score. Choisissez une intention ci-dessous ; si vous le souhaitez, votre mandala pourra ensuite devenir une impulsion vers un exercice."
        className="mb-8"
      />

      <View className="gap-4 pb-6">
        {THEMES.map((theme) => {
          const meta = MANDALA_THEME_LABELS[theme];
          return (
            <Pressable
              key={theme}
              onPress={() =>
                router.push({
                  pathname: "/mandala/studio",
                  params: { theme },
                })
              }
              className="bg-white rounded-3xl border border-sand-100 px-5 py-5 active:border-sage-500"
            >
              <Text className="text-2xl mb-2">{meta.emoji}</Text>
              <Text className="text-sand-800 font-medium text-lg mb-1">
                {meta.title}
              </Text>
              <Text className="text-sand-500 text-sm leading-5">
                {meta.subtitle}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <PrimaryButton
        label="Retour à l'accueil"
        onPress={() => router.replace("/")}
        variant="ghost"
      />
    </ScreenContainer>
  );
}

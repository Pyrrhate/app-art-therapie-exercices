import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ColorSwatch } from "@/components/color-journey/ColorSwatch";
import { PrimaryButton } from "@/components/ui/Button";
import type { JourneyReflection } from "@/lib/color-journey/types";

interface ReflectionPanelProps {
  data: JourneyReflection;
  onRequestMirror?: () => void;
  mirrorLoading?: boolean;
}

export function ReflectionPanel({
  data,
  onRequestMirror,
  mirrorLoading = false,
}: ReflectionPanelProps) {
  const { t } = useTranslation("amorces");

  return (
    <View className="bg-white rounded-2xl border border-sage-200 px-5 py-5 mb-4">
      <View className="flex-row items-center mb-3">
        <ColorSwatch hex={data.chosen.hex} size={32} className="mr-3" />
        <Text className="text-sage-700 font-medium flex-1">{data.chosen.label}</Text>
      </View>
      <Text className="text-sand-700 text-base leading-7 mb-3">
        {data.aiMirror ?? data.reflection}
      </Text>
      {!data.aiMirror && data.psychology !== data.reflection ? (
        <Text className="text-sand-500 text-sm leading-6 mb-2">
          {data.psychology}
        </Text>
      ) : null}
      {data.mixRecipe ? (
        <View className="bg-sage-50 rounded-xl px-3 py-2 mb-2">
          <Text className="text-sage-600 text-xs uppercase tracking-wider mb-1">
            {t("colorJourney.mixRecipe")}
          </Text>
          <Text className="text-sand-600 text-sm leading-5">{data.mixRecipe}</Text>
        </View>
      ) : null}
      <Text className="text-sand-400 text-sm leading-6 italic mb-2">
        {data.theory}
      </Text>
      {data.question ? (
        <Text className="text-sage-600 text-sm leading-6 mt-2">
          · {data.question}
        </Text>
      ) : null}
      {onRequestMirror && !data.aiMirror ? (
        <View className="mt-4">
          <PrimaryButton
            label={
              mirrorLoading
                ? t("colorJourney.adviceLoading")
                : t("colorJourney.adviceAsk")
            }
            onPress={onRequestMirror}
            variant="ghost"
            disabled={mirrorLoading}
            align="start"
          />
        </View>
      ) : null}
      {data.aiMirror ? (
        <Text className="text-sage-500 text-xs mt-3">
          {t("colorJourney.adviceGiven")}
        </Text>
      ) : null}
    </View>
  );
}

import { Text, View } from "react-native";
import { SemanticWeb } from "@/components/landing/SemanticWeb";

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <SemanticWeb tag="footer" className="bg-sand-100 border-t border-sand-200">
      <View className="max-w-5xl mx-auto px-6 py-8">
        <Text className="text-sand-500 text-sm text-center leading-6">
          Générateur d'exercices d'art-thérapie — rituels créatifs pour le bien-être. ©{" "}
          {year}
        </Text>
      </View>
    </SemanticWeb>
  );
}

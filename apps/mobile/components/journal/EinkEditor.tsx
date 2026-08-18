/**
 * Éditeur de texte minimaliste à l'aspect e-ink / papier crème.
 */
import { Platform, Text, TextInput, View } from "react-native";
import { useIsDark } from "@/lib/themeStore";

interface EinkEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function EinkEditor({
  value,
  onChangeText,
  placeholder = "Vos notes…",
  minHeight = 180,
}: EinkEditorProps) {
  const isDark = useIsDark();

  const paperBg = isDark ? "#1E1C18" : "#FAF6F0";
  const borderColor = isDark ? "#3A3630" : "#E0D6C8";
  const textColor = isDark ? "#DDD5C8" : "#3A3020";
  const placeholderColor = isDark ? "#6A6258" : "#B8A898";
  const footerBg = isDark ? "#252320" : "#F3EDE3";
  const footerBorder = isDark ? "#3A3630" : "#DDD3C3";

  const containerShadow =
    Platform.OS === "web"
      ? ({
          boxShadow: isDark
            ? "inset 0 1px 3px rgba(0,0,0,0.4)"
            : "inset 0 1px 3px rgba(100,80,50,0.10), 0 1px 0 rgba(255,255,255,0.6)",
        } as const)
      : undefined;

  return (
    <View
      style={[
        {
          borderRadius: 16,
          borderWidth: 1,
          borderColor,
          overflow: "hidden",
          backgroundColor: paperBg,
        },
        containerShadow,
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        multiline
        textAlignVertical="top"
        style={{
          minHeight,
          paddingHorizontal: 18,
          paddingTop: 16,
          paddingBottom: 12,
          fontSize: 15,
          lineHeight: 26,
          color: textColor,
          backgroundColor: paperBg,
          fontFamily: Platform.OS === "web" ? "Georgia, serif" : undefined,
          letterSpacing: 0.2,
        }}
        autoCorrect
        spellCheck
        scrollEnabled={false}
      />

      {/* Pied de page : compteur de caractères */}
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 6,
          backgroundColor: footerBg,
          borderTopWidth: 1,
          borderTopColor: footerBorder,
          alignItems: "flex-end",
        }}
      >
        <Text
          style={{
            fontSize: 10,
            color: placeholderColor,
            letterSpacing: 0.4,
          }}
        >
          {value.length > 0 ? `${value.length} car.` : ""}
        </Text>
      </View>
    </View>
  );
}

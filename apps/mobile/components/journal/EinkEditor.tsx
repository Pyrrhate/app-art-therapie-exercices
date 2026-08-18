/**
 * Éditeur de texte minimaliste à l'aspect e-ink / papier crème.
 * Fonctionnalités légères : gras, italique, soulignement via raccourcis boutons.
 */
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import { useIsDark } from "@/lib/themeStore";

type Format = "bold" | "italic" | "underline";

interface EinkEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  minHeight?: number;
}

function wrap(
  value: string,
  selection: { start: number; end: number },
  open: string,
  close: string
): { text: string; cursor: number } {
  const before = value.slice(0, selection.start);
  const selected = value.slice(selection.start, selection.end);
  const after = value.slice(selection.end);
  const text = `${before}${open}${selected}${close}${after}`;
  return { text, cursor: selection.end + open.length + close.length };
}

const FORMATS: { key: Format; open: string; close: string; label: string }[] = [
  { key: "bold", open: "**", close: "**", label: "G" },
  { key: "italic", open: "_", close: "_", label: "I" },
  { key: "underline", open: "<u>", close: "</u>", label: "S" },
];

export function EinkEditor({
  value,
  onChangeText,
  placeholder = "Vos notes…",
  minHeight = 180,
}: EinkEditorProps) {
  const isDark = useIsDark();

  /* Sur mobile, React Native ne donne pas la sélection active en dehors d'un ref.
     On insère la balise à la fin du texte pour permettre à l'utilisateur de
     taper dedans juste après. */
  function applyFormat(fmt: (typeof FORMATS)[number]) {
    const trimmed = value.trimEnd();
    const sep = trimmed.length > 0 && !trimmed.endsWith("\n") ? "\n" : "";
    const newText = `${trimmed}${sep}${fmt.open}${fmt.close}`;
    onChangeText(newText);
  }

  const paperBg = isDark ? "#1E1C18" : "#FAF6F0";
  const borderColor = isDark ? "#3A3630" : "#E0D6C8";
  const textColor = isDark ? "#DDD5C8" : "#3A3020";
  const placeholderColor = isDark ? "#6A6258" : "#B8A898";
  const toolbarBg = isDark ? "#252320" : "#F3EDE3";
  const toolbarBorder = isDark ? "#3A3630" : "#DDD3C3";
  const btnBg = isDark ? "#302C28" : "#EDE5D8";
  const btnText = isDark ? "#C8BEB0" : "#6A5C4C";
  const btnBorder = isDark ? "#4A4540" : "#D4C8B8";

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
      {/* Barre d'outils */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 8,
          backgroundColor: toolbarBg,
          borderBottomWidth: 1,
          borderBottomColor: toolbarBorder,
        }}
      >
        {FORMATS.map((fmt) => (
          <Pressable
            key={fmt.key}
            onPress={() => applyFormat(fmt)}
            accessibilityRole="button"
            accessibilityLabel={fmt.label}
            hitSlop={6}
            style={({ pressed }) => ({
              borderRadius: 8,
              borderWidth: 1,
              borderColor: btnBorder,
              backgroundColor: pressed ? borderColor : btnBg,
              paddingHorizontal: 10,
              paddingVertical: 5,
              minWidth: 32,
              alignItems: "center" as const,
            })}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: fmt.key === "bold" ? "700" : "400",
                fontStyle: fmt.key === "italic" ? "italic" : "normal",
                textDecorationLine: fmt.key === "underline" ? "underline" : "none",
                color: btnText,
                fontFamily: Platform.OS === "web" ? "Georgia, serif" : undefined,
              }}
            >
              {fmt.label}
            </Text>
          </Pressable>
        ))}
        <Text
          style={{
            marginLeft: 6,
            fontSize: 10,
            color: placeholderColor,
            letterSpacing: 0.5,
          }}
        >
          {value.length > 0 ? `${value.length} car.` : ""}
        </Text>
      </View>

      {/* Zone de texte */}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        multiline
        textAlignVertical="top"
        style={[
          {
            minHeight,
            paddingHorizontal: 18,
            paddingTop: 16,
            paddingBottom: 16,
            fontSize: 15,
            lineHeight: 26,
            color: textColor,
            backgroundColor: paperBg,
            fontFamily: Platform.OS === "web" ? "Georgia, serif" : undefined,
            /* Légère texture via un espacement des lettres */
            letterSpacing: 0.2,
          },
        ]}
        autoCorrect
        spellCheck
        scrollEnabled={false}
      />
    </View>
  );
}

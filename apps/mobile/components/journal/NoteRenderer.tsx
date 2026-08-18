import { Text } from "react-native";
import { useIsDark } from "@/lib/themeStore";
import { textSecondary } from "@/lib/themeClasses";

interface NoteRendererProps {
  content: string;
}

/* Fallback mobile : affiche le texte brut (les balises HTML restent visibles
   mais les notes saisies sur mobile sont toujours du texte brut). */
export function NoteRenderer({ content }: NoteRendererProps) {
  const isDark = useIsDark();
  const raw = content.replace(/<[^>]+>/g, "").trim();
  return (
    <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>{raw}</Text>
  );
}

import { Image, Pressable, Text, View } from "react-native";
import { PastekIcon } from "@/components/ui/ModuleIcon";
import { FIL_SOURCE_META, type FilEntry } from "@/lib/fil/types";
import { visualTags } from "@/lib/fil/tags";
import { FilTagChip } from "./FilTagChip";
import { useIsDark } from "@/lib/themeStore";

export function estimateFilTileHeight(entry: FilEntry): number {
  if (entry.metadata?.photoUri) {
    const n = entry.id.charCodeAt(0) % 3;
    return n === 0 ? 168 : n === 1 ? 220 : 268;
  }
  if (entry.metadata?.colors && entry.metadata.colors.length > 0) return 156;
  return 140;
}

interface FilVisualTileProps {
  entry: FilEntry;
  height: number;
  selected?: boolean;
  selectMode?: boolean;
  onPress: () => void;
}

export function FilVisualTile({
  entry,
  height,
  selected = false,
  selectMode = false,
  onPress,
}: FilVisualTileProps) {
  const isDark = useIsDark();
  const photo = entry.metadata?.photoUri;
  const colors = entry.metadata?.colors ?? [];
  const tags = visualTags(entry).slice(0, 4);
  const meta = FIL_SOURCE_META[entry.source];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        tags.length ? tags.join(", ") : entry.summary || "Trace du Fil"
      }
      className={`rounded-2xl overflow-hidden mb-2 ${
        selected ? "border-2 border-sage-500" : "border border-transparent"
      }`}
      style={{ height }}
    >
      {photo ? (
        <Image
          source={{ uri: photo }}
          className="absolute inset-0 w-full h-full"
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : colors.length > 0 ? (
        <View className="absolute inset-0 flex-row">
          {colors.slice(0, 4).map((hex) => (
            <View key={hex} className="flex-1" style={{ backgroundColor: hex }} />
          ))}
        </View>
      ) : (
        <View
          className={`absolute inset-0 items-center justify-center ${
            isDark ? "bg-sand-800" : "bg-sage-100"
          }`}
        >
          <PastekIcon id={meta.icon} boxSize={40} size={26} className="mb-0" />
        </View>
      )}

      <View className="absolute inset-0 bg-sand-900/15" />

      {selectMode ? (
        <View className="absolute top-2 right-2 rounded-full bg-sand-900/60 px-2 py-0.5">
          <Text className="text-white text-[10px] font-medium">
            {selected ? "●" : "○"}
          </Text>
        </View>
      ) : null}

      {tags.length > 0 ? (
        <View className="absolute bottom-0 left-0 right-0 p-2 flex-row flex-wrap gap-1">
          {tags.map((tag) => (
            <FilTagChip key={tag} label={tag} compact />
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

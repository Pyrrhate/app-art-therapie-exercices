import { Image, Pressable, Text, useWindowDimensions, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useResolvedPhotos } from "@/lib/journalPhotos";

interface PhotoGridProps {
  uris: string[];
  onPress: (uri: string) => void;
  editing?: boolean;
  onRemove?: (uri: string) => void;
}

export function PhotoGrid({ uris, onPress, editing = false, onRemove }: PhotoGridProps) {
  const { t } = useTranslation("journal");
  const { width } = useWindowDimensions();
  const resolved = useResolvedPhotos(uris);

  const items = uris.map((original, i) => ({
    original,
    display: resolved[i] ?? original,
  }));

  /* 2 colonnes seulement sur écrans larges (≥ 520px) et si plusieurs images */
  const useTwoCols = width >= 520 && items.length > 1;

  if (!useTwoCols) {
    return (
      <View className="gap-3">
        {items.map((item) => (
          <PhotoItem
            key={item.original}
            uri={item.display}
            onPress={() => onPress(item.display)}
            editing={editing}
            onRemove={onRemove ? () => onRemove(item.original) : undefined}
            t={t}
          />
        ))}
      </View>
    );
  }

  const col0 = items.filter((_, i) => i % 2 === 0);
  const col1 = items.filter((_, i) => i % 2 === 1);

  return (
    <View className="flex-row gap-3 items-start">
      <View className="flex-1 gap-3">
        {col0.map((item) => (
          <PhotoItem
            key={item.original}
            uri={item.display}
            onPress={() => onPress(item.display)}
            editing={editing}
            onRemove={onRemove ? () => onRemove(item.original) : undefined}
            t={t}
          />
        ))}
      </View>
      <View className="flex-1 gap-3">
        {col1.map((item) => (
          <PhotoItem
            key={item.original}
            uri={item.display}
            onPress={() => onPress(item.display)}
            editing={editing}
            onRemove={onRemove ? () => onRemove(item.original) : undefined}
            t={t}
          />
        ))}
      </View>
    </View>
  );
}

function PhotoItem({
  uri,
  onPress,
  editing,
  onRemove,
  t,
}: {
  uri: string;
  onPress: () => void;
  editing: boolean;
  onRemove?: () => void;
  t: (key: string) => string;
}) {
  return (
    <View className="relative">
      <Pressable
        onPress={onPress}
        accessibilityRole="imagebutton"
        accessibilityLabel={t("viewPhoto")}
      >
        <Image
          source={{ uri }}
          className="w-full rounded-xl bg-sand-200"
          style={{ aspectRatio: 4 / 3 }}
          resizeMode="cover"
        />
      </Pressable>
      {editing && onRemove ? (
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={t("removePhoto")}
          className="absolute top-2 right-2 rounded-full bg-black/55 px-3 py-1.5"
        >
          <Text className="text-white text-xs">{t("removePhoto")}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

import { Image, Pressable, Text, useWindowDimensions, View } from "react-native";
import { useTranslation } from "react-i18next";

interface PhotoGridProps {
  uris: string[];
  onPress: (uri: string) => void;
  editing?: boolean;
  onRemove?: (uri: string) => void;
}

export function PhotoGrid({ uris, onPress, editing = false, onRemove }: PhotoGridProps) {
  const { t } = useTranslation("journal");
  const { width } = useWindowDimensions();

  /* 2 colonnes seulement sur écrans larges (≥ 520px) et si plusieurs images */
  const useTwoCols = width >= 520 && uris.length > 1;

  if (!useTwoCols) {
    return (
      <View className="gap-3">
        {uris.map((uri) => (
          <PhotoItem
            key={uri}
            uri={uri}
            onPress={onPress}
            editing={editing}
            onRemove={onRemove}
            t={t}
          />
        ))}
      </View>
    );
  }

  /* Masonry 2 colonnes : on distribue en alternant selon l'index pour garder
     l'ordre de sélection lisible (colonne 0 = indices pairs, 1 = impairs). */
  const col0 = uris.filter((_, i) => i % 2 === 0);
  const col1 = uris.filter((_, i) => i % 2 === 1);

  return (
    <View className="flex-row gap-3 items-start">
      <View className="flex-1 gap-3">
        {col0.map((uri) => (
          <PhotoItem
            key={uri}
            uri={uri}
            onPress={onPress}
            editing={editing}
            onRemove={onRemove}
            t={t}
          />
        ))}
      </View>
      <View className="flex-1 gap-3">
        {col1.map((uri) => (
          <PhotoItem
            key={uri}
            uri={uri}
            onPress={onPress}
            editing={editing}
            onRemove={onRemove}
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
  onPress: (uri: string) => void;
  editing: boolean;
  onRemove?: (uri: string) => void;
  t: (key: string) => string;
}) {
  return (
    <View className="relative">
      <Pressable
        onPress={() => onPress(uri)}
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
          onPress={() => onRemove(uri)}
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

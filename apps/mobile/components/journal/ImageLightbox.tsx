import {
  Image,
  Modal,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

export function isRenderableImageUri(
  uri: string | undefined | null
): uri is string {
  if (!uri) return false;
  const value = uri.trim();
  return value.length > 0 && value !== "photo";
}

interface ImageLightboxProps {
  uris: string[];
  index: number;
  visible: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function ImageLightbox({
  uris,
  index,
  visible,
  onClose,
  onIndexChange,
}: ImageLightboxProps) {
  const { t } = useTranslation("journal");
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const uri = uris[index];
  const hasSeveral = uris.length > 1;

  if (!visible || !uri) return null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 bg-black">
        <View
          className="absolute left-0 right-0 z-10 flex-row items-center justify-between px-4"
          style={{ top: Math.max(insets.top, 12) }}
        >
          <Text className="text-white/80 text-sm">
            {hasSeveral
              ? t("photoCounter", { current: index + 1, total: uris.length })
              : ""}
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t("closePhoto")}
            className="rounded-full px-3 py-2 bg-white/15"
          >
            <Text className="text-white text-sm font-medium">{t("closePhoto")}</Text>
          </Pressable>
        </View>

        <View className="flex-1 items-center justify-center">
          <Image
            source={{ uri }}
            style={{
              width,
              height: Math.max(height - 96, 200),
            }}
            resizeMode="contain"
            accessibilityLabel={t("viewPhoto")}
          />
        </View>

        {hasSeveral ? (
          <View
            className="absolute left-0 right-0 flex-row justify-between px-3"
            style={{ bottom: Math.max(insets.bottom, 16) + 8 }}
          >
            <Pressable
              onPress={() =>
                onIndexChange((index - 1 + uris.length) % uris.length)
              }
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t("prevPhoto")}
              className="rounded-full px-4 py-3 bg-white/15"
            >
              <Text className="text-white text-lg">‹</Text>
            </Pressable>
            <Pressable
              onPress={() => onIndexChange((index + 1) % uris.length)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t("nextPhoto")}
              className="rounded-full px-4 py-3 bg-white/15"
            >
              <Text className="text-white text-lg">›</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

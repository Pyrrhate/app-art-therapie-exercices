import { Image, type ImageStyle, type StyleProp } from "react-native";

const PASTEK_LOGO_ICON = require("@/assets/brand/pastek-logo-icon.png");
const PASTEK_MASCOT = require("@/assets/brand/pastek-mascot.png");

type BrandImageProps = {
  size: number;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

export function PastekLogoIcon({
  size,
  style,
  accessibilityLabel = "Pastek Art",
}: BrandImageProps) {
  return (
    <Image
      source={PASTEK_LOGO_ICON}
      accessibilityLabel={accessibilityLabel}
      resizeMode="contain"
      style={[{ width: size, height: size }, style]}
    />
  );
}

export function PastekMascot({
  size,
  style,
  accessibilityLabel = "Mascotte Pastek Art",
}: BrandImageProps) {
  return (
    <Image
      source={PASTEK_MASCOT}
      accessibilityLabel={accessibilityLabel}
      resizeMode="contain"
      style={[{ width: size, height: size }, style]}
    />
  );
}

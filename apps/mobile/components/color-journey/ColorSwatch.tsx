import { View } from "react-native";

interface ColorSwatchProps {
  hex: string;
  size?: number;
  className?: string;
}

/** Pastille couleur — style inline pour un rendu fiable sur le web. */
export function ColorSwatch({ hex, size = 48, className = "" }: ColorSwatchProps) {
  return (
    <View
      className={`rounded-full border border-sand-200 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: hex,
        borderColor: "#D4C4B5",
      }}
    />
  );
}

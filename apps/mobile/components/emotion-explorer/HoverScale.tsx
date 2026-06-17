import type { ReactNode } from "react";
import { useState } from "react";
import {
  Platform,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

interface HoverScaleProps extends Omit<PressableProps, "style"> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  hoverScale?: number;
}

/** Légère mise à l'échelle au survol (web) ou à l'appui. */
export function HoverScale({
  children,
  style,
  hoverScale = 1.07,
  disabled,
  ...props
}: HoverScaleProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const active = !disabled && (hovered || pressed);
  const scale = active ? hoverScale : 1;

  return (
    <Pressable
      {...props}
      disabled={disabled}
      onHoverIn={
        Platform.OS === "web"
          ? (event) => {
              setHovered(true);
              props.onHoverIn?.(event);
            }
          : undefined
      }
      onHoverOut={
        Platform.OS === "web"
          ? (event) => {
              setHovered(false);
              props.onHoverOut?.(event);
            }
          : undefined
      }
      onPressIn={(event) => {
        setPressed(true);
        props.onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        props.onPressOut?.(event);
      }}
      style={[
        style,
        {
          transform: [{ scale }],
          ...(Platform.OS === "web"
            ? ({
                transitionProperty: "transform",
                transitionDuration: "180ms",
                transitionTimingFunction: "ease-out",
              } as ViewStyle)
            : null),
        },
      ]}
    >
      {children}
    </Pressable>
  );
}

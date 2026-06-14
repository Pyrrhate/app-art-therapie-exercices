import type { ReactNode } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  variant = "primary",
}: PrimaryButtonProps) {
  const variants = {
    primary: "bg-sage-500 active:bg-sage-600",
    secondary: "bg-clay-400 active:bg-clay-500",
    ghost: "bg-transparent border border-sand-300",
  };

  const textVariants = {
    primary: "text-white",
    secondary: "text-white",
    ghost: "text-sand-700",
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`rounded-2xl px-6 py-4 items-center ${variants[variant]} ${disabled ? "opacity-40" : ""}`}
    >
      <Text className={`text-base font-medium ${textVariants[variant]}`}>
        {label}
      </Text>
    </Pressable>
  );
}

interface ScreenContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  scrollable?: boolean;
}

export function ScreenContainer({
  children,
  title,
  subtitle,
  scrollable = true,
}: ScreenContainerProps) {
  const header = (
    <>
      {title && (
        <Text className="text-3xl font-light text-sand-800 mb-2">{title}</Text>
      )}
      {subtitle && (
        <Text className="text-base text-sand-500 mb-8 leading-6">
          {subtitle}
        </Text>
      )}
    </>
  );

  if (scrollable) {
    return (
      <ScrollView
        className="flex-1 bg-sand-50"
        style={Platform.OS === "web" ? { flex: 1, height: "100%" } : undefined}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 64,
          paddingBottom: 32,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={Platform.OS === "web"}
        nestedScrollEnabled
      >
        {header}
        {children}
      </ScrollView>
    );
  }

  return (
    <View
      className="flex-1 bg-sand-50 px-6 pt-16 pb-8"
      style={Platform.OS === "web" ? { flex: 1, height: "100%" } : undefined}
    >
      {header}
      {children}
    </View>
  );
}

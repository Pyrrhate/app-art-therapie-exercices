import { Pressable, Text, View } from "react-native";

type NoticeType = "error" | "success" | "info";

interface InlineNoticeProps {
  type: NoticeType;
  message: string;
  onDismiss?: () => void;
}

const styles: Record<NoticeType, { box: string; text: string }> = {
  error: { box: "bg-red-50 border-red-200", text: "text-red-700" },
  success: { box: "bg-sage-50 border-sage-200", text: "text-sage-700" },
  info: { box: "bg-sand-100 border-sand-200", text: "text-sand-700" },
};

export function InlineNotice({ type, message, onDismiss }: InlineNoticeProps) {
  const style = styles[type];

  return (
    <View
      className={`rounded-2xl border px-4 py-3 mb-4 flex-row items-start gap-3 ${style.box}`}
    >
      <Text className={`flex-1 text-sm leading-5 ${style.text}`}>{message}</Text>
      {onDismiss && (
        <Pressable onPress={onDismiss} hitSlop={8}>
          <Text className={`text-sm font-medium ${style.text}`}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

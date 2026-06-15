import { useEffect, useState } from "react";
import { Text, View } from "react-native";

interface ProgressiveReflectionProps {
  reflection: string;
  /** Délai entre paragraphes (ms) */
  staggerMs?: number;
}

export function ProgressiveReflection({
  reflection,
  staggerMs = 700,
}: ProgressiveReflectionProps) {
  const paragraphs = reflection.split(/\n\s*\n/).filter((p) => p.trim());
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
    if (paragraphs.length === 0) return;

    setVisibleCount(1);
    if (paragraphs.length === 1) return;

    let current = 1;
    const timer = setInterval(() => {
      current += 1;
      setVisibleCount(current);
      if (current >= paragraphs.length) {
        clearInterval(timer);
      }
    }, staggerMs);

    return () => clearInterval(timer);
  }, [reflection, staggerMs, paragraphs.length]);

  const shown =
    paragraphs.length > 1
      ? paragraphs.slice(0, visibleCount)
      : [reflection];

  return (
    <View>
      {shown.map((paragraph, index) => (
        <Text
          key={`${index}-${paragraph.slice(0, 12)}`}
          className={`text-sand-700 text-base leading-7 ${
            index < shown.length - 1 ? "mb-4" : "mb-4"
          }`}
        >
          {paragraph}
        </Text>
      ))}
      {visibleCount < paragraphs.length && (
        <Text className="text-sand-400 text-sm italic">
          La réflexion continue de se déployer…
        </Text>
      )}
    </View>
  );
}

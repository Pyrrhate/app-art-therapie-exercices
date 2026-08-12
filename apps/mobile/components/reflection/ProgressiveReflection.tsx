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
  const paragraphs = reflection
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const [visibleCount, setVisibleCount] = useState(() =>
    paragraphs.length > 0 ? 1 : 0
  );

  useEffect(() => {
    if (paragraphs.length === 0) {
      setVisibleCount(0);
      return;
    }

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
    // reflection est la source de vérité ; paragraphs.length suit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reflection, staggerMs]);

  if (!reflection.trim()) {
    return null;
  }

  const shown =
    paragraphs.length > 1
      ? paragraphs.slice(0, Math.max(visibleCount, 1))
      : paragraphs.length === 1
        ? paragraphs
        : [reflection.trim()];

  return (
    <View>
      {shown.map((paragraph, index) => (
        <Text
          key={`${index}-${paragraph.slice(0, 24)}`}
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

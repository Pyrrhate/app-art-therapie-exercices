import { Image, Platform, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { SemanticWeb } from "@/components/landing/SemanticWeb";
import { ROUTES } from "@/lib/routes";
import type { ExampleStep, PastekExample } from "@/lib/examples/types";

const ctaShadow =
  Platform.OS === "web"
    ? ({ boxShadow: "0 10px 32px -14px rgba(73, 99, 73, 0.55)" } as const)
    : undefined;

function Chips({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <View className="flex-row flex-wrap gap-2 mt-4">
      {items.map((chip) => (
        <View
          key={chip}
          className={`rounded-full px-3 py-1.5 ${
            chip.toLowerCase().startsWith("technique")
              ? "bg-clay-100 border border-clay-200"
              : "bg-sage-500"
          }`}
        >
          <Text
            className={`text-xs font-medium ${
              chip.toLowerCase().startsWith("technique")
                ? "text-clay-800"
                : "text-white"
            }`}
          >
            {chip}
          </Text>
        </View>
      ))}
    </View>
  );
}

function StepBlock({
  step,
  impulse,
}: {
  step: ExampleStep;
  impulse?: string;
}) {
  const { t } = useTranslation("examples");

  const bodyLabel =
    step.id === "impulsion"
      ? t("detail.impulseCaptured")
      : step.id === "exercice"
        ? t("detail.impulseWith", { impulse: impulse ?? "" })
        : t("detail.mirrorLabel");

  return (
    <SemanticWeb
      tag="section"
      className="border-b border-sand-200/80 py-10"
      aria-label={step.title}
    >
      <SemanticWeb tag="h2" className="font-display text-2xl text-sand-900 mb-3">
        {step.title}
      </SemanticWeb>
      <SemanticWeb tag="p" className="text-sand-600 text-base leading-7 mb-4">
        {step.intro}
      </SemanticWeb>

      {step.chips ? <Chips items={step.chips} /> : null}

      {step.body ? (
        <View className="bg-white rounded-2xl border border-sand-200 px-5 py-5 mt-5">
          <Text className="text-sand-400 text-xs uppercase tracking-wider mb-3">
            {bodyLabel}
          </Text>
          <SemanticWeb tag="p" className="text-sand-700 text-sm leading-7 whitespace-pre-line">
            {step.body}
          </SemanticWeb>
        </View>
      ) : null}

      {step.image ? (
        <View className="mt-5 rounded-2xl overflow-hidden border border-sand-200 bg-white">
          <Image
            source={step.image}
            accessibilityLabel={step.imageAlt ?? ""}
            resizeMode="contain"
            style={{ width: "100%", height: 360, backgroundColor: "#FAF7F4" }}
          />
          {step.imageAlt ? (
            <Text className="text-sand-500 text-xs leading-5 px-4 py-3 border-t border-sand-100">
              {step.imageAlt}
            </Text>
          ) : null}
        </View>
      ) : null}

      {step.openQuestions && step.openQuestions.length > 0 ? (
        <View className="bg-sage-50 rounded-2xl border border-sage-100 px-5 py-5 mt-5">
          <Text className="text-sage-700 text-xs uppercase tracking-wider mb-3">
            {t("detail.questionsLabel")}
          </Text>
          {step.openQuestions.map((q) => (
            <Text key={q} className="text-sand-700 text-sm leading-6 mb-2">
              · {q}
            </Text>
          ))}
        </View>
      ) : null}

      {step.followUpExercise ? (
        <View className="bg-white rounded-2xl border border-sage-200 px-5 py-5 mt-4">
          <Text className="text-sage-600 text-xs uppercase tracking-wider mb-2">
            {t("detail.followUpLabel")}
          </Text>
          <Text className="text-sand-700 text-sm font-medium mb-2">
            {t("detail.followUpTitle")}
          </Text>
          <SemanticWeb tag="p" className="text-sand-600 text-sm leading-6">
            {step.followUpExercise}
          </SemanticWeb>
        </View>
      ) : null}
    </SemanticWeb>
  );
}

interface ExampleDetailPageProps {
  example: PastekExample;
}

export function ExampleDetailPage({ example }: ExampleDetailPageProps) {
  const { t } = useTranslation("examples");
  const modeLabel =
    example.experienceMode === "express"
      ? t("detail.modeExpress")
      : t("detail.modeDeep");

  return (
    <View className="max-w-3xl mx-auto px-6 pb-16">
      <SemanticWeb tag="article">
        <Text className="text-sage-500 text-xs uppercase tracking-[0.2em] mb-3 font-medium">
          {t("detail.eyebrow", { technique: example.technique })}
        </Text>
        <SemanticWeb tag="h1" className="font-display text-3xl md:text-4xl text-sand-900 mb-4 leading-tight">
          {example.title}
        </SemanticWeb>
        <SemanticWeb tag="p" className="text-sand-600 text-lg leading-8 mb-6">
          {example.subtitle}
        </SemanticWeb>

        <View className="flex-row flex-wrap gap-3 mb-8">
          <Text className="text-sand-500 text-sm">
            {t("detail.meta", {
              minutes: example.durationMinutes,
              mode: modeLabel,
            })}
          </Text>
        </View>

        {example.heroImage ? (
          <View className="rounded-2xl overflow-hidden border border-sand-200 mb-10">
            <Image
              source={example.heroImage}
              accessibilityLabel={example.heroImageAlt ?? example.title}
              resizeMode="cover"
              style={{ width: "100%", height: 280 }}
            />
          </View>
        ) : null}

        {example.steps.map((step) => (
          <StepBlock key={step.id} step={step} impulse={example.impulse} />
        ))}

        <SemanticWeb tag="section" className="py-10">
          <SemanticWeb tag="p" className="text-sand-700 text-base leading-8 mb-8">
            {example.outro}
          </SemanticWeb>
          <Link href={ROUTES.home} asChild>
            <Pressable
              accessibilityRole="button"
              className="self-start rounded-full bg-sage-500 active:bg-sage-600 px-8 py-4 min-h-[52px] justify-center"
              style={ctaShadow}
            >
              <Text className="text-white text-sm font-semibold tracking-wide">
                {t("detail.cta")}
              </Text>
            </Pressable>
          </Link>
        </SemanticWeb>
      </SemanticWeb>
    </View>
  );
}

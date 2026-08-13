import { Platform, ScrollView, Text, View } from "react-native";
import Head from "expo-router/head";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { SemanticWeb } from "@/components/landing/SemanticWeb";
import { ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { getChangelog } from "@/lib/changelog";
import { useLanguageStore } from "@/lib/i18n/languageStore";
import { navigateSiteHome } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

const CANONICAL = "https://pastek-art.eu/maj";

function ChangelogList() {
  const isDark = useIsDark();
  const { t } = useTranslation("legal");
  const language = useLanguageStore((s) => s.language);
  const changelog = getChangelog(language);

  return (
    <View className="gap-4">
      {changelog.map((entry, index) => (
        <View
          key={entry.id}
          className={`rounded-2xl border px-5 py-5 ${
            isDark
              ? "border-sand-700 bg-sand-900/40"
              : "border-sand-200 bg-white"
          }`}
        >
          <View className="flex-row items-start justify-between gap-3 mb-3">
            <Text
              className={`font-display text-lg leading-6 flex-1 ${textPrimary(isDark)}`}
            >
              {entry.title}
            </Text>
            {index === 0 ? (
              <View className="bg-sage-100 rounded-full px-2.5 py-1 shrink-0">
                <Text className="text-sage-700 text-[10px] font-semibold uppercase tracking-wider">
                  {t("updates.recent")}
                </Text>
              </View>
            ) : null}
          </View>

          <Text
            className={`text-xs uppercase tracking-wider mb-3 ${textMuted(isDark)}`}
          >
            {entry.dateLabel}
          </Text>

          <View className="gap-2">
            {entry.highlights.map((line) => (
              <View key={line} className="flex-row gap-2">
                <Text className={`text-sm leading-5 ${textMuted(isDark)}`}>
                  ·
                </Text>
                <Text
                  className={`text-sm leading-6 flex-1 ${textSecondary(isDark)}`}
                >
                  {line}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function MajContent({ showAppLink }: { showAppLink?: boolean }) {
  const isDark = useIsDark();
  const { t } = useTranslation("legal");

  return (
    <View className="gap-8">
      <View className="gap-3">
        <Text className="text-sage-600 text-xs uppercase tracking-wider font-medium">
          {t("updates.label")}
        </Text>
        <Text
          className={`font-display text-3xl leading-tight ${textPrimary(isDark)}`}
        >
          {t("updates.title")}
          <Text className="text-sage-600">{t("updates.titleAccent")}</Text>
        </Text>
        <Text className={`text-base leading-7 ${textSecondary(isDark)}`}>
          {t("updates.description")}
        </Text>
        {showAppLink ? (
          <Link href={ROUTES.home}>
            <Text className="text-sage-600 text-sm underline mt-1">
              {t("updates.openApp")}
            </Text>
          </Link>
        ) : null}
      </View>

      <ChangelogList />

      <Text className={`text-xs text-center leading-5 pb-4 ${textMuted(isDark)}`}>
        {t("updates.footer")}
      </Text>
    </View>
  );
}

export default function MajPage() {
  const { t } = useTranslation(["legal", "app"]);
  const seoTitle = t("legal:updates.seoTitle");
  const seoDescription = t("legal:updates.seoDescription");

  if (Platform.OS !== "web") {
    return (
      <ScreenContainer scrollable compactTop>
        <ScreenNavBar
          backLabel={t("app:nav.backHome")}
          onBack={navigateSiteHome}
          showHome={false}
        />
        <MajContent />
      </ScreenContainer>
    );
  }

  return (
    <>
      <Head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={CANONICAL} />
      </Head>
      <View className="flex-1 bg-sand-50">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator
        >
          <LandingHeader activeHref={ROUTES.changelog} />
          <SemanticWeb tag="main" className="max-w-3xl mx-auto px-6 py-10">
            <MajContent showAppLink />
          </SemanticWeb>
          <LandingFooter />
        </ScrollView>
      </View>
    </>
  );
}

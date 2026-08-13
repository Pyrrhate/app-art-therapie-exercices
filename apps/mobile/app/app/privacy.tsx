import type { ReactNode } from "react";

import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";

const CONTACT_EMAIL = "contact@pastek-art.eu";

export default function PrivacyScreen() {
  const { t } = useTranslation("legal");

  return (
    <ScreenContainer scrollable refreshable compactTop>
      <ScreenNavBar />

      <PastekScreenHero
        label={t("privacy.heroLabel")}
        title={t("privacy.heroTitle")}
        accent={t("privacy.heroAccent")}
        description={t("privacy.heroDescription")}
        className="mb-8"
      />

      <Section title={t("privacy.publisherTitle")}>
        <P>{t("privacy.publisherBody", { email: CONTACT_EMAIL })}</P>
      </Section>

      <Section title={t("privacy.dataTitle")}>
        <P>{t("privacy.dataBody1")}</P>
        <P>{t("privacy.dataBody2")}</P>
        <P>{t("privacy.dataBody3")}</P>
      </Section>

      <Section title={t("privacy.purposeTitle")}>
        <P>{t("privacy.purposeBody")}</P>
      </Section>

      <Section title={t("privacy.legalBasisTitle")}>
        <P>{t("privacy.legalBasisBody")}</P>
      </Section>

      <Section title={t("privacy.rightsTitle")}>
        <P>{t("privacy.rightsBody", { email: CONTACT_EMAIL })}</P>
      </Section>

      <Section title={t("privacy.processorsTitle")}>
        <P>{t("privacy.processorsBody")}</P>
      </Section>

      <Section title={t("privacy.cookiesTitle")}>
        <P>{t("privacy.cookiesBody")}</P>
      </Section>

      <Text className="text-sand-400 text-xs text-center leading-5 pb-8">
        {t("privacy.footer")}
      </Text>
    </ScreenContainer>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View className="bg-white rounded-2xl border border-sand-200 px-5 py-5 mb-4">
      <Text className="text-sand-800 font-medium text-base mb-3">{title}</Text>
      {children}
    </View>
  );
}

function P({ children }: { children: ReactNode }) {
  return (
    <Text className="text-sand-600 text-sm leading-6 mb-3 last:mb-0">
      {children}
    </Text>
  );
}

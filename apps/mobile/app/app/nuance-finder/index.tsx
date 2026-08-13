import { useTranslation } from "react-i18next";
import { NuanceFinder } from "@/components/nuance-finder/NuanceFinder";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { navigateHome } from "@/lib/navigation";

export default function NuanceFinderScreen() {
  const { t } = useTranslation("amorces");

  return (
    <ScreenContainer scrollable refreshable contentMaxWidth={720} compactTop>
      <ScreenNavBar backLabel={t("nav.back")} onBack={navigateHome} />

      <PastekScreenHero
        label={t("nuanceFinder.heroLabel")}
        title={t("nuanceFinder.heroTitle")}
        accent={t("nuanceFinder.heroAccent")}
        description={t("nuanceFinder.heroDescription")}
        className="mb-8"
      />

      <NuanceFinder />
    </ScreenContainer>
  );
}

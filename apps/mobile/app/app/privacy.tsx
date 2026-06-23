import type { ReactNode } from "react";

import { Text, View } from "react-native";

import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";

const CONTACT_EMAIL = "contact@pastek-art.eu";

export default function PrivacyScreen() {
  return (
    <ScreenContainer scrollable refreshable compactTop>
      <ScreenNavBar />

      <PastekScreenHero
        label="Confidentialité"
        title="Mentions légales & "
        accent="confidentialité"
        description="Dernière mise à jour : juin 2026"
        className="mb-8"
      />

      <Section title="Éditeur">
        <P>
          Application « Pastek Art » — rituel créatif guidé. Éditeur : Guillot
          / Pastek Art. Contact : {CONTACT_EMAIL}.
        </P>
      </Section>

      <Section title="Données collectées">
        <P>
          Aucun compte utilisateur n'est requis. Vos rituels (impulsion,
          technique, exercice, photo, réflexion) et vos amorces sont
          enregistrés automatiquement dans le Fil créatif, localement sur
          votre appareil via AsyncStorage.
        </P>
        <P>
          Vous pouvez exporter et restaurer votre Fil créatif depuis les
          paramètres : le fichier reste chez vous (Drive, mail, etc.) et n'est
          jamais envoyé à nos serveurs.
        </P>
        <P>
          Lorsque vous demandez une réflexion IA, votre photo est compressée
          puis envoyée à notre serveur API (Vercel), qui la transmet à Hugging
          Face pour analyse. Elle n'est pas conservée côté serveur après
          traitement. Les amorces sans IA (palette, émotions, nuances) ne
          envoient aucune donnée au serveur.
        </P>
      </Section>

      <Section title="Finalités">
        <P>
          Génération d'exercices créatifs et analyse bienveillante de votre
          œuvre. Aucune revente de données, aucun profilage publicitaire.
        </P>
      </Section>

      <Section title="Base légale (RGPD)">
        <P>
          Intérêt légitime et exécution du service demandé par
          l'utilisateur·rice. Vous pouvez utiliser l'application sans envoyer
          de photo à l'IA.
        </P>
      </Section>

      <Section title="Vos droits">
        <P>
          Accès, rectification, effacement : retirez vos traces dans le Fil
          créatif, utilisez « Tout effacer sur cet appareil » dans les
          paramètres, ou désinstallez l&apos;app. Pour toute question :{" "}
          {CONTACT_EMAIL}.
        </P>
      </Section>

      <Section title="Sous-traitants">
        <P>
          Hébergement API : Vercel (vercel.com/legal/privacy-policy). Modèles
          IA : Hugging Face (huggingface.co/privacy) — inférence uniquement,
          sans entraînement sur vos contenus via cette application. Les clés
          API restent côté serveur.
        </P>
      </Section>

      <Section title="Cookies & web">
        <P>
          L'application web ne dépose pas de cookies publicitaires. Seul le
          stockage local du navigateur peut être utilisé pour le Fil créatif
          et les préférences.
        </P>
      </Section>

      <Text className="text-sand-400 text-xs text-center leading-5 pb-8">
        Politique de confidentialité simplifiée — juin 2026.
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

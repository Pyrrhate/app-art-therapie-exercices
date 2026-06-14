import type { ReactNode } from "react";

import { Text, View } from "react-native";

import { router } from "expo-router";

import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";



const CONTACT_EMAIL = "contact@pastek-art.eu";



export default function PrivacyScreen() {

  return (

    <ScreenContainer scrollable>

      <PrimaryButton

        label="← Retour"

        onPress={() => router.back()}

        variant="ghost"

      />



      <Text className="text-3xl font-light text-sand-800 mb-2 mt-6">

        Mentions légales & confidentialité

      </Text>

      <Text className="text-sand-400 text-xs mb-8">

        Dernière mise à jour : juin 2026

      </Text>



      <Section title="Éditeur">

        <P>

          Application « Art Thérapie » — rituel créatif guidé. Éditeur :

          Pastek Art (placeholder). Contact : {CONTACT_EMAIL}.

        </P>

      </Section>



      <Section title="Données collectées">

        <P>

          Aucun compte utilisateur n'est requis. Les sessions (impulsion,

          technique, exercice, photo, réflexion) sont enregistrées localement

          sur votre appareil via AsyncStorage, uniquement si vous choisissez

          « Sauvegarder localement ».

        </P>

        <P>

          Lorsque vous demandez une réflexion IA, votre photo est compressée

          puis envoyée à notre serveur API pour analyse. Elle n'est pas

          conservée côté serveur après traitement.

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

          Accès, rectification, effacement : supprimez vos sessions dans

          l'application ou désinstallez l'app. Pour toute question :

          {CONTACT_EMAIL}.

        </P>

      </Section>



      <Section title="Sous-traitants">

        <P>

          Hébergement API (Vercel) et modèles IA (Hugging Face), selon leurs

          propres conditions. Les clés API restent côté serveur.

        </P>

      </Section>



      <Section title="Cookies & web">

        <P>

          L'application web ne dépose pas de cookies publicitaires. Seul le

          stockage local du navigateur peut être utilisé pour les sessions

          sauvegardées.

        </P>

      </Section>



      <Text className="text-sand-400 text-xs text-center leading-5 pb-8">

        Cette page constitue une politique de confidentialité simplifiée pour un

        MVP. Adaptez les coordonnées éditeur avant publication officielle.

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



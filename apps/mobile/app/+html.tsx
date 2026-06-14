import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr" style={{ height: "100%" }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta
          name="description"
          content="Art Thérapie — rituels créatifs guidés par l'IA, en douceur."
        />
        <title>Art Thérapie</title>
        <ScrollViewStyleReset />
      </head>
      <body style={{ height: "100%", margin: 0, backgroundColor: "#FAF7F4" }}>
        {children}
      </body>
    </html>
  );
}

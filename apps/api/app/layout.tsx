import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Art Thérapie API",
  description: "Backend serverless pour l'application Art Thérapie",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

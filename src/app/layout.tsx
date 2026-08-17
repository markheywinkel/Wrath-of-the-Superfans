import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wrath of the Superfans",
  description:
    "Ein 8-Bit-Rollenspiel: Kämpfe auf der Star-Trek-Convention um den Titel des ultimativen Superfans.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
